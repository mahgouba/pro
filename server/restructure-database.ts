import "dotenv/config";
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";

console.log('🚀 بدء إعادة هيكلة قاعدة البيانات...');

async function restructureDatabase() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required');
    }

    // إنشاء اتصال قاعدة البيانات
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    const db = drizzle(pool, { schema });

    console.log('✅ تم الاتصال بقاعدة البيانات');

    // 1. إنشاء جداول السلسل الهرمي إذا لم تكن موجودة
    console.log('📋 إنشاء جداول السلسل الهرمي...');
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS manufacturers (
        id SERIAL PRIMARY KEY,
        name_ar TEXT NOT NULL,
        name_en TEXT NOT NULL,
        logo TEXT,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS vehicle_categories (
        id SERIAL PRIMARY KEY,
        manufacturer_id INTEGER REFERENCES manufacturers(id) NOT NULL,
        name_ar TEXT NOT NULL,
        name_en TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS vehicle_trim_levels (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES vehicle_categories(id) NOT NULL,
        name_ar TEXT NOT NULL,
        name_en TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    console.log('✅ تم إنشاء جداول السلسل الهرمي');

    // 2. إضافة أعمدة جديدة لجدول المخزون
    console.log('🔧 إضافة أعمدة جديدة لجدول المخزون...');
    
    try {
      await db.execute(`
        ALTER TABLE inventory_items 
        ADD COLUMN IF NOT EXISTS manufacturer_id INTEGER REFERENCES manufacturers(id)
      `);
    } catch (error) {
      console.log('⚠️ العمود manufacturer_id موجود بالفعل');
    }

    try {
      await db.execute(`
        ALTER TABLE inventory_items 
        ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES vehicle_categories(id)
      `);
    } catch (error) {
      console.log('⚠️ العمود category_id موجود بالفعل');
    }

    try {
      await db.execute(`
        ALTER TABLE inventory_items 
        ADD COLUMN IF NOT EXISTS trim_level_id INTEGER REFERENCES vehicle_trim_levels(id)
      `);
    } catch (error) {
      console.log('⚠️ العمود trim_level_id موجود بالفعل');
    }

    console.log('✅ تم إضافة الأعمدة الجديدة');

    // 3. استخراج البيانات الفريدة من جدول المخزون
    console.log('📊 استخراج البيانات الفريدة...');
    
    const uniqueManufacturers = await db.execute(`
      SELECT DISTINCT manufacturer 
      FROM inventory_items 
      WHERE manufacturer IS NOT NULL AND manufacturer != ''
      ORDER BY manufacturer
    `);

    const uniqueCategories = await db.execute(`
      SELECT DISTINCT manufacturer, category 
      FROM inventory_items 
      WHERE manufacturer IS NOT NULL AND category IS NOT NULL 
      AND manufacturer != '' AND category != ''
      ORDER BY manufacturer, category
    `);

    const uniqueTrimLevels = await db.execute(`
      SELECT DISTINCT manufacturer, category, trim_level 
      FROM inventory_items 
      WHERE manufacturer IS NOT NULL AND category IS NOT NULL AND trim_level IS NOT NULL
      AND manufacturer != '' AND category != '' AND trim_level != ''
      ORDER BY manufacturer, category, trim_level
    `);

    console.log(`📈 تم العثور على ${uniqueManufacturers.rows.length} شركة مصنعة`);
    console.log(`📈 تم العثور على ${uniqueCategories.rows.length} فئة`);
    console.log(`📈 تم العثور على ${uniqueTrimLevels.rows.length} درجة تجهيز`);

    // 4. إدراج الشركات المصنعة
    console.log('🏭 إدراج الشركات المصنعة...');
    
    for (const row of uniqueManufacturers.rows) {
      const manufacturerName = row.manufacturer;
      
      // التحقق من وجود الشركة المصنعة
      const existing = await db.execute(`
        SELECT id FROM manufacturers WHERE name_ar = $1 OR name_en = $1
      `, [manufacturerName]);

      if (existing.rows.length === 0) {
        await db.execute(`
          INSERT INTO manufacturers (name_ar, name_en, logo, is_active)
          VALUES ($1, $1, $2, true)
        `, [manufacturerName, `/${manufacturerName.toLowerCase().replace(/\s+/g, '-')}.png`]);
        
        console.log(`✅ تم إضافة الشركة المصنعة: ${manufacturerName}`);
      }
    }

    // 5. إدراج الفئات
    console.log('🚗 إدراج الفئات...');
    
    for (const row of uniqueCategories.rows) {
      const manufacturerName = row.manufacturer;
      const categoryName = row.category;
      
      // الحصول على معرف الشركة المصنعة
      const manufacturerResult = await db.execute(`
        SELECT id FROM manufacturers WHERE name_ar = $1 OR name_en = $1
      `, [manufacturerName]);

      if (manufacturerResult.rows.length > 0) {
        const manufacturerId = manufacturerResult.rows[0].id;
        
        // التحقق من وجود الفئة
        const existingCategory = await db.execute(`
          SELECT id FROM vehicle_categories 
          WHERE manufacturer_id = $1 AND (name_ar = $2 OR name_en = $2)
        `, [manufacturerId, categoryName]);

        if (existingCategory.rows.length === 0) {
          await db.execute(`
            INSERT INTO vehicle_categories (manufacturer_id, name_ar, name_en, is_active)
            VALUES ($1, $2, $2, true)
          `, [manufacturerId, categoryName]);
          
          console.log(`✅ تم إضافة الفئة: ${categoryName} (${manufacturerName})`);
        }
      }
    }

    // 6. إدراج درجات التجهيز
    console.log('⚙️ إدراج درجات التجهيز...');
    
    for (const row of uniqueTrimLevels.rows) {
      const manufacturerName = row.manufacturer;
      const categoryName = row.category;
      const trimLevelName = row.trim_level;
      
      // الحصول على معرف الشركة المصنعة
      const manufacturerResult = await db.execute(`
        SELECT id FROM manufacturers WHERE name_ar = $1 OR name_en = $1
      `, [manufacturerName]);

      if (manufacturerResult.rows.length > 0) {
        const manufacturerId = manufacturerResult.rows[0].id;
        
        // الحصول على معرف الفئة
        const categoryResult = await db.execute(`
          SELECT id FROM vehicle_categories 
          WHERE manufacturer_id = $1 AND (name_ar = $2 OR name_en = $2)
        `, [manufacturerId, categoryName]);

        if (categoryResult.rows.length > 0) {
          const categoryId = categoryResult.rows[0].id;
          
          // التحقق من وجود درجة التجهيز
          const existingTrimLevel = await db.execute(`
            SELECT id FROM vehicle_trim_levels 
            WHERE category_id = $1 AND (name_ar = $2 OR name_en = $2)
          `, [categoryId, trimLevelName]);

          if (existingTrimLevel.rows.length === 0) {
            await db.execute(`
              INSERT INTO vehicle_trim_levels (category_id, name_ar, name_en, is_active)
              VALUES ($1, $2, $2, true)
            `, [categoryId, trimLevelName]);
            
            console.log(`✅ تم إضافة درجة التجهيز: ${trimLevelName} (${categoryName} - ${manufacturerName})`);
          }
        }
      }
    }

    // 7. تحديث جدول المخزون بالمعرفات الجديدة
    console.log('🔄 تحديث جدول المخزون...');
    
    const allInventoryItems = await db.execute(`
      SELECT id, manufacturer, category, trim_level 
      FROM inventory_items 
      WHERE manufacturer IS NOT NULL AND category IS NOT NULL
    `);

    let updatedCount = 0;
    
    for (const item of allInventoryItems.rows) {
      const manufacturerName = item.manufacturer;
      const categoryName = item.category;
      const trimLevelName = item.trim_level;
      
      // الحصول على معرف الشركة المصنعة
      const manufacturerResult = await db.execute(`
        SELECT id FROM manufacturers WHERE name_ar = $1 OR name_en = $1
      `, [manufacturerName]);

      if (manufacturerResult.rows.length > 0) {
        const manufacturerId = manufacturerResult.rows[0].id;
        
        // الحصول على معرف الفئة
        const categoryResult = await db.execute(`
          SELECT id FROM vehicle_categories 
          WHERE manufacturer_id = $1 AND (name_ar = $2 OR name_en = $2)
        `, [manufacturerId, categoryName]);

        if (categoryResult.rows.length > 0) {
          const categoryId = categoryResult.rows[0].id;
          
          let trimLevelId = null;
          if (trimLevelName) {
            // الحصول على معرف درجة التجهيز
            const trimLevelResult = await db.execute(`
              SELECT id FROM vehicle_trim_levels 
              WHERE category_id = $1 AND (name_ar = $2 OR name_en = $2)
            `, [categoryId, trimLevelName]);

            if (trimLevelResult.rows.length > 0) {
              trimLevelId = trimLevelResult.rows[0].id;
            }
          }
          
          // تحديث العنصر
          await db.execute(`
            UPDATE inventory_items 
            SET manufacturer_id = $1, category_id = $2, trim_level_id = $3
            WHERE id = $4
          `, [manufacturerId, categoryId, trimLevelId, item.id]);
          
          updatedCount++;
        }
      }
    }

    console.log(`✅ تم تحديث ${updatedCount} عنصر في المخزون`);

    // 8. عرض إحصائيات نهائية
    console.log('\n📊 الإحصائيات النهائية:');
    
    const finalManufacturers = await db.execute('SELECT COUNT(*) as count FROM manufacturers');
    const finalCategories = await db.execute('SELECT COUNT(*) as count FROM vehicle_categories');
    const finalTrimLevels = await db.execute('SELECT COUNT(*) as count FROM vehicle_trim_levels');
    const finalInventory = await db.execute('SELECT COUNT(*) as count FROM inventory_items WHERE manufacturer_id IS NOT NULL');

    console.log(`🏭 الشركات المصنعة: ${finalManufacturers.rows[0].count}`);
    console.log(`🚗 الفئات: ${finalCategories.rows[0].count}`);
    console.log(`⚙️ درجات التجهيز: ${finalTrimLevels.rows[0].count}`);
    console.log(`📦 عناصر المخزون المحدثة: ${finalInventory.rows[0].count}`);

    // إغلاق الاتصال
    await pool.end();
    console.log('\n✅ تم إعادة هيكلة قاعدة البيانات بنجاح!');

  } catch (error) {
    console.error('❌ فشل في إعادة هيكلة قاعدة البيانات:', error);
    throw error;
  }
}

// تشغيل السكريبت إذا تم استدعاؤه مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  restructureDatabase().then(() => {
    console.log('✅ تم الانتهاء من إعادة الهيكلة');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ فشل في إعادة الهيكلة:', error);
    process.exit(1);
  });
}

export { restructureDatabase }; 