import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

let pool: Pool | null = null;
let db: any = null;

export async function initializeDatabase() {
  // Use environment variable for database URL
  let DATABASE_URL = process.env.DATABASE_URL;
  
  // Clean the URL if it includes psql command wrapper
  if (DATABASE_URL && DATABASE_URL.startsWith("psql '")) {
    DATABASE_URL = DATABASE_URL.replace(/^psql '/, '').replace(/'$/, '');
  }
  
  if (DATABASE_URL) {
    try {
      console.log('🔌 Initializing database connection...');
      console.log('📍 Using database URL:', DATABASE_URL.substring(0, 50) + '...');
      
      const poolConfig = {
        connectionString: DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      };
      
      pool = new Pool(poolConfig);
      db = drizzle({ client: pool, schema });
      
      // Test the connection
      await pool.query('SELECT 1');
      console.log('✅ Database connection successful');
      
      return { pool, db };
    } catch (error) {
      console.warn('⚠️ Database connection failed:', error);
      if (pool) {
        try {
          await pool.end();
        } catch (e) {
          console.warn('Error closing pool:', e);
        }
      }
      pool = null;
      db = null;
      return { pool: null, db: null };
    }
  } else {
    console.log('ℹ️ DATABASE_URL not found - using memory storage');
    return { pool: null, db: null };
  }
}

export function getDatabase() {
  if (!db || !pool) {
    console.warn('⚠️ Database not initialized, attempting to reconnect...');
    // Use environment variable for database URL
    const DATABASE_URL = process.env.DATABASE_URL;
    if (DATABASE_URL) {
      const newPool = new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
      const newDb = drizzle({ client: newPool, schema: require("@shared/schema") });
      pool = newPool;
      db = newDb;
      console.log('✅ Database reconnected');
    } else {
      console.error('❌ DATABASE_URL environment variable not found');
    }
  }
  return { pool, db };
}