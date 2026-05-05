import { pgTable, text, serial, integer, timestamp, boolean, decimal, varchar, jsonb } from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // الاسم
  jobTitle: text("job_title").notNull(), // الوظيفة
  phoneNumber: text("phone_number").notNull(), // رقم الجوال
  username: text("username").notNull().unique(), // اسم المستخدم
  password: text("password").notNull(), // كلمة المرور
  role: text("role").notNull().default("seller"), // الصلاحيات: 'admin', 'accountant', 'salesperson', 'inventory_manager', 'bank_accountant', 'sales_director'
  bankId: integer("bank_id"), // معرف البنك (لمناديب البنوك فقط)
  createdAt: timestamp("created_at").defaultNow().notNull(), // تاريخ الإنشاء
});

export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  manufacturer: text("manufacturer").notNull(), // الصانع (مرسيدس، بي ام دبليو، اودي)
  category: text("category").notNull(), // الفئة (E200, C200, C300, X5, A4)
  trimLevel: text("trim_level"), // درجة التجهيز (فل كامل، ستاندرد، خاص)
  engineCapacity: text("engine_capacity").notNull(), // سعة المحرك
  year: integer("year").notNull(), // السنة
  exteriorColor: text("exterior_color").notNull(), // اللون الخارجي
  interiorColor: text("interior_color").notNull(), // اللون الداخلي
  status: text("status").notNull(), // الحالة
  importType: text("import_type").notNull(), // الاستيراد (شخصي/شركة/مستعمل شخصي)
  ownershipType: text("ownership_type").notNull().default("ملك الشركة"), // نوع الملكية (ملك الشركة/وسيط)
  location: text("location").notNull(), // الموقع (المستودع الرئيسي، المعرض، الورشة، الميناء)
  chassisNumber: text("chassis_number").notNull().unique(), // رقم الهيكل
  images: text("images").array().default([]), // الصور
  logo: text("logo"), // اللوجو
  notes: text("notes"), // الملاحظات
  detailedSpecifications: text("detailed_specifications"), // المواصفات التفصيلية الخاصة بهذه السيارة
  entryDate: timestamp("entry_date").defaultNow().notNull(), // تاريخ الدخول
  price: decimal("price", { precision: 10, scale: 2 }), // السعر
  isSold: boolean("is_sold").default(false).notNull(), // مباع
  soldDate: timestamp("sold_date"), // تاريخ البيع
  reservationDate: timestamp("reservation_date"), // تاريخ الحجز
  reservedBy: text("reserved_by"), // المستخدم الذي حجز
  salesRepresentative: text("sales_representative"), // مندوب المبيعات
  reservationNote: text("reservation_note"), // ملاحظة الحجز
  customerName: text("customer_name"), // اسم العميل
  customerPhone: text("customer_phone"), // رقم جوال العميل
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }), // المبلغ المدفوع
  // Sale information fields
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }), // سعر البيع
  paymentMethod: text("payment_method"), // طريقة الدفع (نقداً/بنك)
  bankName: text("bank_name"), // اسم البنك
  soldToCustomerName: text("sold_to_customer_name"), // اسم العميل المشتري
  soldToCustomerPhone: text("sold_to_customer_phone"), // رقم جوال العميل المشتري
  soldBySalesRep: text("sold_by_sales_rep"), // مندوب المبيعات الذي قام بالبيع
  saleNotes: text("sale_notes"), // ملاحظات البيع
  mileage: integer("mileage"), // ممشي السيارة بالكيلومتر (للسيارات المستعملة فقط)
});

