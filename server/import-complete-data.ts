import { getDatabase } from "./db";
import { manufacturers, vehicleCategories, vehicleTrimLevels, banks } from "@shared/schema";

async function importCompleteData() {
  try {
    console.log("📥 Importing complete data to external database...");
    const { db } = getDatabase();

    // Import manufacturers
    const manufacturersData = [
      { nameAr: "تويوتا", nameEn: "Toyota" },
      { nameAr: "لكزس", nameEn: "Lexus" },
      { nameAr: "نيسان", nameEn: "Nissan" },
      { nameAr: "إنفينيتي", nameEn: "Infiniti" },
      { nameAr: "بي ام دبليو", nameEn: "BMW" },
      { nameAr: "مرسيدس", nameEn: "Mercedes-Benz" },
      { nameAr: "أودي", nameEn: "Audi" },
      { nameAr: "فولكس فاجن", nameEn: "Volkswagen" },
      { nameAr: "بورش", nameEn: "Porsche" },
      { nameAr: "جاكوار", nameEn: "Jaguar" },
      { nameAr: "لاند روفر", nameEn: "Land Rover" },
      { nameAr: "رولز رويس", nameEn: "Rolls-Royce" },
      { nameAr: "بنتلي", nameEn: "Bentley" },
      { nameAr: "فيراري", nameEn: "Ferrari" },
      { nameAr: "لامبورغيني", nameEn: "Lamborghini" },
      { nameAr: "مكلارين", nameEn: "McLaren" },
      { nameAr: "أستون مارتن", nameEn: "Aston Martin" },
      { nameAr: "تسلا", nameEn: "Tesla" },
      { nameAr: "فورد", nameEn: "Ford" },
      { nameAr: "شيفروليه", nameEn: "Chevrolet" },
      { nameAr: "جي ام سي", nameEn: "GMC" },
      { nameAr: "كاديلاك", nameEn: "Cadillac" },
      { nameAr: "لينكولن", nameEn: "Lincoln" },
      { nameAr: "جيب", nameEn: "Jeep" },
      { nameAr: "دودج", nameEn: "Dodge" },
      { nameAr: "كرايسلر", nameEn: "Chrysler" },
      { nameAr: "هيونداي", nameEn: "Hyundai" },
      { nameAr: "كيا", nameEn: "Kia" },
      { nameAr: "جينيسيس", nameEn: "Genesis" },
      { nameAr: "مازدا", nameEn: "Mazda" },
      { nameAr: "ميتسوبيشي", nameEn: "Mitsubishi" }
    ];

    console.log("🏭 Adding manufacturers...");
    for (const manufacturer of manufacturersData) {
      try {
        await db.insert(manufacturers).values(manufacturer);
      } catch (error) {
        // Skip if already exists
      }
    }

    // Import vehicle categories
    const categoriesData = [
      // Toyota
      { manufacturer: "تويوتا", categoryName: "كامري", categoryNameEn: "Camry" },
      { manufacturer: "تويوتا", categoryName: "أفالون", categoryNameEn: "Avalon" },
      { manufacturer: "تويوتا", categoryName: "كورولا", categoryNameEn: "Corolla" },
      { manufacturer: "تويوتا", categoryName: "لاند كروزر", categoryNameEn: "Land Cruiser" },
      { manufacturer: "تويوتا", categoryName: "برادو", categoryNameEn: "Prado" },
      { manufacturer: "تويوتا", categoryName: "هايلكس", categoryNameEn: "Hilux" },
      { manufacturer: "تويوتا", categoryName: "راف فور", categoryNameEn: "RAV4" },
      { manufacturer: "تويوتا", categoryName: "هايلاندر", categoryNameEn: "Highlander" },
      
      // Lexus
      { manufacturer: "لكزس", categoryName: "LX570", categoryNameEn: "LX570" },
      { manufacturer: "لكزس", categoryName: "LX600", categoryNameEn: "LX600" },
      { manufacturer: "لكزس", categoryName: "GX460", categoryNameEn: "GX460" },
      { manufacturer: "لكزس", categoryName: "RX350", categoryNameEn: "RX350" },
      { manufacturer: "لكزس", categoryName: "ES350", categoryNameEn: "ES350" },
      { manufacturer: "لكزس", categoryName: "LS460", categoryNameEn: "LS460" },
      { manufacturer: "لكزس", categoryName: "IS250", categoryNameEn: "IS250" },
      
      // Nissan
      { manufacturer: "نيسان", categoryName: "باترول", categoryNameEn: "Patrol" },
      { manufacturer: "نيسان", categoryName: "أرمادا", categoryNameEn: "Armada" },
      { manufacturer: "نيسان", categoryName: "ألتيما", categoryNameEn: "Altima" },
      { manufacturer: "نيسان", categoryName: "مكسيما", categoryNameEn: "Maxima" },
      { manufacturer: "نيسان", categoryName: "اكس تريل", categoryNameEn: "X-Trail" },
      { manufacturer: "نيسان", categoryName: "مورانو", categoryNameEn: "Murano" },
      
      // BMW
      { manufacturer: "بي ام دبليو", categoryName: "X5", categoryNameEn: "X5" },
      { manufacturer: "بي ام دبليو", categoryName: "X6", categoryNameEn: "X6" },
      { manufacturer: "بي ام دبليو", categoryName: "X7", categoryNameEn: "X7" },
      { manufacturer: "بي ام دبليو", categoryName: "Series 3", categoryNameEn: "3 Series" },
      { manufacturer: "بي ام دبليو", categoryName: "Series 5", categoryNameEn: "5 Series" },
      { manufacturer: "بي ام دبليو", categoryName: "Series 7", categoryNameEn: "7 Series" },
      
      // Mercedes
      { manufacturer: "مرسيدس", categoryName: "G-Class", categoryNameEn: "G-Class" },
      { manufacturer: "مرسيدس", categoryName: "GLE", categoryNameEn: "GLE" },
      { manufacturer: "مرسيدس", categoryName: "GLS", categoryNameEn: "GLS" },
      { manufacturer: "مرسيدس", categoryName: "C-Class", categoryNameEn: "C-Class" },
      { manufacturer: "مرسيدس", categoryName: "E-Class", categoryNameEn: "E-Class" },
      { manufacturer: "مرسيدس", categoryName: "S-Class", categoryNameEn: "S-Class" },
      
      // Porsche
      { manufacturer: "بورش", categoryName: "Cayenne", categoryNameEn: "Cayenne" },
      { manufacturer: "بورش", categoryName: "Macan", categoryNameEn: "Macan" },
      { manufacturer: "بورش", categoryName: "911", categoryNameEn: "911" },
      { manufacturer: "بورش", categoryName: "Panamera", categoryNameEn: "Panamera" },
      
      // Land Rover
      { manufacturer: "لاند روفر", categoryName: "Range Rover", categoryNameEn: "Range Rover" },
      { manufacturer: "لاند روفر", categoryName: "Range Rover Sport", categoryNameEn: "Range Rover Sport" },
      { manufacturer: "لاند روفر", categoryName: "Range Rover Evoque", categoryNameEn: "Range Rover Evoque" },
      { manufacturer: "لاند روفر", categoryName: "Discovery", categoryNameEn: "Discovery" },
      
      // Rolls-Royce
      { manufacturer: "رولز رويس", categoryName: "Ghost", categoryNameEn: "Ghost" },
      { manufacturer: "رولز رويس", categoryName: "Phantom", categoryNameEn: "Phantom" },
      { manufacturer: "رولز رويس", categoryName: "Cullinan", categoryNameEn: "Cullinan" },
      { manufacturer: "رولز رويس", categoryName: "Wraith", categoryNameEn: "Wraith" },
      { manufacturer: "رولز رويس", categoryName: "Dawn", categoryNameEn: "Dawn" },
      
      // Bentley
      { manufacturer: "بنتلي", categoryName: "Bentayga", categoryNameEn: "Bentayga" },
      { manufacturer: "بنتلي", categoryName: "Continental GT", categoryNameEn: "Continental GT" },
      { manufacturer: "بنتلي", categoryName: "Flying Spur", categoryNameEn: "Flying Spur" },
      
      // Tesla
      { manufacturer: "تسلا", categoryName: "Model S", categoryNameEn: "Model S" },
      { manufacturer: "تسلا", categoryName: "Model X", categoryNameEn: "Model X" },
      { manufacturer: "تسلا", categoryName: "Model Y", categoryNameEn: "Model Y" },
      { manufacturer: "تسلا", categoryName: "Model 3", categoryNameEn: "Model 3" },
      { manufacturer: "تسلا", categoryName: "Cybertruck", categoryNameEn: "Cybertruck" },
      
      // GMC
      { manufacturer: "جي ام سي", categoryName: "Yukon", categoryNameEn: "Yukon" },
      { manufacturer: "جي ام سي", categoryName: "Suburban", categoryNameEn: "Suburban" },
      { manufacturer: "جي ام سي", categoryName: "Tahoe", categoryNameEn: "Tahoe" },
      { manufacturer: "جي ام سي", categoryName: "Sierra", categoryNameEn: "Sierra" },
      
      // Cadillac
      { manufacturer: "كاديلاك", categoryName: "Escalade", categoryNameEn: "Escalade" },
      { manufacturer: "كاديلاك", categoryName: "XT5", categoryNameEn: "XT5" },
      { manufacturer: "كاديلاك", categoryName: "XT6", categoryNameEn: "XT6" },
      { manufacturer: "كاديلاك", categoryName: "CT5", categoryNameEn: "CT5" }
    ];

    console.log("🚗 Adding vehicle categories...");
    for (const category of categoriesData) {
      try {
        await db.insert(vehicleCategories).values(category);
      } catch (error) {
        // Skip if already exists
      }
    }

    // Import trim levels
    const trimLevelsData = [
      // Toyota Camry
      { manufacturer: "تويوتا", category: "كامري", trimLevel: "LE", trimLevelAr: "أساسي", engine: "2.5L 4-Cylinder", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "أمامي", year: 2024 },
      { manufacturer: "تويوتا", category: "كامري", trimLevel: "SE", trimLevelAr: "رياضي", engine: "2.5L 4-Cylinder", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "أمامي", year: 2024 },
      { manufacturer: "تويوتا", category: "كامري", trimLevel: "XLE", trimLevelAr: "فاخر", engine: "2.5L 4-Cylinder", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "أمامي", year: 2024 },
      { manufacturer: "تويوتا", category: "كامري", trimLevel: "XSE", trimLevelAr: "رياضي فاخر", engine: "2.5L 4-Cylinder", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "أمامي", year: 2024 },

      // Lexus LX570
      { manufacturer: "لكزس", category: "LX570", trimLevel: "Base", trimLevelAr: "أساسي", engine: "5.7L V8", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2023 },
      { manufacturer: "لكزس", category: "LX570", trimLevel: "Luxury", trimLevelAr: "فاخر", engine: "5.7L V8", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2023 },

      // Lexus LX600
      { manufacturer: "لكزس", category: "LX600", trimLevel: "Base", trimLevelAr: "أساسي", engine: "3.5L V6 Twin Turbo", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },
      { manufacturer: "لكزس", category: "LX600", trimLevel: "F Sport", trimLevelAr: "رياضي", engine: "3.5L V6 Twin Turbo", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },
      { manufacturer: "لكزس", category: "LX600", trimLevel: "Ultra Luxury", trimLevelAr: "فاخر جداً", engine: "3.5L V6 Twin Turbo", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },

      // Nissan Patrol
      { manufacturer: "نيسان", category: "باترول", trimLevel: "S", trimLevelAr: "أساسي", engine: "5.6L V8", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },
      { manufacturer: "نيسان", category: "باترول", trimLevel: "SE", trimLevelAr: "متوسط", engine: "5.6L V8", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },
      { manufacturer: "نيسان", category: "باترول", trimLevel: "LE", trimLevelAr: "فاخر", engine: "5.6L V8", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },
      { manufacturer: "نيسان", category: "باترول", trimLevel: "Platinum", trimLevelAr: "بلاتيني", engine: "5.6L V8", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },

      // BMW X5
      { manufacturer: "بي ام دبليو", category: "X5", trimLevel: "sDrive40i", trimLevelAr: "أساسي", engine: "3.0L I6 Turbo", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "خلفي", year: 2024 },
      { manufacturer: "بي ام دبليو", category: "X5", trimLevel: "xDrive40i", trimLevelAr: "رباعي", engine: "3.0L I6 Turbo", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },
      { manufacturer: "بي ام دبليو", category: "X5", trimLevel: "xDrive50i", trimLevelAr: "رباعي قوي", engine: "4.4L V8 Twin Turbo", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },
      { manufacturer: "بي ام دبليو", category: "X5", trimLevel: "M50i", trimLevelAr: "ام 50", engine: "4.4L V8 Twin Turbo", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },

      // Mercedes G-Class
      { manufacturer: "مرسيدس", category: "G-Class", trimLevel: "G550", trimLevelAr: "550", engine: "4.0L V8 Biturbo", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },
      { manufacturer: "مرسيدس", category: "G-Class", trimLevel: "AMG G63", trimLevelAr: "أيه أم جي 63", engine: "4.0L V8 Biturbo", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },

      // Porsche Cayenne
      { manufacturer: "بورش", category: "Cayenne", trimLevel: "Base", trimLevelAr: "أساسي", engine: "3.0L V6 Turbo", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },
      { manufacturer: "بورش", category: "Cayenne", trimLevel: "S", trimLevelAr: "إس", engine: "2.9L V6 Twin Turbo", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },
      { manufacturer: "بورش", category: "Cayenne", trimLevel: "GTS", trimLevelAr: "جي تي إس", engine: "4.0L V8 Twin Turbo", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },
      { manufacturer: "بورش", category: "Cayenne", trimLevel: "Turbo", trimLevelAr: "توربو", engine: "4.0L V8 Twin Turbo", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },

      // Land Rover Range Rover
      { manufacturer: "لاند روفر", category: "Range Rover", trimLevel: "Base", trimLevelAr: "أساسي", engine: "3.0L I6 Turbo", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },
      { manufacturer: "لاند روفر", category: "Range Rover", trimLevel: "HSE", trimLevelAr: "اتش إس اي", engine: "3.0L I6 Turbo", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },
      { manufacturer: "لاند روفر", category: "Range Rover", trimLevel: "Autobiography", trimLevelAr: "أوتوبايوغرافي", engine: "5.0L V8 Supercharged", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },

      // Rolls-Royce Ghost
      { manufacturer: "رولز رويس", category: "Ghost", trimLevel: "Base", trimLevelAr: "أساسي", engine: "6.75L V12 Twin Turbo", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },
      { manufacturer: "رولز رويس", category: "Ghost", trimLevel: "Extended", trimLevelAr: "ممتد", engine: "6.75L V12 Twin Turbo", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },

      // Rolls-Royce Cullinan
      { manufacturer: "رولز رويس", category: "Cullinan", trimLevel: "Base", trimLevelAr: "أساسي", engine: "6.75L V12 Twin Turbo", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },
      { manufacturer: "رولز رويس", category: "Cullinan", trimLevel: "Black Badge", trimLevelAr: "بلاك بادج", engine: "6.75L V12 Twin Turbo", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },

      // Tesla Model S
      { manufacturer: "تسلا", category: "Model S", trimLevel: "Base", trimLevelAr: "أساسي", engine: "Electric", fuelType: "كهربائي", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },
      { manufacturer: "تسلا", category: "Model S", trimLevel: "Plaid", trimLevelAr: "بلايد", engine: "Electric", fuelType: "كهربائي", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },

      // GMC Yukon
      { manufacturer: "جي ام سي", category: "Yukon", trimLevel: "SLE", trimLevelAr: "أساسي", engine: "5.3L V8", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },
      { manufacturer: "جي ام سي", category: "Yukon", trimLevel: "SLT", trimLevelAr: "متوسط", engine: "5.3L V8", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },
      { manufacturer: "جي ام سي", category: "Yukon", trimLevel: "AT4", trimLevelAr: "أوف رود", engine: "6.2L V8", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },
      { manufacturer: "جي ام سي", category: "Yukon", trimLevel: "Denali", trimLevelAr: "ديناولي", engine: "6.2L V8", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },

      // Cadillac Escalade
      { manufacturer: "كاديلاك", category: "Escalade", trimLevel: "Luxury", trimLevelAr: "فاخر", engine: "6.2L V8", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },
      { manufacturer: "كاديلاك", category: "Escalade", trimLevel: "Premium Luxury", trimLevelAr: "فاخر ممتاز", engine: "6.2L V8", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 },
      { manufacturer: "كاديلاك", category: "Escalade", trimLevel: "Platinum", trimLevelAr: "بلاتيني", engine: "6.2L V8", fuelType: "بنزين", transmission: "أوتوماتيك", drivetrain: "رباعي", year: 2024 }
    ];

    console.log("⚙️ Adding trim levels...");
    for (const trimLevel of trimLevelsData) {
      try {
        await db.insert(vehicleTrimLevels).values(trimLevel);
      } catch (error) {
        // Skip if already exists
      }
    }

    // Import banks
    const banksData = [
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
      },
      {
        bankName: "البنك السعودي البريطاني",
        nameEn: "SABB Bank",
        accountName: "شركة السيارات المميزة",
        accountNumber: "11223344556677",
        iban: "SA1122334455667788990011",
        type: "شركة"
      },
      {
        bankName: "بنك الرياض",
        nameEn: "Riyad Bank",
        accountName: "شركة السيارات المميزة",
        accountNumber: "99887766554433",
        iban: "SA9988776655443322110099",
        type: "شركة"
      },
      {
        bankName: "بنك سامبا",
        nameEn: "Samba Bank",
        accountName: "شركة السيارات المميزة",
        accountNumber: "55443322110099",
        iban: "SA5544332211009988776655",
        type: "شركة"
      },
      {
        bankName: "بنك الإنماء",
        nameEn: "Alinma Bank",
        accountName: "شركة السيارات المميزة",
        accountNumber: "77889900112233",
        iban: "SA7788990011223344556677",
        type: "شركة"
      },
      {
        bankName: "البنك العربي الوطني",
        nameEn: "Arab National Bank",
        accountName: "شركة السيارات المميزة",
        accountNumber: "44556677889900",
        iban: "SA4455667788990011223344",
        type: "شركة"
      },
      {
        bankName: "بنك البلاد",
        nameEn: "Banque Saudi Fransi",
        accountName: "شركة السيارات المميزة",
        accountNumber: "33445566778899",
        iban: "SA3344556677889900112233",
        type: "شركة"
      },
      {
        bankName: "بنك الجزيرة",
        nameEn: "Bank AlJazira",
        accountName: "شركة السيارات المميزة",
        accountNumber: "22334455667788",
        iban: "SA2233445566778899001122",
        type: "شركة"
      },
      {
        bankName: "البنك السعودي للاستثمار",
        nameEn: "Saudi Investment Bank",
        accountName: "شركة السيارات المميزة",
        accountNumber: "11224433556677",
        iban: "SA1122443355667788990011",
        type: "شركة"
      }
    ];

    console.log("🏦 Adding banks...");
    for (const bank of banksData) {
      try {
        await db.insert(banks).values(bank);
      } catch (error) {
        // Skip if already exists
      }
    }

    const manufacturerCount = await db.select().from(manufacturers);
    const categoryCount = await db.select().from(vehicleCategories);
    const trimLevelCount = await db.select().from(vehicleTrimLevels);
    const bankCount = await db.select().from(banks);

    console.log("✅ Import complete!");
    console.log(`📊 Final counts:`);
    console.log(`   Manufacturers: ${manufacturerCount.length}`);
    console.log(`   Categories: ${categoryCount.length}`);
    console.log(`   Trim Levels: ${trimLevelCount.length}`);
    console.log(`   Banks: ${bankCount.length}`);

    return true;
  } catch (error) {
    console.error("❌ Error importing data:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importCompleteData().then(() => {
    console.log("✅ Data import complete");
    process.exit(0);
  }).catch((error) => {
    console.error("❌ Data import failed:", error);
    process.exit(1);
  });
}

export { importCompleteData };