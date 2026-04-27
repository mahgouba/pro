import { getDatabase } from "./db";
import { banks, manufacturers, vehicleCategories, vehicleTrimLevels } from "@shared/schema";

async function syncExternalDatabase() {
  try {
    console.log("🔄 Starting external database synchronization...");
    const { db } = getDatabase();

    // Check existing data counts
    const existingBanks = await db.select().from(banks);
    const existingManufacturers = await db.select().from(manufacturers);
    const existingCategories = await db.select().from(vehicleCategories);
    const existingTrimLevels = await db.select().from(vehicleTrimLevels);

    console.log(`📊 Current data counts:`);
    console.log(`   Banks: ${existingBanks.length}`);
    console.log(`   Manufacturers: ${existingManufacturers.length}`);
    console.log(`   Categories: ${existingCategories.length}`);
    console.log(`   Trim Levels: ${existingTrimLevels.length}`);

    // Add missing banks data
    if (existingBanks.length === 0) {
      console.log("💳 Adding banks data...");
      const banksData = [
        {
          bankName: "البنك الأهلي السعودي",
          nameEn: "National Commercial Bank",
          accountName: "شركة السيارات المميزة",
          accountNumber: "12345678901234",
          iban: "SA1234567890123456789012",
          type: "شركة",
          isActive: true
        },
        {
          bankName: "بنك الراجحي",
          nameEn: "Al Rajhi Bank",
          accountName: "شركة السيارات المميزة",
          accountNumber: "98765432109876",
          iban: "SA9876543210987654321098",
          type: "شركة",
          isActive: true
        },
        {
          bankName: "البنك السعودي البريطاني",
          nameEn: "SABB Bank",
          accountName: "شركة السيارات المميزة",
          accountNumber: "11223344556677",
          iban: "SA1122334455667788990011",
          type: "شركة",
          isActive: true
        },
        {
          bankName: "بنك الرياض",
          nameEn: "Riyad Bank",
          accountName: "شركة السيارات المميزة",
          accountNumber: "99887766554433",
          iban: "SA9988776655443322110099",
          type: "شركة",
          isActive: true
        },
        {
          bankName: "بنك سامبا",
          nameEn: "Samba Bank",
          accountName: "شركة السيارات المميزة",
          accountNumber: "55443322110099",
          iban: "SA5544332211009988776655",
          type: "شركة",
          isActive: true
        }
      ];

      for (const bank of banksData) {
        await db.insert(banks).values(bank);
      }
      console.log(`✅ Added ${banksData.length} banks`);
    }

    // Add missing manufacturers data
    if (existingManufacturers.length < 20) {
      console.log("🏭 Adding manufacturers data...");
      const manufacturersData = [
        { nameAr: "تويوتا", nameEn: "Toyota", isActive: true },
        { nameAr: "لكزس", nameEn: "Lexus", isActive: true },
        { nameAr: "بي إم دبليو", nameEn: "BMW", isActive: true },
        { nameAr: "مرسيدس بنز", nameEn: "Mercedes-Benz", isActive: true },
        { nameAr: "أودي", nameEn: "Audi", isActive: true },
        { nameAr: "لاند روفر", nameEn: "Land Rover", isActive: true },
        { nameAr: "جاكوار", nameEn: "Jaguar", isActive: true },
        { nameAr: "بورش", nameEn: "Porsche", isActive: true },
        { nameAr: "فولكس فاجن", nameEn: "Volkswagen", isActive: true },
        { nameAr: "نيسان", nameEn: "Nissan", isActive: true },
        { nameAr: "انفينيتي", nameEn: "Infiniti", isActive: true },
        { nameAr: "هوندا", nameEn: "Honda", isActive: true },
        { nameAr: "أكورا", nameEn: "Acura", isActive: true },
        { nameAr: "هيونداي", nameEn: "Hyundai", isActive: true },
        { nameAr: "جينيسيس", nameEn: "Genesis", isActive: true },
        { nameAr: "كيا", nameEn: "Kia", isActive: true },
        { nameAr: "مازدا", nameEn: "Mazda", isActive: true },
        { nameAr: "سوبارو", nameEn: "Subaru", isActive: true },
        { nameAr: "ميتسوبيشي", nameEn: "Mitsubishi", isActive: true },
        { nameAr: "شيفروليه", nameEn: "Chevrolet", isActive: true },
        { nameAr: "فورد", nameEn: "Ford", isActive: true },
        { nameAr: "لينكون", nameEn: "Lincoln", isActive: true },
        { nameAr: "كاديلاك", nameEn: "Cadillac", isActive: true },
        { nameAr: "جي ام سي", nameEn: "GMC", isActive: true },
        { nameAr: "كرايسلر", nameEn: "Chrysler", isActive: true },
        { nameAr: "دودج", nameEn: "Dodge", isActive: true },
        { nameAr: "جيب", nameEn: "Jeep", isActive: true },
        { nameAr: "رام", nameEn: "Ram", isActive: true },
        { nameAr: "تسلا", nameEn: "Tesla", isActive: true },
        { nameAr: "رولز رويس", nameEn: "Rolls-Royce", isActive: true },
        { nameAr: "بنتلي", nameEn: "Bentley", isActive: true },
        { nameAr: "لامبورغيني", nameEn: "Lamborghini", isActive: true },
        { nameAr: "فيراري", nameEn: "Ferrari", isActive: true },
        { nameAr: "مكلارين", nameEn: "McLaren", isActive: true },
        { nameAr: "أستون مارتن", nameEn: "Aston Martin", isActive: true }
      ];

      // Only add manufacturers that don't exist
      for (const manufacturer of manufacturersData) {
        const existing = existingManufacturers.find(m => m.nameAr === manufacturer.nameAr);
        if (!existing) {
          await db.insert(manufacturers).values(manufacturer);
        }
      }
      console.log(`✅ Added missing manufacturers`);
    }

    // Get updated manufacturers list for adding categories
    const allManufacturers = await db.select().from(manufacturers);

    // Add missing vehicle categories
    if (existingCategories.length < 50) {
      console.log("🚗 Adding vehicle categories...");
      
      const categoryMapping = {
        "تويوتا": ["كامري", "كورولا", "أفالون", "برادو", "لاندكروزر", "هايلاندر", "راف 4", "سيكويا", "تاكوما", "تندرا"],
        "لكزس": ["ES", "IS", "LS", "GS", "RX", "GX", "LX", "NX", "UX", "LC"],
        "بي إم دبليو": ["الفئة الثالثة", "الفئة الخامسة", "الفئة السابعة", "X1", "X3", "X5", "X7", "Z4", "i3", "i8"],
        "مرسيدس بنز": ["الفئة A", "الفئة C", "الفئة E", "الفئة S", "GLA", "GLC", "GLE", "GLS", "G-Class", "AMG GT"],
        "أودي": ["A3", "A4", "A6", "A8", "Q3", "Q5", "Q7", "Q8", "TT", "R8"],
        "لاند روفر": ["إيفوك", "ديسكفري سبورت", "ديسكفري", "ديفندر", "رينج روفر سبورت", "رينج روفر فيلار", "رينج روفر"],
        "جاكوار": ["XE", "XF", "XJ", "F-PACE", "E-PACE", "I-PACE", "F-TYPE"],
        "بورش": ["911", "718", "Panamera", "Cayenne", "Macan", "Taycan"],
        "نيسان": ["التيما", "سنترا", "ماكسيما", "باترول", "اكس تريل", "مورانو", "أرمادا", "تيتان"],
        "رولز رويس": ["Ghost", "Phantom", "Wraith", "Dawn", "Cullinan", "Spectre"],
        "بنتلي": ["Continental GT", "Flying Spur", "Bentayga", "Mulsanne"],
        "تسلا": ["Model S", "Model 3", "Model X", "Model Y", "Cybertruck"]
      };

      for (const [manufacturerName, models] of Object.entries(categoryMapping)) {
        const manufacturer = allManufacturers.find(m => m.nameAr === manufacturerName);
        if (manufacturer) {
          for (const model of models) {
            const existingCategory = existingCategories.find(c => 
              c.manufacturerId === manufacturer.id && c.nameAr === model
            );
            if (!existingCategory) {
              await db.insert(vehicleCategories).values({
                manufacturerId: manufacturer.id,
                nameAr: model,
                nameEn: model,
                isActive: true
              });
            }
          }
        }
      }
      console.log(`✅ Added missing vehicle categories`);
    }

    // Get updated categories for trim levels
    const allCategories = await db.select().from(vehicleCategories);

    // Add missing trim levels
    if (existingTrimLevels.length < 100) {
      console.log("⚙️ Adding trim levels...");
      
      const commonTrims = [
        "ستاندرد", "فل كامل", "خاص", "فل أوبشن", "بريميوم", "لوكس", 
        "سبورت", "إس لاين", "أم باكيج", "تورينق", "هايبرايد"
      ];

      // Add trim levels for each category
      for (const category of allCategories) {
        for (const trim of commonTrims.slice(0, 5)) { // Add 5 trims per category
          const existingTrim = existingTrimLevels.find(t => 
            t.categoryId === category.id && t.nameAr === trim
          );
          if (!existingTrim) {
            await db.insert(vehicleTrimLevels).values({
              categoryId: category.id,
              nameAr: trim,
              nameEn: trim,
              isActive: true
            });
          }
        }
      }
      console.log(`✅ Added missing trim levels`);
    }

    // Final counts
    const finalBanks = await db.select().from(banks);
    const finalManufacturers = await db.select().from(manufacturers);
    const finalCategories = await db.select().from(vehicleCategories);
    const finalTrimLevels = await db.select().from(vehicleTrimLevels);

    console.log(`🎉 Synchronization completed!`);
    console.log(`📊 Final data counts:`);
    console.log(`   Banks: ${finalBanks.length}`);
    console.log(`   Manufacturers: ${finalManufacturers.length}`);
    console.log(`   Categories: ${finalCategories.length}`);
    console.log(`   Trim Levels: ${finalTrimLevels.length}`);

    return {
      success: true,
      counts: {
        banks: finalBanks.length,
        manufacturers: finalManufacturers.length,
        categories: finalCategories.length,
        trimLevels: finalTrimLevels.length
      }
    };

  } catch (error) {
    console.error("❌ Error synchronizing external database:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export { syncExternalDatabase };