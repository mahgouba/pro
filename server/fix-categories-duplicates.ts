import { getDatabase } from "./db";
import { vehicleCategories, vehicleTrimLevels, inventoryItems } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

async function fixCategoriesDuplicates() {
  try {
    const { db } = getDatabase();
    
    console.log("🔍 Checking for duplicate categories...");

    // Get all categories
    const allCategories = await db.select().from(vehicleCategories).orderBy(vehicleCategories.nameAr);
    console.log(`Found ${allCategories.length} total categories`);

    // Group by nameAr and manufacturerId to find duplicates
    const categoryGroups = new Map<string, typeof allCategories>();
    
    for (const category of allCategories) {
      const key = `${category.manufacturerId}-${category.nameAr}`;
      if (!categoryGroups.has(key)) {
        categoryGroups.set(key, []);
      }
      categoryGroups.get(key)!.push(category);
    }

    // Find duplicates
    const duplicateGroups = Array.from(categoryGroups.entries()).filter(([_, group]) => group.length > 1);
    
    console.log(`Found ${duplicateGroups.length} categories with duplicates:`);
    
    for (const [key, group] of duplicateGroups) {
      console.log(`- ${key}: ${group.length} duplicates`);
      group.forEach(c => console.log(`  ID: ${c.id}, name: ${c.nameAr}`));
    }

    let deletedCount = 0;

    // Fix category duplicates
    for (const [key, group] of duplicateGroups) {
      console.log(`\n🔧 Fixing duplicates for: ${key}`);
      
      // Keep the first one (lowest ID), merge data from others
      const keepCategory = group[0];
      const duplicatesToDelete = group.slice(1);
      
      console.log(`  Keeping ID: ${keepCategory.id}`);
      console.log(`  Moving references from IDs: ${duplicatesToDelete.map(c => c.id).join(', ')}`);

      // Move all references to the kept category
      for (const duplicate of duplicatesToDelete) {
        // Update trim levels
        const updatedTrimLevels = await db.update(vehicleTrimLevels)
          .set({ categoryId: keepCategory.id })
          .where(eq(vehicleTrimLevels.categoryId, duplicate.id))
          .returning();
        
        console.log(`    Updated ${updatedTrimLevels.length} trim levels`);
        
        // Update inventory items
        const updatedInventory = await db.update(inventoryItems)
          .set({ categoryId: keepCategory.id })
          .where(eq(inventoryItems.categoryId, duplicate.id))
          .returning();
        
        console.log(`    Updated ${updatedInventory.length} inventory items`);
        
        // Now safe to delete the duplicate category
        await db.delete(vehicleCategories).where(eq(vehicleCategories.id, duplicate.id));
        console.log(`    ✅ Deleted category ID ${duplicate.id}`);
        deletedCount++;
      }
    }
    
    console.log(`🎉 Successfully deleted ${deletedCount} duplicate categories`);
    
    // Verify the results
    const finalCategories = await db.select().from(vehicleCategories);
    console.log(`📊 Total categories after cleanup: ${finalCategories.length}`);
    
    // Check remaining duplicates
    const finalCategoryGroups = new Map<string, number>();
    for (const category of finalCategories) {
      const key = `${category.manufacturerId}-${category.nameAr}`;
      const count = finalCategoryGroups.get(key) || 0;
      finalCategoryGroups.set(key, count + 1);
    }
    
    const remainingDuplicates = Array.from(finalCategoryGroups.entries()).filter(([_, count]) => count > 1);
    if (remainingDuplicates.length === 0) {
      console.log("✅ All category duplicates successfully removed!");
    } else {
      console.log(`⚠️ Still have ${remainingDuplicates.length} categories with duplicates`);
    }

  } catch (error) {
    console.error("❌ Error fixing category duplicates:", error);
  }
}

async function fixTrimLevelsDuplicates() {
  try {
    const { db } = getDatabase();
    
    console.log("\n🔍 Checking for duplicate trim levels...");

    // Get all trim levels
    const allTrimLevels = await db.select().from(vehicleTrimLevels).orderBy(vehicleTrimLevels.nameAr);
    console.log(`Found ${allTrimLevels.length} total trim levels`);

    // Group by nameAr and categoryId to find duplicates
    const trimLevelGroups = new Map<string, typeof allTrimLevels>();
    
    for (const trimLevel of allTrimLevels) {
      const key = `${trimLevel.categoryId}-${trimLevel.nameAr}`;
      if (!trimLevelGroups.has(key)) {
        trimLevelGroups.set(key, []);
      }
      trimLevelGroups.get(key)!.push(trimLevel);
    }

    // Find duplicates
    const duplicateGroups = Array.from(trimLevelGroups.entries()).filter(([_, group]) => group.length > 1);
    
    console.log(`Found ${duplicateGroups.length} trim levels with duplicates:`);
    
    for (const [key, group] of duplicateGroups) {
      console.log(`- ${key}: ${group.length} duplicates`);
      group.forEach(t => console.log(`  ID: ${t.id}, name: ${t.nameAr}`));
    }

    let deletedCount = 0;

    // Fix trim level duplicates
    for (const [key, group] of duplicateGroups) {
      console.log(`\n🔧 Fixing trim level duplicates for: ${key}`);
      
      // Keep the first one (lowest ID), merge data from others
      const keepTrimLevel = group[0];
      const duplicatesToDelete = group.slice(1);
      
      console.log(`  Keeping ID: ${keepTrimLevel.id}`);
      console.log(`  Moving references from IDs: ${duplicatesToDelete.map(t => t.id).join(', ')}`);

      // Move all references to the kept trim level
      for (const duplicate of duplicatesToDelete) {
        // Update inventory items
        const updatedInventory = await db.update(inventoryItems)
          .set({ trimLevelId: keepTrimLevel.id })
          .where(eq(inventoryItems.trimLevelId, duplicate.id))
          .returning();
        
        console.log(`    Updated ${updatedInventory.length} inventory items`);
        
        // Now safe to delete the duplicate trim level
        await db.delete(vehicleTrimLevels).where(eq(vehicleTrimLevels.id, duplicate.id));
        console.log(`    ✅ Deleted trim level ID ${duplicate.id}`);
        deletedCount++;
      }
    }
    
    console.log(`🎉 Successfully deleted ${deletedCount} duplicate trim levels`);
    
    // Verify the results
    const finalTrimLevels = await db.select().from(vehicleTrimLevels);
    console.log(`📊 Total trim levels after cleanup: ${finalTrimLevels.length}`);

  } catch (error) {
    console.error("❌ Error fixing trim level duplicates:", error);
  }
}

async function fixAllDuplicates() {
  console.log("🚀 Starting comprehensive duplicate cleanup...");
  await fixCategoriesDuplicates();
  await fixTrimLevelsDuplicates();
  console.log("✅ All duplicate cleanup completed!");
}

fixAllDuplicates();