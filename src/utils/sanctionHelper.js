/**
 * Helper pour appliquer les sanctions progressives
 * Gère les pénalités de portée et blocages de monétisation
 */

import User from '../models/User.js';
import { removeAutoBadgesForSuspiciousUser } from './badgeHelper.js';

// Mapping des sévérités et pénalités
const SANCTION_CONFIG = {
  // Niveau 1 : Avertissement (aucune pénalité réelle, juste marquage)
  warning: {
    reachPenalty: 1.0, // -0%
    monetizationBlock: false,
    duration: 7 * 24 * 60 * 60 * 1000 // 7 jours
  },
  // Niveau 2 : Modéré (réduction légère de portée)
  moderate: {
    reachPenalty: 0.7, // -30%
    monetizationBlock: false,
    duration: 14 * 24 * 60 * 60 * 1000 // 14 jours
  },
  // Niveau 3 : Sévère (réduction importante + blocage monétisation)
  severe: {
    reachPenalty: 0.4, // -60%
    monetizationBlock: true,
    duration: 30 * 24 * 60 * 60 * 1000 // 30 jours
  }
};

/**
 * Applique les sanctions basées sur les anomalies détectées
 * Règles :
 * - 1 flag = warning
 * - 2 flags = moderate
 * - 3+ flags = severe
 */
export async function applySanctions(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    // Si pas d'anomalies, aucune sanction
    if (!user.suspiciousActivity || user.anomalyFlags.length === 0) {
      // Réinitialiser si auparavant suspect
      if (user.reducedReach) {
        user.reducedReach = false;
        user.reachPenalty = 1.0;
        user.monetizationEligible = true;
        await user.save();
      }
      return null;
    }

    // Déterminer le niveau de sanction
    let sanctionLevel = 'warning'; // 1 flag
    if (user.anomalyFlags.length >= 2) sanctionLevel = 'moderate';
    if (user.anomalyFlags.length >= 3) sanctionLevel = 'severe';

    const config = SANCTION_CONFIG[sanctionLevel];

    // Appliquer les pénalités
    user.reducedReach = sanctionLevel !== 'warning';
    user.reachPenalty = config.reachPenalty;
    user.monetizationEligible = !config.monetizationBlock;

    // Retirer les badges automatiques pour comptes suspect (sauf manual badges)
    if (sanctionLevel !== 'warning') {
      await removeAutoBadgesForSuspiciousUser(user);
    }

    // Enregistrer la sanction
    const expiresAt = new Date(Date.now() + config.duration);
    user.sanctions = user.sanctions || [];
    
    // Vérifier si sanction déjà existe
    const existingSanction = user.sanctions.find(s => s.type === 'reach_reduction');
    if (existingSanction) {
      existingSanction.level = sanctionLevel;
      existingSanction.expiresAt = expiresAt;
    } else {
      user.sanctions.push({
        type: 'reach_reduction',
        reason: `${user.anomalyFlags.length} anomalies détectées: ${user.anomalyFlags.join(', ')}`,
        level: sanctionLevel,
        expiresAt
      });
    }

    if (config.monetizationBlock) {
      const monetizationSanction = user.sanctions.find(s => s.type === 'monetization_block');
      if (monetizationSanction) {
        monetizationSanction.level = sanctionLevel;
        monetizationSanction.expiresAt = expiresAt;
      } else {
        user.sanctions.push({
          type: 'monetization_block',
          reason: `Croissance anormale détectée (${sanctionLevel})`,
          level: sanctionLevel,
          expiresAt
        });
      }
    }

    if (sanctionLevel === 'severe') {
      const badgeSanction = user.sanctions.find(s => s.type === 'badge_removal');
      if (!badgeSanction) {
        user.sanctions.push({
          type: 'badge_removal',
          reason: 'Anomalies graves de croissance (comptes automatiques supprimés)',
          level: sanctionLevel,
          expiresAt
        });
      }
    }

    await user.save();

    return {
      userId,
      sanctionLevel,
      reachPenalty: user.reachPenalty,
      monetizationBlocked: config.monetizationBlock,
      badgesRemoved: sanctionLevel !== 'warning',
      expiresAt,
      reasons: user.anomalyFlags
    };
  } catch (error) {
    console.error('Erreur applySanctions:', error);
    return null;
  }
}

/**
 * Nettoie les sanctions expirées
 * Peut être appelé par un job cron quotidien
 */
