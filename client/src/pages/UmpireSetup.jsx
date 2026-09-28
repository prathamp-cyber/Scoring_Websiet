import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UmpireSetup.css';

const API_BASE = 'http://localhost:5000/api';

export default function UmpireSetup() {
  const navigate = useNavigate();

  // Data loaded from API
  const [teams, setTeams] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedFixtureId, setSelectedFixtureId] = useState('');
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [oversLimit, setOversLimit] = useState(20);
  const [playersPerSide, setPlayersPerSide] = useState(11);
  const [tossWinnerId, setTossWinnerId] = useState('');
  const [tossDecision, setTossDecision] = useState('bat');

  // Rosters loaded from API
  const [rosterA, setRosterA] = useState([]);
  const [rosterB, setRosterB] = useState([]);

  // Manually added players
  const [manualPlayersA, setManualPlayersA] = useState([]);
  const [manualPlayersB, setManualPlayersB] = useState([]);
  const [inputManualNameA, setInputManualNameA] = useState('');
  const [inputManualNameB, setInputManualNameB] = useState('');

  // Selected Playing XI player IDs
  const [selectedXIIdsA, setSelectedXIIdsA] = useState([]);
  const [selectedXIIdsB, setSelectedXIIdsB] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Fetch Teams & Fixtures on Mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [teamsRes, fixturesRes] = await Promise.all([
          fetch(`${API_BASE}/teams`),
          fetch(`${API_BASE}/fixtures`)
        ]);

        const teamsData = await teamsRes.json();
        const fixturesData = await fixturesRes.json();

        setTeams(teamsData);
        setFixtures(fixturesData);

        if (teamsData.length >= 2) {
          setTeamAId(teamsData[0].id);
          setTeamBId(teamsData[1].id);
          setTossWinnerId(teamsData[0].id);
        }
      } catch (err) {
        console.error('Error fetching initial setup data:', err);
        setErrorMsg('Failed to load teams or fixtures from backend server.');
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // 2. Fixture Selection Handler
  const handleFixtureChange = (fixtureId) => {
    setSelectedFixtureId(fixtureId);
    if (!fixtureId) return;

    const fixture = fixtures.find((f) => f.id === fixtureId);
    if (fixture) {
      setTeamAId(fixture.teamAId || '');
      setTeamBId(fixture.teamBId || '');
      if (fixture.teamAId) setTossWinnerId(fixture.teamAId);
    }
  };

  // 3. Load Team A Players
  useEffect(() => {
    if (!teamAId) {
      setRosterA([]);
      setSelectedXIIdsA([]);
      return;
    }

    async function loadRosterA() {
      try {
        const res = await fetch(`${API_BASE}/teams/${teamAId}/players`);
        const data = await res.json();
        setRosterA(data);
        // Pre-select up to playersPerSide available players
        const initialSelected = data.slice(0, playersPerSide).map((p) => p.id);
        setSelectedXIIdsA(initialSelected);
      } catch (err) {
        console.error('Error loading roster for team A:', err);
      }
    }

    loadRosterA();
  }, [teamAId]);

  // 4. Load Team B Players
  useEffect(() => {
    if (!teamBId) {
      setRosterB([]);
      setSelectedXIIdsB([]);
      return;
    }

    async function loadRosterB() {
      try {
        const res = await fetch(`${API_BASE}/teams/${teamBId}/players`);
        const data = await res.json();
        setRosterB(data);
        const initialSelected = data.slice(0, playersPerSide).map((p) => p.id);
        setSelectedXIIdsB(initialSelected);
      } catch (err) {
        console.error('Error loading roster for team B:', err);
      }
    }

    loadRosterB();
  }, [teamBId]);

  // Keep toss winner aligned with Team A or Team B
  useEffect(() => {
    if (tossWinnerId !== teamAId && tossWinnerId !== teamBId) {
      if (teamAId) setTossWinnerId(teamAId);
    }
  }, [teamAId, teamBId, tossWinnerId]);

  const selectedTeamA = teams.find((t) => t.id === teamAId);
  const selectedTeamB = teams.find((t) => t.id === teamBId);

  const selectedFixture = fixtures.find((f) => f.id === selectedFixtureId);

  // Manual Player Handlers
  const handleAddManualPlayerA = () => {
    if (!inputManualNameA.trim()) return;
    const newPlayer = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: inputManualNameA.trim(),
      isManual: true
    };
    setManualPlayersA((prev) => [...prev, newPlayer]);
    setSelectedXIIdsA((prev) => [...prev, newPlayer.id]);
    setInputManualNameA('');
  };

  const handleAddManualPlayerB = () => {
    if (!inputManualNameB.trim()) return;
    const newPlayer = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: inputManualNameB.trim(),
      isManual: true
    };
    setManualPlayersB((prev) => [...prev, newPlayer]);
    setSelectedXIIdsB((prev) => [...prev, newPlayer.id]);
    setInputManualNameB('');
  };

  const allPlayersA = [...rosterA, ...manualPlayersA];
  const allPlayersB = [...rosterB, ...manualPlayersB];

  const togglePlayerA = (id) => {
    setSelectedXIIdsA((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const togglePlayerB = (id) => {
    setSelectedXIIdsB((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Validation
  const targetXI = Number(playersPerSide);
  const isTeamValid = teamAId && teamBId && teamAId !== teamBId;
  const isOversValid = oversLimit && Number(oversLimit) > 0;
  const isTossValid = tossWinnerId && (tossWinnerId === teamAId || tossWinnerId === teamBId) && tossDecision;
  const isTeamAXIValid = selectedXIIdsA.length === targetXI;
  const isTeamBXIValid = selectedXIIdsB.length === targetXI;

  const isFormValid = isTeamValid && isOversValid && isTossValid && isTeamAXIValid && isTeamBXIValid;

  const handleStartMatch = async (e) => {
    e.preventDefault();
    if (!isFormValid || submitting) return;

    setSubmitting(true);
    setErrorMsg('');

    const selectedXIObjectsA = allPlayersA
      .filter((p) => selectedXIIdsA.includes(p.id))
      .map((p) => ({ id: p.id, name: p.name, isManual: Boolean(p.isManual) }));

    const selectedXIObjectsB = allPlayersB
      .filter((p) => selectedXIIdsB.includes(p.id))
      .map((p) => ({ id: p.id, name: p.name, isManual: Boolean(p.isManual) }));

    const payload = {
      fixtureId: selectedFixtureId || null,
      teamA: {
        id: selectedTeamA.id,
        name: selectedTeamA.name,
        shortName: selectedTeamA.shortName,
        logo: selectedTeamA.logo,
        color: selectedTeamA.color
      },
      teamB: {
        id: selectedTeamB.id,
        name: selectedTeamB.name,
        shortName: selectedTeamB.shortName,
        logo: selectedTeamB.logo,
        color: selectedTeamB.color
      },
      oversLimit: Number(oversLimit),
      playersPerSide: Number(playersPerSide),
      tossWinnerId,
      tossDecision,
      playingXI: {
        teamA: selectedXIObjectsA,
        teamB: selectedXIObjectsB
      }
    };

    try {
      const res = await fetch(`${API_BASE}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.matchId) {
        console.log(`Match created successfully! Match ID: ${data.matchId}`);
        navigate(`/umpire/${data.matchId}`);
      } else {
        setErrorMsg(data.error || 'Failed to create match on server.');
      }
    } catch (err) {
      console.error('Error submitting match creation:', err);
      setErrorMsg('Network error connecting to backend API.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="setup-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h2>Loading Auction Teams & Tournament Fixtures...</h2>
      </div>
    );
  }

  return (
    <div className="setup-container">
      <div className="setup-header">
        <h1>🏆 Match Setup — Umpire Console</h1>
        <p>Configure teams, tournament fixtures, toss decision, and playing XI before starting</p>
      </div>

      {errorMsg && (
        <div className="error-banner" style={{ marginBottom: '1.5rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleStartMatch}>
        {/* Step 1: Fixture Selection */}
        <div className="setup-card">
          <div className="setup-card-title">
            <span>📅</span> Select Tournament Fixture (Optional)
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="fixtureSelect">Tournament Fixtures List</label>
            <select
              id="fixtureSelect"
              className="form-control"
              value={selectedFixtureId}
              onChange={(e) => handleFixtureChange(e.target.value)}
            >
              <option value="">-- Custom Match (Select Teams Manually) --</option>
              {fixtures.map((f) => (
                <option key={f.id} value={f.id}>
                  Match {f.matchNo} — {f.team1Name} vs {f.team2Name} (Court {f.court}, {f.startTime})
                </option>
              ))}
            </select>
          </div>

          {selectedFixture && (!selectedFixture.teamAId || !selectedFixture.teamBId) && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#d97706', fontWeight: '600' }}>
              ⚠️ Note: Unresolved fixture team name in auction data — please select team manually below.
            </div>
          )}
        </div>

        {/* Step 2: Teams & Match Rules */}
        <div className="setup-card">
          <div className="setup-card-title">
            <span>⚙️</span> Match Rules & Team Selection
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="teamA">Team A</label>
              <select
                id="teamA"
                className="form-control"
                value={teamAId}
                onChange={(e) => setTeamAId(e.target.value)}
              >
                <option value="" disabled>-- Select Team A --</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id} disabled={team.id === teamBId}>
                    {team.name} ({team.shortName})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="teamB">Team B</label>
              <select
                id="teamB"
                className="form-control"
                value={teamBId}
                onChange={(e) => setTeamBId(e.target.value)}
              >
                <option value="" disabled>-- Select Team B --</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id} disabled={team.id === teamAId}>
                    {team.name} ({team.shortName})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="oversLimit">Overs Limit</label>
              <input
                id="oversLimit"
                type="number"
                min="1"
                max="50"
                className="form-control"
                value={oversLimit}
                onChange={(e) => setOversLimit(e.target.value)}
                placeholder="e.g. 20"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="playersPerSide">Players Per Side</label>
              <input
                id="playersPerSide"
                type="number"
                min="2"
                max="11"
                className="form-control"
                value={playersPerSide}
                onChange={(e) => setPlayersPerSide(Number(e.target.value))}
                required
              />
            </div>
          </div>
        </div>

        {/* Step 3: Toss Details */}
        <div className="setup-card">
          <div className="setup-card-title">
            <span>🪙</span> Toss Information
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="tossWinner">Toss Winner</label>
              <select
                id="tossWinner"
                className="form-control"
                value={tossWinnerId}
                onChange={(e) => setTossWinnerId(e.target.value)}
              >
                {selectedTeamA && <option value={teamAId}>{selectedTeamA.name}</option>}
                {selectedTeamB && <option value={teamBId}>{selectedTeamB.name}</option>}
              </select>
            </div>

            <div className="form-group">
              <label>Toss Decision</label>
              <div className="radio-group">
                <label className={`radio-label ${tossDecision === 'bat' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="tossDecision"
                    value="bat"
                    checked={tossDecision === 'bat'}
                    onChange={() => setTossDecision('bat')}
                  />
                  🏏 Bat First
                </label>
                <label className={`radio-label ${tossDecision === 'bowl' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="tossDecision"
                    value="bowl"
                    checked={tossDecision === 'bowl'}
                    onChange={() => setTossDecision('bowl')}
                  />
                  ⚾ Bowl First
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Team A Roster */}
        {selectedTeamA && (
          <div className="setup-card xi-section">
            <div className="xi-header">
              <div className="setup-card-title" style={{ margin: 0 }}>
                {selectedTeamA.name} — Playing Roster
              </div>
              <span className={`badge-count ${isTeamAXIValid ? 'success' : 'error'}`}>
                {selectedXIIdsA.length} / {targetXI} Selected
              </span>
            </div>

            {!isTeamAXIValid && (
              <div className="error-banner">
                ⚠️ Exactly {targetXI} players must be selected for {selectedTeamA.name}. Currently selected: {selectedXIIdsA.length}.
              </div>
            )}

            <div className="players-list">
              {allPlayersA.map((player) => {
                const isSelected = selectedXIIdsA.includes(player.id);
                return (
                  <div
                    key={player.id}
                    className={`player-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => togglePlayerA(player.id)}
                  >
                    <div className="player-info">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                      />
                      <span className="player-name">{player.name} {player.isManual && '(Manual)'}</span>
                    </div>
                    <span className="player-role">
                      {player.specifications?.join(', ') || (player.isManual ? 'Manual Addition' : 'Player')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Add Player Manually */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed #cbd5e1' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
                ➕ Add Player Manually to {selectedTeamA.name}
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter player name..."
                  value={inputManualNameA}
                  onChange={(e) => setInputManualNameA(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddManualPlayerA())}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleAddManualPlayerA}
                  style={{ whiteSpace: 'nowrap', padding: '0 1.25rem' }}
                >
                  Add Player
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Team B Roster */}
        {selectedTeamB && (
          <div className="setup-card xi-section">
            <div className="xi-header">
              <div className="setup-card-title" style={{ margin: 0 }}>
                {selectedTeamB.name} — Playing Roster
              </div>
              <span className={`badge-count ${isTeamBXIValid ? 'success' : 'error'}`}>
                {selectedXIIdsB.length} / {targetXI} Selected
              </span>
            </div>

            {!isTeamBXIValid && (
              <div className="error-banner">
                ⚠️ Exactly {targetXI} players must be selected for {selectedTeamB.name}. Currently selected: {selectedXIIdsB.length}.
              </div>
            )}

            <div className="players-list">
              {allPlayersB.map((player) => {
                const isSelected = selectedXIIdsB.includes(player.id);
                return (
                  <div
                    key={player.id}
                    className={`player-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => togglePlayerB(player.id)}
                  >
                    <div className="player-info">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                      />
                      <span className="player-name">{player.name} {player.isManual && '(Manual)'}</span>
                    </div>
                    <span className="player-role">
                      {player.specifications?.join(', ') || (player.isManual ? 'Manual Addition' : 'Player')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Add Player Manually */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed #cbd5e1' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
                ➕ Add Player Manually to {selectedTeamB.name}
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter player name..."
                  value={inputManualNameB}
                  onChange={(e) => setInputManualNameB(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddManualPlayerB())}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleAddManualPlayerB}
                  style={{ whiteSpace: 'nowrap', padding: '0 1.25rem' }}
                >
                  Add Player
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submit Section */}
        <div className="submit-container">
          <button type="submit" className="btn-submit" disabled={!isFormValid || submitting}>
            {submitting ? 'Creating Match...' : '🚀 Start Match & Open Console'}
          </button>

          {!isFormValid && (
            <div className="submit-warning">
              {!isTeamAXIValid && `• ${selectedTeamA?.name} requires exactly ${targetXI} players (${selectedXIIdsA.length} selected). `}
              {!isTeamBXIValid && `• ${selectedTeamB?.name} requires exactly ${targetXI} players (${selectedXIIdsB.length} selected).`}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
