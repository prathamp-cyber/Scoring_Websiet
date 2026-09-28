import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Umpire from './pages/Umpire';
import UmpireSetup from './pages/UmpireSetup';
import Live from './pages/Live';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/umpire/setup" element={<UmpireSetup />} />
        <Route path="/umpire/:matchId" element={<Umpire />} />
        <Route path="/live/:matchId" element={<Live />} />
      </Routes>
    </Router>
  );
}

export default App;
