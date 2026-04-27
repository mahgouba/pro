import { db } from "./db";
import { users, inventoryItems, manufacturers, banks } from "@shared/schema";
import bcrypt from "bcryptjs";

const sampleManufacturers = [
  { nameAr: "مرسيدس", nameEn: "Mercedes", logo: null },
  { nameAr: "بي ام دبليو", nameEn: "BMW", logo: null },
  { nameAr: "لاند روفر", nameEn: "Land Rover", logo: null },
  { nameAr: "اودي", nameEn: "Audi", logo: null },
  { nameAr: "لكزس", nameEn: "Lexus", logo: null },
  { nameAr: "تويوتا", nameEn: "Toyota", logo: null },
  { nameAr: "نيسان", nameEn: "Nissan", logo: null },
  { nameAr: "بورش", nameEn: "Porsche", logo: null },
];

const sampleBanks = [
  {
    bankName: "مصرف الراجحي",
    accountName: "شركة البريمي للسيارات",
    accountNumber: "608010168000",
    iban: "SA1608010168000000000",
    type: "شركة",
    logo: null,
    isActive: true
  },
  {
    bankName: "البنك الأهلي السعودي",
    accountName: "شركة البريمي للسيارات",
    accountNumber: "71-100000-001",
    iban: "SA1571100000000000001",
    type: "شركة",
    logo: null,
    isActive: true
  },
  {
    bankName: "بنك الجزيرة",
    accountName: "شركة البريمي للسيارات",
    accountNumber: "0200-123456",
    iban: "SA1502000000000123456",
    type: "شركة",
    logo: null,
    isActive: true
  }
];

const sampleInventoryItems = [
  {
    manufacturer: "مرسيدس",
    category: "E200",
    trimLevel: "فل كامل",
    engineCapacity: "2.0L",
    year: 2024,
    exteriorColor: "أسود",
    interiorColor: "بيج",
    status: "متوفر",
    importType: "شركة",
    ownershipType: "ملك الشركة",
    location: "المعرض",
    chassisNumber: "WDDGF4KB1CA123456",
    images: [],
    notes: "سيارة جديدة بحالة ممتازة",
    price: "185000"
  },
  {
    manufacturer: "بي ام دبليو",
    category: "X5",
    trimLevel: "xDrive40i",
    engineCapacity: "3.0L",
    year: 2024,
    exteriorColor: "أبيض",
    interiorColor: "أسود",
    status: "في الطريق",
    importType: "شخصي",
    ownershipType: "ملك الشركة",
    location: "الميناء",
    chassisNumber: "5UXCR6C02L9123456",
    images: [],
    notes: "قادمة من ألمانيا",
    price: "320000"
  },
  {
    manufacturer: "لاند روفر",
    category: "رنج روفر",
    trimLevel: "Vogue",
    engineCapacity: "5.0L",
    year: 2023,
    exteriorColor: "رمادي",
    interiorColor: "بني",
    status: "قيد الصيانة",
    importType: "مستعمل شخصي",
    ownershipType: "معرض (وسيط)",
    location: "الورشة",
    chassisNumber: "SALGS2SE5NA123456",
    images: [],
    notes: "صيانة دورية",
    price: "280000"
  },
  {
    manufacturer: "اودي",
    category: "Q8",
    trimLevel: "Premium Plus",
    engineCapacity: "3.0L",
    year: 2024,
    exteriorColor: "أزرق",
    interiorColor: "بيج",
    status: "محجوز",
    importType: "شركة",
    ownershipType: "ملك الشركة",
    location: "المعرض",
    chassisNumber: "WA1CVAF18KD123456",
    images: [],
    notes: "محجوز للعميل أحمد محمد",
    price: "350000",
    reservedBy: "أحمد محمد",
    customerPhone: "0501234567",
    reservationDate: new Date()
  },
  {
    manufacturer: "لكزس",
    category: "LX 600",
    trimLevel: "Luxury",
    engineCapacity: "3.5L",
    year: 2024,
    exteriorColor: "أسود",
    interiorColor: "بني",
    status: "مباع",
    importType: "شخصي",
    ownershipType: "ملك الشركة",
    location: "المعرض",
    chassisNumber: "JTJHY7AX8M4123456",
    images: [],
    notes: "تم البيع",
    price: "450000",
    isSold: true,
    soldDate: new Date(),
    salePrice: "445000",
    soldToCustomerName: "سعد العتيبي",
    soldToCustomerPhone: "0507654321"
  }
];

export async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Clear existing data
    await db.delete(inventoryItems);
    await db.delete(banks);
    await db.delete(manufacturers);
    await db.delete(users);

    // Seed users
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const sellerPassword = await bcrypt.hash("seller123", 10);
    
    await db.insert(users).values([
      {
        name: "مدير النظام",
        jobTitle: "مدير",
        phoneNumber: "0500000000",
        username: "admin",
        password: hashedPassword,
        role: "admin"
      },
      {
        name: "موظف المبيعات",
        jobTitle: "مندوب مبيعات",
        phoneNumber: "0500000001",
        username: "seller",
        password: sellerPassword,
        role: "seller"
      }
    ]);

    // Seed manufacturers
    await db.insert(manufacturers).values(sampleManufacturers);

    // Seed banks
    await db.insert(banks).values(sampleBanks);

    // Seed inventory items
    await db.insert(inventoryItems).values(sampleInventoryItems);

    console.log("✅ Database seeding completed successfully!");
    console.log(`📊 Seeded: ${sampleInventoryItems.length} inventory items, ${sampleManufacturers.length} manufacturers, ${sampleBanks.length} banks, 2 users`);

  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}