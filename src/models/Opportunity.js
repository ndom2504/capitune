import mongoose from 'mongoose';

const OpportunitySchema = new mongoose.Schema({
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['invited', 'accepted', 'declined', 'negotiating'], default: 'invited' },
  offerAmount: { type: Number, default: 0 }, // en cents
  currency: { type: String, default: 'USD' },
  message: { type: String, trim: true, maxlength: 2000 },
  requirements: { type: String, trim: true, maxlength: 2000 },
  deadline: { type: Date },
  negotiationNotes: { type: String, trim: true, maxlength: 2000 }
}, { timestamps: true });

export default mongoose.model('Opportunity', OpportunitySchema);
