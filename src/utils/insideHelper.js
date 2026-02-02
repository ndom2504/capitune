/**
 * Helper pour gérer les règles Inside
 * Permissions par niveau, limites d'envoi, protections
 */

import User from '../models/User.js';
import ContactRequest from '../models/ContactRequest.js';

// Limites d'envoi par niveau de créateur
export const INSIDE_LIMITS = {
  'Nouveau': {
    canSendRequests: true,
    requestsPerWeek: Infinity,
    description: 'Envoi autorisé pour tous les nouveaux utilisateurs (limite levée)'
  },
  'Bronze': {
    canSendRequests: true,
    requestsPerWeek: 5,
    description: '5 demandes par semaine'
  },
  'Argent': {
    canSendRequests: true,
    requestsPerWeek: 20,
    description: '20 demandes par semaine'
  },
  'Or': {
    canSendRequests: true,
    requestsPerWeek: 100,
    description: 'Pratiquement illimité (100/semaine)'
  },
  'Platinium': {
    canSendRequests: true,
    requestsPerWeek: Infinity,
    description: 'Illimité + priorité'
  }
};

/**
 * Obtient le niveau du créateur pour les limites Inside
 */
export function getCreatorLevel(followerCount) {
  if (followerCount < 1000) return 'Nouveau';
  if (followerCount < 100000) return 'Bronze';
  if (followerCount < 1000000) return 'Argent';
  if (followerCount < 100000000) return 'Or';
  return 'Platinium';
}

/**
 * Vérifie si un utilisateur peut envoyer une demande de contact
 */
export async function canSendContactRequest(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return { allowed: false, reason: 'Utilisateur non trouvé' };

    const level = getCreatorLevel(user.followers?.length || 0);
    const limits = INSIDE_LIMITS[level];

    // Tous les niveaux peuvent maintenant initier des demandes

    // Vérifier le quota hebdomadaire
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sentThisWeek = await ContactRequest.countDocuments({
      from: userId,
      createdAt: { $gte: oneWeekAgo }
    });

    if (sentThisWeek >= limits.requestsPerWeek) {
      return {
        allowed: false,
        reason: `Quota dépassé (${limits.requestsPerWeek}/${limits.requestsPerWeek} cette semaine)`,
        nextResetTime: new Date(oneWeekAgo.getTime() + 7 * 24 * 60 * 60 * 1000)
      };
    }

    return {
      allowed: true,
      level,
      limits,
      sentThisWeek,
      remainingThisWeek: limits.requestsPerWeek - sentThisWeek
    };
  } catch (error) {
    console.error('Erreur canSendContactRequest:', error);
    return { allowed: false, reason: 'Erreur lors de la vérification' };
  }
}

/**
 * Vérifie les paramètres Inside d'un utilisateur
 */
export async function getInsideSettings(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    const level = getCreatorLevel(user.followers?.length || 0);
    const limits = INSIDE_LIMITS[level];

    return {
      userId,
      level,
      limits,
      settings: {
        // Contrôles sur les paramètres utilisateur
        allowDirectMessages: user.insideSettings?.allowDirectMessages ?? true,
        allowPartnershipOnly: user.insideSettings?.allowPartnershipOnly ?? false,
        allowedIntentions: user.insideSettings?.allowedIntentions ?? ['discussion', 'collaboration', 'partnership', 'question'],
        paidMessagesEnabled: user.insideSettings?.paidMessagesEnabled ?? false,
        paidMessagePrice: user.insideSettings?.paidMessagePrice ?? 0,
        blockedUsers: user.insideSettings?.blockedUsers ?? [],
        allowedUsers: user.insideSettings?.allowedUsers ?? [] // Whitelist optionnelle
      }
    };
  } catch (error) {
    console.error('Erreur getInsideSettings:', error);
    return null;
  }
}

/**
 * Vérifie si un utilisateur peut envoyer un message à un autre
 */
