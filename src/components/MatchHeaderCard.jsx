import React from 'react';
import { Trophy, MapPin, Share2, CheckCircle2, Clock, Maximize2 } from 'lucide-react';

export const MatchHeaderCard = ({ match, onShare, onFullscreen }) => {
  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';

  const handleFullscreenClick = () => {
    if (onFullscreen) {
      onFullscreen();
    } else {
      window.history.pushState({}, '', `/live/${match.matchId}/fullscreen`);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const renderTeamLogo = (team) => {
    const color = team?.logoColor || '#64748b';
    const initial = team?.logoText || team?.name?.charAt(0) || 'T';

    return (
      <div className="match-header-team-logo" style={{ backgroundColor: color }}>
        <span>{initial}</span>
      </div>
    );
  };

  return (
    <div className="match-header-card">
      {/* Red-Orange Gradient Top Accent Bar */}
      <div className="header-gradient-bar"></div>

      <div className="header-card-body">
        {/* Top Row: Tournament, Round, Status Pill & Action Buttons */}
        <div className="header-top-row">
          <div className="header-title-group">
            <Trophy size={16} className="header-trophy-icon" />
            <span className="header-tournament-name">{match.tournamentName}</span>
            {match.roundLabel && (
              <span className="header-round-badge">{match.roundLabel}</span>
            )}
          </div>

          <div className="header-actions">
            {isLive && (
              <span className="header-status-pill status-live-pill">
                <span className="live-dot-pulse"></span>
                Live
              </span>
            )}
            {isCompleted && (
              <span className="header-status-pill status-completed-pill">
                <CheckCircle2 size={12} />
                Completed
              </span>
            )}
            {!isLive && !isCompleted && (
              <span className="header-status-pill status-upcoming-pill">
                <Clock size={12} />
                Upcoming
              </span>
            )}

            <button 
              className="header-action-icon-btn" 
              onClick={handleFullscreenClick}
              aria-label="Full-screen scoreboard"
              title="Full-screen Scoreboard (TV Mode)"
            >
              <Maximize2 size={16} />
            </button>

            <button 
              className="header-action-icon-btn" 
              onClick={onShare || (() => alert('Share link copied to clipboard!'))}
              aria-label="Share match"
              title="Share match"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>

        {/* Sub-row 1: Location Pin, Ground, City, Date, Overs */}
        <div className="header-meta-row">
          <MapPin size={14} className="header-pin-icon" />
          <span>{match.ground}{match.city ? `, ${match.city}` : ''} • {match.date} • {match.oversLabel}</span>
        </div>

        {/* Sub-row 2: Toss text */}
        {match.tossText && (
          <div className="header-toss-row">
            <span>Toss: {match.tossText}</span>
          </div>
        )}

        {/* Team Rows with Active Batting Green Accent */}
        <div className="header-teams-section">
          {/* Team A */}
          <div className={`header-team-row ${match.teamA.isBatting ? 'is-active-batting' : ''}`}>
            <div className="header-team-left">
              {renderTeamLogo(match.teamA)}
              <span className={`header-team-name ${match.teamA.isBatting ? 'bold-active' : ''}`}>
                {match.teamA.name}
              </span>
            </div>
            <div className="header-team-score-col">
              {match.teamA.hasBatted && match.teamA.score ? (
                <div className="header-score-wrapper">
                  <span className="header-score-main">{match.teamA.score}</span>
                  {match.teamA.overs && (
                    <span className="header-overs-sub">({match.teamA.overs} ov)</span>
                  )}
                </div>
              ) : (
                <span className="header-yet-to-bat">(Yet to bat)</span>
              )}
            </div>
          </div>

          {/* Team B */}
          <div className={`header-team-row ${match.teamB.isBatting ? 'is-active-batting' : ''}`}>
            <div className="header-team-left">
              {renderTeamLogo(match.teamB)}
              <span className={`header-team-name ${match.teamB.isBatting ? 'bold-active' : ''}`}>
                {match.teamB.name}
              </span>
            </div>
            <div className="header-team-score-col">
              {match.teamB.hasBatted && match.teamB.score ? (
                <div className="header-score-wrapper">
                  <span className="header-score-main">{match.teamB.score}</span>
                  {match.teamB.overs && (
                    <span className="header-overs-sub">({match.teamB.overs} ov)</span>
                  )}
                </div>
              ) : (
                <span className="header-yet-to-bat">(Yet to bat)</span>
              )}
            </div>
          </div>
        </div>

        {/* Chase / Result Banner Line */}
        {isLive && match.chaseStatusText && (
          <div className="header-chase-status-banner">
            <span>{match.chaseStatusText}</span>
          </div>
        )}

        {isCompleted && match.resultText && (
          <div className="header-result-status-banner">
            <span><strong>{match.resultText}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};
