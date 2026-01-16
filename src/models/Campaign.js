import mongoose from 'mongoose';

const CampaignSchema = new mongoose.Schema({
  advertiser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 140 },
  objective: { type: String, enum: ['visibilité', 'conversions', 'branding', 'lancement'], default: 'branding' },
  budget: { type: Number, default: 0 }, // en cents
  currency: { type: String, default: 'USD' },
  formats: [{ type: String, enum: ['post', 'video', 'live', 'story', 'serie'] }],
  themes: [{ type: String, trim: true }],
  country: { type: String, trim: true },
  language: { type: String, trim: true },
  brief: { type: String, trim: true, maxlength: 5000 },
  deliverables: [{ type: String, trim: true }],
  deadline: { type: Date },
  requirements: { type: String, trim: true, maxlength: 2000 },
  status: { type: String, enum: ['draft', 'active', 'closed'], default: 'draft' },
  tracking: {
    utm: { type: String, trim: true },
    pixels: [{ type: String, trim: true }]
  },
  perfSnapshot: {
    reach: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 }
  }
}, { timestamps: true });

export default mongoose.model('Campaign', CampaignSchema);
