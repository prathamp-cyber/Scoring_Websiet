import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Match, Innings } from '../models/index.js';
import { resolveAllFixtures } from './fixtureResolver.js';
import {
  getOrCreateMatch,
  initMatchFromDb,
  recordBall,
  undoLastBall,
  selectBowler,
  setInitialPlayers
} from './matchStore.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Enable CORS for Express HTTP routes
app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));

app.use(express.json());

// Attach Socket.io server to the same HTTP server instance
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.io connection and room join handler
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Join match room handler
  socket.on('join_match', async (data) => {
    const matchId = typeof data === 'string' ? data : data?.matchId;
    if (!matchId) return;

    socket.join(matchId);
    console.log(`[Socket.io] Socket ${socket.id} joined room: ${matchId}`);

    // If match is in DB, ensure in-memory store initialized from DB
    try {
      if (mongoose.Types.ObjectId.isValid(matchId)) {
        const dbMatch = await Match.findById(matchId).lean();
        if (dbMatch) {
          initMatchFromDb(dbMatch);
        }
      }
    } catch (e) {
      console.error(`[Socket.io] Error loading match ${matchId} from DB:`, e.message);
    }

    const match = getOrCreateMatch(matchId);
    socket.emit('score_update', match.state);
  });

  // Record ball socket event handler
  socket.on('record_ball', (payload) => {
    const { matchId } = payload || {};
    if (!matchId) return;

    const updatedState = recordBall(matchId, payload);
    io.to(matchId).emit('score_update', updatedState);
  });

  // Undo ball socket event handler
  socket.on('undo_ball', (payload) => {
    const matchId = typeof payload === 'string' ? payload : payload?.matchId;
    if (!matchId) return;

    const updatedState = undoLastBall(matchId);
    io.to(matchId).emit('score_update', updatedState);
  });

  // Select bowler socket event handler
  socket.on('select_bowler', (payload) => {
    const { matchId, bowlerId } = payload || {};
    if (!matchId || !bowlerId) return;

    const updatedState = selectBowler(matchId, bowlerId);
    io.to(matchId).emit('score_update', updatedState);
  });

  // Init match players handler
  socket.on('init_match', (payload) => {
    const { matchId, strikerId, nonStrikerId, bowlerId } = payload || {};
    if (!matchId) return;

    const updatedState = setInitialPlayers(matchId, { strikerId, nonStrikerId, bowlerId });
    io.to(matchId).emit('score_update', updatedState);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Live Scoring System', timestamp: new Date().toISOString() });
});

