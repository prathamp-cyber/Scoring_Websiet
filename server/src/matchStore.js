// TODO: replace in-memory store with MongoDB Ball/Innings documents once MONGODB_URI is live.
import { mockTeams } from './mockData.js';

export const matchesStore = new Map();

/**
 * Creates default initial match configuration for a matchId if it does not exist.
 */
export function getOrCreateMatch(matchId) {
  if (matchesStore.has(matchId)) {
    return matchesStore.get(matchId);
  }

  // Assign mock teams based on matchId or defaults
  let teamA = mockTeams[0]; // Mumbai Strikers
  let teamB = mockTeams[1]; // Chennai Super Kings

  if (matchId.toLowerCase().includes('b') || matchId.toLowerCase().includes('rcb')) {
    teamA = mockTeams[2]; // RCB
    teamB = mockTeams[0]; // MS
  }

  const battingXI = teamA.players.slice(0, 11);
  const bowlingXI = teamB.players.slice(0, 11);

  const initialStriker = battingXI[0];
  const initialNonStriker = battingXI[1];
  const initialBowler = bowlingXI.find((p) => p.role === 'Bowler') || bowlingXI[8];

  const matchData = {
    matchId,
    battingTeam: { id: teamA.id, name: teamA.name, shortName: teamA.shortName, logo: teamA.logo },
    bowlingTeam: { id: teamB.id, name: teamB.name, shortName: teamB.shortName, logo: teamB.logo },
    playingXI: {
      batting: battingXI,
      bowling: bowlingXI
    },
    initialConfig: {
      strikerId: initialStriker.id,
      nonStrikerId: initialNonStriker.id,
      bowlerId: initialBowler.id
    },
    balls: [] // list of all raw ball events
  };

  const state = buildStateFromBalls(matchData);
  matchesStore.set(matchId, { matchData, state });
  return matchesStore.get(matchId);
}

/**
 * Initializes match state from stored DB Match document.
 */
export function initMatchFromDb(matchDoc) {
  const matchId = String(matchDoc._id || matchDoc.id);

  const battingXI = matchDoc.playingXI?.teamA || [];
  const bowlingXI = matchDoc.playingXI?.teamB || [];

  const initialStriker = battingXI[0] || { id: 'p1', name: 'Striker' };
  const initialNonStriker = battingXI[1] || { id: 'p2', name: 'Non-Striker' };
  const initialBowler = bowlingXI[0] || { id: 'b1', name: 'Bowler' };

  const matchData = {
    matchId,
    battingTeam: matchDoc.teamA,
    bowlingTeam: matchDoc.teamB,
    playingXI: {
      batting: battingXI,
      bowling: bowlingXI
    },
    playersPerSide: matchDoc.playersPerSide || 11,
    oversLimit: matchDoc.oversLimit || 20,
    initialConfig: {
      strikerId: initialStriker.id,
      nonStrikerId: initialNonStriker.id,
      bowlerId: initialBowler.id
    },
    balls: []
  };

  const state = buildStateFromBalls(matchData);
  matchesStore.set(matchId, { matchData, state });
  return matchesStore.get(matchId);
}

/**
 * Replays all balls from initial state to build clean, accurate match state.
 */
