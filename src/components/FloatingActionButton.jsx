import React, { useState } from 'react';
import { Plus, X, CalendarPlus, ShieldAlert, UserCheck } from 'lucide-react';

/**
 * Floating Action Button Component
 * 
 * TODO: Add more quick-actions to this menu in future phases (e.g., Add Team, Create Tournament, Live Scoring).
 */
export const FloatingActionButton = ({ onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleActionClick = (path) => {
    setIsMenuOpen(false);
    if (onNavigate) {
      onNavigate(path);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        className="fab-button"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Add Match or Tournament Options"
        title="Quick Actions"
      >
        {isMenuOpen ? <X size={26} color="#ffffff" /> : <Plus size={28} color="#ffffff" />}
      </button>

      {/* Action Menu / Modal Overlay */}
      {isMenuOpen && (
        <div className="fab-modal-backdrop" onClick={() => setIsMenuOpen(false)}>
          <div className="fab-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="fab-modal-header">
              <h3 className="fab-modal-title">Quick Actions</h3>
              <button className="fab-modal-close" onClick={() => setIsMenuOpen(false)}>✕</button>
            </div>

            <div className="fab-modal-body">
              <button 
                className="fab-action-item" 
                onClick={() => handleActionClick('/umpire/setup')}
              >
                <div className="fab-item-icon green-bg">
                  <CalendarPlus size={20} color="#ffffff" />
                </div>
                <div className="fab-item-text">
                  <span className="fab-item-title">Add Match</span>
                  <span className="fab-item-sub">Setup new match & umpire scoring</span>
                </div>
              </button>

              <button 
                className="fab-action-item" 
                onClick={() => handleActionClick('/tournament/manage')}
              >
                <div className="fab-item-icon blue-bg">
                  <ShieldAlert size={20} color="#ffffff" />
                </div>
                <div className="fab-item-text">
                  <span className="fab-item-title">Manage Tournament</span>
                  <span className="fab-item-sub">Edit details, groups, or venues</span>
                </div>
              </button>

              <button 
                className="fab-action-item" 
                onClick={() => handleActionClick('/umpire/assign')}
              >
                <div className="fab-item-icon orange-bg">
                  <UserCheck size={20} color="#ffffff" />
                </div>
                <div className="fab-item-text">
                  <span className="fab-item-title">Assign Umpires</span>
                  <span className="fab-item-sub">Select match officials & scorers</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
