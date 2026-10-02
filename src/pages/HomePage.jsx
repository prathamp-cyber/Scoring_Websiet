import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { TournamentBanner } from '../components/TournamentBanner';
import { SubNavTabs } from '../components/SubNavTabs';
import { ViewSwitch } from '../components/ViewSwitch';
import { MatchCard } from '../components/MatchCard';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { PlaceholderTabContent } from '../components/PlaceholderTabContent';
import { tournamentConfig, getTournamentMatches } from '../services/matchService';
import { fetchMatches } from '../services/apiService';
import { getSocket } from '../services/socketService';
import { Plus } from 'lucide-react';

export function HomePage({ onNavigateToMatch, onNavigateToAdminSetup }) {
  const getInitialView = () => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (['live', 'upcoming', 'completed'].includes(viewParam)) {
      return viewParam;
    }
    return 'live';
  };

  const [activeTab, setActiveTab] = useState('matches');
  const [activeView, setActiveView] = useState(getInitialView);
  const [activeToast, setActiveToast] = useState(null);
  const [matches, setMatches] = useState(() => getTournamentMatches(activeView));

  // Load matches from API
  useEffect(() => {
    fetchMatches(activeView)
      .then(data => {
        if (data && data.length > 0) {
          setMatches(data);
        }
      })
      .catch(() => {
        // Fallback to static mock if backend starting up
        setMatches(getTournamentMatches(activeView));
      });
  }, [activeView]);

  // Real-time sync via Socket.io 'match_summary'
  useEffect(() => {
    const socket = getSocket();

    const handleMatchSummary = (summary) => {
      setMatches(prev => {
        const index = prev.findIndex(m => m.matchId === summary.matchId);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...summary };
          return updated;
        } else {
          // Add to top if it matches current activeView or is live
          if (activeView === summary.status || activeView === 'live') {
            return [summary, ...prev];
          }
          return prev;
        }
      });
    };

    socket.on('match_summary', handleMatchSummary);
    return () => {
      socket.off('match_summary', handleMatchSummary);
    };
  }, [activeView]);

  const handleViewChange = (newView) => {
    setActiveView(newView);
    const url = new URL(window.location.href);
    url.searchParams.set('view', newView);
    window.history.pushState({}, '', url.toString());
  };

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      if (['live', 'upcoming', 'completed'].includes(viewParam)) {
        setActiveView(viewParam);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleMatchCardClick = (matchId, targetPath) => {
    if (onNavigateToMatch) {
      onNavigateToMatch(matchId, targetPath);
    }
  };

  const handleFabNavigate = (targetPath) => {
    window.history.pushState({}, '', targetPath);
    setActiveToast(`Navigated to: ${targetPath}`);
  };

  return (
    <div className="app-container">
      {/* Sticky Navigation Bar */}
      <Navbar />

      {/* Full-Width Gradient Banner Section */}
      <TournamentBanner config={tournamentConfig} />

      {/* Sub-Nav Tab Bar */}
      <SubNavTabs 
        activeTab={activeTab} 
        onSelectTab={(tabId) => setActiveTab(tabId)} 
      />

      {/* Main Content Area */}
      <main className="main-content">
        {activeToast && (
          <div className="route-toast">
            <span>{activeToast}</span>
            <button 
              onClick={() => setActiveToast(null)} 
              className="dismiss-toast-btn"
              aria-label="Dismiss message"
            >
              ✕
            </button>
          </div>
        )}

        {activeTab === 'matches' ? (
          <>
            <ViewSwitch 
              activeView={activeView} 
              onViewChange={handleViewChange} 
            />

            {matches.length > 0 ? (
              <div className="matches-masonry">
                {matches.map((match) => (
                  <MatchCard 
                    key={match.matchId} 
                    match={match} 
                    onMatchClick={handleMatchCardClick} 
                  />
                ))}
              </div>
            ) : (
              <div className="empty-matches-state">
                <p>No {activeView} matches available for this tournament at the moment.</p>
              </div>
            )}
          </>
        ) : (
          <PlaceholderTabContent 
            tabId={activeTab} 
            onBackToMatches={() => setActiveTab('matches')} 
          />
        )}
      </main>
    </div>
  );
}

export default HomePage;
