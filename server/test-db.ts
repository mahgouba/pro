import { db } from './db.js';
import { inventoryItems, users, banks, manufacturers } from '../shared/schema.js';
import { sql } from 'drizzle-orm';

async function testDbConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    if (!db) {
      console.log('❌ Database connection not available');
      return;
    }
    
    // Test basic connection
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log('✅ Database connection successful');
    
    // Check tables
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📊 Available tables:', tables.rows?.map((t: any) => t.table_name) || 'No tables found');
    
    // Count records in each table
    try {
      const userResult = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
      console.log('👥 Users:', userResult[0]?.count || 0);
    } catch (e: any) { 
      console.log('👥 Users table: error', e.message); 
    }
    
    try {
      const inventoryResult = await db.execute(sql`SELECT COUNT(*) as count FROM inventory_items`);
      console.log('🚗 Inventory items:', inventoryResult[0]?.count || 0);
    } catch (e: any) { 
      console.log('🚗 Inventory table: error', e.message); 
    }
    
    try {
      const bankResult = await db.execute(sql`SELECT COUNT(*) as count FROM banks`);
      console.log('🏦 Banks:', bankResult[0]?.count || 0);
    } catch (e: any) { 
      console.log('🏦 Banks table: error', e.message); 
    }
    
    try {
      const manufacturerResult = await db.execute(sql`SELECT COUNT(*) as count FROM manufacturers`);
      console.log('🏭 Manufacturers:', manufacturerResult[0]?.count || 0);
    } catch (e: any) { 
      console.log('🏭 Manufacturers table: error', e.message); 
    }
    
    // Try to fetch some sample data
    try {
      console.log('\n📋 Sample data from tables:');
      
      const sampleUsers = await db.execute(sql`SELECT id, name, username, role FROM users LIMIT 3`);
      if (sampleUsers.length > 0) {
        console.log('👥 Sample users:', sampleUsers);
      }
      
      const sampleInventory = await db.execute(sql`
        SELECT id, manufacturer, category, year, status, chassis_number 
        FROM inventory_items 
        LIMIT 3
      `);
      if (sampleInventory.length > 0) {
        console.log('🚗 Sample inventory:', sampleInventory);
      }
      
      const sampleBanks = await db.execute(sql`
        SELECT id, bank_name, account_name, type 
        FROM banks 
        LIMIT 3
      `);
      if (sampleBanks.length > 0) {
        console.log('🏦 Sample banks:', sampleBanks);
      }
      
    } catch (e: any) {
      console.log('⚠️ Error fetching sample data:', e.message);
    }
    
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testDbConnection();