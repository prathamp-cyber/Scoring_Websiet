import React, { useState, useEffect } from 'react';
import { HomePage } from './pages/HomePage';
import { MatchPage } from './pages/MatchPage';

export function App() {
  const parseRoute = () => {
    const path = window.location.pathname;

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

  if (route.view === 'match') {
    return (
      <MatchPage 
        matchId={route.matchId} 
        initialTab={route.defaultTab} 
        onBackToHome={navigateToHome} 
      />
    );
  }

  return <HomePage onNavigateToMatch={navigateToMatch} />;
}

export default App;
