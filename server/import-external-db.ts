import { Pool } from 'pg';
import { getDatabase } from './db';
import { users, inventoryItems, manufacturers, banks, vehicleCategories, vehicleTrimLevels } from '../shared/schema';

export async function importFromExternalDatabase(connectionString: string) {
  let externalPool: Pool | null = null;
  
  try {
    // Connect to external database
    externalPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    });

    const { db } = getDatabase();
    
    // Test connection first
    await externalPool.query('SELECT 1');
    console.log('Connected to external database successfully');

    // Import users
    try {
      const externalUsers = await externalPool.query('SELECT * FROM users ORDER BY id');
      if (externalUsers.rows.length > 0) {
        console.log(`Importing ${externalUsers.rows.length} users...`);
        
        // Clear existing users (except admins)
        await db.execute('DELETE FROM users WHERE role != \'admin\'');
        
        for (const user of externalUsers.rows) {
          try {
            await db.insert(users).values({
              name: user.name,
              jobTitle: user.job_title || user.jobTitle,
              phoneNumber: user.phone_number || user.phoneNumber,
              username: user.username,
              password: user.password,
              role: user.role || 'seller'
            }).onConflictDoNothing();
          } catch (e) {
            console.log(`Failed to import user ${user.username}:`, e);
          }
        }
        console.log('Users imported successfully');
      }
    } catch (e) {
      console.log('Users table not found or error importing users:', e);
    }

    // Import inventory items
    try {
      const externalInventory = await externalPool.query('SELECT * FROM inventory_items ORDER BY id');
      if (externalInventory.rows.length > 0) {
        console.log(`Importing ${externalInventory.rows.length} inventory items...`);
        
        // Clear existing inventory
        await db.execute('DELETE FROM inventory_items');
        
        for (const item of externalInventory.rows) {
          try {
            await db.insert(inventoryItems).values({
              manufacturer: item.manufacturer,
              category: item.category,
              trimLevel: item.trim_level || item.trimLevel,
              engineCapacity: item.engine_capacity || item.engineCapacity,
              year: item.year,
              exteriorColor: item.exterior_color || item.exteriorColor,
              interiorColor: item.interior_color || item.interiorColor,
              status: item.status,
              importType: item.import_type || item.importType,
              ownershipType: item.ownership_type || item.ownershipType || 'ملك الشركة',
              location: item.location,
              chassisNumber: item.chassis_number || item.chassisNumber,
              images: item.images || [],
              logo: item.logo,
              notes: item.notes,
              detailedSpecifications: item.detailed_specifications || item.detailedSpecifications,
              price: item.price,
              isSold: item.is_sold ?? item.isSold ?? false,
              soldDate: item.sold_date || item.soldDate,
              reservationDate: item.reservation_date || item.reservationDate,
              reservedBy: item.reserved_by || item.reservedBy,
              salesRepresentative: item.sales_representative || item.salesRepresentative,
              reservationNote: item.reservation_note || item.reservationNote,
              customerName: item.customer_name || item.customerName,
              customerPhone: item.customer_phone || item.customerPhone,
              paidAmount: item.paid_amount || item.paidAmount,
              salePrice: item.sale_price || item.salePrice,
              paymentMethod: item.payment_method || item.paymentMethod,
              bankName: item.bank_name || item.bankName,
              soldToCustomerName: item.sold_to_customer_name || item.soldToCustomerName,
              soldToCustomerPhone: item.sold_to_customer_phone || item.soldToCustomerPhone,
              soldBySalesRep: item.sold_by_sales_rep || item.soldBySalesRep,
              saleNotes: item.sale_notes || item.saleNotes,
              mileage: item.mileage
            });
          } catch (e) {
            console.log(`Failed to import inventory item ${item.chassis_number || item.chassisNumber}:`, e);
          }
        }
        console.log('Inventory items imported successfully');
      }
    } catch (e) {
      console.log('Inventory items table not found or error importing inventory:', e);
    }

    // Import manufacturers
    try {
      const externalManufacturers = await externalPool.query('SELECT * FROM manufacturers ORDER BY id');
      if (externalManufacturers.rows.length > 0) {
        console.log(`Importing ${externalManufacturers.rows.length} manufacturers...`);
        
        // Clear existing manufacturers
        await db.execute('DELETE FROM manufacturers');
        
        for (const manufacturer of externalManufacturers.rows) {
          try {
            await db.insert(manufacturers).values({
              nameAr: manufacturer.name_ar || manufacturer.nameAr,
              nameEn: manufacturer.name_en || manufacturer.nameEn,
              logo: manufacturer.logo,
              isActive: manufacturer.is_active ?? manufacturer.isActive ?? true
            });
          } catch (e) {
            console.log(`Failed to import manufacturer ${manufacturer.name_ar || manufacturer.nameAr}:`, e);
          }
        }
        console.log('Manufacturers imported successfully');
      }
    } catch (e) {
      console.log('Manufacturers table not found or error importing manufacturers:', e);
    }

    // Import banks
    try {
      const externalBanks = await externalPool.query('SELECT * FROM banks ORDER BY id');
      if (externalBanks.rows.length > 0) {
        console.log(`Importing ${externalBanks.rows.length} banks...`);
        
        // Clear existing banks
        await db.execute('DELETE FROM banks');
        
        for (const bank of externalBanks.rows) {
          try {
            await db.insert(banks).values({
              logo: bank.logo,
              bankName: bank.bank_name || bank.bankName,
              nameEn: bank.name_en || bank.nameEn,
              accountName: bank.account_name || bank.accountName,
              accountNumber: bank.account_number || bank.accountNumber,
              iban: bank.iban,
              type: bank.type,
              isActive: bank.is_active ?? bank.isActive ?? true
            });
          } catch (e) {
            console.log(`Failed to import bank ${bank.bank_name || bank.bankName}:`, e);
          }
        }
        console.log('Banks imported successfully');
      }
    } catch (e) {
      console.log('Banks table not found or error importing banks:', e);
    }

    // Import vehicle categories if they exist
    try {
      const externalCategories = await externalPool.query('SELECT * FROM vehicle_categories ORDER BY id');
      if (externalCategories.rows.length > 0) {
        console.log(`Importing ${externalCategories.rows.length} vehicle categories...`);
        
        // Clear existing categories
        await db.execute('DELETE FROM vehicle_categories');
        
        for (const category of externalCategories.rows) {
          try {
            await db.insert(vehicleCategories).values({
              manufacturerId: category.manufacturer_id || category.manufacturerId,
              nameAr: category.name_ar || category.nameAr,
              nameEn: category.name_en || category.nameEn,
              isActive: category.is_active ?? category.isActive ?? true
            });
          } catch (e) {
            console.log(`Failed to import vehicle category ${category.name_ar || category.nameAr}:`, e);
          }
        }
        console.log('Vehicle categories imported successfully');
      }
    } catch (e) {
      console.log('Vehicle categories table not found or error importing categories:', e);
    }

    // Import vehicle trim levels if they exist
    try {
      const externalTrimLevels = await externalPool.query('SELECT * FROM vehicle_trim_levels ORDER BY id');
      if (externalTrimLevels.rows.length > 0) {
        console.log(`Importing ${externalTrimLevels.rows.length} vehicle trim levels...`);
        
        // Clear existing trim levels
        await db.execute('DELETE FROM vehicle_trim_levels');
        
        for (const trimLevel of externalTrimLevels.rows) {
          try {
            await db.insert(vehicleTrimLevels).values({
              categoryId: trimLevel.category_id || trimLevel.categoryId,
              nameAr: trimLevel.name_ar || trimLevel.nameAr,
              nameEn: trimLevel.name_en || trimLevel.nameEn,
              isActive: trimLevel.is_active ?? trimLevel.isActive ?? true
            });
          } catch (e) {
            console.log(`Failed to import trim level ${trimLevel.name_ar || trimLevel.nameAr}:`, e);
          }
        }
        console.log('Vehicle trim levels imported successfully');
      }
    } catch (e) {
      console.log('Vehicle trim levels table not found or error importing trim levels:', e);
    }

    console.log('External database import completed successfully');
    
  } catch (error) {
    console.error('Error importing from external database:', error);
    throw error;
  } finally {
    if (externalPool) {
      await externalPool.end();
    }
  }
}