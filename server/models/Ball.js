import mongoose from 'mongoose';

const ballSchema = new mongoose.Schema({
  matchId: {
    type: String,
    required: true
  },
  inningsId: {
    type: String,
    required: true
  },
  overNumber: {
    type: Number,
    required: true
  },
  ballNumber: {
    type: Number,
    required: true
  },
  strikerId: {
    type: String,
    required: true
  },
  nonStrikerId: {
    type: String,
    required: true
  },
  bowlerId: {
    type: String,
    required: true
  },
  runsScored: {
    type: Number,
    default: 0
  },
  extraType: {
    type: String,
    enum: ['none', 'wide', 'noball', 'bye', 'legbye'],
    default: 'none'
  },
  extraRuns: {
    type: Number,
    default: 0
  },
  isWicket: {
    type: Boolean,
    default: false
  },
  wicketType: {
    type: String
  },
  dismissedPlayerId: {
    type: String
  },
  newBatsmanId: {
    type: String
  }
});

const Ball = mongoose.models.Ball || mongoose.model('Ball', ballSchema);

export default Ball;
