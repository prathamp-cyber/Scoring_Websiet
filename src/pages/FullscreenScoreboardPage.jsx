import React, { useState, useEffect } from 'react';
import { Minimize2, Maximize2 } from 'lucide-react';
import { getMatchDetail } from '../services/matchDetailService';
import { fetchMatchState } from '../services/apiService';
import { getSocket } from '../services/socketService';

export function FullscreenScoreboardPage({ matchId, onExit }) {
  const [matchData, setMatchData] = useState(() => getMatchDetail(matchId));
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  useEffect(() => {
    fetchMatchState(matchId)
      .then(state => {
        if (state) {
          const fallback = getMatchDetail(matchId);
          setMatchData({ ...fallback, ...state });
        }
      })
      .catch(() => {});

    const socket = getSocket();
    socket.emit('join_room', matchId);

    const handleStateUpdate = (newState) => {
      setMatchData(prev => ({ ...prev, ...newState }));
    };

    socket.on('state', handleStateUpdate);

    return () => {
      socket.off('state', handleStateUpdate);
      socket.emit('leave_room', matchId);
    };
  }, [matchId]);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const handleExitClick = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    if (onExit) {
      onExit();
    } else {
      window.history.pushState({}, '', `/match/${matchId}`);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const { teamA, teamB, liveData } = matchData;
  const battingTeam = teamB?.isBatting ? teamB : (teamA?.isBatting ? teamA : teamB);
  const bowlingTeam = battingTeam === teamB ? teamA : teamB;

  const scoreText = battingTeam?.score || '0/0';
  const rawOvers = battingTeam?.overs || '0.0';
  const cleanOvers = rawOvers.toString().replace(/ov/gi, '').trim();
  const oversText = `(${cleanOvers} Ov)`;
  const recentBalls = liveData?.recentBalls || [];

  const renderBallChip = (item, idx) => {
    if (item.type === 'over_boundary' || item.label === 'divider') {
      return <div key={`div-${idx}`} className="minimal-fs-divider">|</div>;
    }

    let chipClass = 'minimal-fs-chip-gray';
    if (item.val === '4' || item.type === 'four') chipClass = 'minimal-fs-chip-blue';
    else if (item.val === '6' || item.type === 'six') chipClass = 'minimal-fs-chip-green';
    else if (item.val === 'W' || item.type === 'wicket') chipClass = 'minimal-fs-chip-red';
    else if (item.type === 'wide' || item.type === 'noball' || item.val === 'Wd' || item.val === 'Nb') chipClass = 'minimal-fs-chip-amber';

    return (
      <span key={`fs-ball-${idx}`} className={`minimal-fs-chip ${chipClass}`}>
        {item.val}
      </span>
    );
  };

  return (
    <div className="minimal-fullscreen-scoreboard">
      {/* Floating Exit & Browser Fullscreen Toggle */}
      <div className="minimal-fs-controls">
        <button 
          className="minimal-fs-control-btn" 
          onClick={toggleFullscreen} 
          title={isFullscreen ? 'Exit Browser Fullscreen' : 'Enter Browser Fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
        <button 
          className="minimal-fs-control-btn exit-btn" 
          onClick={handleExitClick} 
          title="Exit Fullscreen Mode"
        >
          <span>Exit</span>
        </button>
      </div>

      {/* CENTERED CONTENT GROUP */}
      <div className="minimal-fs-content-group">
        {/* 1. TOP CENTER: BOTH TEAM NAMES */}
        <div className="minimal-fs-teams-header">
          <span className={`minimal-fs-team-name ${bowlingTeam?.isBatting ? 'is-batting' : ''}`}>
            {bowlingTeam?.name}
          </span>
          <span className="minimal-fs-vs-label">vs</span>
          <span className={`minimal-fs-team-name ${battingTeam?.isBatting ? 'is-batting' : ''}`}>
            {battingTeam?.name}
            {battingTeam?.isBatting && <span className="minimal-fs-batting-dot" title="Currently Batting">•</span>}
          </span>
        </div>

        {/* 2. CENTER OF SCREEN: DOMINANT SCORE & OVERS */}
        <div className="minimal-fs-score-container">
          <span className="minimal-fs-runs-wickets">{scoreText}</span>
          <span className="minimal-fs-overs">{oversText}</span>
        </div>

        {/* 3. BELOW THAT: OVER-BY-OVER TIMELINE CHIPS */}
        <div className="minimal-fs-timeline-container">
          {recentBalls.length > 0 ? (
            recentBalls.map((item, idx) => renderBallChip(item, idx))
          ) : (
            <span className="minimal-fs-no-balls">Current over starting...</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default FullscreenScoreboardPage;