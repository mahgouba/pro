import "dotenv/config";
import { Pool } from 'pg';

console.log('🔧 الإصلاح النهائي للسلسل الهرمي...');

async function finalFixHierarchy() {
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

    // 1. التحقق من البيانات الحالية
    console.log('\n📊 التحقق من البيانات الحالية...');
    
    const currentStats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM manufacturers WHERE is_active = true) as manufacturers_count,
        (SELECT COUNT(*) FROM vehicle_categories WHERE is_active = true) as categories_count,
        (SELECT COUNT(*) FROM vehicle_trim_levels WHERE is_active = true) as trim_levels_count,
        (SELECT COUNT(*) FROM inventory_items WHERE manufacturer_id IS NOT NULL) as inventory_with_ids_count,
        (SELECT COUNT(*) FROM inventory_items) as total_inventory_count
    `);
    
    const stats = currentStats.rows[0];
    console.log(`🏭 الشركات المصنعة: ${stats.manufacturers_count}`);
    console.log(`🚗 الفئات: ${stats.categories_count}`);
    console.log(`⚙️ درجات التجهيز: ${stats.trim_levels_count}`);
    console.log(`📦 عناصر المخزون المحدثة: ${stats.inventory_with_ids_count}/${stats.total_inventory_count}`);

    // 2. إعادة تعيين المعرفات إلى NULL
    console.log('\n🔄 إعادة تعيين المعرفات...');
    await pool.query(`
      UPDATE inventory_items 
      SET manufacturer_id = NULL, category_id = NULL, trim_level_id = NULL
    `);
    console.log('✅ تم إعادة تعيين المعرفات');

    // 3. تحديث المعرفات مرة أخرى
    console.log('\n🔄 تحديث المعرفات...');
    
    const allInventoryItems = await pool.query(`
      SELECT id, manufacturer, category, trim_level 
      FROM inventory_items 
      WHERE manufacturer IS NOT NULL AND category IS NOT NULL
      ORDER BY id
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

    // 4. التحقق من النتائج
    console.log('\n📊 التحقق من النتائج...');
    
    const finalStats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM manufacturers WHERE is_active = true) as manufacturers_count,
        (SELECT COUNT(*) FROM vehicle_categories WHERE is_active = true) as categories_count,
        (SELECT COUNT(*) FROM vehicle_trim_levels WHERE is_active = true) as trim_levels_count,
        (SELECT COUNT(*) FROM inventory_items WHERE manufacturer_id IS NOT NULL) as inventory_with_ids_count,
        (SELECT COUNT(*) FROM inventory_items) as total_inventory_count
    `);
    
    const finalStatsRow = finalStats.rows[0];
    console.log(`🏭 الشركات المصنعة: ${finalStatsRow.manufacturers_count}`);
    console.log(`🚗 الفئات: ${finalStatsRow.categories_count}`);
    console.log(`⚙️ درجات التجهيز: ${finalStatsRow.trim_levels_count}`);
    console.log(`📦 عناصر المخزون المحدثة: ${finalStatsRow.inventory_with_ids_count}/${finalStatsRow.total_inventory_count}`);

    // 5. اختبار مثال
    console.log('\n🧪 اختبار مثال...');
    const testExample = await pool.query(`
      SELECT i.id, i.manufacturer, i.category, i.trim_level,
             i.manufacturer_id, i.category_id, i.trim_level_id,
             m.name_ar as manufacturer_name,
             c.name_ar as category_name,
             t.name_ar as trim_level_name
      FROM inventory_items i
      LEFT JOIN manufacturers m ON i.manufacturer_id = m.id
      LEFT JOIN vehicle_categories c ON i.category_id = c.id
      LEFT JOIN vehicle_trim_levels t ON i.trim_level_id = t.id
      WHERE i.manufacturer = 'تويوتا' AND i.category = 'كامري'
      ORDER BY i.id 
      LIMIT 3
    `);
    
    console.log(`📊 مثال: ${testExample.rows.length} عنصر من تويوتا كامري`);
    testExample.rows.forEach(item => {
      console.log(`  - ID: ${item.id} | ${item.manufacturer} > ${item.category} > ${item.trim_level || 'N/A'}`);
      console.log(`    المعرفات: M:${item.manufacturer_id || 'NULL'}, C:${item.category_id || 'NULL'}, T:${item.trim_level_id || 'NULL'}`);
    });

    console.log('\n✅ تم الإصلاح النهائي للسلسل الهرمي بنجاح!');

  } catch (error) {
    console.error('❌ فشل في الإصلاح النهائي:', error);
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
finalFixHierarchy().then(() => {
  console.log('✅ تم الانتهاء من الإصلاح');
  process.exit(0);
}).catch((error) => {
  console.error('❌ فشل في الإصلاح:', error);
  process.exit(1);
}); 