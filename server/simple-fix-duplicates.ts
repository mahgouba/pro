import { getDatabase } from "./db";
import { manufacturers } from "@shared/schema";
import { eq } from "drizzle-orm";

async function simpleBulkDeleteDuplicates() {
  try {
    const { db } = getDatabase();
    
    console.log("🔍 Simple fix for duplicate manufacturers...");
    
    // Delete duplicate manufacturers by specific IDs identified earlier
    const duplicateIdsToDelete = [
      118, // اودي duplicate
      121, // بورش duplicate  
      101, 117, // بي ام دبليو duplicates
      112, 102, 100, // تويوتا duplicates
      105, 115, // كيا duplicates
      99, 110, // لاند روفر duplicates
      119, 109, // لكزس duplicates
      106, // مرسيدس duplicate
      113, 103, // نيسان duplicates
      114, 20 // هيونداي duplicates
    ];
    
    let deletedCount = 0;
    
    for (const id of duplicateIdsToDelete) {
      try {
        await db.delete(manufacturers).where(eq(manufacturers.id, id));
        deletedCount++;
        console.log(`✅ Deleted manufacturer with ID: ${id}`);
      } catch (error) {
        console.log(`⚠️ Could not delete ID ${id}, might be referenced: ${error.message}`);
      }
    }
    
    console.log(`🎉 Successfully deleted ${deletedCount} duplicate manufacturers`);
    
    // Verify the results
    const allManufacturers = await db.select().from(manufacturers).orderBy(manufacturers.nameAr);
    console.log(`📊 Total manufacturers after cleanup: ${allManufacturers.length}`);
    
    // Check remaining duplicates
    const nameCount = new Map<string, number>();
    for (const manufacturer of allManufacturers) {
      const count = nameCount.get(manufacturer.nameAr) || 0;
      nameCount.set(manufacturer.nameAr, count + 1);
    }
    
    const remainingDuplicates = Array.from(nameCount.entries()).filter(([_, count]) => count > 1);
    if (remainingDuplicates.length === 0) {
      console.log("✅ No more duplicates found!");
    } else {
      console.log(`⚠️ Still have ${remainingDuplicates.length} manufacturers with duplicates:`);
      remainingDuplicates.forEach(([name, count]) => console.log(`  ${name}: ${count} entries`));
    }
    
  } catch (error) {
    console.error("❌ Error in simple fix:", error);
  }
}

simpleBulkDeleteDuplicates();