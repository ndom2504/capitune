/**
 * Helper pour gérer les phases créateur et leurs déblocages
 * Nouveau (0-999) → Bronze (1000-99999) → Argent (100000+) → Platine (1M+)
 */

export const CREATOR_PHASES = {
  nouveau: {
    name: 'Nouveau créateur',
    emoji: '🌱',
    minFollowers: 0,
    maxFollowers: 999,
    features: {
      autoBoostFirstPosts: true,
      boostCount: 5,
      liveEnabled: false,
      audioEnabled: false,
      exclusiveEnabled: false,
      advancedStats: false,
      partnerships: false,
      monetizationEnabled: false
    },
    tips: {
      postBoost: 'Tes 5 premiers posts seront boosted automatiquement! 🚀',
      feedPlacement: 'Tu apparaîtras dans le feed "Nouveaux créateurs" 🌱',
      frequencyTip: 'Partage régulièrement pour débloquer le badge régulier',
      engagementTip: 'Les likes et commentaires aident ta progression'
    }
  },

  bronze: {
    name: 'Bronze',
    emoji: '🥉',
    minFollowers: 1000,
    maxFollowers: 99999,
    features: {
      autoBoostFirstPosts: false,
      liveEnabled: true,
      audioEnabled: true,
      exclusiveEnabled: false,
      advancedStats: true,
      partnerships: false,
      monetizationEnabled: false
    },
    tips: {
      liveEnabled: 'Les lives sont maintenant disponibles! Go en direct 📺',
      audioEnabled: 'Crée des audio rooms pour tes communautés 🎙️',
      statsEnabled: 'Accès aux stats avancées pour analyser ta performance 📊',
      nextMilestone: 'Atteins 100k followers pour débloquer la monétisation 💰'
    }
  },

  argent: {
    name: 'Argent',
    emoji: '🥈',
    minFollowers: 100000,
    maxFollowers: 999999,
    features: {
      liveEnabled: true,
      audioEnabled: true,
      exclusiveEnabled: true,
      advancedStats: true,
      partnerships: true,
      monetizationEnabled: true
    },
    tips: {
      monetization: 'Bravo! Ta monétisation est activée 🎉',
      exclusive: 'Crée du contenu exclusif payant pour augmenter tes revenus 💎',
      partnerships: 'Accès à la marketplace des partenariats 🤝',
      revenue: 'Chaque like et partage génère des revenus!'
    }
  },

  platine: {
    name: 'Platine',
    emoji: '💎',
    minFollowers: 1000000,
    features: {
      liveEnabled: true,
      audioEnabled: true,
      exclusiveEnabled: true,
      advancedStats: true,
      partnerships: true,
      monetizationEnabled: true,
      premiumPlacement: true
    },
    tips: {
      premium: 'Accès à la mise en avant premium 👑',
      analytics: 'Analytics en temps réel et insights avancés 📈',
      priority: 'Support prioritaire et ressources de croissance'
    }
  }
};

/**
 * Calcule la phase créateur en fonction du nombre d'abonnés
 * @param {number} followerCount - Nombre d'abonnés
 * @returns {string} Phase créateur (nouveau, bronze, argent, platine)
 */
export function calculateCreatorPhase(followerCount) {
  if (followerCount >= 1000000) return 'platine';
  if (followerCount >= 100000) return 'argent';
  if (followerCount >= 1000) return 'bronze';
  return 'nouveau';
}

/**
 * Obtient les informations et déblocages de la phase actuelle
 * @param {string} phase - Phase créateur
 * @returns {Object} Infos de la phase
 */
export function getPhaseInfo(phase) {
  return CREATOR_PHASES[phase] || CREATOR_PHASES.nouveau;
}

/**
 * Vérifie si une fonctionnalité est débloquée pour une phase
 * @param {string} phase - Phase créateur
 * @param {string} feature - Nom de la fonctionnalité
 * @returns {boolean} Si la fonctionnalité est disponible
 */
export function isFeatureUnlocked(phase, feature) {
  const phaseInfo = getPhaseInfo(phase);
  return phaseInfo.features[feature] === true;
}

/**
 * Obtient le message de progression vers la phase suivante
 * @param {string} phase - Phase actuelle
 * @param {number} followerCount - Nombre actuel d'abonnés
 * @returns {Object} Info de progression
 */
export function getProgressionInfo(phase, followerCount) {
  const phaseKeys = ['nouveau', 'bronze', 'argent', 'platine'];
  const currentIndex = phaseKeys.indexOf(phase);

  if (phase === 'platine') {
    return { nextPhase: null, progress: 100 };
  }

  const nextPhase = phaseKeys[currentIndex + 1];
  const nextPhaseInfo = CREATOR_PHASES[nextPhase];
  const currentPhaseInfo = CREATOR_PHASES[phase];

  const min = currentPhaseInfo.minFollowers;
  const max = nextPhaseInfo.minFollowers;
  const progress = Math.min(100, ((followerCount - min) / (max - min)) * 100);

  return {
    currentPhase: phase,
    nextPhase,
    currentFollowers: followerCount,
    requiredFollowers: nextPhaseInfo.minFollowers,
    remainingFollowers: Math.max(0, nextPhaseInfo.minFollowers - followerCount),
    progress: Math.round(progress)
  };
}

/**
 * Obtient les conseils pour la phase actuelle
 * @param {string} phase - Phase créateur
 * @returns {Array} Liste des conseils
 */
export function getPhaseAdvice(phase) {
  const phaseInfo = getPhaseInfo(phase);
  const tips = [];

  if (phaseInfo.tips) {
    Object.values(phaseInfo.tips).forEach(tip => {
      tips.push(tip);
    });
  }

  return tips;
}

export default {
  CREATOR_PHASES,
  calculateCreatorPhase,
  getPhaseInfo,
  isFeatureUnlocked,
  getProgressionInfo,
  getPhaseAdvice
};
