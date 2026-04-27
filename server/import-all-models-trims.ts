import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { manufacturers, vehicleCategories, vehicleTrimLevels } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
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

async function importAllModelsAndTrims() {
  try {
    console.log('🚀 بدء عملية استيراد جميع الطرازات ودرجات التجهيز...');
    
    // قراءة الملف
    const filePath = path.join(process.cwd(), 'attached_assets', 'Pasted--brand-ar-brand-en-Toyota-models-model-ar--1755431379333_1755431379334.txt');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const hierarchyData: HierarchyData[] = JSON.parse(fileContent);
    
    console.log(`📁 تم العثور على ${hierarchyData.length} شركة صانعة`);
    
    let categoriesAdded = 0;
    let trimLevelsAdded = 0;
    let brandCount = 0;
    
    for (const brandData of hierarchyData) {
      brandCount++;
      console.log(`\n[${brandCount}/${hierarchyData.length}] معالجة الشركة: ${brandData.brand_ar}`);
      
      // البحث عن الشركة المصنعة
      const manufacturer = await db
        .select()
        .from(manufacturers)
        .where(eq(manufacturers.nameAr, brandData.brand_ar))
        .limit(1);
      
      if (manufacturer.length === 0) {
        console.log(`⚠️  الشركة غير موجودة: ${brandData.brand_ar}`);
        continue;
      }
      
      const manufacturerId = manufacturer[0].id;
      
      // معالجة جميع الطرازات
      for (const modelData of brandData.models) {
        console.log(`  🔍 فحص الطراز: ${modelData.model_ar}`);
        
        // التحقق من وجود الطراز أو إنشاؤه
        let category = await db
          .select()
          .from(vehicleCategories)
          .where(and(
            eq(vehicleCategories.nameAr, modelData.model_ar),
            eq(vehicleCategories.manufacturerId, manufacturerId)
          ))
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
          console.log(`  ✓ الطراز موجود: ${modelData.model_ar}`);
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
        
        // معالجة جميع درجات التجهيز للطراز
        for (const trimData of modelData.trims) {
          console.log(`    🔍 فحص درجة التجهيز: ${trimData.trim_ar}`);
          
          // التحقق من وجود درجة التجهيز أو إنشاؤها
          const existingTrim = await db
            .select()
            .from(vehicleTrimLevels)
            .where(and(
              eq(vehicleTrimLevels.nameAr, trimData.trim_ar),
              eq(vehicleTrimLevels.categoryId, categoryId)
            ))
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
            console.log(`    ✓ درجة التجهيز موجودة: ${trimData.trim_ar}`);
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
      
      // فاصل زمني صغير
      if (brandCount % 3 === 0) {
        console.log(`⏸️  استراحة قصيرة... تم معالجة ${brandCount} شركة`);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    console.log('\n✅ اكتملت عملية الاستيراد الشاملة بنجاح!');
    console.log(`📊 الإحصائيات:`);
    console.log(`   - الطرازات المضافة: ${categoriesAdded}`);
    console.log(`   - درجات التجهيز المضافة: ${trimLevelsAdded}`);
    
    // إحصائيات إجمالية تفصيلية
    const totalManufacturers = await db.select().from(manufacturers);
    const totalCategories = await db.select().from(vehicleCategories);
    const totalTrimLevels = await db.select().from(vehicleTrimLevels);
    
    console.log(`\n📈 الإجمالي النهائي في قاعدة البيانات:`);
    console.log(`   - إجمالي الشركات: ${totalManufacturers.length}`);
    console.log(`   - إجمالي الطرازات: ${totalCategories.length}`);
    console.log(`   - إجمالي درجات التجهيز: ${totalTrimLevels.length}`);
    
    // عرض أمثلة من البيانات
    console.log(`\n📋 أمثلة على البيانات المدرجة:`);
    for (const manufacturer of totalManufacturers.slice(0, 3)) {
      const categories = await db
        .select()
        .from(vehicleCategories)
        .where(eq(vehicleCategories.manufacturerId, manufacturer.id))
        .limit(2);
      
      console.log(`   ${manufacturer.nameAr}:`);
      for (const category of categories) {
        const trims = await db
          .select()
          .from(vehicleTrimLevels)
          .where(eq(vehicleTrimLevels.categoryId, category.id))
          .limit(3);
        
        console.log(`     - ${category.nameAr} (${trims.length} درجات تجهيز)`);
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ في عملية الاستيراد:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// تنفيذ السكريبت
importAllModelsAndTrims()
  .then(() => {
    console.log('🎉 تم انهاء العملية الشاملة بنجاح');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 فشل في عملية الاستيراد:', error);
    process.exit(1);
  });

export { importAllModelsAndTrims };