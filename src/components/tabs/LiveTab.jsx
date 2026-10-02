import React from 'react';

export const LiveTab = ({ match }) => {
  const { liveData, status, resultText } = match;
  if (!liveData) return null;

  const { currentBatters = [], currentBowler, currentPartnership, recentBalls = [], bannerText, bannerType } = liveData;

  const renderBallPill = (item, idx) => {
    if (item.type === 'over_boundary' || item.label === 'divider') {
      return <div key={`div-${idx}`} className="over-divider-pill">|</div>;
    }

    let pillClass = 'ball-pill-gray';
    if (item.val === '4' || item.type === 'four') {
      pillClass = 'ball-pill-blue';
    } else if (item.val === '6' || item.type === 'six') {
      pillClass = 'ball-pill-green';
    } else if (item.val === 'W' || item.type === 'wicket') {
      pillClass = 'ball-pill-red';
    }

    return (
      <span key={`ball-${idx}`} className={`ball-pill ${pillClass}`} title={`Ball ${item.ball || ''}`}>
        {item.val}
      </span>
    );
  };

  return (
    <div className="tab-pane-container live-tab-pane">
      {/* 1. BATTERS TABLE */}
      <div className="table-card">
        <div className="table-card-header">
          <h3 className="table-title">Batting</h3>
        </div>
        <div className="table-responsive">
          <table className="cricket-table batters-table">
            <thead>
              <tr>
                <th className="th-name">Batter</th>
                <th className="th-num">R</th>
                <th className="th-num">B</th>
                <th className="th-num">4s</th>
                <th className="th-num">6s</th>
                <th className="th-num">SR</th>
              </tr>
            </thead>
            <tbody>
              {currentBatters.map((b, i) => (
                <tr key={i} className={b.isStriker ? 'striker-row' : ''}>
                  <td className="td-name">
                    <span className="batter-link-name">
                      {b.name}{b.isStriker ? ' *' : ''}
                    </span>
                  </td>
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
      </div>

      {/* 2. BOWLERS TABLE */}
      {currentBowler && (
        <div className="table-card">
          <div className="table-card-header">
            <h3 className="table-title">Bowling</h3>
          </div>
          <div className="table-responsive">
            <table className="cricket-table bowlers-table">
              <thead>
                <tr>
                  <th className="th-name">Bowler</th>
                  <th className="th-num">O</th>
                  <th className="th-num">M</th>
                  <th className="th-num">R</th>
                  <th className="th-num">W</th>
                  <th className="th-num">Econ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="td-name">
                    <span className="bowler-name">{currentBowler.name} *</span>
                  </td>
                  <td className="td-num">{currentBowler.overs}</td>
                  <td className="td-num">{currentBowler.maidens}</td>
                  <td className="td-num">{currentBowler.runs}</td>
                  <td className="td-num bold-num">{currentBowler.wickets}</td>
                  <td className="td-num">{currentBowler.econ}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. CURRENT PARTNERSHIP LINE */}
      {currentPartnership && (
        <div className="partnership-card">
          <span className="partnership-label">Current Partnership:</span>
          <span className="partnership-value">
            <strong>{currentPartnership.runs} runs</strong> ({currentPartnership.balls} balls)
          </span>
        </div>
      )}

      {/* 4. RECENT BALLS ROW */}
      <div className="recent-balls-card">
        <span className="recent-label">RECENT:</span>
        <div className="recent-pills-list">
          {recentBalls.map((item, idx) => renderBallPill(item, idx))}
        </div>
      </div>

      {/* 5. INNINGS BREAK OR RESULT BANNER */}
      {status === 'completed' || bannerType === 'completed_result' ? (
        <div className="match-banner-strip result-strip">
          <span>🏆 {resultText || bannerText}</span>
        </div>
      ) : (
        <div className="match-banner-strip live-strip">
          <span>⚡ {bannerText || 'Match in progress'}</span>
        </div>
      )}
    </div>
  );
};
