// Helper pour attribuer automatiquement les badges

const BADGE_CONFIGS = {
  rising: {
    type: 'rising',
    label: 'Créateur en montée',
    icon: '🔥',
    check: (user, stats) => {
      // +100 nouveaux abonnés sur 7 derniers jours
      const followerGrowth = stats?.followerGrowth || user.stats?.followerGrowth || [];
      if (followerGrowth.length < 2) return false;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentGrowth = followerGrowth.filter(entry => new Date(entry.date) >= sevenDaysAgo);
      if (recentGrowth.length < 2) return false;
      const oldestCount = recentGrowth[0].count;
      const latestCount = recentGrowth[recentGrowth.length - 1].count;
      return (latestCount - oldestCount) >= 100;
    }
  },
  engagement: {
    type: 'engagement',
    label: 'Engagement élevé',
    icon: '🎯',
    check: (user, stats) => {
      // Taux d'engagement > 10% (likes + comments / posts)
      const totalPosts = stats?.totalPosts || user.stats?.totalPosts || 0;
      if (totalPosts === 0) return false;
      const totalLikes = stats?.totalLikes || user.stats?.totalLikes || 0;
      const totalComments = stats?.totalComments || user.stats?.totalComments || 0;
      const engagementRate = (totalLikes + totalComments) / totalPosts;
      return engagementRate > 10;
    }
  },
  regular: {
    type: 'regular',
    label: 'Régulier',
    icon: '⏱️',
    check: (user, stats) => {
      // 5+ posts sur les 30 derniers jours
      const lastPostDates = stats?.lastPostDates || user.stats?.lastPostDates || [];
      if (lastPostDates.length < 5) return false;
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentPosts = lastPostDates.filter(date => new Date(date) >= thirtyDaysAgo);
      return recentPosts.length >= 5;
    }
  },
  partner: {
    type: 'partner',
    label: 'Partenaire fiable',
    icon: '🤝',
    check: (user, stats) => {
      // Accepte les partenariats et a le statut créateur
      return user.partnerships?.creator?.acceptPartnerships === true;
    }
  }
};

/**
 * Calcule quels badges un utilisateur devrait avoir automatiquement
 * @param {Object} user - Mongoose User document
 * @param {Object} stats - Statistiques calculées (engagement, posts, campaigns, etc.)
 * @returns {Array} Liste de badges à attribuer
 */
export function calculateAutoBadges(user, stats = {}) {
  const earnedBadges = [];

  for (const [key, config] of Object.entries(BADGE_CONFIGS)) {
    if (config.check(user, stats)) {
      // Vérifier si badge déjà attribué
      const alreadyHas = user.badges?.some(b => b.type === config.type);
      if (!alreadyHas) {
        earnedBadges.push({
          type: config.type,
          label: config.label,
          icon: config.icon,
          auto: true
        });
      }
    }
  }

  return earnedBadges;
}

/**
 * Retire les badges auto qui ne sont plus mérités
 * @param {Object} user - Mongoose User document
 * @param {Object} stats - Statistiques calculées
 * @returns {Array} Liste de badges à garder
 */
export function pruneAutoBadges(user, stats = {}) {
  if (!user.badges || user.badges.length === 0) return [];

  return user.badges.filter(badge => {
    // Garder tous les badges manuels
    if (!badge.auto) return true;

    // Vérifier si badge auto toujours valide
    const config = BADGE_CONFIGS[badge.type];
    if (!config) return false; // Badge inconnu, supprimer

    return config.check(user, stats);
  });
}

/**
 * Met à jour les badges automatiques d'un utilisateur
 * @param {Object} user - Mongoose User document
 * @param {Object} stats - Statistiques calculées
 */
export async function updateUserBadges(user, stats = {}) {
  // Nettoyer les badges auto obsolètes
  const validBadges = pruneAutoBadges(user, stats);
  
  // Ajouter nouveaux badges auto
  const newBadges = calculateAutoBadges(user, stats);
  
  user.badges = [...validBadges, ...newBadges];
  await user.save();
  
  return user.badges;
}

/**
 * Attribue un badge manuel (admin/moderator)
 * @param {Object} user - Mongoose User document
 * @param {String} type - recommended | trusted | excellence
 * @param {String} label - Label personnalisé
 * @param {String} icon - Emoji/icon
 */
export async function awardManualBadge(user, type, label, icon) {
  const validManualTypes = ['recommended', 'trusted', 'excellence'];
  if (!validManualTypes.includes(type)) {
    throw new Error('Type de badge manuel invalide');
  }

  // Vérifier si déjà attribué
  const alreadyHas = user.badges?.some(b => b.type === type);
  if (alreadyHas) {
    throw new Error('Badge déjà attribué');
  }

  user.badges.push({
    type,
    label,
    icon,
    auto: false
  });

  await user.save();
  return user.badges;
}

/**
 * Retire un badge spécifique
 * @param {Object} user - Mongoose User document
 * @param {String} badgeType - Type du badge à retirer
 */
export async function removeBadge(user, badgeType) {
  user.badges = user.badges.filter(b => b.type !== badgeType);
  await user.save();
  return user.badges;
}

/**
 * Retire tous les badges automatiques en cas de comportement suspect
 * @param {Object} user - Mongoose User document
 */
export async function removeAutoBadgesForSuspiciousUser(user) {
  const autoBadgeTypes = ['rising', 'engagement', 'regular', 'partner'];
  
  user.badges = user.badges.filter(b => 
    !autoBadgeTypes.includes(b.type) || b.manual === true
  );
  
  await user.save();
  return user.badges;
}

export default {
  calculateAutoBadges,
  pruneAutoBadges,
  updateUserBadges,
  awardManualBadge,
  removeBadge,
  removeAutoBadgesForSuspiciousUser,
  BADGE_CONFIGS
};
