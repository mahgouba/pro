import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { getStorage } from "./storage";

// Railway database connection
let railwayPool: Pool | null = null;
let railwayDb: any = null;

export async function connectToRailway() {
  const RAILWAY_URL = "postgresql://postgres:TueqQrTNoDNBPZoWIUFrIlxFUZdUmpWJ@shortline.proxy.rlwy.net:52512/railway";

  try {
    console.log('🚂 Connecting to Railway database...');
    
    const poolConfig = {
      connectionString: RAILWAY_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };
    
    railwayPool = new Pool(poolConfig);
    railwayDb = drizzle({ client: railwayPool, schema });
    
    // Test the connection
    await railwayPool.query('SELECT 1');
    console.log('✅ Railway database connected successfully');
    
    return { pool: railwayPool, db: railwayDb };
  } catch (error) {
    console.error('❌ Failed to connect to Railway database:', error);
    throw error;
  }
}

export async function importInventoryFromRailway() {
  try {
    const { db } = await connectToRailway();
    
    console.log('📥 Starting inventory import from Railway...');
    
    // Get all inventory items from Railway
    const railwayItems = await db.select().from(schema.inventoryItems);
    console.log(`Found ${railwayItems.length} inventory items in Railway database`);
    
    // Import each item to MemStorage
    let importedCount = 0;
    for (const item of railwayItems) {
      try {
        await getStorage().createInventoryItem({
          manufacturer: item.manufacturer,
          category: item.category,
          trimLevel: item.trimLevel,
          engineCapacity: item.engineCapacity,
          year: item.year,
          exteriorColor: item.exteriorColor,
          interiorColor: item.interiorColor,
          status: item.status,
          importType: item.importType,
          ownershipType: item.ownershipType,
          location: item.location,
          chassisNumber: item.chassisNumber,
          images: item.images || [],
          logo: item.logo,
          notes: item.notes,
          detailedSpecifications: item.detailedSpecifications,
          price: item.price,
          isSold: item.isSold,
          soldDate: item.soldDate,
          reservationDate: item.reservationDate,
          reservedBy: item.reservedBy,
          salesRepresentative: item.salesRepresentative,
          reservationNote: item.reservationNote,
          customerName: item.customerName,
          customerPhone: item.customerPhone,
          paidAmount: item.paidAmount,
          salePrice: item.salePrice,
          paymentMethod: item.paymentMethod,
          bankName: item.bankName,
          soldToCustomerName: item.soldToCustomerName,
          soldToCustomerPhone: item.soldToCustomerPhone,
          soldBySalesRep: item.soldBySalesRep,
          saleNotes: item.saleNotes,
          mileage: item.mileage
        });
        importedCount++;
      } catch (error) {
        console.warn(`Failed to import item ${item.chassisNumber}:`, error);
      }
    }
    
    console.log(`✅ Successfully imported ${importedCount} inventory items`);
    return importedCount;
    
  } catch (error) {
    console.error('❌ Failed to import inventory from Railway:', error);
    throw error;
  } finally {
    if (railwayPool) {
      await railwayPool.end();
    }
  }
}

export async function importManufacturersFromRailway() {
  try {
    const { db } = await connectToRailway();
    
    console.log('📥 Starting manufacturers import from Railway...');
    
    // Get all manufacturers from Railway
    const railwayManufacturers = await db.select().from(schema.manufacturers);
    console.log(`Found ${railwayManufacturers.length} manufacturers in Railway database`);
    
    // Import each manufacturer to MemStorage
    let importedCount = 0;
    for (const manufacturer of railwayManufacturers) {
      try {
        await getStorage().createManufacturer({
          nameAr: manufacturer.nameAr,
          nameEn: manufacturer.nameEn,
          logo: manufacturer.logo,
          isActive: manufacturer.isActive
        });
        importedCount++;
      } catch (error) {
        console.warn(`Failed to import manufacturer ${manufacturer.nameEn}:`, error);
      }
    }
    
    console.log(`✅ Successfully imported ${importedCount} manufacturers`);
    return importedCount;
    
  } catch (error) {
    console.error('❌ Failed to import manufacturers from Railway:', error);
    throw error;
  }
}

export async function importBanksFromRailway() {
  try {
    const { db } = await connectToRailway();
    
    console.log('📥 Starting banks import from Railway...');
    
    // Get all banks from Railway
    const railwayBanks = await db.select().from(schema.banks);
    console.log(`Found ${railwayBanks.length} banks in Railway database`);
    
    // Import each bank to MemStorage
    let importedCount = 0;
    for (const bank of railwayBanks) {
      try {
        await getStorage().createBank({
          logo: bank.logo,
          bankName: bank.bankName,
          nameEn: bank.nameEn,
          accountName: bank.accountName,
          accountNumber: bank.accountNumber,
          iban: bank.iban,
          type: bank.type,
          isActive: bank.isActive
        });
        importedCount++;
      } catch (error) {
        console.warn(`Failed to import bank ${bank.bankName}:`, error);
      }
    }
    
    console.log(`✅ Successfully imported ${importedCount} banks`);
    return importedCount;
    
  } catch (error) {
    console.error('❌ Failed to import banks from Railway:', error);
    throw error;
  }
}

export async function importUsersFromRailway() {
  try {
    const { db } = await connectToRailway();
    
    console.log('📥 Starting users import from Railway...');
    
    // Get all users from Railway
    const railwayUsers = await db.select().from(schema.users);
    console.log(`Found ${railwayUsers.length} users in Railway database`);
    
    // Import each user to MemStorage
    let importedCount = 0;
    for (const user of railwayUsers) {
      try {
        await getStorage().createUser({
          name: user.name,
          jobTitle: user.jobTitle,
          phoneNumber: user.phoneNumber,
          username: user.username,
          password: user.password,
          role: user.role
        });
        importedCount++;
      } catch (error) {
        console.warn(`Failed to import user ${user.username}:`, error);
      }
    }
    
    console.log(`✅ Successfully imported ${importedCount} users`);
    return importedCount;
    
  } catch (error) {
    console.error('❌ Failed to import users from Railway:', error);
    throw error;
  }
}

export async function importAllDataFromRailway() {
  console.log('🚂 Starting complete data import from Railway...');
  
  const results = {
    inventory: 0,
    manufacturers: 0,
    banks: 0,
    users: 0
  };
  
  try {
    // Import all data types
    results.inventory = await importInventoryFromRailway();
    results.manufacturers = await importManufacturersFromRailway();
    results.banks = await importBanksFromRailway();
    results.users = await importUsersFromRailway();
    
    console.log('✅ Complete Railway import finished:', results);
    return results;
    
  } catch (error) {
    console.error('❌ Railway import failed:', error);
    throw error;
  }
}