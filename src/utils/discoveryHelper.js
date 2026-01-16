/**
 * Helper pour les nouvelles fonctionnalités de découverte
 * - Feed "Nouveaux créateurs" 🌱
 * - Placement prioritaire dans le feed "Découverte"
 */

import Post from '../models/Post.js';
import User from '../models/User.js';

/**
 * Récupère le feed "Nouveaux créateurs" 🌱
 * Affiche les posts des créateurs < 1000 followers sur les 30 derniers jours
 * Avec boost prioritaire pour les 5 premiers posts
 * 
 * @param {string} userId - ID de l'utilisateur qui consulte
 * @param {number} limit - Nombre max de posts (default 20)
 * @returns {Array} Posts triés par priorité
 */
export async function getNewCreatorsFeed(userId, limit = 20) {
  try {
    const user = await User.findById(userId);
    if (!user) return [];

    const followingIds = user.following?.map(f => f._id) || [];
    const excludedIds = [userId, ...followingIds];

    // Posts des créateurs < 1000 followers, < 30j
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newCreatorPosts = await Post.find({
      author: { $nin: excludedIds },
      createdAt: { $gte: thirtyDaysAgo }
    })
      .populate('author')
      .lean();

    // Filtrer par followers < 1000
    const filteredPosts = newCreatorPosts.filter(p => {
      const followers = p.author?.followers?.length || 0;
      return followers < 1000;
    });

    // Scorer et trier
    const scoredPosts = await Promise.all(
      filteredPosts.map(async (post) => {
        const author = await User.findById(post.author._id);
        const totalPosts = author.stats?.totalPosts || 0;
        const postRank = Math.min(totalPosts, 5); // 1-5 pour priorité
        
        const likes = post.likes?.length || 0;
        const comments = post.comments?.length || 0;
        const views = post.metrics?.viewedBy?.length || 0;

        // Score = (priorité des 5 premiers) + engagement
        const priorityScore = (6 - postRank) * 100; // 500 pour 1er, 100 pour 5e
        const engagementScore = (likes * 10 + comments * 20 + views * 0.5);

        return {
          ...post,
          _priority: postRank <= 5 ? true : false,
          _totalScore: priorityScore + engagementScore
        };
      })
    );

    // Trier : priorité des 5 premiers d'abord, puis par engagement
    const sorted = scoredPosts.sort((a, b) => {
      if (a._priority !== b._priority) {
        return a._priority ? -1 : 1;
      }
      return b._totalScore - a._totalScore;
    });

    return sorted.slice(0, limit).map(p => {
      // Nettoyer les métas temporaires
      delete p._priority;
      delete p._totalScore;
      return {
        ...p,
        _reason: 'new_creators'
      };
    });
  } catch (error) {
    console.error('Erreur getNewCreatorsFeed:', error);
    return [];
  }
}

/**
 * Obtient les statistiques d'un créateur nouveau (< 1k followers)
 * Utile pour afficher le "pourcentage de progression vers Bronze"
 * 
 * @param {string} userId - ID du créateur
 * @returns {Object} Stats de progression
 */
export async function getNewCreatorProgress(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    const followerCount = user.followers?.length || 0;
    
    // Doit être en phase "nouveau"
    if (followerCount >= 1000) return null;

    const totalPosts = user.stats?.totalPosts || 0;
    const totalLikes = user.stats?.totalLikes || 0;
    const totalComments = user.stats?.totalComments || 0;
    const engagement = totalLikes + totalComments;

    return {
      followers: followerCount,
      followers_percentage: Math.round((followerCount / 1000) * 100),
      followers_remaining: 1000 - followerCount,
      posts: totalPosts,
      engagement,
      avg_engagement_per_post: totalPosts > 0 ? Math.round(engagement / totalPosts) : 0,
      boosted_posts: Math.min(totalPosts, 5),
      phase: 'nouveau'
    };
  } catch (error) {
    console.error('Erreur getNewCreatorProgress:', error);
    return null;
  }
}

/**
 * Obtient les suggestions de contenu pour les nouveaux créateurs
 * Basé sur ce qui marche bien dans leur niche/format
 * 
 * @param {string} userId - ID du créateur
 * @returns {Array} Suggestions
 */
export async function getNewCreatorSuggestions(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return [];

    const followers = user.followers?.length || 0;
    if (followers >= 1000) return []; // Pas de suggestions pour Bronze+

    const interests = user.interests || [];
    const category = user.category || 'Autre';

    // Posts performants dans les intérêts du créateur
    const similarPosts = await Post.find({
      tags: { $in: interests },
      'author.category': category
    })
      .populate('author')
      .sort({ likes: -1 })
      .limit(5)
      .lean();

    const suggestions = [];

    // Suggestion 1 : format
    suggestions.push({
      type: 'format',
      title: '📹 Essaie des vidéos courtes',
      description: 'Les vidéos < 30s ont 60% plus de vues que les textes',
      icon: '📹'
    });

    // Suggestion 2 : engagement
    if (user.stats?.totalPosts > 0) {
      const avgEngagement = (user.stats.totalLikes + user.stats.totalComments) / user.stats.totalPosts;
      if (avgEngagement < 5) {
        suggestions.push({
          type: 'engagement',
          title: '💬 Encourage les commentaires',
          description: 'Pose une question à la fin de tes posts',
          icon: '💬'
        });
      }
    }

    // Suggestion 3 : fréquence
    if (user.stats?.totalPosts < 3) {
      suggestions.push({
        type: 'frequency',
        title: '📅 Partage plus régulièrement',
        description: 'Vise au moins 1 post tous les 3 jours',
        icon: '📅'
      });
    }

    // Suggestion 4 : utilise des tags
    if (!user.interests || user.interests.length === 0) {
      suggestions.push({
        type: 'tags',
        title: '#️⃣ Ajoute tes intérêts',
        description: 'Complète ton profil pour des suggestions personalisées',
        icon: '#️⃣'
      });
    }

    return suggestions;
  } catch (error) {
    console.error('Erreur getNewCreatorSuggestions:', error);
    return [];
  }
}

/**
 * Obtient le "premier post boost report"
 * Affiche les stats du premier post pour motiver le créateur
 * 
 * @param {string} userId - ID du créateur
 * @returns {Object|null} Stats du premier post
 */
export async function getFirstPostBoostReport(userId) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.firstPostAt) return null;

    // Récupérer le premier post
    const firstPost = await Post.findOne({
      author: userId,
      createdAt: user.firstPostAt
    })
      .lean();

    if (!firstPost) return null;

    const likes = firstPost.likes?.length || 0;
    const comments = firstPost.comments?.length || 0;
    const views = firstPost.metrics?.viewedBy?.length || 0;

    return {
      title: '🚀 Ton premier post boost',
      description: 'Ton premier post bénéficie d\'un boost auto pour te donner une chance! 🌱',
      stats: {
        views,
        likes,
        comments,
        engagement_rate: views > 0 ? Math.round(((likes + comments) / views) * 100) : 0
      },
      boost_duration_days: 7,
      boost_multiplier: 1.4
    };
  } catch (error) {
    console.error('Erreur getFirstPostBoostReport:', error);
    return null;
  }
}

export default {
  getNewCreatorsFeed,
  getNewCreatorProgress,
  getNewCreatorSuggestions,
  getFirstPostBoostReport
};
