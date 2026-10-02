/**
 * Match Detail Service & Data Layer
 * 
 * Data shape for getMatchDetail(matchId) covering Live, Scorecard, Commentary, Squads, Analysis, Info tabs.
 * TODO: Replace mock data with real WebSocket / polling live data layer (e.g. GET /api/matches/:id/live)
 */

export const mockMatchDetails = {
  "match-101": {
    matchId: "match-101",
    tournamentName: "MAPL 2026",
    roundLabel: "Quarter Final 1",
    status: "live", // 'live' | 'completed' | 'upcoming'
    ground: "Sun Valley Ground, Gandhidham",
    city: "Gandhidham",
    details: "Type B, Rs. 5000 Entry",
    date: "26-Sep-2026",
    time: "02:30 PM IST",
    oversLabel: "20 Ov.",
    tossText: "KANDLA TIGERS won the toss and elected to bowl",
    tossWinner: "KANDLA TIGERS",
    tossChoice: "bowl",
    currentInningsIndex: 2, // 1 or 2
    chaseStatusText: "KANDLA TIGERS need 33 runs off 22 balls (RRR 9.00)",
    resultText: null,

    // Header Teams
    teamA: {
      name: "SIPL WARRIORS",
      shortName: "SWW",
      logoColor: "#dc2626",
      logoText: "S",
      score: "186/4",
      overs: "20.0",
      hasBatted: true,
      isBatting: false,
    },
    teamB: {
      name: "KANDLA TIGERS",
      shortName: "KGT",
      logoColor: "#059669",
      logoText: "K",
      score: "154/5",
      overs: "16.2",
      hasBatted: true,
      isBatting: true, // Currently batting
    },

    // LIVE TAB SPECIFICS
    liveData: {
      currentBatters: [
        { name: "Rajesh Patel", isStriker: true, runs: 42, balls: 26, fours: 4, sixes: 2, sr: "161.54" },
        { name: "Devendra Jadeja", isStriker: false, runs: 18, balls: 11, fours: 2, sixes: 0, sr: "163.64" },
      ],
      currentBowler: {
        name: "Vikram Rathod",
        overs: "3.2",
        maidens: 0,
        runs: 31,
        wickets: 2,
        econ: "9.30",
      },
      currentPartnership: {
        runs: 38,
        balls: 21,
      },
      recentBalls: [
        { type: "over_boundary", label: "divider" },
        { ball: "15.6", val: "1", type: "single" },
        { ball: "16.1", val: "4", type: "four" },
        { ball: "16.2", val: "6", type: "six" },
        { ball: "16.3", val: "1", type: "single" },
        { ball: "16.4", val: "W", type: "wicket" },
        { ball: "16.5", val: "2", type: "double" },
        { ball: "16.6", val: "0", type: "dot" },
        { type: "over_boundary", label: "divider" },
        { ball: "17.1", val: "4", type: "four" },
        { ball: "17.2", val: "1", type: "single" },
      ],
      bannerText: "KANDLA TIGERS require 33 runs in 16 balls to reach the Semi Finals",
      bannerType: "live_chase",
    },

    // SCORECARD TAB SPECIFICS (Two Innings)
    scorecard: [
      {
        inningsNum: 1,
        teamName: "SIPL WARRIORS",
        shortName: "SWW",
        scoreText: "186/4 (20.0 Ov)",
        batting: [
          { name: "Amit Sharma", dismissal: "c Ramesh b Harish", runs: 58, balls: 34, fours: 7, sixes: 3, sr: "170.59" },
          { name: "Pritesh Shah", dismissal: "b Harish", runs: 24, balls: 18, fours: 3, sixes: 0, sr: "133.33" },
          { name: "Hardik Vora", dismissal: "c & b Vikram", runs: 62, balls: 40, fours: 6, sixes: 4, sr: "155.00" },
          { name: "Bhavin Solanki", dismissal: "run out (Rajesh)", runs: 15, balls: 12, fours: 1, sixes: 0, sr: "125.00" },
          { name: "Ketan Joshi", dismissal: "not out", runs: 18, balls: 10, fours: 2, sixes: 1, sr: "180.00" },
          { name: "Sanjay Mehta", dismissal: "not out", runs: 4, balls: 6, fours: 0, sixes: 0, sr: "66.67" },
        ],
        extras: "9 (b 1, lb 3, w 4, nb 1)",
        total: "186/4 (20.0 Overs, RR 9.30)",
        didNotBat: ["Sunil Gadhvi", "Nilesh Ahir", "Jayesh Patel", "Manish Maheshwari", "Dharmendra K"],
        fallOfWickets: "52-1 (Pritesh, 5.4 ov), 118-2 (Amit, 12.1 ov), 154-3 (Hardik, 16.5 ov), 175-4 (Bhavin, 18.4 ov)",
        bowling: [
          { name: "Harish Parmar", overs: "4.0", maidens: 0, runs: 34, wickets: 2, econ: "8.50", wd: 2, nb: 0 },
          { name: "Vikram Rathod", overs: "4.0", maidens: 0, runs: 38, wickets: 1, econ: "9.50", wd: 1, nb: 1 },
          { name: "Girish Kothari", overs: "4.0", maidens: 0, runs: 42, wickets: 0, econ: "10.50", wd: 1, nb: 0 },
          { name: "Ramesh Solanki", overs: "4.0", maidens: 0, runs: 36, wickets: 0, econ: "9.00", wd: 0, nb: 0 },
          { name: "Chetan Thakar", overs: "4.0", maidens: 0, runs: 32, wickets: 0, econ: "8.00", wd: 0, nb: 0 },
        ],
      },
      {
        inningsNum: 2,
        teamName: "KANDLA TIGERS",
        shortName: "KGT",
        scoreText: "154/5 (16.2 Ov)",
        batting: [
          { name: "Ramesh Solanki", dismissal: "b Ketan", runs: 32, balls: 20, fours: 4, sixes: 1, sr: "160.00" },
          { name: "Chetan Thakar", dismissal: "c Pritesh b Nilesh", runs: 45, balls: 28, fours: 5, sixes: 2, sr: "160.71" },
          { name: "Harish Parmar", dismissal: "lbw b Nilesh", runs: 8, balls: 6, fours: 1, sixes: 0, sr: "133.33" },
          { name: "Girish Kothari", dismissal: "c Hardik b Sunil", runs: 0, balls: 2, fours: 0, sixes: 0, sr: "0.00" },
          { name: "Rajesh Patel", dismissal: "not out", runs: 42, balls: 26, fours: 4, sixes: 2, sr: "161.54" },
          { name: "Devendra Jadeja", dismissal: "not out", runs: 18, balls: 11, fours: 2, sixes: 0, sr: "163.64" },
        ],
        extras: "9 (b 2, lb 2, w 5, nb 0)",
        total: "154/5 (16.2 Overs, RR 9.43)",
        didNotBat: ["Vikram Rathod", "Mahesh Dave", "Haresh Bhanushali", "Mayur Shah", "Pratik Chawda"],
        fallOfWickets: "68-1 (Ramesh, 7.2 ov), 85-2 (Harish, 9.1 ov), 86-3 (Girish, 9.4 ov), 112-4 (Chetan, 12.5 ov)",
        bowling: [
          { name: "Nilesh Ahir", overs: "4.0", maidens: 0, runs: 32, wickets: 2, econ: "8.00", wd: 2, nb: 0 },
          { name: "Sunil Gadhvi", overs: "4.0", maidens: 0, runs: 35, wickets: 1, econ: "8.75", wd: 1, nb: 0 },
          { name: "Ketan Joshi", overs: "3.2", maidens: 0, runs: 31, wickets: 1, econ: "9.30", wd: 1, nb: 0 },
          { name: "Jayesh Patel", overs: "3.0", maidens: 0, runs: 28, wickets: 0, econ: "9.33", wd: 1, nb: 0 },
          { name: "Sanjay Mehta", overs: "2.0", maidens: 0, runs: 24, wickets: 0, econ: "12.00", wd: 0, nb: 0 },
        ],
      },
    ],

    // COMMENTARY TAB SPECIFICS
    commentary: [
      { ball: "16.2", runs: 6, isWicket: false, isBoundary: true, text: "SIX! Boom! Devendra Jadeja connects cleanly over mid-wicket for a massive 85m maximum!", type: "six" },
      { ball: "16.1", runs: 4, isWicket: false, isBoundary: true, text: "FOUR! Superb placement from Rajesh Patel, slashes hard past backward point for four!", type: "four" },
      { ball: "16.0", isOverSummary: true, text: "End of over 16: 12 runs, 1 wicket • KANDLA TIGERS 144/5 (Need 43 off 24 balls)" },
      { ball: "15.6", runs: 1, isWicket: false, isBoundary: false, text: "Ketan Joshi to Rajesh Patel, 1 run, driven down to long-on for a single.", type: "single" },
      { ball: "15.5", runs: 0, isWicket: true, isBoundary: false, text: "OUT! Caught at long-off! Chetan Thakar tries to clear the boundary but finds Pritesh Shah! Big wicket for SIPL Warriors!", type: "wicket" },
      { ball: "15.4", runs: 4, isWicket: false, isBoundary: true, text: "FOUR! Short ball punished! Pulled away behind square leg for four runs.", type: "four" },
      { ball: "15.3", runs: 1, isWicket: false, isBoundary: false, text: "Tucked away off the pads to deep midwicket for one.", type: "single" },
      { ball: "15.2", runs: 0, isWicket: false, isBoundary: false, text: "Good yorker length on off stump, jammed out back to the bowler.", type: "dot" },
      { ball: "15.1", runs: 6, isWicket: false, isBoundary: true, text: "SIX! Stand and deliver! Dispatched over long-on for six!", type: "six" },
      { ball: "15.0", isOverSummary: true, text: "End of over 15: 8 runs, 0 wickets • KANDLA TIGERS 132/4" },
    ],

    // SQUADS TAB SPECIFICS
    squads: {
      teamA: {
        name: "SIPL WARRIORS",
        players: [
          { name: "Amit Sharma", role: "Batter", isCaptain: true, isWK: false },
          { name: "Pritesh Shah", role: "Batter", isCaptain: false, isWK: true },
          { name: "Hardik Vora", role: "All-rounder", isCaptain: false, isWK: false },
          { name: "Bhavin Solanki", role: "Batter", isCaptain: false, isWK: false },
          { name: "Ketan Joshi", role: "Bowler", isCaptain: false, isWK: false },
          { name: "Sanjay Mehta", role: "Bowler", isCaptain: false, isWK: false },
          { name: "Sunil Gadhvi", role: "Bowler", isCaptain: false, isWK: false },
          { name: "Nilesh Ahir", role: "Bowler", isCaptain: false, isWK: false },
          { name: "Jayesh Patel", role: "All-rounder", isCaptain: false, isWK: false },
          { name: "Manish Maheshwari", role: "Batter", isCaptain: false, isWK: false },
          { name: "Dharmendra K", role: "Bowler", isCaptain: false, isWK: false },
        ]
      },
      teamB: {
        name: "KANDLA TIGERS",
        players: [
          { name: "Ramesh Solanki", role: "Batter", isCaptain: true, isWK: false },
          { name: "Chetan Thakar", role: "Batter", isCaptain: false, isWK: false },
          { name: "Harish Parmar", role: "Bowler", isCaptain: false, isWK: false },
          { name: "Girish Kothari", role: "All-rounder", isCaptain: false, isWK: false },
          { name: "Rajesh Patel", role: "Wicketkeeper", isCaptain: false, isWK: true },
          { name: "Devendra Jadeja", role: "All-rounder", isCaptain: false, isWK: false },
          { name: "Vikram Rathod", role: "Bowler", isCaptain: false, isWK: false },
          { name: "Mahesh Dave", role: "Bowler", isCaptain: false, isWK: false },
          { name: "Haresh Bhanushali", role: "Batter", isCaptain: false, isWK: false },
          { name: "Mayur Shah", role: "Bowler", isCaptain: false, isWK: false },
          { name: "Pratik Chawda", role: "Bowler", isCaptain: false, isWK: false },
        ]
      }
    },

    // ANALYSIS TAB SPECIFICS (Manhattan & Worm SVG charts)
    analysis: {
      manhattan: [
        { over: 1, runs: 8, wickets: 0 },
        { over: 2, runs: 12, wickets: 0 },
        { over: 3, runs: 6, wickets: 0 },
        { over: 4, runs: 14, wickets: 0 },
        { over: 5, runs: 9, wickets: 0 },
        { over: 6, runs: 3, wickets: 1 },
        { over: 7, runs: 11, wickets: 0 },
        { over: 8, runs: 15, wickets: 0 },
        { over: 9, runs: 7, wickets: 0 },
        { over: 10, runs: 10, wickets: 0 },
        { over: 11, runs: 8, wickets: 0 },
        { over: 12, runs: 5, wickets: 1 },
        { over: 13, runs: 13, wickets: 0 },
        { over: 14, runs: 16, wickets: 0 },
        { over: 15, runs: 9, wickets: 0 },
        { over: 16, runs: 8, wickets: 1 },
        { over: 17, runs: 12, wickets: 1 },
        { over: 18, runs: 7, wickets: 0 },
        { over: 19, runs: 9, wickets: 1 },
        { over: 20, runs: 4, wickets: 0 },
      ],
      worm: {
        innings1: [
          { over: 0, runs: 0 }, { over: 1, runs: 8 }, { over: 2, runs: 20 }, { over: 3, runs: 26 },
          { over: 4, runs: 40 }, { over: 5, runs: 49 }, { over: 6, runs: 52 }, { over: 7, runs: 63 },
          { over: 8, runs: 78 }, { over: 9, runs: 85 }, { over: 10, runs: 95 }, { over: 11, runs: 103 },
          { over: 12, runs: 108 }, { over: 13, runs: 121 }, { over: 14, runs: 137 }, { over: 15, runs: 146 },
          { over: 16, runs: 154 }, { over: 17, runs: 166 }, { over: 18, runs: 173 }, { over: 19, runs: 182 },
          { over: 20, runs: 186 }
        ],
        innings2: [
          { over: 0, runs: 0 }, { over: 1, runs: 10 }, { over: 2, runs: 22 }, { over: 3, runs: 30 },
          { over: 4, runs: 42 }, { over: 5, runs: 50 }, { over: 6, runs: 58 }, { over: 7, runs: 66 },
          { over: 8, runs: 75 }, { over: 9, runs: 85 }, { over: 10, runs: 88 }, { over: 11, runs: 98 },
          { over: 12, runs: 106 }, { over: 13, runs: 114 }, { over: 14, runs: 124 }, { over: 15, runs: 132 },
          { over: 16, runs: 144 }, { over: 16.2, runs: 154 }
        ]
      },
      runRateTable: [
        { overRange: "1 - 5", inn1Runs: 49, inn1RR: "9.80", inn2Runs: 50, inn2RR: "10.00" },
        { overRange: "6 - 10", inn1Runs: 46, inn1RR: "9.20", inn2Runs: 38, inn2RR: "7.60" },
        { overRange: "11 - 15", inn1Runs: 51, inn1RR: "10.20", inn2Runs: 44, inn2RR: "8.80" },
        { overRange: "16 - 20", inn1Runs: 40, inn1RR: "8.00", inn2Runs: 22, inn2RR: "9.43" },
      ]
    },

    // INFO TAB SPECIFICS
    info: {
      tournament: "MAPL 2026 (Monsoon Agriculture Premier League)",
      round: "Quarter Final 1",
      teams: "SIPL WARRIORS vs KANDLA TIGERS",
      toss: "KANDLA TIGERS won the toss and elected to bowl",
      overs: "20 Overs per side (T20 format)",
      playersPerSide: "11 Playing XI + 4 Substitutes",
      ground: "Sun Valley Cricket Ground, Gandhidham",
      city: "Gandhidham, Kutch, Gujarat",
      date: "Saturday, 26-Sep-2026",
      time: "02:30 PM IST",
      umpires: "Suresh Sharma, Rajesh Varma",
      thirdUmpire: "Deepak Joshi",
      matchReferee: "Kirit Merchant",
    },

    // SIDE PANEL SPECIFICS
    sidePanel: {
      currentRR: "9.43",
      requiredRR: "9.00",
      target: "187",
      projectedScore: "188",
      seriesName: "MAPL 2026",
      seriesLink: "/#mapl-2026",
      matchDate: "26-Sep-2026",
      location: "Sun Valley Ground, Gandhidham",
      locationLink: "/venues/sun-valley",
      lastUpdatedScorer: "Scorer: Amit (Umpire 1)",
      lastUpdatedTime: "Just now (Live)",
    }
  },

  "match-301": {
    matchId: "match-301",
    tournamentName: "MAPL 2026",
    roundLabel: "Group B - Match 12",
    status: "completed",
    ground: "Kutch Cricket Association Ground, Gandhidham",
    city: "Gandhidham",
    details: "Day Match",
    date: "25-Sep-2026",
    time: "10:00 AM IST",
    oversLabel: "20 Ov.",
    tossText: "MUNDRA LIONS won the toss and elected to bowl",
    tossWinner: "MUNDRA LIONS",
    tossChoice: "bowl",
    currentInningsIndex: 2,
    chaseStatusText: null,
    resultText: "KUTCH SUPER KINGS won by 24 runs",

    teamA: {
      name: "KUTCH SUPER KINGS",
      shortName: "KSK",
      logoColor: "#ca8a04",
      logoText: "K",
      score: "186/4",
      overs: "20.0",
      hasBatted: true,
      isBatting: false,
    },
    teamB: {
      name: "MUNDRA LIONS",
      shortName: "MNL",
      logoColor: "#0284c7",
      logoText: "M",
      score: "162/9",
      overs: "20.0",
      hasBatted: true,
      isBatting: false,
    },

    liveData: {
      currentBatters: [
        { name: "Prakash Patel", isStriker: false, runs: 12, balls: 14, fours: 1, sixes: 0, sr: "85.71" },
        { name: "Vipul Mehta", isStriker: false, runs: 4, balls: 6, fours: 0, sixes: 0, sr: "66.67" },
      ],
      currentBowler: {
        name: "Dharmesh Shah",
        overs: "4.0",
        maidens: 0,
        runs: 28,
        wickets: 3,
        econ: "7.00",
      },
      currentPartnership: {
        runs: 16,
        balls: 20,
      },
      recentBalls: [
        { ball: "19.1", val: "1", type: "single" },
        { ball: "19.2", val: "0", type: "dot" },
        { ball: "19.3", val: "1", type: "single" },
        { ball: "19.4", val: "W", type: "wicket" },
        { ball: "19.5", val: "2", type: "double" },
        { ball: "19.6", val: "0", type: "dot" },
      ],
      bannerText: "MATCH COMPLETED • KUTCH SUPER KINGS WON BY 24 RUNS",
      bannerType: "completed_result",
    },

    scorecard: [
      {
        inningsNum: 1,
        teamName: "KUTCH SUPER KINGS",
        shortName: "KSK",
        scoreText: "186/4 (20.0 Ov)",
        batting: [
          { name: "Dinesh Patel", dismissal: "c Alok b Tarun", runs: 64, balls: 41, fours: 8, sixes: 2, sr: "156.10" },
          { name: "Mahesh Solanki", dismissal: "run out (Kiran)", runs: 38, balls: 25, fours: 4, sixes: 1, sr: "152.00" },
          { name: "Ketan Gadhvi", dismissal: "not out", runs: 52, balls: 32, fours: 5, sixes: 3, sr: "162.50" },
          { name: "Suresh Joshi", dismissal: "b Tarun", runs: 18, balls: 14, fours: 2, sixes: 0, sr: "128.57" },
          { name: "Bharat Ahir", dismissal: "not out", runs: 8, balls: 8, fours: 0, sixes: 0, sr: "100.00" },
        ],
        extras: "6 (b 1, lb 1, w 4, nb 0)",
        total: "186/4 (20.0 Overs, RR 9.30)",
        didNotBat: ["Dharmesh Shah", "Nitin Vora", "Jayesh Kothari", "Vijay Bhanushali"],
        fallOfWickets: "72-1 (Mahesh, 8.2 ov), 124-2 (Dinesh, 14.1 ov), 158-3 (Suresh, 17.5 ov)",
        bowling: [
          { name: "Tarun Kothari", overs: "4.0", maidens: 0, runs: 36, wickets: 2, econ: "9.00", wd: 2, nb: 0 },
          { name: "Alok Dave", overs: "4.0", maidens: 0, runs: 42, wickets: 0, econ: "10.50", wd: 1, nb: 0 },
          { name: "Kiran Parmar", overs: "4.0", maidens: 0, runs: 32, wickets: 0, econ: "8.00", wd: 1, nb: 0 },
          { name: "Prashant Shah", overs: "4.0", maidens: 0, runs: 40, wickets: 0, econ: "10.00", wd: 0, nb: 0 },
        ],
      },
      {
        inningsNum: 2,
        teamName: "MUNDRA LIONS",
        shortName: "MNL",
        scoreText: "162/9 (20.0 Ov)",
        batting: [
          { name: "Kiran Parmar", dismissal: "b Dharmesh", runs: 42, balls: 28, fours: 5, sixes: 1, sr: "150.00" },
          { name: "Alok Dave", dismissal: "c Dinesh b Dharmesh", runs: 28, balls: 19, fours: 3, sixes: 1, sr: "147.37" },
          { name: "Tarun Kothari", dismissal: "c Suresh b Nitin", runs: 35, balls: 22, fours: 4, sixes: 2, sr: "159.09" },
          { name: "Prashant Shah", dismissal: "lbw b Dharmesh", runs: 14, balls: 12, fours: 1, sixes: 0, sr: "116.67" },
          { name: "Prakash Patel", dismissal: "not out", runs: 12, balls: 14, fours: 1, sixes: 0, sr: "85.71" },
          { name: "Vipul Mehta", dismissal: "not out", runs: 4, balls: 6, fours: 0, sixes: 0, sr: "66.67" },
        ],
        extras: "27 (b 4, lb 3, w 18, nb 2)",
        total: "162/9 (20.0 Overs, RR 8.10)",
        didNotBat: [],
        fallOfWickets: "50-1 (Alok, 5.4 ov), 92-2 (Kiran, 10.1 ov), 120-3 (Tarun, 14.3 ov), 145-4 (Prashant, 17.2 ov)",
        bowling: [
          { name: "Dharmesh Shah", overs: "4.0", maidens: 0, runs: 28, wickets: 3, econ: "7.00", wd: 2, nb: 0 },
          { name: "Nitin Vora", overs: "4.0", maidens: 0, runs: 32, wickets: 2, econ: "8.00", wd: 1, nb: 0 },
          { name: "Jayesh Kothari", overs: "4.0", maidens: 0, runs: 38, wickets: 1, econ: "9.50", wd: 3, nb: 1 },
          { name: "Vijay Bhanushali", overs: "4.0", maidens: 0, runs: 35, wickets: 1, econ: "8.75", wd: 2, nb: 0 },
        ],
      }
    ],

    commentary: [
      { ball: "20.0", isOverSummary: true, text: "End of Match • KUTCH SUPER KINGS win by 24 runs!" },
      { ball: "19.6", runs: 0, isWicket: false, isBoundary: false, text: "Dot ball to finish off the match! KUTCH SUPER KINGS win by 24 runs!", type: "dot" },
      { ball: "19.4", runs: 0, isWicket: true, isBoundary: false, text: "OUT! Bowled him! Dharmesh Shah cleans up the tail!", type: "wicket" },
    ],

    squads: {
      teamA: {
        name: "KUTCH SUPER KINGS",
        players: [
          { name: "Dinesh Patel", role: "Batter", isCaptain: true, isWK: false },
          { name: "Mahesh Solanki", role: "Batter", isCaptain: false, isWK: false },
          { name: "Ketan Gadhvi", role: "All-rounder", isCaptain: false, isWK: false },
          { name: "Dharmesh Shah", role: "Bowler", isCaptain: false, isWK: false },
        ]
      },
      teamB: {
        name: "MUNDRA LIONS",
        players: [
          { name: "Kiran Parmar", role: "Batter", isCaptain: true, isWK: false },
          { name: "Alok Dave", role: "All-rounder", isCaptain: false, isWK: false },
          { name: "Tarun Kothari", role: "Bowler", isCaptain: false, isWK: false },
        ]
      }
    },

    analysis: {
      manhattan: [
        { over: 1, runs: 10, wickets: 0 }, { over: 2, runs: 12, wickets: 0 }, { over: 3, runs: 8, wickets: 0 },
        { over: 4, runs: 14, wickets: 0 }, { over: 5, runs: 6, wickets: 1 }, { over: 6, runs: 8, wickets: 0 },
        { over: 7, runs: 10, wickets: 0 }, { over: 8, runs: 7, wickets: 0 }, { over: 9, runs: 10, wickets: 0 },
        { over: 10, runs: 3, wickets: 1 }, { over: 11, runs: 10, wickets: 0 }, { over: 12, runs: 8, wickets: 0 },
        { over: 13, runs: 8, wickets: 0 }, { over: 14, runs: 10, wickets: 0 }, { over: 15, runs: 8, wickets: 1 },
        { over: 16, runs: 12, wickets: 0 }, { over: 17, runs: 8, wickets: 0 }, { over: 18, runs: 4, wickets: 1 },
        { over: 19, runs: 6, wickets: 0 }, { over: 20, runs: 6, wickets: 1 }
      ],
      worm: {
        innings1: [
          { over: 0, runs: 0 }, { over: 5, runs: 48 }, { over: 10, runs: 94 }, { over: 15, runs: 142 }, { over: 20, runs: 186 }
        ],
        innings2: [
          { over: 0, runs: 0 }, { over: 5, runs: 50 }, { over: 10, runs: 92 }, { over: 15, runs: 124 }, { over: 20, runs: 162 }
        ]
      },
      runRateTable: [
        { overRange: "1 - 5", inn1Runs: 48, inn1RR: "9.60", inn2Runs: 50, inn2RR: "10.00" },
        { overRange: "6 - 10", inn1Runs: 46, inn1RR: "9.20", inn2Runs: 42, inn2RR: "8.40" },
        { overRange: "11 - 15", inn1Runs: 48, inn1RR: "9.60", inn2Runs: 32, inn2RR: "6.40" },
        { overRange: "16 - 20", inn1Runs: 44, inn1RR: "8.80", inn2Runs: 38, inn2RR: "7.60" },
      ]
    },

    info: {
      tournament: "MAPL 2026",
      round: "Group B - Match 12",
      teams: "KUTCH SUPER KINGS vs MUNDRA LIONS",
      toss: "MUNDRA LIONS won the toss and elected to bowl",
      overs: "20 Overs",
      playersPerSide: "11 Players",
      ground: "Kutch Cricket Association Ground, Gandhidham",
      city: "Gandhidham",
      date: "Friday, 25-Sep-2026",
      time: "10:00 AM IST",
      umpires: "Anil Patel, Haresh Shah",
      thirdUmpire: "Nilesh Joshi",
      matchReferee: "Sanjay Parmar",
    },

    sidePanel: {
      currentRR: "8.10",
      requiredRR: "-",
      target: "187",
      projectedScore: "162",
      seriesName: "MAPL 2026",
      seriesLink: "/#mapl-2026",
      matchDate: "25-Sep-2026",
      location: "Kutch Cricket Association Ground",
      locationLink: "/venues/kutch-ca",
      lastUpdatedScorer: "Scorer: Haresh (Official)",
      lastUpdatedTime: "Match Completed",
    }
  }
};

