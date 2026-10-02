import mongoose from 'mongoose';

const ballAuditSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  matchId: { type: String, required: true, index: true },
  action: { type: String, required: true },
  detailsJson: { type: String, required: true },
  timestamp: { type: Number, default: () => Date.now() }
}, {
  collection: 'ballaudits',
  timestamps: true
});

export const BallAudit = mongoose.model('BallAudit', ballAuditSchema);
