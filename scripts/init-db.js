import { Client } from 'pg';

async function initDatabase() {
  console.log('Initializing database...');
  
  // Connect to postgres database to create the inventory_db
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'runner'
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Create the inventory_db database
    await client.query(`DROP DATABASE IF EXISTS inventory_db;`);
    await client.query(`CREATE DATABASE inventory_db;`);
    console.log('Created inventory_db database');
    
    await client.end();
    console.log('Database initialization complete');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

initDatabase();