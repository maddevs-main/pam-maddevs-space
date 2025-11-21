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
    console.error('MONGODB_URI not set in .env.local');
    process.exit(1);
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const users = await db.collection('users').find({ email: { $in: ['admin@pam.test','staff@pam.test','consumer@pam.test'] } }).toArray();
    if (!users || users.length === 0) {
      console.log('No demo users found in', uri);
      process.exit(0);
    }
    users.forEach(u => {
      console.log('---');
      console.log('id:', u._id && u._id.toString());
      console.log('email:', u.email);
      console.log('name:', u.name);
      console.log('role:', u.role);
      console.log('has passwordHash:', !!u.passwordHash);
    });
  } catch (e) {
    console.error('Error querying DB:', e);
  } finally {
    await client.close();
  }
})();
