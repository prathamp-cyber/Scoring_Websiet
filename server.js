import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import crypto from 'crypto';
import cors from 'cors';

import { normalizeTeamName, TEAM_ALIASES } from './src/config/teamConfig.js';
import { Match } from './src/models/Match.js';
import { Innings } from './src/models/Innings.js';
import { Ball } from './src/models/Ball.js';
import { BallAudit } from './src/models/BallAudit.js';

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://samayagrawaldev_db_user:f1UOqEYluKLiLywf@playerauction.vyihe5e.mongodb.net/?appName=playerAuction';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

// PIN Hashing helper
function hashPin(pin) {
  return crypto.createHash('sha256').update(String(pin)).digest('hex');
}

// In-memory computed state cache: matchId -> cachedData
const matchCache = new Map();

// Helper to format overs display (e.g., 5 balls -> "0.5", 6 balls -> "1.0")
function formatOvers(legalBalls) {
  const overs = Math.floor(legalBalls / 6);
  const remainder = legalBalls % 6;
  return `${overs}.${remainder}`;
}

// Connect to MongoDB Atlas
console.log('Connecting to MongoDB Atlas...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB Atlas connection established.');
    seedDefaultData();
  })
  .catch(err => {
    console.error('MongoDB Atlas Connection Failure:', err);
  });

