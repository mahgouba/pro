import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { db } from './db';
import { 
  manufacturers, 
  vehicleCategories, 
  vehicleTrimLevels, 
  inventoryItems,
  users,
  banks
} from '../shared/schema';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

// Set WebSocket constructor for Neon
neonConfig.webSocketConstructor = ws;

// External database connection
const EXTERNAL_DB_URL = 'postgresql://postgres:TueqQrTNoDNBPZoWIUFrIlxFUZdUmpWJ@shortline.proxy.rlwy.net:52512/railway';

async function recreateDatabase() {
  console.log('🚀 بدء إعادة تهيئة قاعدة البيانات...');
  
  try {
    // Connect to external database
    const externalPool = new Pool({ connectionString: EXTERNAL_DB_URL });
    const externalDb = drizzle({ client: externalPool });
    
    console.log('🔌 الاتصال بقاعدة البيانات الخارجية...');
    
    // Clear current database
    console.log('🧹 حذف البيانات الحالية...');
    await db.delete(inventoryItems);
    await db.delete(vehicleTrimLevels);  
    await db.delete(vehicleCategories);
    await db.delete(manufacturers);
    await db.delete(users);
    await db.delete(banks);
    
    // Import manufacturers
    console.log('📦 استيراد الصانعين...');
    const externalManufacturers = await externalDb.execute(`
      SELECT * FROM manufacturers ORDER BY name_ar
    `);
    
    for (const mfr of externalManufacturers.rows) {
      await db.insert(manufacturers).values({
        id: mfr.id,
        nameAr: mfr.name_ar,
        nameEn: mfr.name_en,
        logo: mfr.logo,
        isActive: mfr.is_active ?? true,
        createdAt: new Date(mfr.created_at || Date.now()),
        updatedAt: new Date(mfr.updated_at || Date.now())
      });
    }
    console.log(`✅ تم استيراد ${externalManufacturers.rows.length} صانع`);
    
    // Import vehicle categories
    console.log('📦 استيراد فئات المركبات...');
    const externalCategories = await externalDb.execute(`
      SELECT * FROM vehicle_categories ORDER BY name_ar
    `);
    
    for (const cat of externalCategories.rows) {
      await db.insert(vehicleCategories).values({
        id: cat.id,
        manufacturerId: cat.manufacturer_id,
        nameAr: cat.name_ar,
        nameEn: cat.name_en,
        isActive: cat.is_active ?? true,
        createdAt: new Date(cat.created_at || Date.now()),
        updatedAt: new Date(cat.updated_at || Date.now())
      });
    }
    console.log(`✅ تم استيراد ${externalCategories.rows.length} فئة`);
    
    // Import vehicle trim levels
    console.log('📦 استيراد درجات التجهيز...');
    const externalTrimLevels = await externalDb.execute(`
      SELECT * FROM vehicle_trim_levels ORDER BY name_ar
    `);
    
    for (const trim of externalTrimLevels.rows) {
      await db.insert(vehicleTrimLevels).values({
        id: trim.id,
        categoryId: trim.category_id,
        nameAr: trim.name_ar,
        nameEn: trim.name_en,
        isActive: trim.is_active ?? true,
        createdAt: new Date(trim.created_at || Date.now()),
        updatedAt: new Date(trim.updated_at || Date.now())
      });
    }
    console.log(`✅ تم استيراد ${externalTrimLevels.rows.length} درجة تجهيز`);
    
    // Import inventory items
    console.log('📦 استيراد عناصر المخزون...');
    const externalInventory = await externalDb.execute(`
      SELECT * FROM inventory_items ORDER BY id
    `);
    
    for (const item of externalInventory.rows) {
      try {
        await db.insert(inventoryItems).values({
          id: item.id,
          manufacturer: item.manufacturer,
          category: item.category,
          trimLevel: item.trim_level,
          modelYear: item.model_year,
          chassisNumber: item.chassis_number,
          engineNumber: item.engine_number,
          exteriorColor: item.exterior_color,
          interiorColor: item.interior_color,
          fuelType: item.fuel_type,
          transmission: item.transmission,
          mileage: item.mileage,
          condition: item.condition,
          purchasePrice: item.purchase_price,
          sellingPrice: item.selling_price,
          location: item.location,
          status: item.status,
          notes: item.notes,
          images: item.images ? JSON.stringify(item.images) : null,
          specifications: item.specifications ? JSON.stringify(item.specifications) : null,
          createdAt: new Date(item.created_at || Date.now()),
          updatedAt: new Date(item.updated_at || Date.now())
        });
      } catch (error) {
        console.warn(`⚠️ خطأ في استيراد المركبة ${item.chassis_number}:`, error);
      }
    }
    console.log(`✅ تم استيراد ${externalInventory.rows.length} عنصر مخزون`);
    
    // Import users
    console.log('📦 استيراد المستخدمين...');
    const externalUsers = await externalDb.execute(`
      SELECT * FROM users ORDER BY id
    `);
    
    for (const user of externalUsers.rows) {
      try {
        await db.insert(users).values({
          id: user.id,
          username: user.username,
          password: user.password,
          role: user.role,
          fullName: user.full_name,
          email: user.email,
          phone: user.phone,
          isActive: user.is_active ?? true,
          createdAt: new Date(user.created_at || Date.now()),
          updatedAt: new Date(user.updated_at || Date.now())
        });
      } catch (error) {
        console.warn(`⚠️ خطأ في استيراد المستخدم ${user.username}:`, error);
      }
    }
    console.log(`✅ تم استيراد ${externalUsers.rows.length} مستخدم`);
    
    // Import banks
    console.log('📦 استيراد البنوك...');
    const externalBanks = await externalDb.execute(`
      SELECT * FROM banks ORDER BY id
    `);
    
    for (const bank of externalBanks.rows) {
      try {
        await db.insert(banks).values({
          id: bank.id,
          nameAr: bank.name_ar,
          nameEn: bank.name_en,
          accountNumber: bank.account_number,
          iban: bank.iban,
          swiftCode: bank.swift_code,
          type: bank.type,
          isActive: bank.is_active ?? true,
          createdAt: new Date(bank.created_at || Date.now()),
          updatedAt: new Date(bank.updated_at || Date.now())
        });
      } catch (error) {
        console.warn(`⚠️ خطأ في استيراد البنك ${bank.name_ar}:`, error);
      }
    }
    console.log(`✅ تم استيراد ${externalBanks.rows.length} بنك`);
    
    // Close external connection
    await externalPool.end();
    
    console.log('🎉 تمت إعادة تهيئة قاعدة البيانات بنجاح!');
    
    // Display summary
    const stats = {
      manufacturers: externalManufacturers.rows.length,
      categories: externalCategories.rows.length,
      trimLevels: externalTrimLevels.rows.length,
      inventory: externalInventory.rows.length,
      users: externalUsers.rows.length,
      banks: externalBanks.rows.length
    };
    
    console.log('📊 ملخص البيانات المستوردة:');
    console.log(`   • الصانعين: ${stats.manufacturers}`);
    console.log(`   • الفئات: ${stats.categories}`);
    console.log(`   • درجات التجهيز: ${stats.trimLevels}`);
    console.log(`   • عناصر المخزون: ${stats.inventory}`);
    console.log(`   • المستخدمين: ${stats.users}`);
    console.log(`   • البنوك: ${stats.banks}`);
    
    return stats;
    
  } catch (error) {
    console.error('❌ خطأ في إعادة تهيئة قاعدة البيانات:', error);
    throw error;
  }
}

if (require.main === module) {
  recreateDatabase()
    .then(() => {
      console.log('✅ انتهت العملية بنجاح');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشلت العملية:', error);
      process.exit(1);
    });
}

export { recreateDatabase };