export async function cleanExpiredSanctions(userId) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.sanctions) return null;

    const now = new Date();
    const activeSanctions = user.sanctions.filter(s => !s.expiresAt || new Date(s.expiresAt) > now);

    // Si aucune sanction active, réinitialiser
    if (activeSanctions.length === 0) {
      user.reducedReach = false;
      user.reachPenalty = 1.0;
      user.monetizationEligible = true;
      user.sanctions = [];
      await user.save();

      return {
        userId,
        sanctionsCleared: true,
        message: 'Sanctions expirées et levées'
      };
    }

    // Sinon, réappliquer les sanctions actives
    user.sanctions = activeSanctions;

    // Recalculer basé sur sanctionsactives
    const hasMonetiZationBlock = activeSanctions.some(s => s.type === 'monetization_block');
    const mostSeverePenalty = Math.min(...activeSanctions.map(s => {
      const config = SANCTION_CONFIG[s.level];
      return config.reachPenalty;
    }));

    user.monetizationEligible = !hasMonetiZationBlock;
    user.reducedReach = mostSeverePenalty < 1.0;
    user.reachPenalty = mostSeverePenalty;

    await user.save();

    return {
      userId,
      activeSanctions: activeSanctions.length,
      reachPenalty: user.reachPenalty,
      monetizationEligible: user.monetizationEligible
    };
  } catch (error) {
    console.error('Erreur cleanExpiredSanctions:', error);
    return null;
  }
}

/**
 * Obtient les détails des sanctions d'un utilisateur
 */
export async function getSanctionDetails(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    const now = new Date();
    const activeSanctions = (user.sanctions || []).filter(s => !s.expiresAt || new Date(s.expiresAt) > now);

    return {
      userId,
      currentSanctions: activeSanctions.map(s => ({
        type: s.type,
        level: s.level,
        reason: s.reason,
        appliedAt: s.appliedAt,
        expiresIn: s.expiresAt ? Math.max(0, (new Date(s.expiresAt) - now) / (1000 * 60 * 60)) + ' heures' : 'permanent'
      })),
      isRestricted: user.reducedReach,
      reachPenalty: user.reachPenalty,
      canMonetize: user.monetizationEligible,
      anomalies: {
        growthPattern: user.growthPattern,
        flags: user.anomalyFlags || []
      }
    };
  } catch (error) {
    console.error('Erreur getSanctionDetails:', error);
    return null;
  }
}

/**
 * Lève manuellement une sanction (admin only)
 */
export async function liftSanction(userId, sanctionType) {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    // Supprimer la sanction spécifique
    user.sanctions = (user.sanctions || []).filter(s => s.type !== sanctionType);

    // Recalculer les pénalités
    const now = new Date();
    const activeSanctions = user.sanctions.filter(s => !s.expiresAt || new Date(s.expiresAt) > now);

    if (activeSanctions.length === 0) {
      user.reducedReach = false;
      user.reachPenalty = 1.0;
      user.monetizationEligible = true;
    } else {
      const hasMonetiZationBlock = activeSanctions.some(s => s.type === 'monetization_block');
      const mostSeverePenalty = Math.min(...activeSanctions.map(s => {
        const config = SANCTION_CONFIG[s.level];
        return config.reachPenalty;
      }));

      user.monetizationEligible = !hasMonetiZationBlock;
      user.reducedReach = mostSeverePenalty < 1.0;
      user.reachPenalty = mostSeverePenalty;
    }

    await user.save();

    return {
      userId,
      sanctionLifted: sanctionType,
      remainingSanctions: activeSanctions.length
    };
  } catch (error) {
    console.error('Erreur liftSanction:', error);
    return null;
  }
}

/**
 * Applique une sanction manuelle (admin override)
 */
export async function applySanctionManual(userId, sanctionType, level = 'moderate', durationDays = 14) {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    const config = SANCTION_CONFIG[level];
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    // Ajouter la sanction manuelle
    user.sanctions = user.sanctions || [];
    user.sanctions.push({
      type: sanctionType,
      reason: `Sanction manuelle appliquée par admin (${level})`,
      level,
      expiresAt
    });

    // Appliquer les pénalités
    if (sanctionType === 'reach_reduction') {
      user.reducedReach = true;
      user.reachPenalty = config.reachPenalty;
    } else if (sanctionType === 'monetization_block') {
      user.monetizationEligible = false;
    }

    await user.save();

    return {
      userId,
      sanctionApplied: sanctionType,
      level,
      expiresAt,
      message: `Sanction appliquée pour ${durationDays} jours`
    };
  } catch (error) {
    console.error('Erreur applySanctionManual:', error);
    return null;
  }
}

/**
 * Batch cleanup pour job cron - nettoie les sanctions expirées pour tous les utilisateurs
 */
export async function batchCleanExpiredSanctions() {
  try {
    const now = new Date();

    // Trouver tous les utilisateurs avec sanctions
    const usersWithSanctions = await User.find({
      'sanctions.expiresAt': { $lt: now }
    });

    const results = [];
    for (const user of usersWithSanctions) {
      const result = await cleanExpiredSanctions(user._id);
      if (result && result.sanctionsCleared) {
        results.push(result);
      }
    }

    return {
      processed: results.length,
      details: results
    };
  } catch (error) {
    console.error('Erreur batchCleanExpiredSanctions:', error);
    return { processed: 0, error: error.message };
  }
}

export default {
  applySanctions,
  cleanExpiredSanctions,
  getSanctionDetails,
  liftSanction,
  applySanctionManual,
  batchCleanExpiredSanctions,
  SANCTION_CONFIG
};
