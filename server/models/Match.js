import mongoose from 'mongoose';

const teamSnapshotSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    shortName: { type: String },
    logo: { type: String },
    color: { type: String }
  },
  { _id: false }
);

const playerSnapshotSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    isManual: { type: Boolean, default: false }
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema({
  fixtureId: {
    type: String,
    required: false
  },
  teamA: {
    type: teamSnapshotSchema,
    required: true
  },
  teamB: {
    type: teamSnapshotSchema,
    required: true
  },
  playingXI: {
    teamA: [playerSnapshotSchema],
    teamB: [playerSnapshotSchema]
  },
  oversLimit: {
    type: Number,
    required: true
  },
  playersPerSide: {
    type: Number,
    default: 11
  },
  tossWinnerId: {
    type: String
  },
  tossDecision: {
    type: String,
    enum: ['bat', 'bowl']
  },
  status: {
    type: String,
    enum: ['not_started', 'live', 'completed'],
    default: 'live'
  },
  winnerId: {
    type: String
  },
  currentInnings: {
    type: Number,
    default: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Match = mongoose.models.Match || mongoose.model('Match', matchSchema);

export default Match;
