/**
 * Migrate projects embedded in consumer user documents into a top-level `projects` collection.
 * Run: `node scripts/migrate-projects.js`
 */
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

async function migrate() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const consumers = await db.collection('users').find({ role: 'consumer', projects: { $exists: true, $ne: [] } }).toArray();
    console.log('Found', consumers.length, 'consumers with embedded projects');

    for (const c of consumers) {
      const projects = c.projects || [];
      for (const p of projects) {
        const project = Object.assign({}, p);
        project.author = { id: c._id.toString(), name: c.name || c.email };
        project.tenantId = c.tenantId || null;
        project.created_at = project.created_at ? new Date(project.created_at) : new Date();
        project.updated_at = new Date();
        const res = await db.collection('projects').insertOne(project);
        console.log('Migrated project', project.title, '->', res.insertedId.toString());
      }

      // remove projects from consumer document
      await db.collection('users').updateOne({ _id: c._id }, { $unset: { projects: '' } });
      console.log('Cleared projects for consumer', c.email);
    }

    console.log('Migration complete');
  } catch (err) {
    console.error('Migration error', err);
  } finally {
    await client.close();
  }
}

migrate();
