import { getDatabase } from "./db";
import { manufacturers, vehicleCategories, inventoryItems, vehicleTrimLevels } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

async function fixDuplicateManufacturers() {
  try {
    const { db } = getDatabase();
    
    console.log("🔍 Checking for duplicate manufacturers...");

    // Get all manufacturers
    const allManufacturers = await db.select().from(manufacturers).orderBy(manufacturers.nameAr);
    console.log(`Found ${allManufacturers.length} total manufacturers`);

    // Group by nameAr to find duplicates
    const manufacturerGroups = new Map<string, typeof allManufacturers>();
    
    for (const manufacturer of allManufacturers) {
      const key = manufacturer.nameAr;
      if (!manufacturerGroups.has(key)) {
        manufacturerGroups.set(key, []);
      }
      manufacturerGroups.get(key)!.push(manufacturer);
    }

    // Find duplicates
    const duplicateGroups = Array.from(manufacturerGroups.entries()).filter(([_, group]) => group.length > 1);
    
    console.log(`Found ${duplicateGroups.length} manufacturers with duplicates:`);
    
    for (const [nameAr, group] of duplicateGroups) {
      console.log(`- ${nameAr}: ${group.length} duplicates`);
      group.forEach(m => console.log(`  ID: ${m.id}, nameEn: ${m.nameEn}`));
    }

    if (duplicateGroups.length === 0) {
      console.log("✅ No duplicate manufacturers found!");
      return;
    }

    // Fix duplicates
    for (const [nameAr, group] of duplicateGroups) {
      console.log(`\n🔧 Fixing duplicates for: ${nameAr}`);
      
      // Keep the first one (lowest ID), merge data from others
      const keepManufacturer = group[0];
      const duplicateIds = group.slice(1).map(m => m.id);
      
      console.log(`  Keeping ID: ${keepManufacturer.id}`);
      console.log(`  Removing IDs: ${duplicateIds.join(', ')}`);

      // Update all references to point to the kept manufacturer
      try {
        // Update references one by one to avoid syntax issues
        if (duplicateIds.length > 0) {
          for (const duplicateId of duplicateIds) {
            // Update vehicle categories
            await db.update(vehicleCategories)
              .set({ manufacturerId: keepManufacturer.id })
              .where(eq(vehicleCategories.manufacturerId, duplicateId));
            
            // Update inventory items
            await db.update(inventoryItems)
              .set({ manufacturerId: keepManufacturer.id })
              .where(eq(inventoryItems.manufacturerId, duplicateId));

            // Update vehicle trim levels
            await db.update(vehicleTrimLevels)
              .set({ manufacturerId: keepManufacturer.id })
              .where(eq(vehicleTrimLevels.manufacturerId, duplicateId));

            // Delete this duplicate manufacturer
            await db.delete(manufacturers)
              .where(eq(manufacturers.id, duplicateId));
          }
          
          console.log(`  ✅ Updated references and deleted ${duplicateIds.length} duplicates`);
        }
      } catch (error) {
        console.error(`  ❌ Error fixing duplicates for ${nameAr}:`, error);
      }
    }

    // Verify the fix
    console.log("\n🔍 Verifying fix...");
    const finalManufacturers = await db.select().from(manufacturers).orderBy(manufacturers.nameAr);
    console.log(`Final count: ${finalManufacturers.length} manufacturers`);
    
    // Check for remaining duplicates
    const finalGroups = new Map<string, number>();
    for (const manufacturer of finalManufacturers) {
      const count = finalGroups.get(manufacturer.nameAr) || 0;
      finalGroups.set(manufacturer.nameAr, count + 1);
    }
    
    const remainingDuplicates = Array.from(finalGroups.entries()).filter(([_, count]) => count > 1);
    if (remainingDuplicates.length === 0) {
      console.log("✅ All duplicates successfully removed!");
    } else {
      console.log(`❌ Still have ${remainingDuplicates.length} manufacturers with duplicates`);
    }

  } catch (error) {
    console.error("❌ Error fixing duplicate manufacturers:", error);
  }
}

// Run the function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixDuplicateManufacturers().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { fixDuplicateManufacturers };