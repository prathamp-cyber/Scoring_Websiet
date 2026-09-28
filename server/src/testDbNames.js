import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const baseUri = process.env.MONGO_URI || '';
const dbNames = ['test', 'playerAuction', 'auction', 'cricket', 'admin'];

async function testAll() {
  for (const dbName of dbNames) {
    const testUri = baseUri.replace('/?', `/${dbName}?`);
    console.log(`Testing DB: "${dbName}"...`);
    try {
      await mongoose.connect(testUri);
      console.log(`✅ SUCCESS WITH DB "${dbName}"!`);
      
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      console.log('Collections:', collections.map(c => c.name));

      await mongoose.disconnect();
      return;
    } catch (err) {
      console.log(`❌ Failed DB "${dbName}": ${err.message}`);
    }
  }
}

testAll();
