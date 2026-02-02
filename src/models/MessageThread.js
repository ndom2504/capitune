import mongoose from 'mongoose';

const messageThreadSchema = new mongoose.Schema(
  {
    // Participants (toujours 2)
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    ],

    // Qui a créé cette conversation
    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Type de conversation
    type: {
      type: String,
      enum: ['direct', 'opportunity', 'partnership'],
      default: 'direct',
      index: true
    },

    // Dernier message
    lastMessage: String,
    lastMessageAt: Date,
    lastMessageSenderId: mongoose.Schema.Types.ObjectId,

    // Marquer comme lu par participant
    readBy: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        readAt: Date
      }
    ],

    // Paramètres pour chaque participant
    settings: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        muted: {
          type: Boolean,
          default: false
        },
        archived: {
          type: Boolean,
          default: false
        },
        blocked: {
          type: Boolean,
          default: false
        },
        pinned: {
          type: Boolean,
          default: false
        }
      }
    ],

    // Si c'est une opportunité business
    opportunityDetails: {
      title: String,
      description: String,
      budget: mongoose.Schema.Types.Decimal128,
      deadline: Date,
      category: String
    },

    // Messages épinglés
    pinnedMessages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DirectMessage'
      }
    ],

    // Métadonnées
    messageCount: {
      type: Number,
      default: 0,
      index: true
    },

    // Supprimer après inactivité (optionnel)
    autoDeleteAfterDays: {
      type: Number,
      default: null
    },
    lastActivityAt: {
      type: Date,
      default: () => new Date(),
      index: true
    }
  },
  { timestamps: true }
);

// Indexes
messageThreadSchema.index({ participants: 1, createdAt: -1 });
messageThreadSchema.index({ 'participants.0': 1, 'participants.1': 1 });
messageThreadSchema.index({ lastActivityAt: -1 });

export default mongoose.model('MessageThread', messageThreadSchema);
