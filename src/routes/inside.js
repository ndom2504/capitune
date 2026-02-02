import express from 'express';
import { authenticate } from '../middleware/auth.js';
import ContactRequest from '../models/ContactRequest.js';
import DirectMessage from '../models/DirectMessage.js';
import MessageThread from '../models/MessageThread.js';
import User from '../models/User.js';
import {
  canSendContactRequest,
  getInsideSettings,
  canMessage,
  detectSpamPatterns,
  enrichContactRequest,
  getInsideStats,
  getCreatorLevel,
  INSIDE_LIMITS
} from '../utils/insideHelper.js';
import { createNotification, NotificationPresets } from '../utils/notificationHelper.js';

const router = express.Router();

// ==================== DEMANDES DE CONTACT ====================

/**
 * Envoyer une demande de contact
 * POST /api/inside/requests
 */
router.post('/requests', authenticate, async (req, res) => {
  try {
    const { toUserId, intention, message } = req.body;

    if (!toUserId || !intention || !message) {
      return res.status(400).json({
        message: 'Paramètres manquants: toUserId, intention, message'
      });
    }

    // Vérifier que l'intention est valide
    if (!['discussion', 'collaboration', 'partnership', 'question'].includes(intention)) {
      return res.status(400).json({ message: 'Intention non valide' });
    }

    // Vérifier que le message ne dépasse pas 280 caractères
    if (message.length > 280) {
      return res.status(400).json({
        message: 'Message trop long (280 caractères max)'
      });
    }

    // Vérifier qu'on n'envoie pas à soi-même
    if (toUserId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous envoyer de demande' });
    }

    // Vérifier les permissions
    const canSend = await canSendContactRequest(req.user._id);
    if (!canSend.allowed) {
      return res.status(403).json({
        message: canSend.reason,
        nextResetTime: canSend.nextResetTime
      });
    }

    // Vérifier que le destinataire existe
    const toUser = await User.findById(toUserId);
    if (!toUser) {
      return res.status(404).json({ message: 'Utilisateur destinataire non trouvé' });
    }

    // Vérifier les paramètres Inside du destinataire
    const permissionCheck = await canMessage(req.user._id, toUserId);
    if (!permissionCheck.allowed) {
      return res.status(403).json({ message: permissionCheck.reason });
    }

    // Détecte le spam
    const spamDetection = await detectSpamPatterns(req.user._id, toUserId);
    if (spamDetection.flagAsSpam) {
      return res.status(429).json({
        message: 'Comportement de spam détecté. Réessayez plus tard.',
        details: {
          recentRequests: spamDetection.recentRequestCount,
          isSpamming: spamDetection.isSpamming
        }
      });
    }

    // Créer la demande
    const senderLevel = getCreatorLevel(req.user.followers?.length || 0);

    const contactRequest = new ContactRequest({
      from: req.user._id,
      to: toUserId,
      intention,
      message,
      senderLevel,
      status: 'pending'
    });

    await contactRequest.save();

    // Créer une notification pour le destinataire
    await createNotification({
      ...NotificationPresets.contactRequest(
        toUserId,
        req.user._id,
        req.user.username
      ),
      notificationData: {
        requestId: contactRequest._id,
        intention: contactRequest.intention
      }
    });

    res.status(201).json({
      message: 'Demande envoyée',
      request: {
        _id: contactRequest._id,
        intention: contactRequest.intention,
        status: contactRequest.status,
        createdAt: contactRequest.createdAt,
        expiresAt: contactRequest.expiresAt,
        senderLevel
      }
    });
  } catch (error) {
    console.error('Erreur envoi demande:', error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi de la demande' });
  }
});

/**
 * Obtenir toutes les demandes reçues
 * GET /api/inside/requests?status=pending
 */
router.get('/requests', authenticate, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;

    const query = { to: req.user._id };
    if (status && ['pending', 'accepted', 'declined'].includes(status)) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [requests, total] = await Promise.all([
      ContactRequest.find(query)
        .populate('from', 'username avatar followers stats badges fullName displayName profile settings')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ContactRequest.countDocuments(query)
    ]);

    // Enrichir avec infos du demandeur
    const enriched = await Promise.all(
      requests.map(async (r) => {
        const enrichedRequest = r.toObject();
        const fullName = r.from.fullName
          || r.from.profile?.fullName
          || r.from.settings?.fullName
          || r.from.displayName
          || r.from.profile?.displayName
          || r.from.settings?.displayName;

        enrichedRequest.senderProfile = {
          id: r.from._id,
          username: r.from.username,
          fullName: fullName,
          displayName: fullName || r.from.username,
          avatar: r.from.avatar,
          followers: r.from.followers?.length || 0,
          badges: r.from.badges || [],
          level: getCreatorLevel(r.from.followers?.length || 0)
        };
        return enrichedRequest;
      })
    );

    res.json({
      message: `Demandes de contact (${status})`,
      requests: enriched,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur récupération demandes:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération' });
  }
});

/**
 * Accepter une demande de contact
 * POST /api/inside/requests/:requestId/accept
 */
router.post('/requests/:requestId/accept', authenticate, async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await ContactRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }

    // Vérifier que c'est bien pour nous
    if (!request.to.equals(req.user._id)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Vérifier que ce n'est pas déjà acceptée
    if (request.status !== 'pending') {
      return res.status(400).json({
        message: `Demande déjà ${request.status}`
      });
    }

    // Créer le thread de conversation
    const thread = new MessageThread({
      participants: [request.from, request.to],
      initiator: request.from,
      type: request.intention === 'partnership' ? 'partnership' : 'direct'
    });
    await thread.save();

    // Mettre à jour la demande
    request.status = 'accepted';
    request.threadId = thread._id;
    await request.save();

    // Créer un message système
    const systemMessage = new DirectMessage({
      threadId: thread._id,
      sender: req.user._id,
      content: `Conversation démarrée - Intention: ${request.intention}`,
      type: 'system',
      isSystemMessage: true,
      systemType: 'request_accepted'
    });
    await systemMessage.save();

    thread.messageCount = 1;
    await thread.save();

    // Créer une notification pour l'expéditeur
    await createNotification({
      ...NotificationPresets.contactAccepted(
        request.from,
        req.user._id,
        req.user.username
      ),
      notificationData: {
        threadId: thread._id
      }
    });

    res.json({
      message: 'Demande acceptée',
      thread: {
        _id: thread._id,
        participants: thread.participants,
        type: thread.type,
        createdAt: thread.createdAt
      }
    });
  } catch (error) {
    console.error('Erreur acceptation demande:', error);
    res.status(500).json({ message: 'Erreur lors de l\'acceptation' });
  }
});

