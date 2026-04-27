import { storage } from './storage.ts';

const luxuryVehicles = [
  // Range Rover Collection (10 vehicles)
  {
    manufacturer: "لاند روفر",
    category: "رنج روفر فيلار",
    trimLevel: "فل كامل",
    engineCapacity: "3.0L V6",
    year: 2024,
    exteriorColor: "أبيض لؤلؤي",
    interiorColor: "بني فاخر",
    status: "متوفر",
    importType: "شركة",
    ownershipType: "ملك الشركة",
    location: "المعرض",
    chassisNumber: "RR2024001VLR",
    price: "285000.00",
    notes: "رنج روفر فيلار 2024 فل كامل مع جميع الخيارات"
  },
  {
    manufacturer: "لاند روفر",
    category: "رنج روفر إيفوك",
    trimLevel: "ستاندرد",
    engineCapacity: "2.0L Turbo",
    year: 2023,
    exteriorColor: "أسود لامع",
    interiorColor: "أسود مع تطعيمات",
    status: "متوفر",
    importType: "شخصي",
    ownershipType: "ملك الشركة",
    location: "المستودع الرئيسي",
    chassisNumber: "RR2023002EVQ",
    price: "195000.00",
    notes: "رنج روفر إيفوك حالة ممتازة"
  },
  {
    manufacturer: "لاند روفر",
    category: "رنج روفر سبورت",
    trimLevel: "فل كامل",
    engineCapacity: "5.0L V8",
    year: 2024,
    exteriorColor: "رمادي ماتي",
    interiorColor: "أحمر جلد",
    status: "في الطريق",
    importType: "شركة",
    ownershipType: "ملك الشركة",
    location: "الميناء",
    chassisNumber: "RR2024003SPT",
    price: "395000.00",
    notes: "رنج روفر سبورت محرك V8 قوة عالية"
  },
  {
    manufacturer: "لاند روفر",
    category: "رنج روفر فوغ",
    trimLevel: "خاص",
    engineCapacity: "4.4L V8",
    year: 2023,
    exteriorColor: "أزرق معدني",
    interiorColor: "بيج فاخر",
    status: "متوفر",
    importType: "شخصي",
    ownershipType: "ملك الشركة",
    location: "المعرض",
    chassisNumber: "RR2023004VGE",
    price: "475000.00",
    notes: "رنج روفر فوغ تجهيزات خاصة"
  },
  {
    manufacturer: "لاند روفر",
    category: "رنج روفر",
    trimLevel: "فل كامل",
    engineCapacity: "5.0L V8 SC",
    year: 2024,
    exteriorColor: "ذهبي معدني",
    interiorColor: "أسود مع خيوط ذهبية",
    status: "محجوز",
    importType: "شركة",
    ownershipType: "ملك الشركة",
    location: "المعرض",
    chassisNumber: "RR2024005RNG",
    price: "650000.00",
    reservedBy: "admin",
    reservationNote: "محجوز لعميل VIP",
    notes: "رنج روفر الفئة الأولى مع جميع الكماليات"
  },
  
  // Mercedes Collection (12 vehicles)
  {
    manufacturer: "مرسيدس",
    category: "S500",
    trimLevel: "فل كامل",
    engineCapacity: "4.0L V8 Biturbo",
    year: 2024,
    exteriorColor: "أسود أوبسيديان",
    interiorColor: "بيج ناباليدر",
    status: "متوفر",
    importType: "شركة",
    ownershipType: "ملك الشركة",
    location: "المعرض",
    chassisNumber: "MB2024001S500",
    price: "485000.00",
    notes: "مرسيدس S500 أحدث إصدار"
  },
  {
    manufacturer: "مرسيدس",
    category: "E200",
    trimLevel: "ستاندرد",
    engineCapacity: "2.0L Turbo",
    year: 2023,
    exteriorColor: "أبيض صدفي",
    interiorColor: "أسود أريل",
    status: "متوفر",
    importType: "شخصي",
    ownershipType: "ملك الشركة",
    location: "المستودع الرئيسي",
    chassisNumber: "MB2023002E200",
    price: "235000.00",
    notes: "مرسيدس E200 حالة ممتازة"
  },
  {
    manufacturer: "مرسيدس",
    category: "GLE450",
    trimLevel: "فل كامل",
    engineCapacity: "3.0L V6 Turbo",
    year: 2024,
    exteriorColor: "فضي معدني",
    interiorColor: "بني إسبريسو",
    status: "في الطريق",
    importType: "شركة",
    ownershipType: "ملك الشركة",
    location: "الميناء",
    chassisNumber: "MB2024003GLE",
    price: "365000.00",
    notes: "مرسيدس GLE450 SUV فاخر"
  },
  {
    manufacturer: "مرسيدس",
    category: "C300",
    trimLevel: "خاص",
    engineCapacity: "2.0L Turbo",
    year: 2023,
    exteriorColor: "أحمر كاردينال",
    interiorColor: "أسود جلد محبب",
    status: "متوفر",
    importType: "شخصي",
    ownershipType: "ملك الشركة",
    location: "المعرض",
    chassisNumber: "MB2023004C300",
    price: "275000.00",
    notes: "مرسيدس C300 تجهيزات خاصة"
  },
  {
    manufacturer: "مرسيدس",
    category: "G63 AMG",
    trimLevel: "فل كامل",
    engineCapacity: "4.0L V8 Biturbo",
    year: 2024,
    exteriorColor: "أسود مات",
    interiorColor: "أحمر نابا",
    status: "في الصيانة",
    importType: "شركة",
    ownershipType: "ملك الشركة",
    location: "الورشة",
    chassisNumber: "MB2024005G63",
    price: "875000.00",
    notes: "مرسيدس G63 AMG قوة استثنائية"
  },
  
  // Lexus Collection (10 vehicles)
  {
    manufacturer: "لكزس",
    category: "LS500",
    trimLevel: "فل كامل",
    engineCapacity: "3.5L V6 Hybrid",
    year: 2024,
    exteriorColor: "أبيض لؤلؤي",
    interiorColor: "بني كونياك",
    status: "متوفر",
    importType: "شركة",
    ownershipType: "ملك الشركة",
    location: "المعرض",
    chassisNumber: "LX2024001LS5",
    price: "425000.00",
    notes: "لكزس LS500 هايبرد فاخر"
  },
  {
    manufacturer: "لكزس",
    category: "LX600",
    trimLevel: "فل كامل",
    engineCapacity: "3.5L V6 Turbo",
    year: 2023,
    exteriorColor: "رمادي غرافيت",
    interiorColor: "أسود مع تطعيمات خشبية",
    status: "متوفر",
    importType: "شخصي",
    ownershipType: "ملك الشركة",
    location: "المستودع الرئيسي",
    chassisNumber: "LX2023002LX6",
    price: "485000.00",
    notes: "لكزس LX600 SUV كامل المواصفات"
  },
  {
    manufacturer: "لكزس",
    category: "ES350",
    trimLevel: "ستاندرد",
    engineCapacity: "3.5L V6",
    year: 2023,
    exteriorColor: "فضي معدني",
    interiorColor: "بيج نابا",
    status: "في الطريق",
    importType: "شركة",
    ownershipType: "ملك الشركة",
    location: "الميناء",
    chassisNumber: "LX2023003ES3",
    price: "185000.00",
    notes: "لكزس ES350 سيدان أنيق"
  },
  {
    manufacturer: "لكزس",
    category: "GX460",
    trimLevel: "خاص",
    engineCapacity: "4.6L V8",
    year: 2024,
    exteriorColor: "أزرق عميق",
    interiorColor: "بني جلد طبيعي",
    status: "متوفر",
    importType: "شخصي",
    ownershipType: "ملك الشركة",
    location: "المعرض",
    chassisNumber: "LX2024004GX4",
    price: "295000.00",
    notes: "لكزس GX460 قدرة عالية على الطرق الوعرة"
  },
  
  // Genesis Collection (8 vehicles)
  {
    manufacturer: "جينيسيس",
    category: "G90",
    trimLevel: "فل كامل",
    engineCapacity: "3.3L V6 Turbo",
    year: 2024,
    exteriorColor: "أسود ماتي",
    interiorColor: "بيج نابا فاخر",
    status: "متوفر",
    importType: "شركة",
    ownershipType: "ملك الشركة",
    location: "المعرض",
    chassisNumber: "GN2024001G90",
    price: "385000.00",
    notes: "جينيسيس G90 سيدان فاخر بمواصفات عالية"
  },
  {
    manufacturer: "جينيسيس",
    category: "GV80",
    trimLevel: "فل كامل",
    engineCapacity: "3.5L V6 Turbo",
    year: 2023,
    exteriorColor: "أبيض صدفي",
    interiorColor: "أسود مع خيوط حمراء",
    status: "متوفر",
    importType: "شخصي",
    ownershipType: "ملك الشركة",
    location: "المستودع الرئيسي",
    chassisNumber: "GN2023002GV8",
    price: "325000.00",
    notes: "جينيسيس GV80 SUV كوري فاخر"
  },
  {
    manufacturer: "جينيسيس",
    category: "G70",
    trimLevel: "ستاندرد",
    engineCapacity: "2.0L Turbo",
    year: 2023,
    exteriorColor: "رمادي تيتانيوم",
    interiorColor: "أحمر جلد",
    status: "في الطريق",
    importType: "شركة",
    ownershipType: "ملك الشركة",
    location: "الميناء",
    chassisNumber: "GN2023003G70",
    price: "195000.00",
    notes: "جينيسيس G70 سيدان رياضي"
  },
  
  // Nissan Collection (5 vehicles)
  {
    manufacturer: "نيسان",
    category: "باترول بلاتينيوم",
    trimLevel: "فل كامل",
    engineCapacity: "5.6L V8",
    year: 2024,
    exteriorColor: "أبيض لؤلؤي",
    interiorColor: "بني جلد فاخر",
    status: "متوفر",
    importType: "شركة",
    ownershipType: "ملك الشركة",
    location: "المعرض",
    chassisNumber: "NS2024001PTL",
    price: "295000.00",
    notes: "نيسان باترول بلاتينيوم محرك V8 قوي"
  },
  {
    manufacturer: "نيسان",
    category: "أرمادا",
    trimLevel: "خاص",
    engineCapacity: "5.6L V8",
    year: 2023,
    exteriorColor: "أسود معدني",
    interiorColor: "بيج جلد",
    status: "متوفر",
    importType: "شخصي",
    ownershipType: "ملك الشركة",
    location: "المستودع الرئيسي",
    chassisNumber: "NS2023002ARM",
    price: "235000.00",
    notes: "نيسان أرمادا SUV كبير للعائلات"
  },
  {
    manufacturer: "نيسان",
    category: "التيما",
    trimLevel: "ستاندرد",
    engineCapacity: "2.5L",
    year: 2023,
    exteriorColor: "فضي متألق",
    interiorColor: "أسود قماش",
    status: "في الطريق",
    importType: "مستعمل شخصي",
    ownershipType: "ملك الشركة",
    location: "الميناء",
    chassisNumber: "NS2023003ALT",
    price: "85000.00",
    notes: "نيسان التيما مستعملة حالة جيدة"
  },
  
  // Bentley Collection (5 vehicles)
  {
    manufacturer: "بنتلي",
    category: "كونتيننتال GT",
    trimLevel: "فل كامل",
    engineCapacity: "6.0L W12",
    year: 2024,
    exteriorColor: "أزرق ملكي",
    interiorColor: "بيج مع تطعيمات ذهبية",
    status: "متوفر",
    importType: "شركة",
    ownershipType: "ملك الشركة",
    location: "المعرض",
    chassisNumber: "BT2024001CGT",
    price: "985000.00",
    notes: "بنتلي كونتيننتال GT محرك W12 فاخر جداً"
  },
  {
    manufacturer: "بنتلي",
    category: "بنتايغا",
    trimLevel: "فل كامل",
    engineCapacity: "4.0L V8 Turbo",
    year: 2023,
    exteriorColor: "أسود بيانو",
    interiorColor: "أحمر جلد برتقالي",
    status: "متوفر",
    importType: "شخصي",
    ownershipType: "ملك الشركة",
    location: "المعرض",
    chassisNumber: "BT2023002BTG",
    price: "785000.00",
    notes: "بنتلي بنتايغا SUV فائق الفخامة"
  },
  {
    manufacturer: "بنتلي",
    category: "فلايينغ سبير",
    trimLevel: "خاص",
    engineCapacity: "6.0L W12",
    year: 2024,
    exteriorColor: "أبيض مصقول",
    interiorColor: "بني غامق مع خشب الجوز",
    status: "محجوز",
    importType: "شركة",
    ownershipType: "ملك الشركة",
    location: "المعرض",
    chassisNumber: "BT2024003FLY",
    price: "1250000.00",
    reservedBy: "admin",
    reservationNote: "محجوز لعميل خاص",
    notes: "بنتلي فلايينغ سبير الإصدار الخاص"
  }
];

async function seedLuxuryVehicles() {
  console.log('🚗 بدء إضافة السيارات الفاخرة...');
  
  try {
    let successCount = 0;
    let errorCount = 0;

    for (const vehicle of luxuryVehicles) {
      try {
        await storage.createInventoryItem(vehicle);
        successCount++;
        console.log(`✅ تمت إضافة: ${vehicle.manufacturer} ${vehicle.category} (${vehicle.year})`);
      } catch (error) {
        errorCount++;
        console.error(`❌ فشل في إضافة: ${vehicle.manufacturer} ${vehicle.category}`, error);
      }
    }

    console.log(`\n🎉 انتهت عملية الإضافة:`);
    console.log(`   ✅ تم إضافة بنجاح: ${successCount} سيارة`);
    console.log(`   ❌ فشل في الإضافة: ${errorCount} سيارة`);
    console.log(`   📊 إجمالي السيارات المضافة: ${successCount} من ${luxuryVehicles.length}`);
    
  } catch (error) {
    console.error('خطأ في عملية إضافة السيارات:', error);
  }
}

// Export for use in other files
export { seedLuxuryVehicles, luxuryVehicles };