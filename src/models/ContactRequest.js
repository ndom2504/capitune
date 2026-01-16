import mongoose from 'mongoose';

const contactRequestSchema = new mongoose.Schema(
  {
    // Expéditeur et destinataire
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    // Intention obligatoire
    intention: {
      type: String,
      enum: ['discussion', 'collaboration', 'partnership', 'question'],
      required: true
    },

    // Message court (280 caractères)
    message: {
      type: String,
      maxlength: 280,
      required: true
    },

    // État de la demande
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'blocked'],
      default: 'pending',
      index: true
    },

    // Actions de rejet/blocage
    declinedAt: Date,
    declinedReason: String, // Optionnel
    blockedAt: Date,

    // Si acceptée, crée un MessageThread
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MessageThread'
    },

    // Métadonnées
    senderLevel: {
      type: String,
      enum: ['Nouveau', 'Bronze', 'Argent', 'Or', 'Platinium'],
      index: true
    },

    // Vérification de spam
    flaggedAsSpam: {
      type: Boolean,
      default: false
    },

    // Pour les admins - signalement
    reportedCount: {
      type: Number,
      default: 0
    },

    // Marquer comme "Vu"
    viewedAt: Date,

    // Automatiquement expiré après 30 jours si pas d'action
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      index: true
    }
  },
  { timestamps: true }
);

// Index composés pour performances
contactRequestSchema.index({ to: 1, status: 1 });
contactRequestSchema.index({ from: 1, createdAt: -1 });
contactRequestSchema.index({ to: 1, createdAt: -1 });

// Nettoyer les demandes expirées
contactRequestSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export default mongoose.model('ContactRequest', contactRequestSchema);