/**
 * Refuser une demande de contact
 * POST /api/inside/requests/:requestId/decline
 */
router.post('/requests/:requestId/decline', authenticate, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body; // Optionnel

    const request = await ContactRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }

    if (!request.to.equals(req.user._id)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        message: `Demande déjà ${request.status}`
      });
    }

    request.status = 'declined';
    request.declinedAt = new Date();
    request.declinedReason = reason || null;
    await request.save();

    res.json({
      message: 'Demande refusée'
    });
  } catch (error) {
    console.error('Erreur refus demande:', error);
    res.status(500).json({ message: 'Erreur lors du refus' });
  }
});

/**
 * Bloquer un utilisateur
 * POST /api/inside/requests/:requestId/block
 */
router.post('/requests/:requestId/block', authenticate, async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await ContactRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }

    if (!request.to.equals(req.user._id)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Marquer comme bloqué
    request.status = 'blocked';
    request.blockedAt = new Date();
    await request.save();

    // Ajouter aux utilisateurs bloqués
    const user = await User.findById(req.user._id);
    if (!user.insideSettings) user.insideSettings = {};
    if (!user.insideSettings.blockedUsers) user.insideSettings.blockedUsers = [];

    if (!user.insideSettings.blockedUsers.includes(request.from)) {
      user.insideSettings.blockedUsers.push(request.from);
      await user.save();
    }

    res.json({
      message: 'Utilisateur bloqué'
    });
  } catch (error) {
    console.error('Erreur blocage:', error);
    res.status(500).json({ message: 'Erreur lors du blocage' });
  }
});

// ==================== CONVERSATIONS & MESSAGES ====================

