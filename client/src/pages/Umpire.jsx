import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket';
import './Umpire.css';

const API_BASE = 'http://localhost:5000/api';

export default function Umpire() {
  const { matchId } = useParams();
  const [matchState, setMatchState] = useState(null);
  const [matchSnapshot, setMatchSnapshot] = useState(null);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastLatency, setLastLatency] = useState(null);

  // Wicket modal state
  const [isWicketModalOpen, setIsWicketModalOpen] = useState(false);
  const [wicketType, setWicketType] = useState('bowled');
  const [dismissedPlayerId, setDismissedPlayerId] = useState('');
  const [newBatsmanId, setNewBatsmanId] = useState('');

  // Performance measurement ref
  const tapStartRef = useRef(null);
  const currentActionRef = useRef('');

  // 1. Fetch Stored Match Snapshot from HTTP API on mount
  useEffect(() => {
    async function fetchMatchSnapshot() {
      try {
        const res = await fetch(`${API_BASE}/matches/${matchId}`);
        if (res.ok) {
          const data = await res.json();
          setMatchSnapshot(data);
        }
      } catch (err) {
        console.error('Error fetching match snapshot:', err);
      }
    }

    fetchMatchSnapshot();
  }, [matchId]);

  // 2. Socket Real-Time Listener
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    function onConnect() {
      setIsConnected(true);
      console.log(`[Socket.io] Connected to server. Joining room: ${matchId}`);
      socket.emit('join_match', { matchId });
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onScoreUpdate(state) {
      if (tapStartRef.current) {
        const duration = Math.round(performance.now() - tapStartRef.current);
        console.timeEnd(`[LATENCY] ${currentActionRef.current}`);
        console.log(`[LATENCY REPORT] Action '${currentActionRef.current}' -> 'score_update' received in ${duration} ms (Room: ${matchId})`);
        setLastLatency(duration);
        tapStartRef.current = null;
        currentActionRef.current = '';
      }
      setMatchState(state);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('score_update', onScoreUpdate);

    if (socket.connected) {
      console.log(`[Socket.io] Emitting join_match for room: ${matchId}`);
      socket.emit('join_match', { matchId });
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('score_update', onScoreUpdate);
    };
  }, [matchId]);

  // Set default dismissed player when wicket modal opens
  useEffect(() => {
    if (isWicketModalOpen && matchState?.striker) {
      setDismissedPlayerId(matchState.striker.id);
      if (matchState.remainingBatsmen?.length > 0) {
        setNewBatsmanId(matchState.remainingBatsmen[0].id);
      }
    }
  }, [isWicketModalOpen, matchState]);

  const sendBall = (runsScored, extraType = 'none', extraPayload = {}) => {
    if (!matchState) return;

    const label = `Tap (${runsScored} runs, ${extraType})`;
    currentActionRef.current = label;
    tapStartRef.current = performance.now();
    console.time(`[LATENCY] ${label}`);

    socket.emit('record_ball', {
      matchId,
      runsScored,
      extraType,
      ...extraPayload
    });
  };

  const handleWicketSubmit = (e) => {
    e.preventDefault();
    if (!matchState) return;

    const label = `Wicket (${wicketType})`;
    currentActionRef.current = label;
    tapStartRef.current = performance.now();
    console.time(`[LATENCY] ${label}`);

    socket.emit('record_ball', {
      matchId,
      runsScored: 0,
      extraType: 'none',
      isWicket: true,
      wicketType,
      dismissedPlayerId: dismissedPlayerId || matchState.striker?.id,
      newBatsmanId: newBatsmanId || null
    });

    setIsWicketModalOpen(false);
  };

  const handleUndo = () => {
    if (!matchState) return;

    const label = `Undo last ball`;
    currentActionRef.current = label;
    tapStartRef.current = performance.now();
    console.time(`[LATENCY] ${label}`);

    socket.emit('undo_ball', { matchId });
  };

  const handleSelectBowler = (bowlerId) => {
    if (!matchState) return;

    const label = `Select Bowler`;
    currentActionRef.current = label;
    tapStartRef.current = performance.now();
    console.time(`[LATENCY] ${label}`);

    socket.emit('select_bowler', { matchId, bowlerId });
  };

  if (!matchState) {
    return (
      <div className="umpire-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h2>Connecting to Umpire Room: {matchId}...</h2>
        <p>Loading real-time match state from server...</p>
      </div>
    );
  }

  const {
    score,
    striker,
    nonStriker,
    bowler,
    currentOver,
    mustSelectBowler,
    previousBowlerId,
    playingXI,
    remainingBatsmen
  } = matchState;

  return (
    <div className="umpire-container">
      {/* Header */}
      <div className="umpire-header">
        <div className="match-title">
          <span>🏏 Umpire Scoring Console</span>
          <span className="badge-room">Room: {matchId}</span>
        </div>
        <div className="sync-status">
          <span>
            <span className={`status-indicator ${isConnected ? 'status-online' : 'status-offline'}`}></span>
            {isConnected ? 'Real-Time Sync Connected' : 'Disconnected'}
          </span>
          {lastLatency !== null && (
            <span className="latency-badge">
              ⚡ Round-trip: {lastLatency} ms
            </span>
          )}
        </div>
      </div>

      {/* Main Scorecard Hero */}
      <div className="scoreboard-card">
        <div className="scoreboard-main">
          <div>
            <div className="runs-wickets">
              {score.runs} / {score.wickets}
            </div>
            <div style={{ fontSize: '1.1rem', color: '#a5b4fc', marginTop: '0.35rem', fontWeight: '600' }}>
              {matchState.battingTeam?.name} vs {matchState.bowlingTeam?.name}
            </div>
          </div>
          <div className="overs-badge">
            {score.overs} Overs
          </div>
        </div>

        <div className="extras-summary">
          Extras: {score.extras.total} (Wd {score.extras.wide}, NB {score.extras.noball}, B {score.extras.bye}, LB {score.extras.legbye})
        </div>
      </div>

      {/* Bowler Selection Banner (If over complete) */}
      {mustSelectBowler && (
        <div className="bowler-select-banner">
          <h3 style={{ color: '#92400e', margin: '0 0 0.5rem 0' }}>
            🔔 Over Complete ({score.overs} Overs) — Select Next Bowler
          </h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#78350f' }}>
            Rules: Same bowler cannot bowl consecutive overs. Select a bowler from {matchState.bowlingTeam?.name}.
          </p>

          <div className="bowler-select-grid">
            {playingXI.bowling.map((player) => {
              const isPrevious = player.id === previousBowlerId;
              const isCurrent = bowler && player.id === bowler.id;
              return (
                <button
                  key={player.id}
                  className={`bowler-btn ${isCurrent ? 'selected' : ''}`}
                  disabled={isPrevious}
                  onClick={() => handleSelectBowler(player.id)}
                >
                  <div>{player.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {isPrevious ? '⚠️ Just Bowled' : (player.role || 'Player')}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Batsmen and Bowler Cards */}
      <div className="players-grid">
        {/* Striker */}
        <div className="player-card striker-active">
          <div className="player-role-title">
            <span>Striker 🏏</span>
            <span style={{ color: '#6366f1', fontWeight: '800' }}>ON STRIKE</span>
          </div>
          <div className="player-name-large">
            {striker ? striker.name : 'Select Striker'}
          </div>
          {striker && (
            <div className="player-stats-row">
              <span><strong>{striker.runs}</strong> ({striker.balls}b)</span>
              <span>4s: {striker.fours}</span>
              <span>6s: {striker.sixes}</span>
              <span>SR: {striker.strikeRate}</span>
            </div>
          )}
        </div>

        {/* Non-Striker */}
        <div className="player-card">
          <div className="player-role-title">
            <span>Non-Striker</span>
          </div>
          <div className="player-name-large">
            {nonStriker ? nonStriker.name : 'Select Non-Striker'}
          </div>
          {nonStriker && (
            <div className="player-stats-row">
              <span><strong>{nonStriker.runs}</strong> ({nonStriker.balls}b)</span>
              <span>4s: {nonStriker.fours}</span>
              <span>6s: {nonStriker.sixes}</span>
              <span>SR: {nonStriker.strikeRate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bowler Card */}
      <div className="player-card" style={{ marginBottom: '1.5rem' }}>
        <div className="player-role-title">
          <span>Current Bowler ⚾</span>
        </div>
        <div className="player-name-large">
          {bowler ? bowler.name : 'No Bowler Selected'}
        </div>
        {bowler && (
          <div className="player-stats-row">
            <span>Overs: <strong>{bowler.overs}</strong></span>
            <span>Maidens: {bowler.maidens}</span>
            <span>Runs: <strong>{bowler.runs}</strong></span>
            <span>Wickets: <strong>{bowler.wickets}</strong></span>
            <span>Econ: {bowler.economy}</span>
          </div>
        )}
      </div>

      {/* Current Over Balls Timeline */}
      <div className="timeline-card">
        <div className="timeline-title">This Over Balls:</div>
        <div className="balls-list">
          {currentOver.length === 0 ? (
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No balls bowled yet in this over</span>
          ) : (
            currentOver.map((b, idx) => {
              let pillClass = 'ball-pill';
              if (b.isWicket) pillClass += ' wicket';
              else if (b.extraType !== 'none') pillClass += ' extra';
              else if (b.runsScored === 4) pillClass += ' run-4';
              else if (b.runsScored === 6) pillClass += ' run-6';
              else if (b.runsScored > 0) pillClass += ` run-${b.runsScored}`;
              else pillClass += ' run-0';

              return (
                <div key={idx} className={pillClass}>
                  {b.label}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Scoring Quick-Tap Controls */}
      <div className="scoring-grid-card">
        <div className="grid-section-label">Runs Scored</div>
        <div className="runs-grid">
          {[0, 1, 2, 3, 4, 6].map((run) => (
            <button
              key={run}
              className={`btn-run ${run === 4 ? 'boundary-4' : ''} ${run === 6 ? 'boundary-6' : ''}`}
              disabled={mustSelectBowler}
              onClick={() => sendBall(run, 'none')}
            >
              {run}
            </button>
          ))}
        </div>

        <div className="grid-section-label">Extras</div>
        <div className="extras-grid">
          <button
            className="btn-extra"
            disabled={mustSelectBowler}
            onClick={() => sendBall(0, 'wide')}
          >
            Wide (+1)
          </button>
          <button
            className="btn-extra"
            disabled={mustSelectBowler}
            onClick={() => sendBall(0, 'noball')}
          >
            No-Ball (+1)
          </button>
          <button
            className="btn-extra"
            disabled={mustSelectBowler}
            onClick={() => sendBall(1, 'bye')}
          >
            1 Bye
          </button>
          <button
            className="btn-extra"
            disabled={mustSelectBowler}
            onClick={() => sendBall(1, 'legbye')}
          >
            1 Leg Bye
          </button>
        </div>

        <div className="action-buttons-row">
          <button
            className="btn-wicket"
            disabled={mustSelectBowler}
            onClick={() => setIsWicketModalOpen(true)}
          >
            🔴 OUT / WICKET
          </button>

          <button
            className="btn-undo"
            onClick={handleUndo}
          >
            ↩️ Undo Ball
          </button>
        </div>
      </div>

      {/* Wicket Modal */}
      {isWicketModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">🔴 Record Wicket / Out</div>
            <form onSubmit={handleWicketSubmit}>
              <div className="form-group-modal">
                <label>Dismissal Type</label>
                <select
                  className="select-modal"
                  value={wicketType}
                  onChange={(e) => setWicketType(e.target.value)}
                >
                  <option value="bowled">Bowled</option>
                  <option value="caught">Caught</option>
                  <option value="lbw">LBW</option>
                  <option value="run_out">Run Out</option>
                  <option value="stumped">Stumped</option>
                  <option value="hit_wicket">Hit Wicket</option>
                </select>
              </div>

              <div className="form-group-modal">
                <label>Dismissed Player</label>
                <select
                  className="select-modal"
                  value={dismissedPlayerId}
                  onChange={(e) => setDismissedPlayerId(e.target.value)}
                >
                  {striker && <option value={striker.id}>Striker: {striker.name}</option>}
                  {nonStriker && <option value={nonStriker.id}>Non-Striker: {nonStriker.name}</option>}
                </select>
              </div>

              <div className="form-group-modal">
                <label>Next Batsman (from remaining XI)</label>
                {remainingBatsmen.length === 0 ? (
                  <div style={{ color: '#dc2626', fontSize: '0.9rem' }}>All Out! No remaining batsmen.</div>
                ) : (
                  <select
                    className="select-modal"
                    value={newBatsmanId}
                    onChange={(e) => setNewBatsmanId(e.target.value)}
                  >
                    {remainingBatsmen.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsWicketModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-confirm">
                  Confirm Wicket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