// Banks table for storing bank information
export const banks = pgTable("banks", {
  id: serial("id").primaryKey(),
  logo: text("logo"), // شعار البنك (Base64 أو URL)
  bankName: text("bank_name").notNull(), // اسم البنك
  nameEn: text("name_en"), // الاسم الإنجليزي
  accountName: text("account_name").notNull(), // اسم الحساب
  accountNumber: text("account_number").notNull(), // رقم الحساب
  iban: text("iban").notNull(), // رقم الآيبان
  type: text("type").notNull(), // النوع: "شخصي" أو "شركة"
  isActive: boolean("is_active").default(true).notNull(), // نشط
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Bank Interest Rates table - for financing calculator
export const bankInterestRates = pgTable("bank_interest_rates", {
  id: serial("id").primaryKey(),
  bankId: integer("bank_id").references(() => banks.id).notNull(), // معرف البنك
  categoryName: text("category_name").notNull(), // اسم الفئة (موظف حكومي، موظف قطاع خاص، إلخ)
  financingType: text("financing_type").notNull().default("installments"), // "installments", "50-50", "40-60"
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(), // نسبة الفائدة
  years: integer("years").notNull(), // عدد السنوات
  isActive: boolean("is_active").default(true).notNull(), // نشط
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Manufacturers table for storing manufacturer information
export const manufacturers = pgTable("manufacturers", {
  id: serial("id").primaryKey(),
  nameAr: text("name_ar").notNull(), // الاسم العربي
  nameEn: text("name_en"), // الاسم الإنجليزي (اختياري)
  logo: text("logo"), // الشعار
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Vehicle Categories table (models)
export const vehicleCategories = pgTable("vehicle_categories", {
  id: serial("id").primaryKey(),
  manufacturerId: integer("manufacturer_id").references(() => manufacturers.id).notNull(),
  nameAr: text("name_ar").notNull(), // الاسم العربي للفئة
  nameEn: text("name_en").notNull(), // الاسم الإنجليزي للفئة
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Vehicle Trim Levels table
export const vehicleTrimLevels = pgTable("vehicle_trim_levels", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => vehicleCategories.id).notNull(),
  nameAr: text("name_ar").notNull(), // الاسم العربي لدرجة التجهيز
  nameEn: text("name_en").notNull(), // الاسم الإنجليزي لدرجة التجهيز
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Color Associations table for linking colors to manufacturer/category/trim
export const colorAssociations = pgTable("color_associations", {
  id: serial("id").primaryKey(),
  manufacturer: text("manufacturer").notNull(), // الشركة المصنعة
  category: text("category"), // الفئة (اختياري)
  trimLevel: text("trim_level"), // درجة التجهيز (اختياري)
  colorType: text("color_type").notNull(), // نوع اللون: "exterior" أو "interior"
  colorName: text("color_name").notNull(), // اسم اللون
  colorCode: text("color_code"), // كود اللون (hex أو أي نوع آخر)
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Vehicle Specifications table for detailed specifications
export const vehicleSpecifications = pgTable("vehicle_specifications", {
  id: serial("id").primaryKey(),
  manufacturer: text("manufacturer"), // الصانع
  category: text("category"), // الفئة
  trimLevel: text("trim_level"), // درجة التجهيز
  year: integer("year"), // السنة
  engineCapacity: text("engine_capacity"), // سعة المحرك
  chassisNumber: text("chassis_number"), // رقم الهيكل (اختياري لربط مواصفة بسيارة محددة)
  specifications: text("specifications"), // المواصفات التفصيلية (عربي)
  specificationsEn: text("specifications_en"), // المواصفات التفصيلية (إنجليزي)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Vehicle Image Links table for linking images to vehicle hierarchy
export const vehicleImageLinks = pgTable("vehicle_image_links", {
  id: serial("id").primaryKey(),
  manufacturer: text("manufacturer"), // الصانع
  category: text("category"), // الفئة
  trimLevel: text("trim_level"), // درجة التجهيز
  year: integer("year"), // السنة
  engineCapacity: text("engine_capacity"), // سعة المحرك
  exteriorColor: text("exterior_color"), // اللون الخارجي
  interiorColor: text("interior_color"), // اللون الداخلي
  chassisNumber: text("chassis_number"), // رقم الهيكل (اختياري لربط رابط بسيارة محددة)
  imageUrl: text("image_url").notNull(), // رابط الصورة (واحد)
  description: text("description"), // وصف الصورة (عربي)
  descriptionEn: text("description_en"), // وصف الصورة (إنجليزي)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Companies table for quotation management
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // اسم الشركة
  logo: text("logo"), // شعار الشركة (Base64)
  registrationNumber: text("registration_number").notNull(), // رقم السجل التجاري
  licenseNumber: text("license_number").notNull(), // رقم الرخصة
  taxNumber: text("tax_number").notNull(), // الرقم الضريبي
  address: text("address").notNull(), // العنوان
  phone: text("phone"), // الهاتف
  email: text("email").notNull(), // البريد الإلكتروني
  website: text("website"), // الموقع الإلكتروني
  primaryColor: text("primary_color").default("#00627F").notNull(), // اللون الأساسي
  secondaryColor: text("secondary_color").default("#BF9231").notNull(), // اللون الثانوي
  accentColor: text("accent_color").default("#0891b2").notNull(), // لون التمييز
  isActive: boolean("is_active").default(true).notNull(), // نشط
  
  // PDF Design Configuration
  pdfTemplate: text("pdf_template").default("classic").notNull(), // classic, modern, elegant
  pdfHeaderStyle: text("pdf_header_style").default("standard").notNull(), // standard, minimal, bold
  pdfLogoPosition: text("pdf_logo_position").default("left").notNull(), // left, center, right
  pdfLogoSize: text("pdf_logo_size").default("medium").notNull(), // small, medium, large
  pdfFontFamily: text("pdf_font_family").default("Noto Sans Arabic").notNull(),
  pdfFontSize: integer("pdf_font_size").default(12).notNull(),
  pdfLineHeight: text("pdf_line_height").default("1.5").notNull(),
  pdfMarginTop: integer("pdf_margin_top").default(20).notNull(),
  pdfMarginBottom: integer("pdf_margin_bottom").default(20).notNull(),
  pdfMarginLeft: integer("pdf_margin_left").default(20).notNull(),
  pdfMarginRight: integer("pdf_margin_right").default(20).notNull(),
  
  // PDF Colors
  pdfHeaderBgColor: text("pdf_header_bg_color").default("#ffffff").notNull(),
  pdfHeaderTextColor: text("pdf_header_text_color").default("#000000").notNull(),
  pdfTableHeaderBg: text("pdf_table_header_bg").default("#f8f9fa").notNull(),
  pdfTableHeaderText: text("pdf_table_header_text").default("#000000").notNull(),
  pdfTableBorderColor: text("pdf_table_border_color").default("#dee2e6").notNull(),
  pdfAccentColor: text("pdf_accent_color").default("#0891b2").notNull(),
  
  // PDF Layout Options
  pdfShowWatermark: boolean("pdf_show_watermark").default(false).notNull(),
  pdfWatermarkText: text("pdf_watermark_text"),
  pdfShowQrCode: boolean("pdf_show_qr_code").default(true).notNull(),
  pdfQrPosition: text("pdf_qr_position").default("top-right").notNull(), // top-left, top-right, bottom-left, bottom-right
  pdfFooterText: text("pdf_footer_text"),
  pdfShowPageNumbers: boolean("pdf_show_page_numbers").default(true).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Locations table for managing inventory locations
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // اسم الموقع
  description: text("description"), // الوصف
  address: text("address"), // العنوان
  manager: text("manager"), // المسؤول
  phone: text("phone"), // الهاتف
  capacity: integer("capacity"), // السعة القصوى
  isActive: boolean("is_active").default(true).notNull(), // نشط
  createdAt: timestamp("created_at").defaultNow(),
});

// Location transfers table for tracking item movements
export const locationTransfers = pgTable("location_transfers", {
  id: serial("id").primaryKey(),
  inventoryItemId: integer("inventory_item_id").notNull(),
  fromLocation: text("from_location").notNull(), // الموقع السابق
  toLocation: text("to_location").notNull(), // الموقع الجديد
  transferDate: timestamp("transfer_date").defaultNow().notNull(), // تاريخ النقل
  reason: text("reason"), // السبب
  transferredBy: text("transferred_by"), // المنقول بواسطة
  notes: text("notes"), // ملاحظات
});



// Trim levels table for managing trim levels per manufacturer and category
export const trimLevels = pgTable("trim_levels", {
  id: serial("id").primaryKey(),
  manufacturer: text("manufacturer").notNull(), // الصانع
  category: text("category").notNull(), // الفئة
  trimLevel: text("trim_level").notNull(), // درجة التجهيز
  description: text("description"), // وصف درجة التجهيز
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Terms and Conditions table for storing terms text
export const termsConditions = pgTable("terms_conditions", {
  id: serial("id").primaryKey(),
  termText: text("term_text").notNull(), // نص الشرط
  displayOrder: integer("display_order").default(1).notNull(), // ترتيب العرض
  isActive: boolean("is_active").default(true).notNull(), // نشط
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Quotations table for managing price quotes
export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  quoteNumber: text("quote_number").notNull().unique(), // رقم العرض
  inventoryItemId: integer("inventory_item_id").notNull(), // معرف المركبة
  manufacturer: text("manufacturer").notNull(), // الصانع
  category: text("category").notNull(), // الفئة
  trimLevel: text("trim_level"), // درجة التجهيز
  year: integer("year").notNull(), // الموديل
  exteriorColor: text("exterior_color").notNull(), // اللون الخارجي
  interiorColor: text("interior_color").notNull(), // اللون الداخلي
  chassisNumber: text("chassis_number").notNull(), // رقم الهيكل
  engineCapacity: text("engine_capacity").notNull(), // سعة المحرك
  specifications: text("specifications"), // المواصفات التفصيلية
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(), // السعر الأساسي
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }).notNull(), // السعر النهائي
  customerName: text("customer_name").notNull(), // اسم العميل
  customerPhone: text("customer_phone"), // هاتف العميل
  customerEmail: text("customer_email"), // بريد العميل
  customerTitle: text("customer_title"), // كنية العميل (السادة، السيد، السيدة، الشيخ، سمو الأمير)
  notes: text("notes"), // ملاحظات
  validUntil: timestamp("valid_until").default(sql`NOW() + INTERVAL '30 days'`), // صالح حتى
  status: text("status").notNull().default("مسودة"), // الحالة (مسودة، مرسل، مقبول، مرفوض)
  createdBy: text("created_by").notNull(), // المُنشئ
  companyData: text("company_data"), // بيانات الشركة
  representativeData: text("representative_data"), // بيانات المندوب
  quoteAppearance: text("quote_appearance"), // مظهر العرض
  pricingDetails: text("pricing_details"), // تفاصيل التسعير
  multiItems: text("multi_items"), // قائمة السيارات المتعددة (JSON)
  qrCodeData: text("qr_code_data"), // بيانات رمز QR
  createdAt: timestamp("created_at").defaultNow().notNull(), // تاريخ الإنشاء
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // تاريخ التحديث
});

// Invoices table for managing sales invoices
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(), // رقم الفاتورة
  quotationId: integer("quotation_id").references(() => quotations.id), // معرف العرض المرجعي
  quoteNumber: text("quote_number"), // رقم العرض المرجعي
  inventoryItemId: integer("inventory_item_id").notNull(), // معرف المركبة
  manufacturer: text("manufacturer").notNull(), // الصانع
  category: text("category").notNull(), // الفئة
  trimLevel: text("trim_level"), // درجة التجهيز
  year: integer("year").notNull(), // الموديل
  exteriorColor: text("exterior_color").notNull(), // اللون الخارجي
  interiorColor: text("interior_color").notNull(), // اللون الداخلي
  chassisNumber: text("chassis_number").notNull(), // رقم الهيكل
  engineCapacity: text("engine_capacity").notNull(), // سعة المحرك
  specifications: text("specifications"), // المواصفات التفصيلية
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(), // السعر الأساسي
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }).notNull(), // السعر النهائي
  customerName: text("customer_name").notNull(), // اسم العميل
  customerPhone: text("customer_phone"), // هاتف العميل
  customerEmail: text("customer_email"), // بريد العميل
  notes: text("notes"), // ملاحظات
  status: text("status").notNull().default("مسودة"), // الحالة (مسودة، مرسل، مدفوع، ملغى)
  paymentStatus: text("payment_status").notNull().default("غير مدفوع"), // حالة الدفع (غير مدفوع، مدفوع جزئي، مدفوع كامل)
  paymentMethod: text("payment_method"), // طريقة الدفع (نقدي، تحويل، شيك، بطاقة)
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default('0'), // المبلغ المدفوع
  remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }), // المبلغ المتبقي
  dueDate: timestamp("due_date"), // تاريخ الاستحقاق
  createdBy: text("created_by").notNull(), // المُنشئ
  companyData: text("company_data"), // بيانات الشركة
  representativeData: text("representative_data"), // بيانات المندوب
  pricingDetails: text("pricing_details"), // تفاصيل التسعير
  qrCodeData: text("qr_code_data"), // بيانات رمز QR
  authorizationNumber: text("authorization_number"), // رقم التخويل
  createdAt: timestamp("created_at").defaultNow().notNull(), // تاريخ الإنشاء
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // تاريخ التحديث
});

// PDF Appearance Settings table for managing PDF quote appearance
export const pdfAppearanceSettings = pgTable("pdf_appearance_settings", {
  id: serial("id").primaryKey(),
  
  // Header Colors
  headerBackgroundColor: text("header_background_color").default("#0f766e").notNull(),
  headerTextColor: text("header_text_color").default("#ffffff").notNull(),
  logoBackgroundColor: text("logo_background_color").default("#ffffff").notNull(),
  
  // Table Colors
  tableHeaderBackgroundColor: text("table_header_background_color").default("#f8fafc").notNull(),
  tableHeaderTextColor: text("table_header_text_color").default("#1e293b").notNull(),
  tableRowBackgroundColor: text("table_row_background_color").default("#ffffff").notNull(),
  tableRowTextColor: text("table_row_text_color").default("#1e293b").notNull(),
  tableAlternateRowBackgroundColor: text("table_alternate_row_background_color").default("#f8fafc").notNull(),
  tableBorderColor: text("table_border_color").default("#e2e8f0").notNull(),
  
  // Text Colors
  primaryTextColor: text("primary_text_color").default("#1e293b").notNull(),
  secondaryTextColor: text("secondary_text_color").default("#64748b").notNull(),
  priceTextColor: text("price_text_color").default("#059669").notNull(),
  totalTextColor: text("total_text_color").default("#dc2626").notNull(),
  
  // Border and Background Colors
  borderColor: text("border_color").default("#e2e8f0").notNull(),
  backgroundColor: text("background_color").default("#ffffff").notNull(),
  sectionBackgroundColor: text("section_background_color").default("#f8fafc").notNull(),
  
  // Company Logo and Stamp
  companyStamp: text("company_stamp"), // Base64 encoded stamp
  watermarkOpacity: decimal("watermark_opacity", { precision: 3, scale: 2 }).default('0.10').notNull(),
  
  // Footer Colors
  footerBackgroundColor: text("footer_background_color").default("#f8fafc").notNull(),
  footerTextColor: text("footer_text_color").default("#64748b").notNull(),
  
  // QR Code Settings
  qrCodeBackgroundColor: text("qr_code_background_color").default("#ffffff").notNull(),
  qrCodeForegroundColor: text("qr_code_foreground_color").default("#000000").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  jobTitle: true,
  phoneNumber: true,
  username: true,
  password: true,
  role: true,
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  entryDate: true,
}).extend({
  manufacturer: z.string().min(1, "الصانع مطلوب"),
  category: z.string().min(1, "الفئة مطلوبة"),
  engineCapacity: z.string().min(1, "الموديل مطلوب"),
  chassisNumber: z.string().min(1, "رقم الهيكل مطلوب"),
  exteriorColor: z.string().min(1, "اللون الخارجي مطلوب"),
  interiorColor: z.string().min(1, "اللون الداخلي مطلوب"),
  status: z.string().min(1, "الحالة مطلوبة"),
  importType: z.string().min(1, "نوع الاستيراد مطلوب"),
  ownershipType: z.string().min(1, "نوع الملكية مطلوب"),
  location: z.string().min(1, "الموقع مطلوب"),
  year: z.number().min(1900, "السنة غير صحيحة").max(2030, "السنة غير صحيحة"),
  detailedSpecifications: z.string().optional(),
  soldDate: z.date().nullable().optional(),
  reservationDate: z.date().nullable().optional(),
  reservedBy: z.string().optional(),
  reservationNote: z.string().optional(),
  mileage: z.number().min(0, "يجب أن يكون الممشي رقم غير سالب").optional(),
  price: z.string().optional(),
  notes: z.string().optional(),
  images: z.array(z.string()).optional().default([]),
  isSold: z.boolean().optional().default(false),
});

export const insertBankSchema = createInsertSchema(banks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBankInterestRateSchema = createInsertSchema(bankInterestRates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertManufacturerSchema = createInsertSchema(manufacturers).omit({
  id: true,
  createdAt: true,
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
});

export const insertLocationTransferSchema = createInsertSchema(locationTransfers).omit({
  id: true,
  transferDate: true,
});



export const insertTrimLevelSchema = createInsertSchema(trimLevels).omit({
  id: true,
  createdAt: true,
});

export const insertSpecificationSchema = createInsertSchema(trimLevels).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Price Cards table for managing price cards
export const priceCards = pgTable("price_cards", {
  id: serial("id").primaryKey(),
  inventoryItemId: integer("inventory_item_id").references(() => inventoryItems.id).notNull(),
  manufacturer: text("manufacturer").notNull(), // الصانع
  category: text("category").notNull(), // الفئة
  trimLevel: text("trim_level"), // درجة التجهيز
  model: text("model"), // الموديل
  year: integer("year").notNull(), // السنة
  price: decimal("price", { precision: 10, scale: 2 }), // السعر
  features: text("features").array().default([]), // المميزات
  status: text("status").notNull().default("نشط"), // الحالة
  isActive: boolean("is_active").default(true).notNull(),
  backgroundImage: text("background_image"), // صورة الخلفية المخصصة (Base64 أو URL)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPriceCardSchema = createInsertSchema(priceCards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PriceCard = typeof priceCards.$inferSelect;
export type InsertPriceCard = z.infer<typeof insertPriceCardSchema>;

// Vehicle Specifications schemas
export const insertVehicleSpecificationSchema = createInsertSchema(vehicleSpecifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type VehicleSpecification = typeof vehicleSpecifications.$inferSelect;
export type InsertVehicleSpecification = z.infer<typeof insertVehicleSpecificationSchema>;

// Vehicle Image Links schemas
export const insertVehicleImageLinkSchema = createInsertSchema(vehicleImageLinks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type VehicleImageLink = typeof vehicleImageLinks.$inferSelect;
export type InsertVehicleImageLink = z.infer<typeof insertVehicleImageLinkSchema>;

// Terms and conditions table
export const termsAndConditions = pgTable("terms_and_conditions", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  content: text("content").notNull(), // محتوى الشروط والأحكام
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "اسم الشركة مطلوب"),
  registrationNumber: z.string().min(1, "رقم السجل مطلوب"),
  licenseNumber: z.string().min(1, "رقم الرخصة مطلوب"),
  taxNumber: z.string().min(1, "الرقم الضريبي مطلوب"),
  address: z.string().min(1, "العنوان مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
});

export const insertTermsSchema = createInsertSchema(termsAndConditions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPdfAppearanceSchema = createInsertSchema(pdfAppearanceSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuotationSchema = createInsertSchema(quotations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  customerName: z.string().optional().default("غير محدد"),
  basePrice: z.string().optional().default("0"),
  finalPrice: z.string().optional().default("0"),
  validUntil: z.union([z.string(), z.date()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }).optional().default(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    return defaultDate;
  }),
});



// User sessions table for tracking login/logout times
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  loginTime: timestamp("login_time").defaultNow().notNull(),
  logoutTime: timestamp("logout_time"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true).notNull(),
});

// Activity logs table for tracking user actions
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(), // 'add', 'edit', 'delete', 'sell'
  entityType: text("entity_type").notNull(), // 'inventory', 'user', 'manufacturer'
  entityId: integer("entity_id"),
  details: text("details"), // JSON string with action details
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  loginTime: true,
  isActive: true,
});

// Image links table for linking images to vehicle specifications
export const imageLinks = pgTable("image_links", {
  id: serial("id").primaryKey(),
  manufacturer: text("manufacturer").notNull(), // الصانع
  category: text("category").notNull(), // الفئة
  trimLevel: text("trim_level"), // درجة التجهيز
  year: integer("year").notNull(), // السنة
  exteriorColor: text("exterior_color").notNull(), // اللون الخارجي
  interiorColor: text("interior_color").notNull(), // اللون الداخلي
  engineCapacity: text("engine_capacity"), // سعة المحرك
  chassisNumber: text("chassis_number"), // رقم الهيكل (اختياري لربط الصورة بسيارة معينة)
  imageUrl: text("image_url").notNull(), // رابط الصورة
  description: text("description"), // وصف الصورة
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertImageLinkSchema = createInsertSchema(imageLinks).omit({
  id: true,
  createdAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InsertBank = z.infer<typeof insertBankSchema>;
export type Bank = typeof banks.$inferSelect;
export type InsertBankInterestRate = z.infer<typeof insertBankInterestRateSchema>;
export type BankInterestRate = typeof bankInterestRates.$inferSelect;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertManufacturer = z.infer<typeof insertManufacturerSchema>;
export type Manufacturer = typeof manufacturers.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertLocationTransfer = z.infer<typeof insertLocationTransferSchema>;
export type LocationTransfer = typeof locationTransfers.$inferSelect;

export type InsertTrimLevel = z.infer<typeof insertTrimLevelSchema>;
export type TrimLevel = typeof trimLevels.$inferSelect;
export type Specification = typeof vehicleSpecifications.$inferSelect;
export type InsertSpecification = typeof insertVehicleSpecificationSchema;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

export type InsertImageLink = z.infer<typeof insertImageLinkSchema>;
export type ImageLink = typeof imageLinks.$inferSelect;

export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type Quotation = typeof quotations.$inferSelect;

// Low stock alerts table
export const lowStockAlerts = pgTable("low_stock_alerts", {
  id: serial("id").primaryKey(),
  manufacturer: text("manufacturer").notNull(),
  category: text("category").notNull(),
  currentStock: integer("current_stock").notNull(),
  minStockLevel: integer("min_stock_level").default(5).notNull(),
  alertLevel: text("alert_level").notNull(), // "low", "critical", "out_of_stock"
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Import types table for managing import types
export const importTypes = pgTable("import_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Vehicle statuses table for managing status options
export const vehicleStatuses = pgTable("vehicle_statuses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color").default("#6b7280"), // Default gray color
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ownership types table for managing ownership options
export const ownershipTypes = pgTable("ownership_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for new tables
export const insertImportTypeSchema = createInsertSchema(importTypes).omit({
  id: true,
  createdAt: true,
});

export const insertVehicleStatusSchema = createInsertSchema(vehicleStatuses).omit({
  id: true,
  createdAt: true,
});

export const insertOwnershipTypeSchema = createInsertSchema(ownershipTypes).omit({
  id: true,
  createdAt: true,
});

// Vehicle Locations table for managing location options
export const vehicleLocations = pgTable("vehicle_locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Vehicle Years table for managing year options
export const vehicleYears = pgTable("vehicle_years", {
  id: serial("id").primaryKey(),
  year: integer("year").notNull().unique(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Engine Capacities table for managing engine capacity options
export const engineCapacities = pgTable("engine_capacities", {
  id: serial("id").primaryKey(),
  capacity: text("capacity").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Vehicle Colors table for managing color options
export const vehicleColors = pgTable("vehicle_colors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  colorType: text("color_type").notNull(), // 'exterior' or 'interior'
  colorCode: text("color_code"), // hex code
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for new tables
export const insertVehicleLocationSchema = createInsertSchema(vehicleLocations).omit({
  id: true,
  createdAt: true,
});

export const insertVehicleYearSchema = createInsertSchema(vehicleYears).omit({
  id: true,
  createdAt: true,
});

export const insertEngineCapacitySchema = createInsertSchema(engineCapacities).omit({
  id: true,
  createdAt: true,
});

export const insertVehicleColorSchema = createInsertSchema(vehicleColors).omit({
  id: true,
  createdAt: true,
});

// Additional types
export type InsertImportType = z.infer<typeof insertImportTypeSchema>;
export type ImportType = typeof importTypes.$inferSelect;
export type InsertVehicleStatus = z.infer<typeof insertVehicleStatusSchema>;
export type VehicleStatus = typeof vehicleStatuses.$inferSelect;
export type InsertOwnershipType = z.infer<typeof insertOwnershipTypeSchema>;
export type OwnershipType = typeof ownershipTypes.$inferSelect;
export type InsertVehicleLocation = z.infer<typeof insertVehicleLocationSchema>;
export type VehicleLocation = typeof vehicleLocations.$inferSelect;
export type InsertVehicleYear = z.infer<typeof insertVehicleYearSchema>;
export type VehicleYear = typeof vehicleYears.$inferSelect;
export type InsertEngineCapacity = z.infer<typeof insertEngineCapacitySchema>;
export type EngineCapacity = typeof engineCapacities.$inferSelect;
export type InsertVehicleColor = z.infer<typeof insertVehicleColorSchema>;
export type VehicleColor = typeof vehicleColors.$inferSelect;

// Stock level settings table
export const stockSettings = pgTable("stock_settings", {
  id: serial("id").primaryKey(),
  manufacturer: text("manufacturer").notNull(),
  category: text("category").notNull(),
  minStockLevel: integer("min_stock_level").default(5).notNull(),
  lowStockThreshold: integer("low_stock_threshold").default(3).notNull(),
  criticalStockThreshold: integer("critical_stock_threshold").default(1).notNull(),
  autoReorderEnabled: boolean("auto_reorder_enabled").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLowStockAlertSchema = createInsertSchema(lowStockAlerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStockSettingsSchema = createInsertSchema(stockSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type LowStockAlert = typeof lowStockAlerts.$inferSelect;
export type InsertLowStockAlert = z.infer<typeof insertLowStockAlertSchema>;

export type StockSettings = typeof stockSettings.$inferSelect;
export type InsertStockSettings = z.infer<typeof insertStockSettingsSchema>;

// Financing calculations table
export const financingCalculations = pgTable("financing_calculations", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  customerAge: text("customer_age"),
  customerJob: text("customer_job"),
  customerSalary: text("customer_salary"),
  salaryTransferBank: text("salary_transfer_bank"),
  financialCommitment: text("financial_commitment"),
  commitmentType: text("commitment_type"),
  vehiclePrice: decimal("vehicle_price", { precision: 10, scale: 2 }).notNull(),
  downPayment: decimal("down_payment", { precision: 10, scale: 2 }).notNull(),
  downPaymentPercentage: decimal("down_payment_percentage", { precision: 5, scale: 2 }),
  finalPayment: decimal("final_payment", { precision: 10, scale: 2 }).default("0").notNull(),
  finalPaymentPercentage: decimal("final_payment_percentage", { precision: 5, scale: 2 }),
  bankName: text("bank_name").notNull(),
  bankLogo: text("bank_logo"),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(), // Profit margin percentage
  effectiveApr: decimal("effective_apr", { precision: 5, scale: 2 }), // Calculated APR
  financingYears: integer("financing_years").notNull(),
  administrativeFees: decimal("administrative_fees", { precision: 10, scale: 2 }).default("0").notNull(),
  insuranceRate: decimal("insurance_rate", { precision: 5, scale: 2 }).default("5.0").notNull(), // Insurance percentage per year
  monthlyPayment: decimal("monthly_payment", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  totalInterest: decimal("total_interest", { precision: 10, scale: 2 }).notNull(),
  totalInsurance: decimal("total_insurance", { precision: 10, scale: 2 }).notNull(),
  vehicleManufacturer: text("vehicle_manufacturer"),
  vehicleManufacturerLogo: text("vehicle_manufacturer_logo"),
  vehicleCategory: text("vehicle_category"),
  vehicleTrimLevel: text("vehicle_trim_level"),
  vehicleExteriorColor: text("vehicle_exterior_color"),
  vehicleInteriorColor: text("vehicle_interior_color"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFinancingCalculationSchema = createInsertSchema(financingCalculations).omit({
  id: true,
  createdAt: true,
});

export type FinancingCalculation = typeof financingCalculations.$inferSelect;
export type InsertFinancingCalculation = z.infer<typeof insertFinancingCalculationSchema>;

// Leave requests table
export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  userName: text("user_name").notNull(),
  requestType: text("request_type").notNull(), // "إجازة" أو "استئذان"
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  duration: integer("duration").notNull(), // عدد الأيام أو الساعات
  durationType: text("duration_type").notNull(), // "أيام" أو "ساعات"
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "approved", "rejected"
  requestedBy: integer("requested_by").notNull(), // ID of user who created the request
  requestedByName: text("requested_by_name").notNull(),
  approvedBy: integer("approved_by"),
  approvedByName: text("approved_by_name"),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Employee Work Schedules table
export const employeeWorkSchedules = pgTable("employee_work_schedules", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => users.id).notNull(),
  employeeName: text("employee_name").notNull(),
  salary: decimal("salary", { precision: 10, scale: 2 }).notNull(), // راتب الموظف
  scheduleType: text("schedule_type").notNull(), // "متصل" أو "منفصل"
  // للدوام المتصل
  continuousStartTime: text("continuous_start_time"), // وقت الحضور للدوام المتصل
  continuousEndTime: text("continuous_end_time"), // وقت الانصراف للدوام المتصل
  // للدوام المنفصل - الفترة الأولى
  morningStartTime: text("morning_start_time"), // وقت حضور الفترة الصباحية
  morningEndTime: text("morning_end_time"), // وقت انصراف الفترة الصباحية
  // للدوام المنفصل - الفترة الثانية
  eveningStartTime: text("evening_start_time"), // وقت حضور الفترة المسائية
  eveningEndTime: text("evening_end_time"), // وقت انصراف الفترة المسائية
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Daily Attendance table
export const dailyAttendance = pgTable("daily_attendance", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => users.id).notNull(),
  employeeName: text("employee_name").notNull(),
  date: timestamp("date").notNull(), // تاريخ اليوم
  scheduleType: text("schedule_type").notNull(), // "متصل" أو "منفصل"
  
  // للدوام المتصل
  continuousCheckinTime: text("continuous_checkin_time"), // وقت الحضور الفعلي
  continuousCheckoutTime: text("continuous_checkout_time"), // وقت الانصراف الفعلي
  continuousCheckinStatus: text("continuous_checkin_status"), // "في الوقت" أو "متأخر"
  continuousCheckoutStatus: text("continuous_checkout_status"), // "في الوقت" أو "مبكر"
  
  // للدوام المنفصل - الفترة الأولى
  morningCheckinTime: text("morning_checkin_time"), // وقت حضور الفترة الصباحية الفعلي
  morningCheckoutTime: text("morning_checkout_time"), // وقت انصراف الفترة الصباحية الفعلي
  morningCheckinStatus: text("morning_checkin_status"), // "في الوقت" أو "متأخر"
  morningCheckoutStatus: text("morning_checkout_status"), // "في الوقت" أو "مبكر"
  
  // للدوام المنفصل - الفترة الثانية
  eveningCheckinTime: text("evening_checkin_time"), // وقت حضور الفترة المسائية الفعلي
  eveningCheckoutTime: text("evening_checkout_time"), // وقت انصراف الفترة المسائية الفعلي
  eveningCheckinStatus: text("evening_checkin_status"), // "في الوقت" أو "متأخر"
  eveningCheckoutStatus: text("evening_checkout_status"), // "في الوقت" أو "مبكر"
  
  totalHoursWorked: decimal("total_hours_worked", { precision: 4, scale: 2 }), // إجمالي ساعات العمل
  notes: text("notes"), // ملاحظات
  createdBy: integer("created_by").references(() => users.id), // من أنشأ السجل
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.union([z.string(), z.date()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  endDate: z.union([z.string(), z.date(), z.null()]).transform((val) => {
    if (val === null) return null;
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }).nullable().optional(),
});

export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type LeaveRequest = typeof leaveRequests.$inferSelect;

// Employee Work Schedule schemas
export const insertEmployeeWorkScheduleSchema = createInsertSchema(employeeWorkSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmployeeWorkSchedule = z.infer<typeof insertEmployeeWorkScheduleSchema>;
export type EmployeeWorkSchedule = typeof employeeWorkSchedules.$inferSelect;

// Daily Attendance schemas
export const insertDailyAttendanceSchema = createInsertSchema(dailyAttendance).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  employeeName: z.string().min(1, "اسم الموظف مطلوب"),
  date: z.union([z.string(), z.date()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

export type InsertDailyAttendance = z.infer<typeof insertDailyAttendanceSchema>;
export type DailyAttendance = typeof dailyAttendance.$inferSelect;

// Financing Rates table - for bank financing management
export const financingRates = pgTable("financing_rates", {
  id: serial("id").primaryKey(),
  bankName: text("bank_name").notNull(), // اسم البنك (عربي)
  bankNameEn: text("bank_name_en").notNull(), // اسم البنك (إنجليزي)
  bankLogo: text("bank_logo"), // شعار البنك (Base64)
  financingType: text("financing_type").notNull(), // نوع التمويل: "personal" أو "commercial"
  rates: jsonb("rates").notNull().default('[]'), // مصفوفة النسب {rateName: string, rateValue: number}
  minPeriod: integer("min_period").notNull(), // أقل فترة سداد (بالشهور)
  maxPeriod: integer("max_period").notNull(), // أعلى فترة سداد (بالشهور)
  minAmount: decimal("min_amount", { precision: 12, scale: 2 }).notNull(), // أقل مبلغ تمويل
  maxAmount: decimal("max_amount", { precision: 12, scale: 2 }).notNull(), // أعلى مبلغ تمويل
  features: text("features").array().default([]), // المزايا
  requirements: text("requirements").array().default([]), // المتطلبات
  isActive: boolean("is_active").default(true).notNull(), // نشط
  lastUpdated: timestamp("last_updated").defaultNow().notNull(), // آخر تحديث
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFinancingRateSchema = createInsertSchema(financingRates).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  rates: z.array(z.object({
    rateName: z.string().min(1, "اسم النسبة مطلوب"),
    rateValue: z.number().min(0, "قيمة النسبة يجب أن تكون أكبر من صفر").max(100, "قيمة النسبة يجب أن تكون أقل من 100%"),
    financingType: z.enum(["installments", "50-50", "40-60"]).optional().default("installments")
  })).min(1, "يجب إضافة نسبة واحدة على الأقل"),
  minPeriod: z.number().min(1, "الفترة يجب أن تكون أكبر من صفر"),
  maxPeriod: z.number().min(1, "الفترة يجب أن تكون أكبر من صفر"),
  minAmount: z.number().min(0, "المبلغ يجب أن يكون أكبر من صفر"),
  maxAmount: z.number().min(0, "المبلغ يجب أن يكون أكبر من صفر"),
  features: z.array(z.string()).optional().default([]),
  requirements: z.array(z.string()).optional().default([]),
});

export type InsertFinancingRate = z.infer<typeof insertFinancingRateSchema>;
export type FinancingRate = typeof financingRates.$inferSelect;

// Color association schema for validation
export const insertColorAssociationSchema = createInsertSchema(colorAssociations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  manufacturer: z.string().min(1, "الشركة المصنعة مطلوبة"),
  colorType: z.enum(["exterior", "interior"], { errorMap: () => ({ message: "نوع اللون مطلوب" }) }),
  colorName: z.string().min(1, "اسم اللون مطلوب"),
});

export type InsertColorAssociation = z.infer<typeof insertColorAssociationSchema>;
export type ColorAssociation = typeof colorAssociations.$inferSelect;

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

// Terms and Conditions schema
export const insertTermsConditionsSchema = createInsertSchema(termsConditions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TermsConditions = typeof termsConditions.$inferSelect;
export type InsertTermsConditions = z.infer<typeof insertTermsConditionsSchema>;

// Appearance settings table
export const appearanceSettings = pgTable("appearance_settings", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name", { length: 255 }).default("إدارة المخزون"),
  companyNameEn: varchar("company_name_en", { length: 255 }).default("Inventory System"),
  companyAddress: text("company_address"), // عنوان الشركة
  companyRegistrationNumber: varchar("company_registration_number", { length: 100 }), // رقم السجل التجاري
  companyLicenseNumber: varchar("company_license_number", { length: 100 }), // رقم الرخصة
  companyTaxNumber: varchar("company_tax_number", { length: 100 }), // الرقم الضريبي
  companyWebsite: varchar("company_website", { length: 255 }), // موقع الشركة
  companyLogo: text("company_logo"), // Base64 encoded image
  primaryColor: varchar("primary_color", { length: 7 }).default("#0f766e"), // Teal-700
  primaryHoverColor: varchar("primary_hover_color", { length: 7 }).default("#134e4a"), // Teal-900
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#0891b2"), // Sky-600
  secondaryHoverColor: varchar("secondary_hover_color", { length: 7 }).default("#0c4a6e"), // Sky-900
  accentColor: varchar("accent_color", { length: 7 }).default("#BF9231"), // Custom golden
  accentHoverColor: varchar("accent_hover_color", { length: 7 }).default("#a67c27"), // Custom golden dark
  gradientStart: varchar("gradient_start", { length: 7 }).default("#0f766e"), // Teal-700
  gradientEnd: varchar("gradient_end", { length: 7 }).default("#0891b2"), // Sky-600
  cardBackgroundColor: varchar("card_background_color", { length: 7 }).default("#ffffff"), // White
  cardHoverColor: varchar("card_hover_color", { length: 7 }).default("#f8fafc"), // Slate-50
  borderColor: varchar("border_color", { length: 7 }).default("#e2e8f0"), // Slate-200
  borderHoverColor: varchar("border_hover_color", { length: 7 }).default("#0f766e"), // Teal-700
  backgroundColor: varchar("background_color", { length: 7 }).default("#f8fafc"), // Light mode background
  darkBackgroundColor: varchar("dark_background_color", { length: 7 }).default("#000000"), // Dark mode background
  
  // Dark mode colors
  darkPrimaryColor: varchar("dark_primary_color", { length: 7 }).default("#14b8a6"), // Teal-500
  darkPrimaryHoverColor: varchar("dark_primary_hover_color", { length: 7 }).default("#0d9488"), // Teal-600
  darkSecondaryColor: varchar("dark_secondary_color", { length: 7 }).default("#0ea5e9"), // Sky-500
  darkSecondaryHoverColor: varchar("dark_secondary_hover_color", { length: 7 }).default("#0284c7"), // Sky-600
  darkAccentColor: varchar("dark_accent_color", { length: 7 }).default("#f59e0b"), // Amber-500
  darkAccentHoverColor: varchar("dark_accent_hover_color", { length: 7 }).default("#d97706"), // Amber-600
  darkCardBackgroundColor: varchar("dark_card_background_color", { length: 7 }).default("#141414"), // Sooty
  darkCardHoverColor: varchar("dark_card_hover_color", { length: 7 }).default("#282828"), // Dire Wolf
  darkBorderColor: varchar("dark_border_color", { length: 7 }).default("#374151"), // Gray-700
  darkBorderHoverColor: varchar("dark_border_hover_color", { length: 7 }).default("#14b8a6"), // Teal-500
  darkTextPrimaryColor: varchar("dark_text_primary_color", { length: 7 }).default("#f1f5f9"), // Slate-100
  darkTextSecondaryColor: varchar("dark_text_secondary_color", { length: 7 }).default("#94a3b8"), // Slate-400
  
  // Light mode text colors
  textPrimaryColor: varchar("text_primary_color", { length: 7 }).default("#1e293b"), // Slate-800
  textSecondaryColor: varchar("text_secondary_color", { length: 7 }).default("#64748b"), // Slate-500
  
  // Header colors
  headerBackgroundColor: varchar("header_background_color", { length: 7 }).default("#ffffff"), // White
  darkHeaderBackgroundColor: varchar("dark_header_background_color", { length: 7 }).default("#141414"), // Sooty
  
  darkMode: boolean("dark_mode").default(false),
  darkModeEnabled: boolean("dark_mode_enabled").default(false),
  rtlLayout: boolean("rtl_layout").default(true),
  themeStyle: varchar("theme_style", { length: 20 }).default("glass"), // glass, neumorphism, classic
  systemIcon: text("system_icon"), // Icon name or SVG
  fontFamily: varchar("font_family", { length: 100 }).default("Noto Sans Arabic"),
  printLogo: text("print_logo"),
  printHeader: text("print_header"),
  printFooter: text("print_footer"),
  printHeaderLeft: text("print_header_left"),
  printHeaderCenter: text("print_header_center"),
  printHeaderRight: text("print_header_right"),
  printFooterLeft: text("print_footer_left"),
  printFooterCenter: text("print_footer_center"),
  printFooterRight: text("print_footer_right"),
  printStamp: text("print_stamp"), // Base64 encoded stamp image
  watermarkEnabled: boolean("watermark_enabled").default(false),
  homeWatermarkEnabled: boolean("home_watermark_enabled").default(true),
  showBankDetails: boolean("show_bank_details").default(false),

  // Vehicle Card Appearance
  vehicleCardBgColor: varchar("vehicle_card_bg_color", { length: 7 }).default("#7B1E1E"),
  vehicleCardTextColor: varchar("vehicle_card_text_color", { length: 7 }).default("#FFFFFF"),
  vehicleCardPriceColor: varchar("vehicle_card_price_color", { length: 7 }).default("#FCD34D"),
  vehicleCardAccentColor: varchar("vehicle_card_accent_color", { length: 7 }).default("#C49632"),
  vehicleCardBorderColor: varchar("vehicle_card_border_color", { length: 7 }).default("#FFFFFF"),
  vehicleCardBorderRadius: integer("vehicle_card_border_radius").default(16),
  vehicleCardUseCustomColors: boolean("vehicle_card_use_custom_colors").default(false),

  // Vehicle Card Field Visibility
  vehicleCardShowEngine: boolean("vehicle_card_show_engine").default(true),
  vehicleCardShowYear: boolean("vehicle_card_show_year").default(true),
  vehicleCardShowExteriorColor: boolean("vehicle_card_show_exterior_color").default(true),
  vehicleCardShowInteriorColor: boolean("vehicle_card_show_interior_color").default(true),
  vehicleCardShowImportType: boolean("vehicle_card_show_import_type").default(true),
  vehicleCardShowOwnership: boolean("vehicle_card_show_ownership").default(true),
  vehicleCardShowLocation: boolean("vehicle_card_show_location").default(true),
  vehicleCardShowVin: boolean("vehicle_card_show_vin").default(true),
  vehicleCardShowPrice: boolean("vehicle_card_show_price").default(true),
  vehicleCardShowMileage: boolean("vehicle_card_show_mileage").default(true),

  // Vehicle Card Action Buttons Visibility
  vehicleCardShowShareBtn: boolean("vehicle_card_show_share_btn").default(true),
  vehicleCardShowSellBtn: boolean("vehicle_card_show_sell_btn").default(true),
  vehicleCardShowQuoteBtn: boolean("vehicle_card_show_quote_btn").default(true),
  vehicleCardShowPriceCardBtn: boolean("vehicle_card_show_price_card_btn").default(true),
  vehicleCardShowReserveBtn: boolean("vehicle_card_show_reserve_btn").default(true),
  quotationBackgroundType: varchar("quotation_background_type", { length: 20 }).default("albarimi2"), // albarimi1, albarimi2, dynamic
  quotationPrimaryColor: varchar("quotation_primary_color", { length: 7 }).default("#1A365D"),
  quotationSecondaryColor: varchar("quotation_secondary_color", { length: 7 }).default("#2B4C8C"),
  quotationAccentColor: varchar("quotation_accent_color", { length: 7 }).default("#C49632"),
  quotationFontFamily: varchar("quotation_font_family", { length: 100 }).default("Noto Sans Arabic"),
  quotationGreeting: text("quotation_greeting").default("تحية طيبة وبعد، يسعدنا تزويدكم بعرض السعر بناءً على طلبكم الكريم."),
  quotationClosingSalutation: varchar("quotation_closing_salutation", { length: 50 }),
  quotationFooter: text("quotation_footer"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertAppearanceSettingsSchema = createInsertSchema(appearanceSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type AppearanceSettings = typeof appearanceSettings.$inferSelect;
export type InsertAppearanceSettings = z.infer<typeof insertAppearanceSettingsSchema>;

// Zod schemas for new vehicle-related tables
export const insertVehicleCategorySchema = createInsertSchema(vehicleCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVehicleTrimLevelSchema = createInsertSchema(vehicleTrimLevels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for new vehicle-related tables
export type VehicleCategory = typeof vehicleCategories.$inferSelect;
export type InsertVehicleCategory = z.infer<typeof insertVehicleCategorySchema>;

export type VehicleTrimLevel = typeof vehicleTrimLevels.$inferSelect;
export type InsertVehicleTrimLevel = z.infer<typeof insertVehicleTrimLevelSchema>;

// Relations
export const bankRelations = relations(banks, ({ many }) => ({
  bankInterestRates: many(bankInterestRates),
}));

export const bankInterestRateRelations = relations(bankInterestRates, ({ one }) => ({
  bank: one(banks, {
    fields: [bankInterestRates.bankId],
    references: [banks.id],
  }),
}));

export const manufacturerRelations = relations(manufacturers, ({ many }) => ({
  vehicleCategories: many(vehicleCategories),
}));

export const vehicleCategoryRelations = relations(vehicleCategories, ({ one, many }) => ({
  manufacturer: one(manufacturers, {
    fields: [vehicleCategories.manufacturerId],
    references: [manufacturers.id],
  }),
  vehicleTrimLevels: many(vehicleTrimLevels),
}));

export const vehicleTrimLevelRelations = relations(vehicleTrimLevels, ({ one }) => ({
  category: one(vehicleCategories, {
    fields: [vehicleTrimLevels.categoryId],
    references: [vehicleCategories.id],
  }),
}));

export const quotationRelations = relations(quotations, ({ many }) => ({
  invoices: many(invoices),
}));

export const invoiceRelations = relations(invoices, ({ one }) => ({
  quotation: one(quotations, {
    fields: [invoices.quotationId],
    references: [quotations.id],
  }),
}));

export const locationTransferRelations = relations(locationTransfers, ({ one }) => ({
  inventoryItem: one(inventoryItems, {
    fields: [locationTransfers.inventoryItemId],
    references: [inventoryItems.id],
  }),
}));
