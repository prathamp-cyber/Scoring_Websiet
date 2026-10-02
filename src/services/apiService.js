const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function fetchTeams() {
  try {
    const res = await fetch(`${API_BASE}/api/teams`);
    if (!res.ok) throw new Error('Failed to fetch teams');
    return res.json();
  } catch (err) {
    console.warn('fetchTeams failed:', err.message);
    return [];
  }
}

export async function fetchTeamPlayers(teamId) {
  try {
    if (!teamId) return [];
    const res = await fetch(`${API_BASE}/api/teams/${teamId}/players`);
    if (!res.ok) throw new Error('Failed to fetch team players');
    return res.json();
  } catch (err) {
    console.warn('fetchTeamPlayers failed:', err.message);
    return [];
  }
}

export async function fetchMatches(view = 'live') {
  const res = await fetch(`${API_BASE}/api/matches?view=${view}`);
  if (!res.ok) throw new Error('Failed to fetch matches');
  return res.json();
}

export async function fetchMatchState(matchId) {
  const res = await fetch(`${API_BASE}/api/matches/${matchId}/state`);
  if (!res.ok) throw new Error('Failed to fetch match state');
  return res.json();
}

export async function fetchFixtures() {
  try {
    const res = await fetch(`${API_BASE}/api/fixtures`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Failed to fetch fixtures`);
    }
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Response is not JSON format');
    }
    const text = await res.text();
    if (!text || !text.trim()) {
      return [];
    }
    return JSON.parse(text);
  } catch (err) {
    console.warn('fetchFixtures failed:', err.message);
    throw err;
  }
}

export async function createMatch(payload) {
  const res = await fetch(`${API_BASE}/api/matches/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create match');
  return data;
}

export async function authenticateScorer(matchId, pin) {
  const res = await fetch(`${API_BASE}/api/matches/${matchId}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Authentication failed');
  return data;
}

export async function recordBall(matchId, ballData, token) {
  const res = await fetch(`${API_BASE}/api/matches/${matchId}/ball`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(ballData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to record ball');
  return data;
}

export async function undoBall(matchId, token) {
  const res = await fetch(`${API_BASE}/api/matches/${matchId}/undo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to undo ball');
  return data;
}

export async function startSecondInnings(matchId, innData, token) {
  const res = await fetch(`${API_BASE}/api/matches/${matchId}/start-second-innings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(innData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to start 2nd innings');
  return data;
}

