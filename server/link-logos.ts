import { getStorage } from "./storage.js";
import { readFileSync } from "fs";
import { join } from "path";

// Force database storage initialization
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://default';

// Mapping between manufacturer names (Arabic) and their logo files
const logoMapping: { [key: string]: string } = {
  // BMW
  "بي ام دبليو": "/logos /bmw.svg",
  "بي ام دبليو ": "/logos /bmw.svg",
  "بي إم دبليو": "/logos /bmw.svg",
  
  // Mercedes
  "مرسيدس": "/logos /mercedes.svg",
  "مرسيدس ": "/logos /mercedes.svg",
  
  // Toyota  
  "تويوتا": "/logos /toyota.svg",
  "تويوتا ": "/logos /toyota.svg",
  
  // Lexus
  "لكزس": "/logos /lexus.svg",
  "لكزس ": "/logos /lexus.svg",
  
  // Ford
  "فورد": "/logos /ford-mustang.svg",
  "فورد ": "/logos /ford-mustang.svg",
  
  // Jaguar
  "جاكوار": "/logos /jaguar.svg",
  "جاجوار": "/logos /jaguar.svg",
  "جاكوار ": "/logos /jaguar.svg",
  
  // Land Rover
  "لاند روفر": "/logos /landrover.svg",
  "لاند روفر ": "/logos /landrover.svg",
  
  // Porsche
  "بورش": "/logos /porsche-svgrepo-com.svg",
  "بورش ": "/logos /porsche-svgrepo-com.svg",
  "بورشه": "/logos /porsche-svgrepo-com.svg",
  
  // Nissan
  "نيسان": "/logos /Nissan.svg",
  "نيسان ": "/logos /Nissan.svg",
  
  // Infiniti
  "انفينيتي": "/logos /infiniti.svg",
  "انفينيتي ": "/logos /infiniti.svg",
  
  // Tesla
  "تسلا": "/logos /tesla.svg",
  "تسلا ": "/logos /tesla.svg",
  
  // Ferrari
  "فيراري": "/logos /ferrari.svg",
  "فيراري ": "/logos /ferrari.svg",
  
  // Lamborghini
  "لامبورغيني": "/logos/Lamborghini.svg",
  "لامبورجيني": "/logos/Lamborghini.svg",
  "لامبورغيني ": "/logos/Lamborghini.svg",
  
  // Bentley
  "بنتلي": "/bentley-svgrepo-com.svg",
  "بنتلي ": "/bentley-svgrepo-com.svg",
  
  // Rolls Royce
  "رولز رويس": "/Rolls-Royce.svg",
  "رولز رويس ": "/Rolls-Royce.svg",
  
  // Bugatti
  "بوجاتي": "/bugatti.svg",
  "بوجاتي ": "/bugatti.svg",
  
  // Lincoln
  "لينكولن": "/logos/Lincoln.svg",
  "لينكولن ": "/logos/Lincoln.svg",
  
  // Maybach
  "مايباخ": "/maybach.svg",
  "مايباخ ": "/maybach.svg",
  
  // Lotus
  "لوتس": "/lotus.svg",
  "لوتس ": "/lotus.svg",
  
  // GMC
  "جي ام سي": "/logos/GMC.svg",
  "جي ام سي ": "/logos/GMC.svg",
  "جي إم سي": "/logos/GMC.svg",
  
  // RAM
  "رام": "/ram.svg",
  "رام ": "/ram.svg",
  
  // Volkswagen
  "فولكسفاجن": "/logos/Volkswagen.svg",
  "فولكسفاجن ": "/logos/Volkswagen.svg",
  
  // Cadillac
  "كاديلاك": "/logos/cadillac.svg",
  "كاديلاك ": "/logos/cadillac.svg",
  
  // ROX
  "روكس": "/logos/Rox.svg",
  "روكس ": "/logos/Rox.svg"
};

async function linkLogosToManufacturers() {
  try {
    console.log("🔗 Starting logo linking process...");
    
    // Get all manufacturers from API instead of storage
    const response = await fetch('http://localhost:5000/api/hierarchical/manufacturers');
    const manufacturers = await response.json();
    
    console.log(`📋 Found ${manufacturers.length} manufacturers in database`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const manufacturer of manufacturers) {
      const logoPath = logoMapping[manufacturer.nameAr];
      
      if (logoPath) {
        try {
          // Update manufacturer logo via API
          const updateResponse = await fetch(`http://localhost:5000/api/manufacturers/${manufacturer.id}/logo`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logo: logoPath })
          });
          
          if (updateResponse.ok) {
            console.log(`✅ Updated logo for: ${manufacturer.nameAr} -> ${logoPath}`);
            updatedCount++;
          } else {
            console.log(`❌ Failed to update logo for: ${manufacturer.nameAr} - Status: ${updateResponse.status}`);
          }
        } catch (error) {
          console.error(`❌ Error updating ${manufacturer.nameAr}:`, error);
        }
      } else {
        console.log(`⏭️ No logo mapping for: ${manufacturer.nameAr}`);
        skippedCount++;
      }
    }
    
    console.log(`🎉 Logo linking completed!`);
    console.log(`✅ Updated: ${updatedCount} manufacturers`);
    console.log(`⏭️ Skipped: ${skippedCount} manufacturers`);
    console.log(`📝 Total processed: ${manufacturers.length} manufacturers`);
    
  } catch (error) {
    console.error("❌ Error in logo linking process:", error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  linkLogosToManufacturers().then(() => {
    console.log("🏁 Logo linking script completed");
    process.exit(0);
  }).catch((error) => {
    console.error("💥 Logo linking script failed:", error);
    process.exit(1);
  });
}

export { linkLogosToManufacturers };