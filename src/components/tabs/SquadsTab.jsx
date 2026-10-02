import React from 'react';
import { User } from 'lucide-react';

export const SquadsTab = ({ match }) => {
  const { squads } = match;

  if (!squads || !squads.teamA || !squads.teamB) {
    return <div className="tab-pane-container">No squad information available.</div>;
  }

  const renderPlayerRow = (player, idx) => (
    <div key={idx} className="squad-player-row">
      <div className="squad-player-avatar">
        <User size={16} className="user-icon" />
      </div>
      <div className="squad-player-info">
        <span className="squad-player-name">
          {player.name}
          {player.isCaptain && <span className="role-tag captain-tag">(C)</span>}
          {player.isWK && <span className="role-tag wk-tag">(WK)</span>}
        </span>
        <span className="squad-player-role">{player.role}</span>
      </div>
    </div>
  );

  return (
    <div className="tab-pane-container squads-tab-pane">
      <div className="squads-two-col-grid">
        {/* Team A Squad */}
        <div className="squad-card">
          <div className="squad-card-header">
            <h3 className="squad-team-title">{squads.teamA.name}</h3>
            <span className="squad-xi-badge">Playing XI</span>
          </div>
          <div className="squad-players-list">
            {squads.teamA.players.map((p, idx) => renderPlayerRow(p, idx))}
          </div>
        </div>

        {/* Team B Squad */}
        <div className="squad-card">
          <div className="squad-card-header">
            <h3 className="squad-team-title">{squads.teamB.name}</h3>
            <span className="squad-xi-badge">Playing XI</span>
          </div>
          <div className="squad-players-list">
            {squads.teamB.players.map((p, idx) => renderPlayerRow(p, idx))}
          </div>
        </div>
      </div>
    </div>
  );
};