// Read-only API Endpoints from auctionstates
app.get('/api/teams', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const doc = await db.collection('auctionstates').findOne({}, { projection: { teams: 1 } });
    const rawTeams = doc?.teams || [];
    const teams = rawTeams.map((t) => ({
      id: String(t.id),
      name: t.name,
      shortName: t.shortName,
      logo: t.logo,
      color: t.color
    }));
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/teams/:teamId/players', async (req, res) => {
  try {
    const { teamId } = req.params;
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const doc = await db.collection('auctionstates').findOne({}, { projection: { players: 1 } });
    const rawPlayers = doc?.players || [];
    const teamPlayers = rawPlayers
      .filter((p) => String(p.teamId) === String(teamId))
      .map((p) => ({
        id: String(p.id),
        name: p.name,
        specifications: p.specifications || []
      }));
    res.json(teamPlayers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/fixtures', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const doc = await db.collection('auctionstates').findOne({}, { projection: { teams: 1, tournamentMatches: 1 } });
    const rawTeams = doc?.teams || [];
    const rawMatches = doc?.tournamentMatches || [];

    const { fixtures } = resolveAllFixtures(rawMatches, rawTeams);
    res.json(fixtures);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/matches - Create Match in our own 'matches' collection
app.post('/api/matches', async (req, res) => {
  try {
    const {
      fixtureId,
      teamA,
      teamB,
      oversLimit,
      playersPerSide,
      tossWinnerId,
      tossDecision,
      playingXI
    } = req.body;

    if (!teamA || !teamB || !oversLimit || !tossWinnerId || !tossDecision) {
      return res.status(400).json({ error: 'Missing required match setup parameters' });
    }

    // 1. Create Match document in matches collection
    const newMatch = new Match({
      fixtureId: fixtureId || null,
      teamA,
      teamB,
      oversLimit: Number(oversLimit),
      playersPerSide: Number(playersPerSide || 11),
      tossWinnerId,
      tossDecision,
      playingXI,
      status: 'live',
      createdAt: new Date()
    });

    const savedMatch = await newMatch.save();
    const matchId = String(savedMatch._id);

    // 2. Determine Innings 1 Batting and Bowling teams
    let battingTeamId = teamA.id;
    let bowlingTeamId = teamB.id;

    if (tossWinnerId === teamA.id) {
      if (tossDecision === 'bowl') {
        battingTeamId = teamB.id;
        bowlingTeamId = teamA.id;
      }
    } else {
      if (tossDecision === 'bat') {
        battingTeamId = teamB.id;
        bowlingTeamId = teamA.id;
      }
    }

    // 3. Create Innings 1 document in innings collection
    const firstInnings = new Innings({
      matchId,
      battingTeamId,
      bowlingTeamId,
      inningsNumber: 1,
      status: 'in_progress'
    });

    await firstInnings.save();

    // 4. Initialize in-memory scoring store for immediate socket access
    initMatchFromDb(savedMatch.toObject());

    console.log(`[Matches] Created new match ID: ${matchId} in 'matches' collection`);
    return res.status(201).json({ matchId });
  } catch (err) {
    console.error('[Matches] Error creating match:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/matches/:matchId - Get stored match snapshot
app.get('/api/matches/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;

    // Check DB first
    if (mongoose.Types.ObjectId.isValid(matchId)) {
      const dbMatch = await Match.findById(matchId).lean();
      if (dbMatch) {
        return res.json(dbMatch);
      }
    }

    // Fallback to in-memory match state if present
    const memoryMatch = matchesStore.get(matchId);
    if (memoryMatch) {
      return res.json(memoryMatch.matchData);
    }

    return res.status(404).json({ error: 'Match not found' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/balls Endpoint
app.post('/api/balls', (req, res) => {
  const { matchId, runsScored, extraType, isWicket, wicketType, dismissedPlayerId, newBatsmanId, newBowlerId } = req.body;
  if (!matchId) {
    return res.status(400).json({ error: 'matchId is required' });
  }

  const updatedState = recordBall(matchId, {
    runsScored,
    extraType,
    isWicket,
    wicketType,
    dismissedPlayerId,
    newBatsmanId,
    newBowlerId
  });

  io.to(matchId).emit('score_update', updatedState);
  return res.json({ success: true, state: updatedState });
});

// POST /api/balls/undo Endpoint
app.post('/api/balls/undo', (req, res) => {
  const { matchId } = req.body;
  if (!matchId) {
    return res.status(400).json({ error: 'matchId is required' });
  }

  const updatedState = undoLastBall(matchId);
  io.to(matchId).emit('score_update', updatedState);
  return res.json({ success: true, state: updatedState });
});

// Startup Fixture Resolution Log
const logStartupFixtures = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) return;
    const doc = await db.collection('auctionstates').findOne({}, { projection: { teams: 1, tournamentMatches: 1 } });
    const teams = doc?.teams || [];
    const matches = doc?.tournamentMatches || [];
    const { resolvedCount, totalSlots, unresolvedNames } = resolveAllFixtures(matches, teams);
    console.log(`[Startup Audit] Fixtures resolved ${resolvedCount}/${totalSlots}, unresolved: ${JSON.stringify(unresolvedNames)}`);
  } catch (err) {
    console.error('[Startup Audit] Fixture log error:', err.message);
  }
};

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('[MongoDB] Connected successfully');
      logStartupFixtures();
    })
    .catch((err) => console.error('[MongoDB] Connection error:', err));
}

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`[Server] Live Scoring Server running on port ${PORT}`);
  console.log(`[Socket.io] Ready and attached to HTTP server on port ${PORT}`);
  console.log(`[CORS] Allowed origin set to ${allowedOrigin}`);
});

export { app, httpServer, io };
