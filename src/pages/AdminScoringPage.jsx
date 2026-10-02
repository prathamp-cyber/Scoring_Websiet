import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '../components/Navbar';
import { 
  Wifi, WifiOff, CheckCircle2, RefreshCw, Undo2, User, 
  RotateCcw, ShieldAlert, Award, ExternalLink, ArrowRight, Lock
} from 'lucide-react';
import { getSocket } from '../services/socketService';
import { fetchMatchState, authenticateScorer, recordBall, undoBall, startSecondInnings } from '../services/apiService';

export function AdminScoringPage({ matchId, onNavigateToMatchCard }) {
  const [matchState, setMatchState] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(`scorer_token_${matchId}`));
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Status & Socket tracking
  const [isConnected, setIsConnected] = useState(true);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving'
  const [tapLocked, setTapLocked] = useState(false);

  // Modal Sheet states
  const [activeModal, setActiveModal] = useState(null); // null | 'wicket' | 'extra_runs' | 'select_bowler' | 'select_batter' | 'start_inn2' | 'match_result'
  const [extraType, setExtraType] = useState(null); // 'wide' | 'noBall' | 'bye' | 'legBye'
  const [pendingExtraRuns, setPendingExtraRuns] = useState(0);

  // Wicket Form
  const [dismissalType, setDismissalType] = useState('bowled');
  const [dismissedPlayer, setDismissedPlayer] = useState('');
  const [fielderName, setFielderName] = useState('');
  const [selectedNextBatter, setSelectedNextBatter] = useState('');
  const [selectedNextBowler, setSelectedNextBowler] = useState('');

  // Innings 2 Opening Form
  const [inn2Batter1, setInn2Batter1] = useState('');
  const [inn2Batter2, setInn2Batter2] = useState('');
  const [inn2Bowler, setInn2Bowler] = useState('');

  const [lastActionSummary, setLastActionSummary] = useState(null);

  // Load initial state & Socket connection
  useEffect(() => {
    fetchMatchState(matchId)
      .then(st => setMatchState(st))
      .catch(err => setAuthError(err.message));

    const socket = getSocket();
    socket.emit('join_room', matchId);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleStateUpdate = (newState) => {
      setMatchState(newState);
      setSaveStatus('saved');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('state', handleStateUpdate);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('state', handleStateUpdate);
      socket.emit('leave_room', matchId);
    };
  }, [matchId]);

  // Check required prompts on state change
  useEffect(() => {
    if (!matchState) return;
    const ctx = matchState.scoringContext;
    if (!ctx) return;

    if (matchState.status === 'completed') {
      setActiveModal('match_result');
      return;
    }

    if (ctx.currentInningsIndex === 1 && !matchState.liveData?.currentBatters[0]?.name) {
      setActiveModal('select_batter');
    } else if (ctx.overComplete && !activeModal) {
      setActiveModal('select_bowler');
    }
  }, [matchState]);

  // Debounced tap lock
  const lockTaps = () => {
    setTapLocked(true);
    setTimeout(() => setTapLocked(false), 250);
  };

  // PIN Authentication Handler
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!pinInput) return;
    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await authenticateScorer(matchId, pinInput);
      localStorage.setItem(`scorer_token_${matchId}`, res.token);
      setToken(res.token);
      setMatchState(res.state);
      setPinInput('');
    } catch (err) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // Record Ball Helper
  const handleScoreAction = async (ballPayload) => {
    if (tapLocked || !isConnected || !token) return;
    lockTaps();
    setSaveStatus('saving');

    const ctx = matchState.scoringContext;
    const defaultPayload = {
      inningsNum: ctx.currentInningsIndex,
      striker: ctx.striker,
      nonStriker: ctx.nonStriker,
      bowler: ctx.bowler,
      runsBat: 0,
      isWide: false,
      isNoBall: false,
      isBye: false,
      isLegBye: false,
      extraRuns: 0,
      isWicket: false,
      ...ballPayload
    };

    try {
      const res = await recordBall(matchId, defaultPayload, token);
      setMatchState(res.state);
      setSaveStatus('saved');
      setLastActionSummary(`Recorded ${defaultPayload.runsBat} run(s)`);
      setActiveModal(null);
    } catch (err) {
      setSaveStatus('saved');
      if (err.message.includes('Another scorer is active') || err.message.includes('401')) {
        setToken(null);
        localStorage.removeItem(`scorer_token_${matchId}`);
        setAuthError('Another device took over scoring. Enter PIN to resume.');
      } else {
        alert(`Error: ${err.message}`);
      }
    }
  };

  // Open Extras Picker Modal
  const openExtrasModal = (type) => {
    setExtraType(type);
    setPendingExtraRuns(0);
    setActiveModal('extra_runs');
  };

  // Submit Extras
  const handleConfirmExtras = () => {
    let payload = {};
    if (extraType === 'wide') {
      payload = { isWide: true, extraRuns: pendingExtraRuns };
    } else if (extraType === 'noBall') {
      payload = { isNoBall: true, runsBat: pendingExtraRuns };
    } else if (extraType === 'bye') {
      payload = { isBye: true, extraRuns: pendingExtraRuns };
    } else if (extraType === 'legBye') {
      payload = { isLegBye: true, extraRuns: pendingExtraRuns };
    }

    handleScoreAction(payload);
  };

  // Open Wicket Modal
  const openWicketModal = () => {
    const ctx = matchState.scoringContext;
    setDismissalType('bowled');
    setDismissedPlayer(ctx.striker);
    setFielderName('');
    
    // Pick first available batter not currently batting
    const currentNames = [ctx.striker, ctx.nonStriker];
    const available = (ctx.availableBatters || []).filter(p => !currentNames.includes(p));
    setSelectedNextBatter(available[0] || '');

    setActiveModal('wicket');
  };

  // Confirm Wicket
  const handleConfirmWicket = () => {
    const ctx = matchState.scoringContext;
    const isRunOut = dismissalType === 'run_out';

    handleScoreAction({
      isWicket: true,
      dismissalType,
      dismissedPlayer: isRunOut ? dismissedPlayer : ctx.striker,
      fielder: fielderName,
      nextBatter: selectedNextBatter
    });
  };

  // Confirm New Bowler Selection
  const handleConfirmBowler = () => {
    if (!selectedNextBowler) return;
    handleScoreAction({
      runsBat: 0,
      nextBowler: selectedNextBowler
    });
  };

  // Undo Last Ball
  const handleUndo = async () => {
    if (tapLocked || !isConnected || !token) return;
    lockTaps();
    setSaveStatus('saving');

    try {
      const res = await undoBall(matchId, token);
      setMatchState(res.state);
      setSaveStatus('saved');
      setLastActionSummary('Undone last ball');
    } catch (err) {
      setSaveStatus('saved');
      alert(err.message);
    }
  };

  // Start 2nd Innings
  const handleStartInn2 = async () => {
    if (!token) return;
    try {
      const res = await startSecondInnings(matchId, {
        openingBatter1: inn2Batter1,
        openingBatter2: inn2Batter2,
        openingBowler: inn2Bowler
      }, token);
      setMatchState(res.state);
      setActiveModal(null);
    } catch (err) {
      alert(err.message);
    }
  };

  // Swap Strike manually
  const handleSwapStrike = () => {
    const ctx = matchState.scoringContext;
    handleScoreAction({
      striker: ctx.nonStriker,
      nonStriker: ctx.striker,
      isNoBall: false,
      isWide: false,
      runsBat: 0
    });
  };

  // If no match data loaded yet
  if (!matchState && !authError) {
    return (
      <div className="app-container admin-scoring-page">
        <Navbar />
        <div className="scoring-loading-container">
          <RefreshCw className="spin-icon" size={32} />
          <p>Loading Match Scoring Engine...</p>
        </div>
      </div>
    );
  }

  // PIN GATE INTERFACE (Unauthenticated or Token Invalid)
  if (!token) {
    return (
      <div className="app-container admin-scoring-page">
        <Navbar />
        <div className="pin-gate-overlay">
          <div className="pin-gate-card">
            <div className="pin-gate-header">
              <Lock size={28} className="pin-gate-icon" />
              <h2>Umpire Scoring Access</h2>
              <p className="pin-gate-match-title">{matchState?.tournamentName} • {matchState?.teamA.name} vs {matchState?.teamB.name}</p>
            </div>

            {authError && (
              <div className="pin-error-alert">
                <ShieldAlert size={18} />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="pin-form">
              <label className="pin-label">Enter 4-6 Digit Scorer PIN</label>
              <input 
                type="password" 
                className="pin-display-input"
                maxLength={6}
                placeholder="••••"
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                autoFocus
              />

              <div className="keypad-grid">
                {['1','2','3','4','5','6','7','8','9','C','0','✓'].map(key => (
                  <button
                    key={key}
                    type="button"
                    className={`keypad-btn ${key === '✓' ? 'btn-submit' : ''} ${key === 'C' ? 'btn-clear' : ''}`}
                    onClick={() => {
                      if (key === 'C') setPinInput('');
                      else if (key === '✓') handleAuthSubmit({ preventDefault: () => {} });
                      else if (pinInput.length < 6) setPinInput(prev => prev + key);
                    }}
                  >
                    {key}
                  </button>
                ))}
              </div>

              <button type="submit" className="pin-submit-btn" disabled={authLoading}>
                {authLoading ? 'Authenticating...' : 'Authenticate Scorer Device'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const { teamA, teamB, liveData, currentInningsIndex, chaseStatusText, scoringContext } = matchState;
  const currentBatters = liveData?.currentBatters || [];
  const currentBowler = liveData?.currentBowler || {};
  const recentBalls = liveData?.recentBalls || [];

  return (
    <div className="app-container admin-scoring-page">
      <Navbar />

      {/* Connection / Offline Overlay Banner */}
      {!isConnected && (
        <div className="offline-warning-banner">
          <WifiOff size={18} />
          <span>No connection - scoring paused, nothing will be lost</span>
        </div>
      )}

      {/* TOP COMPACT SCORE BAR */}
      <header className="scoring-top-bar">
        <div className="score-bar-content">
          <div className="live-status-group">
            <span className={`status-badge ${isConnected ? 'live' : 'reconnecting'}`}>
              <span className="dot-pulse"></span>
              {isConnected ? 'LIVE SCORING' : 'Reconnecting...'}
            </span>

            <span className="save-status-pill">
              {saveStatus === 'saving' ? (
                <><RefreshCw size={12} className="spin-icon" /> Saving...</>
              ) : (
                <><CheckCircle2 size={12} className="text-green-check" /> Saved</>
              )}
            </span>
          </div>

          <div className="compact-score-display">
            <div className="teams-score-line">
              <span className="team-score-item">
                <strong className={teamA.isBatting ? 'active-batting' : ''}>{teamA.shortName}</strong> {teamA.score || 'Yet to bat'}
              </span>
              <span className="vs-slash">vs</span>
              <span className="team-score-item">
                <strong className={teamB.isBatting ? 'active-batting' : ''}>{teamB.shortName}</strong> {teamB.score || 'Yet to bat'}
              </span>
            </div>

            {chaseStatusText && (
              <div className="chase-target-subtext">
                ⚡ {chaseStatusText}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN SCORING PANEL CONTENT */}
      <main className="scoring-main-panel">
        <div className="panel-container">
          {/* ACTIVE PLAYERS ROW */}
          <section className="active-players-section">
            <div className="batters-cards-grid">
              {/* Striker Card */}
              {currentBatters[0] && (
                <div 
                  className="player-card batter-card striker-card"
                  onClick={handleSwapStrike}
                  title="Tap to swap strike manually"
                >
                  <div className="card-badge-row">
                    <span className="role-tag striker">STRIKER *</span>
                    <span className="swap-hint">Tap to swap ⇄</span>
                  </div>
                  <h3 className="player-card-name">{currentBatters[0].name}</h3>
                  <div className="stats-row">
                    <span className="main-stat">{currentBatters[0].runs} <small>({currentBatters[0].balls}b)</small></span>
                    <span className="sub-stat">4s: {currentBatters[0].fours} • 6s: {currentBatters[0].sixes}</span>
                    <span className="sr-stat">SR: {currentBatters[0].sr}</span>
                  </div>
                </div>
              )}

              {/* Non-Striker Card */}
              {currentBatters[1] && (
                <div 
                  className="player-card batter-card non-striker-card"
                  onClick={handleSwapStrike}
                  title="Tap to swap strike manually"
                >
                  <div className="card-badge-row">
                    <span className="role-tag non-striker">NON-STRIKER</span>
                    <span className="swap-hint">Tap to swap ⇄</span>
                  </div>
                  <h3 className="player-card-name">{currentBatters[1].name}</h3>
                  <div className="stats-row">
                    <span className="main-stat">{currentBatters[1].runs} <small>({currentBatters[1].balls}b)</small></span>
                    <span className="sub-stat">4s: {currentBatters[1].fours} • 6s: {currentBatters[1].sixes}</span>
                    <span className="sr-stat">SR: {currentBatters[1].sr}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bowler Card */}
            {currentBowler && (
              <div className="player-card bowler-card">
                <div className="card-badge-row">
                  <span className="role-tag bowler">CURRENT BOWLER</span>
                </div>
                <div className="bowler-card-main">
                  <h3 className="player-card-name">{currentBowler.name}</h3>
                  <div className="bowler-stats-inline">
                    <span className="stat-pill">Overs: <strong>{currentBowler.overs}</strong></span>
                    <span className="stat-pill">Runs: <strong>{currentBowler.runs}</strong></span>
                    <span className="stat-pill highlight-wkts">Wkts: <strong>{currentBowler.wickets}</strong></span>
                    <span className="stat-pill">Econ: {currentBowler.econ}</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* THIS-OVER BALL OUTCOMES ROW */}
          <section className="this-over-section">
            <span className="over-label">THIS OVER:</span>
            <div className="over-chips-list">
              {recentBalls.length > 0 ? (
                recentBalls.map((item, idx) => (
                  item.type === 'over_boundary' ? (
                    <span key={idx} className="chip-divider">|</span>
                  ) : (
                    <span key={idx} className={`outcome-chip chip-${item.type || 'gray'}`}>
                      {item.val}
                    </span>
                  )
                ))
              ) : (
                <span className="no-balls-text">Over starting...</span>
              )}
            </div>
          </section>

          {/* MAIN SCORING PAD */}
          <section className="scoring-pad-section">
            {/* Standard Run Buttons (0, 1, 2, 3) */}
            <div className="runs-grid">
              {[0, 1, 2, 3].map(run => (
                <button
                  key={run}
                  className="pad-btn run-btn"
                  disabled={!isConnected || tapLocked}
                  onClick={() => handleScoreAction({ runsBat: run })}
                >
                  <span className="btn-val">{run}</span>
                  <span className="btn-sub">{run === 0 ? 'Dot' : `${run} Run${run > 1 ? 's' : ''}`}</span>
                </button>
              ))}
            </div>

            {/* Boundary Buttons (4, 6) */}
            <div className="boundaries-grid">
              <button
                className="pad-btn boundary-btn btn-four"
                disabled={!isConnected || tapLocked}
                onClick={() => handleScoreAction({ runsBat: 4 })}
              >
                <span className="btn-val">4</span>
                <span className="btn-sub">FOUR</span>
              </button>

              <button
                className="pad-btn boundary-btn btn-six"
                disabled={!isConnected || tapLocked}
                onClick={() => handleScoreAction({ runsBat: 6 })}
              >
                <span className="btn-val">6</span>
                <span className="btn-sub">SIX</span>
              </button>
            </div>

            {/* Extras Row (Wide, No-Ball, Bye, Leg-Bye) */}
            <div className="extras-grid">
              <button 
                className="pad-btn extra-btn"
                disabled={!isConnected || tapLocked}
                onClick={() => openExtrasModal('wide')}
              >
                Wide (Wd)
              </button>
              <button 
                className="pad-btn extra-btn"
                disabled={!isConnected || tapLocked}
                onClick={() => openExtrasModal('noBall')}
              >
                No Ball (Nb)
              </button>
              <button 
                className="pad-btn extra-btn"
                disabled={!isConnected || tapLocked}
                onClick={() => openExtrasModal('bye')}
              >
                Bye (B)
              </button>
              <button 
                className="pad-btn extra-btn"
                disabled={!isConnected || tapLocked}
                onClick={() => openExtrasModal('legBye')}
              >
                Leg Bye (LB)
              </button>
            </div>

            {/* Distinct Wicket Button */}
            <div className="wicket-row">
              <button
                className="pad-btn wicket-btn"
                disabled={!isConnected || tapLocked}
                onClick={openWicketModal}
              >
                OUT / WICKET
              </button>
            </div>

            {/* Undo Action Bar */}
            <div className="undo-bar-row">
              <button 
                className="undo-btn"
                disabled={!isConnected || tapLocked}
                onClick={handleUndo}
              >
                <Undo2 size={16} /> Undo Last Ball
              </button>
              {lastActionSummary && (
                <span className="undo-last-text">{lastActionSummary}</span>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* MODAL DIALOGS / SHEETS */}

      {/* 1. Extras Modal */}
      {activeModal === 'extra_runs' && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Record {extraType?.toUpperCase()}</h3>
            <p className="modal-sub">Select additional runs taken by batters on this extra ball:</p>

            <div className="extra-runs-selector">
              {[0, 1, 2, 3, 4, 5, 6].map(num => (
                <button
                  key={num}
                  className={`run-select-pill ${pendingExtraRuns === num ? 'active' : ''}`}
                  onClick={() => setPendingExtraRuns(num)}
                >
                  +{num}
                </button>
              ))}
            </div>

            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setActiveModal(null)}>Cancel</button>
              <button className="modal-btn confirm" onClick={handleConfirmExtras}>Confirm Extra Ball</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Wicket Modal */}
      {activeModal === 'wicket' && (
        <div className="modal-overlay">
          <div className="modal-card wicket-modal">
            <h3>Record Wicket / Dismissal</h3>
            
            <div className="form-group">
              <label className="form-label">Dismissal Type</label>
              <select 
                className="form-select" 
                value={dismissalType} 
                onChange={e => setDismissalType(e.target.value)}
              >
                <option value="bowled">Bowled</option>
                <option value="caught">Caught</option>
                <option value="lbw">LBW</option>
                <option value="run_out">Run Out</option>
                <option value="stumped">Stumped</option>
                <option value="hit_wicket">Hit Wicket</option>
              </select>
            </div>

            {dismissalType === 'run_out' && (
              <div className="form-group">
                <label className="form-label">Which Batter is Out?</label>
                <select 
                  className="form-select" 
                  value={dismissedPlayer} 
                  onChange={e => setDismissedPlayer(e.target.value)}
                >
                  <option value={scoringContext.striker}>{scoringContext.striker} (Striker)</option>
                  <option value={scoringContext.nonStriker}>{scoringContext.nonStriker} (Non-Striker)</option>
                </select>
              </div>
            )}

            {(dismissalType === 'caught' || dismissalType === 'stumped' || dismissalType === 'run_out') && (
              <div className="form-group">
                <label className="form-label">Fielder Name (Optional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Fielder Name" 
                  value={fielderName} 
                  onChange={e => setFielderName(e.target.value)} 
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Select Next Batter from Remaining XI</label>
              <select 
                className="form-select" 
                value={selectedNextBatter} 
                onChange={e => setSelectedNextBatter(e.target.value)}
              >
                <option value="">-- Select New Batter --</option>
                {(scoringContext.availableBatters || [])
                  .filter(p => p !== scoringContext.striker && p !== scoringContext.nonStriker)
                  .map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
              </select>
            </div>

            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setActiveModal(null)}>Cancel</button>
              <button className="modal-btn confirm danger" onClick={handleConfirmWicket}>Record Wicket</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Select New Bowler Prompt Modal */}
      {activeModal === 'select_bowler' && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>End of Over - Select New Bowler</h3>
            <p className="modal-sub">Over complete! The previous bowler ({scoringContext.previousBowler}) cannot bowl consecutive overs.</p>

            <div className="form-group">
              <label className="form-label">Next Bowler</label>
              <select 
                className="form-select" 
                value={selectedNextBowler} 
                onChange={e => setSelectedNextBowler(e.target.value)}
              >
                <option value="">-- Choose Bowler --</option>
                {(scoringContext.availableBowlers || [])
                  .filter(p => p !== scoringContext.previousBowler)
                  .map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
              </select>
            </div>

            <div className="modal-actions">
              <button 
                className="modal-btn confirm" 
                disabled={!selectedNextBowler}
                onClick={handleConfirmBowler}
              >
                Set Bowler & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Match Result Screen */}
      {activeModal === 'match_result' && (
        <div className="modal-overlay">
          <div className="modal-card result-modal">
            <Award size={48} className="trophy-result-icon" />
            <h2>Match Concluded!</h2>
            <p className="result-text-main">{matchState.resultText || 'Match Ended'}</p>

            <div className="result-summary-box">
              <div className="res-team-line">
                <span>{teamA.name}:</span>
                <strong>{teamA.score}</strong>
              </div>
              <div className="res-team-line">
                <span>{teamB.name}:</span>
                <strong>{teamB.score}</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="modal-btn confirm"
                onClick={() => {
                  if (onNavigateToMatchCard) onNavigateToMatchCard(matchId, `/scorecard/${matchId}`);
                }}
              >
                View Full Scorecard <ExternalLink size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminScoringPage;
