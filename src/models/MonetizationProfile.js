import mongoose from 'mongoose';

const monetizationProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Éligibilité
  isEligible: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  hasSanctions: {
    type: Boolean,
    default: false
  },
  
  // Score de monétisation (0-100)
  monetizationScore: {
    total: { type: Number, default: 0, min: 0, max: 100 },
    retention: { type: Number, default: 0 }, // R × 0.35
    engagement: { type: Number, default: 0 }, // E × 0.30
    trust: { type: Number, default: 0 }, // T × 0.20
    stability: { type: Number, default: 0 } // S × 0.15
  },
  
  // Métriques pour calcul SM
  metrics: {
    avgViewTime: { type: Number, default: 0 }, // secondes
    activeSubscribers: { type: Number, default: 0 },
    qualityComments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    reports: { type: Number, default: 0 },
    postsLastMonth: { type: Number, default: 0 }
  },
  
  // Revenus par source (en centimes)
  earnings: {
    advertising: { type: Number, default: 0 },
    subscriptions: { type: Number, default: 0 },
    tips: { type: Number, default: 0 },
    liveTickets: { type: Number, default: 0 },
    partnerships: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  
  // Revenus retirés
  withdrawn: {
    type: Number,
    default: 0
  },
  
  // Balance disponible
  balance: {
    type: Number,
    default: 0
  },
  
  // Historique des transactions
  transactions: [{
    type: {
      type: String,
      enum: ['advertising', 'subscription', 'tip', 'live_ticket', 'partnership', 'withdrawal', 'bonus']
    },
    amount: { type: Number, required: true },
    description: String,
    timestamp: { type: Date, default: Date.now },
    relatedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }
  }],
  
  // Bonus actifs
  activeBonuses: [{
    type: {
      type: String,
      enum: ['level_progression', 'excellence', 'visibility_boost']
    },
    multiplier: { type: Number, default: 1.0 },
    expiresAt: Date,
    description: String
  }],
  
  // Configuration paiement
  paymentInfo: {
    method: {
      type: String,
      enum: ['paypal', 'bank_transfer', 'crypto']
    },
    email: String,
    iban: String,
    walletAddress: String
  },
  
  // Historique de niveau
  levelHistory: [{
    level: String,
    reachedAt: Date,
    bonusAwarded: Boolean
  }],
  
  lastCalculated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index pour requêtes fréquentes
monetizationProfileSchema.index({ user: 1 });
monetizationProfileSchema.index({ isEligible: 1, 'monetizationScore.total': -1 });

// Méthode pour calculer l'éligibilité
monetizationProfileSchema.methods.checkEligibility = async function() {
  const user = await mongoose.model('User').findById(this.user);
  const followersCount = user?.followersCount || 0;
  
  // Argent+ (100k+) requis
  const hasMinFollowers = followersCount >= 100000;
  const qualityOk = this.monetizationScore.total >= 50;
  
  this.isEligible = hasMinFollowers && this.isVerified && !this.hasSanctions && qualityOk;
  return this.isEligible;
};

// Méthode pour calculer le score de monétisation
monetizationProfileSchema.methods.calculateScore = function() {
  // R - Rétention (0-100)
  const retention = Math.min(100, (
    (this.metrics.avgViewTime / 300) * 50 + // max 5min = 50pts
    (this.metrics.activeSubscribers / 1000) * 50 // 1k actifs = 50pts
  ));
  
  // E - Engagement (0-100)
  const engagement = Math.min(100, (
    (this.metrics.qualityComments / 100) * 50 +
    (this.metrics.shares / 50) * 50
  ));
  
  // T - Trust (0-100)
  const trust = Math.max(0, 100 - (this.metrics.reports * 10));
  
  // S - Stabilité (0-100)
  const stability = Math.min(100, (this.metrics.postsLastMonth / 20) * 100);
  
  // Formule finale
  this.monetizationScore.retention = retention * 0.35;
  this.monetizationScore.engagement = engagement * 0.30;
  this.monetizationScore.trust = trust * 0.20;
  this.monetizationScore.stability = stability * 0.15;
  
  this.monetizationScore.total = 
    this.monetizationScore.retention +
    this.monetizationScore.engagement +
    this.monetizationScore.trust +
    this.monetizationScore.stability;
  
  this.lastCalculated = new Date();
  return this.monetizationScore.total;
};

// Méthode pour ajouter une transaction
monetizationProfileSchema.methods.addEarning = function(type, amount, description, relatedPost = null) {
  this.transactions.push({
    type,
    amount,
    description,
    relatedPost
  });
  
  this.earnings[type] += amount;
  this.earnings.total += amount;
  this.balance += amount;
};

// Méthode pour retrait
monetizationProfileSchema.methods.withdraw = async function(amount) {
  if (amount > this.balance) {
    throw new Error('Solde insuffisant');
  }
  
  if (amount < 2000) { // Minimum 20$
    throw new Error('Montant minimum : 20$');
  }
  
  this.balance -= amount;
  this.withdrawn += amount;
  
  this.transactions.push({
    type: 'withdrawal',
    amount: -amount,
    description: `Retrait vers ${this.paymentInfo.method}`
  });
  
  await this.save();
  return true;
};

const MonetizationProfile = mongoose.model('MonetizationProfile', monetizationProfileSchema);

export default MonetizationProfile;
