import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function runPartA() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const auctionState = await db.collection('auctionstates').findOne({});
  const teams = auctionState?.teams || [];
  const matches = auctionState?.tournamentMatches || [];
  const embeddedPlayers = auctionState?.players || [];
  const collPlayers = await db.collection('players').find({}).toArray();

  console.log('=== PART A - READ-ONLY CHECKS ===\n');

  // Check 1: Resolve team1Name and team2Name for all 40 fixtures
  const teamMap = new Map();
  teams.forEach((t) => {
    if (t.name) {
      teamMap.set(t.name.trim().toLowerCase(), t);
    }
  });

  let resolvedCount = 0;
  const unresolvedNames = [];

  matches.forEach((m) => {
    const t1Name = m.team1Name ? m.team1Name.trim() : '';
    const t2Name = m.team2Name ? m.team2Name.trim() : '';

    if (t1Name && teamMap.has(t1Name.toLowerCase())) {
      resolvedCount++;
    } else {
      unresolvedNames.push(m.team1Name);
    }

    if (t2Name && teamMap.has(t2Name.toLowerCase())) {
      resolvedCount++;
    } else {
      unresolvedNames.push(m.team2Name);
    }
  });

  console.log('1. FIXTURES TEAM NAME RESOLUTION');
  console.log(`Total fixtures: ${matches.length}`);
  console.log(`Total team slots to resolve: ${matches.length * 2}`);
  console.log(`Successfully resolved team names count: ${resolvedCount} / ${matches.length * 2}`);
  console.log(`Unresolved team names count: ${unresolvedNames.length}`);
  console.log('Unresolved team names list:', JSON.stringify(unresolvedNames, null, 2));

  // Check 2: Distinct values of court, dateStr, and group across all fixtures
  const courts = new Set();
  const dateStrs = new Set();
  const groups = new Set();

  matches.forEach((m) => {
    if (m.court !== undefined) courts.add(m.court);
    if (m.dateStr !== undefined) dateStrs.add(m.dateStr);
    if (m.group !== undefined) groups.add(m.group);
  });

  console.log('\n2. DISTINCT FIXTURE VALUES');
  console.log('Courts:', Array.from(courts).sort());
  console.log('Date Strings:', Array.from(dateStrs).sort());
  console.log('Groups:', Array.from(groups).sort());

  // Check 3: Count players per team in auctionStateDoc.players where teamId === team.id
  console.log('\n3. TEAM PLAYER COUNTS (auctionStateDoc.players)');
  console.log('----------------------------------------------------------------------');
  console.log('| Team Name                     | Team ID  | Player Count             |');
  console.log('----------------------------------------------------------------------');
  teams.forEach((t) => {
    const count = embeddedPlayers.filter((p) => String(p.teamId) === String(t.id)).length;
    const namePad = String(t.name).padEnd(29, ' ');
    const idPad = String(t.id).padEnd(8, ' ');
    const countPad = String(count).padStart(24, ' ');
    console.log(`| ${namePad} | ${idPad} | ${countPad} |`);
  });
  console.log('----------------------------------------------------------------------');

  // Check 4: Compare IDs of players collection vs auctionStateDoc.players
  const collIds = new Set(collPlayers.map((p) => String(p.id)));
  const embeddedIds = new Set(embeddedPlayers.map((p) => String(p.id)));

  let isIdentical = collIds.size === embeddedIds.size;
  if (isIdentical) {
    for (const id of collIds) {
      if (!embeddedIds.has(id)) {
        isIdentical = false;
        break;
      }
    }
  }

  console.log('\n4. PLAYERS COLLECTION VS AUCTIONSTATE PLAYERS ID COMPARISON');
  console.log(`Players collection count: ${collPlayers.length} (Distinct IDs: ${collIds.size})`);
  console.log(`auctionStateDoc.players count: ${embeddedPlayers.length} (Distinct IDs: ${embeddedIds.size})`);
  console.log(`IDs Are Identical: ${isIdentical ? 'IDENTICAL' : 'NOT IDENTICAL'}`);

  await mongoose.disconnect();
  process.exit(0);
}

runPartA().catch((err) => {
  console.error(err);
  process.exit(1);
});
