import "dotenv/config";
import { db } from "./db";
import { users } from "@shared/schema";
import bcrypt from "bcryptjs";

async function createAdminUser() {
  try {
    console.log("🔐 Creating admin user...");
    
    // Hash the password
    const hashedPassword = await bcrypt.hash("admin", 10);
    
    // Create admin user
    const [adminUser] = await db.insert(users).values({
      name: "مدير النظام",
      jobTitle: "مدير",
      phoneNumber: "0500000000",
      username: "admin",
      password: hashedPassword,
      role: "admin"
    }).onConflictDoNothing().returning();
    
    if (adminUser) {
      console.log("✅ Admin user created successfully!");
      console.log("   Username: admin");
      console.log("   Password: admin");
      console.log("   Role: admin");
    } else {
      console.log("ℹ️ Admin user already exists");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
}

createAdminUser();