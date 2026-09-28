import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import './Umpire.css';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function Live() {
  const { matchId } = useParams();
  const [matchState, setMatchState] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create socket connection for live view
    const liveSocket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling']
    });

    liveSocket.on('connect', () => {
      setIsConnected(true);
      console.log(`[Live View] Connected to server. Joining room: ${matchId}`);
      liveSocket.emit('join_match', { matchId });
    });

    liveSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    liveSocket.on('score_update', (state) => {
      console.log(`[Live View ${matchId}] Received score_update payload:`, state);
      setMatchState(state);
    });

    return () => {
      liveSocket.disconnect();
    };
  }, [matchId]);

  if (!matchState) {
    return (
      <div className="umpire-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h2>Connecting to Live Stream for Match: {matchId}...</h2>
        <p>Waiting for real-time score updates...</p>
      </div>
    );
  }

  const { score, striker, nonStriker, bowler, currentOver } = matchState;

  return (
    <div className="umpire-container">
      <div className="umpire-header">
        <div className="match-title">
          <span>📺 Live Spectator Match Stream</span>
          <span className="badge-room">Match: {matchId}</span>
        </div>
        <div className="sync-status">
          <span>
            <span className={`status-indicator ${isConnected ? 'status-online' : 'status-offline'}`}></span>
            {isConnected ? 'LIVE SYNC ACTIVE' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="scoreboard-card">
        <div className="scoreboard-main">
          <div>
            <div className="runs-wickets">
              {score.runs} / {score.wickets}
            </div>
            <div style={{ fontSize: '1.1rem', color: '#a5b4fc', marginTop: '0.25rem' }}>
              {matchState.battingTeam.name} vs {matchState.bowlingTeam.name}
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

      <div className="players-grid">
        <div className="player-card striker-active">
          <div className="player-role-title">
            <span>Striker 🏏</span>
            <span style={{ color: '#6366f1', fontWeight: '800' }}>ON STRIKE</span>
          </div>
          <div className="player-name-large">
            {striker ? striker.name : 'N/A'}
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

        <div className="player-card">
          <div className="player-role-title">
            <span>Non-Striker</span>
          </div>
          <div className="player-name-large">
            {nonStriker ? nonStriker.name : 'N/A'}
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

      <div className="player-card" style={{ marginBottom: '1.5rem' }}>
        <div className="player-role-title">
          <span>Bowler ⚾</span>
        </div>
        <div className="player-name-large">
          {bowler ? bowler.name : 'N/A'}
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

      <div className="timeline-card">
        <div className="timeline-title">This Over:</div>
        <div className="balls-list">
          {currentOver.length === 0 ? (
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No balls in active over</span>
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
    </div>
  );
}
