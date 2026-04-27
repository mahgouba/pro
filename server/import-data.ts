import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from './db';
import { 
  inventoryItems, 
  users, 
  banks, 
  manufacturers, 
  vehicleCategories, 
  vehicleTrimLevels 
} from '@shared/schema';

interface DatabaseBackup {
  metadata: {
    exportDate: string;
    version: string;
    description: string;
    exportType: string;
    selectedTypes: string;
    lastUpdate: string;
  };
  data: {
    inventory?: any[];
    users?: any[];
    banks?: any[];
    manufacturers?: any[];
    categories?: any[];
    trimLevels?: any[];
    [key: string]: any;
  };
}

async function importDataFromJson() {
  try {
    console.log('🔄 Starting data import from data.base.json...');
    
    // Read the backup file
    const filePath = join(process.cwd(), 'data.base.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    const backup: DatabaseBackup = JSON.parse(fileContent);
    
    console.log('📊 Backup metadata:', backup.metadata);
    console.log('📦 Available data types:', Object.keys(backup.data));
    
    let importStats = {
      inventory: 0,
      users: 0,
      banks: 0,
      manufacturers: 0,
      categories: 0,
      trimLevels: 0
    };

    // Import Users
    if (backup.data.users && backup.data.users.length > 0) {
      console.log(`👥 Importing ${backup.data.users.length} users...`);
      for (const user of backup.data.users) {
        try {
          await db.insert(users).values({
            name: user.name,
            jobTitle: user.jobTitle,
            phoneNumber: user.phoneNumber,
            username: user.username,
            password: user.password,
            role: user.role
          }).onConflictDoNothing();
          importStats.users++;
        } catch (error) {
          console.warn(`⚠️ Failed to import user ${user.username}:`, error);
        }
      }
    }

    // Import Banks
    if (backup.data.banks && backup.data.banks.length > 0) {
      console.log(`🏦 Importing ${backup.data.banks.length} banks...`);
      for (const bank of backup.data.banks) {
        try {
          await db.insert(banks).values({
            logo: bank.logo,
            bankName: bank.bankName,
            nameEn: bank.nameEn,
            accountName: bank.accountName,
            accountNumber: bank.accountNumber,
            iban: bank.iban,
            type: bank.type,
            isActive: bank.isActive ?? true
          }).onConflictDoNothing();
          importStats.banks++;
        } catch (error) {
          console.warn(`⚠️ Failed to import bank ${bank.bankName}:`, error);
        }
      }
    }

    // Import Manufacturers
    if (backup.data.manufacturers && backup.data.manufacturers.length > 0) {
      console.log(`🏭 Importing ${backup.data.manufacturers.length} manufacturers...`);
      for (const manufacturer of backup.data.manufacturers) {
        try {
          await db.insert(manufacturers).values({
            nameAr: manufacturer.nameAr,
            nameEn: manufacturer.nameEn,
            logo: manufacturer.logo,
            isActive: manufacturer.isActive ?? true
          }).onConflictDoNothing();
          importStats.manufacturers++;
        } catch (error) {
          console.warn(`⚠️ Failed to import manufacturer ${manufacturer.nameAr}:`, error);
        }
      }
    }

    // Import Vehicle Categories
    if (backup.data.categories && backup.data.categories.length > 0) {
      console.log(`📂 Importing ${backup.data.categories.length} categories...`);
      for (const category of backup.data.categories) {
        try {
          await db.insert(vehicleCategories).values({
            manufacturerId: category.manufacturerId,
            nameAr: category.nameAr,
            nameEn: category.nameEn,
            isActive: category.isActive ?? true
          }).onConflictDoNothing();
          importStats.categories++;
        } catch (error) {
          console.warn(`⚠️ Failed to import category ${category.nameAr}:`, error);
        }
      }
    }

    // Import Vehicle Trim Levels
    if (backup.data.trimLevels && backup.data.trimLevels.length > 0) {
      console.log(`🎯 Importing ${backup.data.trimLevels.length} trim levels...`);
      for (const trimLevel of backup.data.trimLevels) {
        try {
          await db.insert(vehicleTrimLevels).values({
            categoryId: trimLevel.categoryId,
            nameAr: trimLevel.nameAr,
            nameEn: trimLevel.nameEn,
            isActive: trimLevel.isActive ?? true
          }).onConflictDoNothing();
          importStats.trimLevels++;
        } catch (error) {
          console.warn(`⚠️ Failed to import trim level ${trimLevel.nameAr}:`, error);
        }
      }
    }

    // Import Inventory Items
    if (backup.data.inventory && backup.data.inventory.length > 0) {
      console.log(`🚗 Importing ${backup.data.inventory.length} inventory items...`);
      for (const item of backup.data.inventory) {
        try {
          await db.insert(inventoryItems).values({
            manufacturer: item.manufacturer,
            category: item.category,
            trimLevel: item.trimLevel,
            engineCapacity: item.engineCapacity,
            year: item.year,
            exteriorColor: item.exteriorColor,
            interiorColor: item.interiorColor,
            status: item.status,
            importType: item.importType,
            ownershipType: item.ownershipType || "ملك الشركة",
            location: item.location,
            chassisNumber: item.chassisNumber,
            images: item.images || [],
            logo: item.logo,
            notes: item.notes,
            detailedSpecifications: item.detailedSpecifications,
            price: item.price ? String(item.price) : null,
            isSold: item.isSold ?? false,
            soldDate: item.soldDate ? new Date(item.soldDate) : null,
            reservationDate: item.reservationDate ? new Date(item.reservationDate) : null,
            reservedBy: item.reservedBy,
            salesRepresentative: item.salesRepresentative,
            reservationNote: item.reservationNote,
            customerName: item.customerName,
            customerPhone: item.customerPhone,
            paidAmount: item.paidAmount ? String(item.paidAmount) : null,
            salePrice: item.salePrice ? String(item.salePrice) : null,
            paymentMethod: item.paymentMethod,
            bankName: item.bankName,
            soldToCustomerName: item.soldToCustomerName,
            soldToCustomerPhone: item.soldToCustomerPhone,
            soldBySalesRep: item.soldBySalesRep,
            saleNotes: item.saleNotes,
            mileage: item.mileage
          }).onConflictDoNothing();
          importStats.inventory++;
        } catch (error) {
          console.warn(`⚠️ Failed to import inventory item ${item.chassisNumber}:`, error);
        }
      }
    }

    console.log('✅ Data import completed successfully!');
    console.log('📈 Import Statistics:', importStats);
    
    return importStats;
  } catch (error) {
    console.error('❌ Data import failed:', error);
    throw error;
  }
}

// Run the import if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importDataFromJson()
    .then((stats) => {
      console.log('🎉 Import completed with statistics:', stats);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Import failed:', error);
      process.exit(1);
    });
}

export { importDataFromJson };