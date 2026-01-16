import Post from '../models/Post.js';
import User from '../models/User.js';

/**
 * Calcule le score global d'un post selon l'algorithme Capitune
 * SG = (Q × 0.35) + (E × 0.30) + (R × 0.15) + (C × 0.10) + (N × 0.10)
 * 
 * Boost automatique pour les 5 premiers posts des nouveaux créateurs
 */
export async function calculatePostScore(post, userId) {
  const now = Date.now();
  const ageMs = now - new Date(post.createdAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  // Q – Qualité (taux de complétion, retours positifs)
  const viewedBy = post.metrics?.viewedBy || [];
  const totalViews = Math.max(viewedBy.length, 1);
  const completedViews = viewedBy.filter(v => v.completed).length;
  const completionRate = Math.min(1, totalViews > 0 ? completedViews / totalViews : 0);
  
  const avgDwellTime = viewedBy.length > 0 
    ? viewedBy.reduce((sum, v) => sum + (v.dwellTime || 0), 0) / viewedBy.length 
    : 0;
  
  // Pour vidéo, dwell > 30s est bon; pour image/texte, > 3s
  const targetDwell = post.format === 'short' ? 30000 : 3000;
  const dwellScore = Math.min(1, avgDwellTime / targetDwell);
  
  const qualityScore = (completionRate + dwellScore) / 2;

  // E – Engagement (likes, commentaires, partages, saves)
  const engagement = {
    likes: post.likes?.length || 0,
    comments: post.comments?.length || 0,
    shares: post.shares?.length || 0,
    saves: post.metrics?.saves?.length || 0,
    reposts: post.metrics?.reposts?.length || 0
  };

  // Pondération : saves/reposts > partages > commentaires > likes
  const engagementScore = Math.min(1, 
    (engagement.likes * 0.1 + 
     engagement.comments * 0.3 + 
     engagement.shares * 0.5 + 
     engagement.saves * 0.8 + 
     engagement.reposts * 1.0) / totalViews / 2
  );

  // R – Récence (décroissance exponentielle rapide)
  const tau = 24; // 24h decay
  const recencyScore = Math.exp(-ageHours / tau);

  // C – Créateur (bonus selon niveau)
  // Utiliser l'auteur déjà peuplé si disponible, sinon fallback DB (évite 1 requête/post)
  let author = post.author;
  if (!author || typeof author === 'string' || typeof author === 'object' && author?.toString) {
    const id = author?._id || post.author;
    author = await User.findById(id).lean();
  }

  const followerCount = author?.followers?.length || 0;
  let creatorScore = 0.3; // Base pour nouveau compte

  if (followerCount >= 1000 && followerCount < 100000) creatorScore = 0.6; // Bronze
  else if (followerCount >= 100000 && followerCount < 1000000) creatorScore = 0.75; // Argent
  else if (followerCount >= 1000000 && followerCount < 100000000) creatorScore = 0.85; // Or
  else if (followerCount >= 100000000) creatorScore = 0.95; // Platinium

  // N – Nouveauté (détecte formats/idées rares)
  // Formats "exclusifs" (live, audio, exclusive, partnership) = plus de novelty
  let noveltyScore = 0.5; // Base
  if (['live', 'audio', 'exclusive', 'partnership'].includes(post.format)) {
    noveltyScore = 0.8;
  }

  // BOOST pour les 5 premiers posts des nouveaux créateurs
  let boostMultiplier = 1.0;
  if (followerCount < 1000 && author.firstPostAt) {
    // Compter combien de posts depuis le premier
    const totalPosts = author.stats?.totalPosts || 1;
    if (totalPosts <= 5) {
      // Boost progressif : +40% pour 1er, +35% pour 2e, ... +15% pour 5e
      const boostPercentages = [0.40, 0.35, 0.30, 0.25, 0.20];
      boostMultiplier = 1.0 + boostPercentages[Math.min(totalPosts - 1, 4)];
    }
  }

  // Global score : 0-100
  let globalScore = Math.round(
    (qualityScore * 0.35 + 
     engagementScore * 0.30 + 
     recencyScore * 0.15 + 
     creatorScore * 0.10 + 
     noveltyScore * 0.10) * 100
  );

  // Appliquer le boost
  globalScore = Math.round(globalScore * boostMultiplier);

  // Appliquer la pénalité de portée si l'auteur est sous sanction
  let reachPenalty = 1.0;
  let sanctionApplied = false;
  if (author.reducedReach && author.reachPenalty) {
    reachPenalty = author.reachPenalty;
    globalScore = Math.round(globalScore * reachPenalty);
    sanctionApplied = true;
  }

  return {
    quality: parseFloat(qualityScore.toFixed(2)),
    engagement: parseFloat(engagementScore.toFixed(2)),
    recency: parseFloat(recencyScore.toFixed(2)),
    creator: parseFloat(creatorScore.toFixed(2)),
    novelty: parseFloat(noveltyScore.toFixed(2)),
    boostMultiplier: parseFloat(boostMultiplier.toFixed(2)),
    reachPenalty: parseFloat(reachPenalty.toFixed(2)),
    sanctionApplied,
    global: Math.min(100, globalScore) // Cap à 100
  };
}

/**
 * Obtient les 6 blocs du feed avec pondérations adaptatives
 */
export async function getFeedBlocks(userId, weights = {}) {
  try {
    const user = await User.findById(userId).populate('following');
    
    if (!user) {
      console.error('Utilisateur non trouvé:', userId);
      return null;
    }
    
    // Poids par défaut
    const defaultWeights = {
      discovery: 0.30,
      subscriptions: 0.25,
      trends: 0.15,
      rising: 0.15,
      partnership: 0.10,
      surprise: 0.05
    };

    const finalWeights = { ...defaultWeights, ...weights };

    // 1️⃣ Découverte (comptes < 1000 followers, nouveaux)
    const followingIds = user.following?.map(f => f._id) || [];
    const excludedIds = [userId, ...followingIds];
    
    const discoveryPosts = await Post.find({
      author: { $nin: excludedIds }
    })
      .populate('author')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Filtrer : < 1000 followers et < 30j
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const filteredDiscovery = discoveryPosts.filter(p => {
      const followers = p.author?.followers?.length || 0;
      return followers < 1000 && new Date(p.createdAt) > thirtyDaysAgo;
    })
    // Prioritiser les 5 premiers posts des nouveaux créateurs
    .sort((a, b) => {
      const aStats = a.author?.stats?.totalPosts || 1;
      const bStats = b.author?.stats?.totalPosts || 1;
      // Les nouveaux posts prioritaires (rank = post number)
      const aRank = Math.min(aStats, 5);
      const bRank = Math.min(bStats, 5);
      return bRank - aRank;
    });

    // 2️⃣ Abonnements (suivis)
    const subscriptionsPosts = await Post.find({
      author: { $in: followingIds }
    })
      .populate('author')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // 3️⃣ Tendances (accélération rapide : likes/min, partages/min)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const trendsPosts = await Post.find({
      createdAt: { $gte: oneDayAgo }
    })
      .populate('author')
      .lean();

    // Calcul de l'accélération : engagement par heure
    const trendingWithAccel = trendsPosts.map(p => {
      const ageHours = (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60);
      const likes = p.likes?.length || 0;
      const shares = p.shares?.length || 0;
      const accel = (likes + shares) / Math.max(ageHours, 0.1);
      return { ...p, accel };
    }).sort((a, b) => b.accel - a.accel).slice(0, 50);

    // 4️⃣ Créateurs en montée
    const medianEngagement = 5;
    const risingPosts = await Post.find({
      author: { $nin: [userId] }
    })
      .populate('author')
      .lean();

    const risingWithScore = risingPosts
      .filter(p => {
        const followers = p.author?.followers?.length || 0;
        const likes = p.likes?.length || 0;
        const comments = p.comments?.length || 0;
        const engagement = likes + comments;
        return followers >= 100 && followers < 100000 && engagement > medianEngagement;
      })
      .sort((a, b) => {
        const likesA = a.likes?.length || 0;
        const commentsA = a.comments?.length || 0;
        const likesB = b.likes?.length || 0;
        const commentsB = b.comments?.length || 0;
        return (likesB + commentsB) - (likesA + commentsA);
      })
      .slice(0, 50);

    // 5️⃣ Partenariats / Pro
    const partnershipPosts = await Post.find({
      isPartnership: true
    })
      .populate('author')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // 6️⃣ Surprise
    const surprisePosts = await Post.find({})
      .populate('author')
      .sort({ _id: -1 })
      .limit(30)
      .lean();

    return {
      discovery: filteredDiscovery,
      subscriptions: subscriptionsPosts,
      trends: trendingWithAccel.map(p => ({ ...p, accel: undefined })),
      rising: risingWithScore,
      partnership: partnershipPosts,
      surprise: surprisePosts,
      weights: finalWeights
    };
  } catch (error) {
    console.error('Erreur getFeedBlocks:', error);
    throw error;
  }
}

