import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ensureAbsoluteUrl } from '../utils/urlHelper.js';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  fullName: {
    type: String,
    trim: true,
    maxlength: 80,
    default: ''
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  bio: {
    type: String,
    maxlength: 300,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  links: [
    {
      type: String,
      trim: true,
      maxlength: 200
    }
  ],
  badgesVisibility: {
    showLevel: {
      type: Boolean,
      default: true
    }
  },
  banner: {
    type: String,
    default: ''
  },
  spiritualPath: {
    type: String,
    maxlength: 100,
    default: '' // Ex: "Bouddhisme zen", "Yoga", "Méditation laïque"
  },
  category: {
    type: String,
    enum: ['Régulier', 'Créateur', 'Professionnel', 'À développer', 'Créatrice', 'Penseur', 'Visionnaire', 'Entrepreneur', 'Philosophe', 'Autre', 'Créateur de contenu', 'Partenaire'],
    default: 'Régulier' // Type de compte (anciennes valeurs maintenues pour compatibilité)
  },
  roles: {
    type: [{ type: String, enum: ['user', 'creator', 'advertiser', 'admin'] }],
    default: ['user']
  },
  visibility: {
    profile: {
      type: String,
      enum: ['public', 'private', 'limited'],
      default: 'public'
    }
  },
  interests: [{ type: String, trim: true, maxlength: 60 }],
  feedPrefs: {
    contentTypes: {
      video: { type: Boolean, default: true },
      image: { type: Boolean, default: true },
      text: { type: Boolean, default: true }
    },
    mood: {
      fun: { type: Boolean, default: true },
      pro: { type: Boolean, default: true }
    },
    blockedKeywords: [{ type: String, trim: true, maxlength: 60 }],
    blockedAccounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    resetAt: { type: Date, default: null }
  },
  notifications: {
    inApp: {
      likes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      follows: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      lives: { type: Boolean, default: true }
    },
    push: {
      likes: { type: Boolean, default: false },
      comments: { type: Boolean, default: false },
      follows: { type: Boolean, default: false },
      mentions: { type: Boolean, default: false },
      lives: { type: Boolean, default: false }
    },
    quietHours: {
      start: { type: String, default: '' },
      end: { type: String, default: '' }
    }
  },
  appPrefs: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    textSize: { type: String, enum: ['sm', 'md', 'lg'], default: 'md' },
    language: { type: String, enum: ['fr', 'en'], default: 'fr' },
    autoDownloadVideos: { type: Boolean, default: false },
    dataSaver: { type: Boolean, default: false }
  },
  monetization: {
    revenueBalance: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    payout: {
      method: { type: String, enum: ['none', 'iban', 'paypal'], default: 'none' },
      iban: { type: String, trim: true, maxlength: 42 },
      paypalEmail: { type: String, trim: true, maxlength: 120 },
      threshold: { type: Number, default: 20 },
      frequency: { type: String, enum: ['weekly', 'monthly', 'manual'], default: 'monthly' }
    },
    toggles: {
      adsEnabled: { type: Boolean, default: false },
      paidSubs: { type: Boolean, default: false },
      tipsEnabled: { type: Boolean, default: true }
    }
  },
  partnerships: {
    creator: {
      acceptPartnerships: { type: Boolean, default: false },
      allowedCategories: [{ type: String, trim: true, maxlength: 60 }],
      rateCardHint: { type: String, trim: true, maxlength: 120 }
    },
    advertiser: {
      monthlyBudgetMax: { type: Number, default: 0 },
      targetCategories: [{ type: String, trim: true, maxlength: 60 }],
      adFrequency: { type: String, trim: true, maxlength: 40 }
    }
  },
  onboardingStatus: {
    step: { type: Number, default: 1 },
    completed: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now }
  },
  twoFAEnabled: {
    type: Boolean,
    default: false
  },
  birthDate: {
    type: Date,
    default: null
  },
  commentsWho: {
    type: String,
    enum: ['all', 'followers', 'none'],
    default: 'all'
  },
  messagesWho: {
    type: String,
    enum: ['all', 'followers', 'none'],
    default: 'all'
  },
  mentionsWho: {
    type: String,
    enum: ['all', 'followers', 'none'],
    default: 'all'
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  phoneNumber: {
    type: String,
    sparse: true,
    trim: true,
    default: null
  },
  phoneHash: {
    type: String,
    sparse: true,
    index: true,
    default: null
  },
  isOnline: {
    type: Boolean,
    default: false,
    index: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  partners: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  blockedAccounts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  badges: [{
    type: {
      type: String,
      enum: ['rising', 'engagement', 'regular', 'partner', 'recommended', 'trusted', 'excellence'],
      required: true
    },
    label: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    earnedAt: {
      type: Date,
      default: Date.now
    },
    auto: {
      type: Boolean,
      default: true
    }
  }],
  // Stats pour calcul automatique des badges
  stats: {
    lastPostDates: [{ type: Date }], // Derniers posts pour badge regular
    followerGrowth: [{
      date: { type: Date },
      count: { type: Number }
    }], // Croissance pour badge rising
    totalLikes: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
    totalPosts: { type: Number, default: 0 },
    lastBadgeUpdate: { type: Date, default: Date.now }
  },
  // Parcours créateur
  creatorPhase: {
    type: String,
    enum: ['nouveau', 'bronze', 'argent', 'platine'],
    default: 'nouveau'
  },
  creatorJoinedAt: {
    type: Date,
    default: Date.now
  },
  firstPostAt: {
    type: Date,
    default: null
  },
  // Détection anti-bot
  suspiciousActivity: {
    type: Boolean,
    default: false,
    index: true
  },
  growthPattern: {
    type: String,
    enum: ['normal', 'abnormal', 'suspicious'],
    default: 'normal'
  },
  lastAnomalyCheck: {
    type: Date,
    default: Date.now
  },
  anomalyFlags: [{
    type: String,
    enum: ['spike_followers', 'inconsistent_engagement', 'inactive_with_followers', 'fake_interaction_network', 'rapid_follow_unfollow']
  }],
  // Sanctions & pénalités (silencieuses)
  reducedReach: {
    type: Boolean,
    default: false,
    index: true
  },
  reachPenalty: {
    type: Number,
    default: 1.0, // Multiplicateur : 0.5 = -50%, 0.3 = -70%
    min: 0,
    max: 1
  },
  monetizationEligible: {
    type: Boolean,
    default: true,
    index: true
  },
  sanctions: [{
    type: {
      type: String,
      enum: ['reach_reduction', 'monetization_block', 'badge_removal']
    },
    reason: String,
    appliedAt: { type: Date, default: Date.now },
    level: { type: String, enum: ['warning', 'moderate', 'severe'] },
    expiresAt: Date
  }],
  // Paramètres Inside (messagerie)
  insideSettings: {
    allowDirectMessages: {
      type: Boolean,
      default: true
    },
    allowPartnershipOnly: {
      type: Boolean,
      default: false
    },
    allowedIntentions: {
      type: [String],
      enum: ['discussion', 'collaboration', 'partnership', 'question'],
      default: ['discussion', 'collaboration', 'partnership', 'question']
    },
    paidMessagesEnabled: {
      type: Boolean,
      default: false
    },
    paidMessagePrice: {
      type: Number,
      default: 0,
      min: 0
    },
    blockedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    allowedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }
}, {
  timestamps: true
});

// Hash le mot de passe avant sauvegarde
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour calculer la phase créateur basée sur les abonnés
userSchema.methods.getCreatorPhase = function() {
  const followerCount = this.followers?.length || 0;
  if (followerCount >= 100000) return 'argent';
  if (followerCount >= 1000) return 'bronze';
  return 'nouveau';
};

// Méthode pour obtenir le profil public
userSchema.methods.toPublicProfile = function() {
  return {
    _id: this._id,
    username: this.username,
    fullName: this.fullName,
    bio: this.bio,
    links: this.links || [],
    badgesVisibility: {
      showLevel: this.badgesVisibility?.showLevel ?? true
    },
    avatar: ensureAbsoluteUrl(this.avatar),
    banner: ensureAbsoluteUrl(this.banner),
    spiritualPath: this.spiritualPath,
    category: this.category,
    roles: this.roles && this.roles.length ? this.roles : ['user'],
    visibility: this.visibility || { profile: 'public' },
    interests: this.interests || [],
    badges: this.badges || [],
    creatorPhase: this.getCreatorPhase(),
    followersCount: this.followers?.length || 0,
    followingCount: this.following?.length || 0,
    createdAt: this.createdAt
  };
};

export default mongoose.model('User', userSchema);
