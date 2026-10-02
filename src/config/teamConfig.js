/**
 * Team Name Normalization & Explicit Alias Resolution Map
 * 
 * Maps any variant fixture team names to exact auction team names.
 */

export function normalizeTeamName(name) {
  if (!name) return '';
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export const TEAM_ALIASES = {
  "dandellions": "dandelions",
  "super strikers": "super striker"
};
