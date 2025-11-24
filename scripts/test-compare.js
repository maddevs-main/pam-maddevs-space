// Test bcrypt.compare against stored user passwordHash
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
const bcrypt = require('bcrypt');
(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) return;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const user = await db.collection('users').findOne({ email: 'admin@pam.test' });
    if (!user) return;
    const ok = await bcrypt.compare('adminpass', user.passwordHash || '');
  } catch (e) { }
  finally { await client.close(); }
})();
