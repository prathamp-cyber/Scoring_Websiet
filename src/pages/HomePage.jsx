import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { TournamentBanner } from '../components/TournamentBanner';
import { SubNavTabs } from '../components/SubNavTabs';
import { ViewSwitch } from '../components/ViewSwitch';
import { MatchCard } from '../components/MatchCard';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { PlaceholderTabContent } from '../components/PlaceholderTabContent';
import { tournamentConfig, getTournamentMatches } from '../services/matchService';

export function HomePage({ onNavigateToMatch }) {
  // Read initial view from URL query parameter ?view=live|upcoming|completed (default to 'live')
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

  // Derive matches list based on selected view
  const matches = getTournamentMatches(activeView);

  // Handle URL query state updates without full page reloads
  const handleViewChange = (newView) => {
    setActiveView(newView);
    const url = new URL(window.location.href);
    url.searchParams.set('view', newView);
    window.history.pushState({}, '', url.toString());
  };

  // Listen to popstate (browser back/forward button)
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
      {/* 1. Sticky Navigation Bar */}
      <Navbar />

      {/* 2. Full-Width Gradient Banner Section */}
      <TournamentBanner config={tournamentConfig} />

      {/* 3. Sub-Nav Tab Bar */}
      <SubNavTabs 
        activeTab={activeTab} 
        onSelectTab={(tabId) => setActiveTab(tabId)} 
      />

      {/* 4. Main Content Area */}
      <main className="main-content">
        {/* Navigation Toast Banner */}
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

        {/* Tab Content rendering */}
        {activeTab === 'matches' ? (
          <>
            {/* Live / Upcoming / Completed Segmented Switch */}
            <ViewSwitch 
              activeView={activeView} 
              onViewChange={handleViewChange} 
            />

            {/* Match Cards Masonry Grid */}
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

      {/* 5. Floating Action Button (FAB) */}
      <FloatingActionButton onNavigate={handleFabNavigate} />
    </div>
  );
}

export default HomePage;
