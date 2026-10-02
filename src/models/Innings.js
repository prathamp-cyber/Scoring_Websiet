import mongoose from 'mongoose';

const inningsSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  matchId: { type: String, required: true, index: true },
  inningsNum: { type: Number, required: true },
  battingTeam: { type: String, required: true },
  bowlingTeam: { type: String, required: true },
  target: { type: Number, default: null },
  openingBatter1: { type: String, default: '' },
  openingBatter2: { type: String, default: '' },
  openingBowler: { type: String, default: '' },
  isCompleted: { type: Boolean, default: false },
  createdAt: { type: Number, default: () => Date.now() }
}, {
  collection: 'innings',
  timestamps: true
});

export const Innings = mongoose.model('Innings', inningsSchema);
