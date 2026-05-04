import * as schema from "@shared/schema";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import pg from "pg";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";

const CONNECTION_URL = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!CONNECTION_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

let DATABASE_URL = CONNECTION_URL;
if (DATABASE_URL.startsWith("psql '")) {
  DATABASE_URL = DATABASE_URL.replace(/^psql '/, '').replace(/'$/, '');
}

const isNeonUrl = DATABASE_URL.includes("neon.tech") || DATABASE_URL.includes("neon.database");

let db: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzlePg>;
let sql: any;
let pool: any;

if (isNeonUrl) {
  const neonSql = neon(DATABASE_URL);
  db = drizzleNeon(neonSql, { schema });
  sql = neonSql;
  pool = {
    query: async (queryText: string, params?: any[]) => {
      return { rows: await neonSql(queryText, params) };
    },
    end: async () => {},
    on: () => {},
  };
} else {
  const pgPool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: false,
  });
  db = drizzlePg(pgPool, { schema });
  sql = async (queryText: string, params?: any[]) => {
    const result = await pgPool.query(queryText, params);
    return result.rows;
  };
  pool = {
    query: async (queryText: string, params?: any[]) => {
      const result = await pgPool.query(queryText, params);
      return { rows: result.rows };
    },
    end: async () => pgPool.end(),
    on: () => {},
  };
}

export { db, sql, pool };

export function getDatabase() {
  return { db, pool };
}
