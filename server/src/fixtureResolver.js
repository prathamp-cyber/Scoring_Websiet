import { teamAliases } from '../config/teamAliases.js';

export function normalizeTeamName(name) {
  if (!name) return '';
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function resolveFixtureTeamId(teamName, teams) {
  if (!teamName) return null;
  const norm = normalizeTeamName(teamName);

  // 1. Check normalized name match in auctionStateDoc.teams
  const matchedTeam = teams.find((t) => t.name && normalizeTeamName(t.name) === norm);
  if (matchedTeam) {
    return String(matchedTeam.id);
  }

  // 2. Check explicit alias map in config
  if (teamAliases[norm]) {
    return teamAliases[norm];
  }

  // 3. Unresolved
  return null;
}

export function resolveAllFixtures(matches, teams) {
  let resolvedCount = 0;
  const unresolvedNames = [];

  const fixtures = matches.map((m) => {
    const teamAId = resolveFixtureTeamId(m.team1Name, teams);
    const teamBId = resolveFixtureTeamId(m.team2Name, teams);

    if (teamAId) resolvedCount++;
    else if (m.team1Name) unresolvedNames.push(m.team1Name);

    if (teamBId) resolvedCount++;
    else if (m.team2Name) unresolvedNames.push(m.team2Name);

    return {
      ...m,
      teamAId,
      teamBId
    };
  });

  return { fixtures, resolvedCount, totalSlots: matches.length * 2, unresolvedNames };
}
