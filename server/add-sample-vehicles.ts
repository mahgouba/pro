import { getDatabase } from "./db";
import { inventoryItems, manufacturers, vehicleCategories, vehicleTrimLevels, banks } from "@shared/schema";

async function addSampleVehicles() {
  try {
    console.log("🚗 Adding sample vehicles to inventory...");
    const { db } = getDatabase();

    // First, add basic manufacturers
    const sampleManufacturers = [
      { name: "تويوتا", nameEn: "Toyota" },
      { name: "لكزس", nameEn: "Lexus" },
      { name: "نيسان", nameEn: "Nissan" },
      { name: "بي ام دبليو", nameEn: "BMW" },
      { name: "مرسيدس", nameEn: "Mercedes-Benz" }
    ];

    for (const manufacturer of sampleManufacturers) {
      try {
        await db.insert(manufacturers).values(manufacturer);
      } catch (error) {
        // Skip if already exists
      }
    }

    // Add vehicle categories
    const sampleCategories = [
      { manufacturer: "تويوتا", categoryName: "كامري", categoryNameEn: "Camry" },
      { manufacturer: "تويوتا", categoryName: "لاند كروزر", categoryNameEn: "Land Cruiser" },
      { manufacturer: "لكزس", categoryName: "LX570", categoryNameEn: "LX570" },
      { manufacturer: "نيسان", categoryName: "باترول", categoryNameEn: "Patrol" },
      { manufacturer: "بي ام دبليو", categoryName: "X5", categoryNameEn: "X5" }
    ];

    for (const category of sampleCategories) {
      try {
        await db.insert(vehicleCategories).values(category);
      } catch (error) {
        // Skip if already exists
      }
    }

    // Add some basic banks
    const sampleBanks = [
      {
        bankName: "البنك الأهلي السعودي",
        nameEn: "National Commercial Bank",
        accountName: "شركة السيارات المميزة",
        accountNumber: "12345678901234",
        iban: "SA1234567890123456789012",
        type: "شركة"
      },
      {
        bankName: "بنك الراجحي",
        nameEn: "Al Rajhi Bank",
        accountName: "شركة السيارات المميزة",
        accountNumber: "98765432109876",
        iban: "SA9876543210987654321098",
        type: "شركة"
      }
    ];

    for (const bank of sampleBanks) {
      try {
        await db.insert(banks).values(bank);
      } catch (error) {
        // Skip if already exists
      }
    }

    // Add sample vehicles
    const sampleVehicles = [
      {
        manufacturer: "تويوتا",
        category: "كامري",
        model: "2024",
        color: "أبيض",
        chassisNumber: "JTDKN3DU2N5123456",
        plateNumber: "أ ب ج 1234",
        importType: "شركة",
        status: "متوفر",
        purchasePrice: 85000.00,
        sellingPrice: 95000.00,
        entryDate: new Date("2025-01-15"),
        isActive: true
      },
      {
        manufacturer: "لكزس",
        category: "LX570",
        model: "2023",
        color: "أسود",
        chassisNumber: "JTJHY00W8N5789012",
        plateNumber: "د هـ و 5678",
        importType: "شخصي",
        status: "متوفر",
        purchasePrice: 280000.00,
        sellingPrice: 320000.00,
        entryDate: new Date("2025-01-10"),
        isActive: true
      },
      {
        manufacturer: "نيسان",
        category: "باترول",
        model: "2024",
        color: "أبيض لؤلؤي",
        chassisNumber: "JN1BY1AP2NM345678",
        plateNumber: "ز ح ط 9012",
        importType: "شركة",
        status: "متوفر",
        purchasePrice: 195000.00,
        sellingPrice: 225000.00,
        entryDate: new Date("2025-01-08"),
        isActive: true
      },
      {
        manufacturer: "بي ام دبليو",
        category: "X5",
        model: "2023",
        color: "رمادي",
        chassisNumber: "5UXCR6C05N9456789",
        plateNumber: "ي ك ل 3456",
        importType: "شخصي",
        status: "متوفر",
        purchasePrice: 240000.00,
        sellingPrice: 270000.00,
        entryDate: new Date("2025-01-05"),
        isActive: true
      },
      {
        manufacturer: "تويوتا",
        category: "لاند كروزر",
        model: "2024",
        color: "فضي",
        chassisNumber: "JTMHY05J2N4567890",
        plateNumber: "م ن س 7890",
        importType: "شركة",
        status: "في الطريق",
        purchasePrice: 185000.00,
        sellingPrice: 210000.00,
        entryDate: new Date("2025-01-12"),
        isActive: true
      }
    ];

    for (const vehicle of sampleVehicles) {
      try {
        await db.insert(inventoryItems).values(vehicle);
        console.log(`✅ Added ${vehicle.manufacturer} ${vehicle.category}`);
      } catch (error) {
        console.log(`⚠️ Vehicle already exists: ${vehicle.manufacturer} ${vehicle.category}`);
      }
    }

    console.log("✅ Sample vehicles added successfully!");
    return true;
  } catch (error) {
    console.error("❌ Error adding sample vehicles:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addSampleVehicles().then(() => {
    console.log("✅ Sample data setup complete");
    process.exit(0);
  }).catch((error) => {
    console.error("❌ Sample data setup failed:", error);
    process.exit(1);
  });
}

export { addSampleVehicles };