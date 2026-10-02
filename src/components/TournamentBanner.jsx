import React from 'react';
import { Eye, Calendar, Mail } from 'lucide-react';

export const TournamentBanner = ({ config }) => {
  const {
    name = "MAPL 2026",
    location = "Gandhidham",
    viewCount = 6933,
    dateRange = "25-09-2026 to 27-09-2026",
    logoUrl,
    totalMatches = 45,
    totalTeams = 20,
  } = config || {};

  return (
    <section className="tournament-banner">
      <div className="banner-container">
        {/* Left Side: Logo + Info */}
        <div className="banner-main-info">
          {/* White Rounded Square Logo Box */}
          <div className="banner-logo-box">
            {logoUrl ? (
              <img src={logoUrl} alt={name} className="banner-logo-img" />
            ) : (
              <div className="banner-logo-placeholder">
                <svg width="48" height="48" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="32" cy="32" r="28" fill="#e21b1b" fillOpacity="0.1" />
                  {/* Cricket Bat Silhouette */}
                  <path d="M44 14L48 18L24 44L18 46L20 40L44 14Z" fill="#e21b1b" />
                  <rect x="43" y="11" width="8" height="4" rx="2" transform="rotate(-45 43 11)" fill="#d32f2f" />
                  {/* Cricket Ball */}
                  <circle cx="44" cy="42" r="5" fill="#f5821f" />
                  <path d="M42 39C43 41 43 43 42 45" stroke="#ffffff" strokeWidth="1" strokeDasharray="1 1" />
                </svg>
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="banner-details">
            <h1 className="tournament-banner-title">{name}</h1>

            <div className="banner-meta-line">
              <span>{location}</span>
              <span className="bullet-separator">•</span>
              <span className="view-count-badge">
                <Eye size={14} className="eye-icon" />
                {viewCount.toLocaleString()} Views
              </span>
            </div>

            <div className="banner-date-line">
              <Calendar size={13} className="calendar-icon" />
              <span>{dateRange}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Stat Blocks */}
        <div className="banner-stats-wrapper">
          <div className="stat-block">
            <span className="stat-number">{totalMatches}</span>
            <span className="stat-label">Total Matches</span>
          </div>

          <div className="stat-divider"></div>

          <div className="stat-block">
            <span className="stat-number">{totalTeams}</span>
            <span className="stat-label">Total Teams</span>
          </div>
        </div>
      </div>
    </section>
  );
};
