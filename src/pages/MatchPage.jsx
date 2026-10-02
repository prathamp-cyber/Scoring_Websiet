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
import { getMatchDetail } from '../services/matchDetailService';
import { fetchMatchState } from '../services/apiService';
import { getSocket } from '../services/socketService';

export const MatchPage = ({ matchId, initialTab = 'live', onBackToHome }) => {
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

  // Initial load from Backend API
  useEffect(() => {
    fetchMatchState(matchId)
      .then(state => {
        if (state) {
          const fallback = getMatchDetail(matchId);
          setMatchData({
            ...fallback,
            ...state,
            sidePanel: state.sidePanel || fallback?.sidePanel || {
              currentRR: "9.43",
              requiredRR: "9.00",
              target: "187",
              projectedScore: "188",
              seriesName: state.tournamentName || "MAPL 2026",
              seriesLink: "#",
              matchDate: state.date || "26-Sep-2026",
              location: state.ground || "Sun Valley Ground, Gandhidham",
              locationLink: "#",
              lastUpdatedScorer: "Official Scorer",
              lastUpdatedTime: "Just now"
            }
          });
        }
      })
      .catch(() => {
        // Fallback to static mock if API loading
      });
  }, [matchId]);

  // Real-time live update sync via Socket.io
  useEffect(() => {
    const socket = getSocket();
    socket.emit('join_room', matchId);

    const handleStateUpdate = (newState) => {
      setMatchData(prev => {
        const fallback = getMatchDetail(matchId);
        return {
          ...fallback,
          ...newState,
          sidePanel: newState.sidePanel || prev?.sidePanel || fallback?.sidePanel
        };
      });
      setActiveToast('⚡ Score updated live from umpire panel!');
    };

    socket.on('state', handleStateUpdate);

    return () => {
      socket.off('state', handleStateUpdate);
      socket.emit('leave_room', matchId);
    };
  }, [matchId]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabId);
    window.history.pushState({}, '', url.toString());
  };

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
      <Navbar />

      <div className="breadcrumb-bar">
        <div className="breadcrumb-container">
          <button className="breadcrumb-home-link" onClick={onBackToHome}>
            ← Back to Tournament Home
          </button>
          <span className="breadcrumb-slash">/</span>
          <span className="breadcrumb-current">{matchData.tournamentName}</span>
        </div>
      </div>

      <div className="match-header-wrapper">
        <MatchHeaderCard match={matchData} />
      </div>

      <MatchTabs activeTab={activeTab} onSelectTab={handleTabChange} />

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
          <div className="match-left-column">
            {renderTabContent()}
          </div>

          <div className="match-right-column">
            <MatchSidePanel match={matchData} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default MatchPage;
