import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(express.json());

// Initialize SQLite Database
const db = new Database(path.join(__dirname, 'cricket_scoring.db'));
db.pragma('journal_mode = WAL');

// Create Database Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    tournament_name TEXT,
    group_label TEXT,
    ground TEXT,
    city TEXT,
    details TEXT,
    date TEXT,
    time TEXT,
    total_overs INTEGER,
    players_per_side INTEGER,
    team_a_json TEXT,
    team_b_json TEXT,
    toss_winner TEXT,
    toss_choice TEXT,
    pin_hash TEXT,
    active_scorer_token TEXT,
    status TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS innings (
    id TEXT PRIMARY KEY,
    match_id TEXT,
    innings_num INTEGER,
    batting_team TEXT,
    bowling_team TEXT,
    target INTEGER,
    opening_batter1 TEXT,
    opening_batter2 TEXT,
    opening_bowler TEXT,
    is_completed INTEGER,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS balls (
    id TEXT PRIMARY KEY,
    match_id TEXT,
    innings_num INTEGER,
    ball_index INTEGER,
    over_num INTEGER,
    ball_num INTEGER,
    striker TEXT,
    non_striker TEXT,
    bowler TEXT,
    runs_bat INTEGER,
    is_wide INTEGER,
    is_no_ball INTEGER,
    is_bye INTEGER,
    is_leg_bye INTEGER,
    extra_runs INTEGER,
    is_wicket INTEGER,
    dismissal_type TEXT,
    dismissed_player TEXT,
    fielder TEXT,
    next_batter TEXT,
    next_bowler TEXT,
    commentary_text TEXT,
    timestamp INTEGER
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    match_id TEXT,
    action TEXT,
    details_json TEXT,
    timestamp INTEGER
  );
`);

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

// PURE FUNCTION: computeMatchState(matchRecord, inningsList, ballsList)
export function computeMatchState(matchRecord, inningsList = [], ballsList = []) {
  const matchId = matchRecord.id;
  const teamA = typeof matchRecord.team_a_json === 'string' ? JSON.parse(matchRecord.team_a_json) : matchRecord.team_a_json;
  const teamB = typeof matchRecord.team_b_json === 'string' ? JSON.parse(matchRecord.team_b_json) : matchRecord.team_b_json;
  const totalOvers = matchRecord.total_overs || 20;
  const playersPerSide = matchRecord.players_per_side || 11;
  const maxWickets = playersPerSide - 1;

  // Determine which team bats first based on toss
  let tossWinner = matchRecord.toss_winner || teamA.name;
  let tossChoice = matchRecord.toss_choice || 'bat';
  let firstBattingTeamName = tossChoice === 'bat' ? tossWinner : (tossWinner === teamA.name ? teamB.name : teamA.name);
  let firstBowlingTeamName = firstBattingTeamName === teamA.name ? teamB.name : teamA.name;

  let tossText = `${tossWinner} won the toss and elected to ${tossChoice}`;

  // Process Innings 1 & 2
  const inningsStats = [1, 2].map((innNum) => {
    const innRecord = inningsList.find(i => i.innings_num === innNum);
    const battingTeamName = innNum === 1 ? firstBattingTeamName : firstBowlingTeamName;
    const bowlingTeamName = innNum === 1 ? firstBowlingTeamName : firstBattingTeamName;
    const battingTeamDef = battingTeamName === teamA.name ? teamA : teamB;
    const bowlingTeamDef = bowlingTeamName === teamA.name ? teamA : teamB;

    const squadBatting = battingTeamDef.squad || [];
    const squadBowling = bowlingTeamDef.squad || [];

    const innBalls = ballsList
      .filter(b => b.innings_num === innNum)
      .sort((a, b) => a.ball_index - b.ball_index);

    // Initial state tracking for innings
    let totalRuns = 0;
    let wickets = 0;
    let legalBalls = 0;
    let extras = { wide: 0, noBall: 0, bye: 0, legBye: 0, penalty: 0 };
    
    // Batter stats map: name -> { runs, balls, fours, sixes, dismissal, isNotOut, order }
    const batterMap = new Map();
    squadBatting.forEach((name, idx) => {
      batterMap.set(name, {
        name,
        dismissal: 'yet to bat',
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        sr: '0.00',
        isNotOut: false,
        hasBatted: false,
        order: idx
      });
    });

    // Bowler stats map: name -> { overs, maidens, runs, wickets, econ, wd, nb, legalBalls, overRuns, overWickets }
    const bowlerMap = new Map();
    squadBowling.forEach(name => {
      bowlerMap.set(name, {
        name,
        overs: '0.0',
        legalBalls: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
        econ: '0.00',
        wd: 0,
        nb: 0,
        overRuns: 0,
        overWickets: 0,
        hasBowled: false
      });
    });

    // Active players tracking
    let currentStriker = innRecord?.opening_batter1 || squadBatting[0] || 'Batter 1';
    let currentNonStriker = innRecord?.opening_batter2 || squadBatting[1] || 'Batter 2';
    let currentBowlerName = innRecord?.opening_bowler || squadBowling[0] || 'Bowler 1';
    let previousBowlerName = null;

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

    // Process each ball
    innBalls.forEach((b) => {
      const isWide = Boolean(b.is_wide);
      const isNoBall = Boolean(b.is_no_ball);
      const isBye = Boolean(b.is_bye);
      const isLegBye = Boolean(b.is_leg_bye);
      const isWicket = Boolean(b.is_wicket);
      const runsBat = b.runs_bat || 0;
      const extraRuns = b.extra_runs || 0;

      // Update current active players from ball record if present
      if (b.striker) currentStriker = b.striker;
      if (b.non_striker) currentNonStriker = b.non_striker;
      if (b.bowler) currentBowlerName = b.bowler;

      // Ensure batter & bowler records exist
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
        totalRuns += widePen;
        extras.wide += widePen;
        bowlerObj.runs += widePen;
        bowlerObj.wd += 1;
        bowlerObj.overRuns += widePen;
        valLabel = extraRuns > 0 ? `Wd+${extraRuns}` : 'Wd';
        ballType = 'wide';

        // Wide odd runs swap strike
        if (extraRuns % 2 === 1) {
          const temp = currentStriker;
          currentStriker = currentNonStriker;
          currentNonStriker = temp;
        }
      } else if (isNoBall) {
        const nbPen = 1 + runsBat + extraRuns;
        ballTotalRuns = nbPen;
        totalRuns += nbPen;
        extras.noBall += 1;
        if (extraRuns > 0) extras.bye += extraRuns;
        
        strikerObj.runs += runsBat;
        if (runsBat === 4) strikerObj.fours += 1;
        if (runsBat === 6) strikerObj.sixes += 1;
        
        bowlerObj.runs += nbPen;
        bowlerObj.nb += 1;
        bowlerObj.overRuns += nbPen;

        valLabel = runsBat > 0 ? `Nb+${runsBat}` : 'Nb';
        ballType = runsBat === 4 ? 'four' : (runsBat === 6 ? 'six' : 'noball');
        isFreeHit = true;

        if (runsBat % 2 === 1) {
          const temp = currentStriker;
          currentStriker = currentNonStriker;
          currentNonStriker = temp;
        }
      } else if (isBye || isLegBye) {
        legalBalls += 1;
        bowlerObj.legalBalls += 1;
        const bRuns = extraRuns || runsBat || 1;
        ballTotalRuns = bRuns;
        totalRuns += bRuns;
        if (isBye) extras.bye += bRuns;
        if (isLegBye) extras.legBye += bRuns;
        
        strikerObj.balls += 1;
        bowlerObj.overRuns += 0; // Byes/leg-byes don't count against bowler runs

        valLabel = isBye ? `B${bRuns}` : `LB${bRuns}`;
        ballType = 'extra';

        if (bRuns % 2 === 1) {
          const temp = currentStriker;
          currentStriker = currentNonStriker;
          currentNonStriker = temp;
        }

        // Check over completion
        if (bowlerObj.legalBalls % 6 === 0) {
          if (bowlerObj.overRuns === 0) bowlerObj.maidens += 1;
          bowlerObj.overRuns = 0;
          bowlerObj.overWickets = 0;
          previousBowlerName = currentBowlerName;
          // Swap strike at end of over
          const temp = currentStriker;
          currentStriker = currentNonStriker;
          currentNonStriker = temp;
        }
      } else {
        // Normal legal ball
        legalBalls += 1;
        bowlerObj.legalBalls += 1;
        ballTotalRuns = runsBat;
        totalRuns += runsBat;

        strikerObj.runs += runsBat;
        strikerObj.balls += 1;
        if (runsBat === 4) strikerObj.fours += 1;
        if (runsBat === 6) strikerObj.sixes += 1;

        bowlerObj.runs += runsBat;
        bowlerObj.overRuns += runsBat;

        if (runsBat === 0) ballType = 'dot';
        else if (runsBat === 4) ballType = 'four';
        else if (runsBat === 6) ballType = 'six';
        else if (runsBat % 2 === 1) ballType = 'single';
        else ballType = 'double';

        valLabel = String(runsBat);
        isFreeHit = false;

        // Wicket processing
        if (isWicket) {
          wickets += 1;
          ballType = 'wicket';
          valLabel = 'W';

          const dismissedName = b.dismissed_player || currentStriker;
          const dismissalType = b.dismissal_type || 'bowled';
          const fielderName = b.fielder || '';

          if (dismissalType !== 'run_out') {
            bowlerObj.wickets += 1;
            bowlerObj.overWickets += 1;
          }

          let disText = 'out';
          if (dismissalType === 'bowled') disText = `b ${currentBowlerName}`;
          else if (dismissalType === 'caught') disText = `c ${fielderName || 'fielder'} b ${currentBowlerName}`;
          else if (dismissalType === 'lbw') disText = `lbw b ${currentBowlerName}`;
          else if (dismissalType === 'run_out') disText = `run out (${fielderName || 'fielder'})`;
          else if (dismissalType === 'stumped') disText = `stumped ${fielderName || 'fielder'} b ${currentBowlerName}`;
          else disText = `${dismissalType} b ${currentBowlerName}`;

          const targetBatterObj = batterMap.get(dismissedName) || strikerObj;
          targetBatterObj.dismissal = disText;
          targetBatterObj.isNotOut = false;

          fallOfWicketsArr.push(`${totalRuns}-${wickets} (${dismissedName}, ${formatOvers(legalBalls)} ov)`);

          // Bring in new batter if provided
          if (b.next_batter) {
            if (dismissedName === currentStriker) {
              currentStriker = b.next_batter;
            } else {
              currentNonStriker = b.next_batter;
            }
            if (batterMap.has(b.next_batter)) {
              const nbObj = batterMap.get(b.next_batter);
              nbObj.hasBatted = true;
              nbObj.isNotOut = true;
              nbObj.dismissal = 'not out';
            }
          }
        }

        // Swap strike on odd runs
        if (!isWicket && runsBat % 2 === 1) {
          const temp = currentStriker;
          currentStriker = currentNonStriker;
          currentNonStriker = temp;
        }

        // Over completion check
        if (bowlerObj.legalBalls % 6 === 0) {
          if (bowlerObj.overRuns === 0) bowlerObj.maidens += 1;
          bowlerObj.overRuns = 0;
          bowlerObj.overWickets = 0;
          previousBowlerName = currentBowlerName;

          // Swap strike at end of over
          const temp = currentStriker;
          currentStriker = currentNonStriker;
          currentNonStriker = temp;

          if (b.next_bowler) {
            currentBowlerName = b.next_bowler;
          }
        }
      }

      // Update bowler overs display & econ
      bowlerObj.overs = formatOvers(bowlerObj.legalBalls);
      const bowOversFloat = bowlerObj.legalBalls / 6;
      bowlerObj.econ = bowOversFloat > 0 ? (bowlerObj.runs / bowOversFloat).toFixed(2) : '0.00';

      // Update striker strike rate
      if (strikerObj.balls > 0) {
        strikerObj.sr = ((strikerObj.runs / strikerObj.balls) * 100).toFixed(2);
      }

      // Build commentary item
      const currentOverStr = formatOvers(legalBalls);
      let commText = b.commentary_text;
      if (!commText) {
        if (isWicket) commText = `OUT! ${b.dismissed_player || currentStriker} ${b.dismissal_type || 'dismissed'}!`;
        else if (isWide) commText = `${currentBowlerName} to ${currentStriker}, Wide ball (+${1 + extraRuns} run)`;
        else if (isNoBall) commText = `${currentBowlerName} to ${currentStriker}, NO BALL! ${runsBat} runs taken. Next ball is a Free Hit!`;
        else if (runsBat === 6) commText = `SIX! ${currentStriker} smashes ${currentBowlerName} over the boundary!`;
        else if (runsBat === 4) commText = `FOUR! Beautiful placement by ${currentStriker} off ${currentBowlerName}!`;
        else commText = `${currentBowlerName} to ${currentStriker}, ${runsBat} run${runsBat === 1 ? '' : 's'}.`;
      }

      commentaryList.unshift({
        ball: currentOverStr,
        runs: ballTotalRuns,
        isWicket,
        isBoundary: runsBat === 4 || runsBat === 6,
        text: commText,
        type: ballType
      });

      recentBallsList.push({
        ball: currentOverStr,
        val: valLabel,
        type: ballType
      });

      // Add over summary divider to recent balls
      if (legalBalls > 0 && legalBalls % 6 === 0 && !isWide && !isNoBall) {
        recentBallsList.push({ type: 'over_boundary', label: 'divider' });
      }
    });

    // Finalize batter SR & dismissal texts
    const battingList = Array.from(batterMap.values())
      .filter(b => b.hasBatted)
      .map(b => ({
        name: b.name,
        dismissal: b.dismissal,
        runs: b.runs,
        balls: b.balls,
        fours: b.fours,
        sixes: b.sixes,
        sr: b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(2) : '0.00',
        isNotOut: b.isNotOut
      }));

    const didNotBatList = Array.from(batterMap.values())
      .filter(b => !b.hasBatted)
      .map(b => b.name);

    const bowlingList = Array.from(bowlerMap.values())
      .filter(b => b.hasBowled || b.name === currentBowlerName)
      .map(b => ({
        name: b.name,
        overs: formatOvers(b.legalBalls),
        maidens: b.maidens,
        runs: b.runs,
        wickets: b.wickets,
        econ: (b.legalBalls / 6) > 0 ? (b.runs / (b.legalBalls / 6)).toFixed(2) : '0.00',
        wd: b.wd,
        nb: b.nb
      }));

    const extrasText = `${extras.wide + extras.noBall + extras.bye + extras.legBye} (b ${extras.bye}, lb ${extras.legBye}, w ${extras.wide}, nb ${extras.noBall})`;
    const oversText = formatOvers(legalBalls);
    const rrFloat = legalBalls > 0 ? (totalRuns / (legalBalls / 6)).toFixed(2) : '0.00';
    const scoreText = `${totalRuns}/${wickets} (${oversText} Ov)`;
    const totalLineText = `${totalRuns}/${wickets} (${oversText} Overs, RR ${rrFloat})`;

    const isCompleted = innRecord?.is_completed || (legalBalls >= totalOvers * 6) || (wickets >= maxWickets);

    return {
      inningsNum: innNum,
      teamName: battingTeamName,
      bowlingTeamName: bowlingTeamName,
      shortName: battingTeamDef.shortName || battingTeamName.slice(0, 3).toUpperCase(),
      scoreText,
      totalRuns,
      wickets,
      legalBalls,
      oversText,
      rrFloat,
      batting: battingList,
      bowling: bowlingList,
      extras: extrasText,
      total: totalLineText,
      didNotBat: didNotBatList,
      fallOfWickets: fallOfWicketsArr.join(', '),
      currentStriker,
      currentNonStriker,
      currentBowlerName,
      previousBowlerName,
      commentary: commentaryList,
      recentBalls: recentBallsList,
      isCompleted,
      target: innRecord?.target || null
    };
  });

  const inn1 = inningsStats[0];
  const inn2 = inningsStats[1];

  // Current active innings determination
  let currentInningsIndex = 1;
  if (inn1.isCompleted || ballsList.some(b => b.innings_num === 2) || inningsList.some(i => i.innings_num === 2)) {
    currentInningsIndex = 2;
  }

  const activeInn = currentInningsIndex === 1 ? inn1 : inn2;
  const target = inn1.totalRuns + 1;

  // Check match completion status
  let isMatchCompleted = matchRecord.status === 'completed';
  let resultText = null;
  let chaseStatusText = null;

  if (currentInningsIndex === 2) {
    const runsNeeded = target - inn2.totalRuns;
    const ballsRemaining = (totalOvers * 6) - inn2.legalBalls;

    if (inn2.totalRuns >= target) {
      isMatchCompleted = true;
      const wksRemaining = maxWickets - inn2.wickets;
      resultText = `${inn2.teamName} won by ${wksRemaining} wicket${wksRemaining !== 1 ? 's' : ''}`;
    } else if (inn2.isCompleted || ballsRemaining <= 0 || inn2.wickets >= maxWickets) {
      isMatchCompleted = true;
      if (inn2.totalRuns === target - 1) {
        resultText = 'Match tied';
      } else if (inn2.totalRuns < target - 1) {
        const marginRuns = (target - 1) - inn2.totalRuns;
        resultText = `${inn1.teamName} won by ${marginRuns} run${marginRuns !== 1 ? 's' : ''}`;
      }
    } else {
      const rrrFloat = ballsRemaining > 0 ? ((runsNeeded / ballsRemaining) * 6).toFixed(2) : '0.00';
      chaseStatusText = `${inn2.teamName} need ${runsNeeded} run${runsNeeded !== 1 ? 's' : ''} off ${ballsRemaining} ball${ballsRemaining !== 1 ? 's' : ''} (RRR ${rrrFloat})`;
    }
  }

  let matchStatus = matchRecord.status;
  if (isMatchCompleted) {
    matchStatus = 'completed';
  } else if (ballsList.length > 0 || currentInningsIndex === 2) {
    matchStatus = 'live';
  }

  // Header Team A and Team B states
  const teamABattingInn = inn1.teamName === teamA.name ? inn1 : inn2;
  const teamBBattingInn = inn1.teamName === teamB.name ? inn1 : inn2;

  const teamAHeader = {
    name: teamA.name,
    shortName: teamA.shortName || teamA.name.slice(0, 3).toUpperCase(),
    logoColor: teamA.logoColor || '#dc2626',
    logoText: teamA.logoText || teamA.name.charAt(0),
    score: teamABattingInn.legalBalls > 0 || teamABattingInn.wickets > 0 || currentInningsIndex === (inn1.teamName === teamA.name ? 1 : 2) ? `${teamABattingInn.totalRuns}/${teamABattingInn.wickets}` : null,
    overs: teamABattingInn.legalBalls > 0 ? `${teamABattingInn.oversText} ov` : null,
    hasBatted: teamABattingInn.legalBalls > 0 || teamABattingInn.wickets > 0,
    isBatting: matchStatus === 'live' && activeInn.teamName === teamA.name
  };

  const teamBHeader = {
    name: teamB.name,
    shortName: teamB.shortName || teamB.name.slice(0, 3).toUpperCase(),
    logoColor: teamB.logoColor || '#059669',
    logoText: teamB.logoText || teamB.name.charAt(0),
    score: teamBBattingInn.legalBalls > 0 || teamBBattingInn.wickets > 0 || currentInningsIndex === (inn1.teamName === teamB.name ? 1 : 2) ? `${teamBBattingInn.totalRuns}/${teamBBattingInn.wickets}` : null,
    overs: teamBBattingInn.legalBalls > 0 ? `${teamBBattingInn.oversText} ov` : null,
    hasBatted: teamBBattingInn.legalBalls > 0 || teamBBattingInn.wickets > 0,
    isBatting: matchStatus === 'live' && activeInn.teamName === teamB.name
  };

  // Live Tab batters & bowler info
  const strikerName = activeInn.currentStriker;
  const nonStrikerName = activeInn.currentNonStriker;
  const strikerObj = activeInn.batting.find(b => b.name === strikerName) || { name: strikerName, runs: 0, balls: 0, fours: 0, sixes: 0, sr: '0.00' };
  const nonStrikerObj = activeInn.batting.find(b => b.name === nonStrikerName) || { name: nonStrikerName, runs: 0, balls: 0, fours: 0, sixes: 0, sr: '0.00' };

  const currentBatters = [
    { ...strikerObj, isStriker: true },
    { ...nonStrikerObj, isStriker: false }
  ];

  const currentBowlerObj = activeInn.bowling.find(b => b.name === activeInn.currentBowlerName) || {
    name: activeInn.currentBowlerName,
    overs: '0.0',
    maidens: 0,
    runs: 0,
    wickets: 0,
    econ: '0.00'
  };

  // Recent balls calculation (last 14 balls)
  const recentBalls = activeInn.recentBalls.slice(-14);

  // Status strip text for home page cards
  let statusStripText = tossText;
  let statusStripBold = tossWinner;
  let statusStripType = 'toss';

  if (matchStatus === 'completed') {
    statusStripText = resultText || 'Match completed';
    statusStripBold = resultText ? resultText.split(' ')[0] : '';
    statusStripType = 'result';
  } else if (currentInningsIndex === 2 && chaseStatusText) {
    statusStripText = chaseStatusText;
    statusStripBold = inn2.teamName;
    statusStripType = 'progress';
  } else if (activeInn.legalBalls > 0) {
    statusStripText = `${activeInn.teamName} ${activeInn.totalRuns}/${activeInn.wickets} in ${activeInn.oversText} overs (RR ${activeInn.rrFloat})`;
    statusStripBold = activeInn.teamName;
    statusStripType = 'progress';
  }

  // Consolidated canonical MatchState
  const fullMatchState = {
    matchId,
    tournamentName: matchRecord.tournament_name || 'MAPL 2026',
    groupLabel: matchRecord.group_label || 'Group Stage',
    roundLabel: matchRecord.group_label || 'Group Stage',
    status: matchStatus,
    ground: matchRecord.ground || 'Main Stadium',
    city: matchRecord.city || 'Gandhidham',
    details: matchRecord.details || 'T20 Match',
    date: matchRecord.date || 'Today',
    time: matchRecord.time || '02:30 PM IST',
    oversLabel: `${totalOvers} Ov.`,
    totalOvers,
    playersPerSide,
    tossText,
    tossWinner,
    tossChoice,
    currentInningsIndex,
    target: currentInningsIndex === 2 ? target : null,
    chaseStatusText,
    resultText,
    teamA: teamAHeader,
    teamB: teamBHeader,
    liveData: {
      currentBatters,
      currentBowler: currentBowlerObj,
      currentPartnership: { runs: activeInn.totalRuns, balls: activeInn.legalBalls },
      recentBalls,
      bannerText: chaseStatusText || resultText || tossText,
      bannerType: matchStatus === 'completed' ? 'completed_result' : (currentInningsIndex === 2 ? 'live_chase' : 'live_toss')
    },
    scorecard: inningsStats.map(inn => ({
      inningsNum: inn.inningsNum,
      teamName: inn.teamName,
      shortName: inn.shortName,
      scoreText: inn.scoreText,
      totalRuns: inn.totalRuns,
      wickets: inn.wickets,
      batting: inn.batting,
      extras: inn.extras,
      total: inn.total,
      didNotBat: inn.didNotBat,
      fallOfWickets: inn.fallOfWickets,
      bowling: inn.bowling
    })),
    commentary: activeInn.commentary,
    statusStripText,
    statusStripBold,
    statusStripType,
    // Active Scorer context for prompts
    scoringContext: {
      currentInningsIndex,
      isCompleted: isMatchCompleted,
      target: currentInningsIndex === 2 ? target : null,
      striker: activeInn.currentStriker,
      nonStriker: activeInn.currentNonStriker,
      bowler: activeInn.currentBowlerName,
      previousBowler: activeInn.previousBowlerName,
      legalBalls: activeInn.legalBalls,
      overComplete: activeInn.legalBalls > 0 && activeInn.legalBalls % 6 === 0,
      availableBatters: inn1.teamName === activeInn.teamName ? teamA.squad : teamB.squad,
      availableBowlers: inn1.teamName === activeInn.teamName ? teamB.squad : teamA.squad
    }
  };

  // Compact summary for Home Page Cards
  const matchSummary = {
    matchId,
    tournamentName: fullMatchState.tournamentName,
    groupLabel: fullMatchState.groupLabel,
    ground: fullMatchState.ground,
    city: fullMatchState.city,
    details: fullMatchState.details,
    date: fullMatchState.date,
    oversLabel: fullMatchState.oversLabel,
    status: matchStatus,
    teamA: teamAHeader,
    teamB: teamBHeader,
    statusStripText,
    statusStripBold,
    statusStripType
  };

  return { fullMatchState, matchSummary };
}

// Helper to get or rebuild cached match state
function getOrRebuildMatchState(matchId) {
  const cached = matchCache.get(matchId);
  if (cached) return cached;

  const matchRecord = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
  if (!matchRecord) return null;

  const inningsList = db.prepare('SELECT * FROM innings WHERE match_id = ? ORDER BY innings_num ASC').all(matchId);
  const ballsList = db.prepare('SELECT * FROM balls WHERE match_id = ? ORDER BY ball_index ASC').all(matchId);

  const computed = computeMatchState(matchRecord, inningsList, ballsList);
  matchCache.set(matchId, { matchRecord, inningsList, ballsList, ...computed });
  return computed;
}

// Broadcast real-time updates via Socket.io
function broadcastMatchState(matchId) {
  const stateObj = getOrRebuildMatchState(matchId);
  if (!stateObj) return;

  // Emit full state to room
  io.to(`match:${matchId}`).emit('state', stateObj.fullMatchState);

  // Emit match summary to all viewers (Home page live update)
  io.emit('match_summary', stateObj.matchSummary);
}

// Socket.io Room Connection logic
io.on('connection', (socket) => {
  socket.on('join_room', (matchId) => {
    socket.join(`match:${matchId}`);
    const stateObj = getOrRebuildMatchState(matchId);
    if (stateObj) {
      socket.emit('state', stateObj.fullMatchState);
    }
  });

  socket.on('leave_room', (matchId) => {
    socket.leave(`match:${matchId}`);
  });
});

// REST ENDPOINTS

// 1. GET /api/matches - List all matches for Home Page
app.get('/api/matches', (req, res) => {
  const view = req.query.view || 'live';
  const matches = db.prepare('SELECT id FROM matches ORDER BY created_at DESC').all();
  
  const summaries = matches.map(m => {
    const computed = getOrRebuildMatchState(m.id);
    return computed ? computed.matchSummary : null;
  }).filter(Boolean);

  const filtered = summaries.filter(s => {
    if (view === 'live') return s.status === 'live';
    if (view === 'upcoming') return s.status === 'upcoming';
    if (view === 'completed') return s.status === 'completed';
    return true;
  });

  res.json(filtered.length > 0 ? filtered : summaries);
});

// 2. GET /api/matches/:id/state - Viewer & Initial load endpoint
app.get('/api/matches/:id/state', (req, res) => {
  const computed = getOrRebuildMatchState(req.params.id);
  if (!computed) {
    return res.status(404).json({ error: 'Match not found' });
  }
  res.json(computed.fullMatchState);
});

// 3. GET /api/fixtures & POST /api/matches/create - Create Match from Setup Screen
app.get('/api/fixtures', (req, res) => {
  res.json([
    {
      id: 'match-101',
      tournamentName: 'MAPL 2026',
      groupLabel: 'Quarter Final 1',
      teamA: 'SIPL WARRIORS',
      teamB: 'KANDLA TIGERS',
      squadA: ['Rajesh Patel', 'Devendra Jadeja', 'Amit Sharma', 'Pritesh Shah', 'Hardik Vora', 'Bhavin Solanki', 'Ketan Joshi', 'Sanjay Mehta', 'Sunil Gadhvi', 'Nilesh Ahir', 'Jayesh Patel'],
      squadB: ['Vikram Rathod', 'Harish Parmar', 'Girish Kothari', 'Ramesh Solanki', 'Chetan Thakar', 'Mahesh Dave', 'Haresh Bhanushali', 'Mayur Shah', 'Pratik Chawda', 'Dharmendra K', 'Manish Maheshwari']
    },
    {
      id: 'match-102',
      tournamentName: 'MAPL 2026',
      groupLabel: 'Group Stage - Group A',
      teamA: 'BHUJ ROYALS',
      teamB: 'GANDHIDHAM KINGS',
      squadA: ['Player A1', 'Player A2', 'Player A3', 'Player A4', 'Player A5', 'Player A6', 'Player A7', 'Player A8', 'Player A9', 'Player A10', 'Player A11'],
      squadB: ['Player B1', 'Player B2', 'Player B3', 'Player B4', 'Player B5', 'Player B6', 'Player B7', 'Player B8', 'Player B9', 'Player B10', 'Player B11']
    }
  ]);
});

app.post('/api/matches/create', (req, res) => {
  const {
    matchId: customId,
    tournamentName,
    groupLabel,
    ground,
    city,
    details,
    date,
    time,
    totalOvers,
    playersPerSide,
    teamA,
    teamB,
    tossWinner,
    tossChoice,
    pin
  } = req.body;

  if (!pin || String(pin).length < 4 || String(pin).length > 6) {
    return res.status(400).json({ error: 'PIN must be between 4 and 6 digits' });
  }

  const matchId = customId || `match-${Date.now().toString(36)}`;
  const pinHash = hashPin(pin);
  const activeScorerToken = crypto.randomUUID();
  const createdAt = Date.now();

  const teamAData = {
    name: teamA.name,
    shortName: teamA.shortName || teamA.name.slice(0, 3).toUpperCase(),
    logoColor: teamA.logoColor || '#dc2626',
    logoText: teamA.logoText || teamA.name.charAt(0),
    squad: teamA.squad || []
  };

  const teamBData = {
    name: teamB.name,
    shortName: teamB.shortName || teamB.name.slice(0, 3).toUpperCase(),
    logoColor: teamB.logoColor || '#059669',
    logoText: teamB.logoText || teamB.name.charAt(0),
    squad: teamB.squad || []
  };

  // Save match record to SQLite
  db.prepare(`
    INSERT OR REPLACE INTO matches (
      id, tournament_name, group_label, ground, city, details, date, time,
      total_overs, players_per_side, team_a_json, team_b_json, toss_winner, toss_choice,
      pin_hash, active_scorer_token, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    matchId,
    tournamentName || 'MAPL 2026',
    groupLabel || 'Quarter Final',
    ground || 'Sun Valley Ground',
    city || 'Gandhidham',
    details || 'T20 Match',
    date || '26-Sep-2026',
    time || '02:30 PM IST',
    Number(totalOvers) || 20,
    Number(playersPerSide) || 11,
    JSON.stringify(teamAData),
    JSON.stringify(teamBData),
    tossWinner || teamA.name,
    tossChoice || 'bat',
    pinHash,
    activeScorerToken,
    'live',
    createdAt
  );

  // Initialize Innings 1 record
  const firstBatting = tossChoice === 'bat' ? tossWinner : (tossWinner === teamA.name ? teamB.name : teamA.name);
  const firstBowling = firstBatting === teamA.name ? teamB.name : teamA.name;
  const squadBat = firstBatting === teamA.name ? teamAData.squad : teamBData.squad;
  const squadBowl = firstBowling === teamA.name ? teamAData.squad : teamBData.squad;

  db.prepare(`
    INSERT OR REPLACE INTO innings (
      id, match_id, innings_num, batting_team, bowling_team, target,
      opening_batter1, opening_batter2, opening_bowler, is_completed, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `${matchId}-inn1`,
    matchId,
    1,
    firstBatting,
    firstBowling,
    null,
    squadBat[0] || 'Batter 1',
    squadBat[1] || 'Batter 2',
    squadBowl[0] || 'Bowler 1',
    0,
    createdAt
  );

  matchCache.delete(matchId);
  const computed = getOrRebuildMatchState(matchId);
  broadcastMatchState(matchId);

  res.json({
    success: true,
    matchId,
    token: activeScorerToken,
    state: computed.fullMatchState
  });
});

// 4. POST /api/matches/:id/auth - Authenticate Umpire PIN & Session Token
app.post('/api/matches/:id/auth', (req, res) => {
  const { pin } = req.body;
  const matchId = req.params.id;

  const matchRecord = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
  if (!matchRecord) return res.status(404).json({ error: 'Match not found' });

  const inputHash = hashPin(pin);
  if (inputHash !== matchRecord.pin_hash) {
    return res.status(401).json({ error: 'Incorrect PIN' });
  }

  // Issue new active scorer token
  const newToken = crypto.randomUUID();
  db.prepare('UPDATE matches SET active_scorer_token = ? WHERE id = ?').run(newToken, matchId);
  matchCache.delete(matchId);

  const computed = getOrRebuildMatchState(matchId);
  res.json({
    success: true,
    token: newToken,
    state: computed.fullMatchState
  });
});

// Auth Middleware helper
function verifyScorerToken(matchId, token) {
  const matchRecord = db.prepare('SELECT active_scorer_token FROM matches WHERE id = ?').get(matchId);
  if (!matchRecord) return false;
  return matchRecord.active_scorer_token === token;
}

// 5. POST /api/matches/:id/ball - Record a Ball
app.post('/api/matches/:id/ball', (req, res) => {
  const matchId = req.params.id;
  const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;

  if (!verifyScorerToken(matchId, token)) {
    return res.status(401).json({ error: 'Another scorer is active on this match', canTakeOver: true });
  }

  const {
    inningsNum = 1,
    striker,
    nonStriker,
    bowler,
    runsBat = 0,
    isWide = false,
    isNoBall = false,
    isBye = false,
    isLegBye = false,
    extraRuns = 0,
    isWicket = false,
    dismissalType,
    dismissedPlayer,
    fielder,
    nextBatter,
    nextBowler
  } = req.body;

  const ballsList = db.prepare('SELECT * FROM balls WHERE match_id = ? AND innings_num = ? ORDER BY ball_index ASC').all(matchId, inningsNum);
  const ballIndex = ballsList.length + 1;

  // Count legal balls to compute over_num and ball_num
  const legalBalls = ballsList.filter(b => !b.is_wide && !b.is_no_ball).length;
  const overNum = Math.floor(legalBalls / 6);
  const ballNum = (legalBalls % 6) + (!isWide && !isNoBall ? 1 : 0);

  const ballId = `ball-${matchId}-${inningsNum}-${ballIndex}-${Date.now()}`;
  const timestamp = Date.now();

  db.prepare(`
    INSERT INTO balls (
      id, match_id, innings_num, ball_index, over_num, ball_num,
      striker, non_striker, bowler, runs_bat, is_wide, is_no_ball, is_bye, is_leg_bye,
      extra_runs, is_wicket, dismissal_type, dismissed_player, fielder,
      next_batter, next_bowler, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ballId, matchId, inningsNum, ballIndex, overNum, ballNum,
    striker, nonStriker, bowler, Number(runsBat), isWide ? 1 : 0, isNoBall ? 1 : 0, isBye ? 1 : 0, isLegBye ? 1 : 0,
    Number(extraRuns), isWicket ? 1 : 0, dismissalType || null, dismissedPlayer || null, fielder || null,
    nextBatter || null, nextBowler || null, timestamp
  );

  // Clear cache and rebuild
  matchCache.delete(matchId);
  const computed = getOrRebuildMatchState(matchId);

  // Non-blocking real-time socket broadcast
  setImmediate(() => broadcastMatchState(matchId));

  res.json({
    success: true,
    saved: true,
    state: computed.fullMatchState
  });
});

