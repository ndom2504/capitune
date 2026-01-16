/**
 * Helper pour gérer les notifications
 * Création, lecture, groupage, envoi
 */

import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Crée une notification
 */
export async function createNotification(data) {
  try {
    const {
      recipientId,
      type,
      title,
      description,
      actor = null,
      category = 'system',
      priority = 'normal',
      actionUrl = null,
      iconUrl = null,
      thumbnail = null,
      groupKey = null,
      notificationData = {},
      actions = [],
      sendPush = true,
      sendEmail = false,
      scheduledFor = null
    } = data;

    // Vérifier le groupage
    let notification = null;
    if (groupKey) {
      // Chercher si une notification groupée existe déjà (non lue)
      const existingGroup = await Notification.findOne({
        recipient: recipientId,
        groupKey,
        read: false,
        dismissed: false,
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Dans la dernière heure
      });

      if (existingGroup) {
        // Incrémenter le compteur au lieu de créer nouvelle notif
        existingGroup.groupCount += 1;
        existingGroup.title = `${existingGroup.title} +${existingGroup.groupCount}`;
        await existingGroup.save();
        return existingGroup;
      }
    }

    // Créer nouvelle notification
    notification = new Notification({
      recipient: recipientId,
      actor,
      type,
      category,
      title,
      description,
      priority,
      groupKey,
      groupCount: 1,
      data: {
        actionUrl,
        iconUrl,
        thumbnail,
        ...notificationData
      },
      actions,
      sendPush,
      sendEmail,
      scheduledFor
    });

    await notification.save();
    await notification.populate('actor', 'username avatar');

    // TODO: Envoyer push/email si requis
    // if (sendPush) await sendPushNotification(notification);
    // if (sendEmail) await sendEmailNotification(notification);

    return notification;
  } catch (error) {
    console.error('Erreur création notification:', error);
    return null;
  }
}

/**
 * Marquer une notification comme lue
 */
export async function markAsRead(notificationId, userId) {
  try {
    const notification = await Notification.findById(notificationId);

    if (!notification) return null;
    if (!notification.recipient.equals(userId)) {
      throw new Error('Non autorisé');
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    return notification;
  } catch (error) {
    console.error('Erreur marquer comme lu:', error);
    return null;
  }
}

/**
 * Marquer toutes les notifications comme lues
 */
export async function markAllAsRead(userId) {
  try {
    const result = await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true, readAt: new Date() }
    );

    return result.modifiedCount;
  } catch (error) {
    console.error('Erreur marquer tout comme lu:', error);
    return 0;
  }
}

/**
 * Obtenir les notifications non lues
 */
export async function getUnreadCount(userId) {
  try {
    const count = await Notification.countDocuments({
      recipient: userId,
      read: false,
      dismissed: false
    });

    return count;
  } catch (error) {
    console.error('Erreur compter non lues:', error);
    return 0;
  }
}

/**
 * Obtenir les notifications avec pagination
 */
export async function getNotifications(userId, options = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      type = null,
      category = null,
      unreadOnly = false,
      dismissed = false
    } = options;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { recipient: userId };

    if (type) query.type = type;
    if (category) query.category = category;
    if (unreadOnly) query.read = false;
    if (!dismissed) query.dismissed = false;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate('actor', 'username avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(query)
    ]);

    return {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    return {
      notifications: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 }
    };
  }
}

/**
 * Obtenir les notifications non lues
 */
export async function getUnreadNotifications(userId) {
  try {
    const notifications = await Notification.find({
      recipient: userId,
      read: false,
      dismissed: false
    })
      .populate('actor', 'username avatar')
      .sort({ priority: -1, createdAt: -1 })
      .limit(50);

    return notifications;
  } catch (error) {
    console.error('Erreur récupération non lues:', error);
    return [];
  }
}

/**
 * Supprimer une notification
 */
export async function deleteNotification(notificationId, userId) {
  try {
    const notification = await Notification.findById(notificationId);

    if (!notification) return null;
    if (!notification.recipient.equals(userId)) {
      throw new Error('Non autorisé');
    }

    await notification.deleteOne();
    return { success: true };
  } catch (error) {
    console.error('Erreur suppression notification:', error);
    return null;
  }
}

/**
 * Marquer comme ignorée (dismiss)
 */
export async function dismissNotification(notificationId, userId) {
  try {
    const notification = await Notification.findById(notificationId);

    if (!notification) return null;
    if (!notification.recipient.equals(userId)) {
      throw new Error('Non autorisé');
    }

    notification.dismissed = true;
    notification.dismissedAt = new Date();
    await notification.save();

    return notification;
  } catch (error) {
    console.error('Erreur dismiss notification:', error);
    return null;
  }
}

/**
 * Obtenir les statistiques de notifications
 */
