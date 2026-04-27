import "dotenv/config";
import { Pool } from 'pg';

console.log('🔄 تحديث معرفات جدول المخزون...');

async function updateInventoryIds() {
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

    // تحديث جدول المخزون بالمعرفات الجديدة
    console.log('🔄 تحديث جدول المخزون...');
    
    const allInventoryItems = await pool.query(`
      SELECT id, manufacturer, category, trim_level 
      FROM inventory_items 
      WHERE manufacturer IS NOT NULL AND category IS NOT NULL
    `);

    console.log(`📦 تم العثور على ${allInventoryItems.rows.length} عنصر للتحديث`);

    let updatedCount = 0;
    let errorCount = 0;
    
    for (const item of allInventoryItems.rows) {
      try {
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
            
            if (updatedCount % 50 === 0) {
              console.log(`✅ تم تحديث ${updatedCount} عنصر...`);
            }
          } else {
            console.log(`⚠️ لم يتم العثور على الفئة: ${categoryName} (${manufacturerName})`);
            errorCount++;
          }
        } else {
          console.log(`⚠️ لم يتم العثور على الشركة المصنعة: ${manufacturerName}`);
          errorCount++;
        }
      } catch (error) {
        console.log(`❌ خطأ في تحديث العنصر ${item.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`✅ تم تحديث ${updatedCount} عنصر في المخزون`);
    console.log(`⚠️ عدد الأخطاء: ${errorCount}`);

    // عرض إحصائيات نهائية
    console.log('\n📊 الإحصائيات النهائية:');
    
    const finalManufacturers = await pool.query('SELECT COUNT(*) as count FROM manufacturers');
    const finalCategories = await pool.query('SELECT COUNT(*) as count FROM vehicle_categories');
    const finalTrimLevels = await pool.query('SELECT COUNT(*) as count FROM vehicle_trim_levels');
    const finalInventory = await pool.query('SELECT COUNT(*) as count FROM inventory_items WHERE manufacturer_id IS NOT NULL');

    console.log(`🏭 الشركات المصنعة: ${finalManufacturers.rows[0].count}`);
    console.log(`🚗 الفئات: ${finalCategories.rows[0].count}`);
    console.log(`⚙️ درجات التجهيز: ${finalTrimLevels.rows[0].count}`);
    console.log(`📦 عناصر المخزون المحدثة: ${finalInventory.rows[0].count}`);

    console.log('\n✅ تم إكمال تحديث معرفات جدول المخزون بنجاح!');

  } catch (error) {
    console.error('❌ فشل في تحديث معرفات جدول المخزون:', error);
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
updateInventoryIds().then(() => {
  console.log('✅ تم الانتهاء من التحديث');
  process.exit(0);
}).catch((error) => {
  console.error('❌ فشل في التحديث:', error);
  process.exit(1);
}); 