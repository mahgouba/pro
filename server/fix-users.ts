import { getDatabase } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function fixUsers() {
  try {
    const { db } = getDatabase();
    
    console.log("🔧 Fixing user accounts...");

    // Hash password for admin123
    const hashedPassword = await bcrypt.hash("admin123", 12);

    // Create admin user if doesn't exist
    const [existingAdmin] = await db.select().from(users).where(eq(users.username, "admin"));
    
    if (!existingAdmin) {
      console.log("Creating admin user...");
      await db.insert(users).values({
        name: "مدير النظام",
        username: "admin",
        password: hashedPassword,
        role: "admin",
        jobTitle: "مدير عام",
        phoneNumber: "0500000000",
        createdAt: new Date()
      });
      console.log("✅ Admin user created");
    } else {
      console.log("Admin user exists, updating password...");
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.username, "admin"));
      console.log("✅ Admin password updated");
    }

    // Update abdullah_alghanami password
    const [abdullahUser] = await db.select().from(users).where(eq(users.username, "abdullah_alghanami"));
    if (abdullahUser) {
      console.log("Updating abdullah_alghanami password...");
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.username, "abdullah_alghanami"));
      console.log("✅ Abdullah password updated");
    }

    // Update all users to use admin123 password
    const allUsers = await db.select().from(users);
    console.log(`Updating passwords for ${allUsers.length} users...`);
    
    for (const user of allUsers) {
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, user.id));
    }
    
    console.log("✅ All user passwords updated to 'admin123'");
    
    // Test authentication
    const testUsers = ["admin", "abdullah_alghanami", "sales_manager"];
    for (const username of testUsers) {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      if (user) {
        const isValid = await bcrypt.compare("admin123", user.password);
        console.log(`${username}: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      }
    }

  } catch (error) {
    console.error("❌ Error fixing users:", error);
  }
}

fixUsers();