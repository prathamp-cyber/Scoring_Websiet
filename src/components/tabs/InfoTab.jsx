import React from 'react';
import { Info, MapPin, Calendar, Clock, Trophy, Shield, Users, UserCheck } from 'lucide-react';

export const InfoTab = ({ match }) => {
  const { info } = match;

  if (!info) {
    return <div className="tab-pane-container">No match information available.</div>;
  }

  const infoItems = [
    { label: "Tournament", value: info.tournament, icon: Trophy },
    { label: "Round / Stage", value: info.round, icon: Shield },
    { label: "Teams", value: info.teams, icon: Users },
    { label: "Toss Details", value: info.toss, icon: UserCheck },
    { label: "Match Format", value: info.overs, icon: Info },
    { label: "Players Per Side", value: info.playersPerSide, icon: Users },
    { label: "Venue & Ground", value: info.ground, icon: MapPin },
    { label: "City / Location", value: info.city || "Gandhidham, Gujarat", icon: MapPin },
    { label: "Match Date", value: info.date, icon: Calendar },
    { label: "Start Time", value: info.time, icon: Clock },
    { label: "On-Field Umpires", value: info.umpires, icon: UserCheck },
    { label: "Third Umpire", value: info.thirdUmpire, icon: UserCheck },
    { label: "Match Referee", value: info.matchReferee, icon: UserCheck },
  ];

  return (
    <div className="tab-pane-container info-tab-pane">
      <div className="table-card info-card">
        <div className="table-card-header">
          <h3 className="table-title">Match Information</h3>
        </div>

        <div className="info-grid-list">
          {infoItems.map((item, idx) => {
            const Icon = item.icon || Info;
            return (
              <div key={idx} className="info-grid-item">
                <div className="info-item-left">
                  <Icon size={16} className="info-item-icon" />
                  <span className="info-item-label">{item.label}</span>
                </div>
                <div className="info-item-right">
                  <span className="info-item-value">{item.value || 'N/A'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
