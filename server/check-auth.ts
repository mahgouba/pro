import { getDatabase } from "./db";
import { users } from "@shared/schema";
import bcrypt from "bcryptjs";

async function checkAuthentication() {
  try {
    const { db } = getDatabase();
    
    console.log("🔍 Checking authentication system...");

    // Get all users
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users in database:`);
    
    for (const user of allUsers.slice(0, 5)) {
      console.log(`- ${user.username} (${user.role}) - Password hash starts with: ${user.password?.substring(0, 10)}...`);
    }

    // Test password for admin user
    const [adminUser] = allUsers.filter(u => u.username === 'admin');
    if (adminUser) {
      const testPasswords = ['admin123', 'admin', '123456'];
      
      for (const testPass of testPasswords) {
        const isValid = await bcrypt.compare(testPass, adminUser.password);
        console.log(`Password "${testPass}" for admin: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
        if (isValid) break;
      }
    } else {
      console.log("❌ No admin user found");
    }

    // Check abdullah_alghanami 
    const [abdullahUser] = allUsers.filter(u => u.username === 'abdullah_alghanami');
    if (abdullahUser) {
      const isValid = await bcrypt.compare('admin123', abdullahUser.password);
      console.log(`Password "admin123" for abdullah_alghanami: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    } else {
      console.log("❌ No abdullah_alghanami user found");
    }

  } catch (error) {
    console.error("❌ Error checking authentication:", error);
  }
}

checkAuthentication();