/**
 * Fetch match details object for a given match ID
 */
export const getMatchDetail = (matchId) => {
  if (mockMatchDetails[matchId]) {
    return mockMatchDetails[matchId];
  }
  // Fallback to match-101 for any unspecified matchId
  return {
    ...mockMatchDetails["match-101"],
    matchId: matchId || "match-101",
  };
};

/**
 * Simulates a live score update (adding 4 runs or a ball to the live match)
 * TODO: Wire to real backend WebSocket / SSE feed in future phase
 */
export const simulateLiveBallUpdate = (matchData) => {
  if (!matchData || matchData.status !== 'live') return matchData;

  const currentScoreParts = matchData.teamB.score.split('/');
  const runs = parseInt(currentScoreParts[0]) + 4;
  const wickets = currentScoreParts[1];

  const currentOversParts = matchData.teamB.overs.split('.');
  let overNum = parseInt(currentOversParts[0]);
  let ballNum = parseInt(currentOversParts[1]) + 1;

  if (ballNum >= 6) {
    overNum += 1;
    ballNum = 0;
  }

  const updatedOvers = `${overNum}.${ballNum}`;
  const updatedScore = `${runs}/${wickets}`;
  const runsNeeded = 187 - runs;
  const ballsRemaining = 120 - (overNum * 6 + ballNum);
  const rrr = ballsRemaining > 0 ? ((runsNeeded / ballsRemaining) * 6).toFixed(2) : "0.00";

  return {
    ...matchData,
    chaseStatusText: `KANDLA TIGERS need ${runsNeeded} runs off ${ballsRemaining} balls (RRR ${rrr})`,
    teamB: {
      ...matchData.teamB,
      score: updatedScore,
      overs: updatedOvers,
    },
    liveData: {
      ...matchData.liveData,
      currentBatters: matchData.liveData.currentBatters.map((b, idx) => 
        idx === 0 ? { ...b, runs: b.runs + 4, fours: b.fours + 1, balls: b.balls + 1 } : b
      ),
      recentBalls: [
        ...matchData.liveData.recentBalls,
        { ball: `${overNum}.${ballNum}`, val: "4", type: "four" }
      ]
    },
    sidePanel: {
      ...matchData.sidePanel,
      lastUpdatedTime: "Just now (Live Ball Added)",
    }
  };
};