export async function canMessage(fromUserId, toUserId) {
  try {
    const [fromUser, toUser] = await Promise.all([
      User.findById(fromUserId),
      User.findById(toUserId)
    ]);

    if (!fromUser || !toUser) {
      return { allowed: false, reason: 'Utilisateur non trouvé' };
    }

    // Vérifier s'il y a blocage mutuel
    if (toUser.insideSettings?.blockedUsers?.includes(fromUserId)) {
      return { allowed: false, reason: 'Cet utilisateur a bloqué les messages' };
    }

    // Vérifier les paramètres du destinataire
    const toUserSettings = toUser.insideSettings;
    if (toUserSettings?.allowDirectMessages === false) {
      return {
        allowed: false,
        reason: 'Cet utilisateur a fermé ses DMs'
      };
    }

    // Si whitelist activée, vérifier si on y est
    if (toUserSettings?.allowedUsers && toUserSettings.allowedUsers.length > 0) {
      if (!toUserSettings.allowedUsers.includes(fromUserId)) {
        return {
          allowed: false,
          reason: 'Vous n\'êtes pas autorisé à envoyer des messages à cet utilisateur'
        };
      }
    }

    return { allowed: true };
  } catch (error) {
    console.error('Erreur canMessage:', error);
    return { allowed: false, reason: 'Erreur lors de la vérification' };
  }
}

/**
 * Détecte le spam basé sur les patterns
 */
export async function detectSpamPatterns(userId, toUserId) {
  try {
    // Vérifier si l'utilisateur envoie la même demande à plusieurs personnes
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRequests = await ContactRequest.find({
      from: userId,
      createdAt: { $gte: oneHourAgo }
    }).distinct('to');

    const isSpamming = recentRequests.length >= 5; // 5+ demandes en 1h = spam

    // Vérifier les patterns de copié-collé
    const recentMessages = await ContactRequest.find({
      from: userId,
      createdAt: { $gte: oneHourAgo }
    }).select('message');

    const messages = recentMessages.map(r => r.message);
    const identicalMessages = messages.filter(m =>
      messages.filter(msg => msg === m).length >= 3 // Si même message 3x+ = spam
    ).length;

    return {
      isSpamming,
      recentRequestCount: recentRequests.length,
      identicalMessageCount: identicalMessages,
      flagAsSpam: isSpamming || identicalMessages > 0
    };
  } catch (error) {
    console.error('Erreur detectSpamPatterns:', error);
    return { isSpamming: false, flagAsSpam: false };
  }
}

/**
 * Enrich une demande de contact avec les infos du demandeur
 */
export async function enrichContactRequest(request) {
  try {
    const fromUser = await User.findById(request.from).select(
      'username avatar followers stats badges'
    );

    return {
      ...request.toObject(),
      senderProfile: {
        username: fromUser?.username,
        avatar: fromUser?.avatar,
        followers: fromUser?.followers?.length || 0,
        badges: fromUser?.badges || [],
        level: getCreatorLevel(fromUser?.followers?.length || 0)
      }
    };
  } catch (error) {
    console.error('Erreur enrichContactRequest:', error);
    return request.toObject();
  }
}

/**
 * Obtient les statistiques Inside pour un utilisateur
 */
export async function getInsideStats(userId) {
  try {
    const [pendingRequests, acceptedChats, totalMessagesReceived, blockedUsers] = await Promise.all([
      ContactRequest.countDocuments({ to: userId, status: 'pending' }),
      ContactRequest.countDocuments({ to: userId, status: 'accepted' }),
      ContactRequest.find({ to: userId, status: 'pending' }).select('from intention createdAt'),
      User.findById(userId).select('insideSettings.blockedUsers')
    ]);

    return {
      userId,
      stats: {
        pendingRequests,
        acceptedChats,
        totalMessagesReceived,
        blockedUsersCount: blockedUsers?.insideSettings?.blockedUsers?.length || 0
      }
    };
  } catch (error) {
    console.error('Erreur getInsideStats:', error);
    return null;
  }
}

export default {
  INSIDE_LIMITS,
  getCreatorLevel,
  canSendContactRequest,
  getInsideSettings,
  canMessage,
  detectSpamPatterns,
  enrichContactRequest,
  getInsideStats
};
