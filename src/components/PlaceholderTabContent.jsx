import React from 'react';
import { SUB_NAV_TABS } from './SubNavTabs';
import { Construction } from 'lucide-react';

/**
 * Placeholder Tab Content Panel
 * 
 * Displays interactive fallback for tabs other than 'Matches'.
 * TODO: Replace each tab's placeholder with full feature components in upcoming phases.
 */
export const PlaceholderTabContent = ({ tabId, onBackToMatches }) => {
  const tabInfo = SUB_NAV_TABS.find((t) => t.id === tabId) || { label: tabId };

  return (
    <div className="placeholder-tab-container">
      <div className="placeholder-card">
        <div className="placeholder-icon-wrapper">
          <Construction size={36} className="construction-icon" />
        </div>
        <h2 className="placeholder-title">{tabInfo.label}</h2>
        <p className="placeholder-description">
          The <strong>{tabInfo.label}</strong> section for <strong>MAPL 2026</strong> is currently being compiled. Real-time statistics and tables will be available shortly.
        </p>
        <button className="back-to-matches-btn" onClick={onBackToMatches}>
          View Matches
        </button>
      </div>
    </div>
  );
};
