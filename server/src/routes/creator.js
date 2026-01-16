import express from 'express';
import Post from '../models/Post.js';
import User from '../models/User.js';
import MonetizationProfile from '../models/MonetizationProfile.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/creator/dashboard?period=7d|30d
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '7d' } = req.query;
    
    const days = period === '30d' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);

    // KPIs actuels
    const currentPosts = await Post.find({
      author: userId,
      createdAt: { $gte: startDate }
    });

    // KPIs période précédente
    const previousPosts = await Post.find({
      author: userId,
      createdAt: { $gte: previousStartDate, $lt: startDate }
    });

    const calcKPIs = (posts) => {
      const totalViews = posts.reduce((sum, p) => sum + (p.metrics?.views || 0), 0);
      const totalWatchTime = posts.reduce((sum, p) => sum + (p.metrics?.watchTime || 0), 0);
      const totalLikes = posts.reduce((sum, p) => sum + (p.metrics?.likes || 0), 0);
      const totalComments = posts.reduce((sum, p) => sum + (p.metrics?.comments || 0), 0);
      const totalShares = posts.reduce((sum, p) => sum + (p.metrics?.shares || 0), 0);
      
      const engagement = totalViews > 0 
        ? ((totalLikes + totalComments + totalShares) / totalViews) * 100 
        : 0;

      return {
        totalViews,
        totalWatchTime,
        avgEngagement: engagement,
        totalInteractions: totalLikes + totalComments + totalShares
      };
    };

    const currentKPIs = calcKPIs(currentPosts);
    const previousKPIs = calcKPIs(previousPosts);

    const calcChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Nouveaux abonnés
    const user = await User.findById(userId);
    const currentFollowers = user?.followersCount || 0;
    const newFollowers = Math.max(0, Math.floor(currentFollowers * 0.05)); // Estimation 5%
    
    // Monétisation
    const monetization = await MonetizationProfile.findOne({ userId });
    const revenue = monetization?.earnings?.total || 0;
    const previousRevenue = Math.floor(revenue * 0.85); // Estimation

    // Build KPIs response
    const kpis = {
      totalViews: currentKPIs.totalViews,
      viewsChange: calcChange(currentKPIs.totalViews, previousKPIs.totalViews),
      totalWatchTime: currentKPIs.totalWatchTime,
      watchTimeChange: calcChange(currentKPIs.totalWatchTime, previousKPIs.totalWatchTime),
      avgEngagement: currentKPIs.avgEngagement,
      engagementChange: calcChange(currentKPIs.avgEngagement, previousKPIs.avgEngagement),
      newFollowers,
      followersChange: 15, // Estimation
      revenue,
      revenueChange: calcChange(revenue, previousRevenue)
    };

    // Posts performance avec couleurs
    const avgEngagement = currentKPIs.avgEngagement;
    const postsData = currentPosts.slice(0, 10).map(post => {
      const views = post.metrics?.views || 0;
      const likes = post.metrics?.likes || 0;
      const comments = post.metrics?.comments || 0;
      const shares = post.metrics?.shares || 0;
      const watchTime = post.metrics?.watchTime || 0;
      
      const postEngagement = views > 0 
        ? ((likes + comments + shares) / views) * 100 
        : 0;

      return {
        type: post.type || 'post',
        reach: views,
        engagement: postEngagement,
        avgTime: watchTime / Math.max(views, 1),
        revenue: Math.floor(Math.random() * 1000), // Simulation
        sponsored: post.isSponsored || false
      };
    });

    // Insights automatiques
    const insights = [];
    if (currentPosts.length > 0) {
      const avgViewsPerPost = currentKPIs.totalViews / currentPosts.length;
      if (avgViewsPerPost > 1000) {
        insights.push("Tes posts performent au-dessus de la moyenne");
      }
      if (currentKPIs.avgEngagement > 5) {
        insights.push("Excellent taux d'engagement ! Continue comme ça");
      }
      const eveningPosts = currentPosts.filter(p => {
        const hour = new Date(p.createdAt).getHours();
        return hour >= 18 && hour <= 22;
      });
      if (eveningPosts.length > currentPosts.length / 2) {
        insights.push("Les posts publiés le soir engagent davantage");
      }
    }

    // Audience
    const audience = {
      newRatio: 35, // % nouveaux visiteurs
      activeRate: 68, // % abonnés actifs
      dailyGrowth: Math.floor(newFollowers / days),
      topCountries: ['France', 'Belgique', 'Canada'],
      peakHours: ['18', '20', '21']
    };

    // Monétisation détaillée
    const monetizationData = {
      score: monetization?.monetizationScore || { total: 0, retention: 0, engagement: 0, trust: 0, stability: 0 },
      scoreChange: 8,
      sources: [
        { name: 'Publicité', amount: monetization?.earnings?.ads || 0, percent: 40 },
        { name: 'Abonnements', amount: monetization?.earnings?.subscriptions || 0, percent: 30 },
        { name: 'Tips / Dons', amount: monetization?.earnings?.tips || 0, percent: 15 },
        { name: 'Lives payants', amount: monetization?.earnings?.live || 0, percent: 10 },
        { name: 'Partenariats', amount: monetization?.earnings?.partnerships || 0, percent: 5 }
      ],
      totalMonthly: revenue,
      recommendations: []
    };

    // Recommandations SM
    if (monetization) {
      if (monetization.monetizationScore.retention < 70) {
        monetizationData.recommendations.push("Publie plus régulièrement pour améliorer la rétention");
      }
      if (monetization.monetizationScore.engagement < 70) {
        monetizationData.recommendations.push("Réponds plus aux commentaires pour booster l'engagement");
      }
      if (monetization.monetizationScore.stability < 70) {
        monetizationData.recommendations.push("Maintiens un rythme de publication stable");
      }
    }

    // Opportunités (Argent+)
    const opportunities = {
      partnerships: [],
      recommendations: []
    };

    if (currentFollowers >= 100000) {
      opportunities.partnerships.push({
        brand: 'Nike Sports',
        description: 'Campagne collaboration fitness - jusqu\'à 5000$'
      });
      opportunities.partnerships.push({
        brand: 'TechBrand',
        description: 'Revue produit tech - 2500$ + produit offert'
      });

      if (!monetization?.paymentInfo?.iban) {
        opportunities.recommendations.push("Configure tes infos de paiement pour débloquer les retraits");
      }
      if (currentKPIs.avgEngagement > 5) {
        opportunities.recommendations.push("Ton engagement est élevé ! Active les abonnements payants");
      }
      opportunities.recommendations.push("Teste un Live pour augmenter ton revenu");
    }

    // Alertes
    const alerts = [];
    if (currentKPIs.totalViews > previousKPIs.totalViews * 1.5) {
      alerts.push({ type: 'success', message: '🔥 Pic de performance détecté ! Tes vues ont explosé' });
    }
    if (currentKPIs.avgEngagement < previousKPIs.avgEngagement * 0.7) {
      alerts.push({ type: 'warning', message: '⚠️ Baisse d\'engagement détectée' });
    }
    if (currentFollowers >= 100000 && !monetization?.isEligible) {
      alerts.push({ type: 'info', message: '💰 Tu es maintenant éligible à la monétisation !' });
    }
    if (monetization?.balance >= 2000) {
      alerts.push({ type: 'success', message: '💳 Paiement disponible ! Tu peux retirer tes gains' });
    }

    res.json({
      kpis,
      posts: postsData,
      avgEngagement: currentKPIs.avgEngagement,
      insights,
      audience,
      monetization: monetizationData,
      opportunities,
      alerts
    });

  } catch (error) {
    console.error('Erreur dashboard créateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;

