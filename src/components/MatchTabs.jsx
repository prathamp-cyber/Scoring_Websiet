import React from 'react';

export const MATCH_TABS = [
  { id: 'live', label: 'Live' },
  { id: 'scorecard', label: 'Scorecard' },
  { id: 'commentary', label: 'Commentary' },
  { id: 'squads', label: 'Squads' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'info', label: 'Info' },
];

export const MatchTabs = ({ activeTab, onSelectTab }) => {
  return (
    <nav className="match-tabs-bar" aria-label="Match page tabs">
      <div className="match-tabs-container">
        <ul className="match-tabs-list" role="tablist">
          {MATCH_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <li key={tab.id} role="presentation" className="match-tab-item">
                <button
                  role="tab"
                  aria-selected={isActive}
                  className={`match-tab-btn ${isActive ? 'is-active' : ''}`}
                  onClick={() => onSelectTab(tab.id)}
                >
                  <span>{tab.label}</span>
                  {isActive && <span className="tab-red-underline" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};