// 6. POST /api/matches/:id/undo - Undo Last Ball
app.post('/api/matches/:id/undo', (req, res) => {
  const matchId = req.params.id;
  const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;

  if (!verifyScorerToken(matchId, token)) {
    return res.status(401).json({ error: 'Another scorer is active on this match', canTakeOver: true });
  }

  const lastBall = db.prepare('SELECT * FROM balls WHERE match_id = ? ORDER BY ball_index DESC LIMIT 1').get(matchId);
  if (!lastBall) {
    return res.status(400).json({ error: 'No balls to undo' });
  }

  // Delete last ball
  db.prepare('DELETE FROM balls WHERE id = ?').run(lastBall.id);

  // Insert audit log
  db.prepare('INSERT INTO audit_logs (id, match_id, action, details_json, timestamp) VALUES (?, ?, ?, ?, ?)').run(
    `audit-${Date.now()}`, matchId, 'UNDO_BALL', JSON.stringify(lastBall), Date.now()
  );

  matchCache.delete(matchId);
  const computed = getOrRebuildMatchState(matchId);

  setImmediate(() => broadcastMatchState(matchId));

  res.json({
    success: true,
    saved: true,
    undoneBall: lastBall,
    state: computed.fullMatchState
  });
});

// 7. POST /api/matches/:id/start-second-innings
app.post('/api/matches/:id/start-second-innings', (req, res) => {
  const matchId = req.params.id;
  const { openingBatter1, openingBatter2, openingBowler } = req.body;

  const matchRecord = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
  if (!matchRecord) return res.status(404).json({ error: 'Match not found' });

  const computedPrev = getOrRebuildMatchState(matchId);
  const inn1Score = computedPrev.fullMatchState.scorecard[0];
  const target = inn1Score.totalRuns + 1;

  const teamA = JSON.parse(matchRecord.team_a_json);
  const teamB = JSON.parse(matchRecord.team_b_json);
  const tossWinner = matchRecord.toss_winner;
  const tossChoice = matchRecord.toss_choice;

  const firstBatting = tossChoice === 'bat' ? tossWinner : (tossWinner === teamA.name ? teamB.name : teamA.name);
  const secondBatting = firstBatting === teamA.name ? teamB.name : teamA.name;
  const secondBowling = firstBatting;

  const squadBat = secondBatting === teamA.name ? teamA.squad : teamB.squad;
  const squadBowl = secondBowling === teamA.name ? teamA.squad : teamB.squad;

  db.prepare(`
    INSERT OR REPLACE INTO innings (
      id, match_id, innings_num, batting_team, bowling_team, target,
      opening_batter1, opening_batter2, opening_bowler, is_completed, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `${matchId}-inn2`, matchId, 2, secondBatting, secondBowling, target,
    openingBatter1 || squadBat[0], openingBatter2 || squadBat[1], openingBowler || squadBowl[0], 0, Date.now()
  );

  matchCache.delete(matchId);
  const computed = getOrRebuildMatchState(matchId);
  setImmediate(() => broadcastMatchState(matchId));

  res.json({ success: true, state: computed.fullMatchState });
});

// GET /api/fixtures - Fetch pre-configured tournament fixtures
app.get('/api/fixtures', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const fixtures = [
      {
        id: 'fix-101',
        tournamentName: 'MAPL 2026',
        groupLabel: 'Quarter Final 1',
        teamA: 'SIPL WARRIORS',
        teamB: 'KANDLA TIGERS',
        squadA: ['Rajesh Patel', 'Devendra Jadeja', 'Amit Sharma', 'Pritesh Shah', 'Hardik Vora', 'Bhavin Solanki', 'Ketan Joshi', 'Sanjay Mehta', 'Sunil Gadhvi', 'Nilesh Ahir', 'Jayesh Patel'],
        squadB: ['Vikram Rathod', 'Harish Parmar', 'Girish Kothari', 'Ramesh Solanki', 'Chetan Thakar', 'Mahesh Dave', 'Haresh Bhanushali', 'Mayur Shah', 'Pratik Chawda', 'Dharmendra K', 'Manish Maheshwari']
      },
      {
        id: 'fix-102',
        tournamentName: 'MAPL 2026',
        groupLabel: 'Quarter Final 2',
        teamA: 'GANDHIDHAM SUPER KINGS',
        teamB: 'KUTCH ROYAL STRIKERS',
        squadA: ['Aarav Patel', 'Vivan Shah', 'Aditya Joshi'],
        squadB: ['Rohan Mehta', 'Yash Varma', 'Karan Solanki']
      }
    ];
    res.json(fixtures);
  } catch (err) {
    res.json([]);
  }
});

// Seed default fixtures if database is empty
function seedDefaultData() {
  const matchCount = db.prepare('SELECT COUNT(*) as count FROM matches').get().count;
  if (matchCount > 0) return;

  console.log('Seeding default match fixtures into SQLite database...');

  const squadA = ['Rajesh Patel', 'Devendra Jadeja', 'Amit Sharma', 'Pritesh Shah', 'Hardik Vora', 'Bhavin Solanki', 'Ketan Joshi', 'Sanjay Mehta', 'Sunil Gadhvi', 'Nilesh Ahir', 'Jayesh Patel'];
  const squadB = ['Vikram Rathod', 'Harish Parmar', 'Girish Kothari', 'Ramesh Solanki', 'Chetan Thakar', 'Mahesh Dave', 'Haresh Bhanushali', 'Mayur Shah', 'Pratik Chawda', 'Dharmendra K', 'Manish Maheshwari'];

  const matchId = 'match-101';
  const pinHash = hashPin('1234');
  const token = 'token-101-active';

  db.prepare(`
    INSERT INTO matches (
      id, tournament_name, group_label, ground, city, details, date, time,
      total_overs, players_per_side, team_a_json, team_b_json, toss_winner, toss_choice,
      pin_hash, active_scorer_token, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    matchId, 'MAPL 2026', 'Quarter Final 1', 'Sun Valley Ground', 'Gandhidham', 'Type B, Rs. 5000 Entry', '26-Sep-2026', '02:30 PM IST',
    20, 11,
    JSON.stringify({ name: 'SIPL WARRIORS', shortName: 'SWW', logoColor: '#dc2626', logoText: 'S', squad: squadA }),
    JSON.stringify({ name: 'KANDLA TIGERS', shortName: 'KGT', logoColor: '#059669', logoText: 'K', squad: squadB }),
    'KANDLA TIGERS', 'bowl', pinHash, token, 'live', Date.now()
  );

  db.prepare(`
    INSERT INTO innings (
      id, match_id, innings_num, batting_team, bowling_team, target, opening_batter1, opening_batter2, opening_bowler, is_completed, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(`${matchId}-inn1`, matchId, 1, 'SIPL WARRIORS', 'KANDLA TIGERS', null, squadA[0], squadA[1], squadB[0], 1, Date.now());

  db.prepare(`
    INSERT INTO innings (
      id, match_id, innings_num, batting_team, bowling_team, target, opening_batter1, opening_batter2, opening_bowler, is_completed, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(`${matchId}-inn2`, matchId, 2, 'KANDLA TIGERS', 'SIPL WARRIORS', 187, squadB[0], squadB[1], squadA[0], 0, Date.now());

  // Seed sample balls for match-101
  const initialBalls = [
    { striker: squadB[0], nonStriker: squadB[1], bowler: squadA[0], runsBat: 1 },
    { striker: squadB[1], nonStriker: squadB[0], bowler: squadA[0], runsBat: 4 },
    { striker: squadB[1], nonStriker: squadB[0], bowler: squadA[0], runsBat: 6 },
    { striker: squadB[1], nonStriker: squadB[0], bowler: squadA[0], runsBat: 0, isWicket: 1, dismissalType: 'caught', fielder: squadA[2], nextBatter: squadB[2] },
    { striker: squadB[2], nonStriker: squadB[0], bowler: squadA[0], runsBat: 2 }
  ];

  initialBalls.forEach((b, idx) => {
    db.prepare(`
      INSERT INTO balls (
        id, match_id, innings_num, ball_index, over_num, ball_num,
        striker, non_striker, bowler, runs_bat, is_wide, is_no_ball, is_bye, is_leg_bye,
        extra_runs, is_wicket, dismissal_type, dismissed_player, fielder, next_batter, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `ball-101-${idx+1}`, matchId, 2, idx + 1, 0, idx + 1,
      b.striker, b.nonStriker, b.bowler, b.runsBat || 0, b.isWide ? 1 : 0, b.isNoBall ? 1 : 0, 0, 0,
      0, b.isWicket ? 1 : 0, b.dismissalType || null, b.isWicket ? b.striker : null, b.fielder || null, b.nextBatter || null, Date.now() + idx
    );
  });

  // Seed match-102
  const matchId2 = 'match-102';
  db.prepare(`
    INSERT INTO matches (
      id, tournament_name, group_label, ground, city, details, date, time,
      total_overs, players_per_side, team_a_json, team_b_json, toss_winner, toss_choice,
      pin_hash, active_scorer_token, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    matchId2, 'MAPL 2026', 'Group Stage - Group A', 'Kutch Cricket Association Ground', 'Gandhidham', 'Type A Turf Ground', '26-Sep-2026', '04:00 PM IST',
    20, 11,
    JSON.stringify({ name: 'BHUJ ROYALS', shortName: 'BJR', logoColor: '#2563eb', logoText: 'B', squad: squadA }),
    JSON.stringify({ name: 'GANDHIDHAM KINGS', shortName: 'GDK', logoColor: '#d97706', logoText: 'G', squad: squadB }),
    'BHUJ ROYALS', 'bat', pinHash, 'token-102-active', 'live', Date.now()
  );

  db.prepare(`
    INSERT INTO innings (
      id, match_id, innings_num, batting_team, bowling_team, target, opening_batter1, opening_batter2, opening_bowler, is_completed, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(`${matchId2}-inn1`, matchId2, 1, 'BHUJ ROYALS', 'GANDHIDHAM KINGS', null, squadA[0], squadA[1], squadB[0], 0, Date.now());

  // Seed completed match-301
  const matchId3 = 'match-301';
  db.prepare(`
    INSERT OR REPLACE INTO matches (
      id, tournament_name, group_label, ground, city, details, date, time,
      total_overs, players_per_side, team_a_json, team_b_json, toss_winner, toss_choice,
      pin_hash, active_scorer_token, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    matchId3, 'MAPL 2026', 'Group B - Match 12', 'Kutch Cricket Association Ground', 'Gandhidham', 'Day Match', '25-Sep-2026', '10:00 AM IST',
    20, 11,
    JSON.stringify({ name: 'KUTCH SUPER KINGS', shortName: 'KSK', logoColor: '#ca8a04', logoText: 'K', squad: squadA }),
    JSON.stringify({ name: 'MUNDRA LIONS', shortName: 'MNL', logoColor: '#0284c7', logoText: 'M', squad: squadB }),
    'KUTCH SUPER KINGS', 'bat', pinHash, 'token-301-active', 'completed', Date.now()
  );

  db.prepare(`
    INSERT OR REPLACE INTO innings (
      id, match_id, innings_num, batting_team, bowling_team, target, opening_batter1, opening_batter2, opening_bowler, is_completed, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(`${matchId3}-inn1`, matchId3, 1, 'KUTCH SUPER KINGS', 'MUNDRA LIONS', null, squadA[0], squadA[1], squadB[0], 1, Date.now());

  db.prepare(`
    INSERT OR REPLACE INTO innings (
      id, match_id, innings_num, batting_team, bowling_team, target, opening_batter1, opening_batter2, opening_bowler, is_completed, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(`${matchId3}-inn2`, matchId3, 2, 'MUNDRA LIONS', 'KUTCH SUPER KINGS', 187, squadB[0], squadB[1], squadA[0], 1, Date.now());

  console.log('Seeding default matches completed.');
}

seedDefaultData();

httpServer.listen(PORT, () => {
  console.log(`Backend Engine server listening on http://localhost:${PORT}`);
});
