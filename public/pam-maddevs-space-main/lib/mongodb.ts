import { MongoClient } from "mongodb";

// Allow a local default for demo purposes if env var is not provided.
const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}
// Allow selecting a specific DB name via env var. If not set, try to parse
// the database name from the URI path (if present), otherwise fall back to
// the legacy `maddevs-og` which holds the canonical content snapshot.
const envDb = process.env.MONGODB_DB;
function dbNameFromUri(u: string) {
  try {
    const parsed = new URL(u);
    const path = parsed.pathname || "";
    if (path && path !== "/") return path.replace(/^\//, "");
  } catch (e) {
    // not a full URL (mongodb+srv may not parse the same) — try manual
    const match = u.match(/\/([a-zA-Z0-9_\-]+)(\?|$)/);
    if (match) return match[1];
  }
  return null;
}

const defaultDbName = envDb || dbNameFromUri(uri) || "maddevs-og";

const globalAny = global as any;
if (!globalAny._mongoClientCache) globalAny._mongoClientCache = { client: null };
let cached: { client: MongoClient | null } = globalAny._mongoClientCache;

export async function connectToDatabase() {
  if (cached.client) {
    return { client: cached.client, db: cached.client.db(defaultDbName) };
  }

  const client = new MongoClient(uri!);
  await client.connect();
  cached.client = client;
  return { client, db: client.db(defaultDbName) };
}

export default connectToDatabase;
