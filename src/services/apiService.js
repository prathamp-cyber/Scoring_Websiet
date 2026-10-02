/**
 * API Service for Cricket Scoring Engine
 */

export async function fetchMatches(view = 'live') {
  const res = await fetch(`/api/matches?view=${view}`);
  if (!res.ok) throw new Error('Failed to fetch matches');
  return res.json();
}

export async function fetchMatchState(matchId) {
  const res = await fetch(`/api/matches/${matchId}/state`);
  if (!res.ok) throw new Error('Failed to fetch match state');
  return res.json();
}

export async function fetchFixtures() {
  const res = await fetch('/api/fixtures');
  if (!res.ok) throw new Error('Failed to fetch fixtures');
  return res.json();
}

export async function createMatch(payload) {
  const res = await fetch('/api/matches/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create match');
  return data;
}

export async function authenticateScorer(matchId, pin) {
  const res = await fetch(`/api/matches/${matchId}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Authentication failed');
  return data;
}

export async function recordBall(matchId, ballData, token) {
  const res = await fetch(`/api/matches/${matchId}/ball`, {
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
  const res = await fetch(`/api/matches/${matchId}/undo`, {
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
  const res = await fetch(`/api/matches/${matchId}/start-second-innings`, {
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
