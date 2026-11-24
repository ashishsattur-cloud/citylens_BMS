import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  referenceId: { type: String, unique: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, trim: true, maxlength: 1500 },
  category: { type: String, enum: ['footpath', 'blocked', 'crossing', 'pothole', 'accessibility'], required: true },
  status: { type: String, enum: ['reported', 'in_progress', 'resolved', 'rejected'], default: 'reported', index: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
    address: { type: String, required: true, trim: true },
    locality: { type: String, default: 'Bengaluru', trim: true },
    ward: { type: String, default: 'Pending assignment', trim: true }
  },
  photos: [{ url: String, publicId: String }],
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reporterName: { type: String, default: 'Community member', trim: true },
  impactLevel: { type: String, enum: ['low', 'moderate', 'high', 'critical'], default: 'moderate' },
  peopleAffected: { type: Number, min: 1, max: 1000000, default: 10 },
  criticalLocation: { type: String, enum: ['none', 'residential', 'market', 'school', 'transit', 'hospital', 'emergency'], default: 'none' },
  severity: {
    score: { type: Number, min: 0, max: 100, default: 0 },
    level: { type: String, enum: ['low', 'moderate', 'high', 'critical'], default: 'low' },
    nearbyReportsCount: { type: Number, default: 0 },
    factors: {
      impact: { type: Number, default: 0 },
      peopleAffected: { type: Number, default: 0 },
      nearbyReports: { type: Number, default: 0 },
      duration: { type: Number, default: 0 },
      criticalLocation: { type: Number, default: 0 }
    },
    explanation: [{ factor: String, contribution: Number, detail: String }],
    calculatedAt: Date
  },
  supporters: { type: Number, default: 0, min: 0 },
  resolvedAt: Date
}, { timestamps: true });

reportSchema.index({ location: '2dsphere' });
reportSchema.index({ category: 1, status: 1, createdAt: -1 });
reportSchema.index({ 'severity.score': -1 });

export default mongoose.model('Report', reportSchema);
