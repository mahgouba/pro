import "dotenv/config";
import { Pool } from 'pg';

console.log('🚀 Starting database connection test...');
console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');

async function testDatabaseConnection() {
  try {
    console.log('🔌 Testing Railway PostgreSQL connection...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required');
    }

    // Create connection pool
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    console.log('✅ Database connection established');

    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database time:', result.rows[0].current_time);

    // Test users table
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log('✅ Users count:', usersResult.rows[0].count);

    // Test inventory table
    const inventoryResult = await pool.query('SELECT COUNT(*) as count FROM inventory_items');
    console.log('✅ Inventory count:', inventoryResult.rows[0].count);

    // Test quotations table
    const quotationsResult = await pool.query('SELECT COUNT(*) as count FROM quotations');
    console.log('✅ Quotations count:', quotationsResult.rows[0].count);

    // Test banks table
    const banksResult = await pool.query('SELECT COUNT(*) as count FROM banks');
    console.log('✅ Banks count:', banksResult.rows[0].count);

    // Get sample data
    console.log('\n📊 Sample Data:');
    
    const sampleUsers = await pool.query('SELECT id, name, username, role FROM users LIMIT 3');
    console.log('👥 Users:', sampleUsers.rows);

    const sampleInventory = await pool.query('SELECT id, manufacturer, category, status FROM inventory_items LIMIT 3');
    console.log('🚗 Inventory:', sampleInventory.rows);

    const sampleBanks = await pool.query('SELECT id, bank_name, type FROM banks LIMIT 3');
    console.log('🏦 Banks:', sampleBanks.rows);

    // Close connection
    await pool.end();
    console.log('\n✅ Database connection test completed successfully');
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    throw error;
  }
}

// Run if called directly
console.log('📝 Running test...');
testDatabaseConnection().then(() => {
  console.log('✅ Test complete');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

export { testDatabaseConnection }; 