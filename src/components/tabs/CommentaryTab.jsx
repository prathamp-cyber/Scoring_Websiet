import React from 'react';

export const CommentaryTab = ({ match }) => {
  const { commentary = [] } = match;

  if (!commentary || commentary.length === 0) {
    return <div className="tab-pane-container">No commentary items available.</div>;
  }

  return (
    <div className="tab-pane-container commentary-tab-pane">
      <div className="commentary-list">
        {commentary.map((item, idx) => {
          if (item.isOverSummary) {
            return (
              <div key={idx} className="commentary-over-summary">
                <span>{item.text}</span>
              </div>
            );
          }

          let typeClass = '';
          if (item.isWicket || item.type === 'wicket') {
            typeClass = 'is-wicket-row';
          } else if (item.runs === 4 || item.type === 'four') {
            typeClass = 'is-four-row';
          } else if (item.runs === 6 || item.type === 'six') {
            typeClass = 'is-six-row';
          }

          return (
            <div key={idx} className={`commentary-row ${typeClass}`}>
              <div className="ball-badge-col">
                <span className="over-ball-badge">{item.ball}</span>
              </div>
              <div className="commentary-text-col">
                <p className="commentary-text">{item.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
