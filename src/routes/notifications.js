import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Notification from '../models/Notification.js';
import {
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getNotifications,
  getUnreadNotifications,
  deleteNotification,
  dismissNotification,
  getNotificationStats
} from '../utils/notificationHelper.js';

const router = express.Router();

/**
 * Obtenir toutes les notifications
 * GET /api/notifications?page=1&limit=20&type=message&unreadOnly=false
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, category, unreadOnly = false } = req.query;

    const result = await getNotifications(req.user._id, {
      page,
      limit,
      type,
      category,
      unreadOnly: unreadOnly === 'true'
    });

    res.json({
      message: 'Notifications',
      ...result
    });
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération' });
  }
});

/**
 * Obtenir les notifications non lues
 * GET /api/notifications/unread
 */
router.get('/unread', authenticate, async (req, res) => {
  try {
    const [notifications, count] = await Promise.all([
      getUnreadNotifications(req.user._id),
      getUnreadCount(req.user._id)
    ]);

    res.json({
      message: 'Notifications non lues',
      unreadCount: count,
      notifications
    });
  } catch (error) {
    console.error('Erreur récupération non lues:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération' });
  }
});

/**
 * Obtenir le nombre de notifications non lues
 * GET /api/notifications/count/unread
 */
router.get('/count/unread', authenticate, async (req, res) => {
  try {
    const unreadCount = await getUnreadCount(req.user._id);

    res.json({
      message: 'Nombre de notifications non lues',
      unreadCount
    });
  } catch (error) {
    console.error('Erreur compter non lues:', error);
    res.status(500).json({ message: 'Erreur lors du comptage' });
  }
});

/**
 * Obtenir les statistiques de notifications
 * GET /api/notifications/stats
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await getNotificationStats(req.user._id);

    res.json({
      message: 'Statistiques de notifications',
      stats
    });
  } catch (error) {
    console.error('Erreur statistiques:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des stats' });
  }
});

/**
 * Marquer une notification comme lue
 * PUT /api/notifications/:notificationId/read
 */
router.put('/:notificationId/read', authenticate, async (req, res) => {
  try {
    const notification = await markAsRead(req.params.notificationId, req.user._id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    res.json({
      message: 'Notification marquée comme lue',
      notification
    });
  } catch (error) {
    console.error('Erreur marquer comme lu:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
});

/**
 * Marquer tous les notifications comme lues
 * PUT /api/notifications/read/all
 */
router.put('/read/all', authenticate, async (req, res) => {
  try {
    const count = await markAllAsRead(req.user._id);

    res.json({
      message: 'Toutes les notifications marquées comme lues',
      updatedCount: count
    });
  } catch (error) {
    console.error('Erreur marquer tout comme lu:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
});

/**
 * Marquer une notification comme ignorée (dismiss)
 * PUT /api/notifications/:notificationId/dismiss
 */
router.put('/:notificationId/dismiss', authenticate, async (req, res) => {
  try {
    const notification = await dismissNotification(req.params.notificationId, req.user._id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    res.json({
      message: 'Notification ignorée',
      notification
    });
  } catch (error) {
    console.error('Erreur dismiss:', error);
    res.status(500).json({ message: 'Erreur lors du dismiss' });
  }
});

/**
 * Supprimer une notification
 * DELETE /api/notifications/:notificationId
 */
router.delete('/:notificationId', authenticate, async (req, res) => {
  try {
    const result = await deleteNotification(req.params.notificationId, req.user._id);

    if (!result) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    res.json({
      message: 'Notification supprimée'
    });
  } catch (error) {
    console.error('Erreur suppression:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
});

/**
 * Obtenir une notification spécifique
 * GET /api/notifications/:notificationId
 */
router.get('/:notificationId', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.notificationId)
      .populate('actor', 'username avatar');

    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    // Vérifier que c'est le destinataire
    if (!notification.recipient.equals(req.user._id)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Marquer comme lue automatiquement
    if (!notification.read) {
      notification.read = true;
      notification.readAt = new Date();
      await notification.save();
    }

    res.json({
      message: 'Notification',
      notification
    });
  } catch (error) {
    console.error('Erreur récupération notification:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération' });
  }
});

export default router;
