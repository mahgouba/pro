import "dotenv/config";
import { db } from "./db";
import { sql } from "drizzle-orm";
import {
  inventoryItems,
  manufacturers,
  vehicleCategories,
  vehicleTrimLevels,
  engineCapacities,
  vehicleColors,
  vehicleStatuses,
  vehicleLocations,
  importTypes,
  ownershipTypes,
  banks,
} from "@shared/schema";

type AnyTable = any;

const inventoryStringFields = [
  "manufacturer",
  "category",
  "trimLevel",
  "engineCapacity",
  "exteriorColor",
  "interiorColor",
  "status",
  "importType",
  "ownershipType",
  "location",
  "chassisNumber",
];

const dropdownTables: Array<{ name: string; table: AnyTable; fields: string[] }> = [
  { name: "manufacturers", table: manufacturers, fields: ["nameAr", "nameEn"] },
  { name: "vehicle_categories", table: vehicleCategories, fields: ["nameAr", "nameEn"] },
  { name: "vehicle_trim_levels", table: vehicleTrimLevels, fields: ["nameAr", "nameEn"] },
  { name: "engine_capacities", table: engineCapacities, fields: ["nameAr", "nameEn"] },
  { name: "vehicle_colors", table: vehicleColors, fields: ["name"] },
  { name: "vehicle_statuses", table: vehicleStatuses, fields: ["nameAr", "nameEn"] },
  { name: "vehicle_locations", table: vehicleLocations, fields: ["nameAr", "nameEn"] },
  { name: "import_types", table: importTypes, fields: ["nameAr", "nameEn"] },
  { name: "ownership_types", table: ownershipTypes, fields: ["nameAr", "nameEn"] },
  { name: "banks", table: banks, fields: ["bankName"] },
];

async function trimColumn(tableName: string, column: string): Promise<number> {
  const result: any = await db.execute(
    sql.raw(
      `UPDATE "${tableName}" SET "${column}" = TRIM("${column}") WHERE "${column}" IS NOT NULL AND "${column}" <> TRIM("${column}")`,
    ),
  );
  const count = result?.rowCount ?? result?.rows?.length ?? 0;
  return count;
}

function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
}

async function main() {
  console.log("Starting whitespace cleanup...\n");
  let totalUpdated = 0;

  console.log("=== inventory_items ===");
  for (const field of inventoryStringFields) {
    const col = camelToSnake(field);
    try {
      const n = await trimColumn("inventory_items", col);
      if (n > 0) {
        console.log(`  ${col}: trimmed ${n} row(s)`);
        totalUpdated += n;
      }
    } catch (e: any) {
      console.warn(`  ${col}: skipped (${e?.message ?? e})`);
    }
  }

  for (const t of dropdownTables) {
    console.log(`\n=== ${t.name} ===`);
    for (const field of t.fields) {
      const col = camelToSnake(field);
      try {
        const n = await trimColumn(t.name, col);
        if (n > 0) {
          console.log(`  ${col}: trimmed ${n} row(s)`);
          totalUpdated += n;
        }
      } catch (e: any) {
        console.warn(`  ${col}: skipped (${e?.message ?? e})`);
      }
    }
  }

  console.log(`\nDone. Total rows updated: ${totalUpdated}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
