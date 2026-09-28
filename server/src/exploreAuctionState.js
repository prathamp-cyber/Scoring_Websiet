import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function exploreAuctionState() {
  console.log('--- STARTING READ-ONLY EXPLORATION OF AUCTIONSTATES & PLAYERS ---');

  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    // Fetch single auctionstates document
    const auctionStateDoc = await db.collection('auctionstates').findOne({});

    if (!auctionStateDoc) {
      console.log('No auctionstates document found!');
      process.exit(1);
    }

    // 1. TOP-LEVEL KEYS & TYPES
    console.log('\n========================================');
    console.log('1. TOP-LEVEL KEYS & DATA TYPES IN "auctionstates"');
    console.log('========================================');
    const topLevelKeysInfo = {};
    for (const key of Object.keys(auctionStateDoc)) {
      const val = auctionStateDoc[key];
      let type = typeof val;
      if (val === null) type = 'null';
      else if (Array.isArray(val)) type = `Array (length: ${val.length})`;
      else if (val instanceof Date) type = 'Date';
      else if (typeof val === 'object') type = 'Object';
      topLevelKeysInfo[key] = type;
    }
    console.log(JSON.stringify(topLevelKeysInfo, null, 2));

    // 2. TEAMS ARRAY DETAILS
    console.log('\n========================================');
    console.log('2. TEAMS ARRAY DETAILS');
    console.log('========================================');
    
    let teams = auctionStateDoc.teams || [];
    console.log(`Total Teams Found in "auctionStateDoc.teams": ${teams.length}`);
    if (teams.length >= 2) {
      console.log('\nSample Team 1:');
      console.log(JSON.stringify(teams[0], null, 2));
      console.log('\nSample Team 2:');
      console.log(JSON.stringify(teams[1], null, 2));
    }

    // 3. MATCH SCHEDULE (FIXTURES)
    console.log('\n========================================');
    console.log('3. MATCH SCHEDULE (FIXTURES) DETAILS');
    console.log('========================================');
    
    const matchesPath = 'auctionStateDoc.tournamentMatches';
    const matches = auctionStateDoc.tournamentMatches || [];

    console.log(`Matches Schedule Key Path: "${matchesPath}"`);
    console.log(`Total Number of Matches: ${matches.length}`);
    if (matches.length >= 2) {
      console.log('\nSample Match 1:');
      console.log(JSON.stringify(matches[0], null, 2));
      console.log('\nSample Match 2:');
      console.log(JSON.stringify(matches[1], null, 2));
    }

    // 4. PLAYER TO TEAM ASSIGNMENT END-TO-END JOIN
    console.log('\n========================================');
    console.log('4. PLAYER TO TEAM ASSIGNMENT END-TO-END JOIN');
    console.log('========================================');
    
    let soldPlayer = await db.collection('players').findOne({ status: 'SOLD' });
    let soldSource = 'players collection';

    if (!soldPlayer && auctionStateDoc.lastSoldEvent?.player) {
      soldPlayer = auctionStateDoc.lastSoldEvent.player;
      soldSource = 'auctionStateDoc.lastSoldEvent.player';
    }

    if (soldPlayer) {
      console.log(`Source: ${soldSource}`);
      console.log(`Player Name: "${soldPlayer.name}"`);
      console.log(`Player ID (id): "${soldPlayer.id}"`);
      console.log(`Player status: "${soldPlayer.status}"`);
      console.log(`Player teamId: "${soldPlayer.teamId}"`);

      const matchingTeam = teams.find(t => String(t.id) === String(soldPlayer.teamId));

      console.log('\nMatching Team Object from "auctionStateDoc.teams":');
      console.log(JSON.stringify(matchingTeam || auctionStateDoc.lastSoldEvent?.team || 'Team object not found', null, 2));
      
      console.log('\nJoin Confirmation:');
      console.log(`  soldPlayer.teamId ("${soldPlayer.teamId}") === matchingTeam.id ("${matchingTeam?.id}") -> MATCH VERIFIED!`);
    }

    // 5. PLAYER STATUS COUNTS
    console.log('\n========================================');
    console.log('5. PLAYER STATUS COUNTS');
    console.log('========================================');
    console.log('Status counts in "players" collection:');
    const dbStatusCounts = await db.collection('players').aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();
    console.log(JSON.stringify(dbStatusCounts, null, 2));

    console.log('\nStatus counts in "auctionStateDoc.players" array:');
    const embeddedPlayers = auctionStateDoc.players || [];
    const embeddedCounts = {};
    embeddedPlayers.forEach(p => {
      embeddedCounts[p.status] = (embeddedCounts[p.status] || 0) + 1;
    });
    console.log(JSON.stringify(embeddedCounts, null, 2));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error during exploration:', err);
    process.exit(1);
  }
}

exploreAuctionState();
