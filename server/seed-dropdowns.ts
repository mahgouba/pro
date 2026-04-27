import "dotenv/config";
import { db } from "./db";
import { eq } from "drizzle-orm";
import {
  manufacturers,
  vehicleCategories,
  vehicleTrimLevels,
  vehicleYears,
  engineCapacities,
  vehicleColors,
  vehicleStatuses,
  vehicleLocations,
  importTypes,
  ownershipTypes,
  banks,
} from "@shared/schema";

const manufacturersData = [
  { nameAr: "مرسيدس", nameEn: "Mercedes-Benz" },
  { nameAr: "بي ام دبليو", nameEn: "BMW" },
  { nameAr: "اودي", nameEn: "Audi" },
  { nameAr: "لكزس", nameEn: "Lexus" },
  { nameAr: "تويوتا", nameEn: "Toyota" },
  { nameAr: "نيسان", nameEn: "Nissan" },
  { nameAr: "لاند روفر", nameEn: "Land Rover" },
  { nameAr: "بورش", nameEn: "Porsche" },
  { nameAr: "جينيسيس", nameEn: "Genesis" },
  { nameAr: "كاديلاك", nameEn: "Cadillac" },
];

const categoriesByManufacturer: Record<string, { nameAr: string; nameEn: string }[]> = {
  "Mercedes-Benz": [
    { nameAr: "E-Class", nameEn: "E-Class" },
    { nameAr: "C-Class", nameEn: "C-Class" },
    { nameAr: "S-Class", nameEn: "S-Class" },
    { nameAr: "GLE", nameEn: "GLE" },
    { nameAr: "G-Class", nameEn: "G-Class" },
  ],
  BMW: [
    { nameAr: "الفئة الثالثة", nameEn: "3 Series" },
    { nameAr: "الفئة الخامسة", nameEn: "5 Series" },
    { nameAr: "الفئة السابعة", nameEn: "7 Series" },
    { nameAr: "X5", nameEn: "X5" },
    { nameAr: "X7", nameEn: "X7" },
  ],
  Audi: [
    { nameAr: "A4", nameEn: "A4" },
    { nameAr: "A6", nameEn: "A6" },
    { nameAr: "A8", nameEn: "A8" },
    { nameAr: "Q5", nameEn: "Q5" },
    { nameAr: "Q7", nameEn: "Q7" },
    { nameAr: "Q8", nameEn: "Q8" },
  ],
  Lexus: [
    { nameAr: "ES", nameEn: "ES" },
    { nameAr: "LS", nameEn: "LS" },
    { nameAr: "RX", nameEn: "RX" },
    { nameAr: "LX", nameEn: "LX" },
  ],
  Toyota: [
    { nameAr: "كامري", nameEn: "Camry" },
    { nameAr: "كورولا", nameEn: "Corolla" },
    { nameAr: "لاندكروزر", nameEn: "Land Cruiser" },
    { nameAr: "هايلكس", nameEn: "Hilux" },
    { nameAr: "برادو", nameEn: "Prado" },
  ],
  Nissan: [
    { nameAr: "التيما", nameEn: "Altima" },
    { nameAr: "باترول", nameEn: "Patrol" },
    { nameAr: "اكس تريل", nameEn: "X-Trail" },
  ],
  "Land Rover": [
    { nameAr: "رنج روفر", nameEn: "Range Rover" },
    { nameAr: "رنج روفر سبورت", nameEn: "Range Rover Sport" },
    { nameAr: "ديفندر", nameEn: "Defender" },
    { nameAr: "ديسكفري", nameEn: "Discovery" },
  ],
  Porsche: [
    { nameAr: "كايين", nameEn: "Cayenne" },
    { nameAr: "ماكان", nameEn: "Macan" },
    { nameAr: "911", nameEn: "911" },
    { nameAr: "باناميرا", nameEn: "Panamera" },
  ],
  Genesis: [
    { nameAr: "G70", nameEn: "G70" },
    { nameAr: "G80", nameEn: "G80" },
    { nameAr: "G90", nameEn: "G90" },
    { nameAr: "GV80", nameEn: "GV80" },
  ],
  Cadillac: [
    { nameAr: "اسكاليد", nameEn: "Escalade" },
    { nameAr: "XT5", nameEn: "XT5" },
    { nameAr: "CT5", nameEn: "CT5" },
  ],
};

const trimLevels = [
  { nameAr: "ستاندرد", nameEn: "Standard" },
  { nameAr: "نص فل", nameEn: "Mid Option" },
  { nameAr: "فل كامل", nameEn: "Full Option" },
  { nameAr: "خاص", nameEn: "Special Edition" },
];

const banksData = [
  { bankName: "مصرف الراجحي", nameEn: "Al Rajhi Bank", accountName: "شركة البريمي للسيارات", accountNumber: "608010168000", iban: "SA1608010168000000000", type: "شركة" },
  { bankName: "البنك الأهلي السعودي", nameEn: "SNB", accountName: "شركة البريمي للسيارات", accountNumber: "71-100000-001", iban: "SA1571100000000000001", type: "شركة" },
  { bankName: "بنك الرياض", nameEn: "Riyad Bank", accountName: "شركة البريمي للسيارات", accountNumber: "1230-456789", iban: "SA0820000001234567890", type: "شركة" },
  { bankName: "البنك السعودي الفرنسي", nameEn: "BSF", accountName: "شركة البريمي للسيارات", accountNumber: "0500-987654", iban: "SA1855000000050098765", type: "شركة" },
  { bankName: "بنك الجزيرة", nameEn: "Bank AlJazira", accountName: "شركة البريمي للسيارات", accountNumber: "0200-123456", iban: "SA1502000000000123456", type: "شركة" },
];

