import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    // Destinataire
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    // Qui a déclenché la notification
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    // Type de notification
    type: {
      type: String,
      enum: [
        'contact_request',          // Nouvelle demande Inside
        'contact_accepted',         // Demande acceptée
        'contact_declined',         // Demande refusée
        'new_message',              // Nouveau message Inside
        'message_pinned',           // Message épinglé
        'new_follower',             // Nouveau suivi
        'post_liked',               // Like sur un post
        'post_commented',           // Commentaire sur un post
        'post_shared',              // Post partagé
        'mentioned',                // Mentionné dans commentaire
        'partnership_proposal',     // Proposition de partenariat
        'partnership_accepted',     // Partenariat accepté
        'badge_earned',             // Badge obtenu
        'milestone_reached',        // Jalon atteint (1k followers, etc.)
        'creator_tips',             // Conseil de créateur
        'opportunity',              // Opportunité business
        'system'                    // Notification système
      ],
      required: true,
      index: true
    },

    // Catégorie (pour groupage)
    category: {
      type: String,
      enum: ['messaging', 'engagement', 'partnership', 'milestones', 'system'],
      default: 'system'
    },

    // Titre court
    title: {
      type: String,
      maxlength: 100,
      required: true
    },

    // Description longue
    description: {
      type: String,
      maxlength: 500
    },

    // Données contextuelles
    data: {
      // Pour contact_request/message
      threadId: mongoose.Schema.Types.ObjectId,
      messageId: mongoose.Schema.Types.ObjectId,
      
      // Pour post actions
      postId: mongoose.Schema.Types.ObjectId,
      
      // Pour partnership
      opportunityId: mongoose.Schema.Types.ObjectId,
      
      // Champs additionnels
      actionUrl: String,           // Où cliquer pour agir
      iconUrl: String,
      thumbnail: String
    },

    // État de lecture
    read: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: Date,

    // Groupable (plusieurs notifications du même type groupées)
    groupKey: String,              // Ex: "post_123_likes" pour grouper likes
    groupCount: {
      type: Number,
      default: 1                   // Nombre d'événements groupés
    },

    // Actions possibles
    actions: [
      {
        label: String,              // "Accepter", "Répondre", etc.
        action: String,             // "accept", "reply", etc.
        url: String
      }
    ],

    // Priorité de notification
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
      index: true
    },

    // Configuration de la notification
    sendPush: {
      type: Boolean,
      default: true
    },
    sendEmail: {
      type: Boolean,
      default: false
    },

    // Quand envoyer
    scheduledFor: Date,            // Si null, envoyer immédiatement

    // Pour marquer comme "ignorée"
    dismissed: {
      type: Boolean,
      default: false
    },
    dismissedAt: Date,

    // Expiration (certaines notif disparaissent)
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
    }
  },
  { timestamps: true }
);

// Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, category: 1, read: 1 });
notificationSchema.index({ groupKey: 1, recipient: 1 });

// TTL index pour suppression auto après 30 jours
notificationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export default mongoose.model('Notification', notificationSchema);
