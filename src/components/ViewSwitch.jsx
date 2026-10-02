import React from 'react';

export const VIEW_OPTIONS = [
  { id: 'live', label: 'Live' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
];

export const ViewSwitch = ({ activeView, onViewChange }) => {
  return (
    <div className="view-switch-container">
      <div className="view-switch-group" role="group" aria-label="Filter matches by status">
        {VIEW_OPTIONS.map((option) => {
          const isActive = activeView === option.id;
          return (
            <button
              key={option.id}
              type="button"
              className={`view-pill-btn ${isActive ? 'is-active' : ''}`}
              onClick={() => onViewChange(option.id)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
