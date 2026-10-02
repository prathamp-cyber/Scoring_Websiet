import React from 'react';

/**
 * Sub-Nav Tab Bar Component
 * 
 * TODO: Each inactive tab (Leaderboard, Points Table, Stats, Venues, Sponsors, Experts, Gallery, About Us)
 * will be connected to its respective real data view component in a future phase.
 */
export const SUB_NAV_TABS = [
  { id: 'matches', label: 'Matches' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'points-table', label: 'Points Table' },
  { id: 'stats', label: 'Stats' },
  { id: 'venues', label: 'Venues' },
  { id: 'sponsors', label: 'Sponsors' },
  { id: 'experts', label: 'Experts' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'about-us', label: 'About Us' },
];

export const SubNavTabs = ({ activeTab, onSelectTab }) => {
  return (
    <nav className="sub-nav-bar" aria-label="Tournament navigation tabs">
      <div className="sub-nav-container">
        <ul className="sub-nav-list" role="tablist">
          {SUB_NAV_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <li key={tab.id} role="presentation" className="sub-nav-item">
                <button
                  role="tab"
                  aria-selected={isActive}
                  className={`sub-nav-btn ${isActive ? 'is-active' : ''}`}
                  onClick={() => onSelectTab(tab.id)}
                >
                  <span className="tab-label">{tab.label}</span>
                  {isActive && <span className="active-underline-bar" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};
