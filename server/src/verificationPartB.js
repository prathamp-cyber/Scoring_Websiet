import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Match from '../models/Match.js';
import Innings from '../models/Innings.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function runVerification() {
  console.log('=== VERIFICATION STEP 1: BEFORE MATCH CREATION ===');
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const docBefore = await db.collection('auctionstates').findOne({});
  console.log(`auctionstates doc BEFORE match creation:`);
  console.log(`  updatedAt: ${docBefore.updatedAt}`);
  console.log(`  __v:       ${docBefore.__v}`);

  // Create match via API POST /api/matches
  console.log('\n=== VERIFICATION STEP 2: CREATING MATCH VIA POST /api/matches ===');
  const payload = {
    fixtureId: 'tm-1',
    teamA: {
      id: '183883',
      name: 'SHIV WOOD WARRIORS',
      shortName: 'SWW',
      logo: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e',
      color: '#3B82F6'
    },
    teamB: {
      id: '183884',
      name: 'DANDELIONS',
      shortName: 'DAN',
      logo: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90',
      color: '#8B5CF6'
    },
    oversLimit: 15,
    playersPerSide: 6,
    tossWinnerId: '183883',
    tossDecision: 'bat',
    playingXI: {
      teamA: [
        { id: 'manual-a1', name: 'Player A1 (Captain)', isManual: true },
        { id: 'manual-a2', name: 'Player A2', isManual: true },
        { id: 'manual-a3', name: 'Player A3', isManual: true },
        { id: 'manual-a4', name: 'Player A4', isManual: true },
        { id: 'manual-a5', name: 'Player A5', isManual: true },
        { id: 'manual-a6', name: 'Player A6', isManual: true }
      ],
      teamB: [
        { id: 'manual-b1', name: 'Player B1', isManual: true },
        { id: 'manual-b2', name: 'Player B2', isManual: true },
        { id: 'manual-b3', name: 'Player B3', isManual: true },
        { id: 'manual-b4', name: 'Player B4', isManual: true },
        { id: 'manual-b5', name: 'Player B5', isManual: true },
        { id: 'manual-b6', name: 'Player B6', isManual: true }
      ]
    }
  };

  const createRes = await fetch('http://localhost:5000/api/matches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const createData = await createRes.json();
  console.log('Match Creation Response:', JSON.stringify(createData, null, 2));

  const matchId = createData.matchId;

  // Check auctionstates doc again AFTER match creation
  console.log('\n=== VERIFICATION STEP 3: AFTER MATCH CREATION ===');
  const docAfter = await db.collection('auctionstates').findOne({});
  console.log(`auctionstates doc AFTER match creation:`);
  console.log(`  updatedAt: ${docAfter.updatedAt}`);
  console.log(`  __v:       ${docAfter.__v}`);

  const isUnchanged = docBefore.updatedAt === docAfter.updatedAt && docBefore.__v === docAfter.__v;
  console.log(`\nIMMUTABILITY VERIFICATION RESULT: ${isUnchanged ? '100% SUCCESSFUL (AUCTION DATA UNTOUCHED)' : 'FAILED'}`);

  // Step 4: List Collections & Created Match Document
  console.log('\n=== VERIFICATION STEP 4: MONGODB COLLECTIONS LIST & CREATED MATCH DOCUMENT ===');
  const collections = await db.listCollections().toArray();
  console.log('Current Collections in Database:');
  console.log(collections.map((c) => c.name));

  const storedMatch = await db.collection('matches').findOne({ _id: new mongoose.Types.ObjectId(matchId) });
  console.log('\nCreated Match Document in "matches" collection:');
  console.log(JSON.stringify(storedMatch, null, 2));

  await mongoose.disconnect();
  process.exit(0);
}

runVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});