// PURE FUNCTION: computeMatchState(matchRecord, inningsList, ballsList)
export function computeMatchState(matchRecord, inningsList = [], ballsList = []) {
  const matchId = matchRecord.id;
  const teamA = matchRecord.teamA;
  const teamB = matchRecord.teamB;
  const totalOvers = matchRecord.totalOvers || 20;

  const currentInningsRecord = inningsList.find(i => !i.isCompleted) || inningsList[inningsList.length - 1] || null;
  const inningsNum = currentInningsRecord ? currentInningsRecord.inningsNum : 1;

  const inn1Record = inningsList.find(i => i.inningsNum === 1);
  const inn2Record = inningsList.find(i => i.inningsNum === 2);

  const battingTeamName = currentInningsRecord ? currentInningsRecord.battingTeam : teamA.name;
  const bowlingTeamName = currentInningsRecord ? currentInningsRecord.bowlingTeam : teamB.name;

  const battingTeamObj = teamA.name === battingTeamName ? teamA : teamB;
  const bowlingTeamObj = teamA.name === bowlingTeamName ? teamA : teamB;

  const isTeamABatting = teamA.name === battingTeamName;
  const isTeamBBatting = teamB.name === battingTeamName;

  const squadBat = battingTeamObj.squad && battingTeamObj.squad.length > 0
    ? battingTeamObj.squad
    : ['Batter 1', 'Batter 2', 'Batter 3', 'Batter 4', 'Batter 5', 'Batter 6', 'Batter 7', 'Batter 8', 'Batter 9', 'Batter 10', 'Batter 11'];

  const squadBowl = bowlingTeamObj.squad && bowlingTeamObj.squad.length > 0
    ? bowlingTeamObj.squad
    : ['Bowler 1', 'Bowler 2', 'Bowler 3', 'Bowler 4', 'Bowler 5'];

  // Process scorecard data for innings
  const buildInningsScorecard = (iNum, teamBatObj, teamBowlObj, innRec) => {
    if (!innRec && iNum === 2) return null;

    const innBalls = ballsList.filter(b => b.inningsNum === iNum);
    const batterMap = new Map();
    const bowlerMap = new Map();

    let currentStriker = innRec ? innRec.openingBatter1 : squadBat[0];
    let currentNonStriker = innRec ? innRec.openingBatter2 : squadBat[1];
    let currentBowlerName = innRec ? innRec.openingBowler : squadBowl[0];

    if (batterMap.has(currentStriker)) {
      const b = batterMap.get(currentStriker);
      b.hasBatted = true;
      b.isNotOut = true;
      b.dismissal = 'not out';
    }
    if (batterMap.has(currentNonStriker)) {
      const b = batterMap.get(currentNonStriker);
      b.hasBatted = true;
      b.isNotOut = true;
      b.dismissal = 'not out';
    }

    const fallOfWicketsArr = [];
    const commentaryList = [];
    const recentBallsList = [];
    let isFreeHit = false;

    innBalls.forEach((b) => {
      const isWide = Boolean(b.isWide);
      const isNoBall = Boolean(b.isNoBall);
      const isBye = Boolean(b.isBye);
      const isLegBye = Boolean(b.isLegBye);
      const isWicket = Boolean(b.isWicket);
      const runsBat = b.runsBat || 0;
      const extraRuns = b.extraRuns || 0;

      if (b.striker) currentStriker = b.striker;
      if (b.nonStriker) currentNonStriker = b.nonStriker;
      if (b.bowler) currentBowlerName = b.bowler;

      if (!batterMap.has(currentStriker)) {
        batterMap.set(currentStriker, { name: currentStriker, dismissal: 'not out', runs: 0, balls: 0, fours: 0, sixes: 0, sr: '0.00', isNotOut: true, hasBatted: true, order: 99 });
      }
      if (!batterMap.has(currentNonStriker)) {
        batterMap.set(currentNonStriker, { name: currentNonStriker, dismissal: 'not out', runs: 0, balls: 0, fours: 0, sixes: 0, sr: '0.00', isNotOut: true, hasBatted: true, order: 99 });
      }
      if (!bowlerMap.has(currentBowlerName)) {
        bowlerMap.set(currentBowlerName, { name: currentBowlerName, overs: '0.0', legalBalls: 0, maidens: 0, runs: 0, wickets: 0, econ: '0.00', wd: 0, nb: 0, overRuns: 0, overWickets: 0, hasBowled: true });
      }

      const strikerObj = batterMap.get(currentStriker);
      const bowlerObj = bowlerMap.get(currentBowlerName);
      strikerObj.hasBatted = true;
      bowlerObj.hasBowled = true;

      let ballTotalRuns = 0;
      let valLabel = String(runsBat);
      let ballType = 'dot';

      if (isWide) {
        const widePen = 1 + extraRuns;
        ballTotalRuns = widePen;
        bowlerObj.runs += widePen;
        bowlerObj.wd += 1;
        valLabel = widePen > 1 ? `${widePen}Wd` : 'Wd';
        ballType = 'wide';
      } else if (isNoBall) {
        const nbPen = 1 + runsBat + extraRuns;
        ballTotalRuns = nbPen;
        strikerObj.runs += runsBat;
        strikerObj.balls += 1;
        if (runsBat === 4) strikerObj.fours += 1;
        if (runsBat === 6) strikerObj.sixes += 1;
        bowlerObj.runs += nbPen;
        bowlerObj.nb += 1;
        valLabel = `Nb+${runsBat}`;
        ballType = 'noball';
        isFreeHit = true;
      } else if (isBye || isLegBye) {
        ballTotalRuns = extraRuns || 1;
        strikerObj.balls += 1;
        valLabel = isBye ? `${ballTotalRuns}B` : `${ballTotalRuns}LB`;
        ballType = 'bye';
      } else {
        ballTotalRuns = runsBat;
        strikerObj.runs += runsBat;
        strikerObj.balls += 1;
        if (runsBat === 4) { strikerObj.fours += 1; ballType = 'four'; }
        else if (runsBat === 6) { strikerObj.sixes += 1; ballType = 'six'; }
        else if (runsBat === 1) ballType = 'single';
        else if (runsBat === 2) ballType = 'double';
        else if (runsBat === 3) ballType = 'triple';

        bowlerObj.runs += runsBat;
        bowlerObj.legalBalls += 1;
        isFreeHit = false;
      }

      if (strikerObj.balls > 0) {
        strikerObj.sr = ((strikerObj.runs / strikerObj.balls) * 100).toFixed(2);
      }

      if (isWicket) {
        strikerObj.isNotOut = false;
        const dismissed = b.dismissedPlayer || currentStriker;
        const dObj = batterMap.get(dismissed) || strikerObj;
        dObj.isNotOut = false;

        const dType = b.dismissalType || 'bowled';
        const fielder = b.fielder ? ` c ${b.fielder}` : '';
        if (dType === 'bowled') dObj.dismissal = `b ${currentBowlerName}`;
        else if (dType === 'caught') dObj.dismissal = `c ${b.fielder || 'fielder'} b ${currentBowlerName}`;
        else if (dType === 'lbw') dObj.dismissal = `lbw b ${currentBowlerName}`;
        else if (dType === 'run_out') dObj.dismissal = `run out (${b.fielder || ''})`;
        else if (dType === 'stumped') dObj.dismissal = `stumped b ${currentBowlerName}`;
        else dObj.dismissal = `${dType} b ${currentBowlerName}`;

        if (dType !== 'run_out') {
          bowlerObj.wickets += 1;
        }

        const totalWicketsSoFar = Array.from(batterMap.values()).filter(x => !x.isNotOut).length;
        const currentTotalRuns = Array.from(batterMap.values()).reduce((acc, curr) => acc + curr.runs, 0) +
          Array.from(bowlerMap.values()).reduce((acc, curr) => acc + (curr.wd + curr.nb), 0);

        fallOfWicketsArr.push({
          score: currentTotalRuns,
          wicketNum: totalWicketsSoFar,
          player: dismissed,
          over: formatOvers(bowlerObj.legalBalls)
        });

        valLabel = 'W';
        ballType = 'wicket';
      }

      bowlerObj.overs = formatOvers(bowlerObj.legalBalls);
      const totalBowlerOversFloat = bowlerObj.legalBalls / 6;
      bowlerObj.econ = totalBowlerOversFloat > 0 ? (bowlerObj.runs / totalBowlerOversFloat).toFixed(2) : '0.00';

      const ballDisplayOver = formatOvers(b.ballIndex - 1);
      commentaryList.unshift({
        ball: ballDisplayOver,
        runs: ballTotalRuns,
        isWicket,
        isBoundary: runsBat === 4 || runsBat === 6,
        text: b.commentaryText || `${currentBowlerName} to ${currentStriker}, ${valLabel}`,
        type: ballType
      });

      recentBallsList.push({
        ball: ballDisplayOver,
        val: valLabel,
        type: ballType
      });
    });

    const battersList = Array.from(batterMap.values());
    const bowlersList = Array.from(bowlerMap.values());

    const totalRunsFromBat = battersList.reduce((acc, b) => acc + b.runs, 0);
    const totalWides = bowlersList.reduce((acc, b) => acc + b.wd, 0);
    const totalNoBalls = bowlersList.reduce((acc, b) => acc + b.nb, 0);
    const totalExtras = totalWides + totalNoBalls;
    const totalRuns = totalRunsFromBat + totalExtras;
    const totalWickets = battersList.filter(b => !b.isNotOut).length;

    const totalLegalBalls = bowlersList.reduce((acc, b) => acc + b.legalBalls, 0);
    const totalOversFormatted = formatOvers(totalLegalBalls);

    return {
      inningsNum: iNum,
      teamName: teamBatObj.name,
      shortName: teamBatObj.shortName,
      scoreText: `${totalRuns}/${totalWickets} (${totalOversFormatted} Ov)`,
      totalRuns,
      totalWickets,
      totalOversFormatted,
      totalLegalBalls,
      batting: battersList,
      bowling: bowlersList,
      extras: `${totalExtras} (w ${totalWides}, nb ${totalNoBalls})`,
      fallOfWickets: fallOfWicketsArr.map(f => `${f.score}-${f.wicketNum} (${f.player}, ${f.over} ov)`).join(', '),
      commentary: commentaryList,
      recentBalls: recentBallsList,
      currentStriker,
      currentNonStriker,
      currentBowlerName,
      isFreeHit: Boolean(isFreeHit)
    };
  };

  const inn1Data = buildInningsScorecard(1, isTeamABatting ? teamA : teamB, isTeamABatting ? teamB : teamA, inn1Record);
  const inn2Data = buildInningsScorecard(2, isTeamABatting ? teamB : teamA, isTeamABatting ? teamA : teamB, inn2Record);

  const activeInnData = inningsNum === 2 ? (inn2Data || inn1Data) : inn1Data;

  const currentBatters = activeInnData ? [
    activeInnData.batting.find(b => b.name === activeInnData.currentStriker) || { name: activeInnData.currentStriker || squadBat[0], runs: 0, balls: 0, fours: 0, sixes: 0, sr: '0.00', isStriker: true },
    activeInnData.batting.find(b => b.name === activeInnData.currentNonStriker) || { name: activeInnData.currentNonStriker || squadBat[1], runs: 0, balls: 0, fours: 0, sixes: 0, sr: '0.00', isStriker: false }
  ].map((b, i) => ({ ...b, isStriker: i === 0 })) : [];

  const currentBowler = activeInnData ? (activeInnData.bowling.find(b => b.name === activeInnData.currentBowlerName) || {
    name: activeInnData.currentBowlerName || squadBowl[0],
    overs: '0.0',
    maidens: 0,
    runs: 0,
    wickets: 0,
    econ: '0.00'
  }) : null;

  const currentPartnership = activeInnData ? {
    runs: currentBatters.reduce((acc, b) => acc + (b.runs || 0), 0),
    balls: currentBatters.reduce((acc, b) => acc + (b.balls || 0), 0)
  } : { runs: 0, balls: 0 };

  const currentRR = activeInnData && activeInnData.totalLegalBalls > 0
    ? ((activeInnData.totalRuns / (activeInnData.totalLegalBalls / 6))).toFixed(2)
    : '0.00';

  let requiredRR = '-';
  let chaseStatusText = null;
  let target = inn2Record ? inn2Record.target : null;

  if (inningsNum === 2 && target && activeInnData) {
    const runsNeeded = Math.max(0, target - activeInnData.totalRuns);
    const ballsRemaining = Math.max(0, (totalOvers * 6) - activeInnData.totalLegalBalls);
    if (ballsRemaining > 0 && runsNeeded > 0) {
      requiredRR = ((runsNeeded / (ballsRemaining / 6))).toFixed(2);
      chaseStatusText = `${battingTeamName} need ${runsNeeded} runs in ${ballsRemaining} balls (RRR ${requiredRR})`;
    } else if (runsNeeded === 0) {
      chaseStatusText = `${battingTeamName} won by ${10 - activeInnData.totalWickets} wickets!`;
    }
  }

  const projectedScore = activeInnData
    ? Math.round(Number(currentRR) * totalOvers)
    : 0;

  const teamAScoreText = isTeamABatting ? activeInnData.scoreText : (inn1Data && !isTeamABatting ? inn1Data.scoreText : 'Yet to bat');
  const teamBScoreText = isTeamBBatting ? activeInnData.scoreText : (inn1Data && !isTeamBBatting ? inn1Data.scoreText : 'Yet to bat');

  return {
    fullMatchState: {
      matchId,
      tournamentName: matchRecord.tournamentName || 'MAPL 2026',
      roundLabel: matchRecord.groupLabel || 'Quarter Final 1',
      status: matchRecord.status || 'live',
      ground: matchRecord.ground || 'Sun Valley Ground',
      city: matchRecord.city || 'Gandhidham',
      date: matchRecord.date || 'Today',
      time: matchRecord.time || 'Live',
      oversLabel: `${totalOvers} Ov.`,
      tossText: `${matchRecord.tossWinner} won the toss and elected to ${matchRecord.tossChoice}`,
      tossWinner: matchRecord.tossWinner,
      tossChoice: matchRecord.tossChoice,
      currentInningsIndex: inningsNum,
      chaseStatusText,
      resultText: matchRecord.resultText,
      teamA: {
        id: teamA.id,
        name: teamA.name,
        shortName: teamA.shortName,
        logoColor: teamA.logoColor,
        logoText: teamA.logoText,
        score: teamAScoreText,
        overs: isTeamABatting ? activeInnData.totalOversFormatted : (inn1Data && !isTeamABatting ? inn1Data.totalOversFormatted : '0.0'),
        hasBatted: isTeamABatting || (inn1Data && !isTeamABatting),
        isBatting: isTeamABatting,
        squad: teamA.squad
      },
      teamB: {
        id: teamB.id,
        name: teamB.name,
        shortName: teamB.shortName,
        logoColor: teamB.logoColor,
        logoText: teamB.logoText,
        score: teamBScoreText,
        overs: isTeamBBatting ? activeInnData.totalOversFormatted : (inn1Data && !isTeamBBatting ? inn1Data.totalOversFormatted : '0.0'),
        hasBatted: isTeamBBatting || (inn1Data && !isTeamBBatting),
        isBatting: isTeamBBatting,
        squad: teamB.squad
      },
      liveData: {
        currentBatters,
        currentBowler,
        currentPartnership,
        recentBalls: activeInnData ? activeInnData.recentBalls.slice(-12) : [],
        bannerText: chaseStatusText || `${battingTeamName} batting at ${currentRR} RR`,
        bannerType: inningsNum === 2 ? 'live_chase' : 'info',
        isFreeHit: activeInnData ? activeInnData.isFreeHit : false
      },
      scorecard: [
        inn1Data ? {
          inningsNum: 1,
          teamName: inn1Data.teamName,
          shortName: inn1Data.shortName,
          scoreText: inn1Data.scoreText,
          batting: inn1Data.batting,
          extras: inn1Data.extras,
          total: inn1Data.scoreText,
          fallOfWickets: inn1Data.fallOfWickets,
          bowling: inn1Data.bowling
        } : null,
        inn2Data ? {
          inningsNum: 2,
          teamName: inn2Data.teamName,
          shortName: inn2Data.shortName,
          scoreText: inn2Data.scoreText,
          batting: inn2Data.batting,
          extras: inn2Data.extras,
          total: inn2Data.scoreText,
          fallOfWickets: inn2Data.fallOfWickets,
          bowling: inn2Data.bowling
        } : null
      ].filter(Boolean),
      commentary: activeInnData ? activeInnData.commentary : [],
      squads: {
        teamA: { name: teamA.name, players: teamA.squad.map((p, idx) => ({ name: p, role: idx === 0 ? 'Captain & Batter' : 'Player' })) },
        teamB: { name: teamB.name, players: teamB.squad.map((p, idx) => ({ name: p, role: idx === 0 ? 'Captain & Batter' : 'Player' })) }
      },
      sidePanel: {
        currentRR,
        requiredRR,
        target: target ? String(target) : '-',
        projectedScore: String(projectedScore),
        seriesName: matchRecord.tournamentName || 'MAPL 2026',
        seriesLink: '#',
        matchDate: matchRecord.date || 'Today',
        location: `${matchRecord.ground}, ${matchRecord.city}`,
        locationLink: '#',
        lastUpdatedScorer: 'Official Umpire Panel',
        lastUpdatedTime: 'Just now'
      },
      scoringContext: {
        matchId,
        inningsNum,
        battingTeam: battingTeamName,
        bowlingTeam: bowlingTeamName,
        currentStriker: activeInnData ? activeInnData.currentStriker : squadBat[0],
        currentNonStriker: activeInnData ? activeInnData.currentNonStriker : squadBat[1],
        currentBowler: activeInnData ? activeInnData.currentBowlerName : squadBowl[0],
        squadBat,
        squadBowl,
        overComplete: activeInnData ? (activeInnData.totalLegalBalls > 0 && activeInnData.totalLegalBalls % 6 === 0) : false,
        wicketFallen: activeInnData && activeInnData.recentBalls.length > 0 && activeInnData.recentBalls[activeInnData.recentBalls.length - 1].type === 'wicket',
        isFreeHit: activeInnData ? activeInnData.isFreeHit : false
      }
    }
  };
}

