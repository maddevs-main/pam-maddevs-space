// Detect password hash formats for users collection
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
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const cursor = db.collection('users').find({}, { projection: { email:1, passwordHash:1, role:1 } }).limit(200);
    const counts = {};
    const rows = [];
    while (await cursor.hasNext()) {
      const u = await cursor.next();
      const ph = u.passwordHash || null;
      const info = { id: u._id && u._id.toString(), email: u.email, role: u.role || null };
      if (!ph) {
        info.hash = null;
        info.type = 'none';
        counts.none = (counts.none||0) + 1;
      } else {
        const sample = typeof ph === 'string' ? ph.slice(0,60) : String(ph).slice(0,60);
        info.hash = sample + (ph.length ? ` (len=${ph.length})` : '');
        let type = 'unknown';
        if (typeof ph === 'string') {
          if (/^\$2[aby]\$/.test(ph)) type = 'bcrypt';
          else if (/^\$argon2/.test(ph)) type = 'argon2';
          else if (/^\$pbkdf2\$/.test(ph)) type = 'pbkdf2';
          else if (/^\$6\$/.test(ph)) type = 'sha512-crypt';
          else if (/^[0-9a-f]{64}$/i.test(ph)) type = 'sha256-hex';
          else if (/^[0-9a-f]{32}$/i.test(ph)) type = 'md5-hex';
          else if (/^[A-Za-z0-9+/]+=*$/.test(ph) && ph.length>40) type = 'base64-like';
        }
        info.type = type;
        counts[type] = (counts[type] || 0) + 1;
      }
      rows.push(info);
    }

    rows.forEach(r => {
    });
  } catch (e) {
  } finally {
    await client.close();
  }
})();
