import React, { useState, useEffect } from 'react';
import { HomePage } from './pages/HomePage';
import { MatchPage } from './pages/MatchPage';
import { AdminSetupPage } from './pages/AdminSetupPage';
import { AdminScoringPage } from './pages/AdminScoringPage';
import { FullscreenScoreboardPage } from './pages/FullscreenScoreboardPage';

export function App() {
  const parseRoute = () => {
    const path = window.location.pathname;

    // Full-screen Scoreboard Route
    if (path.includes('/fullscreen')) {
      const parts = path.split('/').filter(Boolean);
      let matchId = 'match-101';
      if (parts[0] === 'fullscreen') matchId = parts[1] || 'match-101';
      else if (parts.length >= 2) matchId = parts[1] || 'match-101';
      return { view: 'fullscreen_scoreboard', matchId };
    }

    // Handle legacy /admin/setup redirect
    if (path === '/admin/setup') {
      window.history.replaceState({}, '', '/umpire/setup');
      return { view: 'umpire_setup' };
    }

    if (path === '/umpire/setup') {
      return { view: 'umpire_setup' };
    }

    // Handle legacy /admin/match/:id redirect
    if (path.startsWith('/admin/match/')) {
      const matchId = path.split('/')[3] || 'match-101';
      window.history.replaceState({}, '', `/umpire/match/${matchId}`);
      return { view: 'umpire_scoring', matchId };
    }

    if (path.startsWith('/umpire/match/')) {
      const parts = path.split('/').filter(Boolean);
      const matchId = parts[2] || 'match-101';
      return { view: 'umpire_scoring', matchId };
    }

    if (path.startsWith('/match/') || path.startsWith('/live/') || path.startsWith('/scorecard/') || path.startsWith('/upcoming/')) {
      const parts = path.split('/').filter(Boolean);
      const prefix = parts[0];
      const matchId = parts[1] || 'match-101';

      let defaultTab = 'live';
      if (prefix === 'scorecard') defaultTab = 'scorecard';
      if (prefix === 'upcoming') defaultTab = 'info';

      return {
        view: 'match',
        matchId: matchId,
        defaultTab: defaultTab,
      };
    }

    return {
      view: 'home',
    };
  };

  const [route, setRoute] = useState(parseRoute);

  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(parseRoute());
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateToMatch = (matchId, targetPath) => {
    window.history.pushState({}, '', targetPath);
    setRoute(parseRoute());
  };

  const navigateToHome = () => {
    window.history.pushState({}, '', '/');
    setRoute({ view: 'home' });
  };

  const navigateToUmpireScoring = (matchId) => {
    window.history.pushState({}, '', `/umpire/match/${matchId}`);
    setRoute({ view: 'umpire_scoring', matchId });
  };

  if (route.view === 'fullscreen_scoreboard') {
    return (
      <FullscreenScoreboardPage 
        matchId={route.matchId} 
        onExit={() => navigateToMatch(route.matchId, `/match/${route.matchId}`)} 
      />
    );
  }

  if (route.view === 'umpire_setup') {
    return (
      <AdminSetupPage 
        onNavigateToScoring={navigateToUmpireScoring} 
        onBackToHome={navigateToHome} 
      />
    );
  }

  if (route.view === 'umpire_scoring') {
    return (
      <AdminScoringPage 
        matchId={route.matchId} 
        onNavigateToMatchCard={navigateToMatch} 
      />
    );
  }

  if (route.view === 'match') {
    return (
      <MatchPage 
        matchId={route.matchId} 
        initialTab={route.defaultTab} 
        onBackToHome={navigateToHome} 
      />
    );
  }

  return (
    <HomePage 
      onNavigateToMatch={navigateToMatch} 
    />
  );
}

export default App;
