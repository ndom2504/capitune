import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Post from '../models/Post.js';

const router = express.Router();

/**
 * Enregistre qu'un utilisateur a vu un post
 * Captures : watch time, completion status
 */
router.post('/:postId/view', authenticate, async (req, res) => {
  try {
    const { dwellTime = 0, completed = false, format = 'unknown' } = req.body;
    const postId = req.params.postId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post non trouvé' });
    }

    // Vérifier si l'utilisateur a déjà une entrée viewedBy
    const existingView = post.metrics.viewedBy.find(v => 
      v.user.equals(req.user._id)
    );

    if (existingView) {
      // Mettre à jour le dwell time (prendre le max)
      existingView.dwellTime = Math.max(existingView.dwellTime, dwellTime);
      existingView.completed = existingView.completed || completed;
    } else {
      // Nouvelle vue
      post.metrics.viewedBy.push({
        user: req.user._id,
        dwellTime,
        completed
      });
      post.metrics.views += 1;
    }

    // Mettre à jour lastEngagementAt
    post.metrics.lastEngagementAt = new Date();

    await post.save();

    res.json({ 
      message: 'Vue enregistrée',
      views: post.metrics.views
    });
  } catch (error) {
    console.error('Erreur enregistrement vue:', error);
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement de la vue' });
  }
});

/**
 * Enregistre un engagement spécifique au format
 * (zoom image, boucle vidéo, skip, etc.)
 */
router.post('/:postId/engagement', authenticate, async (req, res) => {
  try {
    const { type, count = 1 } = req.body; // type: 'loop', 'skip', 'zoom', 'swipe', 'save', 'repost'
    const postId = req.params.postId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post non trouvé' });
    }

    // Incrémenter selon le type
    switch (type) {
      case 'loop':
        post.metrics.loopCount = (post.metrics.loopCount || 0) + count;
        break;
      case 'skip':
        post.metrics.skipCount = (post.metrics.skipCount || 0) + count;
        break;
      case 'zoom':
        post.metrics.zoomCount = (post.metrics.zoomCount || 0) + count;
        break;
      case 'swipe':
        post.metrics.carouselSwipes = (post.metrics.carouselSwipes || 0) + count;
        break;
      case 'save':
        // Ajouter à la liste des saves si pas déjà présent
        if (!post.metrics.saves.includes(req.user._id)) {
          post.metrics.saves.push(req.user._id);
        }
        break;
      case 'repost':
        // Ajouter à la liste des reposts si pas déjà présent
        if (!post.metrics.reposts.includes(req.user._id)) {
          post.metrics.reposts.push(req.user._id);
        }
        break;
      case 'like':
        // Les likes sont gérés via /posts/:postId/like, on accepte sans modifier les métriques
        break;
      default:
        return res.status(400).json({ message: 'Type d\'engagement invalide' });
    }

    post.metrics.lastEngagementAt = new Date();
    await post.save();

    res.json({ 
      message: `Engagement ${type} enregistré`,
      metrics: {
        loops: post.metrics.loopCount,
        skips: post.metrics.skipCount,
        zooms: post.metrics.zoomCount,
        swipes: post.metrics.carouselSwipes,
        saves: post.metrics.saves.length,
        reposts: post.metrics.reposts.length
      }
    });
  } catch (error) {
    console.error('Erreur enregistrement engagement:', error);
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement de l\'engagement' });
  }
});

/**
 * Calcule et met à jour le completion rate pour une vidéo
 * (appelé à la fin de la video ou au dismiss)
 */
router.post('/:postId/completion', authenticate, async (req, res) => {
  try {
    const { completionPercent = 0 } = req.body; // 0-100
    const postId = req.params.postId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post non trouvé' });
    }

    // Mettre à jour ou créer l'entrée viewedBy
    const view = post.metrics.viewedBy.find(v => v.user.equals(req.user._id));
    if (view) {
      view.completed = completionPercent >= 85; // 85%+ = completed
    }

    // Recalculer le completion rate global
    const totalViews = post.metrics.viewedBy.length || 1;
    const completedViews = post.metrics.viewedBy.filter(v => v.completed).length;
    post.metrics.completionRate = (completedViews / totalViews) * 100;

    await post.save();

    res.json({ 
      message: 'Taux de complétion mis à jour',
      completionRate: post.metrics.completionRate.toFixed(2) + '%'
    });
  } catch (error) {
    console.error('Erreur complétion:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du taux de complétion' });
  }
});

export default router;
