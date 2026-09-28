async function testApiEndpoints() {
  console.log('=== PART B - TESTING READ-ONLY ENDPOINTS ===\n');

  try {
    // 1. GET /api/teams
    console.log('--- 1. CALLING GET /api/teams ---');
    const teamsRes = await fetch('http://localhost:5000/api/teams');
    const teams = await teamsRes.json();
    console.log(`Total Teams Count: ${teams.length}`);
    console.log('First 2 Items:');
    console.log(JSON.stringify(teams.slice(0, 2), null, 2));

    // Pick first teamId for testing players endpoint
    const sampleTeamId = teams[0]?.id || '183878';

    // 2. GET /api/teams/:teamId/players
    console.log(`\n--- 2. CALLING GET /api/teams/${sampleTeamId}/players ---`);
    const playersRes = await fetch(`http://localhost:5000/api/teams/${sampleTeamId}/players`);
    const players = await playersRes.json();
    console.log(`Total Players Count for Team ${sampleTeamId}: ${players.length}`);
    console.log('First 2 Items (or all if < 2):');
    console.log(JSON.stringify(players.slice(0, 2), null, 2));

    // Also test a team with a sold player e.g. 183878
    if (sampleTeamId !== '183878') {
      const satyamRes = await fetch('http://localhost:5000/api/teams/183878/players');
      const satyamPlayers = await satyamRes.json();
      console.log(`\n--- CALLING GET /api/teams/183878/players (Satyam Spinners) ---`);
      console.log(`Total Players Count for Team 183878: ${satyamPlayers.length}`);
      console.log('Items:');
      console.log(JSON.stringify(satyamPlayers, null, 2));
    }

    // 3. GET /api/fixtures
    console.log('\n--- 3. CALLING GET /api/fixtures ---');
    const fixturesRes = await fetch('http://localhost:5000/api/fixtures');
    const fixtures = await fixturesRes.json();
    console.log(`Total Fixtures Count: ${fixtures.length}`);
    console.log('First 2 Items:');
    console.log(JSON.stringify(fixtures.slice(0, 2), null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error testing endpoints:', err);
    process.exit(1);
  }
}

testApiEndpoints();
