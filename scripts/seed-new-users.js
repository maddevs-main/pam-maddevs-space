// Seed new users with configurable emails/passwords via env vars
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

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const dbName = process.env.MONGODB_DB;
  const db = dbName ? client.db(dbName) : client.db();

  const adminEmail = process.env.NEW_ADMIN_EMAIL || `newadmin+${Date.now()}@pam.test`;
  const staffEmail = process.env.NEW_STAFF_EMAIL || `newstaff+${Date.now()}@pam.test`;
  const consumerEmail = process.env.NEW_CONSUMER_EMAIL || `newconsumer+${Date.now()}@pam.test`;
  const adminPass = process.env.NEW_ADMIN_PASS || 'adminpass2';
  const staffPass = process.env.NEW_STAFF_PASS || 'staffpass2';
  const consumerPass = process.env.NEW_CONSUMER_PASS || 'consumerpass2';

  const saltRounds = 10;
  const adminHash = await bcrypt.hash(adminPass, saltRounds);
  const staffHash = await bcrypt.hash(staffPass, saltRounds);
  const consumerHash = await bcrypt.hash(consumerPass, saltRounds);

  // Insert or upsert users
  const now = new Date();
  const adminDoc = { email: adminEmail, passwordHash: adminHash, name: 'New Admin', role: 'admin', tenantId: 'tenant_demo', createdAt: now };
  const staffDoc = { email: staffEmail, passwordHash: staffHash, name: 'New Staff', role: 'staff', tenantId: 'tenant_demo', createdAt: now };
  const consumerDoc = { email: consumerEmail, passwordHash: consumerHash, name: 'New Consumer', role: 'consumer', tenantId: 'tenant_demo', createdAt: now };

  // delete any existing with same emails to be idempotent
  await db.collection('users').deleteMany({ email: { $in: [adminEmail, staffEmail, consumerEmail] } });

  const ra = await db.collection('users').insertOne(adminDoc);
  const rs = await db.collection('users').insertOne(staffDoc);
  const rc = await db.collection('users').insertOne(consumerDoc);

  console.log('Inserted new users:');
  console.log('Admin:', adminEmail, '/', adminPass, 'id:', ra.insertedId.toString());
  console.log('Staff:', staffEmail, '/', staffPass, 'id:', rs.insertedId.toString());
  console.log('Consumer:', consumerEmail, '/', consumerPass, 'id:', rc.insertedId.toString());

  await client.close();
}

seed().catch(e=>{ console.error('Seeding error', e); process.exit(1); });
