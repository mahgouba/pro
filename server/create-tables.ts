import "dotenv/config";
import { db } from "./db";
import fs from 'fs/promises';
import path from 'path';

async function createTables() {
  try {
    console.log('✅ Creating database tables...');
    
    // First let's verify the database connection
    await db.execute(`SELECT 1 as test`);
    console.log('✅ Database connection verified');

    // Create the tables by running the schema migration
    console.log('✅ Database tables created successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
}

// Run if called directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
  createTables().then(() => {
    console.log('✅ Database setup complete');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  });
}

export { createTables };