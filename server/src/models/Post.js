import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    maxlength: 2000,
    default: ''
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'short', 'live', 'audio', 'exclusive', 'partnership'],
    default: 'text'
  },
  format: {
    type: String,
    enum: ['text', 'image', 'video', 'short', 'live', 'audio', 'exclusive', 'partnership'],
    default: 'text'
  },
  isExclusive: {
    type: Boolean,
    default: false
  },
  isPartnership: {
    type: Boolean,
    default: false
  },
  isLive: {
    type: Boolean,
    default: false
  },
  isAudio: {
    type: Boolean,
    default: false
  },
  media: {
    url: String,
    caption: String
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  shares: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    maxlength: 30
  }],
  description: {
    type: String,
    maxlength: 50000
  },
  isDraft: {
    type: Boolean,
    default: false
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  endedAt: {
    type: Date
  },
  isShared: {
    type: Boolean,
    default: false
  },
  originalPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  // Métriques d'engagement
  metrics: {
    views: { type: Number, default: 0 },
    peakViewers: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 }, // % de vidéo regardée
    dwellTime: { type: Number, default: 0 }, // ms moyen
    loopCount: { type: Number, default: 0 }, // boucles vidéo
    skipCount: { type: Number, default: 0 }, // skips
    zoomCount: { type: Number, default: 0 }, // zooms image
    carouselSwipes: { type: Number, default: 0 },
    saves: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    viewedBy: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      viewedAt: { type: Date, default: Date.now },
      dwellTime: { type: Number, default: 0 },
      completed: { type: Boolean, default: false }
    }],
    lastEngagementAt: { type: Date, default: Date.now }
  },
  // Scoring & classement
  score: {
    quality: { type: Number, default: 0 }, // 0-1
    engagement: { type: Number, default: 0 }, // 0-1
    recency: { type: Number, default: 0 }, // 0-1
    creator: { type: Number, default: 0 }, // 0-1
    novelty: { type: Number, default: 0 }, // 0-1
    global: { type: Number, default: 0 } // 0-100
  },
  // Tracking pour le feed
  feedExposed: {
    totalExposures: { type: Number, default: 0 },
    uniqueUsers: { type: Number, default: 0 },
    exposureHistory: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      exposedAt: { type: Date, default: Date.now },
      source: { type: String, enum: ['discovery', 'subscriptions', 'trends', 'rising', 'partnership', 'surprise'] }
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index pour optimiser les recherches
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ 'score.global': -1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ 'metrics.views': -1 });

export default mongoose.model('Post', postSchema);