export function buildStateFromBalls(matchData) {
  const { battingTeam, bowlingTeam, playingXI, initialConfig, balls } = matchData;

  // Initialize batsmen stats map
  const batsmenStats = {};
  playingXI.batting.forEach((p) => {
    batsmenStats[p.id] = {
      id: p.id,
      name: p.name,
      role: p.role || 'Batsman',
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      dismissalInfo: ''
    };
  });

  // Initialize bowler stats map
  const bowlerStats = {};
  playingXI.bowling.forEach((p) => {
    bowlerStats[p.id] = {
      id: p.id,
      name: p.name,
      role: p.role || 'Bowler',
      legalBalls: 0,
      overs: '0.0',
      runs: 0,
      wickets: 0,
      maidens: 0,
      overRuns: 0
    };
  });

  let strikerId = initialConfig.strikerId;
  let nonStrikerId = initialConfig.nonStrikerId;
  let bowlerId = initialConfig.bowlerId;

  let score = {
    runs: 0,
    wickets: 0,
    legalBalls: 0,
    overs: '0.0',
    extras: { wide: 0, noball: 0, bye: 0, legbye: 0, total: 0 }
  };

  let currentOver = [];
  let previousBowlerId = null;
  let mustSelectBowler = false;

  let currentOverRuns = 0;
  let currentOverIsMaidenCandidate = true;

  // Replay each ball
  for (let i = 0; i < balls.length; i++) {
    const ball = balls[i];

    // Handle bowler change events
    if (ball.isBowlerChangeOnly) {
      if (ball.overrideBowlerId) {
        bowlerId = ball.overrideBowlerId;
        mustSelectBowler = false;
      }
      continue;
    }

    if (ball.overrideBowlerId) {
      bowlerId = ball.overrideBowlerId;
      mustSelectBowler = false;
    }

    const striker = batsmenStats[strikerId];
    const nonStriker = batsmenStats[nonStrikerId];
    const bowler = bowlerStats[bowlerId];

    const runsScored = Number(ball.runsScored || 0);
    const extraType = ball.extraType || 'none';
    const isWicket = Boolean(ball.isWicket);
    const wicketType = ball.wicketType || 'bowled';
    const dismissedPlayerId = ball.dismissedPlayerId || strikerId;
    const newBatsmanId = ball.newBatsmanId || null;

    const isWide = extraType === 'wide';
    const isNoBall = extraType === 'noball';
    const isBye = extraType === 'bye';
    const isLegBye = extraType === 'legbye';
    const isLegal = !isWide && !isNoBall;

    let totalBallRuns = runsScored;

    if (isWide) {
      totalBallRuns = 1 + runsScored;
      score.extras.wide += totalBallRuns;
      score.extras.total += totalBallRuns;
      score.runs += totalBallRuns;
      if (bowler) bowler.runs += totalBallRuns;
      currentOverRuns += totalBallRuns;
      currentOverIsMaidenCandidate = false;
    } else if (isNoBall) {
      totalBallRuns = 1 + runsScored;
      score.extras.noball += 1;
      score.extras.total += 1;
      score.runs += totalBallRuns;
      if (bowler) bowler.runs += totalBallRuns;
      currentOverRuns += totalBallRuns;
      currentOverIsMaidenCandidate = false;

      if (striker) {
        striker.balls += 1;
        striker.runs += runsScored;
        if (runsScored === 4) striker.fours += 1;
        if (runsScored === 6) striker.sixes += 1;
      }
    } else if (isBye) {
      totalBallRuns = runsScored;
      score.extras.bye += runsScored;
      score.extras.total += runsScored;
      score.runs += runsScored;
      if (striker) striker.balls += 1;
    } else if (isLegBye) {
      totalBallRuns = runsScored;
      score.extras.legbye += runsScored;
      score.extras.total += runsScored;
      score.runs += runsScored;
      if (striker) striker.balls += 1;
    } else {
      totalBallRuns = runsScored;
      score.runs += runsScored;
      if (bowler) bowler.runs += runsScored;
      currentOverRuns += runsScored;
      if (runsScored > 0) currentOverIsMaidenCandidate = false;

      if (striker) {
        striker.balls += 1;
        striker.runs += runsScored;
        if (runsScored === 4) striker.fours += 1;
        if (runsScored === 6) striker.sixes += 1;
      }
    }

    let ballLabel = `${runsScored}`;
    if (isWicket) ballLabel = 'W';
    else if (isWide) ballLabel = runsScored > 0 ? `${runsScored + 1}Wd` : 'Wd';
    else if (isNoBall) ballLabel = runsScored > 0 ? `${runsScored}NB` : 'NB';
    else if (isBye) ballLabel = `${runsScored}B`;
    else if (isLegBye) ballLabel = `${runsScored}LB`;

    currentOver.push({
      label: ballLabel,
      runsScored,
      extraType,
      isWicket,
      isLegal
    });

    if (isWicket) {
      score.wickets += 1;
      if (wicketType !== 'run_out' && bowler) {
        bowler.wickets += 1;
      }

      const dismissed = batsmenStats[dismissedPlayerId];
      if (dismissed) {
        dismissed.isOut = true;
        dismissed.dismissalInfo = `${wicketType} b ${bowler ? bowler.name : ''}`;
      }

      if (newBatsmanId && batsmenStats[newBatsmanId]) {
        if (dismissedPlayerId === strikerId) {
          strikerId = newBatsmanId;
        } else if (dismissedPlayerId === nonStrikerId) {
          nonStrikerId = newBatsmanId;
        }
      }
    }

    if (runsScored % 2 === 1) {
      const temp = strikerId;
      strikerId = nonStrikerId;
      nonStrikerId = temp;
    }

    if (isLegal) {
      score.legalBalls += 1;
      if (bowler) {
        bowler.legalBalls += 1;
        bowler.overs = `${Math.floor(bowler.legalBalls / 6)}.${bowler.legalBalls % 6}`;
      }
      score.overs = `${Math.floor(score.legalBalls / 6)}.${score.legalBalls % 6}`;

      if (score.legalBalls % 6 === 0) {
        const temp = strikerId;
        strikerId = nonStrikerId;
        nonStrikerId = temp;

        if (currentOverIsMaidenCandidate && currentOverRuns === 0 && bowler) {
          bowler.maidens += 1;
        }

        previousBowlerId = bowlerId;
        mustSelectBowler = true;
        currentOver = [];
        currentOverRuns = 0;
        currentOverIsMaidenCandidate = true;
      }
    }
  }

  const activeBowler = bowlerStats[bowlerId]
    ? {
        ...bowlerStats[bowlerId],
        economy:
          bowlerStats[bowlerId].legalBalls > 0
            ? (bowlerStats[bowlerId].runs / (bowlerStats[bowlerId].legalBalls / 6)).toFixed(2)
            : '0.00'
      }
    : null;

  const activeStriker = batsmenStats[strikerId]
    ? {
        ...batsmenStats[strikerId],
        strikeRate:
          batsmenStats[strikerId].balls > 0
            ? ((batsmenStats[strikerId].runs / batsmenStats[strikerId].balls) * 100).toFixed(1)
            : '0.0'
      }
    : null;

  const activeNonStriker = batsmenStats[nonStrikerId]
    ? {
        ...batsmenStats[nonStrikerId],
        strikeRate:
          batsmenStats[nonStrikerId].balls > 0
            ? ((batsmenStats[nonStrikerId].runs / batsmenStats[nonStrikerId].balls) * 100).toFixed(1)
            : '0.0'
      }
    : null;

  const remainingBatsmen = playingXI.batting.filter(
    (p) => p.id !== strikerId && p.id !== nonStrikerId && !batsmenStats[p.id]?.isOut
  );

  return {
    matchId: matchData.matchId,
    battingTeam,
    bowlingTeam,
    score,
    striker: activeStriker,
    nonStriker: activeNonStriker,
    bowler: activeBowler,
    previousBowlerId,
    mustSelectBowler,
    currentOver,
    balls: matchData.balls,
    playingXI,
    batsmenStats,
    bowlerStats,
    remainingBatsmen
  };
}

