import "dotenv/config";
import { db } from "./db";
import { users, inventoryItems, manufacturers, banks, companies } from "@shared/schema";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const [adminUser] = await db.insert(users).values({
      name: "مدير النظام",
      jobTitle: "مدير عام",
      phoneNumber: "+966123456789",
      username: "admin",
      password: hashedPassword,
      role: "admin"
    }).returning();
    console.log("✅ Created admin user");

    // Create seller user
    const sellerPassword = await bcrypt.hash("seller123", 10);
    const [sellerUser] = await db.insert(users).values({
      name: "مندوب المبيعات",
      jobTitle: "مندوب مبيعات",
      phoneNumber: "+966987654321",
      username: "seller",
      password: sellerPassword,
      role: "seller"
    }).returning();
    console.log("✅ Created seller user");

    // Create manufacturers
    const manufacturersData = [
      { name: "مرسيدس", logo: null },
      { name: "بي ام دبليو", logo: null },
      { name: "لكزس", logo: null },
      { name: "تويوتا", logo: null },
      { name: "نيسان", logo: null },
      { name: "هونداي", logo: null },
      { name: "كيا", logo: null },
      { name: "فورد", logo: null }
    ];

    for (const manufacturer of manufacturersData) {
      await db.insert(manufacturers).values(manufacturer);
    }
    console.log("✅ Created manufacturers");

    // Create sample company
    const [company] = await db.insert(companies).values({
      name: "شركة البريمي للسيارات",
      registrationNumber: "1010123456",
      licenseNumber: "123456789",
      taxNumber: "300012345600003",
      address: "الرياض، المملكة العربية السعودية",
      phone: "+966112345678",
      email: "info@albarimi.com",
      website: "www.albarimi.com"
    }).returning();
    console.log("✅ Created company");

    // Create sample banks
    const banksData = [
      {
        bankName: "مصرف الراجحي",
        accountName: "شركة البريمي للسيارات",
        accountNumber: "123456789",
        iban: "SA1234567890123456789012",
        type: "شركة",
        logo: null
      },
      {
        bankName: "البنك الأهلي السعودي",
        accountName: "شركة البريمي للسيارات",
        accountNumber: "987654321",
        iban: "SA9876543210987654321098",
        type: "شركة",
        logo: null
      },
      {
        bankName: "بنك الرياض",
        accountName: "محمد أحمد",
        accountNumber: "555666777",
        iban: "SA5556667775556667770555",
        type: "شخصي",
        logo: null
      }
    ];

    for (const bank of banksData) {
      await db.insert(banks).values(bank);
    }
    console.log("✅ Created banks");

    // Create sample inventory items
    const inventoryData = [
      {
        manufacturer: "مرسيدس",
        category: "C300",
        trimLevel: "فل كامل",
        engineCapacity: "2.0T",
        year: 2024,
        exteriorColor: "أبيض",
        interiorColor: "أسود",
        status: "متوفر",
        importType: "شركة",
        ownershipType: "ملك الشركة",
        location: "المعرض الرئيسي",
        chassisNumber: "WDD2050461A123456",
        price: "185000",
        notes: "سيارة جديدة بالكامل"
      },
      {
        manufacturer: "بي ام دبليو",
        category: "X5",
        trimLevel: "xDrive40i",
        engineCapacity: "3.0T",
        year: 2024,
        exteriorColor: "أسود",
        interiorColor: "بني",
        status: "في الطريق",
        importType: "شخصي",
        ownershipType: "ملك الشركة",
        location: "الميناء",
        chassisNumber: "5UXCR6C09M0A12345",
        price: "295000",
        notes: "وصول متوقع الأسبوع القادم"
      },
      {
        manufacturer: "لكزس",
        category: "ES350",
        trimLevel: "فل كامل",
        engineCapacity: "3.5L",
        year: 2023,
        exteriorColor: "فضي",
        interiorColor: "بيج",
        status: "محجوز",
        importType: "مستعمل شخصي",
        ownershipType: "ملك الشركة",
        location: "المعرض الرئيسي",
        chassisNumber: "58ABK1GG5PU123456",
        price: "165000",
        reservedBy: "أحمد محمد",
        reservationNote: "دفع عربون 10000 ريال"
      },
      {
        manufacturer: "تويوتا",
        category: "كامري",
        trimLevel: "GLE",
        engineCapacity: "2.5L",
        year: 2024,
        exteriorColor: "أزرق",
        interiorColor: "رمادي",
        status: "في الصيانة",
        importType: "شركة",
        ownershipType: "ملك الشركة",
        location: "ورشة الصيانة",
        chassisNumber: "4T1G11AK5PU123456",
        price: "125000",
        notes: "صيانة دورية"
      },
      {
        manufacturer: "نيسان",
        category: "التيما",
        trimLevel: "SV",
        engineCapacity: "2.5L",
        year: 2022,
        exteriorColor: "أحمر",
        interiorColor: "أسود",
        status: "مباع",
        importType: "مستعمل شخصي",
        ownershipType: "ملك الشركة",
        location: "المعرض الرئيسي",
        chassisNumber: "1N4BL4BV6NC123456",
        price: "75000",
        isSold: true,
        soldToCustomerName: "سارة أحمد",
        soldToCustomerPhone: "+966555123456",
        salePrice: "75000"
      }
    ];

    for (const item of inventoryData) {
      await db.insert(inventoryItems).values(item);
    }
    console.log("✅ Created inventory items");

    console.log("🎉 Database seeding completed successfully!");
    return true;
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    return false;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => {
    console.log('✅ Database seeding complete');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  });
}