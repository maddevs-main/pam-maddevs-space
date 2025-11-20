const fs = require('fs');
const path = require('path');

// Manually load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  const envVars = envFile.split('\n');

  for (const line of envVars) {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

/**
 * Demo seeder for PAM project.
 * Run with: `node scripts/seed-demo.js`
 * This will insert three demo users (admin, staff, consumer) and a sample project
 * stored inside the consumer document (projects array) as requested.
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI environment variable not set.');
  console.error('Please create a .env.local file and add the following line:');
  console.error('MONGODB_URI=mongodb://localhost:27017/pam');
  process.exit(1);
}

async function seed() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();

    console.log('Connected to', MONGODB_URI);

    // Clear existing demo users with same demo emails to be idempotent
    await db.collection('users').deleteMany({ email: { $in: ['admin@pam.test','staff@pam.test','consumer@pam.test'] } });

    const saltRounds = 10;
    const adminPass = await bcrypt.hash('adminpass', saltRounds);
    const staffPass = await bcrypt.hash('staffpass', saltRounds);
    const consumerPass = await bcrypt.hash('consumerpass', saltRounds);

    const tenantId = 'tenant_demo';

    const admin = {
      email: 'admin@pam.test',
      passwordHash: adminPass,
      name: 'Demo Admin',
      role: 'admin',
      tenantId,
      createdAt: new Date(),
    };

    const staff = {
      email: 'staff@pam.test',
      passwordHash: staffPass,
      name: 'Demo Staff',
      role: 'staff',
      tenantId,
      createdAt: new Date(),
    };

    const sampleProject = {
      id: 'proj_demo_1',
      title: 'Demo Project Alpha',
      author: { id: null, name: 'Demo Consumer', email: 'consumer@pam.test' },
      description: 'This is a sample project stored inside the consumer document.',
      requirements: 'Basic demo requirements',
      status: 'pending',
      people_allocated: [],
      staff: [],
      admin: ['admin@pam.test'],
      files: [],
      deliverables: [],
      finance: [
        { milestoneId: 'm1', title: 'Initial deposit', amount: 500, status: 'due', dueDate: new Date() }
      ],
      timeline: { start: new Date(), end: null },
      meetings: [],
      created_at: new Date(),
      updated_at: new Date(),
    };

    const consumer = {
      email: 'consumer@pam.test',
      passwordHash: consumerPass,
      name: 'Demo Consumer',
      role: 'consumer',
      tenantId,
      projects: [sampleProject],
      createdAt: new Date(),
    };

    const resultAdmin = await db.collection('users').insertOne(admin);
    const resultStaff = await db.collection('users').insertOne(staff);
    const resultConsumer = await db.collection('users').insertOne(consumer);

    console.log('Inserted admin id:', resultAdmin.insertedId.toString());
    console.log('Inserted staff id:', resultStaff.insertedId.toString());
    console.log('Inserted consumer id:', resultConsumer.insertedId.toString());

    // Create a demo invite for testing registration flows (admin-generated style)
    await db.collection('invites').insertOne({
      code: 'demo-invite-001',
      role: 'consumer',
      tenantId,
      createdAt: new Date(),
      expiresAt: null,
      used: false,
    });

    console.log('Demo invite code: demo-invite-001');

    console.log('\nDemo seeding complete. Credentials:');
    console.log('Admin:   admin@pam.test / adminpass');
    console.log('Staff:   staff@pam.test / staffpass');
    console.log('Consumer: consumer@pam.test / consumerpass');

  } catch (err) {
    console.error('Seeding error', err);
  } finally {
    await client.close();
  }
}

seed();
