import React from 'react';

export const AnalysisTab = ({ match }) => {
  const { analysis, teamA, teamB } = match;

  if (!analysis) {
    return <div className="tab-pane-container">No analysis data available.</div>;
  }

  const { manhattan = [], worm = {}, runRateTable = [] } = analysis;

  // SVG Chart Dimensions & Helpers for Manhattan
  const svgWidth = 500;
  const svgHeight = 200;
  const padding = { top: 25, right: 20, bottom: 30, left: 35 };
  const chartW = svgWidth - padding.left - padding.right;
  const chartH = svgHeight - padding.top - padding.bottom;
  const maxRunsPerOver = 20;

  // Worm chart dimensions
  const wormW = 500;
  const wormH = 220;
  const wormPad = { top: 30, right: 25, bottom: 30, left: 40 };
  const wormInnerW = wormW - wormPad.left - wormPad.right;
  const wormInnerH = wormH - wormPad.top - wormPad.bottom;
  const maxCumulativeRuns = 200;

  // Convert over & cumulative runs to SVG coordinates
  const getWormCoords = (dataPoints) => {
    if (!dataPoints || dataPoints.length === 0) return '';
    return dataPoints.map((pt) => {
      const x = wormPad.left + (pt.over / 20) * wormInnerW;
      const y = wormPad.top + wormInnerH - (pt.runs / maxCumulativeRuns) * wormInnerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  return (
    <div className="tab-pane-container analysis-tab-pane">
      {/* 1. MANHATTAN CHART */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Manhattan Chart (Runs Per Over)</h3>
          <span className="chart-subtitle">Red dots indicate wickets fell</span>
        </div>

        <div className="svg-container">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="analysis-svg">
            {/* Gridlines */}
            {[5, 10, 15, 20].map((val) => {
              const y = padding.top + chartH - (val / maxRunsPerOver) * chartH;
              return (
                <g key={val}>
                  <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="#e5e7eb" strokeDasharray="3 3" />
                  <text x={padding.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{val}</text>
                </g>
              );
            })}

            {/* X-axis Line & Labels */}
            <line x1={padding.left} y1={padding.top + chartH} x2={svgWidth - padding.right} y2={padding.top + chartH} stroke="#cbd5e1" strokeWidth="1.5" />

            {/* Bars & Wicket Markers */}
            {manhattan.map((item, i) => {
              const barWidth = (chartW / manhattan.length) * 0.7;
              const slotWidth = chartW / manhattan.length;
              const x = padding.left + i * slotWidth + (slotWidth - barWidth) / 2;
              const barHeight = Math.min((item.runs / maxRunsPerOver) * chartH, chartH);
              const y = padding.top + chartH - barHeight;

              return (
                <g key={i}>
                  {/* Over Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill="url(#manhattanGradient)"
                    rx="2"
                  />
                  {/* Over Number Label */}
                  {(i + 1) % 2 === 0 || i === 0 ? (
                    <text x={x + barWidth / 2} y={svgHeight - 10} textAnchor="middle" fontSize="10" fill="#6b7280">{item.over}</text>
                  ) : null}

                  {/* Wicket Dot Marker */}
                  {item.wickets > 0 && (
                    <g>
                      <circle cx={x + barWidth / 2} cy={y - 8} r="4" fill="#dc2626" />
                      {item.wickets > 1 && (
                        <text x={x + barWidth / 2} y={y - 14} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#dc2626">{item.wickets}w</text>
                      )}
                    </g>
                  )}
                </g>
              );
            })}

            {/* Gradient definition for bars */}
            <defs>
              <linearGradient id="manhattanGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5821f" />
                <stop offset="100%" stopColor="#e21b1b" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* 2. WORM CHART */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Worm Chart (Cumulative Progression)</h3>
          <div className="chart-legend">
            <span className="legend-item">
              <span className="legend-color-dot inn1-dot"></span>
              {teamA?.shortName || '1st Innings'}
            </span>
            <span className="legend-item">
              <span className="legend-color-dot inn2-dot"></span>
              {teamB?.shortName || '2nd Innings'}
            </span>
          </div>
        </div>

        <div className="svg-container">
          <svg viewBox={`0 0 ${wormW} ${wormH}`} className="analysis-svg">
            {/* Gridlines */}
            {[50, 100, 150, 200].map((val) => {
              const y = wormPad.top + wormInnerH - (val / maxCumulativeRuns) * wormInnerH;
              return (
                <g key={val}>
                  <line x1={wormPad.left} y1={y} x2={wormW - wormPad.right} y2={y} stroke="#e5e7eb" strokeDasharray="3 3" />
                  <text x={wormPad.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{val}</text>
                </g>
              );
            })}

            {/* X-axis & Y-axis lines */}
            <line x1={wormPad.left} y1={wormPad.top + wormInnerH} x2={wormW - wormPad.right} y2={wormPad.top + wormInnerH} stroke="#cbd5e1" strokeWidth="1.5" />

            {/* Innings 1 Line (Gradient Red) */}
            {worm.innings1 && (
              <polyline
                fill="none"
                stroke="#e21b1b"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={getWormCoords(worm.innings1)}
              />
            )}

            {/* Innings 2 Line (Dark Green) */}
            {worm.innings2 && (
              <polyline
                fill="none"
                stroke="#1b7a4d"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={getWormCoords(worm.innings2)}
              />
            )}

            {/* Over Numbers */}
            {[0, 5, 10, 15, 20].map((ov) => {
              const x = wormPad.left + (ov / 20) * wormInnerW;
              return (
                <text key={ov} x={x} y={wormH - 10} textAnchor="middle" fontSize="10" fill="#6b7280">Ov {ov}</text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 3. RUN RATE COMPARISON TABLE */}
      <div className="table-card">
        <div className="table-card-header">
          <h3 className="table-title">Run Rate & Phase Analysis</h3>
        </div>
        <div className="table-responsive">
          <table className="cricket-table analysis-rr-table">
            <thead>
              <tr>
                <th className="th-name">Phase (Overs)</th>
                <th className="th-num">{teamA?.shortName} Runs</th>
                <th className="th-num">{teamA?.shortName} RR</th>
                <th className="th-num">{teamB?.shortName} Runs</th>
                <th className="th-num">{teamB?.shortName} RR</th>
              </tr>
            </thead>
            <tbody>
              {runRateTable.map((row, idx) => (
                <tr key={idx}>
                  <td className="td-name font-semibold">{row.overRange}</td>
                  <td className="td-num">{row.inn1Runs}</td>
                  <td className="td-num bold-num">{row.inn1RR}</td>
                  <td className="td-num">{row.inn2Runs}</td>
                  <td className="td-num bold-num">{row.inn2RR}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