/**
 * Record a ball in memory and return updated state.
 */
export function recordBall(matchId, ballData) {
  const match = getOrCreateMatch(matchId);
  const { matchData } = match;

  if (ballData.newBowlerId) {
    matchData.balls.push({
      overrideBowlerId: ballData.newBowlerId,
      ...ballData,
      timestamp: Date.now()
    });
  } else {
    matchData.balls.push({
      ...ballData,
      timestamp: Date.now()
    });
  }

  const updatedState = buildStateFromBalls(matchData);
  match.state = updatedState;
  return updatedState;
}

/**
 * Undo last ball from match memory.
 */
export function undoLastBall(matchId) {
  const match = getOrCreateMatch(matchId);
  const { matchData } = match;

  if (matchData.balls.length > 0) {
    matchData.balls.pop();
  }

  const updatedState = buildStateFromBalls(matchData);
  match.state = updatedState;
  return updatedState;
}

/**
 * Explicitly select next bowler (e.g. after over completion).
 */
export function selectBowler(matchId, bowlerId) {
  const match = getOrCreateMatch(matchId);
  const { matchData } = match;

  matchData.balls.push({
    isBowlerChangeOnly: true,
    overrideBowlerId: bowlerId,
    timestamp: Date.now()
  });

  const updatedState = buildStateFromBalls(matchData);
  match.state = updatedState;
  return updatedState;
}

/**
 * Update initial player setup (striker, nonStriker, bowler).
 */
export function setInitialPlayers(matchId, { strikerId, nonStrikerId, bowlerId }) {
  const match = getOrCreateMatch(matchId);
  const { matchData } = match;

  if (strikerId) matchData.initialConfig.strikerId = strikerId;
  if (nonStrikerId) matchData.initialConfig.nonStrikerId = nonStrikerId;
  if (bowlerId) matchData.initialConfig.bowlerId = bowlerId;

  const updatedState = buildStateFromBalls(matchData);
  match.state = updatedState;
  return updatedState;
}
