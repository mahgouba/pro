import { getDatabase } from "./db";
import { manufacturers, vehicleCategories } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

async function finalFixDuplicates() {
  try {
    const { db } = getDatabase();
    
    console.log("🔧 Final fix for remaining duplicate manufacturers...");
    
    // Get the remaining duplicates
    const allManufacturers = await db.select().from(manufacturers).orderBy(manufacturers.nameAr);
    
    // Group by nameAr to find duplicates
    const manufacturerGroups = new Map<string, typeof allManufacturers>();
    
    for (const manufacturer of allManufacturers) {
      const key = manufacturer.nameAr;
      if (!manufacturerGroups.has(key)) {
        manufacturerGroups.set(key, []);
      }
      manufacturerGroups.get(key)!.push(manufacturer);
    }

    // Find remaining duplicates
    const duplicateGroups = Array.from(manufacturerGroups.entries()).filter(([_, group]) => group.length > 1);
    
    console.log(`Found ${duplicateGroups.length} manufacturers with duplicates:`);
    for (const [nameAr, group] of duplicateGroups) {
      console.log(`- ${nameAr}: ${group.length} entries (IDs: ${group.map(m => m.id).join(', ')})`);
    }

    for (const [nameAr, group] of duplicateGroups) {
      console.log(`\n🔧 Fixing duplicates for: ${nameAr}`);
      
      // Keep the first one (lowest ID), merge data from others
      const keepManufacturer = group[0];
      const duplicatesToDelete = group.slice(1);
      
      console.log(`  Keeping ID: ${keepManufacturer.id}`);
      console.log(`  Moving references from IDs: ${duplicatesToDelete.map(m => m.id).join(', ')}`);
      
      // Move all references to the kept manufacturer
      for (const duplicate of duplicatesToDelete) {
        console.log(`  Moving references from ID ${duplicate.id} to ${keepManufacturer.id}...`);
        
        // Update vehicle categories
        const updatedCategories = await db.update(vehicleCategories)
          .set({ manufacturerId: keepManufacturer.id })
          .where(eq(vehicleCategories.manufacturerId, duplicate.id))
          .returning();
        
        console.log(`    Updated ${updatedCategories.length} vehicle categories`);
        
        // Now safe to delete the duplicate manufacturer
        await db.delete(manufacturers).where(eq(manufacturers.id, duplicate.id));
        console.log(`    ✅ Deleted manufacturer ID ${duplicate.id}`);
      }
    }
    
    // Verify the final results
    console.log("\n🔍 Final verification...");
    const finalManufacturers = await db.select().from(manufacturers).orderBy(manufacturers.nameAr);
    console.log(`📊 Total manufacturers after final cleanup: ${finalManufacturers.length}`);
    
    // Check for any remaining duplicates
    const finalNameCount = new Map<string, number>();
    for (const manufacturer of finalManufacturers) {
      const count = finalNameCount.get(manufacturer.nameAr) || 0;
      finalNameCount.set(manufacturer.nameAr, count + 1);
    }
    
    const remainingDuplicates = Array.from(finalNameCount.entries()).filter(([_, count]) => count > 1);
    if (remainingDuplicates.length === 0) {
      console.log("🎉 All duplicates successfully removed!");
    } else {
      console.log(`⚠️ Still have ${remainingDuplicates.length} manufacturers with duplicates:`);
      remainingDuplicates.forEach(([name, count]) => console.log(`  ${name}: ${count} entries`));
    }
    
  } catch (error) {
    console.error("❌ Error in final fix:", error);
  }
}

finalFixDuplicates();