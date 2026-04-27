import { getDatabase } from "./db";
import { manufacturers, vehicleCategories, vehicleTrimLevels } from "@shared/schema";
import fs from 'fs';

// Read the hierarchy data from the attached file
let hierarchyData: any;
try {
  hierarchyData = JSON.parse(fs.readFileSync('../attached_assets/Pasted--brand-ar-brand-en-Land-Rover-models-mo-1755627998436_1755627998439.txt', 'utf8'));
} catch (error) {
  console.error("Error reading hierarchy file:", error);
  process.exit(1);
}

export async function importNewHierarchy() {
  const { db } = getDatabase();
  
  try {
    console.log("🔄 Starting hierarchy data replacement...");
    
    // Delete all existing data
    console.log("🗑️ Deleting existing trim levels...");
    await db.delete(vehicleTrimLevels);
    
    console.log("🗑️ Deleting existing vehicle categories...");
    await db.delete(vehicleCategories);
    
    console.log("🗑️ Deleting existing manufacturers...");
    await db.delete(manufacturers);
    
    console.log("✅ All existing data deleted successfully");
    
    let manufacturerIdCounter = 1;
    let categoryIdCounter = 1;
    let trimIdCounter = 1;
    
    // Import new data
    for (const brand of hierarchyData) {
      console.log(`📦 Importing brand: ${brand.brand_ar} (${brand.brand_en})`);
      
      // Insert manufacturer
      const [newManufacturer] = await db.insert(manufacturers).values({
        id: manufacturerIdCounter,
        nameAr: brand.brand_ar,
        nameEn: brand.brand_en,
        logo: null,
        isActive: true
      }).returning();
      
      console.log(`✅ Manufacturer inserted: ${newManufacturer.nameAr}`);
      
      // Insert models (categories)
      for (const model of brand.models) {
        console.log(`  📂 Importing model: ${model.model_ar} (${model.model_en})`);
        
        const [newCategory] = await db.insert(vehicleCategories).values({
          id: categoryIdCounter,
          manufacturerId: manufacturerIdCounter,
          nameAr: model.model_ar,
          nameEn: model.model_en,
          isActive: true
        }).returning();
        
        console.log(`  ✅ Category inserted: ${newCategory.nameAr}`);
        
        // Insert trims
        for (const trim of model.trims) {
          const [newTrim] = await db.insert(vehicleTrimLevels).values({
            id: trimIdCounter,
            categoryId: categoryIdCounter,
            nameAr: trim.trim_ar,
            nameEn: trim.trim_en,
            isActive: true
          }).returning();
          
          console.log(`    ✅ Trim inserted: ${newTrim.nameAr}`);
          trimIdCounter++;
        }
        
        categoryIdCounter++;
      }
      
      manufacturerIdCounter++;
    }
    
    console.log("🎉 Hierarchy data replacement completed successfully!");
    console.log(`📊 Total imported: ${manufacturerIdCounter - 1} manufacturers, ${categoryIdCounter - 1} categories, ${trimIdCounter - 1} trims`);
    
    return {
      success: true,
      counts: {
        manufacturers: manufacturerIdCounter - 1,
        categories: categoryIdCounter - 1,
        trims: trimIdCounter - 1
      }
    };
    
  } catch (error) {
    console.error("❌ Error importing hierarchy data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run the import if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importNewHierarchy().then((result) => {
    if (result.success) {
      console.log("✅ Import completed successfully");
      process.exit(0);
    } else {
      console.error("❌ Import failed:", result.error);
      process.exit(1);
    }
  });
}