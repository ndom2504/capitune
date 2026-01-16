/**
 * Helper pour détecter les comportements suspects (anti-bot)
 * Analyse silencieusement sans signaler les utilisateurs
 */

import User from '../models/User.js';

/**
 * Détecte les croissances anormales de followers
 * Règles :
 * - Pics > 100 followers en 24h = spike
 * - Croissance > 50% en 7j = abnormal
 * - Engagement ratio suspect (1k followers, 0 posts) = inconsistent
 */
export async function detectAbnormalGrowth(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    const flags = [];
    const followerGrowth = user.stats?.followerGrowth || [];
    const totalPosts = user.stats?.totalPosts || 0;
    const totalLikes = user.stats?.totalLikes || 0;
    const totalComments = user.stats?.totalComments || 0;
    const currentFollowers = user.followers?.length || 0;

    // 1️⃣ Détecte les pics anormaux de followers (+100 en 24h)
    if (followerGrowth.length >= 2) {
      for (let i = 1; i < followerGrowth.length; i++) {
        const current = followerGrowth[i];
        const previous = followerGrowth[i - 1];
        const timeDiff = (new Date(current.date) - new Date(previous.date)) / (1000 * 60 * 60); // heures

        // Si moins de 24h et gain > 100 followers = suspect
        if (timeDiff < 24 && (current.count - previous.count) > 100) {
          flags.push('spike_followers');
          break;
        }
      }
    }

    // 2️⃣ Croissance anormale en 7 jours (> 50% ou > 500 followers)
    if (followerGrowth.length >= 2) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const oldEntry = followerGrowth.find(e => new Date(e.date) < sevenDaysAgo);
      const latestEntry = followerGrowth[followerGrowth.length - 1];

      if (oldEntry && latestEntry) {
        const oldCount = oldEntry.count;
        const newCount = latestEntry.count;
        const growthPercent = ((newCount - oldCount) / oldCount) * 100;

        if (growthPercent > 50 || (newCount - oldCount) > 500) {
          flags.push('spike_followers');
        }
      }
    }

    // 3️⃣ Engagement incohérent
    // Règle : si followers >= 1000 mais pas d'engagement (totalLikes + totalComments) < 50
    if (currentFollowers >= 1000 && (totalLikes + totalComments) < 50) {
      flags.push('inconsistent_engagement');
    }

    // Règle : 100+ followers mais 0 posts = super suspect
    if (currentFollowers >= 100 && totalPosts === 0) {
      flags.push('inconsistent_engagement');
    }

    // 4️⃣ Compte inactif avec beaucoup d'abonnés
    // Règle : 5k followers mais dernier post > 60 jours
    if (currentFollowers >= 5000) {
      if (!user.firstPostAt) {
        // Aucun post mais bcp d'abonnés
        flags.push('inactive_with_followers');
      } else {
        const daysSinceLastPost = (Date.now() - new Date(user.stats?.lastPostDates?.[user.stats.lastPostDates.length - 1]).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastPost > 60) {
          flags.push('inactive_with_followers');
        }
      }
    }

    // 5️⃣ Pattern de suivi/désuivi rapide (follow-unfollow waves)
    // Détection basique : si dans followerGrowth on voit des patterns cycliques
    if (followerGrowth.length >= 5) {
      const recentGrowth = followerGrowth.slice(-5);
      let spikes = 0;

      for (let i = 1; i < recentGrowth.length; i++) {
        const diff = recentGrowth[i].count - recentGrowth[i - 1].count;
        if (Math.abs(diff) > 50) spikes++;
      }

      // Si 3+ pics en 5 jours = comportement cyclique suspect
      if (spikes >= 3) {
        flags.push('rapid_follow_unfollow');
      }
    }

    // 6️⃣ Réseau d'interactions artificielles (très avancé)
    // Simplement : si engagement ratio est anormal pour la phase
    const engagementRatio = totalPosts > 0 ? (totalLikes + totalComments) / totalPosts : 0;
    const creatorPhase = user.getCreatorPhase();

    // Pour nouveau créateur : engagement ratio devrait être > 1 (au moins 1 like/comment par post)
    if (creatorPhase === 'nouveau' && totalPosts > 5 && engagementRatio < 0.5) {
      flags.push('fake_interaction_network');
    }

    // Déterminer la pattern
    let growthPattern = 'normal';
    if (flags.length > 0) {
      if (flags.length >= 3) {
        growthPattern = 'suspicious';
      } else {
        growthPattern = 'abnormal';
      }
    }

    // Mettre à jour l'utilisateur
    user.growthPattern = growthPattern;
    user.suspiciousActivity = growthPattern !== 'normal';
    user.anomalyFlags = flags;
    user.lastAnomalyCheck = new Date();

    await user.save();

    return {
      userId,
      growthPattern,
      suspicious: growthPattern !== 'normal',
      flags,
      flagCount: flags.length,
      analysis: {
        currentFollowers,
        totalPosts,
        totalEngagement: totalLikes + totalComments,
        engagementRatio: parseFloat(engagementRatio.toFixed(2)),
        creatorPhase
      }
    };
  } catch (error) {
    console.error('Erreur detectAbnormalGrowth:', error);
    return null;
  }
}

