import React from 'react';
import { MapPin, Trophy, Clock, CheckCircle2 } from 'lucide-react';

export const MatchCard = ({ match, onMatchClick }) => {
  const isLive = match.status === 'live';
  const isUpcoming = match.status === 'upcoming';
  const isCompleted = match.status === 'completed';

  // Target path destination per status
  let targetPath = `/live/${match.matchId}`;
  if (isUpcoming) {
    targetPath = `/upcoming/${match.matchId}`;
  } else if (isCompleted) {
    targetPath = `/scorecard/${match.matchId}`;
  }

  const handleClick = (e) => {
    e.preventDefault();
    if (onMatchClick) {
      onMatchClick(match.matchId, targetPath);
    }
  };

  // Helper to render Status Pill in header
  const renderStatusPill = () => {
    if (isLive) {
      return (
        <span className="status-pill status-live-pill">
          <span className="live-dot-pulse"></span>
          Live
        </span>
      );
    }
    if (isUpcoming) {
      return (
        <span className="status-pill status-upcoming-pill">
          <Clock size={11} className="status-icon" />
          Upcoming
        </span>
      );
    }
    return (
      <span className="status-pill status-completed-pill">
        <CheckCircle2 size={11} className="status-icon" />
        Completed
      </span>
    );
  };

  // Helper to split footer/status text around bold team name if needed
  const renderStatusStripContent = () => {
    const boldText = match.statusStripBold;
    const text = match.statusStripText || match.footerText || '';

    if (!boldText || !text.includes(boldText)) {
      if (boldText) {
        return (
          <>
            <strong>{boldText}</strong> {text}
          </>
        );
      }
      return text;
    }

    const parts = text.split(boldText);
    return (
      <>
        {parts[0]}
        <strong>{boldText}</strong>
        {parts[1]}
      </>
    );
  };

  // Shield or circular team logo placeholder
  const renderTeamLogo = (team) => {
    const color = team?.logoColor || '#64748b';
    const initial = team?.logoText || team?.name?.charAt(0) || 'T';

    return (
      <div 
        className="team-logo-badge" 
        style={{ backgroundColor: color }}
        title={team?.name}
      >
        <span>{initial}</span>
      </div>
    );
  };

  return (
    <article 
      className={`match-card match-card-${match.status}`} 
      onClick={handleClick} 
      tabIndex={0} 
      role="button"
    >
      <div className="match-card-content">
        {/* 1. Header Row: Trophy Icon + Tournament Name & Status Pill */}
        <div className="card-header-row">
          <div className="tournament-title-group">
            <Trophy size={16} className="trophy-icon" />
            <h3 className="tournament-title">{match.tournamentName}</h3>
          </div>
          <div className="status-pill-container">
            {renderStatusPill()}
          </div>
        </div>

        {/* 2. Meta Row: Location Pin + Ground details */}
        <div className="card-meta-row">
          <MapPin size={14} className="location-pin-icon" />
          <span className="ground-details-text" title={`${match.ground}, ${match.city}${match.details ? ` (${match.details})` : ''}`}>
            {match.ground}{match.city ? `, ${match.city}` : ''} {match.details ? `(${match.details})` : ''}
          </span>
        </div>

        {/* 3. Group / Round Label Pill */}
        {(match.groupLabel || match.roundLabel) && (
          <div className="round-label-row">
            <span className="round-label-badge">
              {match.groupLabel || match.roundLabel}
            </span>
          </div>
        )}

        {/* 4. Thin Horizontal Divider Line */}
        <div className="card-divider-line"></div>

        {/* Team Rows */}
        <div className="teams-section">
          {/* Team A */}
          <div className="team-row">
            <div className="team-identity">
              {renderTeamLogo(match.teamA)}
              <span className={`team-name ${match.teamA.isBatting || (isCompleted && match.teamA.hasBatted) ? 'is-highlighted' : ''}`}>
                {match.teamA.name}
              </span>
            </div>
            <div className="team-score-col">
              {match.teamA.hasBatted && match.teamA.score ? (
                <div className="score-wrapper">
                  <span className="score-main">{match.teamA.score}</span>
                  {match.teamA.overs && (
                    <span className="overs-sub">({match.teamA.overs})</span>
                  )}
                </div>
              ) : (
                <div className="yet-to-bat-wrapper">
                  <span className="score-dash">-</span>
                  <span className="yet-to-bat">(Yet to bat)</span>
                </div>
              )}
            </div>
          </div>

          {/* Team B */}
          <div className="team-row">
            <div className="team-identity">
              {renderTeamLogo(match.teamB)}
              <span className={`team-name ${match.teamB.isBatting || (isCompleted && match.teamB.hasBatted) ? 'is-highlighted' : ''}`}>
                {match.teamB.name}
              </span>
            </div>
            <div className="team-score-col">
              {match.teamB.hasBatted && match.teamB.score ? (
                <div className="score-wrapper">
                  <span className="score-main">{match.teamB.score}</span>
                  {match.teamB.overs && (
                    <span className="overs-sub">({match.teamB.overs})</span>
                  )}
                </div>
              ) : (
                <div className="yet-to-bat-wrapper">
                  <span className="score-dash">-</span>
                  <span className="yet-to-bat">(Yet to bat)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Full-width Rounded Status Strip at bottom */}
      <footer className={`card-status-strip strip-type-${match.statusStripType || match.status}`}>
        <div className="strip-content">
          <span className="strip-icon-dot"></span>
          <p className="strip-text">
            {renderStatusStripContent()}
          </p>
        </div>
      </footer>
    </article>
  );
};
