import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function explore() {
  console.log(`[MongoDB Exploration] Connecting to MONGO_URI...`);
  console.log(`[MongoDB URI]: ${MONGO_URI ? MONGO_URI.replace(/:([^@]+)@/, ':****@') : 'UNDEFINED'}`);

  try {
    await mongoose.connect(MONGO_URI);
    console.log('[MongoDB] Connected successfully');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    console.log('\n--- COLLECTION LIST ---');
    console.log(collectionNames);

    for (const name of collectionNames) {
      const count = await db.collection(name).countDocuments();
      const sample = await db.collection(name).findOne();

      console.log(`\n========================================`);
      console.log(`Collection: "${name}"`);
      console.log(`Document Count: ${count}`);
      console.log(`Sample Document:`);
      console.log(JSON.stringify(sample, null, 2));
      console.log(`========================================`);
    }

    await mongoose.disconnect();
    console.log('\n[MongoDB] Disconnected successfully');
    process.exit(0);
  } catch (err) {
    console.error('[MongoDB Connection / Exploration Error]:');
    console.error(err.message);
    process.exit(1);
  }
}

explore();
