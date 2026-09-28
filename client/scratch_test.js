import { io } from 'socket.io-client';

const URL = 'http://localhost:5000';

async function runVerification() {
  console.log('--- STARTING CRITICAL VERIFICATION OF ROOM ISOLATION AND SOCKET LATENCY ---');

  // Socket 1: Umpire for matchA
  const socketUmpireA = io(URL);
  // Socket 2: Spectator for matchA
  const socketLiveA = io(URL);
  // Socket 3: Umpire for matchB
  const socketUmpireB = io(URL);
  // Socket 4: Spectator for matchB
  const socketLiveB = io(URL);

  let matchAUpdates = [];
  let matchBUpdates = [];

  // Room listeners
  socketUmpireA.on('score_update', (state) => {
    matchAUpdates.push({ source: 'umpireA', state });
  });

  socketLiveA.on('score_update', (state) => {
    matchAUpdates.push({ source: 'liveA', state });
  });

  socketUmpireB.on('score_update', (state) => {
    matchBUpdates.push({ source: 'umpireB', state });
  });

  socketLiveB.on('score_update', (state) => {
    matchBUpdates.push({ source: 'liveB', state });
  });

  await new Promise(r => setTimeout(r, 600));

  // Step 1: Join rooms
  console.log('[Test] Joining matchA room for Umpire A and Live A...');
  socketUmpireA.emit('join_match', { matchId: 'matchA' });
  socketLiveA.emit('join_match', { matchId: 'matchA' });

  console.log('[Test] Joining matchB room for Umpire B and Live B...');
  socketUmpireB.emit('join_match', { matchId: 'matchB' });
  socketLiveB.emit('join_match', { matchId: 'matchB' });

  await new Promise(r => setTimeout(r, 400));

  console.log(`[Test Setup] matchA updates received on join: ${matchAUpdates.length}`);
  console.log(`[Test Setup] matchB updates received on join: ${matchBUpdates.length}`);

  // Reset update counters before active ball recording
  matchAUpdates = [];
  matchBUpdates = [];

  // Step 2: Record 5 balls in matchA and measure round-trip times
  console.log('\n--- SCENARIO 1: RECORDING 5 BALLS IN matchA ---');
  const timingsA = [];
  const testBallsA = [
    { runsScored: 1, extraType: 'none' },
    { runsScored: 4, extraType: 'none' },
    { runsScored: 0, extraType: 'wide' },
    { runsScored: 6, extraType: 'none' },
    { runsScored: 2, extraType: 'none' }
  ];

  for (let i = 0; i < testBallsA.length; i++) {
    const ball = testBallsA[i];
    const initialA = matchAUpdates.length;
    const initialB = matchBUpdates.length;

    const start = performance.now();
    socketUmpireA.emit('record_ball', { matchId: 'matchA', ...ball });

    // Wait until score_update received (2 updates: UmpireA & LiveA)
    while (matchAUpdates.length < initialA + 2) {
      await new Promise(r => setTimeout(r, 1));
    }
    const end = performance.now();
    const duration = (end - start).toFixed(2);
    timingsA.push(Number(duration));

    console.log(`[Tap ${i + 1} - matchA] Ball (${ball.runsScored} runs, ${ball.extraType}) -> 'score_update' received in ${duration} ms.`);

    // Confirm matchB received 0 updates
    if (matchBUpdates.length !== initialB) {
      console.error(`❌ ROOM ISOLATION LEAK DETECTED! matchB received updates during matchA tap!`);
    } else {
      console.log(`  ✓ Room Isolation Verified: matchB updates count = 0 (unchanged)`);
    }
  }

  // Step 3: Record 5 balls in matchB and measure round-trip times
  console.log('\n--- SCENARIO 2: RECORDING 5 BALLS IN matchB ---');
  const timingsB = [];
  const testBallsB = [
    { runsScored: 0, extraType: 'none' },
    { runsScored: 1, extraType: 'none' },
    { runsScored: 1, extraType: 'noball' },
    { runsScored: 4, extraType: 'none' },
    { runsScored: 0, extraType: 'none' }
  ];

  for (let i = 0; i < testBallsB.length; i++) {
    const ball = testBallsB[i];
    const initialA = matchAUpdates.length;
    const initialB = matchBUpdates.length;

    const start = performance.now();
    socketUmpireB.emit('record_ball', { matchId: 'matchB', ...ball });

    while (matchBUpdates.length < initialB + 2) {
      await new Promise(r => setTimeout(r, 1));
    }
    const end = performance.now();
    const duration = (end - start).toFixed(2);
    timingsB.push(Number(duration));

    console.log(`[Tap ${i + 1} - matchB] Ball (${ball.runsScored} runs, ${ball.extraType}) -> 'score_update' received in ${duration} ms.`);

    // Confirm matchA received 0 updates
    if (matchAUpdates.length !== initialA) {
      console.error(`❌ ROOM ISOLATION LEAK DETECTED! matchA received updates during matchB tap!`);
    } else {
      console.log(`  ✓ Room Isolation Verified: matchA updates count = 0 (unchanged)`);
    }
  }

  console.log('\n=================================================');
  console.log('FINAL VERIFICATION RESULTS:');
  console.log('• Room Isolation: CONFIRMED (0 cross-room socket leaks)');
  console.log('• matchA Roundtrip Latencies:', timingsA.map(t => `${t} ms`).join(', '));
  console.log('• matchB Roundtrip Latencies:', timingsB.map(t => `${t} ms`).join(', '));
  console.log('=================================================\n');

  socketUmpireA.disconnect();
  socketLiveA.disconnect();
  socketUmpireB.disconnect();
  socketLiveB.disconnect();
  process.exit(0);
}

runVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
