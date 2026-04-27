import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

let DATABASE_URL = process.env.DATABASE_URL;
if (DATABASE_URL.startsWith("psql '")) {
  DATABASE_URL = DATABASE_URL.replace(/^psql '/, '').replace(/'$/, '');
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });

export const sql = async (queryText: string, params?: any[]) => {
  const result = await pool.query(queryText, params);
  return result.rows;
};

export function getDatabase() {
  return { db, pool };
}
