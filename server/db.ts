import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

// Ensure SSL is handled correctly for serverless environments
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Clean the URL if it includes psql command wrapper
let DATABASE_URL = process.env.DATABASE_URL;
if (DATABASE_URL.startsWith("psql '")) {
  DATABASE_URL = DATABASE_URL.replace(/^psql '/, '').replace(/'$/, '');
}

export const sql = neon(DATABASE_URL);
export const db = drizzle(sql, { schema });

// Mock pool object for compatibility with code that expects a pool
export const pool = {
  query: async (queryText: string, params?: any[]) => {
    return { rows: await sql(queryText, params) };
  },
  end: async () => {},
  on: () => {}
};

export function getDatabase() {
  return { db, pool };
}