/**
 * Obtenir tous les threads de messages (inbox)
 * GET /api/inside/conversations
 */
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const threads = await MessageThread.find({
      participants: req.user._id
    })
      .populate('participants', 'username avatar')
      .populate('lastMessageSenderId', 'username')
      .sort({ lastActivityAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MessageThread.countDocuments({
      participants: req.user._id
    });

    // Ajouter l'info de lecture
    const threadsWithStatus = threads.map(t => {
      const readInfo = t.readBy?.find(r => r.userId.equals(req.user._id));
      const unread = t.lastMessageAt && (!readInfo || readInfo.readAt < t.lastMessageAt);

      return {
        ...t.toObject(),
        unread,
        lastReadAt: readInfo?.readAt
      };
    });

    res.json({
      message: 'Conversations',
      conversations: threadsWithStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur récupération conversations:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération' });
  }
});

/**
 * Obtenir les messages d'une conversation
 * GET /api/inside/conversations/:threadId/messages
 */
router.get('/conversations/:threadId/messages', authenticate, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { page = 1, limit = 30 } = req.query;

    const thread = await MessageThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }

    // Vérifier qu'on est participant
    if (!thread.participants.map(p => p.toString()).includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [messages, total] = await Promise.all([
      DirectMessage.find({ threadId })
        .populate('sender', 'username avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      DirectMessage.countDocuments({ threadId })
    ]);

    // Marquer comme lu
    const readInfo = thread.readBy?.find(r => r.userId.equals(req.user._id));
    if (!readInfo) {
      thread.readBy = thread.readBy || [];
      thread.readBy.push({ userId: req.user._id, readAt: new Date() });
    } else {
      readInfo.readAt = new Date();
    }
    await thread.save();

    res.json({
      message: 'Messages de la conversation',
      messages: messages.reverse(), // Ordre chrono
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur récupération messages:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération' });
  }
});

/**
 * Envoyer un message
 * POST /api/inside/conversations/:threadId/messages
 */
router.post('/conversations/:threadId/messages', authenticate, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Le message ne peut pas être vide' });
    }

    if (content.length > 5000) {
      return res.status(400).json({ message: 'Message trop long (5000 caractères max)' });
    }

    const thread = await MessageThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }

    // Vérifier qu'on est participant
    if (!thread.participants.map(p => p.toString()).includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Vérifier si pas bloqué
    const otherParticipant = thread.participants.find(p => !p.equals(req.user._id));
    const otherUser = await User.findById(otherParticipant);
    if (otherUser?.insideSettings?.blockedUsers?.includes(req.user._id)) {
      return res.status(403).json({
        message: 'Vous avez été bloqué par cet utilisateur'
      });
    }

    // Créer le message
    const message = new DirectMessage({
      threadId,
      sender: req.user._id,
      content,
      type: 'text'
    });
    await message.save();

    // Mettre à jour le thread
    thread.lastMessage = content.substring(0, 100);
    thread.lastMessageAt = new Date();
    thread.lastMessageSenderId = req.user._id;
    thread.messageCount = (thread.messageCount || 0) + 1;
    thread.lastActivityAt = new Date();
    await thread.save();

    // Créer une notification pour l'autre participant
    const otherParticipantId = thread.participants.find(p => !p.equals(req.user._id));
    await createNotification({
      ...NotificationPresets.newMessage(
        otherParticipantId,
        req.user._id,
        req.user.username,
        content
      ),
      notificationData: {
        threadId: thread._id,
        messageId: message._id
      }
    });

    res.status(201).json({
      message: 'Message envoyé',
      data: {
        _id: message._id,
        content: message.content,
        sender: req.user.username,
        createdAt: message.createdAt
      }
    });
  } catch (error) {
    console.error('Erreur envoi message:', error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi du message' });
  }
});

// ==================== PARAMÈTRES INSIDE ====================

/**
 * Obtenir les paramètres Inside
 * GET /api/inside/settings
 */
router.get('/settings', authenticate, async (req, res) => {
  try {
    const settings = await getInsideSettings(req.user._id);

    res.json({
      message: 'Paramètres Inside',
      settings
    });
  } catch (error) {
    console.error('Erreur récupération settings:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération' });
  }
});

/**
 * Mettre à jour les paramètres Inside
 * PUT /api/inside/settings
 */
router.put('/settings', authenticate, async (req, res) => {
  try {
    const {
      allowDirectMessages,
      allowPartnershipOnly,
      allowedIntentions,
      paidMessagesEnabled,
      paidMessagePrice
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user.insideSettings) {
      user.insideSettings = {};
    }

    // Valider et mettre à jour
    if (allowDirectMessages !== undefined) {
      user.insideSettings.allowDirectMessages = allowDirectMessages;
    }
    if (allowPartnershipOnly !== undefined) {
      user.insideSettings.allowPartnershipOnly = allowPartnershipOnly;
    }
    if (allowedIntentions) {
      user.insideSettings.allowedIntentions = allowedIntentions.filter(i =>
        ['discussion', 'collaboration', 'partnership', 'question'].includes(i)
      );
    }
    if (paidMessagesEnabled !== undefined) {
      user.insideSettings.paidMessagesEnabled = paidMessagesEnabled;
    }
    if (paidMessagePrice !== undefined && paidMessagePrice >= 0) {
      user.insideSettings.paidMessagePrice = paidMessagePrice;
    }

    await user.save();

    const settings = await getInsideSettings(req.user._id);
    res.json({
      message: 'Paramètres mis à jour',
      settings
    });
  } catch (error) {
    console.error('Erreur mise à jour settings:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
});

// ==================== STATISTIQUES ====================

/**
 * Obtenir les statistiques Inside
 * GET /api/inside/stats
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await getInsideStats(req.user._id);

    res.json({
      message: 'Statistiques Inside',
      stats
    });
  } catch (error) {
    console.error('Erreur récupération stats:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération' });
  }
});

export default router;
