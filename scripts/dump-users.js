const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// load .env.local if present
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  env.split('\n').forEach(line => {
    const kv = line.split('=');
    if (kv[0]) process.env[kv[0].trim()] = kv.slice(1).join('=').trim();
  });
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  process.exit(1);
}

async function run() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const users = await db.collection('users').find({}, { projection: { passwordHash: 0 } }).toArray();
    users.forEach(u => {});
  } catch (err) {
    process.exit(2);
  } finally {
    await client.close();
  }
}

run();
