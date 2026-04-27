import { Pool } from 'pg';
import { getDatabase } from './db';
import { users, inventoryItems, manufacturers, banks, vehicleCategories, vehicleTrimLevels } from '../shared/schema';

export async function exportToExternalDatabase(connectionString: string) {
  let externalPool: Pool | null = null;
  
  try {
    // Connect to external database
    externalPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    });

    const { db } = getDatabase();
    
    // Test connection first
    await externalPool.query('SELECT 1');
    console.log('Connected to external database successfully');

    // Create tables if they don't exist
    console.log('Creating tables in external database...');
    
    // Create users table
    await externalPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        job_title TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'seller',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Create manufacturers table
    await externalPool.query(`
      CREATE TABLE IF NOT EXISTS manufacturers (
        id SERIAL PRIMARY KEY,
        name_ar TEXT NOT NULL,
        name_en TEXT,
        logo TEXT,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Create banks table
    await externalPool.query(`
      CREATE TABLE IF NOT EXISTS banks (
        id SERIAL PRIMARY KEY,
        logo TEXT,
        bank_name TEXT NOT NULL,
        name_en TEXT,
        account_name TEXT NOT NULL,
        account_number TEXT NOT NULL,
        iban TEXT NOT NULL,
        type TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Create vehicle_categories table
    await externalPool.query(`
      CREATE TABLE IF NOT EXISTS vehicle_categories (
        id SERIAL PRIMARY KEY,
        manufacturer_id INTEGER REFERENCES manufacturers(id),
        name_ar TEXT NOT NULL,
        name_en TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Create vehicle_trim_levels table
    await externalPool.query(`
      CREATE TABLE IF NOT EXISTS vehicle_trim_levels (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES vehicle_categories(id),
        name_ar TEXT NOT NULL,
        name_en TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Create inventory_items table
    await externalPool.query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id SERIAL PRIMARY KEY,
        manufacturer TEXT NOT NULL,
        category TEXT NOT NULL,
        trim_level TEXT,
        engine_capacity TEXT NOT NULL,
        year INTEGER NOT NULL,
        exterior_color TEXT NOT NULL,
        interior_color TEXT NOT NULL,
        status TEXT NOT NULL,
        import_type TEXT NOT NULL,
        ownership_type TEXT NOT NULL DEFAULT 'ملك الشركة',
        location TEXT NOT NULL,
        chassis_number TEXT NOT NULL UNIQUE,
        images TEXT[] DEFAULT '{}',
        logo TEXT,
        notes TEXT,
        detailed_specifications TEXT,
        entry_date TIMESTAMP DEFAULT NOW() NOT NULL,
        price DECIMAL(10,2),
        is_sold BOOLEAN DEFAULT false NOT NULL,
        sold_date TIMESTAMP,
        reservation_date TIMESTAMP,
        reserved_by TEXT,
        sales_representative TEXT,
        reservation_note TEXT,
        customer_name TEXT,
        customer_phone TEXT,
        paid_amount DECIMAL(10,2),
        sale_price DECIMAL(10,2),
        payment_method TEXT,
        bank_name TEXT,
        sold_to_customer_name TEXT,
        sold_to_customer_phone TEXT,
        sold_by_sales_rep TEXT,
        sale_notes TEXT,
        mileage INTEGER
      );
    `);

    console.log('Tables created successfully');

    // Export users
    try {
      const localUsers = await db.select().from(users);
      if (localUsers.length > 0) {
        console.log(`Exporting ${localUsers.length} users...`);
        
        // Clear existing users
        await externalPool.query('DELETE FROM users');
        
        for (const user of localUsers) {
          await externalPool.query(
            'INSERT INTO users (name, job_title, phone_number, username, password, role) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (username) DO NOTHING',
            [user.name, user.jobTitle, user.phoneNumber, user.username, user.password, user.role]
          );
        }
        console.log('Users exported successfully');
      }
    } catch (e) {
      console.log('Error exporting users:', e);
    }

    // Export manufacturers
    try {
      const localManufacturers = await db.select().from(manufacturers);
      if (localManufacturers.length > 0) {
        console.log(`Exporting ${localManufacturers.length} manufacturers...`);
        
        // Clear existing manufacturers
        await externalPool.query('DELETE FROM manufacturers');
        
        for (const manufacturer of localManufacturers) {
          const result = await externalPool.query(
            'INSERT INTO manufacturers (name_ar, name_en, logo, is_active) VALUES ($1, $2, $3, $4) RETURNING id',
            [manufacturer.nameAr, manufacturer.nameEn, manufacturer.logo, manufacturer.isActive]
          );
          
          // Store mapping for foreign key relationships
          console.log(`Exported manufacturer: ${manufacturer.nameAr} -> ID: ${result.rows[0].id}`);
        }
        console.log('Manufacturers exported successfully');
      }
    } catch (e) {
      console.log('Error exporting manufacturers:', e);
    }

    // Export banks
    try {
      const localBanks = await db.select().from(banks);
      if (localBanks.length > 0) {
        console.log(`Exporting ${localBanks.length} banks...`);
        
        // Clear existing banks
        await externalPool.query('DELETE FROM banks');
        
        for (const bank of localBanks) {
          await externalPool.query(
            'INSERT INTO banks (logo, bank_name, name_en, account_name, account_number, iban, type, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [bank.logo, bank.bankName, bank.nameEn, bank.accountName, bank.accountNumber, bank.iban, bank.type, bank.isActive]
          );
        }
        console.log('Banks exported successfully');
      }
    } catch (e) {
      console.log('Error exporting banks:', e);
    }

    // Export vehicle categories if they exist
    try {
      const localCategories = await db.select().from(vehicleCategories);
      if (localCategories.length > 0) {
        console.log(`Exporting ${localCategories.length} vehicle categories...`);
        
        // Clear existing categories
        await externalPool.query('DELETE FROM vehicle_categories');
        
        for (const category of localCategories) {
          await externalPool.query(
            'INSERT INTO vehicle_categories (manufacturer_id, name_ar, name_en, is_active) VALUES ($1, $2, $3, $4)',
            [category.manufacturerId, category.nameAr, category.nameEn, category.isActive]
          );
        }
        console.log('Vehicle categories exported successfully');
      }
    } catch (e) {
      console.log('Vehicle categories table not found or error exporting categories:', e);
    }

    // Export vehicle trim levels if they exist
    try {
      const localTrimLevels = await db.select().from(vehicleTrimLevels);
      if (localTrimLevels.length > 0) {
        console.log(`Exporting ${localTrimLevels.length} vehicle trim levels...`);
        
        // Clear existing trim levels
        await externalPool.query('DELETE FROM vehicle_trim_levels');
        
        for (const trimLevel of localTrimLevels) {
          await externalPool.query(
            'INSERT INTO vehicle_trim_levels (category_id, name_ar, name_en, is_active) VALUES ($1, $2, $3, $4)',
            [trimLevel.categoryId, trimLevel.nameAr, trimLevel.nameEn, trimLevel.isActive]
          );
        }
        console.log('Vehicle trim levels exported successfully');
      }
    } catch (e) {
      console.log('Vehicle trim levels table not found or error exporting trim levels:', e);
    }

    // Export inventory items
    try {
      const localInventory = await db.select().from(inventoryItems);
      if (localInventory.length > 0) {
        console.log(`Exporting ${localInventory.length} inventory items...`);
        
        // Clear existing inventory
        await externalPool.query('DELETE FROM inventory_items');
        
        for (const item of localInventory) {
          await externalPool.query(
            `INSERT INTO inventory_items (
              manufacturer, category, trim_level, engine_capacity, year, exterior_color, interior_color,
              status, import_type, ownership_type, location, chassis_number, images, logo, notes,
              detailed_specifications, price, is_sold, sold_date, reservation_date, reserved_by,
              sales_representative, reservation_note, customer_name, customer_phone, paid_amount,
              sale_price, payment_method, bank_name, sold_to_customer_name, sold_to_customer_phone,
              sold_by_sales_rep, sale_notes, mileage
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34)`,
            [
              item.manufacturer, item.category, item.trimLevel, item.engineCapacity, item.year,
              item.exteriorColor, item.interiorColor, item.status, item.importType, item.ownershipType,
              item.location, item.chassisNumber, item.images || [], item.logo, item.notes,
              item.detailedSpecifications, item.price, item.isSold, item.soldDate, item.reservationDate,
              item.reservedBy, item.salesRepresentative, item.reservationNote, item.customerName,
              item.customerPhone, item.paidAmount, item.salePrice, item.paymentMethod, item.bankName,
              item.soldToCustomerName, item.soldToCustomerPhone, item.soldBySalesRep, item.saleNotes, item.mileage
            ]
          );
        }
        console.log('Inventory items exported successfully');
      }
    } catch (e) {
      console.log('Error exporting inventory items:', e);
    }

    console.log('Database export completed successfully');
    
  } catch (error) {
    console.error('Error exporting to external database:', error);
    throw error;
  } finally {
    if (externalPool) {
      await externalPool.end();
    }
  }
}