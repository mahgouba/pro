import "dotenv/config";
import { db } from "./db";
import type { IStorage } from "./storage";

export async function createStorageInstance(): Promise<IStorage> {
  try {
    // Use the main production database URL
    const dbUrl = process.env.DATABASE_URL;
    console.log('🔍 Checking database configuration...');
    console.log('📋 DATABASE_URL:', dbUrl ? 'Found' : 'Not found');
    console.log('🔗 Database connection:', db ? 'Available' : 'Not available');
    
    if (dbUrl && db) {
      console.log('✅ Using DatabaseStorage with PostgreSQL');
      // Dynamic import to avoid circular dependency
      const { DatabaseStorage } = await import("./database-storage");
      return new DatabaseStorage();
    } else {
      console.log('⚠️ Using MemStorage (DATABASE_URL not found or db not available)');
      const { MemStorage } = await import("./storage");  
      return new MemStorage();
    }
  } catch (error) {
    console.log('⚠️ Database connection failed, falling back to MemStorage:', error);
    const { MemStorage } = await import("./storage");
    return new MemStorage();
  }
}