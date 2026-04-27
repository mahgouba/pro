import "dotenv/config";
import { Pool } from 'pg';

console.log('🧪 اختبار السلسل الهرمي الكامل...');

async function testHierarchy() {
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

    // 1. اختبار الشركات المصنعة
    console.log('\n🏭 اختبار الشركات المصنعة...');
    const manufacturers = await pool.query(`
      SELECT id, name_ar, name_en, logo 
      FROM manufacturers 
      WHERE is_active = true 
      ORDER BY name_ar 
      LIMIT 5
    `);
    
    console.log(`📊 عدد الشركات المصنعة: ${manufacturers.rows.length}`);
    manufacturers.rows.forEach(m => {
      console.log(`  - ${m.name_ar} (${m.name_en}) - ID: ${m.id}`);
    });

    // 2. اختبار الفئات
    console.log('\n🚗 اختبار الفئات...');
    const categories = await pool.query(`
      SELECT c.id, c.name_ar, c.name_en, m.name_ar as manufacturer_name
      FROM vehicle_categories c
      JOIN manufacturers m ON c.manufacturer_id = m.id
      WHERE c.is_active = true 
      ORDER BY m.name_ar, c.name_ar 
      LIMIT 10
    `);
    
    console.log(`📊 عدد الفئات: ${categories.rows.length}`);
    categories.rows.forEach(c => {
      console.log(`  - ${c.manufacturer_name} > ${c.name_ar} (${c.name_en}) - ID: ${c.id}`);
    });

    // 3. اختبار درجات التجهيز
    console.log('\n⚙️ اختبار درجات التجهيز...');
    const trimLevels = await pool.query(`
      SELECT t.id, t.name_ar, t.name_en, c.name_ar as category_name, m.name_ar as manufacturer_name
      FROM vehicle_trim_levels t
      JOIN vehicle_categories c ON t.category_id = c.id
      JOIN manufacturers m ON c.manufacturer_id = m.id
      WHERE t.is_active = true 
      ORDER BY m.name_ar, c.name_ar, t.name_ar 
      LIMIT 10
    `);
    
    console.log(`📊 عدد درجات التجهيز: ${trimLevels.rows.length}`);
    trimLevels.rows.forEach(t => {
      console.log(`  - ${t.manufacturer_name} > ${t.category_name} > ${t.name_ar} (${t.name_en}) - ID: ${t.id}`);
    });

    // 4. اختبار جدول المخزون مع المعرفات الجديدة
    console.log('\n📦 اختبار جدول المخزون مع المعرفات الجديدة...');
    const inventoryWithIds = await pool.query(`
      SELECT i.id, i.manufacturer, i.category, i.trim_level,
             m.name_ar as manufacturer_name,
             c.name_ar as category_name,
             t.name_ar as trim_level_name
      FROM inventory_items i
      LEFT JOIN manufacturers m ON i.manufacturer_id = m.id
      LEFT JOIN vehicle_categories c ON i.category_id = c.id
      LEFT JOIN vehicle_trim_levels t ON i.trim_level_id = t.id
      WHERE i.manufacturer_id IS NOT NULL
      ORDER BY i.id 
      LIMIT 10
    `);
    
    console.log(`📊 عدد عناصر المخزون المحدثة: ${inventoryWithIds.rows.length}`);
    inventoryWithIds.rows.forEach(item => {
      console.log(`  - ID: ${item.id} | ${item.manufacturer} > ${item.category} > ${item.trim_level || 'N/A'}`);
      console.log(`    المعرفات: M:${item.manufacturer_id || 'NULL'}, C:${item.category_id || 'NULL'}, T:${item.trim_level_id || 'NULL'}`);
    });

    // 5. اختبار إحصائيات السلسل الهرمي
    console.log('\n📊 إحصائيات السلسل الهرمي...');
    
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM manufacturers WHERE is_active = true) as manufacturers_count,
        (SELECT COUNT(*) FROM vehicle_categories WHERE is_active = true) as categories_count,
        (SELECT COUNT(*) FROM vehicle_trim_levels WHERE is_active = true) as trim_levels_count,
        (SELECT COUNT(*) FROM inventory_items WHERE manufacturer_id IS NOT NULL) as inventory_with_ids_count,
        (SELECT COUNT(*) FROM inventory_items) as total_inventory_count
    `);
    
    const statsRow = stats.rows[0];
    console.log(`🏭 الشركات المصنعة: ${statsRow.manufacturers_count}`);
    console.log(`🚗 الفئات: ${statsRow.categories_count}`);
    console.log(`⚙️ درجات التجهيز: ${statsRow.trim_levels_count}`);
    console.log(`📦 عناصر المخزون المحدثة: ${statsRow.inventory_with_ids_count}/${statsRow.total_inventory_count}`);

    // 6. اختبار مثال كامل لسلسل هرمي
    console.log('\n🔍 مثال كامل لسلسل هرمي...');
    const exampleHierarchy = await pool.query(`
      SELECT 
        m.id as manufacturer_id,
        m.name_ar as manufacturer_name,
        c.id as category_id,
        c.name_ar as category_name,
        t.id as trim_level_id,
        t.name_ar as trim_level_name,
        COUNT(i.id) as inventory_count
      FROM manufacturers m
      JOIN vehicle_categories c ON m.id = c.manufacturer_id
      JOIN vehicle_trim_levels t ON c.id = t.category_id
      LEFT JOIN inventory_items i ON t.id = i.trim_level_id
      WHERE m.name_ar = 'مرسيدس' AND c.name_ar = 'C-كلاس'
      GROUP BY m.id, m.name_ar, c.id, c.name_ar, t.id, t.name_ar
      ORDER BY t.name_ar
      LIMIT 5
    `);
    
    console.log(`📊 مثال: ${exampleHierarchy.rows.length} درجة تجهيز لمرسيدس C-كلاس`);
    exampleHierarchy.rows.forEach(row => {
      console.log(`  - ${row.manufacturer_name} > ${row.category_name} > ${row.trim_level_name} (${row.inventory_count} عنصر)`);
    });

    console.log('\n✅ تم اختبار السلسل الهرمي بنجاح!');

  } catch (error) {
    console.error('❌ فشل في اختبار السلسل الهرمي:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.end();
      console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل الاختبار
console.log('📝 تشغيل الاختبار...');
testHierarchy().then(() => {
  console.log('✅ تم الانتهاء من الاختبار');
  process.exit(0);
}).catch((error) => {
  console.error('❌ فشل في الاختبار:', error);
  process.exit(1);
}); 