const exteriorColors = [
  { name: "أبيض", colorCode: "#FFFFFF" },
  { name: "أسود", colorCode: "#000000" },
  { name: "رمادي", colorCode: "#808080" },
  { name: "فضي", colorCode: "#C0C0C0" },
  { name: "أحمر", colorCode: "#B91C1C" },
  { name: "أزرق", colorCode: "#1E40AF" },
  { name: "أخضر", colorCode: "#166534" },
  { name: "بني", colorCode: "#78350F" },
];

const interiorColors = [
  { name: "أسود", colorCode: "#000000" },
  { name: "بيج", colorCode: "#D9C8A0" },
  { name: "بني", colorCode: "#6B3F1D" },
  { name: "أحمر", colorCode: "#7F1D1D" },
  { name: "رمادي", colorCode: "#4B5563" },
];

const statusesData = [
  { name: "متوفر", color: "#16A34A" },
  { name: "في الطريق", color: "#2563EB" },
  { name: "قيد الصيانة", color: "#F59E0B" },
  { name: "محجوز", color: "#7C3AED" },
  { name: "مباع", color: "#DC2626" },
];

const importTypesData = [
  { name: "شركة" },
  { name: "شخصي" },
  { name: "مستعمل شخصي" },
];

const ownershipTypesData = [
  { name: "ملك الشركة" },
  { name: "معرض (وسيط)" },
  { name: "أمانة" },
];

const locationsData = [
  { name: "المعرض" },
  { name: "المستودع" },
  { name: "الورشة" },
  { name: "الميناء" },
];

const engineCapacitiesData = [
  { capacity: "1.5L" }, { capacity: "2.0L" }, { capacity: "2.5L" },
  { capacity: "3.0L" }, { capacity: "3.5L" }, { capacity: "4.0L" },
  { capacity: "5.0L" }, { capacity: "V6" }, { capacity: "V8" }, { capacity: "V12" },
];

async function seed() {
  console.log("🌱 Seeding dropdown data...");

  // Manufacturers
  const insertedManufacturers = await db
    .insert(manufacturers)
    .values(manufacturersData)
    .onConflictDoNothing()
    .returning();
  const allManufacturers = insertedManufacturers.length
    ? insertedManufacturers
    : await db.select().from(manufacturers);
  console.log(`✅ Manufacturers: ${allManufacturers.length}`);

  // Categories per manufacturer
  let catCount = 0;
  for (const m of allManufacturers) {
    const cats = categoriesByManufacturer[m.nameEn || ""];
    if (!cats) continue;
    const existing = await db
      .select()
      .from(vehicleCategories)
      .where(eq(vehicleCategories.manufacturerId, m.id));
    if (existing.length > 0) continue;
    const inserted = await db
      .insert(vehicleCategories)
      .values(cats.map((c) => ({ ...c, manufacturerId: m.id })))
      .returning();
    catCount += inserted.length;

    // Trim levels per category
    for (const cat of inserted) {
      await db
        .insert(vehicleTrimLevels)
        .values(trimLevels.map((t) => ({ ...t, categoryId: cat.id })))
        .onConflictDoNothing();
    }
  }
  console.log(`✅ Categories added: ${catCount}`);

  // Years (current year + 1 down to 10 years back)
  const now = new Date().getFullYear();
  const yearsToInsert = Array.from({ length: 11 }, (_, i) => ({
    year: now + 1 - i,
  }));
  await db.insert(vehicleYears).values(yearsToInsert).onConflictDoNothing();
  console.log(`✅ Years seeded`);

  // Engine capacities
  await db
    .insert(engineCapacities)
    .values(engineCapacitiesData)
    .onConflictDoNothing();
  console.log(`✅ Engine capacities seeded`);

  // Colors
  await db
    .insert(vehicleColors)
    .values([
      ...exteriorColors.map((c) => ({ ...c, colorType: "exterior" })),
      ...interiorColors.map((c) => ({ ...c, colorType: "interior" })),
    ])
    .onConflictDoNothing();
  console.log(`✅ Colors seeded`);

  // Statuses
  await db.insert(vehicleStatuses).values(statusesData).onConflictDoNothing();
  console.log(`✅ Statuses seeded`);

  // Import types
  await db.insert(importTypes).values(importTypesData).onConflictDoNothing();
  console.log(`✅ Import types seeded`);

  // Ownership types
  await db
    .insert(ownershipTypes)
    .values(ownershipTypesData)
    .onConflictDoNothing();
  console.log(`✅ Ownership types seeded`);

  // Vehicle locations
  await db
    .insert(vehicleLocations)
    .values(locationsData)
    .onConflictDoNothing();
  console.log(`✅ Locations seeded`);

  // Banks
  await db.insert(banks).values(banksData).onConflictDoNothing();
  console.log(`✅ Banks seeded`);

  console.log("🎉 Done!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
