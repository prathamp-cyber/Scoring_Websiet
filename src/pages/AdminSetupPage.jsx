import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Trophy, Users, Lock, Play, Plus, Trash2, ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { fetchFixtures, createMatch } from '../services/apiService';

export function AdminSetupPage({ onNavigateToScoring, onBackToHome }) {
  const [fixtures, setFixtures] = useState([]);
  const [selectedFixtureId, setSelectedFixtureId] = useState('custom');

  // Form Fields
  const [tournamentName, setTournamentName] = useState('MAPL 2026');
  const [groupLabel, setGroupLabel] = useState('Quarter Final 1');
  const [ground, setGround] = useState('Sun Valley Ground, Gandhidham');
  const [city, setCity] = useState('Gandhidham');

  const [teamAName, setTeamAName] = useState('SIPL WARRIORS');
  const [teamBName, setTeamBName] = useState('KANDLA TIGERS');

  const [totalOvers, setTotalOvers] = useState(20);
  const [playersPerSide, setPlayersPerSide] = useState(11);

  const [squadA, setSquadA] = useState([
    'Rajesh Patel', 'Devendra Jadeja', 'Amit Sharma', 'Pritesh Shah',
    'Hardik Vora', 'Bhavin Solanki', 'Ketan Joshi', 'Sanjay Mehta',
    'Sunil Gadhvi', 'Nilesh Ahir', 'Jayesh Patel'
  ]);

  const [squadB, setSquadB] = useState([
    'Vikram Rathod', 'Harish Parmar', 'Girish Kothari', 'Ramesh Solanki',
    'Chetan Thakar', 'Mahesh Dave', 'Haresh Bhanushali', 'Mayur Shah',
    'Pratik Chawda', 'Dharmendra K', 'Manish Maheshwari'
  ]);

  const [newPlayerA, setNewPlayerA] = useState('');
  const [newPlayerB, setNewPlayerB] = useState('');

  const [tossWinner, setTossWinner] = useState('');
  const [tossChoice, setTossChoice] = useState('bat');

  const [pin, setPin] = useState('1234');
  const [confirmPin, setConfirmPin] = useState('1234');

  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const [errors, setErrors] = useState({});
  const [fixtureError, setFixtureError] = useState(null);

  useEffect(() => {
    fetchFixtures()
      .then(data => {
        if (Array.isArray(data)) {
          setFixtures(data);
          setFixtureError(null);
        } else {
          setFixtures([]);
          setFixtureError('Could not load fixtures - using manual entry');
        }
      })
      .catch(() => {
        setFixtures([]);
        setFixtureError('Could not load fixtures - using manual entry');
      });
  }, []);

  useEffect(() => {
    if (tossWinner !== teamAName && tossWinner !== teamBName) {
      setTossWinner(teamAName || '');
    }
  }, [teamAName, teamBName, tossWinner]);

  const handleFixtureChange = (e) => {
    const fixtureId = e.target.value;
    setSelectedFixtureId(fixtureId);

    if (fixtureId === 'custom') return;

    const fix = fixtures.find(f => f.id === fixtureId);
    if (fix) {
      setTournamentName(fix.tournamentName || 'MAPL 2026');
      setGroupLabel(fix.groupLabel || 'Match');
      setTeamAName(fix.teamA);
      setTeamBName(fix.teamB);
      if (fix.squadA) setSquadA(fix.squadA);
      if (fix.squadB) setSquadB(fix.squadB);
      setTossWinner(fix.teamA);
    }
  };

  const handleAddPlayerA = (e) => {
    if (e) e.preventDefault();
    if (!newPlayerA.trim()) return;
    setSquadA([...squadA, newPlayerA.trim()]);
    setNewPlayerA('');
  };

  const handleRemovePlayerA = (idx) => {
    setSquadA(squadA.filter((_, i) => i !== idx));
  };

  const handleAddPlayerB = (e) => {
    if (e) e.preventDefault();
    if (!newPlayerB.trim()) return;
    setSquadB([...squadB, newPlayerB.trim()]);
    setNewPlayerB('');
  };

  const handleRemovePlayerB = (idx) => {
    setSquadB(squadB.filter((_, i) => i !== idx));
  };

  const validate = () => {
    const errs = {};

    if (!teamAName.trim()) errs.teamAName = 'Team A name is required';
    if (!teamBName.trim()) errs.teamBName = 'Team B name is required';
    if (teamAName.trim().toLowerCase() === teamBName.trim().toLowerCase()) {
      errs.teamBName = 'Teams must be different';
    }

    if (squadA.length !== Number(playersPerSide)) {
      errs.squadA = `Team A XI must have exactly ${playersPerSide} players (currently ${squadA.length})`;
    }
    if (squadB.length !== Number(playersPerSide)) {
      errs.squadB = `Team B XI must have exactly ${playersPerSide} players (currently ${squadB.length})`;
    }

    if (!pin || pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      errs.pin = 'PIN must be 4 to 6 numeric digits';
    } else if (pin !== confirmPin) {
      errs.confirmPin = 'PINs do not match';
    }

    if (!tossWinner) {
      errs.tossWinner = 'Please select the toss winner';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const isFormValid = 
    teamAName.trim() && 
    teamBName.trim() && 
    squadA.length === Number(playersPerSide) && 
    squadB.length === Number(playersPerSide) && 
    pin.length >= 4 && 
    pin === confirmPin;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const matchId = `match-${Date.now().toString(36)}`;
      const payload = {
        matchId,
        tournamentName,
        groupLabel,
        ground,
        city,
        details: `${totalOvers} Ov, ${playersPerSide}-a-side`,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        totalOvers: Number(totalOvers),
        playersPerSide: Number(playersPerSide),
        teamA: {
          name: teamAName.trim(),
          shortName: teamAName.trim().slice(0, 3).toUpperCase(),
          logoColor: '#dc2626',
          logoText: teamAName.trim().charAt(0),
          squad: squadA
        },
        teamB: {
          name: teamBName.trim(),
          shortName: teamBName.trim().slice(0, 3).toUpperCase(),
          logoColor: '#059669',
          logoText: teamBName.trim().charAt(0),
          squad: squadB
        },
        tossWinner,
        tossChoice,
        pin
      };

      const res = await createMatch(payload);
      localStorage.setItem(`scorer_token_${res.matchId}`, res.token);

      if (onNavigateToScoring) {
        onNavigateToScoring(res.matchId);
      }
    } catch (err) {
      setErrors({ form: err.message || 'Failed to start match' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-container umpire-setup-page">
      <Navbar />

      <main className="umpire-setup-wrapper">
        {/* Header Navigation & Page Title */}
        <div className="umpire-setup-header">
          <button className="setup-back-btn" onClick={onBackToHome}>
            <ArrowLeft size={16} /> Back to Matches
          </button>
          
          <div className="setup-header-title-box">
            <div className="setup-header-icon-circle">
              <Trophy size={22} color="#ffffff" />
            </div>
            <div>
              <h1 className="setup-page-heading">Start New Match</h1>
              <p className="setup-page-subtext">Set up match details, playing XI rosters, toss decision & scorer PIN</p>
            </div>
          </div>
        </div>

        {/* Centered White Card Container */}
        <div className="umpire-card-container">
          {errors.form && (
            <div className="setup-error-banner">
              ⚠️ {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="setup-form-body">
            {/* Section 1: Fixture & Match Info */}
            <section className="setup-card-section">
              <div className="section-title-bar">
                <div className="section-icon-badge red">
                  <Trophy size={16} />
                </div>
                <div>
                  <h2 className="section-heading">1. Fixture & Match Info</h2>
                  <p className="section-subtext">Select a pre-configured fixture or enter custom match details</p>
                </div>
              </div>

              <div className="form-fields-stack">
                <div className="form-group full-width">
                  <label className="form-label">Pick Fixture from Schedule</label>
                  <select 
                    className="form-select" 
                    value={selectedFixtureId} 
                    onChange={handleFixtureChange}
                  >
                    <option value="custom">-- Manual Team Entry (New Custom Match) --</option>
                    {fixtures.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.tournamentName} • {f.groupLabel}: {f.teamA} vs {f.teamB}
                      </option>
                    ))}
                  </select>
                  {fixtureError && (
                    <div className="fixture-error-subtext" style={{ fontSize: '12px', color: '#d97706', marginTop: '6px' }}>
                      ⚠️ {fixtureError}
                    </div>
                  )}
                </div>

                <div className="form-grid-2col">
                  <div className="form-group">
                    <label className="form-label">Tournament Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={tournamentName} 
                      onChange={e => setTournamentName(e.target.value)} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Round / Group Label</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={groupLabel} 
                      onChange={e => setGroupLabel(e.target.value)} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ground Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={ground} 
                      onChange={e => setGround(e.target.value)} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={city} 
                      onChange={e => setCity(e.target.value)} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Overs Limit</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      min="1" 
                      max="50" 
                      value={totalOvers} 
                      onChange={e => setTotalOvers(e.target.value)} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Players Per Side</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      min="2" 
                      max="15" 
                      value={playersPerSide} 
                      onChange={e => setPlayersPerSide(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Teams & Playing XI Roster */}
            <section className="setup-card-section">
              <div className="section-title-bar">
                <div className="section-icon-badge green">
                  <Users size={16} />
                </div>
                <div>
                  <h2 className="section-heading">2. Teams & Playing XI Roster</h2>
                  <p className="section-subtext">Manage player rosters for both teams (Must match exact XI count)</p>
                </div>
              </div>

              <div className="teams-setup-grid">
                {/* Team A Roster Card */}
                <div className="team-roster-box">
                  <div className="team-box-header">
                    <input 
                      type="text" 
                      className="team-name-input" 
                      value={teamAName} 
                      onChange={e => setTeamAName(e.target.value)} 
                      placeholder="Team A Name"
                    />
                    <span className={`roster-count ${squadA.length === Number(playersPerSide) ? 'valid' : 'invalid'}`}>
                      {squadA.length}/{playersPerSide} XI
                    </span>
                  </div>
                  {errors.teamAName && <span className="field-error">{errors.teamAName}</span>}
                  {errors.squadA && <span className="field-error">{errors.squadA}</span>}

                  <div className="roster-list">
                    {squadA.map((p, idx) => (
                      <div key={idx} className="roster-item">
                        <span className="player-num">{idx + 1}.</span>
                        <span className="player-name">{p}</span>
                        <button 
                          type="button" 
                          className="remove-player-btn" 
                          onClick={() => handleRemovePlayerA(idx)}
                          title="Remove Player"
                          aria-label="Remove player"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="add-player-row">
                    <input 
                      type="text" 
                      className="add-player-input" 
                      placeholder="Add player by name..." 
                      value={newPlayerA} 
                      onChange={e => setNewPlayerA(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddPlayerA(e); }}
                    />
                    <button type="button" className="add-player-btn" onClick={handleAddPlayerA}>
                      <Plus size={15} /> Add Player
                    </button>
                  </div>
                </div>

                {/* Team B Roster Card */}
                <div className="team-roster-box">
                  <div className="team-box-header">
                    <input 
                      type="text" 
                      className="team-name-input" 
                      value={teamBName} 
                      onChange={e => setTeamBName(e.target.value)} 
                      placeholder="Team B Name"
                    />
                    <span className={`roster-count ${squadB.length === Number(playersPerSide) ? 'valid' : 'invalid'}`}>
                      {squadB.length}/{playersPerSide} XI
                    </span>
                  </div>
                  {errors.teamBName && <span className="field-error">{errors.teamBName}</span>}
                  {errors.squadB && <span className="field-error">{errors.squadB}</span>}

                  <div className="roster-list">
                    {squadB.map((p, idx) => (
                      <div key={idx} className="roster-item">
                        <span className="player-num">{idx + 1}.</span>
                        <span className="player-name">{p}</span>
                        <button 
                          type="button" 
                          className="remove-player-btn" 
                          onClick={() => handleRemovePlayerB(idx)}
                          title="Remove Player"
                          aria-label="Remove player"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="add-player-row">
                    <input 
                      type="text" 
                      className="add-player-input" 
                      placeholder="Add player by name..." 
                      value={newPlayerB} 
                      onChange={e => setNewPlayerB(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddPlayerB(e); }}
                    />
                    <button type="button" className="add-player-btn" onClick={handleAddPlayerB}>
                      <Plus size={15} /> Add Player
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Toss & Scorer Security PIN */}
            <section className="setup-card-section">
              <div className="section-title-bar">
                <div className="section-icon-badge amber">
                  <Lock size={16} />
                </div>
                <div>
                  <h2 className="section-heading">3. Toss & Scorer PIN</h2>
                  <p className="section-subtext">Record toss outcome and set security PIN for umpire scoring panel</p>
                </div>
              </div>

              <div className="form-fields-stack">
                <div className="form-grid-2col">
                  <div className="form-group">
                    <label className="form-label">Toss Winner</label>
                    <select 
                      className="form-select" 
                      value={tossWinner} 
                      onChange={e => setTossWinner(e.target.value)}
                    >
                      <option value={teamAName}>{teamAName}</option>
                      <option value={teamBName}>{teamBName}</option>
                    </select>
                    {errors.tossWinner && <span className="field-error">{errors.tossWinner}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Toss Decision</label>
                    <div className="segmented-pill-toggle">
                      <button 
                        type="button" 
                        className={`segmented-btn ${tossChoice === 'bat' ? 'is-active' : ''}`}
                        onClick={() => setTossChoice('bat')}
                      >
                        Elect to BAT
                      </button>
                      <button 
                        type="button" 
                        className={`segmented-btn ${tossChoice === 'bowl' ? 'is-active' : ''}`}
                        onClick={() => setTossChoice('bowl')}
                      >
                        Elect to BOWL
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Set Scorer PIN (4-6 Digits)</label>
                    <div className="input-with-action">
                      <input 
                        type={showPin ? 'text' : 'password'} 
                        className="form-input" 
                        maxLength={6}
                        placeholder="e.g. 1234" 
                        value={pin} 
                        onChange={e => setPin(e.target.value)} 
                      />
                      <button 
                        type="button" 
                        className="input-eye-btn" 
                        onClick={() => setShowPin(!showPin)}
                        aria-label="Toggle PIN visibility"
                      >
                        {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.pin && <span className="field-error">{errors.pin}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm Scorer PIN</label>
                    <div className="input-with-action">
                      <input 
                        type={showConfirmPin ? 'text' : 'password'} 
                        className="form-input" 
                        maxLength={6}
                        placeholder="Re-enter PIN" 
                        value={confirmPin} 
                        onChange={e => setConfirmPin(e.target.value)} 
                      />
                      <button 
                        type="button" 
                        className="input-eye-btn" 
                        onClick={() => setShowConfirmPin(!showConfirmPin)}
                        aria-label="Toggle confirm PIN visibility"
                      >
                        {showConfirmPin ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.confirmPin && <span className="field-error">{errors.confirmPin}</span>}
                  </div>
                </div>
              </div>
            </section>

            {/* Validation Warning Note */}
            {!isFormValid && (
              <div className="validation-warning-note">
                <ShieldCheck size={16} />
                <span>Please complete exact Playing XI rosters ({playersPerSide} players each) & matching PINs to start.</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="setup-submit-wrapper">
              <button 
                type="submit" 
                className="start-match-submit-btn" 
                disabled={submitting || !isFormValid}
              >
                <Play size={18} />
                {submitting ? 'Creating Match Engine...' : 'Start Match & Open Scoring Panel'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default AdminSetupPage;
