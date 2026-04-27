import { getDatabase } from "./db";
import { vehicleCategories, vehicleTrimLevels } from "@shared/schema";
import { eq } from "drizzle-orm";

async function simpleFixCategories() {
  try {
    const { db } = getDatabase();
    
    console.log("🔧 Simple fix for category duplicates...");
    
    // Based on the output, we know the duplicates:
    // 99-رنج روفر: keep 247, delete 1 
    // 7-كامري: keep 249, delete 29
    // 7-لاند كروزر: keep 32, delete 250
    
    const categoriesToDelete = [
      { id: 1, keepId: 247, name: "رنج روفر" },
      { id: 29, keepId: 249, name: "كامري" }, 
      { id: 250, keepId: 32, name: "لاند كروزر" }
    ];
    
    let deletedCount = 0;
    
    for (const category of categoriesToDelete) {
      console.log(`\n🔧 Moving references for ${category.name} from ID ${category.id} to ${category.keepId}`);
      
      try {
        // First, update trim levels that reference this category
        const updatedTrimLevels = await db.update(vehicleTrimLevels)
          .set({ categoryId: category.keepId })
          .where(eq(vehicleTrimLevels.categoryId, category.id))
          .returning();
        
        console.log(`  Updated ${updatedTrimLevels.length} trim levels`);
        
        // Then delete the duplicate category
        await db.delete(vehicleCategories).where(eq(vehicleCategories.id, category.id));
        console.log(`  ✅ Deleted category ID ${category.id} (${category.name})`);
        deletedCount++;
        
      } catch (error) {
        console.log(`  ⚠️ Could not process category ${category.id}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Successfully processed ${deletedCount} category duplicates`);
    
    // Verify the results
    const finalCategories = await db.select().from(vehicleCategories).orderBy(vehicleCategories.nameAr);
    console.log(`📊 Total categories after cleanup: ${finalCategories.length}`);
    
    // Check for any remaining duplicates by name+manufacturerId
    const categoryMap = new Map<string, number>();
    for (const category of finalCategories) {
      const key = `${category.manufacturerId}-${category.nameAr}`;
      const count = categoryMap.get(key) || 0;
      categoryMap.set(key, count + 1);
    }
    
    const remainingDuplicates = Array.from(categoryMap.entries()).filter(([_, count]) => count > 1);
    if (remainingDuplicates.length === 0) {
      console.log("✅ All category duplicates successfully removed!");
    } else {
      console.log(`⚠️ Still have ${remainingDuplicates.length} categories with duplicates`);
      remainingDuplicates.forEach(([key, count]) => console.log(`  ${key}: ${count} entries`));
    }
    
  } catch (error) {
    console.error("❌ Error in simple category fix:", error);
  }
}

simpleFixCategories();