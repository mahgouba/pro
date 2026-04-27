import { Router } from "express";
import { 
  connectToRailway, 
  importAllDataFromRailway, 
  importInventoryFromRailway,
  importManufacturersFromRailway,
  importBanksFromRailway,
  importUsersFromRailway
} from "../railway-import";

const router = Router();

// Test Railway connection
router.get("/test-connection", async (req, res) => {
  try {
    await connectToRailway();
    res.json({ success: true, message: "Railway database connection successful" });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to connect to Railway database",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Import all data from Railway
router.post("/import-all", async (req, res) => {
  try {
    const results = await importAllDataFromRailway();
    res.json({ 
      success: true, 
      message: "Successfully imported all data from Railway",
      results 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to import data from Railway",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Import inventory only
router.post("/import-inventory", async (req, res) => {
  try {
    const count = await importInventoryFromRailway();
    res.json({ 
      success: true, 
      message: `Successfully imported ${count} inventory items from Railway`,
      count 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to import inventory from Railway",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Import manufacturers only  
router.post("/import-manufacturers", async (req, res) => {
  try {
    const count = await importManufacturersFromRailway();
    res.json({ 
      success: true, 
      message: `Successfully imported ${count} manufacturers from Railway`,
      count 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to import manufacturers from Railway",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Import banks only
router.post("/import-banks", async (req, res) => {
  try {
    const count = await importBanksFromRailway();
    res.json({ 
      success: true, 
      message: `Successfully imported ${count} banks from Railway`,
      count 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to import banks from Railway",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Import users only
router.post("/import-users", async (req, res) => {
  try {
    const count = await importUsersFromRailway();
    res.json({ 
      success: true, 
      message: `Successfully imported ${count} users from Railway`,
      count 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to import users from Railway",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;