export async function getNotificationStats(userId) {
  try {
    const [unreadCount, byType, byCategory] = await Promise.all([
      Notification.countDocuments({
        recipient: userId,
        read: false,
        dismissed: false
      }),
      Notification.aggregate([
        { $match: { recipient: new (require('mongoose').Types.ObjectId)(userId), dismissed: false } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Notification.aggregate([
        { $match: { recipient: new (require('mongoose').Types.ObjectId)(userId), dismissed: false } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ])
    ]);

    return {
      unreadCount,
      byType: Object.fromEntries(byType.map(t => [t._id, t.count])),
      byCategory: Object.fromEntries(byCategory.map(c => [c._id, c.count]))
    };
  } catch (error) {
    console.error('Erreur stats notifications:', error);
    return {
      unreadCount: 0,
      byType: {},
      byCategory: {}
    };
  }
}

/**
 * Nettoyer les anciennes notifications (job cron)
 */
export async function cleanupOldNotifications(daysOld = 90) {
  try {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      read: true,
      dismissed: false
    });

    return result.deletedCount;
  } catch (error) {
    console.error('Erreur cleanup notifications:', error);
    return 0;
  }
}

/**
 * Présets pour créer facilement certains types de notifications
 */

export const NotificationPresets = {
  // Messagerie Inside
  contactRequest: (recipientId, actorId, actorUsername) => ({
    recipientId,
    type: 'contact_request',
    category: 'messaging',
    title: `${actorUsername} t'a envoyé une demande`,
    description: 'Regarde ta demande de contact',
    actor: actorId,
    priority: 'high',
    actionUrl: '/inside/requests',
    sendPush: true
  }),

  contactAccepted: (recipientId, actorId, actorUsername) => ({
    recipientId,
    type: 'contact_accepted',
    category: 'messaging',
    title: `${actorUsername} a accepté ta demande!`,
    description: 'Vous pouvez maintenant discuter',
    actor: actorId,
    actionUrl: '/inside/conversations',
    sendPush: true
  }),

  newMessage: (recipientId, actorId, actorUsername, messagePreview) => ({
    recipientId,
    type: 'new_message',
    category: 'messaging',
    title: `${actorUsername}: ${messagePreview.substring(0, 50)}...`,
    actor: actorId,
    priority: 'normal',
    actionUrl: '/inside/conversations',
    groupKey: `message_${actorId}`,
    sendPush: true
  }),

  // Engagement
  newFollower: (recipientId, actorId, actorUsername) => ({
    recipientId,
    type: 'new_follower',
    category: 'engagement',
    title: `${actorUsername} te suit!`,
    actor: actorId,
    actionUrl: `/profile/${actorId}`,
    groupKey: `followers_${recipientId}`,
    sendPush: true
  }),

  postLiked: (recipientId, actorId, actorUsername, postId) => ({
    recipientId,
    type: 'post_liked',
    category: 'engagement',
    title: `${actorUsername} a aimé ton post`,
    actor: actorId,
    priority: 'low',
    actionUrl: `/post/${postId}`,
    notificationData: { postId },
    groupKey: `likes_${postId}`,
    sendPush: false
  }),

  postCommented: (recipientId, actorId, actorUsername, postId, commentPreview) => ({
    recipientId,
    type: 'post_commented',
    category: 'engagement',
    title: `${actorUsername}: ${commentPreview.substring(0, 50)}...`,
    actor: actorId,
    actionUrl: `/post/${postId}`,
    notificationData: { postId },
    groupKey: `comments_${postId}`,
    sendPush: true
  }),

  // Jalon
  milestoneReached: (recipientId, milestone, count) => ({
    recipientId,
    type: 'milestone_reached',
    category: 'milestones',
    title: `🎉 Vous avez atteint ${count} ${milestone}!`,
    description: `Félicitations pour ce jalon!`,
    priority: 'high',
    actionUrl: '/profile',
    sendPush: true,
    sendEmail: true
  }),

  badgeEarned: (recipientId, badgeName, badgeIcon) => ({
    recipientId,
    type: 'badge_earned',
    category: 'milestones',
    title: `${badgeIcon} Badge obtenu: ${badgeName}`,
    priority: 'high',
    actionUrl: '/profile',
    iconUrl: badgeIcon,
    sendPush: true
  }),

  // Partenariat
  partnershipProposal: (recipientId, actorId, actorUsername, opportunityTitle) => ({
    recipientId,
    type: 'partnership_proposal',
    category: 'partnership',
    title: `${actorUsername} te propose un partenariat`,
    description: opportunityTitle,
    actor: actorId,
    priority: 'high',
    actionUrl: '/inside/opportunities',
    sendPush: true,
    sendEmail: true
  }),

  // Système
  systemMessage: (recipientId, title, description, priority = 'normal') => ({
    recipientId,
    type: 'system',
    category: 'system',
    title,
    description,
    priority,
    sendPush: priority === 'high'
  })
};

export default {
  createNotification,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getNotifications,
  getUnreadNotifications,
  deleteNotification,
  dismissNotification,
  getNotificationStats,
  cleanupOldNotifications,
  NotificationPresets
};
