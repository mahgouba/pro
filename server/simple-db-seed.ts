import { db } from './db';
import { 
  manufacturers, 
  inventoryItems,
  users,
  banks
} from '../shared/schema';
import bcrypt from 'bcryptjs';

async function simpleSeed() {
  console.log('🚀 بدء استيراد البيانات...');
  
  try {
    console.log('✅ Database connection successful');

    // Import manufacturers
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

    // Import sample inventory directly (without foreign keys)
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
      },
      {
        manufacturer: "بي ام دبليو",
        category: "X5",
        trimLevel: "xDrive40i",
        engineCapacity: "3.0L",
        year: 2024,
        exteriorColor: "أزرق معدني",
        interiorColor: "بيج",
        status: "متوفر",
        importType: "شركة",
        ownershipType: "ملك الشركة",
        location: "المعرض",
        chassisNumber: "5UXTY3C19P9123456",
        images: [],
        notes: "SUV فاخر بمواصفات رياضية",
        price: "295000"
      },
      {
        manufacturer: "لكزس",
        category: "ES300h",
        trimLevel: "Hybrid",
        engineCapacity: "2.5L Hybrid",
        year: 2024,
        exteriorColor: "أبيض",
        interiorColor: "أسود",
        status: "متوفر",
        importType: "شركة",
        ownershipType: "ملك الشركة",
        location: "المعرض",
        chassisNumber: "JTHB21FK2P2123456",
        images: [],
        notes: "سيارة هجين صديقة للبيئة",
        price: "165000"
      },
      {
        manufacturer: "تويوتا",
        category: "لاند كروزر",
        trimLevel: "VXR",
        engineCapacity: "4.0L V6",
        year: 2024,
        exteriorColor: "أسود",
        interiorColor: "بيج",
        status: "محجوز",
        importType: "شركة",
        ownershipType: "ملك الشركة",
        location: "المعرض",
        chassisNumber: "JTMHY7AJ2P4123456",
        images: [],
        notes: "سيارة دفع رباعي قوية ومتينة",
        price: "285000"
      },
      {
        manufacturer: "نيسان",
        category: "باترول",
        trimLevel: "Platinum",
        engineCapacity: "5.6L V8",
        year: 2023,
        exteriorColor: "أبيض لؤلؤي",
        interiorColor: "بيج",
        status: "متوفر",
        importType: "شخصي",
        ownershipType: "ملك الشركة",
        location: "المعرض",
        chassisNumber: "5N1AR2MN0PC123456",
        images: [],
        notes: "سيارة عائلية كبيرة وقوية",
        price: "195000"
      },
      {
        manufacturer: "هيونداي",
        category: "إلنترا",
        trimLevel: "Smart",
        engineCapacity: "1.6L",
        year: 2024,
        exteriorColor: "رمادي",
        interiorColor: "أسود",
        status: "متوفر",
        importType: "شركة",
        ownershipType: "ملك الشركة",
        location: "المعرض",
        chassisNumber: "KMHL14JA6PA123456",
        images: [],
        notes: "سيارة اقتصادية وعملية",
        price: "85000"
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
    console.log(`📊 تم استيراد: ${manufacturersData.length} صانع, ${inventoryData.length} مركبة`);
    
  } catch (error) {
    console.error('❌ خطأ في استيراد البيانات:', error);
    throw error;
  }
}

simpleSeed().then(() => {
  console.log('🎉 انتهت عملية الاستيراد');
  process.exit(0);
}).catch((error) => {
  console.error('💥 فشل في الاستيراد:', error);
  process.exit(1);
});