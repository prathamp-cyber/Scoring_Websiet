import React, { useState } from 'react';

export const ScorecardTab = ({ match }) => {
  const { scorecard = [] } = match;
  const [selectedInningsIndex, setSelectedInningsIndex] = useState(0);

  if (!scorecard || scorecard.length === 0) {
    return <div className="tab-pane-container">No scorecard available yet.</div>;
  }

  // Active scorecard innings
  const activeInnings = scorecard[selectedInningsIndex] || scorecard[0];

  return (
    <div className="tab-pane-container scorecard-tab-pane">
      {/* Innings Selector Pills if multiple innings exist */}
      {scorecard.length > 1 && (
        <div className="innings-selector-row">
          {scorecard.map((inn, idx) => (
            <button
              key={idx}
              className={`innings-pill-btn ${selectedInningsIndex === idx ? 'is-active' : ''}`}
              onClick={() => setSelectedInningsIndex(idx)}
            >
              <span>{inn.teamName}</span>
              <span className="innings-score-tag">{inn.scoreText}</span>
            </button>
          ))}
        </div>
      )}

      {/* Batting Section */}
      <div className="table-card">
        <div className="table-card-header">
          <h3 className="table-title">{activeInnings.teamName} Batting</h3>
          <span className="table-header-score">{activeInnings.scoreText}</span>
        </div>

        <div className="table-responsive">
          <table className="cricket-table scorecard-batting-table">
            <thead>
              <tr>
                <th className="th-name">Batter</th>
                <th className="th-dismissal">Dismissal</th>
                <th className="th-num">R</th>
                <th className="th-num">B</th>
                <th className="th-num">4s</th>
                <th className="th-num">6s</th>
                <th className="th-num">SR</th>
              </tr>
            </thead>
            <tbody>
              {activeInnings.batting.map((b, idx) => (
                <tr key={idx}>
                  <td className="td-name font-semibold">{b.name}</td>
                  <td className="td-dismissal text-gray-sub">{b.dismissal}</td>
                  <td className="td-num bold-num">{b.runs}</td>
                  <td className="td-num">{b.balls}</td>
                  <td className="td-num">{b.fours}</td>
                  <td className="td-num">{b.sixes}</td>
                  <td className="td-num">{b.sr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Extras & Total Lines */}
        <div className="scorecard-summary-box">
          <div className="summary-row">
            <span className="summary-label">Extras:</span>
            <span className="summary-value">{activeInnings.extras}</span>
          </div>
          <div className="summary-row total-row">
            <span className="summary-label">Total:</span>
            <span className="summary-value bold-total">{activeInnings.total}</span>
          </div>
          {activeInnings.didNotBat && activeInnings.didNotBat.length > 0 && (
            <div className="summary-row dnb-row">
              <span className="summary-label">Did Not Bat:</span>
              <span className="summary-value dnb-text">{activeInnings.didNotBat.join(', ')}</span>
            </div>
          )}
          {activeInnings.fallOfWickets && (
            <div className="summary-row fow-row">
              <span className="summary-label">Fall of Wickets:</span>
              <span className="summary-value fow-text">{activeInnings.fallOfWickets}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bowling Section */}
      <div className="table-card">
        <div className="table-card-header">
          <h3 className="table-title">Bowling</h3>
        </div>

        <div className="table-responsive">
          <table className="cricket-table scorecard-bowling-table">
            <thead>
              <tr>
                <th className="th-name">Bowler</th>
                <th className="th-num">O</th>
                <th className="th-num">M</th>
                <th className="th-num">R</th>
                <th className="th-num">W</th>
                <th className="th-num">Econ</th>
                <th className="th-num">Wd</th>
                <th className="th-num">Nb</th>
              </tr>
            </thead>
            <tbody>
              {activeInnings.bowling.map((bw, idx) => (
                <tr key={idx}>
                  <td className="td-name font-semibold">{bw.name}</td>
                  <td className="td-num">{bw.overs}</td>
                  <td className="td-num">{bw.maidens}</td>
                  <td className="td-num">{bw.runs}</td>
                  <td className="td-num bold-num">{bw.wickets}</td>
                  <td className="td-num">{bw.econ}</td>
                  <td className="td-num">{bw.wd}</td>
                  <td className="td-num">{bw.nb}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
