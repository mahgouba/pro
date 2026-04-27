import "dotenv/config";
import { Pool } from 'pg';

console.log('🚀 بدء إعادة هيكلة قاعدة البيانات...');

async function restructureDatabase() {
  let pool;
  
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required');
    }

    console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');

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

    // اختبار الاتصال
    const testResult = await pool.query('SELECT NOW() as current_time');
    console.log('✅ اختبار الاتصال:', testResult.rows[0].current_time);

    // 1. إنشاء جداول السلسل الهرمي إذا لم تكن موجودة
    console.log('📋 إنشاء جداول السلسل الهرمي...');
    
    await pool.query(`
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

    await pool.query(`
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

    await pool.query(`
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
      await pool.query(`
        ALTER TABLE inventory_items 
        ADD COLUMN IF NOT EXISTS manufacturer_id INTEGER REFERENCES manufacturers(id)
      `);
      console.log('✅ تم إضافة manufacturer_id');
    } catch (error) {
      console.log('⚠️ العمود manufacturer_id موجود بالفعل');
    }

    try {
      await pool.query(`
        ALTER TABLE inventory_items 
        ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES vehicle_categories(id)
      `);
      console.log('✅ تم إضافة category_id');
    } catch (error) {
      console.log('⚠️ العمود category_id موجود بالفعل');
    }

    try {
      await pool.query(`
        ALTER TABLE inventory_items 
        ADD COLUMN IF NOT EXISTS trim_level_id INTEGER REFERENCES vehicle_trim_levels(id)
      `);
      console.log('✅ تم إضافة trim_level_id');
    } catch (error) {
      console.log('⚠️ العمود trim_level_id موجود بالفعل');
    }

    console.log('✅ تم إضافة الأعمدة الجديدة');

    // 3. استخراج البيانات الفريدة من جدول المخزون
    console.log('📊 استخراج البيانات الفريدة...');
    
    const uniqueManufacturers = await pool.query(`
      SELECT DISTINCT manufacturer 
      FROM inventory_items 
      WHERE manufacturer IS NOT NULL AND manufacturer != ''
      ORDER BY manufacturer
    `);

    console.log(`📈 تم العثور على ${uniqueManufacturers.rows.length} شركة مصنعة`);
    console.log('🏭 الشركات المصنعة:', uniqueManufacturers.rows.map(r => r.manufacturer));

    // 4. إدراج الشركات المصنعة
    console.log('🏭 إدراج الشركات المصنعة...');
    
    for (const row of uniqueManufacturers.rows) {
      const manufacturerName = row.manufacturer;
      
      // التحقق من وجود الشركة المصنعة
      const existing = await pool.query(`
        SELECT id FROM manufacturers WHERE name_ar = $1 OR name_en = $1
      `, [manufacturerName]);

      if (existing.rows.length === 0) {
        await pool.query(`
          INSERT INTO manufacturers (name_ar, name_en, logo, is_active)
          VALUES ($1, $1, $2, true)
        `, [manufacturerName, `/${manufacturerName.toLowerCase().replace(/\s+/g, '-')}.png`]);
        
        console.log(`✅ تم إضافة الشركة المصنعة: ${manufacturerName}`);
      } else {
        console.log(`⚠️ الشركة المصنعة موجودة: ${manufacturerName}`);
      }
    }

    // 5. عرض إحصائيات نهائية
    console.log('\n📊 الإحصائيات النهائية:');
    
    const finalManufacturers = await pool.query('SELECT COUNT(*) as count FROM manufacturers');
    const finalInventory = await pool.query('SELECT COUNT(*) as count FROM inventory_items');

    console.log(`🏭 الشركات المصنعة: ${finalManufacturers.rows[0].count}`);
    console.log(`📦 عناصر المخزون: ${finalInventory.rows[0].count}`);

    console.log('\n✅ تم إعادة هيكلة قاعدة البيانات بنجاح!');

  } catch (error) {
    console.error('❌ فشل في إعادة هيكلة قاعدة البيانات:', error);
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
restructureDatabase().then(() => {
  console.log('✅ تم الانتهاء من إعادة الهيكلة');
  process.exit(0);
}).catch((error) => {
  console.error('❌ فشل في إعادة الهيكلة:', error);
  process.exit(1);
}); 