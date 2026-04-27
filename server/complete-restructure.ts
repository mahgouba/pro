import "dotenv/config";
import { Pool } from 'pg';

console.log('🚀 إكمال إعادة هيكلة قاعدة البيانات...');

async function completeRestructure() {
  let pool;
  
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required');
    }

    // إنشاء اتصال قاعدة البيانات
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    console.log('✅ تم الاتصال بقاعدة البيانات');

    // 1. استخراج الفئات الفريدة
    console.log('📊 استخراج الفئات الفريدة...');
    
    const uniqueCategories = await pool.query(`
      SELECT DISTINCT manufacturer, category 
      FROM inventory_items 
      WHERE manufacturer IS NOT NULL AND category IS NOT NULL 
      AND manufacturer != '' AND category != ''
      ORDER BY manufacturer, category
    `);

    console.log(`📈 تم العثور على ${uniqueCategories.rows.length} فئة`);

    // 2. إدراج الفئات
    console.log('🚗 إدراج الفئات...');
    
    for (const row of uniqueCategories.rows) {
      const manufacturerName = row.manufacturer;
      const categoryName = row.category;
      
      // الحصول على معرف الشركة المصنعة
      const manufacturerResult = await pool.query(`
        SELECT id FROM manufacturers WHERE name_ar = $1 OR name_en = $1
      `, [manufacturerName]);

      if (manufacturerResult.rows.length > 0) {
        const manufacturerId = manufacturerResult.rows[0].id;
        
        // التحقق من وجود الفئة
        const existingCategory = await pool.query(`
          SELECT id FROM vehicle_categories 
          WHERE manufacturer_id = $1 AND (name_ar = $2 OR name_en = $2)
        `, [manufacturerId, categoryName]);

        if (existingCategory.rows.length === 0) {
          await pool.query(`
            INSERT INTO vehicle_categories (manufacturer_id, name_ar, name_en, is_active)
            VALUES ($1, $2, $2, true)
          `, [manufacturerId, categoryName]);
          
          console.log(`✅ تم إضافة الفئة: ${categoryName} (${manufacturerName})`);
        } else {
          console.log(`⚠️ الفئة موجودة: ${categoryName} (${manufacturerName})`);
        }
      }
    }

    // 3. استخراج درجات التجهيز الفريدة
    console.log('📊 استخراج درجات التجهيز الفريدة...');
    
    const uniqueTrimLevels = await pool.query(`
      SELECT DISTINCT manufacturer, category, trim_level 
      FROM inventory_items 
      WHERE manufacturer IS NOT NULL AND category IS NOT NULL AND trim_level IS NOT NULL
      AND manufacturer != '' AND category != '' AND trim_level != ''
      ORDER BY manufacturer, category, trim_level
    `);

    console.log(`📈 تم العثور على ${uniqueTrimLevels.rows.length} درجة تجهيز`);

    // 4. إدراج درجات التجهيز
    console.log('⚙️ إدراج درجات التجهيز...');
    
    for (const row of uniqueTrimLevels.rows) {
      const manufacturerName = row.manufacturer;
      const categoryName = row.category;
      const trimLevelName = row.trim_level;
      
      // الحصول على معرف الشركة المصنعة
      const manufacturerResult = await pool.query(`
        SELECT id FROM manufacturers WHERE name_ar = $1 OR name_en = $1
      `, [manufacturerName]);

      if (manufacturerResult.rows.length > 0) {
        const manufacturerId = manufacturerResult.rows[0].id;
        
        // الحصول على معرف الفئة
        const categoryResult = await pool.query(`
          SELECT id FROM vehicle_categories 
          WHERE manufacturer_id = $1 AND (name_ar = $2 OR name_en = $2)
        `, [manufacturerId, categoryName]);

        if (categoryResult.rows.length > 0) {
          const categoryId = categoryResult.rows[0].id;
          
          // التحقق من وجود درجة التجهيز
          const existingTrimLevel = await pool.query(`
            SELECT id FROM vehicle_trim_levels 
            WHERE category_id = $1 AND (name_ar = $2 OR name_en = $2)
          `, [categoryId, trimLevelName]);

          if (existingTrimLevel.rows.length === 0) {
            await pool.query(`
              INSERT INTO vehicle_trim_levels (category_id, name_ar, name_en, is_active)
              VALUES ($1, $2, $2, true)
            `, [categoryId, trimLevelName]);
            
            console.log(`✅ تم إضافة درجة التجهيز: ${trimLevelName} (${categoryName} - ${manufacturerName})`);
          } else {
            console.log(`⚠️ درجة التجهيز موجودة: ${trimLevelName} (${categoryName} - ${manufacturerName})`);
          }
        }
      }
    }

    // 5. تحديث جدول المخزون بالمعرفات الجديدة
    console.log('🔄 تحديث جدول المخزون...');
    
    const allInventoryItems = await pool.query(`
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
      const manufacturerResult = await pool.query(`
        SELECT id FROM manufacturers WHERE name_ar = $1 OR name_en = $1
      `, [manufacturerName]);

      if (manufacturerResult.rows.length > 0) {
        const manufacturerId = manufacturerResult.rows[0].id;
        
        // الحصول على معرف الفئة
        const categoryResult = await pool.query(`
          SELECT id FROM vehicle_categories 
          WHERE manufacturer_id = $1 AND (name_ar = $2 OR name_en = $2)
        `, [manufacturerId, categoryName]);

        if (categoryResult.rows.length > 0) {
          const categoryId = categoryResult.rows[0].id;
          
          let trimLevelId = null;
          if (trimLevelName) {
            // الحصول على معرف درجة التجهيز
            const trimLevelResult = await pool.query(`
              SELECT id FROM vehicle_trim_levels 
              WHERE category_id = $1 AND (name_ar = $2 OR name_en = $2)
            `, [categoryId, trimLevelName]);

            if (trimLevelResult.rows.length > 0) {
              trimLevelId = trimLevelResult.rows[0].id;
            }
          }
          
          // تحديث العنصر
          await pool.query(`
            UPDATE inventory_items 
            SET manufacturer_id = $1, category_id = $2, trim_level_id = $3
            WHERE id = $4
          `, [manufacturerId, categoryId, trimLevelId, item.id]);
          
          updatedCount++;
        }
      }
    }

    console.log(`✅ تم تحديث ${updatedCount} عنصر في المخزون`);

    // 6. عرض إحصائيات نهائية
    console.log('\n📊 الإحصائيات النهائية:');
    
    const finalManufacturers = await pool.query('SELECT COUNT(*) as count FROM manufacturers');
    const finalCategories = await pool.query('SELECT COUNT(*) as count FROM vehicle_categories');
    const finalTrimLevels = await pool.query('SELECT COUNT(*) as count FROM vehicle_trim_levels');
    const finalInventory = await pool.query('SELECT COUNT(*) as count FROM inventory_items WHERE manufacturer_id IS NOT NULL');

    console.log(`🏭 الشركات المصنعة: ${finalManufacturers.rows[0].count}`);
    console.log(`🚗 الفئات: ${finalCategories.rows[0].count}`);
    console.log(`⚙️ درجات التجهيز: ${finalTrimLevels.rows[0].count}`);
    console.log(`📦 عناصر المخزون المحدثة: ${finalInventory.rows[0].count}`);

    console.log('\n✅ تم إكمال إعادة هيكلة قاعدة البيانات بنجاح!');

  } catch (error) {
    console.error('❌ فشل في إكمال إعادة هيكلة قاعدة البيانات:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.end();
      console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل السكريبت
console.log('📝 تشغيل السكريبت...');
completeRestructure().then(() => {
  console.log('✅ تم الانتهاء من إعادة الهيكلة');
  process.exit(0);
}).catch((error) => {
  console.error('❌ فشل في إعادة الهيكلة:', error);
  process.exit(1);
}); 