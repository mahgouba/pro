import "dotenv/config";
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";
import { migrate } from 'drizzle-orm/node-postgres/migrator';

async function setupDatabase() {
  try {
    console.log('🔌 Setting up database...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required');
    }

    // Create connection pool
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Create drizzle instance
    const db = drizzle(pool, { schema });
    
    console.log('✅ Database connection established');

    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection test successful');

    // Create tables using schema
    console.log('📋 Creating tables...');
    
    // This will create all tables defined in the schema
    // We'll use a simple approach by trying to insert and catch errors
    try {
      // Test if tables exist by trying to query them
      await db.execute(`SELECT 1 FROM users LIMIT 1`);
      console.log('✅ Tables already exist');
    } catch (error) {
      console.log('📋 Tables do not exist, creating them...');
      // Create tables manually
      await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          job_title TEXT NOT NULL,
          phone_number TEXT NOT NULL,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'seller',
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      
      await db.execute(`
        CREATE TABLE IF NOT EXISTS inventory_items (
          id SERIAL PRIMARY KEY,
          manufacturer TEXT NOT NULL,
          category TEXT NOT NULL,
          trim_level TEXT,
          engine_capacity TEXT NOT NULL,
          year INTEGER NOT NULL,
          exterior_color TEXT NOT NULL,
          interior_color TEXT NOT NULL,
          status TEXT NOT NULL,
          import_type TEXT NOT NULL,
          ownership_type TEXT NOT NULL DEFAULT 'ملك الشركة',
          location TEXT NOT NULL,
          chassis_number TEXT NOT NULL UNIQUE,
          images TEXT[] DEFAULT '{}',
          logo TEXT,
          notes TEXT,
          detailed_specifications TEXT,
          entry_date TIMESTAMP DEFAULT NOW() NOT NULL,
          price DECIMAL(10,2),
          is_sold BOOLEAN DEFAULT FALSE NOT NULL,
          sold_date TIMESTAMP,
          reservation_date TIMESTAMP,
          reserved_by TEXT,
          sales_representative TEXT,
          reservation_note TEXT,
          customer_name TEXT,
          customer_phone TEXT,
          paid_amount DECIMAL(10,2),
          sale_price DECIMAL(10,2),
          payment_method TEXT,
          bank_name TEXT,
          sold_to_customer_name TEXT,
          sold_to_customer_phone TEXT,
          sold_by_sales_rep TEXT,
          sale_notes TEXT,
          mileage INTEGER
        )
      `);
      
      console.log('✅ Tables created successfully');
    }

    // Close connection
    await pool.end();
    console.log('✅ Database setup completed');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase().then(() => {
    console.log('✅ Database setup complete');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  });
}

export { setupDatabase }; 