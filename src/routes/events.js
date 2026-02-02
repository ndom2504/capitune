import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Event from '../models/Event.js';
import Community from '../models/Community.js';
import User from '../models/User.js';
import { createNotification, NotificationPresets } from '../utils/notificationHelper.js';

const router = express.Router();

// ==================== DÉCOUVERTE & LISTING ====================

/**
 * Obtenir tous les événements (avec filtres)
 * GET /api/events
 */
router.get('/', async (req, res) => {
  try {
    const { type, status, featured, upcoming, limit = 20, page = 1 } = req.query;
    
    const query = { isActive: true };
    if (type) query.type = type;
    if (status) query.status = status;
    if (featured === 'true') query.isFeatured = true;
    if (upcoming === 'true') {
      query.scheduledAt = { $gte: new Date() };
      query.status = { $in: ['scheduled', 'live'] };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [events, total] = await Promise.all([
      Event.find(query)
        .populate('creator', 'username avatar badges')
        .populate('community', 'name slug avatar')
        .sort({ scheduledAt: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Event.countDocuments(query)
    ]);
    
    res.json({
      message: 'Événements',
      events: events.map(e => e.toPublicProfile()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur récupération événements:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * Obtenir les lives en cours
 * GET /api/events/live
 */
router.get('/live', async (req, res) => {
  try {
    const liveEvents = await Event.find({
      status: 'live',
      isActive: true
    })
      .populate('creator', 'username avatar badges')
      .populate('community', 'name slug avatar')
      .sort({ 'streamData.viewerCount': -1 })
      .limit(20);
    
    res.json({
      message: 'Lives en cours',
      events: liveEvents.map(e => e.toPublicProfile())
    });
  } catch (error) {
    console.error('Erreur récupération lives:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * Obtenir un événement par ID
 * GET /api/events/:eventId
 */
router.get('/:eventId', async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('creator', 'username avatar badges followers')
      .populate('coHosts', 'username avatar')
      .populate('community', 'name slug avatar')
      .populate('moderation.moderators', 'username avatar');
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    
    res.json({
      message: 'Événement',
      event: event.toPublicProfile()
    });
  } catch (error) {
    console.error('Erreur récupération événement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ==================== CRÉATION & GESTION ====================

/**
 * Créer un événement
 * POST /api/events
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      liveType,
      scheduledAt,
      duration,
      access,
      community,
      sponsor
    } = req.body;
    
    // Validation
    if (!title || !description || !type || !scheduledAt || !duration) {
      return res.status(400).json({
        message: 'Champs requis: title, description, type, scheduledAt, duration'
      });
    }
    
    // Vérifier niveau pour lives premium/sponsorisés
    const user = await User.findById(req.user._id);
    const followersCount = user.followers?.length || 0;
    
    if (liveType === 'premium' && followersCount < 100000) {
      return res.status(403).json({
        message: 'Niveau Argent+ requis pour les lives premium'
      });
    }
    
    if (liveType === 'sponsored' && followersCount < 100000) {
      return res.status(403).json({
        message: 'Niveau Argent+ requis pour les lives sponsorisés'
      });
    }
    
    // Créer événement
    const event = new Event({
      title,
      description,
      type,
      liveType: liveType || null,
      creator: req.user._id,
      scheduledAt: new Date(scheduledAt),
      duration: parseInt(duration),
      access: access || { isFree: true },
      community: community || null,
      sponsor: sponsor || { isSponsored: false }
    });
    
    await event.save();
    
    res.status(201).json({
      message: 'Événement créé',
      event: event.toPublicProfile()
    });
  } catch (error) {
    console.error('Erreur création événement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * Mettre à jour un événement
 * PUT /api/events/:eventId
 */
router.put('/:eventId', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    
    // Vérifier permissions
    if (!event.creator.equals(req.user._id)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    // Ne peut pas modifier un événement en cours ou terminé
    if (['live', 'ended'].includes(event.status)) {
      return res.status(400).json({
        message: 'Impossible de modifier un événement en cours ou terminé'
      });
    }
    
    const { title, description, scheduledAt, duration, access } = req.body;
    
    if (title) event.title = title;
    if (description) event.description = description;
    if (scheduledAt) event.scheduledAt = new Date(scheduledAt);
    if (duration) event.duration = parseInt(duration);
    if (access) event.access = { ...event.access, ...access };
    
    await event.save();
    
    res.json({
      message: 'Événement mis à jour',
      event: event.toPublicProfile()
    });
  } catch (error) {
    console.error('Erreur mise à jour événement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * Annuler un événement
 * POST /api/events/:eventId/cancel
 */
router.post('/:eventId/cancel', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    
    if (!event.creator.equals(req.user._id)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    event.status = 'cancelled';
    await event.save();
    
    // TODO: Notifier les participants
    
    res.json({
      message: 'Événement annulé'
    });
  } catch (error) {
    console.error('Erreur annulation événement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ==================== INSCRIPTIONS ====================

/**
 * S'inscrire à un événement
 * POST /api/events/:eventId/register
 */
router.post('/:eventId/register', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    
    // Vérifier si déjà inscrit
    if (event.isRegistered(req.user._id)) {
      return res.status(400).json({ message: 'Déjà inscrit' });
    }
    
    // Vérifier paiement si payant
    if (!event.access.isFree) {
      // TODO: Vérifier paiement
      return res.status(400).json({
        message: 'Paiement requis (non implémenté)'
      });
    }
    
    // Ajouter inscription
    event.registrations.push({
      user: req.user._id,
      registeredAt: new Date(),
      hasPaid: event.access.isFree
    });
    
    event.stats.registrationCount = event.registrations.length;
    await event.save();
    
    res.json({
      message: 'Inscription confirmée',
      event: event.toPublicProfile()
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * Se désinscrire d'un événement
 * POST /api/events/:eventId/unregister
 */
router.post('/:eventId/unregister', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    
    // Retirer inscription
    event.registrations = event.registrations.filter(
      r => !r.user.equals(req.user._id)
    );
    
    event.stats.registrationCount = event.registrations.length;
    await event.save();
    
    res.json({
      message: 'Désinscription confirmée'
    });
  } catch (error) {
    console.error('Erreur désinscription:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ==================== CONTRÔLE LIVE ====================

/**
 * Démarrer un live
 * POST /api/events/:eventId/start
 */
router.post('/:eventId/start', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    
    if (!event.creator.equals(req.user._id)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    if (event.status !== 'scheduled') {
      return res.status(400).json({
        message: 'Événement déjà démarré ou terminé'
      });
    }
    
    await event.start();
    
    // TODO: Générer streamKey et streamUrl
    event.streamData.streamKey = `live_${event._id}_${Date.now()}`;
    event.streamData.streamUrl = `/live/${event._id}`;
    await event.save();
    
    // Notifier les inscrits
    // TODO: Envoyer notifications
    
    res.json({
      message: 'Live démarré',
      event: event.toPublicProfile(),
      streamData: {
        streamKey: event.streamData.streamKey,
        streamUrl: event.streamData.streamUrl
      }
    });
  } catch (error) {
    console.error('Erreur démarrage live:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * Terminer un live
 * POST /api/events/:eventId/end
 */
router.post('/:eventId/end', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    
    if (!event.creator.equals(req.user._id)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    if (event.status !== 'live') {
      return res.status(400).json({
        message: 'Événement pas en cours'
      });
    }
    
    await event.end();
    
    // TODO: Générer replay si applicable
    
    res.json({
      message: 'Live terminé',
      event: event.toPublicProfile()
    });
  } catch (error) {
    console.error('Erreur fin live:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * Mettre à jour le nombre de viewers
 * POST /api/events/:eventId/viewers
 */
router.post('/:eventId/viewers', authenticate, async (req, res) => {
  try {
    const { count } = req.body;
    
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    
    if (event.status !== 'live') {
      return res.status(400).json({ message: 'Événement pas en cours' });
    }
    
    event.streamData.viewerCount = parseInt(count) || 0;
    if (event.streamData.viewerCount > event.streamData.peakViewers) {
      event.streamData.peakViewers = event.streamData.viewerCount;
    }
    
    await event.save();
    
    res.json({
      message: 'Viewers mis à jour',
      viewerCount: event.streamData.viewerCount
    });
  } catch (error) {
    console.error('Erreur mise à jour viewers:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;
