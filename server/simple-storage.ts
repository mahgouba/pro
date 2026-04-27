import "dotenv/config";
import bcrypt from "bcryptjs";
import { 
  type User, type InsertUser, 
  type InventoryItem, type InsertInventoryItem, 
  type Bank, type InsertBank,
  type Manufacturer, type InsertManufacturer,
  type EmployeeWorkSchedule, type InsertEmployeeWorkSchedule,
  type DailyAttendance, type InsertDailyAttendance,
  type LeaveRequest, type InsertLeaveRequest
} from "@shared/schema";

// Simplified memory storage implementation for Replit compatibility
export class SimpleMemStorage {
  private users = new Map<number, User>();
  private inventoryItems = new Map<number, InventoryItem>();
  private manufacturers = new Map<number, Manufacturer>();
  private banks = new Map<number, Bank>();
  
  private currentUserId = 1;
  private currentInventoryId = 1;
  private currentManufacturerId = 1;
  private currentBankId = 1;

  constructor() {
    this.initializeData().catch(console.error);
  }

  private async initializeData() {
    // Hash the default password
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    // Initialize default admin user
    const adminUser: User = {
      id: this.currentUserId++,
      name: "مدير النظام",
      jobTitle: "مدير",
      phoneNumber: "966555000001",
      username: "admin",
      password: hashedPassword,
      role: "admin",
      createdAt: new Date()
    };
    this.users.set(1, adminUser);

    // Initialize other default users
    const salesManager: User = {
      id: this.currentUserId++,
      name: "مدير المبيعات",
      jobTitle: "مدير مبيعات",
      phoneNumber: "966555000002",
      username: "sales_manager",
      password: hashedPassword,
      role: "sales_director",
      createdAt: new Date()
    };
    this.users.set(2, salesManager);

    const accountant: User = {
      id: this.currentUserId++,
      name: "المحاسب",
      jobTitle: "محاسب",
      phoneNumber: "966555000003",
      username: "accountant",
      password: hashedPassword,
      role: "accountant",
      createdAt: new Date()
    };
    this.users.set(3, accountant);

    const salesperson: User = {
      id: this.currentUserId++,
      name: "مندوب المبيعات",
      jobTitle: "مندوب مبيعات",
      phoneNumber: "966555000004",
      username: "salesperson",
      password: hashedPassword,
      role: "salesperson",
      createdAt: new Date()
    };
    this.users.set(4, salesperson);

    console.log('✅ Initialized default users for development');
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      ...user,
      id: this.currentUserId++,
      createdAt: new Date()
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...user };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Inventory methods
  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values());
  }

  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    return this.inventoryItems.get(id);
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const newItem: InventoryItem = {
      ...item,
      id: this.currentInventoryId++,
      entryDate: new Date(),
      images: item.images || [],
      isSold: item.isSold || false
    };
    this.inventoryItems.set(newItem.id, newItem);
    return newItem;
  }

  async updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const existing = this.inventoryItems.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...item };
    this.inventoryItems.set(id, updated);
    return updated;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    return this.inventoryItems.delete(id);
  }

  // Manufacturer methods
  async getAllManufacturers(): Promise<Manufacturer[]> {
    return Array.from(this.manufacturers.values());
  }

  async getManufacturer(id: number): Promise<Manufacturer | undefined> {
    return this.manufacturers.get(id);
  }

  async createManufacturer(manufacturer: InsertManufacturer): Promise<Manufacturer> {
    const newManufacturer: Manufacturer = {
      ...manufacturer,
      id: this.currentManufacturerId++,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: manufacturer.isActive ?? true
    };
    this.manufacturers.set(newManufacturer.id, newManufacturer);
    return newManufacturer;
  }

  // Bank methods
  async getAllBanks(): Promise<Bank[]> {
    return Array.from(this.banks.values());
  }

  async getBank(id: number): Promise<Bank | undefined> {
    return this.banks.get(id);
  }

  async createBank(bank: InsertBank): Promise<Bank> {
    const newBank: Bank = {
      ...bank,
      id: this.currentBankId++,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: bank.isActive ?? true
    };
    this.banks.set(newBank.id, newBank);
    return newBank;
  }

  // Minimal required methods to satisfy interface - can be expanded as needed
  async searchInventoryItems(query: string): Promise<InventoryItem[]> {
    const items = Array.from(this.inventoryItems.values());
    return items.filter(item => 
      item.manufacturer.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase()) ||
      item.chassisNumber.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getInventoryStats() {
    const items = Array.from(this.inventoryItems.values());
    const total = items.length;
    const available = items.filter(item => item.status === "متوفر").length;
    const sold = items.filter(item => item.isSold).length;
    
    return {
      total,
      available,
      inTransit: 0,
      maintenance: 0,
      reserved: 0,
      sold,
      personal: 0,
      company: 0,
      usedPersonal: 0
    };
  }

  async clearAllInventoryItems(): Promise<boolean> {
    this.inventoryItems.clear();
    return true;
  }

  async filterInventoryItems(filters: any): Promise<InventoryItem[]> {
    let items = Array.from(this.inventoryItems.values());
    
    if (filters.manufacturer) {
      items = items.filter(item => item.manufacturer === filters.manufacturer);
    }
    if (filters.category) {
      items = items.filter(item => item.category === filters.category);
    }
    if (filters.status) {
      items = items.filter(item => item.status === filters.status);
    }
    if (filters.year) {
      items = items.filter(item => item.year === filters.year);
    }
    
    return items;
  }

  // Specifications methods
  async getSpecifications(manufacturer: string, category: string, trimLevel: string, year: string, engineCapacity: string) {
    // Return specifications matching the TrimLevel schema structure but with added properties
    const specs = {
      id: 1,
      manufacturer,
      category,
      trimLevel: trimLevel || 'Standard',
      year: parseInt(year) || 2025,
      engineCapacity,
      description: `${manufacturer} ${category} ${trimLevel || ''} موديل ${year}`,
      detailedDescription: this.generateDetailedDescription(manufacturer, category, trimLevel, year, engineCapacity),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('📋 Fetching specifications for:', { manufacturer, category, trimLevel, year, engineCapacity });
    return specs;
  }

  private generateDetailedDescription(manufacturer: string, category: string, trimLevel: string, year: string, engineCapacity: string): string {
    // Generate detailed Arabic specifications based on vehicle parameters
    const baseSpecs = [
      `الصانع: ${manufacturer}`,
      `الفئة: ${category}`,
      `درجة التجهيز: ${trimLevel || 'قياسي'}`,
      `سنة الصنع: ${year}`,
      `سعة المحرك: ${engineCapacity}`,
      `نوع الوقود: بنزين`,
      `ناقل الحركة: أوتوماتيك`,
      `نظام الدفع: دفع أمامي`,
      `عدد المقاعد: 5 مقاعد`,
      `نوع الجسم: سيدان`,
      `لون الهيكل: حسب المتوفر`,
      `لون الداخلية: حسب المتوفر`
    ];

    // Add luxury features based on trim level
    if (trimLevel && (trimLevel.includes('SV') || trimLevel.includes('Long') || trimLevel.includes('Premium'))) {
      baseSpecs.push(
        `نظام الترفيه: شاشة تعمل باللمس مع نظام الملاحة`,
        `المقاعد: جلد فاخر مع التدفئة والتبريد`,
        `النوافذ: كهربائية مع الصعود والهبوط الآلي`,
        `نظام الأمان: كاميرا خلفية وأجهزة استشعار`,
        `العجلات: سبيكة معدنية مقاس كبير`,
        `الإضاءة: LED للمصابيح الأمامية والخلفية`,
        `التكييف: تحكم مزدوج في درجة الحرارة`,
        `المرايا: كهربائية قابلة للطي`
      );
    } else {
      baseSpecs.push(
        `نظام الترفيه: راديو مع مشغل MP3`,
        `المقاعد: قماش عالي الجودة`,
        `النوافذ: كهربائية`,
        `نظام الأمان: أحزمة الأمان وأكياس هوائية`,
        `العجلات: فولاذية أو سبيكة معدنية`,
        `الإضاءة: هالوجين`,
        `التكييف: تحكم يدوي`,
        `المرايا: كهربائية`
      );
    }

    return baseSpecs.join('\n• ');
  }

  // Attendance Management Methods
  async getAllEmployeeWorkSchedules() { return []; }
  async createEmployeeWorkSchedule(schedule: any) { return schedule; }
  async updateEmployeeWorkSchedule(id: number, schedule: any) { return schedule; }
  async deleteEmployeeWorkSchedule(id: number) { return true; }
  
  async getAllDailyAttendance() { return []; }
  async getDailyAttendanceByEmployeeAndDate(employeeId: number, date: Date) { return []; }
  async getDailyAttendanceByEmployeeAndDateRange(employeeId: number, startDate: Date, endDate: Date) { return []; }
  async getDailyAttendanceByDate(date: Date) { return []; }
  async createDailyAttendance(attendance: any) { return attendance; }
  async updateDailyAttendance(id: number, attendance: any) { return attendance; }
  async deleteDailyAttendance(id: number) { return true; }
  
  async getAllLeaveRequests() { return []; }
  async createLeaveRequest(request: any) { return request; }
  async updateLeaveRequestStatus(id: number, status: string, rejectionReason?: string) { return { id, status }; }
  
  // Placeholder methods - implement as needed
  async getManufacturerStats() { return []; }
  async getLocationStats() { return []; }
  async updateManufacturer() { return undefined; }
  async deleteManufacturer() { return false; }
  async updateBank() { return undefined; }
  async deleteBank() { return false; }
}

// Create and export a single instance
const storage = new SimpleMemStorage();
export default storage;