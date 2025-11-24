const fs = require('fs');
const path = require('path');

// Load .env.local if present
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      if (!process.env[key]) process.env[key] = value;
    }
  });
}

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  process.exit(1);
}

async function run() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const emails = ['admin@pam.test','staff@pam.test','consumer@pam.test'];
    const users = await db.collection('users').find({ email: { $in: emails } }).project({ passwordHash: 0 }).toArray();
    if (!users || users.length === 0) {
    } else {
    }
  } catch (err) {
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
