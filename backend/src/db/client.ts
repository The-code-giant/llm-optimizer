import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleHTTP } from 'drizzle-orm/neon-http';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * Use Neon serverless HTTP driver by default in development to avoid long-lived TCP connections
 * that keep compute hot. Fallback to node-postgres pool when explicitly requested.
 */
const useNodePg = process.env.USE_NODE_PG === 'true';

if (!process.env.NEON_DATABASE_URL && process.env.DATABASE_URL) {
  process.env.NEON_DATABASE_URL = process.env.DATABASE_URL;
}

if (!process.env.NEON_DATABASE_URL) {
  throw new Error('NEON_DATABASE_URL is not set');
}

let db: ReturnType<typeof drizzleNode> | ReturnType<typeof drizzleHTTP>;

if (useNodePg) {
  // Node pg with conservative pool settings for Neon
  const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    max: Number(process.env.PG_POOL_MAX || 1),
    min: 0,
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 1000 * 5),
    ssl: process.env.PG_SSL === 'false' ? false : { rejectUnauthorized: false },
  });
  db = drizzleNode(pool, { schema });
} else {
  // HTTP driver (no pooling) keeps Neon compute cold between requests
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { neon } = require('@neondatabase/serverless');
  const sql = neon(process.env.NEON_DATABASE_URL);
  db = drizzleHTTP(sql, { schema });
}

export { db };
