import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL;

async function fixAuth() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    // Get all users
    const result = await client.query('SELECT id, username, role, password FROM users');
    console.log('Found users:', result.rows.length);
    
    // Update existing users with proper passwords
    const updates = [
      { username: 'abdullah_alghanami', password: 'admin123' },
      { username: 'ahmad_aljawhary', password: 'admin123' },
      { username: 'abdulmajeed_abdullah', password: 'admin123' },
      { username: 'sadiq_alghanami', password: 'admin123' },
      { username: 'farouq_alghanami', password: 'admin123' },
      { username: 'sami_ahmad', password: 'admin123' },
      { username: 'mahmoud_kamal', password: 'admin123' },
      { username: 'ahmad_kamal', password: 'admin123' },
      { username: 'ayman_almaliki', password: 'admin123' },
      { username: 'ayman_almoshki', password: 'admin123' },
      { username: 'azzam_alghanami', password: 'admin123' }
    ];

    for (const update of updates) {
      const hashedPassword = await bcrypt.hash(update.password, 10);
      
      // Update existing user password
      await client.query('UPDATE users SET password = $1 WHERE username = $2', [hashedPassword, update.username]);
      console.log(`Updated password for user: ${update.username}`);
    }
    
    // Test authentication with one user
    const testResult = await client.query('SELECT username, password FROM users WHERE username = $1', ['admin']);
    if (testResult.rows.length > 0) {
      const user = testResult.rows[0];
      const isValid = await bcrypt.compare('admin123', user.password);
      console.log(`Test login for admin: ${isValid ? 'SUCCESS' : 'FAILED'}`);
    }
    
    client.release();
    console.log('Authentication fix completed!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

fixAuth();