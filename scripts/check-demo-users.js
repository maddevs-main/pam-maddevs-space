// Simple check script to verify demo users exist in the configured MongoDB
const fs = require('fs');
const path = require('path');
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const p = line.indexOf('=');
    if (p > -1) {
      const key = line.slice(0, p).trim();
      const val = line.slice(p + 1).trim();
      if (key && !(key in process.env)) process.env[key] = val;
    }
  });
}

const { MongoClient } = require('mongodb');
(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    process.exit(1);
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const users = await db.collection('users').find({ email: { $in: ['admin@pam.test','staff@pam.test','consumer@pam.test'] } }).toArray();
    if (!users || users.length === 0) {
      process.exit(0);
    }
    users.forEach(u => {
    });
  } catch (e) {
  } finally {
    await client.close();
  }
})();
