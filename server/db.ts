import * as schema from "@shared/schema";
import pg from "pg";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";

const CONNECTION_URL = process.env.DATABASE_URL;

if (!CONNECTION_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

let DATABASE_URL = CONNECTION_URL;
if (DATABASE_URL.startsWith("psql '")) {
  DATABASE_URL = DATABASE_URL.replace(/^psql '/, '').replace(/'$/, '');
}

const pgPool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes("sslmode=require") ? { rejectUnauthorized: false } : false,
});

const db = drizzlePg(pgPool, { schema });
const sql = async (queryText: string, params?: any[]) => {
  const result = await pgPool.query(queryText, params);
  return result.rows;
};
const pool = {
  query: async (queryText: string, params?: any[]) => {
    const result = await pgPool.query(queryText, params);
    return { rows: result.rows };
  },
  end: async () => pgPool.end(),
  on: () => {},
};

export { db, sql, pool };

export function getDatabase() {
  return { db, pool };
}