/**
 * Récupère l'état de suspicion d'un utilisateur
 * Retourne null si normal, sinon retourne les flags et pattern
 */
export async function getUserAnomalyStatus(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    // Si pas d'anomalie, retourner null
    if (!user.suspiciousActivity) {
      return null;
    }

    return {
      userId,
      growthPattern: user.growthPattern,
      anomalyFlags: user.anomalyFlags || [],
      lastCheck: user.lastAnomalyCheck,
      flagCount: (user.anomalyFlags || []).length
    };
  } catch (error) {
    console.error('Erreur getUserAnomalyStatus:', error);
    return null;
  }
}

/**
 * Batch check - run anomaly detection on multiple users
 * Utile pour un job cron qui tourne toutes les 24h
 */
export async function checkAnomaliesForUsers(userIds) {
  try {
    const results = [];

    for (const userId of userIds) {
      const result = await detectAbnormalGrowth(userId);
      if (result && result.suspicious) {
        results.push(result);
      }
    }

    return results;
  } catch (error) {
    console.error('Erreur checkAnomaliesForUsers:', error);
    return [];
  }
}

/**
 * Obtient tous les utilisateurs avec activité suspecte
 * Utile pour le dashboard modération (admin only)
 */
export async function getSuspiciousUsers(limit = 50) {
  try {
    const suspicious = await User.find({
      suspiciousActivity: true
    })
      .select('_id username followers stats growthPattern anomalyFlags lastAnomalyCheck')
      .sort({ lastAnomalyCheck: -1 })
      .limit(limit)
      .lean();

    return suspicious.map(u => ({
      _id: u._id,
      username: u.username,
      followers: u.followers?.length || 0,
      pattern: u.growthPattern,
      flags: u.anomalyFlags || [],
      flagCount: (u.anomalyFlags || []).length,
      lastChecked: u.lastAnomalyCheck,
      severity: u.anomalyFlags?.length >= 3 ? 'high' : u.anomalyFlags?.length >= 2 ? 'medium' : 'low'
    }));
  } catch (error) {
    console.error('Erreur getSuspiciousUsers:', error);
    return [];
  }
}

/**
 * Explique les flags en langage naturel
 * Utile pour le dashboard
 */
export function explainFlags(flags) {
  const explanations = {
    spike_followers: '📈 Pic de croissance anormal des followers',
    inconsistent_engagement: '🔄 Engagement incohérent avec le nombre de followers',
    inactive_with_followers: '🔇 Compte inactif malgré beaucoup d\'abonnés',
    fake_interaction_network: '🤖 Réseau d\'interactions potentiellement artificiel',
    rapid_follow_unfollow: '⚡ Pattern de suivi/désuivi rapide et cyclique'
  };

  return flags.map(f => ({
    flag: f,
    explanation: explanations[f] || 'Comportement suspect détecté'
  }));
}

export default {
  detectAbnormalGrowth,
  getUserAnomalyStatus,
  checkAnomaliesForUsers,
  getSuspiciousUsers,
  explainFlags
};
