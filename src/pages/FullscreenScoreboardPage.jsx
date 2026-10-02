import React, { useState, useEffect } from 'react';
import { CricketLogo } from '../components/CricketLogo';
import { Minimize2, Trophy } from 'lucide-react';
import { getMatchDetail } from '../services/matchDetailService';
import { fetchMatchState } from '../services/apiService';
import { getSocket } from '../services/socketService';

export function FullscreenScoreboardPage({ matchId, onExit }) {
  const [matchData, setMatchData] = useState(() => getMatchDetail(matchId));

  useEffect(() => {
    fetchMatchState(matchId)
      .then(state => { if (state) setMatchData(state); })
      .catch(() => {});

    const socket = getSocket();
    socket.emit('join_room', matchId);

    const handleStateUpdate = (newState) => {
      setMatchData(newState);
    };

    socket.on('state', handleStateUpdate);

    return () => {
      socket.off('state', handleStateUpdate);
      socket.emit('leave_room', matchId);
    };
  }, [matchId]);

  const handleExitClick = () => {
    if (onExit) {
      onExit();
    } else {
      window.history.pushState({}, '', `/match/${matchId}`);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const { teamA, teamB, liveData, status, resultText } = matchData;
  const currentBatters = liveData?.currentBatters || [];
  const currentBowler = liveData?.currentBowler || {};
  const recentBalls = liveData?.recentBalls || [];

  const renderBallChip = (item, idx) => {
    if (item.type === 'over_boundary' || item.label === 'divider') {
      return <div key={`div-${idx}`} className="fs-ball-divider">|</div>;
    }

    let chipClass = 'fs-chip-gray';
    if (item.val === '4' || item.type === 'four') chipClass = 'fs-chip-blue';
    else if (item.val === '6' || item.type === 'six') chipClass = 'fs-chip-green';
    else if (item.val === 'W' || item.type === 'wicket') chipClass = 'fs-chip-red';
    else if (item.type === 'wide' || item.type === 'noball') chipClass = 'fs-chip-amber';

    return (
      <span key={`fs-ball-${idx}`} className={`fs-ball-chip ${chipClass}`}>
        {item.val}
      </span>
    );
  };

  return (
    <div className="fullscreen-scoreboard-page">
      {/* Top Header Bar */}
      <header className="fs-top-bar">
        <div className="fs-logo-group">
          <CricketLogo />
          <span className="fs-tournament-tag">
            <Trophy size={18} color="#d97706" /> {matchData.tournamentName}
          </span>
        </div>

        <div className="fs-header-center">
          <span className="fs-live-badge">
            <span className="live-dot-pulse"></span> LIVE SCOREBOARD
          </span>
          <span className="fs-ground-text">{matchData.ground}, {matchData.city}</span>
        </div>

        <div className="fs-header-actions">
          <button className="fs-exit-btn" onClick={handleExitClick} title="Exit Fullscreen">
            <Minimize2 size={18} />
            <span>Exit Fullscreen</span>
          </button>
        </div>
      </header>

      {/* Main Scoreboard Body */}
      <main className="fs-main-body">
        {/* Teams & Scores Row */}
        <section className="fs-teams-grid">
          {/* Team A */}
          <div className={`fs-team-card ${teamA.isBatting ? 'is-active-batting' : ''}`}>
            <div className="fs-team-left">
              <div className="fs-team-avatar" style={{ backgroundColor: teamA.logoColor || '#dc2626' }}>
                {teamA.logoText || teamA.name.charAt(0)}
              </div>
              <div>
                <h2 className="fs-team-name">{teamA.name}</h2>
                <span className="fs-batting-tag">{teamA.isBatting ? '⚡ BATTING NOW' : 'INNINGS'}</span>
              </div>
            </div>

            <div className="fs-team-score-box">
              {teamA.hasBatted && teamA.score ? (
                <>
                  <span className="fs-score-main">{teamA.score}</span>
                  {teamA.overs && <span className="fs-overs-sub">({teamA.overs} ov)</span>}
                </>
              ) : (
                <span className="fs-yet-to-bat">Yet to bat</span>
              )}
            </div>
          </div>

          {/* Team B */}
          <div className={`fs-team-card ${teamB.isBatting ? 'is-active-batting' : ''}`}>
            <div className="fs-team-left">
              <div className="fs-team-avatar" style={{ backgroundColor: teamB.logoColor || '#059669' }}>
                {teamB.logoText || teamB.name.charAt(0)}
              </div>
              <div>
                <h2 className="fs-team-name">{teamB.name}</h2>
                <span className="fs-batting-tag">{teamB.isBatting ? '⚡ BATTING NOW' : 'INNINGS'}</span>
              </div>
            </div>

            <div className="fs-team-score-box">
              {teamB.hasBatted && teamB.score ? (
                <>
                  <span className="fs-score-main">{teamB.score}</span>
                  {teamB.overs && <span className="fs-overs-sub">({teamB.overs} ov)</span>}
                </>
              ) : (
                <span className="fs-yet-to-bat">Yet to bat</span>
              )}
            </div>
          </div>
        </section>

        {/* Chase Target / Match Result Banner */}
        {status === 'live' && matchData.chaseStatusText && (
          <div className="fs-status-banner chase">
            <span>⚡ {matchData.chaseStatusText}</span>
          </div>
        )}

        {status === 'completed' && (resultText || matchData.resultText) && (
          <div className="fs-status-banner result">
            <span>🏆 {resultText || matchData.resultText}</span>
          </div>
        )}

        {/* Players Grid: Batters & Bowler */}
        <section className="fs-players-grid">
          {/* Striker Card */}
          {currentBatters[0] && (
            <div className="fs-player-card striker">
              <div className="fs-player-role">STRIKER *</div>
              <h3 className="fs-player-name">{currentBatters[0].name}</h3>
              <div className="fs-player-stats">
                <span className="fs-main-num">{currentBatters[0].runs}</span>
                <span className="fs-sub-num">({currentBatters[0].balls}b)</span>
              </div>
              <div className="fs-player-meta">
                <span>4s: <strong>{currentBatters[0].fours}</strong></span>
                <span>•</span>
                <span>6s: <strong>{currentBatters[0].sixes}</strong></span>
                <span>•</span>
                <span>SR: <strong>{currentBatters[0].sr}</strong></span>
              </div>
            </div>
          )}

          {/* Non-Striker Card */}
          {currentBatters[1] && (
            <div className="fs-player-card non-striker">
              <div className="fs-player-role">NON-STRIKER</div>
              <h3 className="fs-player-name">{currentBatters[1].name}</h3>
              <div className="fs-player-stats">
                <span className="fs-main-num">{currentBatters[1].runs}</span>
                <span className="fs-sub-num">({currentBatters[1].balls}b)</span>
              </div>
              <div className="fs-player-meta">
                <span>4s: <strong>{currentBatters[1].fours}</strong></span>
                <span>•</span>
                <span>6s: <strong>{currentBatters[1].sixes}</strong></span>
                <span>•</span>
                <span>SR: <strong>{currentBatters[1].sr}</strong></span>
              </div>
            </div>
          )}

          {/* Current Bowler Card */}
          {currentBowler && (
            <div className="fs-player-card bowler">
              <div className="fs-player-role bowler-role">CURRENT BOWLER</div>
              <h3 className="fs-player-name">{currentBowler.name}</h3>
              <div className="fs-player-stats">
                <span className="fs-main-num">{currentBowler.wickets} - {currentBowler.runs}</span>
                <span className="fs-sub-num">({currentBowler.overs} ov)</span>
              </div>
              <div className="fs-player-meta">
                <span>Econ: <strong>{currentBowler.econ}</strong></span>
                {currentBowler.maidens > 0 && (
                  <>
                    <span>•</span>
                    <span>Maidens: <strong>{currentBowler.maidens}</strong></span>
                  </>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Recent Balls Outcome Chips */}
        <section className="fs-recent-balls-bar">
          <span className="fs-recent-label">THIS OVER:</span>
          <div className="fs-chips-row">
            {recentBalls.length > 0 ? (
              recentBalls.map((item, idx) => renderBallChip(item, idx))
            ) : (
              <span className="fs-empty-balls">Over starting...</span>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default FullscreenScoreboardPage;