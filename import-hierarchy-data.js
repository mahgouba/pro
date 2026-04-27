// Script to import vehicle hierarchy data
import fs from 'fs';

// Read the data file
const rawData = fs.readFileSync('attached_assets/Pasted--brand-ar-brand-en-Toyota-models-model-ar--1754993643881_1754993643883.txt', 'utf8');
const vehicleData = JSON.parse(rawData);

// API base URL - using localhost since we're running this locally
const API_BASE = 'http://localhost:5000/api';

// Function to add manufacturer
async function addManufacturer(brand) {
  try {
    const response = await fetch(`${API_BASE}/hierarchical/manufacturers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nameAr: brand.brand_ar,
        nameEn: brand.brand_en
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to add manufacturer ${brand.brand_ar}:`, error);
      return null;
    }
    
    const result = await response.json();
    console.log(`✓ Added manufacturer: ${brand.brand_ar} (${brand.brand_en})`);
    return result.id;
  } catch (error) {
    console.error(`Error adding manufacturer ${brand.brand_ar}:`, error);
    return null;
  }
}

// Function to add category (model)
async function addCategory(manufacturerId, model) {
  try {
    const response = await fetch(`${API_BASE}/hierarchical/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        manufacturer_id: manufacturerId,
        name_ar: model.model_ar,
        name_en: model.model_en
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to add category ${model.model_ar}:`, error);
      return null;
    }
    
    const result = await response.json();
    console.log(`  ✓ Added category: ${model.model_ar} (${model.model_en})`);
    return result.id;
  } catch (error) {
    console.error(`Error adding category ${model.model_ar}:`, error);
    return null;
  }
}

// Function to add trim level
async function addTrimLevel(categoryId, trim) {
  try {
    const response = await fetch(`${API_BASE}/hierarchical/trim-levels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category_id: categoryId,
        name_ar: trim.trim_ar,
        name_en: trim.trim_en
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to add trim level ${trim.trim_ar}:`, error);
      return false;
    }
    
    console.log(`    ✓ Added trim level: ${trim.trim_ar} (${trim.trim_en})`);
    return true;
  } catch (error) {
    console.error(`Error adding trim level ${trim.trim_ar}:`, error);
    return false;
  }
}

// Main import function
async function importHierarchyData() {
  console.log('Starting hierarchy data import...\n');
  
  let totalManufacturers = 0;
  let totalCategories = 0;
  let totalTrimLevels = 0;
  
  for (const brand of vehicleData) {
    // Add manufacturer
    const manufacturerId = await addManufacturer(brand);
    if (manufacturerId) {
      totalManufacturers++;
      
      // Add models (categories) for this manufacturer
      for (const model of brand.models) {
        const categoryId = await addCategory(manufacturerId, model);
        if (categoryId) {
          totalCategories++;
          
          // Add trim levels for this category
          for (const trim of model.trims) {
            const success = await addTrimLevel(categoryId, trim);
            if (success) {
              totalTrimLevels++;
            }
          }
        }
      }
    }
    
    console.log(''); // Empty line between manufacturers
  }
  
  console.log('\n=== Import Summary ===');
  console.log(`Total Manufacturers: ${totalManufacturers}`);
  console.log(`Total Categories (Models): ${totalCategories}`);
  console.log(`Total Trim Levels: ${totalTrimLevels}`);
  console.log('\nImport completed!');
}

// Run the import
importHierarchyData().catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
});