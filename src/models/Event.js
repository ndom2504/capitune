import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  // Informations de base
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  thumbnail: {
    type: String,
    default: null
  },
  
  // Type d'événement
  type: {
    type: String,
    enum: ['live', 'challenge', 'launch', 'meetup', 'workshop'],
    required: true
  },
  
  // Type de live (si applicable)
  liveType: {
    type: String,
    enum: ['free', 'premium', 'sponsored', 'community'],
    default: null
  },
  
  // Créateur(s)
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coHosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Communauté associée
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    default: null
  },
  
  // Planification
  scheduledAt: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // en minutes
    required: true,
    min: 5,
    max: 480 // 8 heures max
  },
  timezone: {
    type: String,
    default: 'Europe/Paris'
  },
  
  // Accès et monétisation
  access: {
    isFree: {
      type: Boolean,
      default: true
    },
    price: {
      type: Number,
      default: 0,
      min: 0
    },
    requiresSubscription: {
      type: Boolean,
      default: false
    }
  },
  
  // Sponsoring
  sponsor: {
    isSponsored: {
      type: Boolean,
      default: false
    },
    sponsorName: String,
    sponsorLogo: String,
    sponsorCTA: {
      text: String,
      url: String
    }
  },
  
  // Statut
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended', 'cancelled'],
    default: 'scheduled'
  },
  
  // Live stream data
  streamData: {
    streamKey: String,
    streamUrl: String,
    viewerCount: {
      type: Number,
      default: 0
    },
    peakViewers: {
      type: Number,
      default: 0
    },
    startedAt: Date,
    endedAt: Date
  },
  
  // Participants
  registrations: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    hasPaid: {
      type: Boolean,
      default: false
    },
    attended: {
      type: Boolean,
      default: false
    }
  }],
  
  // Stats
  stats: {
    registrationCount: {
      type: Number,
      default: 0
    },
    attendeeCount: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    },
    chatMessages: {
      type: Number,
      default: 0
    }
  },
  
  // Replay
  replay: {
    isAvailable: {
      type: Boolean,
      default: false
    },
    url: String,
    isPremium: {
      type: Boolean,
      default: false
    },
    expiresAt: Date
  },
  
  // Modération
  moderation: {
    chatEnabled: {
      type: Boolean,
      default: true
    },
    slowMode: {
      type: Boolean,
      default: false
    },
    slowModeDelay: {
      type: Number,
      default: 5 // secondes
    },
    moderators: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  
  // Notifications
  notificationsSent: {
    type: Boolean,
    default: false
  },
  
  // Métadonnées
  tags: [String],
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

// Index
eventSchema.index({ creator: 1, scheduledAt: -1 });
eventSchema.index({ community: 1, scheduledAt: -1 });
eventSchema.index({ status: 1, scheduledAt: 1 });
eventSchema.index({ 'stats.registrationCount': -1 });
eventSchema.index({ scheduledAt: 1 });

// Méthodes
eventSchema.methods.isRegistered = function(userId) {
  return this.registrations.some(r => r.user.equals(userId));
};

eventSchema.methods.canAccess = function(userId) {
  if (this.access.isFree) return true;
  const registration = this.registrations.find(r => r.user.equals(userId));
  return registration && registration.hasPaid;
};

eventSchema.methods.start = function() {
  this.status = 'live';
  this.streamData.startedAt = new Date();
  return this.save();
};

eventSchema.methods.end = function() {
  this.status = 'ended';
  this.streamData.endedAt = new Date();
  return this.save();
};

eventSchema.methods.toPublicProfile = function() {
  return {
    _id: this._id,
    title: this.title,
    description: this.description,
    thumbnail: this.thumbnail,
    type: this.type,
    liveType: this.liveType,
    creator: this.creator,
    coHosts: this.coHosts,
    community: this.community,
    scheduledAt: this.scheduledAt,
    duration: this.duration,
    access: this.access,
    sponsor: this.sponsor,
    status: this.status,
    stats: this.stats,
    tags: this.tags,
    createdAt: this.createdAt
  };
};

export default mongoose.model('Event', eventSchema);
