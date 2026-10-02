import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { MatchHeaderCard } from '../components/MatchHeaderCard';
import { MatchTabs } from '../components/MatchTabs';
import { LiveTab } from '../components/tabs/LiveTab';
import { ScorecardTab } from '../components/tabs/ScorecardTab';
import { CommentaryTab } from '../components/tabs/CommentaryTab';
import { SquadsTab } from '../components/tabs/SquadsTab';
import { AnalysisTab } from '../components/tabs/AnalysisTab';
import { InfoTab } from '../components/tabs/InfoTab';
import { MatchSidePanel } from '../components/MatchSidePanel';
import { getMatchDetail, simulateLiveBallUpdate } from '../services/matchDetailService';

export const MatchPage = ({ matchId, initialTab = 'live', onBackToHome }) => {
  // Read tab parameter from URL query string if present
  const getTabFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (['live', 'scorecard', 'commentary', 'squads', 'analysis', 'info'].includes(tabParam)) {
      return tabParam;
    }
    return initialTab || 'live';
  };

  const [activeTab, setActiveTab] = useState(getTabFromUrl);
  const [matchData, setMatchData] = useState(() => getMatchDetail(matchId));
  const [activeToast, setActiveToast] = useState(null);

  // Sync state when matchId changes
  const prevMatchId = React.useRef(matchId);
  if (prevMatchId.current !== matchId) {
    prevMatchId.current = matchId;
    setMatchData(getMatchDetail(matchId));
  }

  // Handle Tab changes with URL query parameter sync
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabId);
    window.history.pushState({}, '', url.toString());
  };

  // Listen to popstate (browser back/forward button)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (['live', 'scorecard', 'commentary', 'squads', 'analysis', 'info'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Live simulation update handler
  const handleSimulateBall = () => {
    const updated = simulateLiveBallUpdate(matchData);
    setMatchData(updated);
    setActiveToast('Live ball update simulated! (+4 runs added to score)');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'live':
        return <LiveTab match={matchData} />;
      case 'scorecard':
        return <ScorecardTab match={matchData} />;
      case 'commentary':
        return <CommentaryTab match={matchData} />;
      case 'squads':
        return <SquadsTab match={matchData} />;
      case 'analysis':
        return <AnalysisTab match={matchData} />;
      case 'info':
        return <InfoTab match={matchData} />;
      default:
        return <LiveTab match={matchData} />;
    }
  };

  return (
    <div className="app-container match-page-container">
      {/* 1. Sticky Navigation Bar */}
      <Navbar />

      {/* Breadcrumb Navigation Bar */}
      <div className="breadcrumb-bar">
        <div className="breadcrumb-container">
          <button className="breadcrumb-home-link" onClick={onBackToHome}>
            ← Back to Tournament Home
          </button>
          <span className="breadcrumb-slash">/</span>
          <span className="breadcrumb-current">{matchData.tournamentName}</span>
        </div>
      </div>

      {/* 2. Full-width Header Card */}
      <div className="match-header-wrapper">
        <MatchHeaderCard match={matchData} />
      </div>

      {/* 3. Sub-nav Tab Bar */}
      <MatchTabs activeTab={activeTab} onSelectTab={handleTabChange} />

      {/* 4. Two-column Main Content Area (left: tab content, right: side panel) */}
      <main className="match-main-content">
        {activeToast && (
          <div className="route-toast">
            <span>{activeToast}</span>
            <button 
              onClick={() => setActiveToast(null)} 
              className="dismiss-toast-btn"
              aria-label="Dismiss toast"
            >
              ✕
            </button>
          </div>
        )}

        <div className="match-two-column-layout">
          {/* Left Column: Active Tab Content */}
          <div className="match-left-column">
            {renderTabContent()}
          </div>

          {/* Right Column: Match Details Side Panel */}
          <div className="match-right-column">
            <MatchSidePanel 
              match={matchData} 
              onSimulateBall={handleSimulateBall} 
            />
          </div>
        </div>
      </main>
    </div>
  );
};
