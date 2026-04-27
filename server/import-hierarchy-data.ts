import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { manufacturers, vehicleCategories, vehicleTrimLevels } from '@shared/schema';
import { eq } from 'drizzle-orm';
import ws from "ws";
import * as fs from 'fs';
import * as path from 'path';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema: { manufacturers, vehicleCategories, vehicleTrimLevels } });

interface HierarchyData {
  brand_ar: string;
  brand_en: string;
  models: Array<{
    model_ar: string;
    model_en: string;
    trims: Array<{
      trim_ar: string;
      trim_en: string;
    }>;
  }>;
}

async function importHierarchyData() {
  try {
    console.log('🚀 بدء عملية استيراد بيانات التسلسل الهرمي...');
    
    // قراءة الملف
    const filePath = path.join(process.cwd(), 'attached_assets', 'Pasted--brand-ar-brand-en-Toyota-models-model-ar--1755431379333_1755431379334.txt');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const hierarchyData: HierarchyData[] = JSON.parse(fileContent);
    
    console.log(`📁 تم العثور على ${hierarchyData.length} شركة صانعة`);
    
    let manufacturersAdded = 0;
    let categoriesAdded = 0;
    let trimLevelsAdded = 0;
    
    for (const brandData of hierarchyData) {
      // التحقق من وجود الشركة المصنعة أو إنشاؤها
      let manufacturer = await db
        .select()
        .from(manufacturers)
        .where(eq(manufacturers.nameAr, brandData.brand_ar))
        .limit(1);
      
      if (manufacturer.length === 0) {
        console.log(`➕ إضافة شركة جديدة: ${brandData.brand_ar} (${brandData.brand_en})`);
        const [newManufacturer] = await db
          .insert(manufacturers)
          .values({
            nameAr: brandData.brand_ar,
            nameEn: brandData.brand_en || null,
            isActive: true
          })
          .returning();
        manufacturer = [newManufacturer];
        manufacturersAdded++;
      } else {
        // تحديث الاسم الإنجليزي إذا لم يكن موجوداً
        if (!manufacturer[0].nameEn && brandData.brand_en) {
          await db
            .update(manufacturers)
            .set({ nameEn: brandData.brand_en })
            .where(eq(manufacturers.id, manufacturer[0].id));
          console.log(`🔄 تحديث الاسم الإنجليزي للشركة: ${brandData.brand_ar}`);
        }
      }
      
      const manufacturerId = manufacturer[0].id;
      
      // معالجة الطرازات
      for (const modelData of brandData.models) {
        // التحقق من وجود الطراز أو إنشاؤه
        let category = await db
          .select()
          .from(vehicleCategories)
          .where(eq(vehicleCategories.nameAr, modelData.model_ar))
          .where(eq(vehicleCategories.manufacturerId, manufacturerId))
          .limit(1);
        
        if (category.length === 0) {
          console.log(`  ➕ إضافة طراز جديد: ${modelData.model_ar} (${modelData.model_en})`);
          const [newCategory] = await db
            .insert(vehicleCategories)
            .values({
              manufacturerId: manufacturerId,
              nameAr: modelData.model_ar,
              nameEn: modelData.model_en,
              isActive: true
            })
            .returning();
          category = [newCategory];
          categoriesAdded++;
        } else {
          // تحديث الاسم الإنجليزي إذا لم يكن موجوداً
          if (!category[0].nameEn && modelData.model_en) {
            await db
              .update(vehicleCategories)
              .set({ nameEn: modelData.model_en })
              .where(eq(vehicleCategories.id, category[0].id));
            console.log(`    🔄 تحديث الاسم الإنجليزي للطراز: ${modelData.model_ar}`);
          }
        }
        
        const categoryId = category[0].id;
        
        // معالجة درجات التجهيز
        for (const trimData of modelData.trims) {
          // التحقق من وجود درجة التجهيز أو إنشاؤها
          const existingTrim = await db
            .select()
            .from(vehicleTrimLevels)
            .where(eq(vehicleTrimLevels.nameAr, trimData.trim_ar))
            .where(eq(vehicleTrimLevels.categoryId, categoryId))
            .limit(1);
          
          if (existingTrim.length === 0) {
            console.log(`    ➕ إضافة درجة تجهيز جديدة: ${trimData.trim_ar} (${trimData.trim_en})`);
            await db
              .insert(vehicleTrimLevels)
              .values({
                categoryId: categoryId,
                nameAr: trimData.trim_ar,
                nameEn: trimData.trim_en,
                isActive: true
              });
            trimLevelsAdded++;
          } else {
            // تحديث الاسم الإنجليزي إذا لم يكن موجوداً
            if (!existingTrim[0].nameEn && trimData.trim_en) {
              await db
                .update(vehicleTrimLevels)
                .set({ nameEn: trimData.trim_en })
                .where(eq(vehicleTrimLevels.id, existingTrim[0].id));
              console.log(`      🔄 تحديث الاسم الإنجليزي لدرجة التجهيز: ${trimData.trim_ar}`);
            }
          }
        }
      }
    }
    
    console.log('\n✅ اكتملت عملية الاستيراد بنجاح!');
    console.log(`📊 الإحصائيات:`);
    console.log(`   - الشركات المضافة: ${manufacturersAdded}`);
    console.log(`   - الطرازات المضافة: ${categoriesAdded}`);
    console.log(`   - درجات التجهيز المضافة: ${trimLevelsAdded}`);
    
    // إحصائيات إجمالية
    const totalManufacturers = await db.select().from(manufacturers);
    const totalCategories = await db.select().from(vehicleCategories);
    const totalTrimLevels = await db.select().from(vehicleTrimLevels);
    
    console.log(`\n📈 الإجمالي في قاعدة البيانات:`);
    console.log(`   - إجمالي الشركات: ${totalManufacturers.length}`);
    console.log(`   - إجمالي الطرازات: ${totalCategories.length}`);
    console.log(`   - إجمالي درجات التجهيز: ${totalTrimLevels.length}`);
    
  } catch (error) {
    console.error('❌ خطأ في عملية الاستيراد:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// تنفيذ السكريبت
importHierarchyData()
  .then(() => {
    console.log('🎉 تم انهاء العملية بنجاح');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 فشل في عملية الاستيراد:', error);
    process.exit(1);
  });

export { importHierarchyData };