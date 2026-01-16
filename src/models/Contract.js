import mongoose from 'mongoose';

const ContractSchema = new mongoose.Schema({
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  opportunity: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' },
  advertiser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, default: 0 }, // en cents
  commission: { type: Number, default: 0.15 }, // 15% par défaut
  currency: { type: String, default: 'USD' },
  deliverables: [{ type: String, trim: true }],
  deadline: { type: Date },
  sponsoredMentionRequired: { type: Boolean, default: true },
  paymentTerms: { type: String, trim: true, default: 'Paiement à validation livrable' },
  status: { type: String, enum: ['draft', 'signed', 'delivered', 'approved', 'paid'], default: 'draft' },
  signedByAdvertiser: { type: Boolean, default: false },
  signedByCreator: { type: Boolean, default: false },
  signedAt: { type: Date },
  deliveryLinks: [{ type: String, trim: true }],
  deliveredAt: { type: Date },
  approvedAt: { type: Date },
  paidAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('Contract', ContractSchema);
