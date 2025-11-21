// Check specific users exist and show basic fields
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
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maddevs';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const dbName = process.env.MONGODB_DB;
    const db = dbName ? client.db(dbName) : client.db();
    const emails = process.argv.slice(2);
    if (!emails.length) { console.error('Usage: node scripts/check-new-users.js email1 email2 ...'); process.exit(1); }
    for (const e of emails) {
      const u = await db.collection('users').findOne({ email: e });
      if (!u) console.log('MISSING:', e);
      else console.log('FOUND:', e, 'id:', u._id.toString(), 'role:', u.role, 'hasHash:', !!u.passwordHash);
    }
  } catch (e) { console.error('ERR', e); }
  finally { await client.close(); }
})();
