import mongoose from 'mongoose';

const ballSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  matchId: { type: String, required: true, index: true },
  inningsNum: { type: Number, required: true },
  ballIndex: { type: Number, required: true },
  overNum: { type: Number, required: true },
  ballNum: { type: Number, required: true },
  striker: { type: String, required: true },
  nonStriker: { type: String, required: true },
  bowler: { type: String, required: true },
  runsBat: { type: Number, default: 0 },
  isWide: { type: Boolean, default: false },
  isNoBall: { type: Boolean, default: false },
  isBye: { type: Boolean, default: false },
  isLegBye: { type: Boolean, default: false },
  extraRuns: { type: Number, default: 0 },
  isWicket: { type: Boolean, default: false },
  dismissalType: { type: String, default: null },
  dismissedPlayer: { type: String, default: null },
  fielder: { type: String, default: null },
  nextBatter: { type: String, default: null },
  nextBowler: { type: String, default: null },
  timestamp: { type: Number, default: () => Date.now() }
}, {
  collection: 'balls',
  timestamps: true
});

export const Ball = mongoose.model('Ball', ballSchema);
