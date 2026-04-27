import { 
  type User, type InsertUser, 
  type InventoryItem, type InsertInventoryItem, 
  type Manufacturer, type InsertManufacturer, 
  type Company, type InsertCompany,
  type Location, type InsertLocation, 
  type LocationTransfer, type InsertLocationTransfer,
  type LowStockAlert, type InsertLowStockAlert,
  type StockSettings, type InsertStockSettings,
  type AppearanceSettings, type InsertAppearanceSettings,

  type TrimLevel, type InsertTrimLevel,
  type Quotation, type InsertQuotation,
  type FinancingCalculation, type InsertFinancingCalculation,
  type Bank, type InsertBank,
  type LeaveRequest, type InsertLeaveRequest
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Inventory methods
  getAllInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItem(id: number): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: number): Promise<boolean>;
  clearAllInventoryItems(): Promise<boolean>;
  searchInventoryItems(query: string): Promise<InventoryItem[]>;
  filterInventoryItems(filters: { 
    category?: string; 
    status?: string; 
    year?: number; 
    manufacturer?: string;
    importType?: string;
    location?: string;
  }): Promise<InventoryItem[]>;
  getInventoryStats(): Promise<{ 
    total: number; 
    available: number; 
    inTransit: number; 
    maintenance: number;
    reserved: number;
    sold: number;
    personal: number;
    company: number;
    usedPersonal: number;
  }>;
  getManufacturerStats(): Promise<Array<{
    manufacturer: string;
    total: number;
    personal: number;
    company: number;
    usedPersonal: number;
    logo?: string | null;
  }>>;
  getLocationStats(): Promise<Array<{
    location: string;
    total: number;
    available: number;
    inTransit: number;
    maintenance: number;
    sold: number;
  }>>;
  getReservedItems(): Promise<InventoryItem[]>;
  getSoldItems(): Promise<InventoryItem[]>;
  transferItem(id: number, newLocation: string, reason?: string, transferredBy?: string): Promise<boolean>;
  
  // Location management methods
  getAllLocations(): Promise<Location[]>;
  getLocation(id: number): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: number, location: Partial<InsertLocation>): Promise<Location | undefined>;
  deleteLocation(id: number): Promise<boolean>;
  
  // Location transfer methods
  getAllLocationTransfers(): Promise<LocationTransfer[]>;
  getLocationTransfer(id: number): Promise<LocationTransfer | undefined>;
  createLocationTransfer(transfer: InsertLocationTransfer): Promise<LocationTransfer>;
  updateLocationTransfer(id: number, transfer: Partial<InsertLocationTransfer>): Promise<LocationTransfer | undefined>;
  deleteLocationTransfer(id: number): Promise<boolean>;
  getLocationTransfersByItem(itemId: number): Promise<LocationTransfer[]>;
  
  // Manufacturer methods
  getAllManufacturers(): Promise<Manufacturer[]>;
  getManufacturer(id: number): Promise<Manufacturer | undefined>;
  createManufacturer(manufacturer: InsertManufacturer): Promise<Manufacturer>;
  updateManufacturer(id: number, manufacturer: Partial<InsertManufacturer>): Promise<Manufacturer | undefined>;
  deleteManufacturer(id: number): Promise<boolean>;
  getManufacturerByName(name: string): Promise<Manufacturer | undefined>;
  
  // Appearance settings methods
  getAppearanceSettings(): Promise<AppearanceSettings | undefined>;
  updateAppearanceSettings(settings: InsertAppearanceSettings): Promise<AppearanceSettings>;
  

  
  // Trim levels methods
  getAllTrimLevels(): Promise<TrimLevel[]>;
  getTrimLevel(id: number): Promise<TrimLevel | undefined>;
  createTrimLevel(trimLevel: InsertTrimLevel): Promise<TrimLevel>;
  updateTrimLevel(id: number, trimLevel: Partial<InsertTrimLevel>): Promise<TrimLevel | undefined>;
  deleteTrimLevel(id: number): Promise<boolean>;
  getTrimLevelsByCategory(manufacturer: string, category: string): Promise<TrimLevel[]>;
  
  // Categories and engine capacities methods
  getAllCategories(): Promise<{ category: string }[]>;
  getCategoriesByManufacturer(manufacturer: string): Promise<{ category: string }[]>;
  getAllEngineCapacities(): Promise<{ engineCapacity: string }[]>;
  
  // Quotations methods
  getAllQuotations(): Promise<Quotation[]>;
  getQuotation(id: number): Promise<Quotation | undefined>;
  createQuotation(quotation: InsertQuotation): Promise<Quotation>;
  updateQuotation(id: number, quotation: Partial<InsertQuotation>): Promise<Quotation | undefined>;
  deleteQuotation(id: number): Promise<boolean>;
  getQuotationsByStatus(status: string): Promise<Quotation[]>;
  getQuotationByNumber(quoteNumber: string): Promise<Quotation | undefined>;
  
  // Terms and Conditions methods
  getAllTermsConditions(): Promise<Array<{ id: number; term_text: string; display_order: number }>>;
  updateTermsConditions(terms: Array<{ id: number; term_text: string; display_order: number }>): Promise<void>;
  
  // Invoice methods
  createInvoice(invoice: any): Promise<any>;
  getInvoices(): Promise<any[]>;
  getInvoiceById(id: number): Promise<any | undefined>;
  updateInvoice(id: number, invoice: any): Promise<any>;
  deleteInvoice(id: number): Promise<boolean>;
  getInvoicesByStatus(status: string): Promise<any[]>;
  getInvoiceByNumber(invoiceNumber: string): Promise<any | undefined>;

  // System Settings methods
  getSystemSettings(): Promise<Array<{key: string, value: string}>>;
  updateSystemSetting(key: string, value: string): Promise<{key: string, value: string}>;
  getDefaultCompanyId(): Promise<number | null>;
  
  // Financing calculations methods
  getAllFinancingCalculations(): Promise<FinancingCalculation[]>;
  getFinancingCalculation(id: number): Promise<FinancingCalculation | undefined>;
  createFinancingCalculation(calculation: InsertFinancingCalculation): Promise<FinancingCalculation>;
  updateFinancingCalculation(id: number, calculation: Partial<InsertFinancingCalculation>): Promise<FinancingCalculation | undefined>;
  deleteFinancingCalculation(id: number): Promise<boolean>;

  // Bank management methods
  getAllBanks(): Promise<Bank[]>;
  getBank(id: number): Promise<Bank | undefined>;
  getBanksByType(type: "شخصي" | "شركة"): Promise<Bank[]>;
  createBank(bank: InsertBank): Promise<Bank>;
  updateBank(id: number, bank: Partial<InsertBank>): Promise<Bank | undefined>;
  deleteBank(id: number): Promise<boolean>;

  // Leave request methods
  getAllLeaveRequests(): Promise<LeaveRequest[]>;
  getLeaveRequestById(id: number): Promise<LeaveRequest | undefined>;
  createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest>;
  updateLeaveRequestStatus(id: number, status: string, approvedBy?: number, approvedByName?: string, rejectionReason?: string): Promise<LeaveRequest | undefined>;
  deleteLeaveRequest(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users = new Map<number, User>();
  private inventoryItems = new Map<number, InventoryItem>();
  private manufacturers = new Map<number, Manufacturer>();
  private locations = new Map<number, Location>();
  private locationTransfers = new Map<number, LocationTransfer>();
  private specifications = new Map<number, Specification>();
  private trimLevels = new Map<number, TrimLevel>();
  private quotations = new Map<number, Quotation>();
  private invoices = new Map<number, any>();
  private financingCalculations = new Map<number, FinancingCalculation>();
  private banks = new Map<number, Bank>();
  private leaveRequests = new Map<number, LeaveRequest>();
  
  private currentUserId = 1;
  private currentInventoryId = 1;
  private currentManufacturerId = 1;
  private currentLocationId = 1;
  private currentLocationTransferId = 1;
  private currentSpecificationId = 1;
  private currentTrimLevelId = 1;
  private currentQuotationId = 1;
  private currentInvoiceId = 1;
  private currentFinancingCalculationId = 1;
  private currentBankId = 1;
  private currentLeaveRequestId = 1;
  
  private storedTermsConditions: Array<{ id: number; term_text: string; display_order: number }> = [];
  private systemSettings = new Map<string, string>();
  private companies = new Map<number, Company>();
  private currentCompanyId = 1;
  private appearanceSettings: AppearanceSettings | undefined;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize users
    const adminUser: User = {
      id: this.currentUserId++,
      name: "مدير النظام",
      jobTitle: "مدير",
      phoneNumber: "966555000001",
      username: "admin",
      password: "admin123",
      role: "admin",
      createdAt: new Date()
    };
    this.users.set(1, adminUser);

    // Initialize sample inventory items
    const sampleItems = [
      {
        status: "متوفر",
        manufacturer: "تويوتا",
        category: "كامري",
        trimLevel: "GLE",
        engineCapacity: "2.5L",
        year: 2023,
        exteriorColor: "أبيض",
        interiorColor: "بيج",
        importType: "شركة",
        ownershipType: "ملك الشركة",
        location: "المعرض",
        chassisNumber: "JTDBE32K123456789",
        images: [],
        isSold: false
      },
      {
        status: "في الطريق",
        manufacturer: "تويوتا",
        category: "كامري",
        trimLevel: "GLX",
        engineCapacity: "2.5L",
        year: 2023,
        exteriorColor: "أسود",
        interiorColor: "أسود",
        importType: "شخصي",
        ownershipType: "ملك الشركة",
        location: "الميناء",
        chassisNumber: "JTDBE32K987654321",
        images: [],
        isSold: false
      }
    ];

    sampleItems.forEach(item => {
      this.createInventoryItem(item);
    });

    // Initialize banks
    this.initializeBanks();
  }

  private initializeBanks() {
    const sampleBanks = [
      {
        bankName: 'مصرف الراجحي',
        nameEn: 'Al Rajhi Bank',
        accountName: 'شركة البريمي للسيارات',
        accountNumber: '575608010000904',
        iban: 'SA8080000575608010000904',
        type: 'شركة' as const,
        isActive: true,
        logo: '/rajhi.png'
      },
      {
        bankName: 'البنك الأهلي السعودي',
        nameEn: 'Saudi National Bank',
        accountName: 'شركة البريمي للسيارات',
        accountNumber: '25268400000102',
        iban: 'SA5110000025268400000102',
        type: 'شركة' as const,
        isActive: true,
        logo: '/snb.png'
      }
    ];

    sampleBanks.forEach(bankData => {
      const id = this.currentBankId++;
      const bank: Bank = {
        id,
        ...bankData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.banks.set(id, bank);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "user",
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser: User = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
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

  async createInventoryItem(itemData: InsertInventoryItem): Promise<InventoryItem> {
    const id = this.currentInventoryId++;
    const item: InventoryItem = {
      id,
      ...itemData,
      trimLevel: itemData.trimLevel || null,
      price: itemData.price || null,
      notes: itemData.notes || null,
      detailedSpecifications: itemData.detailedSpecifications || null,
      logo: itemData.logo || null,
      images: itemData.images || [],
      isSold: itemData.isSold || false,
      soldDate: itemData.soldDate || null,
      reservationDate: itemData.reservationDate || null,
      reservedBy: itemData.reservedBy || null,
      reservationNotes: itemData.reservationNotes || null,
      entryDate: itemData.entryDate || new Date(),
      mileage: itemData.mileage || null
    };
    this.inventoryItems.set(id, item);
    return item;
  }

  async updateInventoryItem(id: number, itemData: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const existingItem = this.inventoryItems.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem: InventoryItem = { ...existingItem, ...itemData };
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    return this.inventoryItems.delete(id);
  }

  async clearAllInventoryItems(): Promise<boolean> {
    this.inventoryItems.clear();
    return true;
  }

  async searchInventoryItems(query: string): Promise<InventoryItem[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.inventoryItems.values()).filter(item =>
      item.manufacturer.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery) ||
      (item.trimLevel && item.trimLevel.toLowerCase().includes(lowerQuery)) ||
      item.chassisNumber.toLowerCase().includes(lowerQuery)
    );
  }

  async filterInventoryItems(filters: any): Promise<InventoryItem[]> {
    let items = Array.from(this.inventoryItems.values());
    
    if (filters.category) {
      items = items.filter(item => item.category === filters.category);
    }
    if (filters.status) {
      items = items.filter(item => item.status === filters.status);
    }
    if (filters.year) {
      items = items.filter(item => item.year === filters.year);
    }
    if (filters.manufacturer) {
      items = items.filter(item => item.manufacturer === filters.manufacturer);
    }
    if (filters.importType) {
      items = items.filter(item => item.importType === filters.importType);
    }
    if (filters.location) {
      items = items.filter(item => item.location === filters.location);
    }
    
    return items;
  }

  async getInventoryStats(): Promise<any> {
    const items = Array.from(this.inventoryItems.values());
    const availableItems = items.filter(item => !item.isSold && item.status !== "مباع");
    
    return {
      total: availableItems.length,
      available: availableItems.filter(item => {
        const status = item.status?.trim() || "";
        return status === "متوفر";
      }).length,
      inTransit: availableItems.filter(item => item.status === "في الطريق").length,
      maintenance: availableItems.filter(item => item.status === "في الصيانة").length,
      reserved: availableItems.filter(item => item.status === "محجوز").length,
      sold: items.filter(item => item.isSold || item.status === "مباع").length,
      personal: availableItems.filter(item => {
        const importType = item.importType?.trim() || "";
        return importType === "شخصي" || importType === "شخصيي" || importType === "سخصي";
      }).length,
      company: availableItems.filter(item => {
        const importType = item.importType?.trim() || "";
        return importType === "شركة" || importType === "شركه";
      }).length,
      usedPersonal: availableItems.filter(item => {
        const importType = item.importType?.trim() || "";
        return importType === "مستعمل" || importType.includes("مستعمل");
      }).length
    };
  }

  async getManufacturerStats(): Promise<any[]> {
    const items = Array.from(this.inventoryItems.values());
    const manufacturers = [...new Set(items.map(item => item.manufacturer))];
    
    return manufacturers.map(manufacturer => {
      const manufacturerItems = items.filter(item => item.manufacturer === manufacturer);
      return {
        manufacturer,
        total: manufacturerItems.length,
        personal: manufacturerItems.filter(item => {
          const importType = item.importType?.trim() || "";
          return importType === "شخصي" || importType === "شخصيي" || importType === "سخصي";
        }).length,
        company: manufacturerItems.filter(item => {
          const importType = item.importType?.trim() || "";
          return importType === "شركة" || importType === "شركه";
        }).length,
        usedPersonal: manufacturerItems.filter(item => {
          const importType = item.importType?.trim() || "";
          return importType === "مستعمل" || importType.includes("مستعمل");
        }).length,
        logo: null
      };
    });
  }

  async getLocationStats(): Promise<any[]> {
    return [];
  }

  async getReservedItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values()).filter(item => item.status === "محجوز");
  }

  async getSoldItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values()).filter(item => 
      item.isSold === true || item.status === "مباع"
    );
  }

  async transferItem(id: number, newLocation: string, reason?: string, transferredBy?: string): Promise<boolean> {
    const item = this.inventoryItems.get(id);
    if (!item) return false;
    
    item.location = newLocation;
    this.inventoryItems.set(id, item);
    return true;
  }

  // Bank methods
  async getAllBanks(): Promise<Bank[]> {
    return Array.from(this.banks.values());
  }

  async getBank(id: number): Promise<Bank | undefined> {
    return this.banks.get(id);
  }

  async getBanksByType(type: "شخصي" | "شركة"): Promise<Bank[]> {
    return Array.from(this.banks.values()).filter(bank => bank.type === type && bank.isActive);
  }

  async createBank(bankData: InsertBank): Promise<Bank> {
    const id = this.currentBankId++;
    const bank: Bank = {
      id,
      ...bankData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.banks.set(id, bank);
    return bank;
  }

  async updateBank(id: number, bankData: Partial<InsertBank>): Promise<Bank | undefined> {
    const existingBank = this.banks.get(id);
    if (!existingBank) return undefined;

    const updatedBank: Bank = {
      ...existingBank,
      ...bankData,
      updatedAt: new Date(),
    };
    this.banks.set(id, updatedBank);
    return updatedBank;
  }

  async deleteBank(id: number): Promise<boolean> {
    return this.banks.delete(id);
  }

  // Placeholder methods for other interfaces
  async getAllLocations(): Promise<Location[]> { return []; }
  async getLocation(id: number): Promise<Location | undefined> { return undefined; }
  async createLocation(location: InsertLocation): Promise<Location> { throw new Error("Not implemented"); }
  async updateLocation(id: number, location: Partial<InsertLocation>): Promise<Location | undefined> { return undefined; }
  async deleteLocation(id: number): Promise<boolean> { return false; }
  
  async getAllLocationTransfers(): Promise<LocationTransfer[]> { return []; }
  async getLocationTransfer(id: number): Promise<LocationTransfer | undefined> { return undefined; }
  async createLocationTransfer(transfer: InsertLocationTransfer): Promise<LocationTransfer> { throw new Error("Not implemented"); }
  async updateLocationTransfer(id: number, transfer: Partial<InsertLocationTransfer>): Promise<LocationTransfer | undefined> { return undefined; }
  async deleteLocationTransfer(id: number): Promise<boolean> { return false; }
  async getLocationTransfersByItem(itemId: number): Promise<LocationTransfer[]> { return []; }
  
  async getAllManufacturers(): Promise<Manufacturer[]> { return []; }
  async getManufacturer(id: number): Promise<Manufacturer | undefined> { return undefined; }
  async createManufacturer(manufacturer: InsertManufacturer): Promise<Manufacturer> { throw new Error("Not implemented"); }
  async updateManufacturer(id: number, manufacturer: Partial<InsertManufacturer>): Promise<Manufacturer | undefined> { return undefined; }
  async deleteManufacturer(id: number): Promise<boolean> { return false; }
  async getManufacturerByName(name: string): Promise<Manufacturer | undefined> { return undefined; }
  
  async getAppearanceSettings(): Promise<AppearanceSettings | undefined> { return this.appearanceSettings; }
  async updateAppearanceSettings(settings: InsertAppearanceSettings): Promise<AppearanceSettings> {
    const appearance: AppearanceSettings = {
      id: 1,
      ...settings,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.appearanceSettings = appearance;
    return appearance;
  }
  

  
  async getAllTrimLevels(): Promise<TrimLevel[]> { return []; }
  async getTrimLevel(id: number): Promise<TrimLevel | undefined> { return undefined; }
  async createTrimLevel(trimLevel: InsertTrimLevel): Promise<TrimLevel> { throw new Error("Not implemented"); }
  async updateTrimLevel(id: number, trimLevel: Partial<InsertTrimLevel>): Promise<TrimLevel | undefined> { return undefined; }
  async deleteTrimLevel(id: number): Promise<boolean> { return false; }
  async getTrimLevelsByCategory(manufacturer: string, category: string): Promise<TrimLevel[]> { return []; }
  
  async getAllCategories(): Promise<{ category: string }[]> { return []; }
  async getCategoriesByManufacturer(manufacturer: string): Promise<{ category: string }[]> { return []; }
  async getAllEngineCapacities(): Promise<{ engineCapacity: string }[]> { return []; }
  
  async getAllQuotations(): Promise<Quotation[]> { return []; }
  async getQuotation(id: number): Promise<Quotation | undefined> { return undefined; }
  async createQuotation(quotation: InsertQuotation): Promise<Quotation> { throw new Error("Not implemented"); }
  async updateQuotation(id: number, quotation: Partial<InsertQuotation>): Promise<Quotation | undefined> { return undefined; }
  async deleteQuotation(id: number): Promise<boolean> { return false; }
  async getQuotationsByStatus(status: string): Promise<Quotation[]> { return []; }
  async getQuotationByNumber(quoteNumber: string): Promise<Quotation | undefined> { return undefined; }
  
  async getAllTermsConditions(): Promise<Array<{ id: number; term_text: string; display_order: number }>> {
    return this.storedTermsConditions;
  }
  
  async updateTermsConditions(terms: Array<{ id: number; term_text: string; display_order: number }>): Promise<void> {
    this.storedTermsConditions = terms;
  }
  
  async createInvoice(invoice: any): Promise<any> { return invoice; }
  async getInvoices(): Promise<any[]> { return []; }
  async getInvoiceById(id: number): Promise<any | undefined> { return undefined; }
  async updateInvoice(id: number, invoice: any): Promise<any> { return invoice; }
  async deleteInvoice(id: number): Promise<boolean> { return false; }
  async getInvoicesByStatus(status: string): Promise<any[]> { return []; }
  async getInvoiceByNumber(invoiceNumber: string): Promise<any | undefined> { return undefined; }
  
  async getSystemSettings(): Promise<Array<{key: string, value: string}>> { 
    return Array.from(this.systemSettings.entries()).map(([key, value]) => ({ key, value }));
  }
  
  async updateSystemSetting(key: string, value: string): Promise<{key: string, value: string}> {
    this.systemSettings.set(key, value);
    return { key, value };
  }
  
  async getDefaultCompanyId(): Promise<number | null> { return 1; }
  
  async getAllFinancingCalculations(): Promise<FinancingCalculation[]> { return []; }
  async getFinancingCalculation(id: number): Promise<FinancingCalculation | undefined> { return undefined; }
  async createFinancingCalculation(calculation: InsertFinancingCalculation): Promise<FinancingCalculation> { throw new Error("Not implemented"); }
  async updateFinancingCalculation(id: number, calculation: Partial<InsertFinancingCalculation>): Promise<FinancingCalculation | undefined> { return undefined; }
  async deleteFinancingCalculation(id: number): Promise<boolean> { return false; }
  
  async getAllLeaveRequests(): Promise<LeaveRequest[]> { return []; }
  async getLeaveRequestById(id: number): Promise<LeaveRequest | undefined> { return undefined; }
  async createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest> { throw new Error("Not implemented"); }
  async updateLeaveRequestStatus(id: number, status: string, approvedBy?: number, approvedByName?: string, rejectionReason?: string): Promise<LeaveRequest | undefined> { return undefined; }
  async deleteLeaveRequest(id: number): Promise<boolean> { return false; }
}