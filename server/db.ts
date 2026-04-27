import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

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

export const sql = neon(DATABASE_URL);
export const db = drizzle(sql, { schema });

export const pool = {
  query: async (queryText: string, params?: any[]) => {
    return { rows: await sql(queryText, params) };
  },
  end: async () => {},
  on: () => {},
};

export function getDatabase() {
  return { db, pool };
}
