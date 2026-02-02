import mongoose from 'mongoose';

const directMessageSchema = new mongoose.Schema(
  {
    // Référence à la conversation
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MessageThread',
      required: true,
      index: true
    },

    // Expéditeur
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    // Contenu du message
    content: {
      type: String,
      maxlength: 5000,
      required: true
    },

    // Type de contenu
    type: {
      type: String,
      enum: ['text', 'image', 'audio', 'file', 'system'],
      default: 'text'
    },

    // Médias/pièces jointes
    attachments: [
      {
        url: String,
        type: String, // image, audio, pdf, etc.
        filename: String,
        size: Number, // en bytes
        duration: Number // pour audio, en secondes
      }
    ],

    // Réaction aux messages (emojis)
    reactions: [
      {
        emoji: String,
        userId: mongoose.Schema.Types.ObjectId,
        createdAt: {
          type: Date,
          default: () => new Date()
        }
      }
    ],

    // État de lecture
    readBy: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        readAt: Date
      }
    ],

    // Métadonnées
    edited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    editHistory: [
      {
        content: String,
        editedAt: Date
      }
    ],

    // Épinglé dans la conversation
    pinned: {
      type: Boolean,
      default: false
    },
    pinnedAt: Date,

    // Suppression douce
    deleted: {
      type: Boolean,
      default: false
    },
    deletedAt: Date,
    deletedBy: mongoose.Schema.Types.ObjectId,

    // Modération
    flaggedAsInappropriate: {
      type: Boolean,
      default: false
    },
    reportedCount: {
      type: Number,
      default: 0
    },

    // Message système (avis automatique)
    isSystemMessage: {
      type: Boolean,
      default: false
    },
    systemType: String // 'user_joined', 'request_accepted', etc.
  },
  { timestamps: true }
);

// Indexes
directMessageSchema.index({ threadId: 1, createdAt: -1 });
directMessageSchema.index({ sender: 1, createdAt: -1 });
directMessageSchema.index({ threadId: 1, readBy: 1 });

export default mongoose.model('DirectMessage', directMessageSchema);
