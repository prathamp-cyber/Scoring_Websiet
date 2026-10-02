import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  tournamentName: { type: String, default: 'MAPL 2026' },
  groupLabel: { type: String, default: 'Match' },
  ground: { type: String, default: 'Sun Valley Ground' },
  city: { type: String, default: 'Gandhidham' },
  details: { type: String, default: '' },
  date: { type: String, default: '' },
  time: { type: String, default: '' },
  totalOvers: { type: Number, default: 20 },
  playersPerSide: { type: Number, default: 11 },

  // Snapshot at creation time so live match is unaffected by later auction data changes
  teamA: {
    id: { type: String, default: null },
    name: { type: String, required: true },
    shortName: { type: String, default: '' },
    logo: { type: String, default: '' },
    logoColor: { type: String, default: '#dc2626' },
    logoText: { type: String, default: 'A' },
    squad: [{ type: String }]
  },
  teamB: {
    id: { type: String, default: null },
    name: { type: String, required: true },
    shortName: { type: String, default: '' },
    logo: { type: String, default: '' },
    logoColor: { type: String, default: '#059669' },
    logoText: { type: String, default: 'B' },
    squad: [{ type: String }]
  },

  tossWinner: { type: String, default: '' },
  tossChoice: { type: String, default: 'bat' },
  pinHash: { type: String, required: true },
  activeScorerToken: { type: String, default: null },
  status: { type: String, enum: ['upcoming', 'live', 'completed'], default: 'live' },
  resultText: { type: String, default: null },
  createdAt: { type: Number, default: () => Date.now() }
}, {
  collection: 'matches',
  timestamps: true
});

export const Match = mongoose.model('Match', matchSchema);
