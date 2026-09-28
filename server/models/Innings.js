import mongoose from 'mongoose';

const inningsSchema = new mongoose.Schema({
  matchId: {
    type: String,
    required: true
  },
  battingTeamId: {
    type: String,
    required: true
  },
  bowlingTeamId: {
    type: String,
    required: true
  },
  inningsNumber: {
    type: Number,
    required: true
  },
  totalRuns: {
    type: Number,
    default: 0
  },
  totalWickets: {
    type: Number,
    default: 0
  },
  totalOvers: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed'],
    default: 'in_progress'
  }
});

const Innings = mongoose.models.Innings || mongoose.model('Innings', inningsSchema);

export default Innings;