/**
 * Compose le feed final en mélangeant les 6 blocs
 */
export async function composeFeed(userId, blocks, limit = 20) {
  if (!blocks) return [];
  
  const weights = blocks.weights || {};
  
  // Calcul du nombre de posts par bloc selon poids
  const distribution = {
    discovery: Math.ceil(limit * (weights.discovery || 0.30)),
    subscriptions: Math.ceil(limit * (weights.subscriptions || 0.25)),
    trends: Math.ceil(limit * (weights.trends || 0.15)),
    rising: Math.ceil(limit * (weights.rising || 0.15)),
    partnership: Math.ceil(limit * (weights.partnership || 0.10)),
    surprise: Math.ceil(limit * (weights.surprise || 0.05))
  };

  const feed = [];
  const seenPostIds = new Set(); // Pour éviter les doublons

  // Tirage proportionnel
  const orderedNames = [
    'subscriptions', 'discovery', 'trends', 'rising', 'partnership', 'surprise'
  ];

  for (const blockName of orderedNames) {
    const count = distribution[blockName] || 0;
    const blockPosts = blocks[blockName] || [];
    
    for (const post of blockPosts) {
      if (post && post._id && !seenPostIds.has(post._id.toString())) {
        seenPostIds.add(post._id.toString());
        feed.push({
          ...post,
          _reason: blockName,
          _sponsor: post.isPartnership || false
        });
        
        if (feed.length >= limit) break;
      }
    }
    
    if (feed.length >= limit) break;
  }

  // Limitation strict : max 1/10 partenariat
  let sponsorCount = 0;
  const maxSponsors = Math.ceil(limit / 10);
  const filteredFeed = feed.filter(p => {
    if (p._sponsor) {
      if (sponsorCount < maxSponsors) {
        sponsorCount++;
        return true;
      }
      return false;
    }
    return true;
  });

  return filteredFeed.slice(0, limit);
}

/**
 * Helper : calcule l'engagement médian des utilisateurs
 */
function calculateMedianEngagement(users) {
  const engagements = users
    .map(u => u.followers?.length || 0)
    .sort((a, b) => a - b);
  
  return engagements[Math.floor(engagements.length / 2)] || 0;
}

/**
 * Enregistre une exposition de post pour le tracking
 */
export async function recordPostExposure(postId, userId, source) {
  await Post.findByIdAndUpdate(
    postId,
    {
      $push: {
        'feedExposed.exposureHistory': {
          userId,
          exposedAt: new Date(),
          source
        }
      },
      $inc: { 'feedExposed.totalExposures': 1 }
    },
    { new: true }
  );
}
