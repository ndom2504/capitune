import express from 'express';
import { authenticate } from '../middleware/auth.js';
import MonetizationProfile from '../models/MonetizationProfile.js';
import User from '../models/User.js';
import Post from '../models/Post.js';

const router = express.Router();

// Obtenir le profil de monétisation
router.get('/profile', authenticate, async (req, res) => {
  try {
    let profile = await MonetizationProfile.findOne({ user: req.user._id });
    
    if (!profile) {
      // Créer un profil par défaut
      profile = await MonetizationProfile.create({
        user: req.user._id
      });
    }
    
    // Recalculer le score
    profile.calculateScore();
    await profile.checkEligibility();
    await profile.save();
    
    res.json(profile);
  } catch (error) {
    console.error('Erreur profil monétisation:', error);
    res.status(500).json({ message: 'Erreur lors du chargement du profil' });
  }
});

// Obtenir les statistiques détaillées
router.get('/stats', authenticate, async (req, res) => {
  try {
    const profile = await MonetizationProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }
    
    // Récupérer les posts du créateur
    const posts = await Post.find({ author: req.user._id });
    
    // Calculer les métriques
    const totalViews = posts.reduce((sum, p) => sum + (p.metrics?.views || 0), 0);
    const totalComments = posts.reduce((sum, p) => sum + (p.comments?.length || 0), 0);
    const totalShares = posts.reduce((sum, p) => sum + (p.shares?.length || 0), 0);
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes?.length || 0), 0);
    
    // Revenus par mois (30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTransactions = profile.transactions.filter(
      t => t.timestamp >= thirtyDaysAgo && t.amount > 0
    );
    
    const earningsLast30Days = recentTransactions.reduce(
      (sum, t) => sum + t.amount, 0
    );
    
    res.json({
      overview: {
        totalEarnings: profile.earnings.total,
        balance: profile.balance,
        withdrawn: profile.withdrawn,
        earningsLast30Days
      },
      monetizationScore: profile.monetizationScore,
      metrics: {
        totalViews,
        totalComments,
        totalShares,
        totalLikes,
        postsCount: posts.length
      },
      eligibility: {
        isEligible: profile.isEligible,
        isVerified: profile.isVerified,
        scoreOk: profile.monetizationScore.total >= 50,
        followersOk: req.user.followersCount >= 100000
      }
    });
  } catch (error) {
    console.error('Erreur stats:', error);
    res.status(500).json({ message: 'Erreur lors du chargement des stats' });
  }
});

// Historique des transactions
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const profile = await MonetizationProfile.findOne({ user: req.user._id })
      .populate('transactions.relatedPost', 'content createdAt');
    
    if (!profile) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }
    
    // Trier par date décroissante
    const transactions = profile.transactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice((page - 1) * limit, page * limit);
    
    res.json({
      transactions,
      total: profile.transactions.length,
      page: parseInt(page),
      pages: Math.ceil(profile.transactions.length / limit)
    });
  } catch (error) {
    console.error('Erreur transactions:', error);
    res.status(500).json({ message: 'Erreur lors du chargement des transactions' });
  }
});

// Demander un retrait
router.post('/withdraw', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Montant invalide' });
    }
    
    const profile = await MonetizationProfile.findOne({ user: req.user._id });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }
    
    if (!profile.isEligible) {
      return res.status(403).json({ message: 'Non éligible à la monétisation' });
    }
    
    if (!profile.paymentInfo?.method) {
      return res.status(400).json({ message: 'Configurez vos infos de paiement' });
    }
    
    await profile.withdraw(amount);
    
    res.json({ 
      message: 'Retrait demandé',
      newBalance: profile.balance 
    });
  } catch (error) {
    console.error('Erreur retrait:', error);
    res.status(400).json({ message: error.message });
  }
});

// Configurer les infos de paiement
router.put('/payment-info', authenticate, async (req, res) => {
  try {
    const { method, email, iban, walletAddress } = req.body;
    
    let profile = await MonetizationProfile.findOne({ user: req.user._id });
    
    if (!profile) {
      profile = await MonetizationProfile.create({ user: req.user._id });
    }
    
    profile.paymentInfo = {
      method,
      email,
      iban,
      walletAddress
    };
    
    await profile.save();
    
    res.json({ message: 'Infos de paiement enregistrées' });
  } catch (error) {
    console.error('Erreur config paiement:', error);
    res.status(500).json({ message: 'Erreur lors de la configuration' });
  }
});

// Recalculer le score manuellement (admin ou cron)
router.post('/recalculate', authenticate, async (req, res) => {
  try {
    const profile = await MonetizationProfile.findOne({ user: req.user._id });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }
    
    // Recalculer les métriques depuis les posts
    const posts = await Post.find({ author: req.user._id });
    
    // Moyenne temps de vision
    const totalDwellTime = posts.reduce((sum, p) => sum + (p.metrics?.dwellTime || 0), 0);
    profile.metrics.avgViewTime = posts.length > 0 ? totalDwellTime / posts.length : 0;
    
    // Abonnés actifs (ceux qui ont interagi dans les 30 derniers jours)
    profile.metrics.activeSubscribers = req.user.followersCount || 0;
    
    // Commentaires de qualité (>10 caractères)
    profile.metrics.qualityComments = posts.reduce((sum, p) => {
      return sum + (p.comments?.filter(c => c.content.length > 10).length || 0);
    }, 0);
    
    // Partages
    profile.metrics.shares = posts.reduce((sum, p) => sum + (p.shares?.length || 0), 0);
    
    // Posts dernier mois
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);
    profile.metrics.postsLastMonth = posts.filter(p => p.createdAt >= lastMonth).length;
    
    // Recalculer le score
    profile.calculateScore();
    await profile.checkEligibility();
    await profile.save();
    
    res.json({ 
      message: 'Score recalculé',
      score: profile.monetizationScore 
    });
  } catch (error) {
    console.error('Erreur recalcul:', error);
    res.status(500).json({ message: 'Erreur lors du recalcul' });
  }
});

export default router;