// Helper: Rebuild full state from Mongoose models
async function getOrRebuildMatchState(matchId) {
  if (matchCache.has(matchId)) {
    return matchCache.get(matchId);
  }

  const matchRecord = await Match.findOne({ id: matchId }).lean();
  if (!matchRecord) return null;

  const inningsList = await Innings.find({ matchId }).sort({ inningsNum: 1 }).lean();
  const ballsList = await Ball.find({ matchId }).sort({ ballIndex: 1 }).lean();

  const computed = computeMatchState(matchRecord, inningsList, ballsList);
  matchCache.set(matchId, computed);
  return computed;
}

// Broadcast live match state via Socket.io
function broadcastMatchState(matchId) {
  getOrRebuildMatchState(matchId).then(computed => {
    if (computed) {
      io.to(matchId).emit('state', computed.fullMatchState);
    }
  }).catch(() => {});
}

function verifyScorerToken(matchRecord, token) {
  if (!matchRecord) return false;
  if (!matchRecord.activeScorerToken) return true;
  return matchRecord.activeScorerToken === token;
}

// -------------------------------------------------------------
// ENDPOINTS
// -------------------------------------------------------------

// 0. Lightweight Health Check for External Pingers (UptimeRobot / cron-job.org)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// 1. GET /api/teams - READ-ONLY from auctionstates collection
app.get('/api/teams', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const auctionStateDoc = await db.collection('auctionstates').findOne({});
    if (!auctionStateDoc || !auctionStateDoc.teams) {
      return res.json([]);
    }
    const teams = auctionStateDoc.teams.map(t => ({
      id: String(t.id),
      teamNumber: t.teamNumber,
      name: t.name,
      shortName: t.shortName || t.name.slice(0, 3).toUpperCase(),
      logo: t.logo || '',
      color: t.color || '#3b82f6',
      owner: t.owner || ''
    }));
    res.json(teams);
  } catch (err) {
    console.error('Error fetching teams from auctionstates:', err);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// 2. GET /api/teams/:teamId/players - READ-ONLY from players collection
app.get('/api/teams/:teamId/players', async (req, res) => {
  try {
    const { teamId } = req.params;
    const db = mongoose.connection.db;
    const playersList = await db.collection('players').find({ teamId: String(teamId) }).toArray();
    
    const formatted = playersList.map(p => ({
      id: String(p.id || p._id),
      name: p.name,
      specifications: p.specifications || [],
      photo: p.photo || '',
      status: p.status || 'SOLD'
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error('Error fetching players from players collection:', err);
    res.status(500).json({ error: 'Failed to fetch team players' });
  }
});

// 3. GET /api/fixtures - READ-ONLY from auctionstates collection with Alias Mapping
app.get('/api/fixtures', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const auctionStateDoc = await db.collection('auctionstates').findOne({});
    if (!auctionStateDoc || !auctionStateDoc.tournamentMatches) {
      return res.json([]);
    }

    const teams = auctionStateDoc.teams || [];
    const teamMap = new Map();
    teams.forEach(t => {
      const norm = normalizeTeamName(t.name);
      teamMap.set(norm, t);
    });

    let resolvedCount = 0;
    let unresolvedCount = 0;

    const enrichedFixtures = auctionStateDoc.tournamentMatches.map(m => {
      const raw1 = m.team1Name || '';
      const raw2 = m.team2Name || '';

      const norm1 = TEAM_ALIASES[normalizeTeamName(raw1)] || normalizeTeamName(raw1);
      const norm2 = TEAM_ALIASES[normalizeTeamName(raw2)] || normalizeTeamName(raw2);

      const teamAObj = teamMap.get(norm1) || null;
      const teamBObj = teamMap.get(norm2) || null;

      if (teamAObj && teamBObj) {
        resolvedCount++;
      } else {
        unresolvedCount++;
      }

      return {
        id: String(m.id || `tm-${m.matchNo}`),
        matchNo: m.matchNo,
        day: m.day,
        dateStr: m.dateStr,
        dayStr: m.dayStr,
        court: m.court,
        startTime: m.startTime,
        endTime: m.endTime,
        team1Name: raw1,
        team2Name: raw2,
        groupLabel: `Group ${m.group || 'A'} • Match ${m.matchNo}`,
        tournamentName: 'MAPL 2026',
        teamAId: teamAObj ? String(teamAObj.id) : null,
        teamBId: teamBObj ? String(teamBObj.id) : null,
        teamA: teamAObj ? teamAObj.name : raw1,
        teamB: teamBObj ? teamBObj.name : raw2
      };
    });

    console.log(`[GET /api/fixtures] Team Resolution: ${resolvedCount} resolved, ${unresolvedCount} unresolved out of ${enrichedFixtures.length} matches.`);
    res.json(enrichedFixtures);
  } catch (err) {
    console.error('Error fetching fixtures from auctionstates:', err);
    res.status(500).json({ error: 'Failed to fetch fixtures' });
  }
});

// 4. GET /api/matches - Fetch live/upcoming/completed matches from own 'matches' collection
app.get('/api/matches', async (req, res) => {
  try {
    const { view } = req.query;
    let filter = {};
    if (view && view !== 'all') {
      filter.status = view;
    }

    const matchesList = await Match.find(filter).sort({ createdAt: -1 }).lean();
    
    // Enrich with calculated scores
    const enriched = await Promise.all(matchesList.map(async (m) => {
      const state = await getOrRebuildMatchState(m.id);
      return state ? state.fullMatchState : m;
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Error fetching matches:', err);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// 5. GET /api/matches/:id/state - Full Match State
app.get('/api/matches/:id/state', async (req, res) => {
  try {
    const matchId = req.params.id;
    const computed = await getOrRebuildMatchState(matchId);
    if (!computed) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json(computed.fullMatchState);
  } catch (err) {
    console.error('Error fetching match state:', err);
    res.status(500).json({ error: 'Failed to fetch match state' });
  }
});

// 6. POST /api/matches/create - Create New Match (saves to own 'matches' & 'innings' collections)
app.post('/api/matches/create', async (req, res) => {
  try {
    const {
      matchId, tournamentName, groupLabel, ground, city, details, date, time,
      totalOvers, playersPerSide, teamA, teamB, tossWinner, tossChoice, pin
    } = req.body;

    if (!matchId || !teamA || !teamB || !pin) {
      return res.status(400).json({ error: 'Missing required match creation fields' });
    }

    const pinHash = hashPin(pin);
    const initialToken = `token-${matchId}-${Date.now()}`;

    const matchDoc = new Match({
      id: matchId,
      tournamentName: tournamentName || 'MAPL 2026',
      groupLabel: groupLabel || 'Quarter Final 1',
      ground: ground || 'Sun Valley Ground',
      city: city || 'Gandhidham',
      details: details || '',
      date: date || 'Today',
      time: time || 'Live',
      totalOvers: Number(totalOvers) || 20,
      playersPerSide: Number(playersPerSide) || 11,
      teamA: {
        id: teamA.id || null,
        name: teamA.name,
        shortName: teamA.shortName || teamA.name.slice(0, 3).toUpperCase(),
        logo: teamA.logo || '',
        logoColor: teamA.logoColor || '#dc2626',
        logoText: teamA.logoText || teamA.name.charAt(0),
        squad: teamA.squad || []
      },
      teamB: {
        id: teamB.id || null,
        name: teamB.name,
        shortName: teamB.shortName || teamB.name.slice(0, 3).toUpperCase(),
        logo: teamB.logo || '',
        logoColor: teamB.logoColor || '#059669',
        logoText: teamB.logoText || teamB.name.charAt(0),
        squad: teamB.squad || []
      },
      tossWinner: tossWinner || teamA.name,
      tossChoice: tossChoice || 'bat',
      pinHash,
      activeScorerToken: initialToken,
      status: 'live'
    });

    await matchDoc.save();

    const firstBatting = tossChoice === 'bat' ? tossWinner : (tossWinner === teamA.name ? teamB.name : teamA.name);
    const firstBowling = firstBatting === teamA.name ? teamB.name : teamA.name;
    const squadBat = firstBatting === teamA.name ? teamA.squad : teamB.squad;
    const squadBowl = firstBowling === teamA.name ? teamA.squad : teamB.squad;

    const inningsDoc = new Innings({
      id: `${matchId}-inn1`,
      matchId,
      inningsNum: 1,
      battingTeam: firstBatting,
      bowlingTeam: firstBowling,
      target: null,
      openingBatter1: squadBat[0] || 'Batter 1',
      openingBatter2: squadBat[1] || 'Batter 2',
      openingBowler: squadBowl[0] || 'Bowler 1',
      isCompleted: false
    });

    await inningsDoc.save();

    matchCache.delete(matchId);
    const computed = await getOrRebuildMatchState(matchId);

    res.json({
      success: true,
      matchId,
      token: initialToken,
      state: computed.fullMatchState
    });
  } catch (err) {
    console.error('Error creating match:', err);
    res.status(500).json({ error: err.message || 'Failed to create match' });
  }
});

// 7. POST /api/matches/:id/auth - Scorer PIN Auth
app.post('/api/matches/:id/auth', async (req, res) => {
  try {
    const matchId = req.params.id;
    const { pin } = req.body;

    const matchRecord = await Match.findOne({ id: matchId }).lean();
    if (!matchRecord) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const inputHash = hashPin(pin);
    if (matchRecord.pinHash !== inputHash) {
      return res.status(401).json({ error: 'Incorrect Scorer PIN' });
    }

    const newToken = `token-${matchId}-${Date.now()}`;
    await Match.updateOne({ id: matchId }, { activeScorerToken: newToken });

    matchCache.delete(matchId);
    res.json({ success: true, token: newToken });
  } catch (err) {
    console.error('Error authenticating scorer:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// 8. POST /api/matches/:id/ball - Record Ball
app.post('/api/matches/:id/ball', async (req, res) => {
  try {
    const matchId = req.params.id;
    const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;

    const matchRecord = await Match.findOne({ id: matchId }).lean();
    if (!matchRecord) return res.status(404).json({ error: 'Match not found' });

    if (!verifyScorerToken(matchRecord, token)) {
      return res.status(401).json({ error: 'Another scorer is active on this match', canTakeOver: true });
    }

    const {
      striker, nonStriker, bowler, runsBat = 0, isWide = false, isNoBall = false,
      isBye = false, isLegBye = false, extraRuns = 0, isWicket = false,
      dismissalType, dismissedPlayer, fielder, nextBatter, nextBowler, commentaryText
    } = req.body;

    const prevBalls = await Ball.find({ matchId }).sort({ ballIndex: -1 }).lean();
    const ballIndex = prevBalls.length + 1;

    const activeInnings = await Innings.findOne({ matchId, isCompleted: false }).sort({ inningsNum: 1 }).lean() ||
      await Innings.findOne({ matchId }).sort({ inningsNum: -1 }).lean();

    const inningsNum = activeInnings ? activeInnings.inningsNum : 1;
    const innBalls = prevBalls.filter(b => b.inningsNum === inningsNum);
    const legalBalls = innBalls.filter(b => !b.isWide && !b.isNoBall).length;

    const overNum = Math.floor(legalBalls / 6);
    const ballNum = (legalBalls % 6) + (!isWide && !isNoBall ? 1 : 0);

    const ballId = `ball-${matchId}-${inningsNum}-${ballIndex}-${Date.now()}`;

    const ballDoc = new Ball({
      id: ballId,
      matchId,
      inningsNum,
      ballIndex,
      overNum,
      ballNum,
      striker,
      nonStriker,
      bowler,
      runsBat: Number(runsBat),
      isWide: Boolean(isWide),
      isNoBall: Boolean(isNoBall),
      isBye: Boolean(isBye),
      isLegBye: Boolean(isLegBye),
      extraRuns: Number(extraRuns),
      isWicket: Boolean(isWicket),
      dismissalType: dismissalType || null,
      dismissedPlayer: dismissedPlayer || null,
      fielder: fielder || null,
      nextBatter: nextBatter || null,
      nextBowler: nextBowler || null
    });

    await ballDoc.save();

    matchCache.delete(matchId);
    const computed = await getOrRebuildMatchState(matchId);

    setImmediate(() => broadcastMatchState(matchId));

    res.json({
      success: true,
      saved: true,
      state: computed.fullMatchState
    });
  } catch (err) {
    console.error('Error recording ball:', err);
    res.status(500).json({ error: 'Failed to record ball' });
  }
});

// 9. POST /api/matches/:id/undo - Undo Last Ball
app.post('/api/matches/:id/undo', async (req, res) => {
  try {
    const matchId = req.params.id;
    const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;

    const matchRecord = await Match.findOne({ id: matchId }).lean();
    if (!verifyScorerToken(matchRecord, token)) {
      return res.status(401).json({ error: 'Another scorer is active on this match', canTakeOver: true });
    }

    const lastBall = await Ball.findOne({ matchId }).sort({ ballIndex: -1 }).lean();
    if (!lastBall) {
      return res.status(400).json({ error: 'No balls to undo' });
    }

    await Ball.deleteOne({ id: lastBall.id });

    const auditDoc = new BallAudit({
      id: `audit-${Date.now()}`,
      matchId,
      action: 'UNDO_BALL',
      detailsJson: JSON.stringify(lastBall)
    });
    await auditDoc.save();

    matchCache.delete(matchId);
    const computed = await getOrRebuildMatchState(matchId);

    setImmediate(() => broadcastMatchState(matchId));

    res.json({
      success: true,
      saved: true,
      undoneBall: lastBall,
      state: computed.fullMatchState
    });
  } catch (err) {
    console.error('Error undoing ball:', err);
    res.status(500).json({ error: 'Failed to undo ball' });
  }
});

// 10. POST /api/matches/:id/start-second-innings
app.post('/api/matches/:id/start-second-innings', async (req, res) => {
  try {
    const matchId = req.params.id;
    const { openingBatter1, openingBatter2, openingBowler } = req.body;

    const matchRecord = await Match.findOne({ id: matchId }).lean();
    if (!matchRecord) return res.status(404).json({ error: 'Match not found' });

    const computedPrev = await getOrRebuildMatchState(matchId);
    const inn1Score = computedPrev.fullMatchState.scorecard[0];
    const target = inn1Score ? inn1Score.totalRuns + 1 : 150;

    const teamA = matchRecord.teamA;
    const teamB = matchRecord.teamB;
    const tossWinner = matchRecord.tossWinner;
    const tossChoice = matchRecord.tossChoice;

    const firstBatting = tossChoice === 'bat' ? tossWinner : (tossWinner === teamA.name ? teamB.name : teamA.name);
    const secondBatting = firstBatting === teamA.name ? teamB.name : teamA.name;
    const secondBowling = firstBatting;

    const squadBat = secondBatting === teamA.name ? teamA.squad : teamB.squad;
    const squadBowl = secondBowling === teamA.name ? teamA.squad : teamB.squad;

    await Innings.findOneAndUpdate(
      { matchId, inningsNum: 2 },
      {
        id: `${matchId}-inn2`,
        matchId,
        inningsNum: 2,
        battingTeam: secondBatting,
        bowlingTeam: secondBowling,
        target,
        openingBatter1: openingBatter1 || squadBat[0],
        openingBatter2: openingBatter2 || squadBat[1],
        openingBowler: openingBowler || squadBowl[0],
        isCompleted: false
      },
      { upsert: true, new: true }
    );

    matchCache.delete(matchId);
    const computed = await getOrRebuildMatchState(matchId);
    setImmediate(() => broadcastMatchState(matchId));

    res.json({ success: true, state: computed.fullMatchState });
  } catch (err) {
    console.error('Error starting 2nd innings:', err);
    res.status(500).json({ error: 'Failed to start 2nd innings' });
  }
});

// Seed default fixture matches if DB has zero matches
async function seedDefaultData() {
  try {
    const count = await Match.countDocuments();
    if (count > 0) return;

    console.log('Seeding default match records into MongoDB Atlas matches collection...');

    const squadA = ['Rajesh Patel', 'Devendra Jadeja', 'Amit Sharma', 'Pritesh Shah', 'Hardik Vora', 'Bhavin Solanki', 'Ketan Joshi', 'Sanjay Mehta', 'Sunil Gadhvi', 'Nilesh Ahir', 'Jayesh Patel'];
    const squadB = ['Vikram Rathod', 'Harish Parmar', 'Girish Kothari', 'Ramesh Solanki', 'Chetan Thakar', 'Mahesh Dave', 'Haresh Bhanushali', 'Mayur Shah', 'Pratik Chawda', 'Dharmendra K', 'Manish Maheshwari'];

    const matchId = 'match-101';
    const pinHash = hashPin('1234');
    const token = 'token-101-active';

    const match101 = new Match({
      id: matchId,
      tournamentName: 'MAPL 2026',
      groupLabel: 'Quarter Final 1',
      ground: 'Sun Valley Ground',
      city: 'Gandhidham',
      details: 'Type B, Rs. 5000 Entry',
      date: '26-Sep-2026',
      time: '02:30 PM IST',
      totalOvers: 20,
      playersPerSide: 11,
      teamA: { id: '183873', name: 'SIPL WARRIORS', shortName: 'SWW', logoColor: '#dc2626', logoText: 'S', squad: squadA },
      teamB: { id: '183884', name: 'KANDLA TIGERS', shortName: 'KGT', logoColor: '#059669', logoText: 'K', squad: squadB },
      tossWinner: 'KANDLA TIGERS',
      tossChoice: 'bowl',
      pinHash,
      activeScorerToken: token,
      status: 'live'
    });
    await match101.save();

    await new Innings({ id: `${matchId}-inn1`, matchId, inningsNum: 1, battingTeam: 'SIPL WARRIORS', bowlingTeam: 'KANDLA TIGERS', target: null, openingBatter1: squadA[0], openingBatter2: squadA[1], openingBowler: squadB[0], isCompleted: true }).save();
    await new Innings({ id: `${matchId}-inn2`, matchId, inningsNum: 2, battingTeam: 'KANDLA TIGERS', bowlingTeam: 'SIPL WARRIORS', target: 187, openingBatter1: squadB[0], openingBatter2: squadB[1], openingBowler: squadA[0], isCompleted: false }).save();

    const initialBalls = [
      { striker: squadB[0], nonStriker: squadB[1], bowler: squadA[0], runsBat: 1 },
      { striker: squadB[1], nonStriker: squadB[0], bowler: squadA[0], runsBat: 4 },
      { striker: squadB[1], nonStriker: squadB[0], bowler: squadA[0], runsBat: 6 },
      { striker: squadB[1], nonStriker: squadB[0], bowler: squadA[0], runsBat: 0, isWicket: true, dismissalType: 'caught', fielder: squadA[2], nextBatter: squadB[2] },
      { striker: squadB[2], nonStriker: squadB[0], bowler: squadA[0], runsBat: 2 }
    ];

    for (let idx = 0; idx < initialBalls.length; idx++) {
      const b = initialBalls[idx];
      await new Ball({
        id: `ball-101-${idx+1}`, matchId, inningsNum: 2, ballIndex: idx + 1, overNum: 0, ballNum: idx + 1,
        striker: b.striker, nonStriker: b.nonStriker, bowler: b.bowler, runsBat: b.runsBat || 0, isWide: false, isNoBall: false,
        extraRuns: 0, isWicket: Boolean(b.isWicket), dismissalType: b.dismissalType || null, dismissedPlayer: b.isWicket ? b.striker : null, fielder: b.fielder || null, nextBatter: b.nextBatter || null
      }).save();
    }

    console.log('Seeding default match records into MongoDB Atlas completed.');
  } catch (err) {
    console.error('Error seeding default data:', err);
  }
}

// Socket.io Connection Logic
io.on('connection', (socket) => {
  socket.on('join_room', (matchId) => {
    socket.join(matchId);
  });

  socket.on('leave_room', (matchId) => {
    socket.leave(matchId);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Backend Engine server listening on port ${PORT}`);
});
