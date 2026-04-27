import { db } from './db';
import { 
  manufacturers, 
  vehicleCategories, 
  vehicleTrimLevels, 
  inventoryItems,
  users,
  banks
} from '../shared/schema';
import bcrypt from 'bcryptjs';

async function quickImport() {
  console.log('🚀 بدء استيراد البيانات السريع...');
  
  try {
    console.log('✅ Database connection successful');

    // Import manufacturers first
    console.log('📦 استيراد الصانعين...');
    const manufacturersData = [
      { nameAr: "تويوتا", nameEn: "Toyota", logo: null },
      { nameAr: "نيسان", nameEn: "Nissan", logo: null },
      { nameAr: "هيونداي", nameEn: "Hyundai", logo: null },
      { nameAr: "كيا", nameEn: "Kia", logo: null },
      { nameAr: "مرسيدس", nameEn: "Mercedes", logo: null },
      { nameAr: "بي ام دبليو", nameEn: "BMW", logo: null },
      { nameAr: "اودي", nameEn: "Audi", logo: null },
      { nameAr: "لكزس", nameEn: "Lexus", logo: null },
      { nameAr: "لاند روفر", nameEn: "Land Rover", logo: null },
      { nameAr: "بورش", nameEn: "Porsche", logo: null }
    ];

    for (const mfr of manufacturersData) {
      await db.insert(manufacturers).values({
        nameAr: mfr.nameAr,
        nameEn: mfr.nameEn,
        logo: mfr.logo,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`  ✅ Added manufacturer: ${mfr.nameAr}`);
    }

    // Get manufacturer IDs
    const allManufacturers = await db.select().from(manufacturers);
    const manufacturerMap = new Map(allManufacturers.map(m => [m.nameAr, m.id]));

    // Import vehicle categories
    console.log('🚗 استيراد فئات المركبات...');
    const categoriesData = [
      { nameAr: "كامري", nameEn: "Camry", manufacturerNameAr: "تويوتا" },
      { nameAr: "كورولا", nameEn: "Corolla", manufacturerNameAr: "تويوتا" },
      { nameAr: "لاند كروزر", nameEn: "Land Cruiser", manufacturerNameAr: "تويوتا" },
      { nameAr: "برادو", nameEn: "Prado", manufacturerNameAr: "تويوتا" },
      { nameAr: "هايلكس", nameEn: "Hilux", manufacturerNameAr: "تويوتا" },
      { nameAr: "التيما", nameEn: "Altima", manufacturerNameAr: "نيسان" },
      { nameAr: "سنترا", nameEn: "Sentra", manufacturerNameAr: "نيسان" },
      { nameAr: "باترول", nameEn: "Patrol", manufacturerNameAr: "نيسان" },
      { nameAr: "إلنترا", nameEn: "Elantra", manufacturerNameAr: "هيونداي" },
      { nameAr: "سوناتا", nameEn: "Sonata", manufacturerNameAr: "هيونداي" },
      { nameAr: "توسان", nameEn: "Tucson", manufacturerNameAr: "هيونداي" },
      { nameAr: "سيراتو", nameEn: "Cerato", manufacturerNameAr: "كيا" },
      { nameAr: "سورنتو", nameEn: "Sorento", manufacturerNameAr: "كيا" },
      { nameAr: "E200", nameEn: "E200", manufacturerNameAr: "مرسيدس" },
      { nameAr: "S350", nameEn: "S350", manufacturerNameAr: "مرسيدس" },
      { nameAr: "X5", nameEn: "X5", manufacturerNameAr: "بي ام دبليو" },
      { nameAr: "320i", nameEn: "320i", manufacturerNameAr: "بي ام دبليو" }
    ];

    for (const category of categoriesData) {
      const manufacturerId = manufacturerMap.get(category.manufacturerNameAr);
      if (manufacturerId) {
        await db.insert(vehicleCategories).values({
          nameAr: category.nameAr,
          nameEn: category.nameEn,
          manufacturerId: manufacturerId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`  ✅ Added category: ${category.nameAr}`);
      }
    }

    // Import trim levels
    console.log('🎯 استيراد مستويات التريم...');
    const trimData = [
      { nameAr: "استاندر", nameEn: "Standard" },
      { nameAr: "فل كامل", nameEn: "Full Option" },
      { nameAr: "جراند", nameEn: "Grande" },
      { nameAr: "GLX", nameEn: "GLX" },
      { nameAr: "GLS", nameEn: "GLS" },
      { nameAr: "VXR", nameEn: "VXR" },
      { nameAr: "TXL", nameEn: "TXL" },
      { nameAr: "SE", nameEn: "SE" },
      { nameAr: "SV", nameEn: "SV" },
      { nameAr: "Premium", nameEn: "Premium" }
    ];

    for (const trim of trimData) {
      await db.insert(vehicleTrimLevels).values({
        nameAr: trim.nameAr,
        nameEn: trim.nameEn,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`  ✅ Added trim: ${trim.nameAr}`);
    }

    // Import sample inventory
    console.log('📋 استيراد المخزن...');
    const inventoryData = [
      {
        manufacturer: "تويوتا",
        category: "كامري",
        trimLevel: "فل كامل",
        engineCapacity: "2.5L",
        year: 2024,
        exteriorColor: "أبيض لؤلؤي",
        interiorColor: "بيج",
        status: "متوفر",
        importType: "شركة",
        ownershipType: "ملك الشركة",
        location: "المعرض",
        chassisNumber: "JTDKARFP8P3123456",
        images: [],
        notes: "سيارة جديدة بحالة ممتازة",
        price: "125000"
      },
      {
        manufacturer: "نيسان",
        category: "التيما", 
        trimLevel: "SV",
        engineCapacity: "2.5L",
        year: 2024,
        exteriorColor: "أسود",
        interiorColor: "أسود",
        status: "متوفر",
        importType: "شخصي",
        ownershipType: "ملك الشركة", 
        location: "المعرض",
        chassisNumber: "1N4BL4BV4PC123456",
        images: [],
        notes: "سيارة أنيقة ومريحة",
        price: "110000"
      },
      {
        manufacturer: "مرسيدس",
        category: "E200",
        trimLevel: "فل كامل",
        engineCapacity: "2.0L",
        year: 2023,
        exteriorColor: "فضي",
        interiorColor: "أسود",
        status: "في الطريق",
        importType: "شركة",
        ownershipType: "ملك الشركة",
        location: "الميناء", 
        chassisNumber: "WDDGF4KB1CA123456",
        images: [],
        notes: "سيارة فاخرة بمواصفات عالية",
        price: "185000"
      }
    ];

    for (const item of inventoryData) {
      await db.insert(inventoryItems).values({
        ...item,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`  ✅ Added vehicle: ${item.manufacturer} ${item.category}`);
    }

    console.log('✨ تم استيراد البيانات بنجاح!');
    console.log(`📊 تم استيراد: ${manufacturersData.length} صانع, ${categoriesData.length} فئة, ${trimData.length} تريم, ${inventoryData.length} مركبة`);
    
  } catch (error) {
    console.error('❌ خطأ في استيراد البيانات:', error);
    throw error;
  }
}

quickImport().then(() => {
  console.log('🎉 انتهت عملية الاستيراد');
  process.exit(0);
}).catch((error) => {
  console.error('💥 فشل في الاستيراد:', error);
  process.exit(1);
});