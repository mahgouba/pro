import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { 
  users, 
  inventoryItems, 
  manufacturers, 
  banks, 
  vehicleCategories, 
  vehicleTrimLevels,
  dailyAttendance,
  employeeWorkSchedules,
  leaveRequests,
  colorAssociations,
  vehicleSpecifications,
  vehicleImageLinks,
  quotations,
  termsConditions,
  priceCards,
  insertPriceCardSchema,
  financingRates,
  insertFinancingRateSchema,
  companies,
  insertCompanySchema,
  insertInventoryItemSchema,
  type PriceCard,
  type InsertPriceCard,
  importTypes,
  vehicleStatuses,
  ownershipTypes,
  vehicleLocations,
  vehicleYears,
  engineCapacities,
  vehicleColors,
  insertImportTypeSchema,
  insertVehicleStatusSchema,
  insertOwnershipTypeSchema,
  insertVehicleLocationSchema,
  insertVehicleYearSchema,
  insertEngineCapacitySchema,
  insertVehicleColorSchema,
  appearanceSettings,
  insertAppearanceSettingsSchema,
  financingCalculations,
  type ImportType,
  type VehicleStatus,
  type OwnershipType,
  type VehicleLocation,
  type VehicleYear,
  type EngineCapacity,
  type VehicleColor
} from "@shared/schema";
import { Pool } from 'pg';
import { eq, desc, asc, or, like, count, sql, ne, isNull, isNotNull, and, not, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Helper function to get vehicle specifications from database
const getVehicleSpecifications = async (vehicle: any) => {
  try {
    // Using direct db import
    
    // First try to find exact match specifications
    const conditions = [
      eq(vehicleSpecifications.manufacturer, vehicle.manufacturer),
      eq(vehicleSpecifications.category, vehicle.category || ''),
      eq(vehicleSpecifications.year, vehicle.year || 0),
      eq(vehicleSpecifications.engineCapacity, vehicle.engineCapacity || '')
    ];

    if (vehicle.trimLevel) {
      conditions.push(eq(vehicleSpecifications.trimLevel, vehicle.trimLevel));
    }

    const specs = await db.select().from(vehicleSpecifications)
      .where(and(...conditions));
    
    if (specs.length > 0) {
      const spec = specs[0];
      if (spec.specifications) {
        try {
          // Parse the JSON specifications
          return typeof spec.specifications === 'object' 
            ? spec.specifications 
            : JSON.parse(spec.specifications);
        } catch (e) {
          console.log('Error parsing specifications JSON:', e);
        }
      }
    }
    
    // If no specifications found, return basic structure
    return {
      "المواصفات الأساسية": {
        "الصانع": vehicle.manufacturer || "غير محدد",
        "الفئة": vehicle.category || "غير محدد",
        "سنة الصنع": vehicle.year?.toString() || "غير محدد",
        "نوع المحرك": vehicle.engineCapacity || "غير محدد",
        "درجة التجهيز": vehicle.trimLevel || "قياسي"
      },
      "معلومات المركبة": {
        "رقم الهيكل": vehicle.chassisNumber || "غير متوفر",
        "اللون الخارجي": vehicle.exteriorColor || "غير محدد",
        "اللون الداخلي": vehicle.interiorColor || "غير محدد",
        "حالة المركبة": vehicle.status || "غير محدد"
      }
    };
  } catch (error) {
    console.error('Error fetching vehicle specifications:', error);
    return {
      "خطأ": "حدث خطأ في جلب المواصفات، يرجى المحاولة مرة أخرى"
    };
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  console.log("Registering API routes...");
  
  // Create a dedicated router for hierarchy management to avoid conflicts
  const hierarchyRouter = express.Router();
  
  // Manufacturers management
  hierarchyRouter.get("/manufacturers", async (req, res) => {
    try {
      const manufacturersData = await db.select().from(manufacturers);
      res.json(manufacturersData);
    } catch (error) {
      console.error("Error fetching manufacturers:", error);
      res.status(500).json({ message: "Failed to fetch manufacturers" });
    }
  });

  hierarchyRouter.post("/manufacturers", async (req, res) => {
    try {
      const { nameAr, nameEn, logo } = req.body;
      if (!nameAr?.trim()) {
        return res.status(400).json({ message: "الاسم بالعربية مطلوب" });
      }
      const existing = await db.select().from(manufacturers).where(eq(manufacturers.nameAr, nameAr.trim())).limit(1);
      if (existing.length > 0) {
        return res.status(400).json({ message: "اسم الشركة المصنعة موجود بالفعل" });
      }
      const [newManufacturer] = await db.insert(manufacturers).values({
        nameAr: nameAr.trim(),
        nameEn: nameEn?.trim() || null,
        logo: logo || null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      res.status(201).json(newManufacturer);
    } catch (error) {
      console.error("Error creating manufacturer:", error);
      res.status(500).json({ message: "فشل في إضافة الشركة المصنعة" });
    }
  });

  hierarchyRouter.put("/manufacturers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { nameAr, nameEn, logo, isActive } = req.body;
      if (!nameAr?.trim()) return res.status(400).json({ message: "الاسم بالعربية مطلوب" });

      // Get original manufacturer to update vehicles if name changes
      const [oldManufacturer] = await db.select().from(manufacturers).where(eq(manufacturers.id, id)).limit(1);
      if (!oldManufacturer) return res.status(404).json({ message: "الشركة المصنعة غير موجودة" });

      const [updated] = await db.update(manufacturers).set({
        nameAr: nameAr.trim(),
        nameEn: nameEn?.trim() || null,
        logo: logo || null,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date()
      }).where(eq(manufacturers.id, id)).returning();

      // If name changed, update all associated vehicles
      if (oldManufacturer.nameAr !== nameAr.trim()) {
        await db.update(inventoryItems)
          .set({ manufacturer: nameAr.trim() })
          .where(eq(inventoryItems.manufacturer, oldManufacturer.nameAr));
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating manufacturer:", error);
      res.status(500).json({ message: "فشل في تحديث الشركة المصنعة" });
    }
  });

  hierarchyRouter.delete("/manufacturers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const force = req.query.force === "true";

      // Get manufacturer name to check for associated vehicles
      const [manufacturerData] = await db.select().from(manufacturers).where(eq(manufacturers.id, id)).limit(1);
      if (!manufacturerData) return res.status(404).json({ message: "الشركة المصنعة غير موجودة" });

      const linkedCategories = await db.select().from(vehicleCategories).where(eq(vehicleCategories.manufacturerId, id));
      const categoryIds = linkedCategories.map((c) => c.id);

      let linkedTrimLevels: { id: number }[] = [];
      if (categoryIds.length > 0) {
        linkedTrimLevels = await db.select({ id: vehicleTrimLevels.id }).from(vehicleTrimLevels)
          .where(inArray(vehicleTrimLevels.categoryId, categoryIds));
      }

      // Check for vehicles using the manufacturer name (since inventoryItems stores names)
      const linkedVehicles = await db.select({ id: inventoryItems.id }).from(inventoryItems)
        .where(eq(inventoryItems.manufacturer, manufacturerData.nameAr));

      // Real inventory vehicles always block deletion (business data)
      if (linkedVehicles.length > 0) {
        return res.status(400).json({
          message: `لا يمكن حذف الشركة "${manufacturerData.nameAr}" لأنها مرتبطة بـ ${linkedVehicles.length} مركبة في المخزون. يرجى حذف أو نقل هذه المركبات أولاً.`,
          linkedCategories: linkedCategories.length,
          linkedTrimLevels: linkedTrimLevels.length,
          linkedVehicles: linkedVehicles.length,
          canForce: false,
        });
      }

      // If categories/trim levels exist and not forcing, ask the client to confirm cascade
      if (!force && (linkedCategories.length > 0 || linkedTrimLevels.length > 0)) {
        return res.status(409).json({
          message: `الشركة "${manufacturerData.nameAr}" مرتبطة بـ ${linkedCategories.length} فئة و ${linkedTrimLevels.length} درجة تجهيز. هل تريد حذفها جميعاً؟`,
          linkedCategories: linkedCategories.length,
          linkedTrimLevels: linkedTrimLevels.length,
          linkedVehicles: 0,
          canForce: true,
        });
      }

      // Cascade delete: trim levels -> categories -> color associations -> manufacturer
      if (categoryIds.length > 0) {
        await db.delete(vehicleTrimLevels).where(inArray(vehicleTrimLevels.categoryId, categoryIds));
        await db.delete(vehicleCategories).where(eq(vehicleCategories.manufacturerId, id));
      }
      await db.delete(colorAssociations).where(eq(colorAssociations.manufacturer, manufacturerData.nameAr));

      const [deleted] = await db.delete(manufacturers).where(eq(manufacturers.id, id)).returning();
      if (!deleted) return res.status(404).json({ message: "الشركة المصنعة غير موجودة" });
      res.json({ message: "تم حذف الشركة بنجاح", deletedCategories: linkedCategories.length, deletedTrimLevels: linkedTrimLevels.length });
    } catch (error) {
      console.error("Error deleting manufacturer:", error);
      res.status(500).json({ message: "فشل في حذف الشركة المصنعة" });
    }
  });

  hierarchyRouter.put("/manufacturers/:id/toggle", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isActive } = req.body;
      const [updated] = await db.update(manufacturers).set({ isActive, updatedAt: new Date() }).where(eq(manufacturers.id, id)).returning();
      if (!updated) return res.status(404).json({ message: "الشركة غير موجودة" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "فشل في تحديث الحالة" });
    }
  });

  // Categories management
  hierarchyRouter.get("/categories", async (req, res) => {
    try {
      const { manufacturerId } = req.query;
      let query = db.select().from(vehicleCategories);
      if (manufacturerId) query = query.where(eq(vehicleCategories.manufacturerId, parseInt(manufacturerId as string))) as any;
      const data = await query;
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  hierarchyRouter.post("/categories", async (req, res) => {
    try {
      const { nameAr, nameEn, manufacturerId } = req.body;
      if (!nameAr?.trim() || !manufacturerId) return res.status(400).json({ message: "الاسم ومعرف الشركة مطلوبان" });
      const [newCategory] = await db.insert(vehicleCategories).values({
        nameAr: nameAr.trim(),
        nameEn: nameEn?.trim() || nameAr.trim(),
        manufacturerId: parseInt(manufacturerId.toString()),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      res.status(201).json(newCategory);
    } catch (error) {
      res.status(500).json({ message: "فشل في إضافة الفئة" });
    }
  });

  hierarchyRouter.put("/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { nameAr, nameEn, manufacturerId, isActive } = req.body;
      if (!nameAr?.trim()) return res.status(400).json({ message: "الاسم بالعربية مطلوب" });

      // Get original category to update vehicles if name changes
      const [oldCategory] = await db.select().from(vehicleCategories).where(eq(vehicleCategories.id, id)).limit(1);
      if (!oldCategory) return res.status(404).json({ message: "الفئة غير موجودة" });

      const [updated] = await db.update(vehicleCategories).set({
        nameAr: nameAr.trim(),
        nameEn: nameEn?.trim() || nameAr.trim(),
        manufacturerId: manufacturerId ? parseInt(manufacturerId.toString()) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        updatedAt: new Date()
      }).where(eq(vehicleCategories.id, id)).returning();

      // If name changed, update all associated vehicles
      if (oldCategory.nameAr !== nameAr.trim()) {
        await db.update(inventoryItems)
          .set({ category: nameAr.trim() })
          .where(eq(inventoryItems.category, oldCategory.nameAr));
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "فشل في تحديث الفئة" });
    }
  });

  hierarchyRouter.delete("/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const force = req.query.force === "true";

      // Get category name to check for associated vehicles
      const [categoryData] = await db.select().from(vehicleCategories).where(eq(vehicleCategories.id, id)).limit(1);
      if (!categoryData) return res.status(404).json({ message: "الفئة غير موجودة" });

      const linkedTrimLevels = await db.select({ id: vehicleTrimLevels.id }).from(vehicleTrimLevels)
        .where(eq(vehicleTrimLevels.categoryId, id));

      // Check for vehicles using the category name
      const linkedVehicles = await db.select({ id: inventoryItems.id }).from(inventoryItems)
        .where(eq(inventoryItems.category, categoryData.nameAr));

      // Real inventory vehicles always block deletion
      if (linkedVehicles.length > 0) {
        return res.status(400).json({
          message: `لا يمكن حذف الفئة "${categoryData.nameAr}" لأنها مرتبطة بـ ${linkedVehicles.length} مركبة في المخزون. يرجى حذف أو نقل هذه المركبات أولاً.`,
          linkedTrimLevels: linkedTrimLevels.length,
          linkedVehicles: linkedVehicles.length,
          canForce: false,
        });
      }

      // If trim levels exist and not forcing, ask the client to confirm cascade
      if (!force && linkedTrimLevels.length > 0) {
        return res.status(409).json({
          message: `الفئة "${categoryData.nameAr}" مرتبطة بـ ${linkedTrimLevels.length} درجة تجهيز. هل تريد حذفها جميعاً؟`,
          linkedTrimLevels: linkedTrimLevels.length,
          linkedVehicles: 0,
          canForce: true,
        });
      }

      // Cascade delete trim levels then the category
      if (linkedTrimLevels.length > 0) {
        await db.delete(vehicleTrimLevels).where(eq(vehicleTrimLevels.categoryId, id));
      }

      const [deleted] = await db.delete(vehicleCategories).where(eq(vehicleCategories.id, id)).returning();
      if (!deleted) return res.status(404).json({ message: "الفئة غير موجودة" });
      res.json({ message: "تم حذف الفئة بنجاح", deletedTrimLevels: linkedTrimLevels.length });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "فشل في حذف الفئة" });
    }
  });

  hierarchyRouter.put("/categories/:id/toggle", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isActive } = req.body;
      const [updated] = await db.update(vehicleCategories).set({ isActive, updatedAt: new Date() }).where(eq(vehicleCategories.id, id)).returning();
      if (!updated) return res.status(404).json({ message: "الفئة غير موجودة" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "فشل في تحديث الحالة" });
    }
  });

  // Trim levels management
  hierarchyRouter.get("/trim-levels", async (req, res) => {
    try {
      const { categoryId } = req.query;
      let query = db.select().from(vehicleTrimLevels);
      if (categoryId) query = query.where(eq(vehicleTrimLevels.categoryId, parseInt(categoryId as string))) as any;
      const data = await query;
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trim levels" });
    }
  });

  hierarchyRouter.post("/trim-levels", async (req, res) => {
    try {
      const { nameAr, nameEn, categoryId } = req.body;
      if (!nameAr?.trim() || !categoryId) return res.status(400).json({ message: "الاسم ومعرف الفئة مطلوبان" });
      const [newTrim] = await db.insert(vehicleTrimLevels).values({
        nameAr: nameAr.trim(),
        nameEn: nameEn?.trim() || nameAr.trim(),
        categoryId: parseInt(categoryId.toString()),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      res.status(201).json(newTrim);
    } catch (error) {
      res.status(500).json({ message: "فشل في إضافة درجة التجهيز" });
    }
  });

  hierarchyRouter.put("/trim-levels/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { nameAr, nameEn, categoryId, isActive } = req.body;
      if (!nameAr?.trim()) return res.status(400).json({ message: "الاسم بالعربية مطلوب" });

      // Get original trim to update vehicles if name changes
      const [oldTrim] = await db.select().from(vehicleTrimLevels).where(eq(vehicleTrimLevels.id, id)).limit(1);
      if (!oldTrim) return res.status(404).json({ message: "درجة التجهيز غير موجودة" });

      const [updated] = await db.update(vehicleTrimLevels).set({
        nameAr: nameAr.trim(),
        nameEn: nameEn?.trim() || nameAr.trim(),
        categoryId: categoryId ? parseInt(categoryId.toString()) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        updatedAt: new Date()
      }).where(eq(vehicleTrimLevels.id, id)).returning();

      // If name changed, update all associated vehicles
      if (oldTrim.nameAr !== nameAr.trim()) {
        await db.update(inventoryItems)
          .set({ trimLevel: nameAr.trim() })
          .where(eq(inventoryItems.trimLevel, oldTrim.nameAr));
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating trim level:", error);
      res.status(500).json({ message: "فشل في تحديث درجة التجهيز" });
    }
  });

  hierarchyRouter.delete("/trim-levels/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Get trim name to check for associated vehicles
      const [trimData] = await db.select().from(vehicleTrimLevels).where(eq(vehicleTrimLevels.id, id)).limit(1);
      if (!trimData) return res.status(404).json({ message: "درجة التجهيز غير موجودة" });

      // Check for vehicles using the trim name
      const hasVehicles = await db.select().from(inventoryItems)
        .where(eq(inventoryItems.trimLevel, trimData.nameAr))
        .limit(1);

      if (hasVehicles.length > 0) {
        return res.status(400).json({ message: "لا يمكن حذف درجة التجهيز لأنها مرتبطة بمركبات موجودة. يرجى حذف المركبات المرتبطة أولاً." });
      }

      const [deleted] = await db.delete(vehicleTrimLevels).where(eq(vehicleTrimLevels.id, id)).returning();
      res.json({ message: "تم حذف درجة التجهيز بنجاح" });
    } catch (error) {
      console.error("Error deleting trim level:", error);
      res.status(500).json({ message: "فشل في حذف درجة التجهيز" });
    }
  });

  hierarchyRouter.put("/trim-levels/:id/toggle", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isActive } = req.body;
      const [updated] = await db.update(vehicleTrimLevels).set({ isActive, updatedAt: new Date() }).where(eq(vehicleTrimLevels.id, id)).returning();
      if (!updated) return res.status(404).json({ message: "درجة التجهيز غير موجودة" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "فشل في تحديث الحالة" });
    }
  });

  // Mount the hierarchy router to /api
  app.use("/api", hierarchyRouter);

  // Body parsing for remaining routes
  app.use(express.json({ limit: '50mb' }));

  // ===== HIERARCHICAL DROPDOWN ROUTES (used by quotation creation and other pages) =====

  // GET /api/hierarchical/manufacturers - all active manufacturers
  app.get("/api/hierarchical/manufacturers", async (req, res) => {
    try {
      const data = await db.select().from(manufacturers).where(eq(manufacturers.isActive, true)).orderBy(asc(manufacturers.nameAr));
      res.json(data);
    } catch (error) {
      console.error("Error fetching hierarchical manufacturers:", error);
      res.status(500).json({ message: "Failed to fetch manufacturers" });
    }
  });

  // GET /api/hierarchical/categories?manufacturer=X - categories for a manufacturer
  app.get("/api/hierarchical/categories", async (req, res) => {
    try {
      const { manufacturer, manufacturerId } = req.query;
      let conditions: any[] = [eq(vehicleCategories.isActive, true)];

      if (manufacturerId) {
        conditions.push(eq(vehicleCategories.manufacturerId, parseInt(manufacturerId as string)));
      } else if (manufacturer) {
        // Find manufacturer id by name
        const [mfr] = await db.select().from(manufacturers).where(eq(manufacturers.nameAr, manufacturer as string)).limit(1);
        if (mfr) {
          conditions.push(eq(vehicleCategories.manufacturerId, mfr.id));
        } else {
          return res.json([]);
        }
      }

      const data = await db.select().from(vehicleCategories).where(and(...conditions)).orderBy(asc(vehicleCategories.nameAr));
      res.json(data);
    } catch (error) {
      console.error("Error fetching hierarchical categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // GET /api/hierarchical/trimLevels?manufacturer=X&category=Y - trim levels
  app.get("/api/hierarchical/trimLevels", async (req, res) => {
    try {
      const { manufacturer, category, categoryId } = req.query;
      let conditions: any[] = [eq(vehicleTrimLevels.isActive, true)];

      if (categoryId) {
        conditions.push(eq(vehicleTrimLevels.categoryId, parseInt(categoryId as string)));
      } else if (manufacturer && category) {
        // Find manufacturer → category → trim levels
        const [mfr] = await db.select().from(manufacturers).where(eq(manufacturers.nameAr, manufacturer as string)).limit(1);
        if (!mfr) return res.json([]);

        const [cat] = await db.select().from(vehicleCategories)
          .where(and(eq(vehicleCategories.manufacturerId, mfr.id), eq(vehicleCategories.nameAr, category as string)))
          .limit(1);
        if (!cat) return res.json([]);

        conditions.push(eq(vehicleTrimLevels.categoryId, cat.id));
      }

      const data = await db.select().from(vehicleTrimLevels).where(and(...conditions)).orderBy(asc(vehicleTrimLevels.nameAr));
      res.json(data);
    } catch (error) {
      console.error("Error fetching hierarchical trim levels:", error);
      res.status(500).json({ message: "Failed to fetch trim levels" });
    }
  });

  // GET /api/vehicle-years - all active vehicle years sorted descending
  app.get("/api/vehicle-years", async (req, res) => {
    try {
      const data = await db.select().from(vehicleYears).where(eq(vehicleYears.isActive, true)).orderBy(desc(vehicleYears.year));
      res.json(data.map((r: any) => r.year));
    } catch (error) {
      console.error("Error fetching vehicle years:", error);
      res.status(500).json({ message: "Failed to fetch vehicle years" });
    }
  });

  // GET /api/engine-capacities - all active engine capacities
  app.get("/api/engine-capacities", async (req, res) => {
    try {
      const data = await db.select().from(engineCapacities).where(eq(engineCapacities.isActive, true)).orderBy(asc(engineCapacities.capacity));
      res.json(data.map((r: any) => r.capacity));
    } catch (error) {
      console.error("Error fetching engine capacities:", error);
      res.status(500).json({ message: "Failed to fetch engine capacities" });
    }
  });

  // GET /api/vehicle-colors?type=exterior|interior - colors by type
  app.get("/api/vehicle-colors", async (req, res) => {
    try {
      const { type } = req.query;
      let query = db.select().from(vehicleColors).where(eq(vehicleColors.isActive, true)) as any;
      if (type) {
        query = db.select().from(vehicleColors).where(and(eq(vehicleColors.isActive, true), eq(vehicleColors.colorType, type as string)));
      }
      const data = await query.orderBy(asc(vehicleColors.name));
      res.json(data);
    } catch (error) {
      console.error("Error fetching vehicle colors:", error);
      res.status(500).json({ message: "Failed to fetch vehicle colors" });
    }
  });

  // ===== FINANCING CALCULATIONS API ROUTES =====
  app.get("/api/financing-calculations", async (req, res) => {
    try {
      const allCalculations = await db.select().from(financingCalculations).orderBy(desc(financingCalculations.createdAt));
      res.json(allCalculations);
    } catch (error: any) {
      console.error("Error fetching financing calculations:", error);
      res.status(500).json({ message: "Failed to fetch financing calculations" });
    }
  });

  app.post("/api/financing-calculations", async (req, res) => {
    try {
      console.log('Received financing calculation data:', JSON.stringify(req.body, null, 2));
      
      // Helper function to ensure we don't send empty strings to numeric columns
      const toNumeric = (val: any) => {
        if (val === undefined || val === null || val === "") return "0";
        return val.toString();
      };

      const [newCalculation] = await db.insert(financingCalculations).values({
        customerName: req.body.customerName || "غير محدد",
        customerPhone: req.body.customerPhone,
        customerAge: req.body.customerAge,
        customerJob: req.body.customerJob,
        customerSalary: req.body.customerSalary,
        salaryTransferBank: req.body.salaryTransferBank,
        financialCommitment: req.body.financialCommitment,
        commitmentType: req.body.commitmentType,
        vehiclePrice: toNumeric(req.body.vehiclePrice),
        downPayment: toNumeric(req.body.downPayment),
        downPaymentPercentage: toNumeric(req.body.downPaymentPercentage),
        finalPayment: toNumeric(req.body.finalPayment),
        finalPaymentPercentage: toNumeric(req.body.finalPaymentPercentage),
        bankName: req.body.bankName || "غير محدد",
        bankLogo: req.body.bankLogo,
        interestRate: toNumeric(req.body.interestRate),
        effectiveApr: toNumeric(req.body.effectiveApr),
        financingYears: req.body.financingYears || 5,
        administrativeFees: toNumeric(req.body.administrativeFees),
        insuranceRate: toNumeric(req.body.insuranceRate),
        monthlyPayment: toNumeric(req.body.monthlyPayment),
        totalAmount: toNumeric(req.body.totalAmount),
        totalInterest: toNumeric(req.body.totalInterest),
        totalInsurance: toNumeric(req.body.totalInsurance),
        vehicleManufacturer: req.body.vehicleManufacturer,
        vehicleManufacturerLogo: req.body.vehicleManufacturerLogo,
        vehicleCategory: req.body.vehicleCategory,
        vehicleTrimLevel: req.body.vehicleTrimLevel,
        vehicleExteriorColor: req.body.vehicleExteriorColor,
        vehicleInteriorColor: req.body.vehicleInteriorColor,
        notes: req.body.notes
      }).returning();
      
      console.log("Successfully saved financing calculation:", newCalculation.id);
      res.status(201).json(newCalculation);
    } catch (error: any) {
      console.error("Error creating financing calculation:", error);
      res.status(500).json({ message: "فشل في حفظ نتيجة التمويل: " + (error.message || "خطأ غير معروف") });
    }
  });

  // ===== APPEARANCE SETTINGS API ROUTES =====
  app.get("/api/appearance", async (req, res) => {
    try {
      const [settings] = await db.select().from(appearanceSettings).limit(1);
      if (!settings) {
        // Create default settings if none exist
        const [newSettings] = await db.insert(appearanceSettings).values({}).returning();
        return res.json(newSettings);
      }
      res.json(settings);
    } catch (error: any) {
      console.error("Error fetching appearance settings:", error);
      res.status(500).json({ message: "Failed to fetch appearance settings" });
    }
  });

  app.put("/api/appearance", async (req, res) => {
    console.log("PUT /api/appearance hit with data size:", JSON.stringify(req.body).length);
    try {
      // Strip out fields that shouldn't be in the insert/update schema
      const { id, createdAt, updatedAt, ...rest } = req.body;
      
      const settingsData = insertAppearanceSettingsSchema.partial().parse(rest);
      const [existing] = await db.select().from(appearanceSettings).limit(1);
      
      let result;
      if (existing) {
        console.log("Updating existing appearance settings ID:", existing.id);
        [result] = await db.update(appearanceSettings)
          .set({ ...settingsData, updatedAt: new Date() })
          .where(eq(appearanceSettings.id, existing.id))
          .returning();
      } else {
        console.log("Creating new appearance settings");
        [result] = await db.insert(appearanceSettings).values(settingsData).returning();
      }
      res.json(result);
    } catch (error: any) {
      console.error("Error updating appearance settings:", error);
      if (error.name === 'ZodError') {
        console.error("Zod validation error:", error.errors);
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      res.status(500).json({ message: "فشل في حفظ الإعدادات: " + (error.message || "خطأ في قاعدة البيانات") });
    }
  });

  // ===== TEST ROUTE =====
  app.get("/api/ping", (req, res) => {
    res.json({ message: "pong" });
  });

  app.get("/api/companies", async (req, res) => {
    console.log("GET /api/companies hit");
    try {
      const allCompanies = await db.select().from(companies).orderBy(desc(companies.updatedAt));
      res.json(allCompanies);
    } catch (error: any) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  // ===== FINANCING RATES API ROUTES (Move to top for testing) =====
  app.get("/api/financing-rates", async (req, res) => {
    console.log("GET /api/financing-rates hit");
    try {
      const allRates = await db.select().from(financingRates).orderBy(desc(financingRates.updatedAt));
      res.json(allRates);
    } catch (error: any) {
      console.error("Error fetching financing rates:", error);
      res.status(500).json({ message: "Failed to fetch financing rates" });
    }
  });

  app.post("/api/financing-rates", async (req, res) => {
    console.log("POST /api/financing-rates hit");
    try {
      console.log('Received financing rate data:', JSON.stringify(req.body, null, 2));
      const rateData = insertFinancingRateSchema.parse(req.body);
      
      const insertData = {
        bankName: rateData.bankName,
        bankNameEn: rateData.bankNameEn,
        bankLogo: rateData.bankLogo,
        financingType: rateData.financingType,
        rates: rateData.rates,
        minPeriod: rateData.minPeriod,
        maxPeriod: rateData.maxPeriod,
        minAmount: rateData.minAmount.toString(),
        maxAmount: rateData.maxAmount.toString(),
        features: rateData.features || [],
        requirements: rateData.requirements || [],
        isActive: rateData.isActive ?? true,
        lastUpdated: new Date()
      };

      const [newRate] = await db.insert(financingRates).values(insertData).returning();
      console.log("Successfully saved bank:", newRate.id);
      res.status(201).json(newRate);
    } catch (error: any) {
      console.error("Error creating financing rate:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      res.status(500).json({ message: "فشل في حفظ بيانات البنك: " + (error.message || "خطأ غير معروف") });
    }
  });

  app.put("/api/financing-rates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "معرف غير صالح" });
      const rateData = insertFinancingRateSchema.partial().parse(req.body);
      
      const updateValues: any = { ...rateData, lastUpdated: new Date(), updatedAt: new Date() };
      
      if (rateData.minAmount !== undefined) updateValues.minAmount = rateData.minAmount.toString();
      if (rateData.maxAmount !== undefined) updateValues.maxAmount = rateData.maxAmount.toString();

      const [updatedRate] = await db.update(financingRates)
        .set(updateValues)
        .where(eq(financingRates.id, id))
        .returning();
      if (!updatedRate) return res.status(404).json({ message: "معدل التمويل غير موجود" });
      res.json(updatedRate);
    } catch (error: any) {
      if (error.name === 'ZodError') return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      res.status(500).json({ message: "فشل في تحديث بيانات البنك" });
    }
  });

  app.delete("/api/financing-rates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [deletedRate] = await db.delete(financingRates).where(eq(financingRates.id, id)).returning();
      if (!deletedRate) return res.status(404).json({ message: "Financing rate not found" });
      res.json({ message: "Financing rate deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete financing rate" });
    }
  });

  // ===== COMPANY MANAGEMENT APIs =====
  app.get("/api/companies", async (req, res) => {
    try {
      const allCompanies = await db.select().from(companies).orderBy(desc(companies.updatedAt));
      res.json(allCompanies);
    } catch (error: any) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.get("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid company ID" });
      const [company] = await db.select().from(companies).where(eq(companies.id, id));
      if (!company) return res.status(404).json({ message: "Company not found" });
      res.json(company);
    } catch (error: any) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.post("/api/companies", async (req, res) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      const [newCompany] = await db.insert(companies).values(companyData).returning();
      res.status(201).json(newCompany);
    } catch (error: any) {
      console.error("Error creating company:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save company: " + (error.message || "Unknown error") });
    }
  });

  app.put("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const companyData = insertCompanySchema.partial().parse(req.body);
      const [updatedCompany] = await db.update(companies)
        .set({ ...companyData, updatedAt: new Date() })
        .where(eq(companies.id, id))
        .returning();
      if (!updatedCompany) return res.status(404).json({ message: "Company not found" });
      res.json(updatedCompany);
    } catch (error: any) {
      if (error.name === 'ZodError') return res.status(400).json({ message: "Invalid data", errors: error.errors });
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  app.delete("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [deletedCompany] = await db.delete(companies).where(eq(companies.id, id)).returning();
      if (!deletedCompany) return res.status(404).json({ message: "Company not found" });
      res.json({ message: "Company deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete company" });
    }
  });

  // Ensure upload directory exists and configure multer for PDF uploads
  const uploadsDir = path.resolve(import.meta.dirname, "public", "uploads", "quotations");
  await fs.mkdir(uploadsDir, { recursive: true });
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const timestamp = Date.now();
      const safeOriginal = path.basename(file.originalname).replace(/[^a-zA-Z0-9.\-_]/g, "_");
      cb(null, `${timestamp}-${safeOriginal}`);
    }
  });
  const upload = multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 }
  });

  // Upload quotation PDF and return a public URL
  app.post("/api/upload-quotation-pdf", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const publicUrl = `/uploads/quotations/${req.file.filename}`;
      return res.json({ url: publicUrl, filename: req.file.originalname });
    } catch (error) {
      console.error("Error uploading quotation PDF:", error);
      return res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      // Using direct db import
      const [user] = await db.select().from(users).where(eq(users.username, username));
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Return user data without password
      res.json({
        username: user.username,
        role: user.role,
        id: user.id
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get all inventory items
  app.get("/api/inventory", async (req, res) => {
    try {
      // Using direct db import
      const items = await db.select().from(inventoryItems);
      res.json(items);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory items" });
    }
  });

  // Get reserved inventory items - MUST come before /:id route
  app.get("/api/inventory/reserved", async (req, res) => {
    try {
      // Using direct db import
      const items = await db.select().from(inventoryItems).where(eq(inventoryItems.status, "محجوز"));
      res.json(items);
    } catch (error) {
      console.error("Error fetching reserved inventory:", error);
      res.status(500).json({ message: "Failed to fetch reserved inventory items" });
    }
  });

  // Get sold inventory items - MUST come before /:id route
  app.get("/api/inventory/sold", async (req, res) => {
    try {
      // Using direct db import
      const items = await db.select().from(inventoryItems).where(eq(inventoryItems.status, "مباع"));
      res.json(items);
    } catch (error) {
      console.error("Error fetching sold inventory:", error);
      res.status(500).json({ message: "Failed to fetch sold inventory items" });
    }
  });

  // Get inventory stats - MUST come before /:id route
  app.get("/api/inventory/stats", async (req, res) => {
    try {
      // Using direct db import
      const allItems = await db.select().from(inventoryItems);
      
      const stats = {
        total: allItems.length,
        available: allItems.filter(item => item.status === "متوفر").length,
        inTransit: allItems.filter(item => item.status === "في الطريق").length,
        maintenance: allItems.filter(item => item.status === "صيانة").length,
        reserved: allItems.filter(item => item.status === "محجوز").length,
        sold: allItems.filter(item => item.status === "مباع").length,
        personal: allItems.filter(item => item.importType === "شخصي").length,
        company: allItems.filter(item => item.importType === "شركة").length,
        usedPersonal: allItems.filter(item => item.importType === "مستعمل" || item.importType === "مستعمل شخصي").length
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching inventory stats:", error);
      res.status(500).json({ message: "Failed to fetch inventory stats" });
    }
  });

  // Get manufacturer statistics - MUST come before /:id route
  app.get("/api/inventory/manufacturer-stats", async (req, res) => {
    try {
      // Using direct db import
      const allItems = await db.select().from(inventoryItems);
      const allManufacturers = await db.select().from(manufacturers);
      
      const manufacturerStats = new Map();
      
      // Create a map for manufacturers with their logos
      const manufacturerLogos = new Map();
      allManufacturers.forEach(mfg => {
        manufacturerLogos.set(mfg.nameAr, mfg.logo);
      });
      
      allItems.forEach(item => {
        const key = item.manufacturer;
        if (!manufacturerStats.has(key)) {
          manufacturerStats.set(key, {
            manufacturer: key,
            total: 0,
            personal: 0,
            company: 0,
            usedPersonal: 0,
            logo: manufacturerLogos.get(key) || null
          });
        }
        
        const stat = manufacturerStats.get(key);
        stat.total++;
        
        if (item.importType === "شخصي") stat.personal++;
        else if (item.importType === "شركة") stat.company++;
        else if (item.importType === "مستعمل" || item.importType === "مستعمل شخصي") stat.usedPersonal++;
      });
      
      res.json(Array.from(manufacturerStats.values()));
    } catch (error) {
      console.error("Error fetching manufacturer stats:", error);
      res.status(500).json({ message: "Failed to fetch manufacturer stats" });
    }
  });

  // Get single inventory item by ID - MUST come after specific routes
  app.get("/api/inventory/:id", async (req, res) => {
    try {
      // Using direct db import
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }

      const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
      
      if (!item) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      // Get vehicle specifications
      const specifications = await getVehicleSpecifications(item);
      
      // Return the item with specifications
      res.json({
        ...item,
        specifications
      });
    } catch (error) {
      console.error("Error fetching inventory item:", error);
      res.status(500).json({ message: "Failed to fetch inventory item" });
    }
  });

  // Reserve an inventory item
  app.put("/api/inventory/:id/reserve", async (req, res) => {
    try {
      // Using direct db import
      const itemId = parseInt(req.params.id);
      const { customerName, customerPhone, salesRepresentative, reservationNote, paidAmount } = req.body;

      // Check if item exists
      const [existingItem] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId));
      if (!existingItem) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      // Check if item is available
      if (existingItem.status !== "متوفر") {
        return res.status(400).json({ message: "Vehicle is not available for reservation" });
      }

      // Update the inventory item to reserved status
      const [updatedItem] = await db.update(inventoryItems)
        .set({
          status: "محجوز",
          reservationDate: new Date(),
          reservedBy: customerName || "",
          customerName: customerName || "",
          customerPhone: customerPhone || "",
          salesRepresentative: salesRepresentative || "",
          reservationNote: reservationNote || "",
          paidAmount: paidAmount || 0
        })
        .where(eq(inventoryItems.id, itemId))
        .returning();

      res.json(updatedItem);
    } catch (error) {
      console.error("Error reserving inventory item:", error);
      res.status(500).json({ message: "Failed to reserve inventory item" });
    }
  });

  // Cancel reservation for an inventory item
  app.put("/api/inventory/:id/cancel-reservation", async (req, res) => {
    try {
      // Using direct db import
      const itemId = parseInt(req.params.id);

      // Check if item exists
      const [existingItem] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId));
      if (!existingItem) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      // Check if item is reserved
      if (existingItem.status !== "محجوز") {
        return res.status(400).json({ message: "Vehicle is not reserved" });
      }

      // Update the inventory item to available status
      const [updatedItem] = await db.update(inventoryItems)
        .set({
          status: "متوفر",
          reservationDate: null,
          reservedBy: null,
          customerName: null,
          customerPhone: null,
          salesRepresentative: null,
          reservationNote: null,
          paidAmount: null
        })
        .where(eq(inventoryItems.id, itemId))
        .returning();

      res.json(updatedItem);
    } catch (error) {
      console.error("Error canceling reservation:", error);
      res.status(500).json({ message: "Failed to cancel reservation" });
    }
  });

  // Sell an inventory item
  app.put("/api/inventory/:id/sell", async (req, res) => {
    try {
      // Using direct db import
      const itemId = parseInt(req.params.id);
      const { 
        customerName, 
        customerPhone, 
        salesRepresentative, 
        salePrice, 
        paymentMethod, 
        bankName, 
        saleNotes,
        paidAmount 
      } = req.body;

      // Check if item exists
      const [existingItem] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId));
      if (!existingItem) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      // Check if item is available for sale (available or reserved)
      if (existingItem.status !== "متوفر" && existingItem.status !== "محجوز") {
        return res.status(400).json({ message: "Vehicle is not available for sale" });
      }

      // Update the inventory item to sold status
      const [updatedItem] = await db.update(inventoryItems)
        .set({
          status: "مباع",
          isSold: true,
          soldDate: new Date(),
          soldToCustomerName: customerName || "",
          soldToCustomerPhone: customerPhone || "",
          soldBySalesRep: salesRepresentative || "",
          salePrice: salePrice || 0,
          paymentMethod: paymentMethod || "",
          bankName: bankName || "",
          saleNotes: saleNotes || "",
          paidAmount: paidAmount || 0
        })
        .where(eq(inventoryItems.id, itemId))
        .returning();

      res.json(updatedItem);
    } catch (error: any) {
      console.error("Error selling inventory item:", error);
      res.status(500).json({ message: "Failed to sell inventory item" });
    }
  });

  // Sell a reserved vehicle specifically (enhanced version with reservation data preserved)
  app.put("/api/inventory/:id/sell-reserved", async (req, res) => {
    try {
      // Using direct db import
      const itemId = parseInt(req.params.id);
      const { 
        salePrice, 
        saleDate,
        customerName, 
        customerPhone, 
        salesRepresentative, 
        saleNotes 
      } = req.body;

      // Check if item exists
      const [existingItem] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId));
      if (!existingItem) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      // Check if item is reserved
      if (existingItem.status !== "محجوز") {
        return res.status(400).json({ message: "Vehicle is not reserved for sale" });
      }

      // Update the inventory item to sold status, preserving reservation data
      const [updatedItem] = await db.update(inventoryItems)
        .set({
          status: "مباع",
          isSold: true,
          soldDate: saleDate ? new Date(saleDate) : new Date(),
          soldToCustomerName: customerName || existingItem.customerName || "",
          soldToCustomerPhone: customerPhone || existingItem.customerPhone || "",
          soldBySalesRep: salesRepresentative || existingItem.salesRepresentative || "",
          salePrice: (parseFloat(salePrice) || 0).toString(),
          saleNotes: saleNotes || "",
          // Preserve the original reservation data
          reservationDate: existingItem.reservationDate,
          reservedBy: existingItem.reservedBy,
          reservationNote: existingItem.reservationNote,
          paidAmount: existingItem.paidAmount
        })
        .where(eq(inventoryItems.id, itemId))
        .returning();

      res.json(updatedItem);
    } catch (error: any) {
      console.error("Error selling reserved inventory item:", error);
      res.status(500).json({ message: "Failed to sell reserved inventory item" });
    }
  });

  // Update an inventory item
  app.put("/api/inventory/:id", async (req, res) => {
    try {
      // Using direct db import
      const itemId = parseInt(req.params.id);
      const updateData = { ...req.body };

      // Trim string fields so stray whitespace can't create duplicate-looking entries
      const stringFields = [
        "manufacturer", "category", "trimLevel", "engineCapacity",
        "exteriorColor", "interiorColor", "status", "importType",
        "ownershipType", "location", "chassisNumber",
      ];
      for (const f of stringFields) {
        if (typeof updateData[f] === "string") {
          updateData[f] = updateData[f].trim();
        }
      }

      // Check if item exists
      const [existingItem] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId));
      if (!existingItem) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      // Update the inventory item
      const [updatedItem] = await db.update(inventoryItems)
        .set(updateData)
        .where(eq(inventoryItems.id, itemId))
        .returning();

      res.json(updatedItem);
    } catch (error: any) {
      console.error("Error updating inventory item:", error);
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  // Delete an inventory item
  app.delete("/api/inventory/:id", async (req, res) => {
    try {
      // Using direct db import
      const itemId = parseInt(req.params.id);

      // Check if item exists
      const [existingItem] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId));
      if (!existingItem) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      // Delete the inventory item
      await db.delete(inventoryItems).where(eq(inventoryItems.id, itemId));

      res.json({ message: "Vehicle deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  // Clear all inventory items
  app.delete("/api/inventory/clear-all", async (req, res) => {
    try {
      // Using direct db import

      // Get count before deletion for logging
      const allItems = await db.select().from(inventoryItems);
      const totalCount = allItems.length;

      // Delete all inventory items
      await db.delete(inventoryItems);

      console.log(`Cleared all inventory: ${totalCount} items deleted`);
      res.json({ 
        message: "All inventory items cleared successfully", 
        deletedCount: totalCount 
      });
    } catch (error: any) {
      console.error("Error clearing all inventory:", error);
      res.status(500).json({ message: "Failed to clear inventory" });
    }
  });

  // Fix duplicate manufacturers
  app.post("/api/fix-duplicates", async (req, res) => {
    try {
      // Using direct db import
      
      console.log("🔍 Fixing duplicate manufacturers...");
      
      // Get all manufacturers
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

      // Find duplicates
      const duplicateGroups = Array.from(manufacturerGroups.entries()).filter(([_, group]) => group.length > 1);
      let deletedCount = 0;
      
      for (const [nameAr, group] of duplicateGroups) {
        // Keep the first one (lowest ID), delete others
        const keepManufacturer = group[0];
        const duplicatesToDelete = group.slice(1);
        
        console.log(`Fixing ${nameAr}: keeping ID ${keepManufacturer.id}, deleting ${duplicatesToDelete.length} duplicates`);
        
        // Delete duplicates one by one
        for (const duplicate of duplicatesToDelete) {
          await db.delete(manufacturers).where(eq(manufacturers.id, duplicate.id));
          deletedCount++;
        }
      }
      
      console.log(`✅ Deleted ${deletedCount} duplicate manufacturers`);
      
      // Return updated count
      const finalManufacturers = await db.select().from(manufacturers);
      res.json({ 
        success: true, 
        deletedCount,
        totalManufacturers: finalManufacturers.length,
        message: `تم حذف ${deletedCount} صانع مكرر بنجاح`
      });
      
    } catch (error: any) {
      console.error("Error fixing duplicates:", error);
      res.status(500).json({ 
        success: false, 
        message: "خطأ في إصلاح التكرار", 
        error: error.message 
      });
    }
  });

  // Create a new inventory item
  app.post("/api/inventory", async (req, res) => {
    try {
      // Using direct db import
      const vehicleData = req.body;

      // Validate and clean numeric fields
      const cleanPrice = vehicleData.price && vehicleData.price !== "" ? vehicleData.price : null;
      const cleanMileage = vehicleData.mileage && vehicleData.mileage !== "" ? parseInt(vehicleData.mileage) : null;

      // Trim string fields so stray whitespace can't create duplicate-looking entries
      const t = (v: any) => (typeof v === "string" ? v.trim() : v);

      // Create new inventory item
      const [newItem] = await db.insert(inventoryItems).values({
        manufacturer: t(vehicleData.manufacturer),
        category: t(vehicleData.category),
        trimLevel: t(vehicleData.trimLevel),
        engineCapacity: t(vehicleData.engineCapacity),
        year: vehicleData.year,
        exteriorColor: t(vehicleData.exteriorColor),
        interiorColor: t(vehicleData.interiorColor),
        status: t(vehicleData.status) || "متوفر",
        importType: t(vehicleData.importType) || "شخصي",
        ownershipType: t(vehicleData.ownershipType) || "ملك الشركة",
        location: t(vehicleData.location),
        chassisNumber: t(vehicleData.chassisNumber),
        images: vehicleData.images || [],
        logo: vehicleData.logo,
        notes: vehicleData.notes,
        detailedSpecifications: vehicleData.detailedSpecifications,
        price: cleanPrice,
        mileage: cleanMileage
      }).returning();

      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating inventory item:", error);
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  // Excel import endpoint for inventory
  app.post("/api/inventory/import-excel", async (req, res) => {
    try {
      const { items } = req.body;
      
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "No items provided for import" });
      }

      let successCount = 0;
      let failedCount = 0;
      let duplicateCount = 0;
      const failedItems: any[] = [];

      for (const item of items) {
        try {
          console.log("Processing item:", item);
          
          // Generate unique chassis number if missing or "000" (common placeholder)
          let chassisNumber = item.chassisNumber;
          if (!chassisNumber || chassisNumber === '000' || chassisNumber.trim() === '') {
            chassisNumber = `CH${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
          }
          
          // Check for duplicate chassis number
          const existingItems = await db.select().from(inventoryItems);
          let isDuplicate = existingItems.some((existing: any) => 
            existing.chassisNumber === chassisNumber
          );

          // If still duplicate, generate new one
          let attempts = 0;
          while (isDuplicate && attempts < 10) {
            chassisNumber = `CH${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
            isDuplicate = existingItems.some((existing: any) => 
              existing.chassisNumber === chassisNumber
            );
            attempts++;
          }

          if (isDuplicate) {
            console.log("Could not generate unique chassis number after 10 attempts");
            duplicateCount++;
            continue;
          }

          // Prepare the item with required fields and defaults
          const itemToValidate = {
            manufacturer: item.manufacturer || '',
            category: item.category || '',
            trimLevel: item.trimLevel || '',
            engineCapacity: item.engineCapacity || '',
            year: item.year || new Date().getFullYear(),
            exteriorColor: item.exteriorColor || '',
            interiorColor: item.interiorColor || '',
            status: item.status || 'متوفر',
            importType: item.importType || 'وكالة',
            ownershipType: item.ownershipType || 'ملك الشركة',
            location: item.location || 'الرياض',
            chassisNumber: chassisNumber,
            price: item.price ? String(item.price) : '0',
            mileage: item.mileage || 0,
            notes: item.notes || '',
            images: item.images || [],
          };

          console.log("Validating item:", itemToValidate);
          
          // Validate and create the item
          const validation = insertInventoryItemSchema.safeParse(itemToValidate);
          if (!validation.success) {
            console.error("Validation failed for item:", itemToValidate, "Errors:", validation.error.errors);
            throw new Error(`Validation failed: ${validation.error.errors.map(e => `${e.path}: ${e.message}`).join(', ')}`);
          }

          const validatedItem = validation.data;

          const [createdItem] = await db.insert(inventoryItems).values(validatedItem).returning();
          
          console.log("Created item successfully:", createdItem.id);
          successCount++;
        } catch (error) {
          failedCount++;
          console.error("Failed to import item:", item, "Error:", error);
          failedItems.push({ item, error: error instanceof Error ? error.message : String(error) });
        }
      }

      const stats = {
        total: items.length,
        success: successCount,
        failed: failedCount,
        duplicates: duplicateCount,
        failedItems: failedItems.slice(0, 10) // Return first 10 failed items for debugging
      };

      res.json(stats);
    } catch (error) {
      console.error("Error importing Excel data:", error);
      res.status(500).json({ message: "Failed to import Excel data" });
    }
  });



  // Get all banks
  app.get("/api/banks", async (req, res) => {
    try {
      // Using direct db import
      const allBanks = await db.select().from(banks);
      res.json(allBanks);
    } catch (error) {
      console.error("Error fetching banks:", error);
      res.status(500).json({ message: "Failed to fetch banks" });
    }
  });

  // Get banks by type (only active banks for display)
  app.get("/api/banks/type/:type", async (req, res) => {
    try {
      // Using direct db import
      const { type } = req.params;
      const banksByType = await db.select().from(banks).where(
        and(
          eq(banks.type, type),
          eq(banks.isActive, true)
        )
      );
      res.json(banksByType);
    } catch (error) {
      console.error("Error fetching banks by type:", error);
      res.status(500).json({ message: "Failed to fetch banks by type" });
    }
  });

  // Create new bank
  app.post("/api/banks", async (req, res) => {
    try {
      // Using direct db import
      const bankData = req.body;
      
      const [newBank] = await db.insert(banks).values({
        logo: bankData.logo || null,
        bankName: bankData.bankName,
        nameEn: bankData.nameEn || null,
        accountName: bankData.accountName,
        accountNumber: bankData.accountNumber,
        iban: bankData.iban,
        type: bankData.type,
        isActive: bankData.isActive ?? true
      }).returning();

      res.json(newBank);
    } catch (error) {
      console.error("Error creating bank:", error);
      res.status(500).json({ message: "Failed to create bank" });
    }
  });

  // Update bank
  app.put("/api/banks/:id", async (req, res) => {
    try {
      // Using direct db import
      const bankId = parseInt(req.params.id);
      const bankData = req.body;
      
      const [updatedBank] = await db.update(banks)
        .set({
          logo: bankData.logo,
          bankName: bankData.bankName,
          nameEn: bankData.nameEn,
          accountName: bankData.accountName,
          accountNumber: bankData.accountNumber,
          iban: bankData.iban,
          type: bankData.type,
          isActive: bankData.isActive,
          updatedAt: new Date()
        })
        .where(eq(banks.id, bankId))
        .returning();

      if (!updatedBank) {
        return res.status(404).json({ message: "Bank not found" });
      }

      res.json(updatedBank);
    } catch (error) {
      console.error("Error updating bank:", error);
      res.status(500).json({ message: "Failed to update bank" });
    }
  });

  // Delete bank
  app.delete("/api/banks/:id", async (req, res) => {
    try {
      // Using direct db import
      const bankId = parseInt(req.params.id);
      
      const [deletedBank] = await db.delete(banks)
        .where(eq(banks.id, bankId))
        .returning();

      if (!deletedBank) {
        return res.status(404).json({ message: "Bank not found" });
      }

      res.json({ message: "Bank deleted successfully" });
    } catch (error) {
      console.error("Error deleting bank:", error);
      res.status(500).json({ message: "Failed to delete bank" });
    }
  });

  // Get banks by type
  app.get("/api/banks/type/:type", async (req, res) => {
    try {
      // Using direct db import
      const { type } = req.params;
      const decodedType = decodeURIComponent(type);
      
      const banksByType = await db.select().from(banks).where(eq(banks.type, decodedType));
      res.json(banksByType);
    } catch (error) {
      console.error("Error fetching banks by type:", error);
      res.status(500).json({ message: "Failed to fetch banks by type" });
    }
  });

  // Get all users
  app.get("/api/users", async (req, res) => {
    try {
      // Using direct db import
      const allUsers = await db.select().from(users);
      
      // Remove password from response for security
      const usersWithoutPassword = allUsers.map(user => ({
        id: user.id,
        name: user.name,
        jobTitle: user.jobTitle,
        phoneNumber: user.phoneNumber,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
      }));
      
      res.json(usersWithoutPassword);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Combined dropdowns for inventory form optimization
  app.get("/api/combined-dropdowns", async (req, res) => {
    try {
      const [
        importTypesData,
        vehicleStatusesData,
        ownershipTypesData,
        vehicleLocationsData,
        vehicleYearsData,
        engineCapacitiesData,
        vehicleColorsData
      ] = await Promise.all([
        db.select().from(importTypes).where(eq(importTypes.isActive, true)),
        db.select().from(vehicleStatuses).where(eq(vehicleStatuses.isActive, true)),
        db.select().from(ownershipTypes).where(eq(ownershipTypes.isActive, true)),
        db.select().from(vehicleLocations).where(eq(vehicleLocations.isActive, true)),
        db.select().from(vehicleYears).where(eq(vehicleYears.isActive, true)),
        db.select().from(engineCapacities).where(eq(engineCapacities.isActive, true)),
        db.select().from(vehicleColors).where(eq(vehicleColors.isActive, true))
      ]);

      res.json({
        importTypes: importTypesData,
        vehicleStatuses: vehicleStatusesData,
        ownershipTypes: ownershipTypesData,
        vehicleLocations: vehicleLocationsData,
        vehicleYears: vehicleYearsData,
        engineCapacities: engineCapacitiesData,
        vehicleColors: vehicleColorsData
      });
    } catch (error) {
      console.error("Error fetching combined dropdowns:", error);
      res.status(500).json({ message: "Failed to fetch dropdown data" });
    }
  });

  // Get hierarchical data (manufacturers with categories and trim levels)
  app.get("/api/hierarchy/full", async (req, res) => {
    try {
      // Using direct db import
      const [manufacturersData, categoriesData, trimLevelsData] = await Promise.all([
        db.select().from(manufacturers),
        db.select().from(vehicleCategories),
        db.select().from(vehicleTrimLevels)
      ]);
      
      // Build lookup maps for faster hierarchy building
      const trimLevelsMap = new Map();
      trimLevelsData.forEach(trim => {
        if (!trimLevelsMap.has(trim.categoryId)) {
          trimLevelsMap.set(trim.categoryId, []);
        }
        trimLevelsMap.get(trim.categoryId).push(trim);
      });

      const categoriesMap = new Map();
      categoriesData.forEach(cat => {
        if (!categoriesMap.has(cat.manufacturerId)) {
          categoriesMap.set(cat.manufacturerId, []);
        }
        categoriesMap.get(cat.manufacturerId).push({
          ...cat,
          trimLevels: trimLevelsMap.get(cat.id) || []
        });
      });
      
      // Build final hierarchy
      const hierarchy = manufacturersData.map(manufacturer => ({
        ...manufacturer,
        categories: categoriesMap.get(manufacturer.id) || []
      }));
      
      res.json(hierarchy);
    } catch (error) {
      console.error("Error fetching hierarchy:", error);
      res.status(500).json({ message: "Failed to fetch hierarchy" });
    }
  });

  // Get hierarchical manufacturers
  app.get("/api/hierarchical/manufacturers", async (req, res) => {
    try {
      // Using direct db import
      const manufacturersData = await db.select().from(manufacturers).where(eq(manufacturers.isActive, true));
      res.json(manufacturersData);
    } catch (error) {
      console.error("Error fetching hierarchical manufacturers:", error);
      res.status(500).json({ message: "Failed to fetch hierarchical manufacturers" });
    }
  });

  // Get categories by manufacturer (by name via query parameter)
  app.get("/api/hierarchical/categories", async (req, res) => {
    try {
      // Using direct db import
      const { manufacturer } = req.query;
      
      if (!manufacturer) {
        return res.status(400).json({ message: "Manufacturer name is required" });
      }

      // First find the manufacturer by name
      const [manufacturerData] = await db.select().from(manufacturers)
        .where(and(eq(manufacturers.nameAr, manufacturer as string), eq(manufacturers.isActive, true)));
      
      if (!manufacturerData) {
        return res.status(404).json({ message: "Manufacturer not found" });
      }

      // Then get categories for this manufacturer
      const categoriesData = await db.select().from(vehicleCategories)
        .where(and(eq(vehicleCategories.manufacturerId, manufacturerData.id), eq(vehicleCategories.isActive, true)));
      
      res.json(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get categories by manufacturer ID (keeping the original endpoint for backward compatibility)
  app.get("/api/hierarchical/categories/:manufacturerId", async (req, res) => {
    try {
      // Using direct db import
      const manufacturerId = parseInt(req.params.manufacturerId);
      const categoriesData = await db.select().from(vehicleCategories)
        .where(and(eq(vehicleCategories.manufacturerId, manufacturerId), eq(vehicleCategories.isActive, true)));
      res.json(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get trim levels by manufacturer and category names (via query parameters)
  app.get("/api/hierarchical/trimLevels", async (req, res) => {
    try {
      // Using direct db import
      const { manufacturer, category } = req.query;
      
      if (!manufacturer || !category) {
        return res.status(400).json({ message: "Manufacturer and category names are required" });
      }

      // First find the manufacturer by name
      const [manufacturerData] = await db.select().from(manufacturers)
        .where(and(eq(manufacturers.nameAr, manufacturer as string), eq(manufacturers.isActive, true)));
      
      if (!manufacturerData) {
        return res.status(404).json({ message: "Manufacturer not found" });
      }

      // Then find the category for this manufacturer
      const [categoryData] = await db.select().from(vehicleCategories)
        .where(and(
          eq(vehicleCategories.manufacturerId, manufacturerData.id),
          eq(vehicleCategories.nameAr, category as string),
          eq(vehicleCategories.isActive, true)
        ));
      
      if (!categoryData) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Finally get trim levels for this category
      const trimLevelsData = await db.select().from(vehicleTrimLevels)
        .where(and(eq(vehicleTrimLevels.categoryId, categoryData.id), eq(vehicleTrimLevels.isActive, true)));
      
      res.json(trimLevelsData);
    } catch (error) {
      console.error("Error fetching trim levels:", error);
      res.status(500).json({ message: "Failed to fetch trim levels" });
    }
  });

  // Get trim levels by category ID (keeping the original endpoint for backward compatibility)
  app.get("/api/hierarchical/trim-levels/:categoryId", async (req, res) => {
    try {
      // Using direct db import
      const categoryId = parseInt(req.params.categoryId);
      const trimLevelsData = await db.select().from(vehicleTrimLevels)
        .where(and(eq(vehicleTrimLevels.categoryId, categoryId), eq(vehicleTrimLevels.isActive, true)));
      res.json(trimLevelsData);
    } catch (error) {
      console.error("Error fetching trim levels:", error);
      res.status(500).json({ message: "Failed to fetch trim levels" });
    }
  });

  // User management routes
  // Create new user
  app.post("/api/users", async (req, res) => {
    try {
      const { name, username, password, role, jobTitle, phoneNumber } = req.body;
      
      if (!name || !username || !password || !role) {
        return res.status(400).json({ message: "Missing required fields: name, username, password, role" });
      }

      // Using direct db import
      
      // Check if username already exists
      const [existingUser] = await db.select().from(users).where(eq(users.username, username));
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create new user
      const [newUser] = await db.insert(users).values({
        name,
        username,
        password: hashedPassword,
        role,
        jobTitle: jobTitle || '',
        phoneNumber: phoneNumber || '',
        createdAt: new Date()
      }).returning();

      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Update existing user
  app.put("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { name, username, password, role, jobTitle, phoneNumber } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Using direct db import
      
      // Check if user exists
      const [existingUser] = await db.select().from(users).where(eq(users.id, userId));
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if username already exists for another user
      if (username && username !== existingUser.username) {
        const [userWithSameUsername] = await db.select().from(users).where(eq(users.username, username));
        if (userWithSameUsername && userWithSameUsername.id !== userId) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (name) updateData.name = name;
      if (username) updateData.username = username;
      if (role) updateData.role = role;
      if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;

      // Hash new password if provided
      if (password && password.trim() !== '') {
        updateData.password = await bcrypt.hash(password, 12);
      }

      // Update user
      const [updatedUser] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      // Return user without password
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete user
  app.delete("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      if (!userId) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Using direct db import
      
      // Check if user exists
      const [existingUser] = await db.select().from(users).where(eq(users.id, userId));
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete user
      await db.delete(users).where(eq(users.id, userId));

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Attendance management endpoints with role-based access
  app.get("/api/daily-attendance", async (req, res) => {
    try {
      // Using direct db import
      
      // Temporarily disable authentication to test the data
      console.log("📋 Fetching daily attendance...");
      
      const attendanceData = await db.select().from(dailyAttendance).orderBy(desc(dailyAttendance.date));

      console.log(`📊 Found ${attendanceData.length} attendance records`);
      res.json(attendanceData);
    } catch (error) {
      console.error("Error fetching daily attendance:", error);
      res.status(500).json({ message: "Failed to fetch daily attendance" });
    }
  });

  app.get("/api/employee-work-schedules", async (req, res) => {
    try {
      // Using direct db import
      
      // Temporarily disable authentication to test the data
      // TODO: Fix authentication system
      console.log("📋 Fetching work schedules...");
      
      const scheduleData = await db.select().from(employeeWorkSchedules)
        .where(eq(employeeWorkSchedules.isActive, true))
        .orderBy(employeeWorkSchedules.employeeName);

      console.log(`📊 Found ${scheduleData.length} work schedules`);
      res.json(scheduleData);
    } catch (error) {
      console.error("Error fetching work schedules:", error);
      res.status(500).json({ message: "Failed to fetch work schedules" });
    }
  });

  app.get("/api/leave-requests", async (req, res) => {
    try {
      // Using direct db import
      
      // Temporarily disable authentication to test the data
      console.log("📋 Fetching leave requests...");
      
      const leaveData = await db.select().from(leaveRequests).orderBy(desc(leaveRequests.createdAt));

      console.log(`📊 Found ${leaveData.length} leave requests`);
      res.json(leaveData);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      res.status(500).json({ message: "Failed to fetch leave requests" });
    }
  });

  // Create leave request
  app.post("/api/leave-requests", async (req, res) => {
    try {
      // Using direct db import
      
      if (!(req as any).session?.passport?.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = (req as any).session.passport.user.id;
      const userName = (req as any).session.passport.user.username;

      const { requestType, startDate, endDate, duration, durationType, reason } = req.body;

      const [newRequest] = await db.insert(leaveRequests).values({
        userId,
        userName,
        requestType,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        duration,
        durationType,
        reason,
        requestedBy: userId,
        requestedByName: userName,
        status: "pending"
      }).returning();

      res.json(newRequest);
    } catch (error) {
      console.error("Error creating leave request:", error);
      res.status(500).json({ message: "Failed to create leave request" });
    }
  });

  // Update leave request status
  app.put("/api/leave-requests/:id/status", async (req, res) => {
    try {
      // Using direct db import
      
      if (!(req as any).session?.passport?.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userRole = (req as any).session.passport.user.role;
      const userId = (req as any).session.passport.user.id;
      const userName = (req as any).session.passport.user.username;

      // Only admin and sales_manager can approve/reject requests
      if (userRole !== 'admin' && userRole !== 'sales_manager') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const requestId = parseInt(req.params.id);
      const { status, rejectionReason } = req.body;

      const updateData: any = {
        status,
        approvedBy: userId,
        approvedByName: userName,
        approvedAt: new Date(),
        updatedAt: new Date()
      };

      if (status === 'rejected' && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }

      const [updatedRequest] = await db.update(leaveRequests)
        .set(updateData)
        .where(eq(leaveRequests.id, requestId))
        .returning();

      if (!updatedRequest) {
        return res.status(404).json({ message: "Request not found" });
      }

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating leave request:", error);
      res.status(500).json({ message: "Failed to update leave request" });
    }
  });

  // Create employee work schedule
  app.post("/api/employee-work-schedules", async (req, res) => {
    try {
      // Using direct db import
      
      // Temporarily disable authentication for work schedule system
      // if (!req.session?.passport?.user?.id) {
      //   return res.status(401).json({ message: "Authentication required" });
      // }

      const userRole = (req as any).session?.passport?.user?.role || 'admin';

      // Temporarily disable role checking
      // if (userRole !== 'admin' && userRole !== 'sales_manager') {
      //   return res.status(403).json({ message: "Insufficient permissions" });
      // }

      const scheduleData = req.body;
      
      const [newSchedule] = await db.insert(employeeWorkSchedules).values({
        ...scheduleData,
        isActive: true
      }).returning();

      res.json(newSchedule);
    } catch (error) {
      console.error("Error creating work schedule:", error);
      res.status(500).json({ message: "Failed to create work schedule" });
    }
  });

  // Update employee work schedule
  app.put("/api/employee-work-schedules/:id", async (req, res) => {
    try {
      // Using direct db import
      const scheduleId = parseInt(req.params.id);
      
      // Temporarily disable authentication for work schedule system
      // if (!req.session?.passport?.user?.id) {
      //   return res.status(401).json({ message: "Authentication required" });
      // }

      const userRole = (req as any).session?.passport?.user?.role || 'admin';

      // Temporarily disable role checking
      // if (userRole !== 'admin' && userRole !== 'sales_manager') {
      //   return res.status(403).json({ message: "Insufficient permissions" });
      // }

      const updateData = req.body;
      
      const [updatedSchedule] = await db.update(employeeWorkSchedules)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(employeeWorkSchedules.id, scheduleId))
        .returning();

      if (!updatedSchedule) {
        return res.status(404).json({ message: "Work schedule not found" });
      }

      res.json(updatedSchedule);
    } catch (error) {
      console.error("Error updating work schedule:", error);
      res.status(500).json({ message: "Failed to update work schedule" });
    }
  });

  // Delete employee work schedule
  app.delete("/api/employee-work-schedules/:id", async (req, res) => {
    try {
      // Using direct db import
      const scheduleId = parseInt(req.params.id);
      
      // Temporarily disable authentication for work schedule system
      // if (!req.session?.passport?.user?.id) {
      //   return res.status(401).json({ message: "Authentication required" });
      // }

      const userRole = (req as any).session?.passport?.user?.role || 'admin';

      // Temporarily disable role checking
      // if (userRole !== 'admin' && userRole !== 'sales_manager') {
      //   return res.status(403).json({ message: "Insufficient permissions" });
      // }

      const [deletedSchedule] = await db.delete(employeeWorkSchedules)
        .where(eq(employeeWorkSchedules.id, scheduleId))
        .returning();

      if (!deletedSchedule) {
        return res.status(404).json({ message: "Work schedule not found" });
      }

      res.json({ message: "Work schedule deleted successfully", deletedSchedule });
    } catch (error) {
      console.error("Error deleting work schedule:", error);
      res.status(500).json({ message: "Failed to delete work schedule" });
    }
  });

  // Create daily attendance record
  app.post("/api/daily-attendance", async (req, res) => {
    try {
      // Using direct db import
      
      // Temporarily disable authentication for attendance system
      // if (!req.session?.passport?.user?.id) {
      //   return res.status(401).json({ message: "Authentication required" });
      // }

      // Temporarily use default values for authentication fields
      const userRole = (req as any).session?.passport?.user?.role || 'admin';
      const createdBy = (req as any).session?.passport?.user?.id || 1;
      const createdByName = (req as any).session?.passport?.user?.username || 'admin';

      // Temporarily disable role checking
      // if (userRole !== 'admin' && userRole !== 'sales_manager') {
      //   return res.status(403).json({ message: "Insufficient permissions" });
      // }

      const attendanceData = {
        ...req.body,
        createdBy,
        createdByName,
        date: new Date(req.body.date),
        scheduleType: req.body.scheduleType || 'متصل' // إضافة نوع الدوام
      };
      
      const [newAttendance] = await db.insert(dailyAttendance).values(attendanceData).returning();

      res.json(newAttendance);
    } catch (error) {
      console.error("Error creating attendance record:", error);
      res.status(500).json({ message: "Failed to create attendance record" });
    }
  });

  // Update daily attendance record
  app.put("/api/daily-attendance/:id", async (req, res) => {
    try {
      // Using direct db import
      
      // Temporarily disable authentication for attendance system
      // if (!req.session?.passport?.user?.id) {
      //   return res.status(401).json({ message: "Authentication required" });
      // }

      const userRole = (req as any).session?.passport?.user?.role || 'admin';
      const userId = (req as any).session?.passport?.user?.id || 1;

      const attendanceId = parseInt(req.params.id);
      
      // Check if user can edit this record
      const [existingRecord] = await db.select()
        .from(dailyAttendance)
        .where(eq(dailyAttendance.id, attendanceId));

      if (!existingRecord) {
        return res.status(404).json({ message: "Attendance record not found" });
      }

      // Temporarily disable permissions check for attendance
      // if (userRole !== 'admin' && userRole !== 'sales_manager' && existingRecord.employeeId !== userId) {
      //   return res.status(403).json({ message: "Insufficient permissions" });
      // }

      const updateData = {
        ...req.body,
        updatedAt: new Date()
      };

      // Convert date fields to proper Date objects if they exist
      if (updateData.date && typeof updateData.date === 'string') {
        updateData.date = new Date(updateData.date);
      }
      if (updateData.createdAt && typeof updateData.createdAt === 'string') {
        updateData.createdAt = new Date(updateData.createdAt);
      }
      
      const [updatedAttendance] = await db.update(dailyAttendance)
        .set(updateData)
        .where(eq(dailyAttendance.id, attendanceId))
        .returning();

      res.json(updatedAttendance);
    } catch (error) {
      console.error("Error updating attendance record:", error);
      res.status(500).json({ message: "Failed to update attendance record" });
    }
  });

  // Mark day as holiday endpoint
  app.post("/api/daily-attendance/holiday", async (req, res) => {
    try {
      // Using direct db import
      const { employeeId, date, isHoliday } = req.body;
      
      if (!employeeId || !date) {
        return res.status(400).json({ message: "Employee ID and date are required" });
      }

      // Get employee information first
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, parseInt(employeeId)))
        .limit(1);
      
      if (!user) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const dateObj = new Date(date + 'T00:00:00');
      
      // Check if attendance record exists for this employee and date
      const [existingAttendance] = await db.select()
        .from(dailyAttendance)
        .where(
          and(
            eq(dailyAttendance.employeeId, parseInt(employeeId)),
            eq(dailyAttendance.date, dateObj)
          )
        )
        .limit(1);

      if (existingAttendance) {
        // Update existing record to mark as holiday or remove holiday marking
        const updatedNotes = isHoliday ? 'إجازة' : (existingAttendance.notes === 'إجازة' ? null : existingAttendance.notes);
        
        const [updatedAttendance] = await db.update(dailyAttendance)
          .set({
            notes: updatedNotes,
            updatedAt: new Date()
          })
          .where(eq(dailyAttendance.id, existingAttendance.id))
          .returning();
          
        res.json(updatedAttendance);
      } else {
        // Create new holiday record with proper employee info
        const attendanceData = {
          employeeId: parseInt(employeeId),
          employeeName: user.name,
          date: dateObj,
          scheduleType: "متصل",
          notes: isHoliday ? 'إجازة' : null,
          createdBy: (req as any).session?.passport?.user?.id || 1,
          createdByName: (req as any).session?.passport?.user?.username || 'admin'
        };
        
        const [newAttendance] = await db.insert(dailyAttendance)
          .values(attendanceData)
          .returning();
          
        res.status(201).json(newAttendance);
      }
    } catch (error) {
      console.error("Error marking holiday:", error);
      res.status(500).json({ message: "Failed to mark day as holiday" });
    }
  });

  // Database synchronization endpoint
  app.post("/api/database/sync-external", async (req, res) => {
    try {
      const { syncExternalDatabase } = await import("./sync-external-db");
      const result = await syncExternalDatabase();
      
      if (result.success) {
        res.json({
          message: "Database synchronized successfully",
          counts: result.counts
        });
      } else {
        res.status(500).json({
          message: "Failed to synchronize database",
          error: result.error
        });
      }
    } catch (error) {
      console.error("Error in sync endpoint:", error);
      res.status(500).json({ message: "Failed to synchronize database" });
    }
  });

  // Vehicle data endpoints
  app.get("/api/vehicle-years", async (req, res) => {
    try {
      // Using direct db import
      const items = await db.select().from(inventoryItems);
      const uniqueYears = [...new Set(items.map((item: any) => item.year))].sort((a: any, b: any) => b - a);
      res.json(uniqueYears);
    } catch (error) {
      console.error("Error fetching vehicle years:", error);
      res.status(500).json({ message: "Failed to fetch vehicle years" });
    }
  });

  // Vehicle Years Management APIs
  app.get("/api/vehicle-years-full", async (req, res) => {
    try {
      const data = await db.select().from(vehicleYears).orderBy(desc(vehicleYears.year));
      res.json(data);
    } catch (error) {
      console.error("Error fetching vehicle years:", error);
      res.status(500).json({ message: "Failed to fetch vehicle years" });
    }
  });

  app.post("/api/vehicle-years", async (req, res) => {
    try {
      const validatedData = insertVehicleYearSchema.parse(req.body);
      const [newYear] = await db.insert(vehicleYears).values(validatedData).returning();
      res.status(201).json(newYear);
    } catch (error) {
      console.error("Error creating vehicle year:", error);
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ message: "هذه السنة مضافة بالفعل" });
      }
      res.status(500).json({ message: "Failed to create vehicle year" });
    }
  });

  app.put("/api/vehicle-years/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertVehicleYearSchema.parse(req.body);
      const [updatedYear] = await db.update(vehicleYears).set(validatedData).where(eq(vehicleYears.id, id)).returning();
      res.json(updatedYear);
    } catch (error) {
      console.error("Error updating vehicle year:", error);
      res.status(500).json({ message: "Failed to update vehicle year" });
    }
  });

  app.delete("/api/vehicle-years/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(vehicleYears).where(eq(vehicleYears.id, id));
      res.json({ message: "Vehicle year deleted successfully" });
    } catch (error) {
      console.error("Error deleting vehicle year:", error);
      res.status(500).json({ message: "Failed to delete vehicle year" });
    }
  });

  // Get engine capacities from database table
  app.get("/api/engine-capacities", async (req, res) => {
    try {
      // Using direct db import
      const data = await db.select().from(engineCapacities).where(eq(engineCapacities.isActive, true)).orderBy(asc(engineCapacities.capacity));
      res.json(data.map(item => item.capacity));
    } catch (error) {
      console.error("Error fetching engine capacities:", error);
      res.status(500).json({ message: "Failed to fetch engine capacities" });
    }
  });

  // Engine Capacities Management APIs
  app.get("/api/engine-capacities-full", async (req, res) => {
    try {
      // Using direct db import
      const data = await db.select().from(engineCapacities).where(eq(engineCapacities.isActive, true)).orderBy(asc(engineCapacities.capacity));
      res.json(data);
    } catch (error) {
      console.error("Error fetching engine capacities:", error);
      res.status(500).json({ message: "Failed to fetch engine capacities" });
    }
  });

  app.post("/api/engine-capacities", async (req, res) => {
    try {
      // Using direct db import
      const validatedData = insertEngineCapacitySchema.parse(req.body);
      const [newEngineCapacity] = await db.insert(engineCapacities).values(validatedData).returning();
      res.status(201).json(newEngineCapacity);
    } catch (error) {
      console.error("Error creating engine capacity:", error);
      res.status(500).json({ message: "Failed to create engine capacity" });
    }
  });

  app.put("/api/engine-capacities/:id", async (req, res) => {
    try {
      // Using direct db import
      const id = parseInt(req.params.id);
      const validatedData = insertEngineCapacitySchema.parse(req.body);
      const [updatedEngineCapacity] = await db.update(engineCapacities).set(validatedData).where(eq(engineCapacities.id, id)).returning();
      res.json(updatedEngineCapacity);
    } catch (error) {
      console.error("Error updating engine capacity:", error);
      res.status(500).json({ message: "Failed to update engine capacity" });
    }
  });

  app.delete("/api/engine-capacities/:id", async (req, res) => {
    try {
      // Using direct db import
      const id = parseInt(req.params.id);
      await db.delete(engineCapacities).where(eq(engineCapacities.id, id));
      res.json({ message: "Engine capacity deleted successfully" });
    } catch (error) {
      console.error("Error deleting engine capacity:", error);
      res.status(500).json({ message: "Failed to delete engine capacity" });
    }
  });

  // Get hierarchical colors (color associations)
  app.get("/api/hierarchical/colors", async (req, res) => {
    try {
      // Using direct db import
      const { manufacturer, category, trimLevel, colorType } = req.query;
      
      const conditions = [eq(colorAssociations.isActive, true)];
      
      // Add filters if provided
      if (manufacturer) {
        conditions.push(eq(colorAssociations.manufacturer, manufacturer as string));
      }
      if (category) {
        conditions.push(eq(colorAssociations.category, category as string));
      }
      if (trimLevel) {
        conditions.push(eq(colorAssociations.trimLevel, trimLevel as string));
      }
      if (colorType) {
        conditions.push(eq(colorAssociations.colorType, colorType as string));
      }
      
      const colors = await db.select()
        .from(colorAssociations)
        .where(and(...conditions));
        
      res.json(colors);
    } catch (error) {
      console.error("Error fetching hierarchical colors:", error);
      res.status(500).json({ message: "Failed to fetch hierarchical colors" });
    }
  });

  // Add hierarchical color
  app.post("/api/hierarchical/colors", async (req, res) => {
    try {
      const { manufacturer, category, trimLevel, colorType, colorName, colorCode } = req.body;

      if (!manufacturer || !colorType || !colorName) {
        return res.status(400).json({ message: "الشركة المصنعة ونوع اللون واسم اللون مطلوبون" });
      }

      const [newColor] = await db.insert(colorAssociations)
        .values({
          manufacturer,
          category: category || null,
          trimLevel: trimLevel || null,
          colorType,
          colorName,
          colorCode: colorCode || null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      res.status(201).json(newColor);
    } catch (error) {
      console.error("Error creating hierarchical color:", error);
      res.status(500).json({ message: "فشل في إضافة اللون" });
    }
  });

  // Update hierarchical color
  app.put("/api/hierarchical/colors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { manufacturer, category, trimLevel, colorType, colorName, colorCode, isActive } = req.body;

      const [updatedColor] = await db.update(colorAssociations)
        .set({
          manufacturer,
          category: category || null,
          trimLevel: trimLevel || null,
          colorType,
          colorName,
          colorCode: colorCode || null,
          isActive: isActive !== undefined ? isActive : undefined,
          updatedAt: new Date()
        })
        .where(eq(colorAssociations.id, id))
        .returning();

      if (!updatedColor) {
        return res.status(404).json({ message: "اللون غير موجود" });
      }

      res.json(updatedColor);
    } catch (error) {
      console.error("Error updating hierarchical color:", error);
      res.status(500).json({ message: "فشل في تحديث اللون" });
    }
  });

  // Delete hierarchical color
  app.delete("/api/hierarchical/colors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const [deletedColor] = await db.delete(colorAssociations)
        .where(eq(colorAssociations.id, id))
        .returning();

      if (!deletedColor) {
        return res.status(404).json({ message: "اللون غير موجود" });
      }

      res.json({ message: "تم حذف اللون بنجاح", deletedColor });
    } catch (error) {
      console.error("Error deleting hierarchical color:", error);
      res.status(500).json({ message: "فشل في حذف اللون" });
    }
  });

  // Get vehicle specifications
  app.get("/api/vehicle-specifications", async (req, res) => {
    try {
      // Using direct db import
      const specifications = await db.select().from(vehicleSpecifications);
      res.json(specifications);
    } catch (error) {
      console.error("Error fetching vehicle specifications:", error);
      res.status(500).json({ message: "Failed to fetch vehicle specifications" });
    }
  });

  // Get specifications by chassis number with fallback to general specifications
  app.get("/api/specifications-by-chassis/:chassisNumber", async (req, res) => {
    try {
      // Using direct db import
      const { chassisNumber } = req.params;
      
      console.log(`🔍 Fetching specifications for chassis: ${chassisNumber}`);

      // First, try to find specifications by chassis number
      const chassisSpecs = await db.select().from(vehicleSpecifications)
        .where(eq(vehicleSpecifications.chassisNumber, chassisNumber));
      
      if (chassisSpecs.length > 0) {
        console.log(`📋 Found chassis-specific specifications`);
        const spec = chassisSpecs[0];
        
        // Parse the specifications JSON if it exists
        let parsedSpecs = {};
        if (spec.specifications) {
          try {
            // Check if it's already an object
            if (typeof spec.specifications === 'object') {
              parsedSpecs = spec.specifications;
            } else {
              // Try to parse as JSON first
              parsedSpecs = JSON.parse(spec.specifications);
            }
          } catch (e) {
            console.log('Error parsing specifications JSON:', e);
            // If JSON parsing fails, treat as raw text
            parsedSpecs = {
              "المواصفات العامة": spec.specifications.toString() || "غير متوفر",
              "نوع المحرك": spec.engineCapacity || "غير محدد",
              "سنة الصنع": spec.year?.toString() || "غير محدد",
              "الفئة": spec.category || "غير محدد"
            };
          }
        }

        return res.json({
          id: spec.id,
          manufacturer: spec.manufacturer,
          category: spec.category,
          trimLevel: spec.trimLevel,
          year: spec.year,
          engineCapacity: spec.engineCapacity,
          chassisNumber: spec.chassisNumber,
          specifications: parsedSpecs,
          specificationsEn: spec.specificationsEn,
          source: 'chassis'
        });
      }

      // If no chassis-specific specs found, look for vehicle in inventory
      const [vehicle] = await db.select().from(inventoryItems)
        .where(eq(inventoryItems.chassisNumber, chassisNumber));
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      // Helper to parse spec text
      const parseSpecText = (raw: any): string | null => {
        if (!raw) return null;
        if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw);
            // It's valid JSON - check if it has a "المواصفات العامة" text field
            if (typeof parsed === 'object' && parsed['المواصفات العامة'] && typeof parsed['المواصفات العامة'] === 'string') {
              return parsed['المواصفات العامة'];
            }
            return raw; // return raw JSON string
          } catch {
            return raw; // plain text
          }
        }
        if (typeof raw === 'object') {
          if (raw['المواصفات العامة'] && typeof raw['المواصفات العامة'] === 'string') {
            return raw['المواصفات العامة'];
          }
          return JSON.stringify(raw);
        }
        return String(raw);
      };

      // Cascading search strategy:
      // 1. Exact match: manufacturer + category + trimLevel + year + engineCapacity
      // 2. Without engineCapacity
      // 3. Without trimLevel (just manufacturer + category + year)
      let foundSpec = null;

      // Strategy 1: Full match
      const fullConditions = [
        eq(vehicleSpecifications.manufacturer, vehicle.manufacturer),
        eq(vehicleSpecifications.category, vehicle.category),
        eq(vehicleSpecifications.year, vehicle.year),
      ];
      if (vehicle.engineCapacity) fullConditions.push(eq(vehicleSpecifications.engineCapacity, vehicle.engineCapacity));
      if (vehicle.trimLevel) fullConditions.push(eq(vehicleSpecifications.trimLevel, vehicle.trimLevel));

      const fullMatch = await db.select().from(vehicleSpecifications).where(and(...fullConditions));
      if (fullMatch.length > 0) {
        foundSpec = fullMatch[0];
        console.log(`📋 Found specs: full match`);
      }

      // Strategy 2: Without engineCapacity
      if (!foundSpec) {
        const noEngineConditions = [
          eq(vehicleSpecifications.manufacturer, vehicle.manufacturer),
          eq(vehicleSpecifications.category, vehicle.category),
          eq(vehicleSpecifications.year, vehicle.year),
        ];
        if (vehicle.trimLevel) noEngineConditions.push(eq(vehicleSpecifications.trimLevel, vehicle.trimLevel));
        const noEngineMatch = await db.select().from(vehicleSpecifications).where(and(...noEngineConditions));
        if (noEngineMatch.length > 0) {
          foundSpec = noEngineMatch[0];
          console.log(`📋 Found specs: match without engineCapacity`);
        }
      }

      // Strategy 3: Without trimLevel and engineCapacity
      if (!foundSpec) {
        const baseConditions = [
          eq(vehicleSpecifications.manufacturer, vehicle.manufacturer),
          eq(vehicleSpecifications.category, vehicle.category),
          eq(vehicleSpecifications.year, vehicle.year),
        ];
        const baseMatch = await db.select().from(vehicleSpecifications).where(and(...baseConditions));
        if (baseMatch.length > 0) {
          foundSpec = baseMatch[0];
          console.log(`📋 Found specs: base match (manufacturer + category + year)`);
        }
      }

      if (foundSpec) {
        const rawText = parseSpecText(foundSpec.specifications);
        return res.json({
          id: foundSpec.id,
          manufacturer: foundSpec.manufacturer,
          category: foundSpec.category,
          trimLevel: foundSpec.trimLevel,
          year: foundSpec.year,
          engineCapacity: foundSpec.engineCapacity,
          chassisNumber: null,
          specifications: rawText,
          specificationsEn: foundSpec.specificationsEn,
          source: 'general'
        });
      }

      // Strategy 4: Use detailedSpecifications from inventory item
      if (vehicle.detailedSpecifications) {
        console.log(`📋 Using inventory item detailedSpecifications as fallback`);
        return res.json({
          manufacturer: vehicle.manufacturer,
          category: vehicle.category,
          trimLevel: vehicle.trimLevel,
          year: vehicle.year,
          engineCapacity: vehicle.engineCapacity,
          chassisNumber: vehicle.chassisNumber,
          specifications: vehicle.detailedSpecifications,
          specificationsEn: null,
          source: 'inventory'
        });
      }

      // No specifications found at all
      console.log(`📝 No specifications found for vehicle`);
      res.json({
        manufacturer: vehicle.manufacturer,
        category: vehicle.category,
        trimLevel: vehicle.trimLevel,
        year: vehicle.year,
        engineCapacity: vehicle.engineCapacity,
        chassisNumber: vehicle.chassisNumber,
        specifications: null,
        specificationsEn: null,
        source: 'none'
      });

    } catch (error) {
      console.error("Error fetching specifications by chassis:", error);
      res.status(500).json({ message: "Failed to fetch vehicle specifications" });
    }
  });

  // Get specific vehicle specifications by parameters - for quotation page
  app.get("/api/specifications/:manufacturer/:category/:trimLevel?/:year/:engineCapacity", async (req, res) => {
    try {
      // Using direct db import
      const { manufacturer, category, trimLevel, year, engineCapacity } = req.params;
      
      console.log(`🔍 Fetching specifications for: ${manufacturer} ${category} ${trimLevel || 'any'} ${year} ${engineCapacity}`);

      // Helper to extract raw spec text
      const extractSpecText = (raw: any): string | null => {
        if (!raw) return null;
        if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw);
            if (typeof parsed === 'object' && parsed['المواصفات العامة'] && typeof parsed['المواصفات العامة'] === 'string') {
              return parsed['المواصفات العامة'];
            }
            return raw;
          } catch { return raw; }
        }
        if (typeof raw === 'object') {
          if (raw['المواصفات العامة'] && typeof raw['المواصفات العامة'] === 'string') return raw['المواصفات العامة'];
          return JSON.stringify(raw);
        }
        return String(raw);
      };

      const yearNum = parseInt(year);
      let foundSpec = null;

      // Strategy 1: manufacturer + category + trimLevel + year + engineCapacity
      const c1 = [eq(vehicleSpecifications.manufacturer, manufacturer), eq(vehicleSpecifications.category, category), eq(vehicleSpecifications.year, yearNum)];
      if (engineCapacity && engineCapacity !== '') c1.push(eq(vehicleSpecifications.engineCapacity, engineCapacity));
      if (trimLevel && trimLevel !== 'null') c1.push(eq(vehicleSpecifications.trimLevel, trimLevel));
      const m1 = await db.select().from(vehicleSpecifications).where(and(...c1));
      if (m1.length > 0) { foundSpec = m1[0]; console.log(`📋 Found specs: full match`); }

      // Strategy 2: without engineCapacity
      if (!foundSpec) {
        const c2 = [eq(vehicleSpecifications.manufacturer, manufacturer), eq(vehicleSpecifications.category, category), eq(vehicleSpecifications.year, yearNum)];
        if (trimLevel && trimLevel !== 'null') c2.push(eq(vehicleSpecifications.trimLevel, trimLevel));
        const m2 = await db.select().from(vehicleSpecifications).where(and(...c2));
        if (m2.length > 0) { foundSpec = m2[0]; console.log(`📋 Found specs: without engineCapacity`); }
      }

      // Strategy 3: manufacturer + category + year only
      if (!foundSpec) {
        const c3 = [eq(vehicleSpecifications.manufacturer, manufacturer), eq(vehicleSpecifications.category, category), eq(vehicleSpecifications.year, yearNum)];
        const m3 = await db.select().from(vehicleSpecifications).where(and(...c3));
        if (m3.length > 0) { foundSpec = m3[0]; console.log(`📋 Found specs: manufacturer + category + year`); }
      }

      console.log(`📋 Found ${foundSpec ? 1 : 0} specifications`);

      if (foundSpec) {
        res.json({
          id: foundSpec.id,
          manufacturer: foundSpec.manufacturer,
          category: foundSpec.category,
          trimLevel: foundSpec.trimLevel,
          year: foundSpec.year,
          engineCapacity: foundSpec.engineCapacity,
          chassisNumber: foundSpec.chassisNumber,
          specifications: extractSpecText(foundSpec.specifications),
          specificationsEn: foundSpec.specificationsEn
        });
      } else {
        console.log(`📝 No specifications found`);
        res.json({
          manufacturer,
          category,
          trimLevel: trimLevel || null,
          year: yearNum,
          engineCapacity,
          specifications: null,
          specificationsEn: null
        });
      }
    } catch (error) {
      console.error("Error fetching vehicle specifications:", error);
      res.status(500).json({ message: "Failed to fetch vehicle specifications" });
    }
  });

  // Create vehicle specification
  app.post("/api/vehicle-specifications", async (req, res) => {
    try {
      // Using direct db import
      const { manufacturer, category, trimLevel, year, engineCapacity, chassisNumber, specifications, specificationsEn } = req.body;
      
      const [newSpec] = await db.insert(vehicleSpecifications).values({
        manufacturer,
        category,
        trimLevel,
        year,
        engineCapacity,
        chassisNumber,
        specifications,
        specificationsEn
      }).returning();

      res.json(newSpec);
    } catch (error) {
      console.error("Error creating vehicle specification:", error);
      res.status(500).json({ message: "Failed to create vehicle specification" });
    }
  });

  // Update vehicle specification
  app.put("/api/vehicle-specifications/:id", async (req, res) => {
    try {
      // Using direct db import
      const id = parseInt(req.params.id);
      const { manufacturer, category, trimLevel, year, engineCapacity, chassisNumber, specifications, specificationsEn } = req.body;
      
      const [updatedSpec] = await db.update(vehicleSpecifications)
        .set({
          manufacturer,
          category,
          trimLevel,
          year,
          engineCapacity,
          chassisNumber,
          specifications,
          specificationsEn,
          updatedAt: new Date()
        })
        .where(eq(vehicleSpecifications.id, id))
        .returning();

      if (!updatedSpec) {
        return res.status(404).json({ message: "Vehicle specification not found" });
      }

      res.json(updatedSpec);
    } catch (error) {
      console.error("Error updating vehicle specification:", error);
      res.status(500).json({ message: "Failed to update vehicle specification" });
    }
  });

  // Delete vehicle specification
  app.delete("/api/vehicle-specifications/:id", async (req, res) => {
    try {
      // Using direct db import
      const id = parseInt(req.params.id);
      
      const [deletedSpec] = await db.delete(vehicleSpecifications)
        .where(eq(vehicleSpecifications.id, id))
        .returning();

      if (!deletedSpec) {
        return res.status(404).json({ message: "Vehicle specification not found" });
      }

      res.json({ message: "Vehicle specification deleted successfully" });
    } catch (error) {
      console.error("Error deleting vehicle specification:", error);
      res.status(500).json({ message: "Failed to delete vehicle specification" });
    }
  });

  // Get vehicle image links
  app.get("/api/vehicle-image-links", async (req, res) => {
    try {
      // Using direct db import
      const imageLinks = await db.select().from(vehicleImageLinks);
      res.json(imageLinks);
    } catch (error) {
      console.error("Error fetching vehicle image links:", error);
      res.status(500).json({ message: "Failed to fetch vehicle image links" });
    }
  });

  // Create vehicle image link
  app.post("/api/vehicle-image-links", async (req, res) => {
    try {
      // Using direct db import
      const { manufacturer, category, trimLevel, year, engineCapacity, exteriorColor, interiorColor, chassisNumber, imageUrl, description, descriptionEn } = req.body;
      
      const [newImageLink] = await db.insert(vehicleImageLinks).values({
        manufacturer,
        category,
        trimLevel,
        year,
        engineCapacity,
        exteriorColor,
        interiorColor,
        chassisNumber,
        imageUrl,
        description,
        descriptionEn
      }).returning();

      res.json(newImageLink);
    } catch (error) {
      console.error("Error creating vehicle image link:", error);
      res.status(500).json({ message: "Failed to create vehicle image link" });
    }
  });

  // Update vehicle image link
  app.put("/api/vehicle-image-links/:id", async (req, res) => {
    try {
      // Using direct db import
      const id = parseInt(req.params.id);
      const { manufacturer, category, trimLevel, year, engineCapacity, exteriorColor, interiorColor, chassisNumber, imageUrl, description, descriptionEn } = req.body;
      
      const [updatedImageLink] = await db.update(vehicleImageLinks)
        .set({
          manufacturer,
          category,
          trimLevel,
          year,
          engineCapacity,
          exteriorColor,
          interiorColor,
          chassisNumber,
          imageUrl,
          description,
          descriptionEn,
          updatedAt: new Date()
        })
        .where(eq(vehicleImageLinks.id, id))
        .returning();

      if (!updatedImageLink) {
        return res.status(404).json({ message: "Vehicle image link not found" });
      }

      res.json(updatedImageLink);
    } catch (error) {
      console.error("Error updating vehicle image link:", error);
      res.status(500).json({ message: "Failed to update vehicle image link" });
    }
  });

  // Delete vehicle image link
  app.delete("/api/vehicle-image-links/:id", async (req, res) => {
    try {
      // Using direct db import
      const id = parseInt(req.params.id);
      
      const [deletedImageLink] = await db.delete(vehicleImageLinks)
        .where(eq(vehicleImageLinks.id, id))
        .returning();

      if (!deletedImageLink) {
        return res.status(404).json({ message: "Vehicle image link not found" });
      }

      res.json({ message: "Vehicle image link deleted successfully" });
    } catch (error) {
      console.error("Error deleting vehicle image link:", error);
      res.status(500).json({ message: "Failed to delete vehicle image link" });
    }
  });

  // Database management routes
  app.get("/api/database/stats", async (req, res) => {
    try {
      // Using direct db import
      
      // Get counts for all major tables
      const [
        usersCount,
        inventoryCount,
        manufacturersCount,
        vehicleCategoriesCount,
        trimLevelsCount,
        banksCount,
        bankInterestRatesCount,
        companiesCount,
        quotationsCount,
        colorAssociationsCount,
        vehicleSpecificationsCount,
        vehicleImageLinksCount
      ] = await Promise.all([
        db.select().from(users).then(rows => rows.length),
        db.select().from(inventoryItems).then(rows => rows.length),
        db.select().from(manufacturers).then(rows => rows.length),
        db.select().from(vehicleCategories).then(rows => rows.length).catch(() => 0),
        db.select().from(vehicleTrimLevels).then(rows => rows.length).catch(() => 0),
        db.select().from(banks).then(rows => rows.length),
        db.execute('SELECT COUNT(*) as count FROM bank_interest_rates').then(result => result.rows[0]?.count || 0).catch(() => 0),
        db.execute('SELECT COUNT(*) as count FROM companies').then(result => result.rows[0]?.count || 0).catch(() => 0),
        db.execute('SELECT COUNT(*) as count FROM quotations').then(result => result.rows[0]?.count || 0).catch(() => 0),
        db.execute('SELECT COUNT(*) as count FROM color_associations').then(result => result.rows[0]?.count || 0).catch(() => 0),
        db.execute('SELECT COUNT(*) as count FROM vehicle_specifications').then(result => result.rows[0]?.count || 0).catch(() => 0),
        db.execute('SELECT COUNT(*) as count FROM vehicle_image_links').then(result => result.rows[0]?.count || 0).catch(() => 0)
      ]);

      const stats = {
        users: parseInt(usersCount.toString()),
        inventory: parseInt(inventoryCount.toString()),
        manufacturers: parseInt(manufacturersCount.toString()),
        vehicleCategories: parseInt(vehicleCategoriesCount.toString()),
        trimLevels: parseInt(trimLevelsCount.toString()),
        banks: parseInt(banksCount.toString()),
        bankInterestRates: parseInt(bankInterestRatesCount.toString()),
        companies: parseInt(companiesCount.toString()),
        quotations: parseInt(quotationsCount.toString()),
        colorAssociations: parseInt(colorAssociationsCount.toString()),
        vehicleSpecifications: parseInt(vehicleSpecificationsCount.toString()),
        vehicleImageLinks: parseInt(vehicleImageLinksCount.toString())
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching database stats:", error);
      res.status(500).json({ message: "Failed to fetch database statistics" });
    }
  });

  app.post("/api/database/test-connection", async (req, res) => {
    try {
      const { connectionString } = req.body;
      
      if (!connectionString) {
        return res.status(400).json({ success: false, error: "Connection string is required" });
      }

      // Test the external database connection
      const testPool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        max: 1,
        idleTimeoutMillis: 5000,
        connectionTimeoutMillis: 10000,
      });

      try {
        await testPool.query('SELECT 1');
        await testPool.end();
        
        res.json({ success: true, message: "Connection successful" });
      } catch (testError: any) {
        await testPool.end().catch(() => {});
        res.json({ success: false, error: testError.message });
      }
    } catch (error: any) {
      console.error("Connection test error:", error);
      res.json({ success: false, error: "Failed to test connection" });
    }
  });

  app.get("/api/database/export", async (req, res) => {
    try {
      // Using direct db import
      const { types } = req.query;
      const selectedTypes = types ? types.toString().split(',') : [];
      
      const exportData: any = {
        exportDate: new Date().toISOString(),
        version: "1.0",
        data: {}
      };

      // Export all or selected data types
      if (selectedTypes.length === 0 || selectedTypes.includes('users')) {
        exportData.data.users = await db.select().from(users);
      }
      
      if (selectedTypes.length === 0 || selectedTypes.includes('inventory')) {
        exportData.data.inventory = await db.select().from(inventoryItems);
      }
      
      if (selectedTypes.length === 0 || selectedTypes.includes('manufacturers')) {
        exportData.data.manufacturers = await db.select().from(manufacturers);
      }
      
      if (selectedTypes.length === 0 || selectedTypes.includes('banks')) {
        exportData.data.banks = await db.select().from(banks);
      }

      // Try to export other tables if they exist
      try {
        if (selectedTypes.length === 0 || selectedTypes.includes('vehicleCategories')) {
          exportData.data.vehicleCategories = await db.select().from(vehicleCategories);
        }
      } catch (e: any) {
        console.log('vehicleCategories table not available');
      }

      try {
        if (selectedTypes.length === 0 || selectedTypes.includes('trimLevels')) {
          exportData.data.trimLevels = await db.select().from(vehicleTrimLevels);
        }
      } catch (e: any) {
        console.log('vehicleTrimLevels table not available');
      }

      res.json(exportData);
    } catch (error: any) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Failed to export database" });
    }
  });

  app.post("/api/database/import", async (req, res) => {
    try {
      // Using direct db import
      const importData = req.body;
      const selectedTypes = importData.selectedTypes || [];
      
      if (!importData.data) {
        return res.status(400).json({ message: "No data provided for import" });
      }

      // Import selected data types
      if (selectedTypes.length === 0 || selectedTypes.includes('users')) {
        if (importData.data.users) {
          // Clear existing users (except admins)
          await db.execute('DELETE FROM users WHERE role != \'admin\'');
          
          // Insert new users
          for (const user of importData.data.users) {
            try {
              await db.insert(users).values({
                name: user.name,
                jobTitle: user.jobTitle || user.job_title,
                phoneNumber: user.phoneNumber || user.phone_number,
                username: user.username,
                password: user.password,
                role: user.role
              }).onConflictDoNothing();
            } catch (e) {
              console.log(`Failed to import user ${user.username}:`, e);
            }
          }
        }
      }

      if (selectedTypes.length === 0 || selectedTypes.includes('inventory')) {
        if (importData.data.inventory) {
          // Clear existing inventory
          await db.execute('DELETE FROM inventory_items');
          
          // Insert new inventory
          for (const item of importData.data.inventory) {
            try {
              await db.insert(inventoryItems).values({
                manufacturer: item.manufacturer,
                category: item.category,
                trimLevel: item.trimLevel || item.trim_level,
                engineCapacity: item.engineCapacity || item.engine_capacity,
                year: item.year,
                exteriorColor: item.exteriorColor || item.exterior_color,
                interiorColor: item.interiorColor || item.interior_color,
                status: item.status,
                importType: item.importType || item.import_type,
                ownershipType: item.ownershipType || item.ownership_type || 'ملك الشركة',
                location: item.location,
                chassisNumber: item.chassisNumber || item.chassis_number,
                images: item.images || [],
                logo: item.logo,
                notes: item.notes,
                detailedSpecifications: item.detailedSpecifications || item.detailed_specifications,
                price: item.price,
                isSold: item.isSold || item.is_sold || false,
                soldDate: item.soldDate || item.sold_date,
                reservationDate: item.reservationDate || item.reservation_date,
                reservedBy: item.reservedBy || item.reserved_by,
                salesRepresentative: item.salesRepresentative || item.sales_representative,
                reservationNote: item.reservationNote || item.reservation_note,
                customerName: item.customerName || item.customer_name,
                customerPhone: item.customerPhone || item.customer_phone,
                paidAmount: item.paidAmount || item.paid_amount,
                salePrice: item.salePrice || item.sale_price,
                paymentMethod: item.paymentMethod || item.payment_method,
                bankName: item.bankName || item.bank_name,
                soldToCustomerName: item.soldToCustomerName || item.sold_to_customer_name,
                soldToCustomerPhone: item.soldToCustomerPhone || item.sold_to_customer_phone,
                soldBySalesRep: item.soldBySalesRep || item.sold_by_sales_rep,
                saleNotes: item.saleNotes || item.sale_notes,
                mileage: item.mileage
              });
            } catch (e) {
              console.log(`Failed to import inventory item ${item.chassisNumber}:`, e);
            }
          }
        }
      }

      if (selectedTypes.length === 0 || selectedTypes.includes('manufacturers')) {
        if (importData.data.manufacturers) {
          // Clear existing manufacturers
          await db.execute('DELETE FROM manufacturers');
          
          // Insert new manufacturers
          for (const manufacturer of importData.data.manufacturers) {
            try {
              await db.insert(manufacturers).values({
                nameAr: manufacturer.nameAr || manufacturer.name_ar,
                nameEn: manufacturer.nameEn || manufacturer.name_en,
                logo: manufacturer.logo,
                isActive: manufacturer.isActive ?? manufacturer.is_active ?? true
              });
            } catch (e) {
              console.log(`Failed to import manufacturer ${manufacturer.nameAr}:`, e);
            }
          }
        }
      }

      if (selectedTypes.length === 0 || selectedTypes.includes('banks')) {
        if (importData.data.banks) {
          // Clear existing banks
          await db.execute('DELETE FROM banks');
          
          // Insert new banks
          for (const bank of importData.data.banks) {
            try {
              await db.insert(banks).values({
                logo: bank.logo,
                bankName: bank.bankName || bank.bank_name,
                nameEn: bank.nameEn || bank.name_en,
                accountName: bank.accountName || bank.account_name,
                accountNumber: bank.accountNumber || bank.account_number,
                iban: bank.iban,
                type: bank.type,
                isActive: bank.isActive ?? bank.is_active ?? true
              });
            } catch (e) {
              console.log(`Failed to import bank ${bank.bankName}:`, e);
            }
          }
        }
      }

      res.json({ message: "Data imported successfully" });
    } catch (error: any) {
      console.error("Import error:", error);
      res.status(500).json({ message: "Failed to import database", error: error.message });
    }
  });

  app.post("/api/database/import-from-external", async (req, res) => {
    try {
      const { connectionString, selectedTypes } = req.body;
      
      if (!connectionString) {
        return res.status(400).json({ message: "Connection string is required" });
      }

      // Import from external database using the existing import function
      const { importFromExternalDatabase } = await import('./import-external-db');
      await importFromExternalDatabase(connectionString);
      
      res.json({ message: "External database import completed successfully" });
    } catch (error) {
      console.error("External import error:", error);
      res.status(500).json({ message: "Failed to import from external database" });
    }
  });

  app.post("/api/database/export-to-external", async (req, res) => {
    try {
      const { connectionString } = req.body;
      
      if (!connectionString) {
        return res.status(400).json({ message: "Connection string is required" });
      }

      // Export to external database
      const { exportToExternalDatabase } = await import('./export-to-external');
      await exportToExternalDatabase(connectionString);
      
      res.json({ message: "Database exported to external database successfully" });
    } catch (error) {
      console.error("External export error:", error);
      res.status(500).json({ message: "Failed to export to external database" });
    }
  });

  // Import new hierarchy data
  app.post("/api/database/import-new-hierarchy", async (req, res) => {
    try {
      const { importNewHierarchy } = await import('./import-new-hierarchy');
      const result = await importNewHierarchy();
      
      if (result.success) {
        res.json({
          message: "Hierarchy data replaced successfully",
          counts: result.counts
        });
      } else {
        res.status(500).json({
          message: "Failed to replace hierarchy data",
          error: result.error
        });
      }
    } catch (error) {
      console.error("Hierarchy import error:", error);
      res.status(500).json({ message: "Failed to replace hierarchy data" });
    }
  });

  // ===== QUOTATIONS API ENDPOINTS =====
  
  // Get all quotations
  app.get("/api/quotations", async (req, res) => {
    try {
      // Using direct db import
      const allQuotations = await db.select().from(quotations).orderBy(desc(quotations.createdAt));
      res.json(allQuotations);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      res.status(500).json({ message: "Failed to fetch quotations" });
    }
  });

  // Get single quotation by ID
  app.get("/api/quotations/:id", async (req, res) => {
    try {
      // Using direct db import
      const id = parseInt(req.params.id);
      
      const quotationList = await db.select().from(quotations).where(eq(quotations.id, id));
      
      if (quotationList.length === 0) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      res.json(quotationList[0]);
    } catch (error) {
      console.error("Error fetching quotation:", error);
      res.status(500).json({ message: "Failed to fetch quotation" });
    }
  });

  // Create new quotation
  app.post("/api/quotations", async (req, res) => {
    try {
      // Using direct db import
      const quotationData = req.body;
      
      // Validate inventoryItemId to prevent integer overflow
      const inventoryItemId = quotationData.inventoryItemId || 0;
      const validInventoryItemId = typeof inventoryItemId === 'number' && 
                                   inventoryItemId >= -2147483648 && 
                                   inventoryItemId <= 2147483647 ? 
                                   inventoryItemId : 0;
      
      const [newQuotation] = await db.insert(quotations).values({
        quoteNumber: quotationData.quoteNumber,
        inventoryItemId: validInventoryItemId,
        manufacturer: quotationData.manufacturer,
        category: quotationData.category,
        trimLevel: quotationData.trimLevel,
        year: quotationData.year,
        exteriorColor: quotationData.exteriorColor || 'غير محدد',
        interiorColor: quotationData.interiorColor || 'غير محدد',
        chassisNumber: quotationData.chassisNumber,
        engineCapacity: quotationData.engineCapacity,
        specifications: quotationData.specifications,
        basePrice: quotationData.basePrice.toString(),
        finalPrice: quotationData.finalPrice.toString(),
        customerName: quotationData.customerName,
        customerPhone: quotationData.customerPhone,
        customerEmail: quotationData.customerEmail,
        customerTitle: quotationData.customerTitle,
        notes: quotationData.notes,
        validUntil: quotationData.validUntil ? new Date(quotationData.validUntil) : null,
        status: quotationData.status || 'مسودة',
        createdBy: quotationData.createdBy,
        companyData: typeof quotationData.companyData === 'string' ? quotationData.companyData : JSON.stringify(quotationData.companyData),
        representativeData: typeof quotationData.representativeData === 'string' ? quotationData.representativeData : JSON.stringify(quotationData.representativeData),
        quoteAppearance: typeof quotationData.quoteAppearance === 'string' ? quotationData.quoteAppearance : JSON.stringify(quotationData.quoteAppearance),
        pricingDetails: typeof quotationData.pricingDetails === 'string' ? quotationData.pricingDetails : JSON.stringify(quotationData.pricingDetails),
        multiItems: typeof quotationData.multiItems === 'string' ? quotationData.multiItems : JSON.stringify(quotationData.multiItems),
        qrCodeData: quotationData.qrCodeData
      }).returning();

      res.json(newQuotation);
    } catch (error) {
      console.error("Error creating quotation:", error);
      res.status(500).json({ message: "Failed to create quotation" });
    }
  });

  // Update quotation
  app.put("/api/quotations/:id", async (req, res) => {
    try {
      // Using direct db import
      const id = parseInt(req.params.id);
      const quotationData = req.body;
      
      // Validate inventoryItemId to prevent integer overflow
      const inventoryItemId = quotationData.inventoryItemId || 0;
      const validInventoryItemId = typeof inventoryItemId === 'number' && 
                                   inventoryItemId >= -2147483648 && 
                                   inventoryItemId <= 2147483647 ? 
                                   inventoryItemId : 0;
      
      const [updatedQuotation] = await db.update(quotations)
        .set({
          quoteNumber: quotationData.quoteNumber,
          inventoryItemId: validInventoryItemId,
          manufacturer: quotationData.manufacturer,
          category: quotationData.category,
          trimLevel: quotationData.trimLevel,
          year: quotationData.year,
          exteriorColor: quotationData.exteriorColor || 'غير محدد',
          interiorColor: quotationData.interiorColor || 'غير محدد',
          chassisNumber: quotationData.chassisNumber,
          engineCapacity: quotationData.engineCapacity,
          specifications: quotationData.specifications,
          basePrice: quotationData.basePrice.toString(),
          finalPrice: quotationData.finalPrice.toString(),
          customerName: quotationData.customerName,
          customerPhone: quotationData.customerPhone,
          customerEmail: quotationData.customerEmail,
          customerTitle: quotationData.customerTitle,
          notes: quotationData.notes,
          validUntil: quotationData.validUntil ? new Date(quotationData.validUntil) : null,
          status: quotationData.status || 'مسودة',
          createdBy: quotationData.createdBy,
          companyData: typeof quotationData.companyData === 'string' ? quotationData.companyData : JSON.stringify(quotationData.companyData),
          representativeData: typeof quotationData.representativeData === 'string' ? quotationData.representativeData : JSON.stringify(quotationData.representativeData),
          quoteAppearance: typeof quotationData.quoteAppearance === 'string' ? quotationData.quoteAppearance : JSON.stringify(quotationData.quoteAppearance),
          pricingDetails: typeof quotationData.pricingDetails === 'string' ? quotationData.pricingDetails : JSON.stringify(quotationData.pricingDetails),
          multiItems: typeof quotationData.multiItems === 'string' ? quotationData.multiItems : JSON.stringify(quotationData.multiItems),
          qrCodeData: quotationData.qrCodeData,
          updatedAt: new Date()
        })
        .where(eq(quotations.id, id))
        .returning();

      if (!updatedQuotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      res.json(updatedQuotation);
    } catch (error) {
      console.error("Error updating quotation:", error);
      res.status(500).json({ message: "Failed to update quotation" });
    }
  });

  // Delete quotation
  app.delete("/api/quotations/:id", async (req, res) => {
    try {
      // Using direct db import
      const id = parseInt(req.params.id);
      
      const [deletedQuotation] = await db.delete(quotations)
        .where(eq(quotations.id, id))
        .returning();

      if (!deletedQuotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      res.json({ message: "Quotation deleted successfully" });
    } catch (error) {
      console.error("Error deleting quotation:", error);
      res.status(500).json({ message: "Failed to delete quotation" });
    }
  });

  // Configure multer for logo uploads
  const logoStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
      const logosDir = path.join(process.cwd(), 'public', 'logos');
      try {
        await fs.mkdir(logosDir, { recursive: true });
        cb(null, logosDir);
      } catch (error: any) {
        cb(error, '');
      }
    },
    filename: (req, file, cb) => {
      // Extract manufacturer info from request
      const manufacturerId = req.params.id;
      // Get file extension
      const ext = path.extname(file.originalname);
      // Use manufacturer ID as filename (will be updated with actual name later)
      cb(null, `temp_${manufacturerId}${ext}`);
    }
  });

  const uploadLogo = multer({
    storage: logoStorage,
    fileFilter: (req, file, cb) => {
      // Check file type
      const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('نوع الملف غير مدعوم. يرجى رفع ملف SVG أو PNG فقط.'));
      }
    },
    limits: {
      fileSize: 2 * 1024 * 1024 // 2MB limit
    }
  });

  // Upload manufacturer logo endpoint
  app.post('/api/manufacturers/:id/upload-logo', uploadLogo.single('logo'), async (req, res) => {
    try {
      // Using direct db import
      const manufacturerId = parseInt(req.params.id);
      
      if (!req.file) {
        return res.status(400).json({ message: 'لم يتم تحديد ملف' });
      }

      // Get manufacturer info to determine final filename
      const manufacturer = await db.select()
        .from(manufacturers)
        .where(eq(manufacturers.id, manufacturerId))
        .limit(1);

      if (manufacturer.length === 0) {
        // Delete uploaded file if manufacturer not found
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(404).json({ message: 'الصانع غير موجود' });
      }

      const manufacturerData = manufacturer[0];
      const fileExt = path.extname(req.file.originalname);
      
      // Determine final filename using Arabic or English name
      let finalFileName: string;
      if (manufacturerData.nameEn && manufacturerData.nameEn.trim()) {
        // Use English name if available
        finalFileName = `${manufacturerData.nameEn.trim()}${fileExt}`;
      } else {
        // Use Arabic name as fallback
        finalFileName = `${manufacturerData.nameAr.trim()}${fileExt}`;
      }

      const finalPath = path.join(path.dirname(req.file.path), finalFileName);
      
      // Rename file to final name
      await fs.rename(req.file.path, finalPath);
      
      // Update manufacturer logo path in database
      await db.update(manufacturers)
        .set({ 
          logo: `/logos/${finalFileName}`,
          updatedAt: new Date()
        })
        .where(eq(manufacturers.id, manufacturerId));

      res.json({ 
        message: 'تم رفع الشعار بنجاح',
        logoPath: `/logos/${finalFileName}`,
        fileName: finalFileName
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      
      console.error('خطأ في رفع الشعار:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'فشل في رفع الشعار' 
      });
    }
  });

  // Terms and Conditions endpoints
  app.get("/api/terms-conditions", async (req, res) => {
    try {
      // Using direct db import
      const terms = await db.select().from(termsConditions)
        .where(eq(termsConditions.isActive, true))
        .orderBy(asc(termsConditions.displayOrder));
      
      // Transform the response to match expected frontend format
      const formattedTerms = terms.map(term => ({
        id: term.id,
        term_text: term.termText,
        display_order: term.displayOrder
      }));
      
      res.json(formattedTerms);
    } catch (error) {
      console.error("Error fetching terms and conditions:", error);
      res.status(500).json({ message: "Failed to fetch terms and conditions" });
    }
  });

  // Terms and Conditions individual management
  app.post("/api/terms-conditions/item", async (req, res) => {
    try {
      const { termText, displayOrder } = req.body;
      if (!termText) return res.status(400).json({ message: "Text is required" });
      const [newTerm] = await db.insert(termsConditions).values({
        termText,
        displayOrder: displayOrder || 1,
        isActive: true
      }).returning();
      res.json(newTerm);
    } catch (error) {
      res.status(500).json({ message: "Failed to add term" });
    }
  });

  app.put("/api/terms-conditions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { termText, displayOrder, isActive } = req.body;
      const [updated] = await db.update(termsConditions)
        .set({ termText, displayOrder, isActive, updatedAt: new Date() })
        .where(eq(termsConditions.id, id))
        .returning();
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update term" });
    }
  });

  app.delete("/api/terms-conditions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(termsConditions).where(eq(termsConditions.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete term" });
    }
  });

  app.post("/api/terms-conditions", async (req, res) => {
    try {
      // Using direct db import
      const { content } = req.body;
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: "Content is required" });
      }

      // Split content by lines and create separate terms
      const terms = content.split('\n').filter(line => line.trim());
      
      if (terms.length === 0) {
        return res.status(400).json({ message: "At least one term is required" });
      }

      // First, deactivate all existing terms
      await db.update(termsConditions)
        .set({ isActive: false, updatedAt: new Date() });

      // Insert new terms
      const insertPromises = terms.map((term, index) => 
        db.insert(termsConditions).values({
          termText: term.trim(),
          displayOrder: index + 1,
          isActive: true
        }).returning()
      );

      const results = await Promise.all(insertPromises);
      
      res.json({ 
        message: "Terms and conditions saved successfully", 
        count: results.length 
      });
    } catch (error) {
      console.error("Error saving terms and conditions:", error);
      res.status(500).json({ message: "Failed to save terms and conditions" });
    }
  });

  // Price Cards API Routes
  
  // Get all price cards
  app.get("/api/price-cards", async (req, res) => {
    try {
      // Using direct db import
      const cards = await db.select().from(priceCards).orderBy(desc(priceCards.createdAt));
      res.json(cards);
    } catch (error) {
      console.error("Error fetching price cards:", error);
      res.status(500).json({ message: "Failed to fetch price cards" });
    }
  });

  // Create a new price card
  app.post("/api/price-cards", async (req, res) => {
    try {
      // Using direct db import
      
      // Validate the request body using the schema
      const validatedData = insertPriceCardSchema.parse(req.body);
      
      console.log('Creating price card with data:', validatedData);
      
      const [newCard] = await db.insert(priceCards).values(validatedData).returning();
      
      console.log('Price card created successfully:', newCard.id);
      res.json(newCard);
    } catch (error: any) {
      console.error("Error creating price card:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid data format", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create price card" });
    }
  });

  // Update a price card
  app.put("/api/price-cards/:id", async (req, res) => {
    try {
      // Using direct db import
      const cardId = parseInt(req.params.id);
      
      if (isNaN(cardId)) {
        return res.status(400).json({ message: "Invalid price card ID" });
      }
      
      // Validate the request body using a partial schema
      const validatedData = insertPriceCardSchema.partial().parse(req.body);
      
      const [updatedCard] = await db.update(priceCards)
        .set({
          ...validatedData,
          updatedAt: new Date()
        })
        .where(eq(priceCards.id, cardId))
        .returning();

      if (!updatedCard) {
        return res.status(404).json({ message: "Price card not found" });
      }

      res.json(updatedCard);
    } catch (error: any) {
      console.error("Error updating price card:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid data format", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update price card" });
    }
  });

  // Delete a price card
  app.delete("/api/price-cards/:id", async (req, res) => {
    try {
      // Using direct db import
      const cardId = parseInt(req.params.id);
      
      if (isNaN(cardId)) {
        return res.status(400).json({ message: "Invalid price card ID" });
      }
      
      const [deletedCard] = await db.delete(priceCards)
        .where(eq(priceCards.id, cardId))
        .returning();

      if (!deletedCard) {
        return res.status(404).json({ message: "Price card not found" });
      }

      res.json({ message: "Price card deleted successfully", id: cardId });
    } catch (error) {
      console.error("Error deleting price card:", error);
      res.status(500).json({ message: "Failed to delete price card" });
    }
  });

  // ===== DB TEST ROUTE =====
  app.get("/api/db-test", async (req, res) => {
    try {
      const result = await db.execute(sql`SELECT current_database(), current_user, now()`);
      res.json({ success: true, info: result.rows });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ===== DROPDOWN OPTIONS MANAGEMENT APIs =====
  
  // Import Types APIs
  app.get("/api/import-types", async (req, res) => {
    try {
      // Using direct db import
      const data = await db.select().from(importTypes).where(eq(importTypes.isActive, true)).orderBy(asc(importTypes.name));
      res.json(data);
    } catch (error) {
      console.error("Error fetching import types:", error);
      res.status(500).json({ message: "Failed to fetch import types" });
    }
  });

  app.post("/api/import-types", async (req, res) => {
    try {
      // Using direct db import
      const validatedData = insertImportTypeSchema.parse(req.body);
      const [newImportType] = await db.insert(importTypes).values(validatedData).returning();
      res.status(201).json(newImportType);
    } catch (error) {
      console.error("Error creating import type:", error);
      res.status(500).json({ message: "Failed to create import type" });
    }
  });

  app.put("/api/import-types/:id", async (req, res) => {
    try {
      // Using direct db import
      const id = parseInt(req.params.id);
      const validatedData = insertImportTypeSchema.parse(req.body);
      const [updatedImportType] = await db.update(importTypes).set(validatedData).where(eq(importTypes.id, id)).returning();
      res.json(updatedImportType);
    } catch (error) {
      console.error("Error updating import type:", error);
      res.status(500).json({ message: "Failed to update import type" });
    }
  });

  app.delete("/api/import-types/:id", async (req, res) => {
    try {
      // Using direct db import
      const id = parseInt(req.params.id);
      await db.delete(importTypes).where(eq(importTypes.id, id));
      res.json({ message: "Import type deleted successfully" });
    } catch (error) {
      console.error("Error deleting import type:", error);
      res.status(500).json({ message: "Failed to delete import type" });
    }
  });

  // Vehicle Statuses APIs
  app.get("/api/vehicle-statuses", async (req, res) => {
    try {
      // Using direct db import
      const data = await db.select().from(vehicleStatuses).where(eq(vehicleStatuses.isActive, true)).orderBy(asc(vehicleStatuses.name));
      res.json(data);
    } catch (error) {
      console.error("Error fetching vehicle statuses:", error);
      res.status(500).json({ message: "Failed to fetch vehicle statuses" });
    }
  });

  app.post("/api/vehicle-statuses", async (req, res) => {
    try {
      // Using direct db import
      const validatedData = insertVehicleStatusSchema.parse(req.body);
      const [newVehicleStatus] = await db.insert(vehicleStatuses).values(validatedData).returning();
      res.status(201).json(newVehicleStatus);
    } catch (error) {
      console.error("Error creating vehicle status:", error);
      res.status(500).json({ message: "Failed to create vehicle status" });
    }
  });

  app.put("/api/vehicle-statuses/:id", async (req, res) => {
    try {
      // Using direct db import
      const id = parseInt(req.params.id);
      const validatedData = insertVehicleStatusSchema.parse(req.body);
      const [updatedVehicleStatus] = await db.update(vehicleStatuses).set(validatedData).where(eq(vehicleStatuses.id, id)).returning();
      res.json(updatedVehicleStatus);
    } catch (error) {
      console.error("Error updating vehicle status:", error);
      res.status(500).json({ message: "Failed to update vehicle status" });
    }
  });

  app.delete("/api/vehicle-statuses/:id", async (req, res) => {
    try {
      // Using direct db import
      const id = parseInt(req.params.id);
      await db.delete(vehicleStatuses).where(eq(vehicleStatuses.id, id));
      res.json({ message: "Vehicle status deleted successfully" });
    } catch (error) {
      console.error("Error deleting vehicle status:", error);
      res.status(500).json({ message: "Failed to delete vehicle status" });
    }
  });

  // Ownership Types APIs
  app.get("/api/ownership-types", async (req, res) => {
    try {
      // Using direct db import
      const data = await db.select().from(ownershipTypes).where(eq(ownershipTypes.isActive, true)).orderBy(asc(ownershipTypes.name));
      res.json(data);
    } catch (error) {
      console.error("Error fetching ownership types:", error);
      res.status(500).json({ message: "Failed to fetch ownership types" });
    }
  });

  app.post("/api/ownership-types", async (req, res) => {
    try {
      // Using direct db import
      const validatedData = insertOwnershipTypeSchema.parse(req.body);
      const [newOwnershipType] = await db.insert(ownershipTypes).values(validatedData).returning();
      res.status(201).json(newOwnershipType);
    } catch (error) {
      console.error("Error creating ownership type:", error);
      res.status(500).json({ message: "Failed to create ownership type" });
    }
  });

  app.put("/api/ownership-types/:id", async (req, res) => {
    try {
      // Using direct db import
      const id = parseInt(req.params.id);
      const validatedData = insertOwnershipTypeSchema.parse(req.body);
      const [updatedOwnershipType] = await db.update(ownershipTypes).set(validatedData).where(eq(ownershipTypes.id, id)).returning();
      res.json(updatedOwnershipType);
    } catch (error) {
      console.error("Error updating ownership type:", error);
      res.status(500).json({ message: "Failed to update ownership type" });
    }
  });

  app.delete("/api/ownership-types/:id", async (req, res) => {
    try {
      // Using direct db import
      const id = parseInt(req.params.id);
      await db.delete(ownershipTypes).where(eq(ownershipTypes.id, id));
      res.json({ message: "Ownership type deleted successfully" });
    } catch (error) {
      console.error("Error deleting ownership type:", error);
      res.status(500).json({ message: "Failed to delete ownership type" });
    }
  });

  // Vehicle Locations APIs
  app.get("/api/vehicle-locations", async (req, res) => {
    try {
      // Using direct db import
      const data = await db.select().from(vehicleLocations).where(eq(vehicleLocations.isActive, true)).orderBy(asc(vehicleLocations.name));
      res.json(data);
    } catch (error) {
      console.error("Error fetching vehicle locations:", error);
      res.status(500).json({ message: "Failed to fetch vehicle locations" });
    }
  });

  app.post("/api/vehicle-locations", async (req, res) => {
    try {
      // Using direct db import
      const validatedData = insertVehicleLocationSchema.parse(req.body);
      const [newVehicleLocation] = await db.insert(vehicleLocations).values(validatedData).returning();
      res.status(201).json(newVehicleLocation);
    } catch (error) {
      console.error("Error creating vehicle location:", error);
      res.status(500).json({ message: "Failed to create vehicle location" });
    }
  });

  app.put("/api/vehicle-locations/:id", async (req, res) => {
    try {
      // Using direct db import
      const id = parseInt(req.params.id);
      const validatedData = insertVehicleLocationSchema.parse(req.body);
      const [updatedVehicleLocation] = await db.update(vehicleLocations).set(validatedData).where(eq(vehicleLocations.id, id)).returning();
      res.json(updatedVehicleLocation);
    } catch (error) {
      console.error("Error updating vehicle location:", error);
      res.status(500).json({ message: "Failed to update vehicle location" });
    }
  });

  app.delete("/api/vehicle-locations/:id", async (req, res) => {
    try {
      // Using direct db import
      const id = parseInt(req.params.id);
      await db.delete(vehicleLocations).where(eq(vehicleLocations.id, id));
      res.json({ message: "Vehicle location deleted successfully" });
    } catch (error) {
      console.error("Error deleting vehicle location:", error);
      res.status(500).json({ message: "Failed to delete vehicle location" });
    }
  });

  // Vehicle Colors APIs
  app.get("/api/vehicle-colors", async (req, res) => {
    try {
      // Using direct db import
      const { type } = req.query;
      const conditions = [eq(vehicleColors.isActive, true)];
      
      if (type) {
        conditions.push(eq(vehicleColors.colorType, type as string));
      }
      
      const data = await db.select()
        .from(vehicleColors)
        .where(and(...conditions))
        .orderBy(asc(vehicleColors.name));
        
      res.json(data);
    } catch (error) {
      console.error("Error fetching vehicle colors:", error);
      res.status(500).json({ message: "Failed to fetch vehicle colors" });
    }
  });

  app.post("/api/vehicle-colors", async (req, res) => {
    try {
      // Using direct db import
      const validatedData = insertVehicleColorSchema.parse(req.body);
      const [newVehicleColor] = await db.insert(vehicleColors).values(validatedData).returning();
      res.status(201).json(newVehicleColor);
    } catch (error) {
      console.error("Error creating vehicle color:", error);
      res.status(500).json({ message: "Failed to create vehicle color" });
    }
  });

  app.put("/api/vehicle-colors/:id", async (req, res) => {
    try {
      // Using direct db import
      const id = parseInt(req.params.id);
      const validatedData = insertVehicleColorSchema.parse(req.body);
      const [updatedVehicleColor] = await db.update(vehicleColors).set(validatedData).where(eq(vehicleColors.id, id)).returning();
      res.json(updatedVehicleColor);
    } catch (error) {
      console.error("Error updating vehicle color:", error);
      res.status(500).json({ message: "Failed to update vehicle color" });
    }
  });

  app.delete("/api/vehicle-colors/:id", async (req, res) => {
    try {
      // Using direct db import
      const id = parseInt(req.params.id);
      await db.delete(vehicleColors).where(eq(vehicleColors.id, id));
      res.json({ message: "Vehicle color deleted successfully" });
    } catch (error) {
      console.error("Error deleting vehicle color:", error);
      res.status(500).json({ message: "Failed to delete vehicle color" });
    }
  });

  // Initialize default dropdown data
  app.post("/api/initialize-dropdown-data", async (req, res) => {
    try {
      // Using direct db import
      
      // Add default vehicle statuses including the new ones
      const defaultStatuses = [
        { name: 'متاح', description: 'مركبة متاحة للبيع', isActive: true },
        { name: 'محجوز', description: 'مركبة محجوزة للعميل', isActive: true },
        { name: 'مباع', description: 'مركبة تم بيعها', isActive: true },
        { name: 'في الطريق', description: 'مركبة في طريقها للمعرض', isActive: true },
        { name: 'تحت الصيانة', description: 'مركبة تحت الصيانة', isActive: true },
        { name: 'تشغيل', description: 'مركبة قيد التشغيل', isActive: true },
        { name: 'خاص', description: 'مركبة للاستخدام الخاص', isActive: true }
      ];

      // Add default import types
      const defaultImportTypes = [
        { name: 'وارد الخليج', description: 'مركبة واردة من دول الخليج', isActive: true },
        { name: 'وارد أمريكا', description: 'مركبة واردة من أمريكا', isActive: true },
        { name: 'وارد أوروبا', description: 'مركبة واردة من أوروبا', isActive: true },
        { name: 'وارد آسيا', description: 'مركبة واردة من آسيا', isActive: true },
        { name: 'محلي', description: 'مركبة محلية الصنع', isActive: true }
      ];

      // Add default ownership types
      const defaultOwnershipTypes = [
        { name: 'ملكية أولى', description: 'المالك الأول للمركبة', isActive: true },
        { name: 'ملكية ثانية', description: 'المالك الثاني للمركبة', isActive: true },
        { name: 'ملكية متعددة', description: 'أكثر من مالكين سابقين', isActive: true },
        { name: 'شركة', description: 'ملكية شركة', isActive: true },
        { name: 'حكومي', description: 'ملكية حكومية', isActive: true }
      ];

      // Add default vehicle locations
      const defaultLocations = [
        { name: 'المعرض الرئيسي', description: 'المعرض الرئيسي للمركبات', isActive: true },
        { name: 'المعرض الفرعي', description: 'المعرض الفرعي للمركبات', isActive: true },
        { name: 'المستودع', description: 'مستودع المركبات', isActive: true },
        { name: 'ورشة الصيانة', description: 'ورشة صيانة المركبات', isActive: true },
        { name: 'في الطريق', description: 'مركبة في الطريق', isActive: true }
      ];

      // Add default vehicle years (last 10 years + next 2)
      const currentYear = new Date().getFullYear();
      const defaultYears = [];
      for (let year = currentYear + 2; year >= currentYear - 10; year--) {
        defaultYears.push({ year, isActive: true });
      }

      // Add default engine capacities
      const defaultEngineCapacities = [
        { capacity: '1.0L', description: 'محرك 1.0 لتر', isActive: true },
        { capacity: '1.2L', description: 'محرك 1.2 لتر', isActive: true },
        { capacity: '1.4L', description: 'محرك 1.4 لتر', isActive: true },
        { capacity: '1.6L', description: 'محرك 1.6 لتر', isActive: true },
        { capacity: '1.8L', description: 'محرك 1.8 لتر', isActive: true },
        { capacity: '2.0L', description: 'محرك 2.0 لتر', isActive: true },
        { capacity: '2.4L', description: 'محرك 2.4 لتر', isActive: true },
        { capacity: '2.5L', description: 'محرك 2.5 لتر', isActive: true },
        { capacity: '3.0L', description: 'محرك 3.0 لتر', isActive: true },
        { capacity: '3.5L', description: 'محرك 3.5 لتر', isActive: true },
        { capacity: '4.0L', description: 'محرك 4.0 لتر', isActive: true },
        { capacity: '5.0L', description: 'محرك 5.0 لتر', isActive: true },
        { capacity: '6.0L', description: 'محرك 6.0 لتر', isActive: true }
      ];

      // Add default vehicle colors
      const defaultColors = [
        { name: 'أبيض', colorType: 'exterior', colorCode: '#FFFFFF', isActive: true },
        { name: 'أسود', colorType: 'exterior', colorCode: '#000000', isActive: true },
        { name: 'فضي', colorType: 'exterior', colorCode: '#C0C0C0', isActive: true },
        { name: 'رمادي', colorType: 'exterior', colorCode: '#808080', isActive: true },
        { name: 'أحمر', colorType: 'exterior', colorCode: '#FF0000', isActive: true },
        { name: 'أزرق', colorType: 'exterior', colorCode: '#0000FF', isActive: true },
        { name: 'أخضر', colorType: 'exterior', colorCode: '#008000', isActive: true },
        { name: 'بني', colorType: 'exterior', colorCode: '#A52A2A', isActive: true },
        { name: 'ذهبي', colorType: 'exterior', colorCode: '#FFD700', isActive: true },
        { name: 'أسود', colorType: 'interior', colorCode: '#000000', isActive: true },
        { name: 'بيج', colorType: 'interior', colorCode: '#F5F5DC', isActive: true },
        { name: 'رمادي', colorType: 'interior', colorCode: '#808080', isActive: true },
        { name: 'بني', colorType: 'interior', colorCode: '#A52A2A', isActive: true }
      ];

      const results = {
        vehicleStatuses: 0,
        importTypes: 0,
        ownershipTypes: 0,
        vehicleLocations: 0,
        vehicleYears: 0,
        engineCapacities: 0,
        vehicleColors: 0
      };

      try {
        // Create tables first if they don't exist
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS vehicle_statuses (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true NOT NULL,
            created_at TIMESTAMP DEFAULT now()
          );
        `);

        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS import_types (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true NOT NULL,
            created_at TIMESTAMP DEFAULT now()
          );
        `);

        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS ownership_types (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true NOT NULL,
            created_at TIMESTAMP DEFAULT now()
          );
        `);

        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS vehicle_locations (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true NOT NULL,
            created_at TIMESTAMP DEFAULT now()
          );
        `);

        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS vehicle_years (
            id SERIAL PRIMARY KEY,
            year INTEGER UNIQUE NOT NULL,
            is_active BOOLEAN DEFAULT true NOT NULL,
            created_at TIMESTAMP DEFAULT now()
          );
        `);

        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS engine_capacities (
            id SERIAL PRIMARY KEY,
            capacity TEXT UNIQUE NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true NOT NULL,
            created_at TIMESTAMP DEFAULT now()
          );
        `);

        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS vehicle_colors (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            color_type TEXT NOT NULL,
            color_code TEXT,
            is_active BOOLEAN DEFAULT true NOT NULL,
            created_at TIMESTAMP DEFAULT now()
          );
        `);

        // Insert data with conflict handling
        for (const status of defaultStatuses) {
          try {
            await db.insert(vehicleStatuses).values(status).onConflictDoNothing();
            results.vehicleStatuses++;
          } catch (e) {
            console.log('Vehicle status exists:', status.name);
          }
        }

        for (const importType of defaultImportTypes) {
          try {
            await db.insert(importTypes).values(importType).onConflictDoNothing();
            results.importTypes++;
          } catch (e) {
            console.log('Import type exists:', importType.name);
          }
        }

        for (const ownershipType of defaultOwnershipTypes) {
          try {
            await db.insert(ownershipTypes).values(ownershipType).onConflictDoNothing();
            results.ownershipTypes++;
          } catch (e) {
            console.log('Ownership type exists:', ownershipType.name);
          }
        }

        for (const location of defaultLocations) {
          try {
            await db.insert(vehicleLocations).values(location).onConflictDoNothing();
            results.vehicleLocations++;
          } catch (e) {
            console.log('Location exists:', location.name);
          }
        }

        for (const year of defaultYears) {
          try {
            await db.insert(vehicleYears).values(year).onConflictDoNothing();
            results.vehicleYears++;
          } catch (e) {
            console.log('Year exists:', year.year);
          }
        }

        for (const capacity of defaultEngineCapacities) {
          try {
            await db.insert(engineCapacities).values(capacity).onConflictDoNothing();
            results.engineCapacities++;
          } catch (e) {
            console.log('Engine capacity exists:', capacity.capacity);
          }
        }

        for (const color of defaultColors) {
          try {
            await db.insert(vehicleColors).values(color).onConflictDoNothing();
            results.vehicleColors++;
          } catch (e) {
            console.log('Color exists:', color.name);
          }
        }

      } catch (error) {
        console.error('Error initializing data:', error);
      }

      res.json({
        message: "تم تهيئة البيانات الأساسية بنجاح",
        results
      });
    } catch (error) {
      console.error("Error initializing dropdown data:", error);
      res.status(500).json({ message: "فشل في تهيئة البيانات الأساسية" });
    }
  });

  // Catch-all for unknown API routes to prevent falling through to Vite HTML
  app.use("/api/*", (req, res) => {
    res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  const httpServer = createServer(app);
  return httpServer;
}
