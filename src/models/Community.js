import mongoose from 'mongoose';

const communitySchema = new mongoose.Schema({
  // Informations de base
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  avatar: {
    type: String,
    default: null
  },
  banner: {
    type: String,
    default: null
  },
  
  // Type de communauté
  type: {
    type: String,
    enum: ['open', 'creator', 'premium'],
    required: true
  },
  
  // Catégorie (pour les communautés ouvertes)
  category: {
    type: String,
    enum: ['gaming', 'creation', 'music', 'business', 'humor', 'learning', 'lifestyle', 'tech', 'sport', 'other'],
    default: 'other'
  },
  
  // Créateur de la communauté
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Membres et rôles
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'animator', 'creator'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Statistiques
  stats: {
    memberCount: {
      type: Number,
      default: 0
    },
    postCount: {
      type: Number,
      default: 0
    },
    activeMembers: {
      type: Number,
      default: 0
    },
    averageLevel: {
      type: String,
      enum: ['Nouveau', 'Bronze', 'Argent', 'Platine'],
      default: 'Nouveau'
    }
  },
  
  // Paramètres d'accès
  access: {
    isPublic: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    isPremium: {
      type: Boolean,
      default: false
    },
    price: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Règles
  rules: [{
    title: String,
    description: String
  }],
  
  // Badges et statuts
  badges: [{
    type: String,
    enum: ['trending', 'growing', 'verified', 'official', 'new']
  }],
  
  // Activité
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  
  // Modération
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index pour recherche et performance
communitySchema.index({ slug: 1 });
communitySchema.index({ type: 1, category: 1 });
communitySchema.index({ 'stats.memberCount': -1 });
communitySchema.index({ creator: 1 });
communitySchema.index({ lastActivityAt: -1 });

// Méthodes
communitySchema.methods.isMember = function(userId) {
  return this.members.some(m => m.user.equals(userId));
};

communitySchema.methods.getMemberRole = function(userId) {
  const member = this.members.find(m => m.user.equals(userId));
  return member ? member.role : null;
};

communitySchema.methods.canPost = function(userId) {
  return this.isMember(userId);
};

communitySchema.methods.canModerate = function(userId) {
  const role = this.getMemberRole(userId);
  return ['moderator', 'animator', 'creator'].includes(role);
};

communitySchema.methods.toPublicProfile = function() {
  return {
    _id: this._id,
    name: this.name,
    slug: this.slug,
    description: this.description,
    avatar: this.avatar,
    banner: this.banner,
    type: this.type,
    category: this.category,
    stats: this.stats,
    access: this.access,
    badges: this.badges,
    createdAt: this.createdAt
  };
};

export default mongoose.model('Community', communitySchema);
