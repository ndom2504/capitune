import mongoose from 'mongoose';

const communityPostSchema = new mongoose.Schema({
  // Communauté
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },
  
  // Auteur
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Contenu
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  
  // Médias
  media: [{
    type: {
      type: String,
      enum: ['image', 'video', 'audio']
    },
    url: String,
    thumbnail: String
  }],
  
  // Type de post
  type: {
    type: String,
    enum: ['discussion', 'question', 'announcement', 'event', 'poll'],
    default: 'discussion'
  },
  
  // Poll (si applicable)
  poll: {
    question: String,
    options: [{
      text: String,
      votes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    }],
    endsAt: Date
  },
  
  // Engagement
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Stats
  stats: {
    likeCount: {
      type: Number,
      default: 0
    },
    commentCount: {
      type: Number,
      default: 0
    },
    viewCount: {
      type: Number,
      default: 0
    }
  },
  
  // Épinglé
  isPinned: {
    type: Boolean,
    default: false
  },
  
  // Modération
  isActive: {
    type: Boolean,
    default: true
  },
  reportCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index
communityPostSchema.index({ community: 1, createdAt: -1 });
communityPostSchema.index({ author: 1, createdAt: -1 });
communityPostSchema.index({ isPinned: -1, createdAt: -1 });

export default mongoose.model('CommunityPost', communityPostSchema);
