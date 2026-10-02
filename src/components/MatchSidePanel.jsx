import React from 'react';
import { Radio, MapPin, Calendar, Clock } from 'lucide-react';

export const MatchSidePanel = ({ match, onSimulateBall }) => {
  const { sidePanel, status } = match;
  if (!sidePanel) return null;

  const isLive = status === 'live';

  return (
    <aside className="match-side-panel">
      {/* 1. Stat Row Card */}
      <div className="side-card stat-row-card">
        <div className="side-stat-box">
          <span className="side-stat-val">{isLive ? sidePanel.currentRR : (sidePanel.currentRR || '-')}</span>
          <span className="side-stat-lbl">Current RR</span>
        </div>

        <div className="side-stat-divider-line"></div>

        <div className="side-stat-box">
          <span className="side-stat-val highlight-green">
            {isLive ? (sidePanel.requiredRR !== '-' ? sidePanel.requiredRR : sidePanel.projectedScore) : sidePanel.projectedScore}
          </span>
          <span className="side-stat-lbl">
            {isLive && sidePanel.requiredRR !== '-' ? 'Required RR' : 'Projected Score'}
          </span>
        </div>
      </div>

      {/* Target badge if chasing */}
      {isLive && sidePanel.target && (
        <div className="side-target-strip">
          <span>Target: <strong>{sidePanel.target}</strong> runs</span>
        </div>
      )}

      {/* 2. Match Details Card */}
      <div className="side-card details-card">
        <div className="side-card-header">
          <h3 className="side-card-heading">Match details</h3>
        </div>

        <div className="side-details-content">
          {/* Series / Tournament Link */}
          <div className="side-info-row">
            <span className="info-key">Series:</span>
            <a href={sidePanel.seriesLink || '#'} className="info-link">
              {sidePanel.seriesName}
            </a>
          </div>

          {/* Date */}
          <div className="side-info-row">
            <span className="info-key">Date:</span>
            <span className="info-val">
              <Calendar size={13} className="inline-side-icon" />
              {sidePanel.matchDate}
            </span>
          </div>

          {/* Location Link */}
          <div className="side-info-row">
            <span className="info-key">Location:</span>
            <a href={sidePanel.locationLink || '#'} className="info-link">
              <MapPin size={13} className="inline-side-icon" />
              {sidePanel.location}
            </a>
          </div>

          {/* Last Updated */}
          <div className="side-info-row updated-block-row">
            <span className="info-key">Last Updated:</span>
            <div className="updated-text-block">
              <span className="scorer-name-text">{sidePanel.lastUpdatedScorer}</span>
              <span className="scorer-time-text">
                <Clock size={12} className="inline-side-icon" />
                {sidePanel.lastUpdatedTime}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live Ball Simulator Button */}
      {isLive && onSimulateBall && (
        <div className="side-card simulator-card">
          <button className="simulate-ball-btn" onClick={onSimulateBall}>
            <Radio size={16} className="radio-pulse" />
            <span>Simulate Live Ball (+4 Runs)</span>
          </button>
          <p className="simulator-note">
            Test real-time live score updates without page refresh
          </p>
        </div>
      )}
    </aside>
  );
};
