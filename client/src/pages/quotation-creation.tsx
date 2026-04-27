import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft,
  FileText, 
  Settings, 
  Building2, 
  User as UserIcon, 
  Save,
  Eye,
  Upload,
  Plus,
  Edit3,
  Trash2,
  Search,
  Calculator,
  Printer,
  Download,  
  FileDown,
  MessageCircle,
  FileUp,
  Settings2,
  X,
  Info,
  Car,
  ChevronUp,
  ChevronDown,
  Package,
  LayoutGrid,
  RotateCcw,
  EyeOff
} from "lucide-react";
import { Link, useLocation } from "wouter";

import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import GlassBackground from "@/components/glass-background";
import SystemGlassWrapper from "@/components/system-glass-wrapper";
import { VehicleDetailedSpecifications } from "@/components/vehicle-detailed-specifications";

import type { InventoryItem, Specification, InsertQuotation, Company, TermsConditions, User } from "@shared/schema";
import { getManufacturerLogo } from "@shared/manufacturer-logos";
import { numberToArabic } from "@/utils/number-to-arabic";
import { generateQuoteNumber, generateInvoiceNumber } from "@/utils/serial-number";
import { convertArabicToEnglishNumerals } from "@/utils/numeral-converter";
import QuotationA4Preview from "@/components/quotation-a4-preview";
import CompanyPDFTemplates from "@/components/company-pdf-templates";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import EnhancedPDFExport from "@/components/enhanced-pdf-export";

interface QuotationCreationPageProps {
  vehicleData?: InventoryItem;
}



// Component to display vehicle specifications with enhanced styling
function VehicleSpecificationsDisplayComponent({ manufacturer, category, trimLevel, year, engineCapacity, chassisNumber, onEdit }: {
  manufacturer: string;
  category: string;
  trimLevel: string;
  year: string;
  engineCapacity: string;
  chassisNumber?: string;
  onEdit?: () => void;
}) {
  const { data: specs, isLoading } = useQuery<Specification>({
    queryKey: ['/api/specifications', chassisNumber, manufacturer, category, trimLevel, year, engineCapacity],
    enabled: !!(chassisNumber || (manufacturer && category && year && engineCapacity)),
    queryFn: async () => {
      // Use chassis number endpoint if available
      if (chassisNumber && chassisNumber.trim()) {
        const response = await fetch(`/api/specifications-by-chassis/${encodeURIComponent(chassisNumber.trim())}`);
        if (response.ok) {
          return response.json();
        }
      }
      
      // Fallback to general specifications
      if (manufacturer && category && year && engineCapacity) {
        const response = await fetch(
          `/api/specifications/${encodeURIComponent(manufacturer)}/${encodeURIComponent(category)}/${encodeURIComponent(trimLevel || 'null')}/${year}/${encodeURIComponent(engineCapacity)}`
        );
        if (response.ok) {
          return response.json();
        }
      }
      return null;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center space-x-2 space-x-reverse p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="text-gray-500 dark:text-gray-400">جاري تحميل المواصفات...</span>
      </div>
    );
  }

  if (!specs) {
    return (
      <div className="text-center p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <Info className="mx-auto h-8 w-8 text-yellow-600 dark:text-yellow-500 mb-2" />
        <p className="text-yellow-800 dark:text-yellow-200">لا توجد مواصفات متاحة لهذه المعاملات</p>
        <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
          يمكنك إضافة المواصفات من خلال إدارة النظام
        </p>
      </div>
    );
  }

  const specsData = !specs ? [] : [
    // Engine & Performance
    { key: 'engineType', label: 'نوع المحرك', value: (specs as any).engineType, icon: '🔧', category: 'engine' },
    { key: 'horsepower', label: 'القوة الحصانية', value: (specs as any).horsepower, icon: '⚡', category: 'engine' },
    { key: 'torque', label: 'عزم الدوران', value: (specs as any).torque, icon: '🔄', category: 'engine' },
    { key: 'transmission', label: 'ناقل الحركة', value: (specs as any).transmission, icon: '⚙️', category: 'engine' },
    { key: 'fuelType', label: 'نوع الوقود', value: (specs as any).fuelType, icon: '⛽', category: 'engine' },
    { key: 'fuelConsumption', label: 'استهلاك الوقود', value: (specs as any).fuelConsumption, icon: '📊', category: 'engine' },
    { key: 'drivetrain', label: 'نوع الدفع', value: (specs as any).drivetrain, icon: '🚗', category: 'engine' },
    { key: 'acceleration', label: 'التسارع 0-100', value: (specs as any).acceleration, icon: '🚀', category: 'engine' },
    { key: 'topSpeed', label: 'السرعة القصوى', value: (specs as any).topSpeed, icon: '🏎️', category: 'engine' },
    
    // Dimensions & Weight
    { key: 'length', label: 'الطول', value: (specs as any).length, icon: '📏', category: 'dimensions' },
    { key: 'width', label: 'العرض', value: (specs as any).width, icon: '📐', category: 'dimensions' },
    { key: 'height', label: 'الارتفاع', value: (specs as any).height, icon: '📏', category: 'dimensions' },
    { key: 'wheelbase', label: 'قاعدة العجلات', value: (specs as any).wheelbase, icon: '🛞', category: 'dimensions' },
    { key: 'curbWeight', label: 'الوزن الفارغ', value: (specs as any).curbWeight, icon: '⚖️', category: 'dimensions' },
    { key: 'grossWeight', label: 'إجمالي الوزن', value: (specs as any).grossWeight, icon: '⚖️', category: 'dimensions' },
    { key: 'loadCapacity', label: 'سعة التحميل', value: (specs as any).loadCapacity, icon: '📦', category: 'dimensions' },
    { key: 'seatingCapacity', label: 'عدد المقاعد', value: (specs as any).seatingCapacity, icon: '🪑', category: 'dimensions' },
    
    // Features & Equipment
    { key: 'safetyFeatures', label: 'مميزات الأمان', value: (specs as any).safetyFeatures, icon: '🛡️', category: 'features' },
    { key: 'comfortFeatures', label: 'مميزات الراحة', value: (specs as any).comfortFeatures, icon: '✨', category: 'features' },
    { key: 'infotainment', label: 'نظام المعلومات والترفيه', value: (specs as any).infotainment, icon: '📱', category: 'features' },
    { key: 'driverAssistance', label: 'مساعدة السائق', value: (specs as any).driverAssistance, icon: '🤖', category: 'features' },
    { key: 'exteriorFeatures', label: 'المميزات الخارجية', value: (specs as any).exteriorFeatures, icon: '🌟', category: 'features' },
    { key: 'interiorFeatures', label: 'المميزات الداخلية', value: (specs as any).interiorFeatures, icon: '🏠', category: 'features' },
    
    // Technical Specifications
    { key: 'tireSize', label: 'مقاس الإطارات', value: (specs as any).tireSize, icon: '🛞', category: 'technical' },
    { key: 'suspension', label: 'نوع التعليق', value: (specs as any).suspension, icon: '🔧', category: 'technical' },
    { key: 'brakes', label: 'نظام الكبح', value: (specs as any).brakes, icon: '🛑', category: 'technical' },
    { key: 'steering', label: 'نظام التوجيه', value: (specs as any).steering, icon: '🎯', category: 'technical' },
    { key: 'groundClearance', label: 'ارتفاع عن الأرض', value: (specs as any).groundClearance, icon: '📏', category: 'technical' },
    
    // Additional Information
    { key: 'warranty', label: 'الضمان', value: (specs as any).warranty, icon: '🔒', category: 'additional' },
    { key: 'specifications', label: 'الوصف التفصيلي', value: (specs as any).specifications, icon: '📝', category: 'additional' },
    { key: 'notes', label: 'ملاحظات', value: (specs as any).notes, icon: '📋', category: 'additional' },
  ];

  const availableSpecs = specsData.filter(spec => spec.value);

  // Group specifications by category
  const engineSpecs = availableSpecs.filter(spec => spec.category === 'engine');
  const dimensionSpecs = availableSpecs.filter(spec => spec.category === 'dimensions');
  const featureSpecs = availableSpecs.filter(spec => spec.category === 'features');
  const technicalSpecs = availableSpecs.filter(spec => spec.category === 'technical');
  const additionalSpecs = availableSpecs.filter(spec => spec.category === 'additional');

  const specCategories = [
    { name: 'المحرك والأداء', specs: engineSpecs, icon: '🔧' },
    { name: 'الأبعاد والوزن', specs: dimensionSpecs, icon: '📏' },
    { name: 'المميزات والتجهيزات', specs: featureSpecs, icon: '✨' },
    { name: 'المواصفات التقنية', specs: technicalSpecs, icon: '🔧' },
    { name: 'معلومات إضافية', specs: additionalSpecs, icon: '📋' }
  ].filter(category => category.specs.length > 0);

  return (
    <div className="space-y-6">
      {specCategories.length > 0 ? (
        specCategories.map((category) => (
          <div key={category.name} className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span role="img" aria-label={category.name}>{category.icon}</span>
              {category.name}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.specs.map((spec) => (
                <div 
                  key={spec.key} 
                  className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors duration-200"
                >
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <span className="text-lg" role="img" aria-label={spec.label}>
                      {spec.icon}
                    </span>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {spec.label}
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {spec.value}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
          <Info className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p 
            className="text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            onDoubleClick={() => {
              // Open vehicle edit dialog to add detailed specifications
              onEdit?.();
            }}
            title="انقر مرتين لإضافة المواصفات التفصيلية"
          >
            لا توجد مواصفات تفصيلية متاحة
          </p>
          <p className="text-xs text-gray-500 mt-1">انقر مرتين للتحرير</p>
        </div>
      )}
      
      {/* Vehicle Selection Summary */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h6 className="font-medium text-blue-900 dark:text-blue-100 mb-2">الاختيار الحالي</h6>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-blue-600 dark:text-blue-400">الصانع:</span>
            <span className="font-medium text-blue-800 dark:text-blue-200 ml-2">{manufacturer}</span>
          </div>
          <div>
            <span className="text-blue-600 dark:text-blue-400">الفئة:</span>
            <span className="font-medium text-blue-800 dark:text-blue-200 ml-2">{category}</span>
          </div>
          {trimLevel && (
            <div>
              <span className="text-blue-600 dark:text-blue-400">درجة التجهيز:</span>
              <span className="font-medium text-blue-800 dark:text-blue-200 ml-2">{trimLevel}</span>
            </div>
          )}
          <div>
            <span className="text-blue-600 dark:text-blue-400">السنة:</span>
            <span className="font-medium text-blue-800 dark:text-blue-200 ml-2">{year}</span>
          </div>
          <div className="col-span-2">
            <span className="text-blue-600 dark:text-blue-400">سعة المحرك:</span>
            <span className="font-medium text-blue-800 dark:text-blue-200 ml-2">{engineCapacity}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CompanyData {
  name: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxNumber: string;
  registrationNumber: string;
  licenseNumber: string;
}

interface RepresentativeData {
  name: string;
  phone: string;
  email: string;
  position: string;
}

interface QuoteAppearance {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoPosition: 'left' | 'center' | 'right';
  showCompanyInfo: boolean;
  showRepresentativeInfo: boolean;
}

interface PricingDetails {
  basePrice: number;
  quantity: number;
  licensePlatePrice: number;
  includeLicensePlate: boolean;
  licensePlateSubjectToTax: boolean;
  taxRate: number;
  isVATInclusive: boolean;
}

export default function QuotationCreationPage({ vehicleData }: QuotationCreationPageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  
  // Check for editing quotation data first
  const [editingQuotation, setEditingQuotation] = useState<any | null>(() => {
    const storedQuotation = localStorage.getItem('editingQuotation');
    if (storedQuotation) {
      try {
        return JSON.parse(storedQuotation);
      } catch (error) {
        console.error('Error parsing editing quotation data:', error);
      }
    }
    return null;
  });

  // Parse vehicle data from localStorage if not provided as prop
  const [selectedVehicle, setSelectedVehicle] = useState<InventoryItem | null>(() => {
    // If editing quotation, don't use any pre-selected vehicle
    if (editingQuotation) return null;
    
    if (vehicleData) return vehicleData;
    
    const storedVehicle = localStorage.getItem('selectedVehicleForQuote');
    if (storedVehicle) {
      try {
        const parsedVehicle = JSON.parse(storedVehicle);
        // Clear the stored vehicle data after reading it
        localStorage.removeItem('selectedVehicleForQuote');
        return parsedVehicle;
      } catch (error) {
        console.error('Error parsing stored vehicle data:', error);
      }
    }
    return null;
  });

  // Vehicle data selection states (for empty mode or editing)
  const [vehicleManufacturer, setVehicleManufacturer] = useState<string>("");
  const [vehicleCategory, setVehicleCategory] = useState<string>("");
  const [vehicleTrimLevel, setVehicleTrimLevel] = useState<string>("");
  const [vehicleYear, setVehicleYear] = useState<string>("");
  const [vehicleEngineCapacity, setVehicleEngineCapacity] = useState<string>("");
  const [vehicleExteriorColor, setVehicleExteriorColor] = useState<string>("");
  const [vehicleInteriorColor, setVehicleInteriorColor] = useState<string>("");
  const [vehicleChassisNumber, setVehicleChassisNumber] = useState<string>("");
  const [vehiclePrice, setVehiclePrice] = useState<number>(0);
  const [quoteNumber, setQuoteNumber] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>(editingQuotation?.customerName || "");
  const [customerPhone, setCustomerPhone] = useState<string>(editingQuotation?.customerPhone || "");
  const [customerEmail, setCustomerEmail] = useState<string>(editingQuotation?.customerEmail || "");
  const [customerTitle, setCustomerTitle] = useState<string>(editingQuotation?.customerTitle || "السادة");
  const [validityDays, setValidityDays] = useState<number>(3);
  const [notes, setNotes] = useState<string>(editingQuotation?.notes || "");
  const [isInvoiceMode, setIsInvoiceMode] = useState<boolean>(false);
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [authorizationNumber, setAuthorizationNumber] = useState<string>("");
  const [selectedRepresentative, setSelectedRepresentative] = useState<string>("");
  const [showRepresentative, setShowRepresentative] = useState<boolean>(true);
  const [selectedCompany, setSelectedCompany] = useState<string>("");

  useEffect(() => {
    if (editingQuotation) {
      setVehicleManufacturer(editingQuotation.manufacturer || "");
      setVehicleCategory(editingQuotation.category || "");
      setVehicleTrimLevel(editingQuotation.trimLevel || "");
      setVehicleYear(editingQuotation.year?.toString() || "");
      setVehicleEngineCapacity(editingQuotation.engineCapacity || "");
      setVehicleExteriorColor(editingQuotation.exteriorColor || "");
      setVehicleInteriorColor(editingQuotation.interiorColor || "");
      setVehicleChassisNumber(editingQuotation.chassisNumber || "");
      setVehiclePrice(editingQuotation.basePrice ? Number(editingQuotation.basePrice) : 0);
    } else if (selectedVehicle) {
      setVehicleManufacturer(selectedVehicle.manufacturer || "");
      setVehicleCategory(selectedVehicle.category || "");
      setVehicleTrimLevel(selectedVehicle.trimLevel || "");
      setVehicleYear(selectedVehicle.year?.toString() || "");
      setVehicleEngineCapacity(selectedVehicle.engineCapacity || "");
      setVehicleExteriorColor(selectedVehicle.exteriorColor || "");
      setVehicleInteriorColor(selectedVehicle.interiorColor || "");
      setVehicleChassisNumber(selectedVehicle.chassisNumber || "");
      setVehiclePrice(selectedVehicle.price ? Number(selectedVehicle.price) : 0);
    }
  }, [editingQuotation, selectedVehicle]);

  useEffect(() => {
    setQuoteNumber(generateQuoteNumber());
  }, []);

  // Synchronize individual vehicle states with editableVehicle for preview
  useEffect(() => {
    setEditableVehicle(prev => ({
      ...prev,
      manufacturer: vehicleManufacturer,
      category: vehicleCategory,
      trimLevel: vehicleTrimLevel,
      year: parseInt(vehicleYear) || prev.year,
      engineCapacity: vehicleEngineCapacity,
      exteriorColor: vehicleExteriorColor,
      interiorColor: vehicleInteriorColor,
      chassisNumber: vehicleChassisNumber,
      price: vehiclePrice
    } as any as InventoryItem));
  }, [
    vehicleManufacturer, 
    vehicleCategory, 
    vehicleTrimLevel, 
    vehicleYear, 
    vehicleEngineCapacity, 
    vehicleExteriorColor, 
    vehicleInteriorColor, 
    vehicleChassisNumber,
    vehiclePrice
  ]);

  // Fetch users from API for sales representatives
  // Load users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  // Fetch companies from API
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"]
  });

  useEffect(() => {
    if (users && users.length > 0 && !selectedRepresentative) {
      // Default to first user if none selected
      setSelectedRepresentative(users[0].id.toString());
    }
  }, [users, selectedRepresentative]);

  useEffect(() => {
    if (companies && companies.length > 0 && !selectedCompany) {
      // Default to first company if none selected
      setSelectedCompany(companies[0].id.toString());
    }
  }, [companies, selectedCompany]);

  // Fetch inventory items for vehicle selection dialog
  const { data: availableVehicles = [] } = useQuery({
    queryKey: ["/api/inventory"]
  });

  // Database-driven vehicle hierarchy
  const { data: manufacturers = [] } = useQuery<any[]>({
    queryKey: ["/api/hierarchical/manufacturers"]
  });

  // Fetch categories based on selected manufacturer  
  const selectedManufacturerName = vehicleManufacturer || editingQuotation?.manufacturer;
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/hierarchical/categories", selectedManufacturerName],
    queryFn: async () => {
      if (!selectedManufacturerName) return [];
      const response = await fetch(`/api/hierarchical/categories?manufacturer=${encodeURIComponent(selectedManufacturerName)}`);
      return response.json();
    },
    enabled: !!selectedManufacturerName,
  });
  
  // Fetch trim levels based on selected category
  const selectedCategoryName = vehicleCategory || editingQuotation?.category;
  const { data: trimLevels = [] } = useQuery<any[]>({
    queryKey: ["/api/hierarchical/trimLevels", selectedManufacturerName, selectedCategoryName],
    queryFn: async () => {
      if (!selectedManufacturerName || !selectedCategoryName) return [];
      const response = await fetch(`/api/hierarchical/trimLevels?manufacturer=${encodeURIComponent(selectedManufacturerName)}&category=${encodeURIComponent(selectedCategoryName)}`);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!selectedManufacturerName && !!selectedCategoryName,
  });

  // Fetch years and engine capacities from database
  const { data: vehicleYears = [] } = useQuery<number[]>({
    queryKey: ["/api/vehicle-years"]
  });

  const { data: engineCapacities = [] } = useQuery<string[]>({
    queryKey: ["/api/engine-capacities"]
  });

  // Vehicle editing state for editable form
  const [editingVehicleData, setEditingVehicleData] = useState({
    manufacturer: "",
    category: "",
    trimLevel: "",
    year: "",
    engineCapacity: "",
    exteriorColor: "",
    interiorColor: "",
    chassisNumber: "",
    price: 0
  });

  // Get editing categories from database
  const { data: editingCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/hierarchical/categories", editingVehicleData.manufacturer],
    queryFn: async () => {
      if (!editingVehicleData.manufacturer) return [];
      const response = await fetch(`/api/hierarchical/categories?manufacturer=${encodeURIComponent(editingVehicleData.manufacturer)}`);
      return response.json();
    },
    enabled: !!editingVehicleData.manufacturer,
  });

  // Get editing trim levels from database
  const { data: editingTrimLevels = [] } = useQuery<any[]>({
    queryKey: ["/api/hierarchical/trimLevels", editingVehicleData.manufacturer, editingVehicleData.category],
    queryFn: async () => {
      if (!editingVehicleData.manufacturer || !editingVehicleData.category) return [];
      const response = await fetch(`/api/hierarchical/trimLevels?manufacturer=${encodeURIComponent(editingVehicleData.manufacturer)}&category=${encodeURIComponent(editingVehicleData.category)}`);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!editingVehicleData.manufacturer && !!editingVehicleData.category,
  });
  


  // Management windows states
  const [specificationsOpen, setSpecificationsOpen] = useState(false);
  
  const [quotesViewOpen, setQuotesViewOpen] = useState(false);
  const [vehicleEditOpen, setVehicleEditOpen] = useState(false);
  const [editableVehicle, setEditableVehicle] = useState<InventoryItem>(() => {
    // If editing existing quotation, use its data
    if (editingQuotation) {
      return {
        id: Date.now(),
        manufacturer: editingQuotation.manufacturer || "",
        category: editingQuotation.category || "",
        trimLevel: editingQuotation.trimLevel || "",
        year: parseInt(editingQuotation.year) || new Date().getFullYear(),
        engineCapacity: editingQuotation.engineCapacity || "",
        exteriorColor: editingQuotation.exteriorColor || "",
        interiorColor: editingQuotation.interiorColor || "",
        chassisNumber: editingQuotation.chassisNumber || "",
        price: parseFloat(editingQuotation.basePrice) || 0,
        status: "",
        location: "",
        importType: "",
        ownershipType: "",
        entryDate: new Date(),
        isSold: false,
        notes: "",
        images: [],
        logo: null,
        detailedSpecifications: null,
        soldDate: null,
        soldPrice: null,
        profit: null,
        buyer: null,
        soldBySalesRep: null,
        reservedBy: null,
        reservationDate: null,
        reservationNotes: null,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any as InventoryItem;
    }
    
    // If coming from selected vehicle, use its data
    if (selectedVehicle) return selectedVehicle;
    
    // For new quotation (عرض جديد), always start with empty fields
    return {
      id: Date.now(),
      manufacturer: "",
      category: "",
      trimLevel: "",
      year: new Date().getFullYear(),
      engineCapacity: "",
      exteriorColor: "",
      interiorColor: "",
      chassisNumber: "",
      price: 0,
      status: "",
      location: "",
      importType: "",
      ownershipType: "",
      entryDate: new Date(),
      isSold: false,
      notes: "",
      images: [],
      logo: null,
      detailedSpecifications: null,
      soldDate: null,
      soldPrice: null,
      profit: null,
      buyer: null,
      soldBySalesRep: null,
      reservedBy: null,
      reservationDate: null,
      reservationNotes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any as InventoryItem;
  });
  const [vehicleDescriptionOpen, setVehicleDescriptionOpen] = useState(false);
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState("");
  const [selectedVehicleFromDB, setSelectedVehicleFromDB] = useState<any>(null);
  
  // Multiple vehicles state
  const [multiItems, setMultiItems] = useState<any[]>(() => {
    if (editingQuotation?.multiItems) {
      try {
        return JSON.parse(editingQuotation.multiItems);
      } catch (e) {
        console.error("Error parsing multiItems", e);
      }
    }
    return [];
  });
  const [isMultiVehicleMode, setIsMultiVehicleMode] = useState(() => {
    return !!(editingQuotation?.multiItems && JSON.parse(editingQuotation.multiItems).length > 0);
  });

  // ===== Customizable layout for the main content area =====
  type LayoutSectionId = "customer" | "vehicle" | "preview";
  const LAYOUT_STORAGE_KEY = "quotation-creation-layout-v1";
  const DEFAULT_LAYOUT_ORDER: LayoutSectionId[] = ["customer", "vehicle", "preview"];
  const SECTION_LABELS: Record<LayoutSectionId, string> = {
    customer: "بيانات العميل",
    vehicle: "بيانات السيارة والتسعير",
    preview: "معاينة A4",
  };

  const [layoutOrder, setLayoutOrder] = useState<LayoutSectionId[]>(() => {
    try {
      const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.order)) {
          // Keep only known ids and append any missing ones to preserve compatibility
          const known = parsed.order.filter((id: string): id is LayoutSectionId =>
            DEFAULT_LAYOUT_ORDER.includes(id as LayoutSectionId)
          );
          const missing = DEFAULT_LAYOUT_ORDER.filter((id) => !known.includes(id));
          return [...known, ...missing];
        }
      }
    } catch {}
    return DEFAULT_LAYOUT_ORDER;
  });
  const [hiddenSections, setHiddenSections] = useState<LayoutSectionId[]>(() => {
    try {
      const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.hidden)) {
          return parsed.hidden.filter((id: string): id is LayoutSectionId =>
            DEFAULT_LAYOUT_ORDER.includes(id as LayoutSectionId)
          );
        }
      }
    } catch {}
    return [];
  });
  const [showLayoutDialog, setShowLayoutDialog] = useState(false);
  const [draftOrder, setDraftOrder] = useState<LayoutSectionId[]>(layoutOrder);
  const [draftHidden, setDraftHidden] = useState<LayoutSectionId[]>(hiddenSections);

  const openLayoutDialog = () => {
    setDraftOrder(layoutOrder);
    setDraftHidden(hiddenSections);
    setShowLayoutDialog(true);
  };

  const moveDraftSection = (index: number, direction: -1 | 1) => {
    setDraftOrder((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const toggleDraftHidden = (id: LayoutSectionId) => {
    setDraftHidden((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const saveLayout = () => {
    setLayoutOrder(draftOrder);
    setHiddenSections(draftHidden);
    try {
      localStorage.setItem(
        LAYOUT_STORAGE_KEY,
        JSON.stringify({ order: draftOrder, hidden: draftHidden })
      );
    } catch {}
    setShowLayoutDialog(false);
    toast({ title: "تم الحفظ", description: "تم حفظ التخطيط الجديد بنجاح" });
  };

  const resetLayout = () => {
    setDraftOrder(DEFAULT_LAYOUT_ORDER);
    setDraftHidden([]);
  };

  const sectionStyle = (id: LayoutSectionId): React.CSSProperties => {
    const order = layoutOrder.indexOf(id);
    return {
      order: order === -1 ? 999 : order,
      display: hiddenSections.includes(id) ? "none" : undefined,
    };
  };

  // Column visibility state for multi-items table
  const [visibleColumns, setVisibleColumns] = useState({
    manufacturer: true,
    chassis: true,
    color: true,
    quantity: true,
    unitPrice: true,
    tax: true,
    license: true,
    total: true
  });

  // Add current vehicle to multi-items list
  const addVehicleToMultiItems = () => {
    const vehicle = editableVehicle || selectedVehicle;
    if (!vehicle || !vehicle.manufacturer) {
      toast({
        title: "تنبيه",
        description: "يرجى اختيار سيارة أولاً",
        variant: "destructive"
      });
      return;
    }

    const totals = calculateTotals();

    const newItem = {
      id: Date.now(),
      manufacturer: vehicleManufacturer || vehicle.manufacturer,
      category: vehicleCategory || vehicle.category,
      trimLevel: vehicleTrimLevel || vehicle.trimLevel,
      year: parseInt(vehicleYear) || vehicle.year,
      engineCapacity: vehicleEngineCapacity || vehicle.engineCapacity,
      exteriorColor: vehicleExteriorColor || vehicle.exteriorColor,
      interiorColor: vehicleInteriorColor || vehicle.interiorColor,
      chassisNumber: vehicleChassisNumber || vehicle.chassisNumber,
      logo: vehicle.logo,
      vehicleManufacturerLogo: (vehicle as any).vehicleManufacturerLogo,
      quantity: pricingDetails.quantity || 1,
      unitPrice: pricingDetails.basePrice,
      taxRate: pricingDetails.taxRate,
      taxAmount: totals.taxAmount,
      licensePlatePrice: pricingDetails.includeLicensePlate ? (pricingDetails.licensePlatePrice * (pricingDetails.quantity || 1)) : 0,
      totalPrice: totals.finalTotal,
      isVATInclusive: pricingDetails.isVATInclusive,
      licensePlateSubjectToTax: pricingDetails.licensePlateSubjectToTax
    };

    setMultiItems(prev => [...prev, newItem]);
    setIsMultiVehicleMode(true);
    
    toast({
      title: "تم الإضافة",
      description: "تم إضافة السيارة إلى القائمة",
    });
  };

  const removeVehicleFromMultiItems = (id: number) => {
    setMultiItems(prev => {
      const newList = prev.filter(item => item.id !== id);
      if (newList.length === 0) setIsMultiVehicleMode(false);
      return newList;
    });
  };

  const moveItem = (id: number, direction: 'up' | 'down') => {
    setMultiItems(prev => {
      const index = prev.findIndex(item => item.id === id);
      if (index === -1) return prev;
      
      const newItems = [...prev];
      if (direction === 'up' && index > 0) {
        [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
      } else if (direction === 'down' && index < newItems.length - 1) {
        [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      }
      return newItems;
    });
  };
  
  // Filter states for vehicle selection dialog
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterTrimLevel, setFilterTrimLevel] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterEngineCapacity, setFilterEngineCapacity] = useState("all");
  const [filterImportType, setFilterImportType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterExteriorColor, setFilterExteriorColor] = useState("all");
  const [filterInteriorColor, setFilterInteriorColor] = useState("all");
  
  // Get selected company object
  const selectedCompanyData = companies.find(c => c.id.toString() === selectedCompany);
  
  // Data states
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: "شركة السيارات المتقدمة",
    logo: "",
    address: "الرياض، المملكة العربية السعودية",
    phone: "+966 11 123 4567",
    email: "info@company.com",
    website: "www.company.com",
    taxNumber: "123456789",
    registrationNumber: "1234567890",
    licenseNumber: "L123456789"
  });

  // Update company data when selected company changes
  useEffect(() => {
    if (selectedCompanyData) {
      setCompanyData({
        name: selectedCompanyData.name,
        logo: selectedCompanyData.logo || "",
        address: selectedCompanyData.address,
        phone: selectedCompanyData.phone || "",
        email: selectedCompanyData.email,
        website: selectedCompanyData.website || "",
        taxNumber: selectedCompanyData.taxNumber,
        registrationNumber: selectedCompanyData.registrationNumber,
        licenseNumber: selectedCompanyData.licenseNumber
      });
      
      // Update appearance based on company colors
      setQuoteAppearance(prev => ({
        ...prev,
        primaryColor: selectedCompanyData.primaryColor || "#0F172A",
        secondaryColor: selectedCompanyData.secondaryColor || "#64748B"
      }));
    }
  }, [selectedCompanyData]);
  
  const [representativeData, setRepresentativeData] = useState<RepresentativeData>({
    name: "أحمد محمد",
    phone: "+966 50 123 4567",
    email: "ahmed@company.com",
    position: "مدير المبيعات"
  });
  
  const [quoteAppearance, setQuoteAppearance] = useState<QuoteAppearance>({
    primaryColor: "#0F172A",
    secondaryColor: "#64748B",
    fontFamily: "Noto Sans Arabic",
    logoPosition: "right",
    showCompanyInfo: true,
    showRepresentativeInfo: true
  });

  // Pricing details state
  const [pricingDetails, setPricingDetails] = useState<PricingDetails>(() => {
    // Initialize from editing quotation if available
    if (editingQuotation?.pricingDetails) {
      try {
        const parsed = JSON.parse(editingQuotation.pricingDetails);
        return {
          basePrice: Number(parsed.basePrice) || Number(selectedVehicle?.price) || 0,
          quantity: parsed.quantity || 1,
          licensePlatePrice: parsed.licensePlatePrice || 900,
          includeLicensePlate: parsed.includeLicensePlate ?? true,
          licensePlateSubjectToTax: parsed.licensePlateSubjectToTax ?? false,
          taxRate: parsed.taxRate || 15,
          isVATInclusive: parsed.isVATInclusive ?? false,
        };
      } catch (error) {
        console.error('Error parsing pricing details from editing quotation:', error);
      }
    }
    return {
      basePrice: Number(selectedVehicle?.price) || 0,
      quantity: 1,
      licensePlatePrice: 900,
      includeLicensePlate: true,
      licensePlateSubjectToTax: false,
      taxRate: 15,
      isVATInclusive: false,
    };
  });

  // New state variables for enhanced features
  const [whatsappNumber, setWhatsappNumber] = useState("+966");
  const [termsContent, setTermsContent] = useState("");
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showWhatsappDialog, setShowWhatsappDialog] = useState(false);
  const [termsRefreshTrigger, setTermsRefreshTrigger] = useState(0);
  const [companyStamp, setCompanyStamp] = useState<string | null>(() => {
    return localStorage.getItem('companyStamp') || "/company-stamp.png";
  });

  // Save stamp to localStorage whenever it changes
  useEffect(() => {
    if (companyStamp) {
      localStorage.setItem('companyStamp', companyStamp);
    }
  }, [companyStamp]);

  const handleStampUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCompanyStamp(base64String);
        toast({
          title: "تم رفع الختم",
          description: "تم حفظ الختم الجديد بنجاح",
        });
      };
      reader.readAsDataURL(file);
    }
  };
  const [showStamp, setShowStamp] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  
  // WhatsApp sharing enhanced options
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [sendToWorkNumber, setSendToWorkNumber] = useState(false);
  
  // Terms management states
  const [selectedTerms, setSelectedTerms] = useState<number[]>([]);
  const [newTermText, setNewTermText] = useState("");
  const [editingTermId, setEditingTermId] = useState<number | null>(null);
  const [editingTermText, setEditingTermText] = useState("");

  // API mutations for terms
  const addTermMutation = useMutation({
    mutationFn: async (termText: string) => {
      const res = await fetch('/api/terms-conditions/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termText, displayOrder: existingTerms.length + 1 })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/terms-conditions'] });
      setNewTermText("");
      toast({ title: "تم الإضافة", description: "تم إضافة البند بنجاح" });
    }
  });

  const updateTermMutation = useMutation({
    mutationFn: async ({ id, termText }: { id: number, termText: string }) => {
      const res = await fetch(`/api/terms-conditions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termText })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/terms-conditions'] });
      setEditingTermId(null);
      toast({ title: "تم التحديث", description: "تم تحديث البند بنجاح" });
    }
  });

  const deleteTermMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/terms-conditions/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/terms-conditions'] });
      toast({ title: "تم الحذف", description: "تم حذف البند بنجاح" });
    }
  });

  const handleAddTerm = () => {
    if (newTermText.trim()) {
      addTermMutation.mutate(newTermText.trim());
    }
  };

  const startEditingTerm = (term: TermsConditions) => {
    setEditingTermId(term.id);
    setEditingTermText(term.termText);
  };

  const saveEditTerm = (id: number) => {
    if (editingTermText.trim()) {
      updateTermMutation.mutate({ id, termText: editingTermText.trim() });
    }
  };

  const handleDeleteTerm = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا البند؟")) {
      deleteTermMutation.mutate(id);
    }
  };

  const applySelectedTerms = () => {
    const selectedTexts = existingTerms
      .filter(t => selectedTerms.includes(t.id))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .map(t => t.termText);
    
    setTermsContent(selectedTexts.join('\n'));
    setShowTermsDialog(false);
    toast({ title: "تم التطبيق", description: "تم تحديث الشروط في عرض السعر" });
  };

  // Load existing terms and conditions
  const { data: existingTerms = [] } = useQuery<TermsConditions[]>({
    queryKey: ['/api/terms-conditions']
  });

  // Update terms content when existing terms are loaded
  useEffect(() => {
    if (existingTerms.length > 0 && !termsContent) {
      const termsText = existingTerms.map(term => term.termText).join('\n');
      setTermsContent(termsText);
    }
  }, [existingTerms, termsContent]);

  // Clear editing quotation from localStorage after loading
  useEffect(() => {
    if (editingQuotation) {
      localStorage.removeItem('editingQuotation');
    }
  }, [editingQuotation]);

  // Generate QR code data
  const generateQRData = () => {
    return `Quote: ${quoteNumber}\nCustomer: ${customerName}\nVehicle: ${selectedVehicle?.manufacturer} ${selectedVehicle?.category}\nDate: ${new Date().toLocaleDateString('en-US')}`;
  };

  // Export quotation as PDF
  const exportToPDF = async () => {
    try {
      const element = document.querySelector('[data-pdf-export="quotation"]');
      if (!element) {
        toast({
          title: "خطأ",
          description: "لا يمكن العثور على العنصر المطلوب تصديره",
          variant: "destructive",
        });
        return;
      }

      // Create canvas from HTML element
      const canvas = await html2canvas(element as HTMLElement, {
        scale: 2,
        logging: false,
        allowTaint: true,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Calculate dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add image to PDF
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        0,
        imgWidth,
        imgHeight,
        '',
        'FAST'
      );

      // Save PDF
      const filename = `عرض_سعر_${quoteNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير عرض السعر إلى ملف PDF",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير العرض إلى PDF",
        variant: "destructive",
      });
    }
  };

  // Convert quotation to invoice
  const convertToInvoice = async () => {
    try {
      // Generate invoice number if not exists
      const newInvoiceNumber = invoiceNumber || generateInvoiceNumber();
      
      // Switch to invoice mode and set invoice number
      setIsInvoiceMode(true);
      setInvoiceNumber(newInvoiceNumber);
      
      toast({
        title: "تم التحويل بنجاح", 
        description: `تم تحويل العرض إلى فاتورة رقم ${newInvoiceNumber}`,
      });
      
    } catch (error) {
      console.error("Error converting to invoice:", error);
      toast({
        title: "خطأ في التحويل",
        description: "حدث خطأ أثناء تحويل العرض إلى فاتورة",
        variant: "destructive",
      });
    }
  };

  // Save quotation or invoice
  const saveQuotation = async () => {
    try {
      // Calculate totals
      const totals = calculateTotals();
      
      // Get current vehicle data (from selected vehicle or form inputs)
      const currentVehicle = selectedVehicle || editableVehicle || {
        id: Date.now(),
        manufacturer: vehicleManufacturer || "غير محدد",
        category: vehicleCategory || "غير محدد",
        trimLevel: vehicleTrimLevel || "",
        year: parseInt(vehicleYear) || new Date().getFullYear(),
        exteriorColor: vehicleExteriorColor || "",
        interiorColor: vehicleInteriorColor || "",
        chassisNumber: vehicleChassisNumber || "",
        engineCapacity: vehicleEngineCapacity || "",
        price: vehiclePrice || 0
      };
      
      // Prepare quotation data
      const quotationData = {
        quoteNumber: quoteNumber || generateQuoteNumber(),
        inventoryItemId: currentVehicle.id || null,
        manufacturer: currentVehicle.manufacturer || "غير محدد",
        category: currentVehicle.category || "غير محدد",
        trimLevel: currentVehicle.trimLevel || "",
        year: currentVehicle.year || new Date().getFullYear(),
        exteriorColor: currentVehicle.exteriorColor || "",
        interiorColor: currentVehicle.interiorColor || "",
        chassisNumber: currentVehicle.chassisNumber || "",
        engineCapacity: currentVehicle.engineCapacity || "",
        specifications: vehicleSpecs?.specifications || "",
        basePrice: pricingDetails.basePrice.toString(),
        finalPrice: totals.finalTotal.toString(),
        customerName: customerName || "عميل غير محدد",
        customerPhone: customerPhone || "",
        customerEmail: customerEmail || "",
        notes: notes || "",
        status: "مسودة",
        validityDays: validityDays || 30,
        createdBy: "system", // Should be current user
        companyData: JSON.stringify(selectedCompanyData || {}),
        representativeData: JSON.stringify(users.find((user: any) => user.id.toString() === selectedRepresentative) || {}),
        pricingDetails: JSON.stringify(pricingDetails),
        multiItems: multiItems.length > 0 ? JSON.stringify(multiItems) : null,
        qrCodeData: JSON.stringify({ quoteNumber: quoteNumber || generateQuoteNumber(), customerName: customerName || "عميل غير محدد", finalPrice: totals.finalTotal })
      };

      // Save as quotation or invoice based on mode
      let response;
      if (isInvoiceMode) {
        // Generate invoice number if not exists
        const newInvoiceNumber = invoiceNumber || generateInvoiceNumber();
        setInvoiceNumber(newInvoiceNumber);
        
        // Prepare invoice data
        const invoiceData = {
          ...quotationData,
          invoiceNumber: newInvoiceNumber,
          quoteNumber: quoteNumber,
          paymentStatus: "غير مدفوع",
          remainingAmount: totals.finalTotal.toString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          authorizationNumber: authorizationNumber || ""
        };
        
        // Save as invoice
        response = await apiRequest('POST', '/api/invoices', invoiceData);
        localStorage.setItem('lastInvoiceData', JSON.stringify(response));
      } else {
        // Check if we're editing existing quotation
        if (editingQuotation?.id) {
          // Update existing quotation
          response = await apiRequest('PUT', `/api/quotations/${editingQuotation.id}`, quotationData);
          localStorage.setItem('lastQuotationData', JSON.stringify(response));
        } else {
          // Create new quotation
          response = await apiRequest('POST', '/api/quotations', quotationData);
          localStorage.setItem('lastQuotationData', JSON.stringify(response));
        }
      }
      
      toast({
        title: "تم الحفظ بنجاح",
        description: `تم حفظ ${isInvoiceMode ? 'الفاتورة' : 'عرض السعر'} بنجاح`,
      });
      
    } catch (error) {
      console.error("Error saving quotation:", error);
      toast({
        title: "خطأ في الحفظ",
        description: `حدث خطأ أثناء حفظ ${isInvoiceMode ? 'الفاتورة' : 'عرض السعر'}`,
        variant: "destructive",
      });
    }
  };

  // Share via WhatsApp with PDF generation
  const shareViaWhatsApp = async () => {
    // Determine target phone number
    let targetNumber = "";
    
    if (selectedEmployee && sendToWorkNumber) {
      // Use employee's work number
      const selectedRep = users.find((user: any) => user.id.toString() === selectedEmployee);
      if (selectedRep && selectedRep.phoneNumber) {
        // Ensure number starts with +966 and remove leading 0
        const cleanPhone = selectedRep.phoneNumber.replace(/\D/g, '').replace(/^0/, '').replace(/^966/, '');
        targetNumber = `+966${cleanPhone}`;
      }
    } else {
      // Use custom entered number
      const cleanPhone = whatsappNumber.replace(/\D/g, '').replace(/^0/, '').replace(/^966/, '');
      targetNumber = `+966${cleanPhone}`;
    }

    if (!targetNumber || targetNumber === "+966") {
      toast({
        title: "خطأ",
        description: selectedEmployee && sendToWorkNumber ? "رقم عمل الموظف غير متوفر" : "يرجى إدخال رقم الواتساب",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate PDF first
      const quotationElement = document.querySelector('[data-pdf-export="quotation"]') as HTMLElement;
      if (!quotationElement) {
        toast({
          title: "خطأ",
          description: "لا يمكن العثور على معاينة عرض السعر",
          variant: "destructive",
        });
        return;
      }

      // Import html2canvas and jspdf dynamically
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // Generate canvas from the quotation
      const canvas = await html2canvas(quotationElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: quotationElement.scrollWidth,
        height: quotationElement.scrollHeight,
      });

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasAspectRatio = canvas.height / canvas.width;
      
      let finalWidth = pdfWidth;
      let finalHeight = pdfWidth * canvasAspectRatio;
      
      if (finalHeight > pdfHeight) {
        finalHeight = pdfHeight;
        finalWidth = pdfHeight / canvasAspectRatio;
      }
      
      const xOffset = (pdfWidth - finalWidth) / 2;
      const yOffset = (pdfHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
      
      // Convert PDF to blob
      const pdfBlob = pdf.output('blob');
      
      // Create file and share
      const fileName = `عرض-سعر-${quoteNumber}.pdf`;
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      const shareMessage = `السلام عليكم،
إليك عرض السعر الخاص بسيارة: ${editableVehicle?.manufacturer} ${editableVehicle?.category} موديل ${editableVehicle?.year}
السعر الإجمالي: ${(calculateTotals().finalTotal || 0).toLocaleString()} ريال

شكراً لثقتكم بنا ونأمل أن ينال العرض رضاكم.`;

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        // Use Web Share API if available (Works on Mobile to attach file)
        await navigator.share({
          title: `عرض سعر رقم: ${quoteNumber}`,
          text: shareMessage,
          files: [file]
        });
      } else {
        // Fallback for Desktop/Browsers that don't support file sharing
        // We MUST download the file and open WhatsApp with the text message
        // There is NO technical way to auto-attach a file in WhatsApp Web via URL
        
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Notify user that file is downloaded and they need to attach it
        toast({
          title: "تم تحميل الملف",
          description: "يرجى إرفاق ملف PDF المحمل في محادثة الواتساب التي ستفتح الآن",
          variant: "default",
        });

        // Open WhatsApp
        const cleanTarget = targetNumber.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/${cleanTarget}?text=${encodeURIComponent(shareMessage)}`;
        
        // Wait a bit for the download to start before opening WhatsApp
        setTimeout(() => {
          window.open(whatsappUrl, '_blank');
        }, 1000);
      }
      
      setShowWhatsappDialog(false);
      
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء ملف PDF ومشاركته عبر الواتساب",
        variant: "default",
      });
      
    } catch (error) {
      console.error('Error sharing via WhatsApp:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء مشاركة الملف",
        variant: "destructive",
      });
    }
  };

  // Handle saving terms and conditions
  const handleSaveTerms = async () => {
    try {
      const response = await apiRequest('POST', '/api/terms-conditions', {
        content: termsContent
      });
      
      toast({
        title: "تم بنجاح",
        description: "تم حفظ الشروط والأحكام بنجاح",
        variant: "default",
      });
      
      setShowTermsDialog(false);
      
      // Refresh terms in the preview component
      queryClient.invalidateQueries({ queryKey: ['/api/terms-conditions'] });
      
      // Trigger refresh of terms in preview component
      setTermsRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error saving terms:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الشروط والأحكام",
        variant: "destructive",
      });
    }
  };

  // Handle saving vehicle specifications from preview
  const handleSaveVehicleSpecs = async (newSpecs: string) => {
    if (!editableVehicle) {
      toast({
        title: "تنبيه",
        description: "يرجى اختيار سيارة أولاً لربط المواصفات بها",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, check if specifications already exist for this vehicle type
      const response = await fetch(
        `/api/specifications/${encodeURIComponent(editableVehicle.manufacturer)}/${encodeURIComponent(editableVehicle.category)}/${encodeURIComponent(editableVehicle.trimLevel || 'null')}/${editableVehicle.year}/${encodeURIComponent(editableVehicle.engineCapacity)}`
      );
      
      let existingSpec = null;
      if (response.ok) {
        existingSpec = await response.json();
      }

      const specData = {
        manufacturer: editableVehicle.manufacturer,
        category: editableVehicle.category,
        trimLevel: editableVehicle.trimLevel,
        year: parseInt(editableVehicle.year.toString()),
        engineCapacity: editableVehicle.engineCapacity,
        specifications: newSpecs,
        chassisNumber: editableVehicle.chassisNumber || null,
        specificationsEn: existingSpec?.specificationsEn || null
      };

      if (existingSpec && existingSpec.id) {
        // Update existing
        await apiRequest('PUT', `/api/vehicle-specifications/${existingSpec.id}`, specData);
      } else {
        // Create new
        await apiRequest('POST', '/api/vehicle-specifications', specData);
      }

      toast({
        title: "تم الحفظ بنجاح",
        description: "تم تحديث مواصفات السيارة وربطها ببيانات الطراز",
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ 
        queryKey: ['/api/specifications', editableVehicle.manufacturer, editableVehicle.category, editableVehicle.trimLevel, editableVehicle.year, editableVehicle.engineCapacity] 
      });
      
    } catch (error) {
      console.error("Error saving vehicle specs:", error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ مواصفات السيارة",
        variant: "destructive",
      });
    }
  };

  // Get terms and conditions for selected company
  const { data: companyTerms } = useQuery<TermsConditions[]>({
    queryKey: ["/api/terms", selectedCompanyData?.id],
    enabled: !!selectedCompanyData?.id,
  });

  // Get vehicle specifications
  const { data: specifications = [] } = useQuery<Specification[]>({
    queryKey: ["/api/specifications"],
    enabled: !!selectedVehicle
  });

  // Get manufacturer data with logo
  const { data: manufacturersWithLogo = [] } = useQuery<Array<{
    id: number;
    name: string;
    logo: string | null;
  }>>({
    queryKey: ["/api/manufacturers"],
    enabled: !!selectedVehicle
  });

  // Find manufacturer logo
  const manufacturerData = manufacturersWithLogo.find(m => m.name === selectedVehicle?.manufacturer);

  // Get vehicle specifications for selected vehicle
  const { data: vehicleSpecs, isLoading: specsLoading } = useQuery<Specification>({
    queryKey: ['/api/specifications', editableVehicle?.manufacturer, editableVehicle?.category, editableVehicle?.trimLevel, editableVehicle?.year, editableVehicle?.engineCapacity],
    enabled: !!editableVehicle,
    queryFn: async () => {
      if (!editableVehicle) return null;
      
      const response = await fetch(
        `/api/specifications/${editableVehicle.manufacturer}/${editableVehicle.category}/${editableVehicle.trimLevel || 'null'}/${editableVehicle.year}/${editableVehicle.engineCapacity}`
      );
      
      if (response.ok) {
        return response.json();
      }
      return null;
    }
  });

  // Query for vehicle specifications based on editingVehicleData (for editing dialog)
  const { data: editingVehicleSpecs, isLoading: editingSpecsLoading } = useQuery<Specification>({
    queryKey: ['/api/specifications', editingVehicleData.manufacturer, editingVehicleData.category, editingVehicleData.trimLevel, editingVehicleData.year, editingVehicleData.engineCapacity],
    enabled: !!(editingVehicleData.manufacturer && editingVehicleData.category && editingVehicleData.year && editingVehicleData.engineCapacity),
    queryFn: async () => {
      if (!editingVehicleData.manufacturer || !editingVehicleData.category || !editingVehicleData.year || !editingVehicleData.engineCapacity) return null;
      
      const response = await fetch(
        `/api/specifications/${editingVehicleData.manufacturer}/${editingVehicleData.category}/${editingVehicleData.trimLevel || 'null'}/${editingVehicleData.year}/${editingVehicleData.engineCapacity}`
      );
      
      if (response.ok) {
        return response.json();
      }
      return null;
    }
  });

  // Get all quotations for viewing
  const { data: quotations = [] } = useQuery({
    queryKey: ["/api/quotations"],
  });

  // Calculate pricing
  // Handle PDF download with high quality
  const handleDownloadPDF = async () => {
    try {
      setDownloadLoading(true);
      
      // Get the quotation preview element
      const element = document.querySelector('[data-pdf-export="quotation"]');
      if (!element) {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على معاينة العرض. تأكد من إدخال بيانات العرض أولاً.",
          variant: "destructive",
        });
        return;
      }

      // Check if element has content
      if (element.children.length === 0) {
        toast({
          title: "خطأ",
          description: "معاينة العرض فارغة. تأكد من إدخال بيانات السيارة والعميل.",
          variant: "destructive",
        });
        return;
      }

      // Wait for all images and fonts to load
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });

      // Hide all interactive elements before PDF generation
      const interactiveElements = element.querySelectorAll('button, .print\\:hidden, .no-print, [data-html2canvas-ignore]');
      const originalDisplayValues: string[] = [];
      const originalVisibilityValues: string[] = [];
      
      interactiveElements.forEach((el, index) => {
        const htmlEl = el as HTMLElement;
        originalDisplayValues[index] = htmlEl.style.display;
        originalVisibilityValues[index] = htmlEl.style.visibility;
        htmlEl.style.display = 'none';
        htmlEl.style.visibility = 'hidden';
      });

      // Make sure main element is visible during capture
      const originalDisplay = (element as HTMLElement).style.display;
      const originalVisibility = (element as HTMLElement).style.visibility;
      (element as HTMLElement).style.display = 'block';
      (element as HTMLElement).style.visibility = 'visible';
      
      // Create canvas with improved settings
      const canvas = await html2canvas(element as HTMLElement, {
        scale: 2, // Balanced quality and performance
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true, // Enable logging for debugging
        imageTimeout: 15000, // Longer timeout for images
        foreignObjectRendering: false, // Disable for better compatibility
        removeContainer: false,
        height: element.scrollHeight,
        width: element.scrollWidth,
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        ignoreElements: (element) => {
          return element.classList?.contains('no-print') || 
                 element.classList?.contains('print:hidden') ||
                 element.hasAttribute('data-html2canvas-ignore') ||
                 element.tagName === 'BUTTON';
        }
      });

      // Restore original display properties
      (element as HTMLElement).style.display = originalDisplay;
      (element as HTMLElement).style.visibility = originalVisibility;
      
      // Restore interactive elements display properties
      interactiveElements.forEach((el, index) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.display = originalDisplayValues[index] || '';
        htmlEl.style.visibility = originalVisibilityValues[index] || '';
      });

      // Check if canvas was created successfully
      if (canvas.width === 0 || canvas.height === 0) {
        toast({
          title: "خطأ في إنشاء PDF",
          description: "فشل في تحويل العرض إلى صورة. حاول مرة أخرى.",
          variant: "destructive",
        });
        return;
      }
      
      // Create PDF with exact A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      // Calculate proper scaling for A4
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasAspectRatio = canvas.height / canvas.width;
      
      let finalWidth = pdfWidth;
      let finalHeight = pdfWidth * canvasAspectRatio;
      
      // If height exceeds page, scale down
      if (finalHeight > pdfHeight) {
        finalHeight = pdfHeight;
        finalWidth = pdfHeight / canvasAspectRatio;
      }
      
      // Center the content
      const xOffset = (pdfWidth - finalWidth) / 2;
      const yOffset = (pdfHeight - finalHeight) / 2;
      
      // Convert canvas to high-quality image
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Add image to PDF with proper scaling
      pdf.addImage(
        imgData,
        'PNG',
        xOffset,
        yOffset,
        finalWidth,
        finalHeight
      );
      
      // Generate filename with Arabic support
      const vehicleInfo = selectedVehicle || editableVehicle;
      const timestamp = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
      const filename = `عرض_سعر_${vehicleInfo?.manufacturer || 'البريمي'}_${vehicleInfo?.category || 'سيارة'}_${timestamp}.pdf`;
      
      // Save PDF
      pdf.save(filename);
      
      toast({
        title: "تم التحميل بنجاح",
        description: "تم تحميل العرض بجودة عالية مع إخفاء جميع الأزرار التفاعلية",
      });
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "خطأ في التحميل",
        description: "حدث خطأ أثناء تحميل العرض",
        variant: "destructive",
      });
    } finally {
      setDownloadLoading(false);
    }
  };
  
  // Handle print quotation - direct content printing
  const handlePrintQuotation = () => {
    try {
      // Find the quotation preview element
      const previewElement = document.querySelector('[data-pdf-export="quotation"]');
      if (!previewElement) {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على معاينة العرض للطباعة",
          variant: "destructive",
        });
        return;
      }

      // Get the HTML content of the quotation
      const quotationHTML = previewElement.outerHTML;
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        toast({
          title: "خطأ",
          description: "لا يمكن فتح نافذة الطباعة. يرجى السماح للنوافذ المنبثقة",
          variant: "destructive",
        });
        return;
      }

      // Write the content to the new window
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>عرض السعر - طباعة</title>
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box;
            }
            
            html, body {
              margin: 0;
              padding: 0;
              font-family: 'Noto Sans Arabic', Arial, sans-serif;
              direction: rtl;
              background: white;
              color: black;
              width: 100%;
              height: 100%;
              overflow: hidden;
            }
            
            body {
              display: flex;
              justify-content: center;
              align-items: flex-start;
              min-height: 100vh;
            }
            
            [data-pdf-export="quotation"] {
              width: 210mm !important;
              min-height: 297mm !important;
              max-height: 297mm !important;
              margin: 0 auto !important;
              padding: 15mm !important;
              background-size: cover !important;
              background-repeat: no-repeat !important;
              background-position: center !important;
              overflow: visible !important;
              position: relative !important;
              box-shadow: none !important;
              border: none !important;
              box-sizing: border-box !important;
            }
            
            /* Hide interactive elements */
            button, .print\\:hidden, .no-print, .mb-4 {
              display: none !important;
              visibility: hidden !important;
            }
            
            /* Ensure all text is black and visible */
            * {
              color: black !important;
            }
            
            /* Specific text elements */
            h1, h2, h3, h4, h5, h6, p, span, div {
              color: black !important;
            }
            
            /* Preserve images with proper sizing */
            img {
              max-width: 100%;
              height: auto;
              display: block;
            }
            
            /* Company stamp specific sizing */
            img[alt*="ختم"], .company-stamp {
              width: 42mm !important;
              height: 42mm !important;
              max-width: 42mm !important;
              max-height: 42mm !important;
              object-fit: contain !important;
            }
            
            /* Table styles with proper borders */
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 10px 0;
            }
            
            td, th {
              border: 1px solid white !important;
              padding: 8px !important;
              text-align: center !important;
              color: black !important;
              background-color: transparent !important;
            }
            
            /* Grid layouts */
            .grid {
              display: grid !important;
            }
            
            .grid-cols-1 { grid-template-columns: 1fr !important; }
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr) !important; }
            .grid-cols-3 { grid-template-columns: repeat(3, 1fr) !important; }
            .grid-cols-4 { grid-template-columns: repeat(4, 1fr) !important; }
            .grid-cols-5 { grid-template-columns: repeat(5, 1fr) !important; }
            .grid-cols-10 { grid-template-columns: repeat(10, 1fr) !important; }
            
            /* Ensure grid items align properly */
            .grid > * {
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              padding: 4px !important;
            }
            
            /* Spacing utilities */
            .gap-1 { gap: 0.25rem !important; }
            .gap-2 { gap: 0.5rem !important; }
            .gap-4 { gap: 1rem !important; }
            .gap-6 { gap: 1.5rem !important; }
            
            /* Padding utilities */
            .p-1 { padding: 0.25rem !important; }
            .p-2 { padding: 0.5rem !important; }
            .p-3 { padding: 0.75rem !important; }
            .p-4 { padding: 1rem !important; }
            .p-6 { padding: 1.5rem !important; }
            .p-8 { padding: 2rem !important; }
            
            /* Margin utilities */
            .m-0 { margin: 0 !important; }
            .mb-1 { margin-bottom: 0.25rem !important; }
            .mb-2 { margin-bottom: 0.5rem !important; }
            .mb-4 { margin-bottom: 1rem !important; }
            .mb-6 { margin-bottom: 1.5rem !important; }
            .mb-8 { margin-bottom: 2rem !important; }
            .mt-2 { margin-top: 0.5rem !important; }
            .mt-4 { margin-top: 1rem !important; }
            .mt-6 { margin-top: 1.5rem !important; }
            .mt-8 { margin-top: 2rem !important; }
            
            /* Text alignment */
            .text-center { text-align: center !important; }
            .text-right { text-align: right !important; }
            .text-left { text-align: left !important; }
            
            /* Font weights */
            .font-bold { font-weight: bold !important; }
            .font-semibold { font-weight: 600 !important; }
            .font-medium { font-weight: 500 !important; }
            
            /* Font sizes */
            .text-xs { font-size: 0.75rem !important; }
            .text-sm { font-size: 0.875rem !important; }
            .text-base { font-size: 1rem !important; }
            .text-lg { font-size: 1.125rem !important; }
            .text-xl { font-size: 1.25rem !important; }
            .text-2xl { font-size: 1.5rem !important; }
            .text-3xl { font-size: 1.875rem !important; }
            .text-4xl { font-size: 2.25rem !important; }
            
            /* Flexbox utilities */
            .flex { display: flex !important; }
            .flex-col { flex-direction: column !important; }
            .items-center { align-items: center !important; }
            .justify-center { justify-content: center !important; }
            .justify-between { justify-content: space-between !important; }
            
            /* Width and height utilities */
            .w-full { width: 100% !important; }
            .h-full { height: 100% !important; }
            
            /* Background utilities */
            .bg-white { background-color: white !important; }
            .bg-gray-50 { background-color: #f9fafb !important; }
            .bg-transparent { background-color: transparent !important; }
            
            /* Border utilities */
            .border { border: 1px solid #d1d5db !important; }
            .border-white { border-color: white !important; }
            .rounded { border-radius: 0.375rem !important; }
            .rounded-lg { border-radius: 0.5rem !important; }
            
            /* Shadow utilities */
            .shadow { box-shadow: none !important; }
            .shadow-lg { box-shadow: none !important; }
            
            /* Content scaling and positioning fixes */
            [data-pdf-export="quotation"] > * {
              max-width: 100% !important;
              page-break-inside: avoid !important;
            }
            
            /* Ensure footer content stays visible */
            [data-pdf-export="quotation"] .absolute {
              position: relative !important;
            }
            
            /* Fix any overflow issues */
            [data-pdf-export="quotation"] .overflow-hidden {
              overflow: visible !important;
            }
            
            /* Ensure proper spacing for different sections */
            [data-pdf-export="quotation"] > div {
              margin-bottom: 10px !important;
            }
            
            /* Company stamp positioning */
            [data-pdf-export="quotation"] img[alt*="ختم"] {
              margin: 10px auto !important;
              display: block !important;
            }
          </style>
        </head>
        <body>
          ${quotationHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 1500);
            };
          </script>
        </body>
        </html>
      `);

      printWindow.document.close();

      toast({
        title: "جاري الطباعة",
        description: "تم فتح نافذة الطباعة مع عرض السعر",
      });

    } catch (error) {
      console.error('Error printing quotation:', error);
      toast({
        title: "خطأ في الطباعة",
        description: "حدث خطأ أثناء تحضير العرض للطباعة",
        variant: "destructive",
      });
    }
  };

  const calculateTotals = () => {
    // If multi-vehicle mode, calculate based on multi-items
    if (isMultiVehicleMode && multiItems.length > 0) {
      const itemsBaseTotal = multiItems.reduce((sum, item) => sum + ((item.unitPrice || item.price || 0) * (item.quantity || 1)), 0);
      const licensePlateTotal = multiItems.reduce((sum, item) => sum + (item.licensePlatePrice || 0), 0);
      const taxAmount = multiItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
      const finalTotal = multiItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      
      return {
        basePrice: itemsBaseTotal,
        subtotal: itemsBaseTotal,
        licensePlateTotal,
        taxAmount,
        finalTotal
      };
    }

    const basePrice = pricingDetails.basePrice * pricingDetails.quantity;
    const licensePlateTotal = pricingDetails.includeLicensePlate ? (pricingDetails.licensePlatePrice * pricingDetails.quantity) : 0;
    
    let taxableAmount = basePrice;
    if (pricingDetails.includeLicensePlate && pricingDetails.licensePlateSubjectToTax) {
      taxableAmount += licensePlateTotal;
    }
    
    let taxAmount = 0;
    let finalTotal = 0;
    
    if (pricingDetails.isVATInclusive) {
      taxAmount = (taxableAmount * pricingDetails.taxRate) / (100 + pricingDetails.taxRate);
      finalTotal = basePrice + licensePlateTotal;
    } else {
      taxAmount = (taxableAmount * pricingDetails.taxRate) / 100;
      finalTotal = basePrice + licensePlateTotal + taxAmount;
    }
    
    return {
      basePrice,
      subtotal: basePrice,
      taxAmount,
      finalTotal,
      licensePlateTotal
    };
  };

  // Update editable vehicle when selected vehicle changes
  React.useEffect(() => {
    if (selectedVehicle) {
      setEditableVehicle(selectedVehicle);
      setPricingDetails(prev => ({ ...prev, basePrice: Number(selectedVehicle.price) || 0 }));
    }
  }, [selectedVehicle]);

  // Initialize editing vehicle data when vehicle edit dialog opens
  React.useEffect(() => {
    if (vehicleEditOpen && editableVehicle) {
      setEditingVehicleData({
        manufacturer: editableVehicle.manufacturer || "",
        category: editableVehicle.category || "",
        trimLevel: editableVehicle.trimLevel || "",
        year: editableVehicle.year?.toString() || "",
        engineCapacity: editableVehicle.engineCapacity || "",
        exteriorColor: editableVehicle.exteriorColor || "",
        interiorColor: editableVehicle.interiorColor || "",
        chassisNumber: editableVehicle.chassisNumber || "",
        price: Number(editableVehicle.price) || 0
      });
    }
  }, [vehicleEditOpen, editableVehicle]);

  // Create quotation mutation
  const createQuotationMutation = useMutation({
    mutationFn: async (data: InsertQuotation) => {
      const res = await apiRequest('POST', '/api/quotations', data);
      return await res.json();
    },
    onSuccess: (response: any) => {
      toast({
        title: "تم حفظ عرض السعر",
        description: "تم حفظ عرض السعر بنجاح ويمكنك الآن رؤيته في صفحة العروض",
      });
      // Invalidate quotations cache to refresh the quotations list
      queryClient.invalidateQueries({ queryKey: ['/api/quotations'] });
      queryClient.refetchQueries({ queryKey: ['/api/quotations'] });
      
      // Set the saved quotation for preview
      if (response.id) {
        // Store the quotation ID for future reference
        localStorage.setItem('lastSavedQuotationId', response.id.toString());
      }
    },
    onError: (error) => {
      toast({
        title: "خطأ في حفظ عرض السعر",
        description: "حدث خطأ أثناء حفظ عرض السعر. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  });

  // Create invoice mutation 
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/invoices', data);
      return await res.json();
    },
    onSuccess: (response: any) => {
      toast({
        title: "تم حفظ الفاتورة",
        description: "تم حفظ الفاتورة بنجاح ويمكنك الآن رؤيتها في صفحة الفواتير",
      });
      // Invalidate invoices cache to refresh the invoices list
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.refetchQueries({ queryKey: ['/api/invoices'] });
      
      // Set the saved invoice for preview
      if (response.id) {
        localStorage.setItem('lastSavedInvoiceId', response.id.toString());
      }
    },
    onError: (error) => {
      toast({
        title: "خطأ في حفظ الفاتورة",
        description: "حدث خطأ أثناء حفظ الفاتورة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  });

  const handleSaveQuotation = () => {
    if (!editableVehicle) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى التأكد من اختيار السيارة",
        variant: "destructive",
      });
      return;
    }

    const totals = calculateTotals();
    
    // Get selected representative and company data (use defaults if not selected)
    const selectedRepData = users.find((user: any) => user.id.toString() === selectedRepresentative) || {
      id: "",
      name: "",
      phone: "",
      email: "",
      position: ""
    };
    const selectedCompanyData = companies.find(comp => comp.id.toString() === selectedCompany) || {
      id: 0,
      name: "",
      logo: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      taxNumber: "",
      primaryColor: "#1a73e8",
      secondaryColor: "#34a853",
      isActive: true
    };

    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + validityDays);

    // Format detailed specifications for the quotation
    const formatSpecifications = () => {
      if (!vehicleSpecs) return "";
      
      const specs = [];
      const s = vehicleSpecs as any;
      if (s.engine) specs.push(`المحرك: ${s.engine}`);
      if (s.transmission) specs.push(`ناقل الحركة: ${s.transmission}`);
      if (s.drivetrain) specs.push(`نظام الدفع: ${s.drivetrain}`);
      if (s.fuelType) specs.push(`نوع الوقود: ${s.fuelType}`);
      if (s.fuelCapacity) specs.push(`سعة خزان الوقود: ${s.fuelCapacity}`);
      if (s.seatingCapacity) specs.push(`عدد المقاعد: ${s.seatingCapacity}`);
      if (s.wheelbase) specs.push(`قاعدة العجلات: ${s.wheelbase}`);
      if (s.length) specs.push(`الطول: ${s.length}`);
      if (s.width) specs.push(`العرض: ${s.width}`);
      if (s.height) specs.push(`الارتفاع: ${s.height}`);
      if (s.groundClearance) specs.push(`المسافة من الأرض: ${s.groundClearance}`);
      if (s.curbWeight) specs.push(`الوزن الفارغ: ${s.curbWeight}`);
      if (s.maxSpeed) specs.push(`السرعة القصوى: ${s.maxSpeed}`);
      if (s.acceleration) specs.push(`التسارع 0-100: ${s.acceleration}`);
      if (s.safetyFeatures) specs.push(`مميزات الأمان: ${s.safetyFeatures}`);
      if (s.infotainment) specs.push(`نظام المعلومات والترفيه: ${s.infotainment}`);
      if (s.connectivity) specs.push(`الاتصال: ${s.connectivity}`);
      if (s.driverAssistance) specs.push(`مساعدة السائق: ${s.driverAssistance}`);
      if (s.comfortFeatures) specs.push(`مميزات الراحة: ${s.comfortFeatures}`);
      if (s.exteriorFeatures) specs.push(`مميزات خارجية: ${s.exteriorFeatures}`);
      if (s.interiorFeatures) specs.push(`مميزات داخلية: ${s.interiorFeatures}`);
      if (s.wheelsTires) specs.push(`العجلات والإطارات: ${s.wheelsTires}`);
      if (s.suspension) specs.push(`نظام التعليق: ${s.suspension}`);
      if (s.brakes) specs.push(`نظام الفرامل: ${s.brakes}`);
      if (s.warranty) specs.push(`الضمان: ${s.warranty}`);
      if (s.notes) specs.push(`ملاحظات: ${s.notes}`);
      
      return specs.join(' • ');
    };

    if (isInvoiceMode) {
      // Save as invoice
      const invoiceData = {
        quoteNumber,
        invoiceNumber: invoiceNumber || generateInvoiceNumber(),
        inventoryItemId: editableVehicle.id || 0,
        manufacturer: editableVehicle.manufacturer,
        category: editableVehicle.category,
        trimLevel: editableVehicle.trimLevel || "",
        year: editableVehicle.year,
        exteriorColor: editableVehicle.exteriorColor,
        interiorColor: editableVehicle.interiorColor,
        chassisNumber: editableVehicle.chassisNumber,
        engineCapacity: editableVehicle.engineCapacity,
        specifications: formatSpecifications(),
        basePrice: pricingDetails.basePrice.toString() || "0",
        finalPrice: totals.finalTotal.toString() || "0",
        customerName: customerName.trim() || "غير محدد",
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        customerTitle: customerTitle.trim(),
        notes: notes.trim(),
        validUntil: validUntilDate.toISOString(),
        status: "مسودة",
        paymentStatus: "غير مدفوع",
        remainingAmount: totals.finalTotal.toString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: "admin",
        companyData: JSON.stringify(selectedCompanyData),
        representativeData: JSON.stringify(selectedRepData),
        quoteAppearance: JSON.stringify(quoteAppearance),
        pricingDetails: JSON.stringify({
          ...pricingDetails,
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          finalTotal: totals.finalTotal,
          licensePlateTotal: totals.licensePlateTotal
        }),
        qrCodeData: `Invoice: ${invoiceNumber}\nCustomer: ${customerName || 'عميل غير محدد'}\nVehicle: ${(editableVehicle as any)?.manufacturer || 'غير محدد'} ${(editableVehicle as any)?.category || 'غير محدد'}${(editableVehicle as any)?.trimLevel ? ' ' + (editableVehicle as any).trimLevel : ''}\nTotal: ${totals.finalTotal.toLocaleString()} SAR\nDate: ${new Date().toLocaleDateString('en-GB')}`
      };

      // Save invoice when in invoice mode
      createInvoiceMutation.mutate(invoiceData);
    } else {
      // Save as quotation
      const quotationData: InsertQuotation = {
        quoteNumber,
        inventoryItemId: editableVehicle.id || 0,
        manufacturer: editableVehicle.manufacturer,
        category: editableVehicle.category,
        trimLevel: editableVehicle.trimLevel || "",
        year: editableVehicle.year,
        exteriorColor: editableVehicle.exteriorColor,
        interiorColor: editableVehicle.interiorColor,
        chassisNumber: editableVehicle.chassisNumber,
        engineCapacity: editableVehicle.engineCapacity,
        specifications: formatSpecifications(),
        basePrice: pricingDetails.basePrice.toString() || "0",
        finalPrice: totals.finalTotal.toString() || "0",
        customerName: customerName.trim() || "غير محدد",
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        customerTitle: customerTitle.trim(),
        notes: notes.trim(),
        validUntil: validUntilDate.toISOString(),
        status: "مسودة",
        createdBy: "admin", // This should be the current user
        companyData: JSON.stringify(selectedCompanyData),
        representativeData: JSON.stringify(selectedRepData),
        quoteAppearance: JSON.stringify(quoteAppearance),
        pricingDetails: JSON.stringify({
          ...pricingDetails,
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          finalTotal: totals.finalTotal,
          licensePlateTotal: totals.licensePlateTotal
        }),
        qrCodeData: `Quote: ${quoteNumber}\nCustomer: ${customerName || 'عميل غير محدد'}\nVehicle: ${editableVehicle?.manufacturer || 'غير محدد'} ${editableVehicle?.category || 'غير محدد'}${editableVehicle?.trimLevel ? ' ' + editableVehicle.trimLevel : ''}\nTotal: ${totals.finalTotal.toLocaleString()} SAR\nDate: ${new Date().toLocaleDateString('en-GB')}`
  };

      createQuotationMutation.mutate(quotationData);
    }
  };



  return (
    <SystemGlassWrapper>
    <div className="relative min-h-screen">
      {/* Watermark */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Ctext x='200' y='100' text-anchor='middle' dominant-baseline='central' fill='white' font-size='24' font-weight='bold' transform='rotate(-45 200 100)'%3E%D8%A7%D9%84%D8%A8%D8%B1%D9%8A%D9%85%D9%8A %D9%84%D9%84%D8%B3%D9%8A%D8%A7%D8%B1%D8%A7%D8%AA%3C/text%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '300px 150px'
      }}></div>
      {/* Header & Management Navbar */}
      <GlassBackground variant="header" className="glass-header sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <h1 className="text-xl font-bold text-white drop-shadow-lg">إنشاء عرض سعر</h1>
            </div>
            
            {/* Management Actions Navbar */}
            <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-2">
              {/* Saved Quotations */}
              <Link href="/quotation-management">
                <Button
                  variant="outline"
                  size="sm"
                  className="glass-button border-blue-500/50 text-blue-300 hover:bg-blue-500/20 bg-white/10"
                >
                  <FileText size={16} className="ml-2" />
                  العروض المحفوظة
                </Button>
              </Link>

              {/* Terms and Conditions */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTermsDialog(true)}
                className="glass-button border-orange-500/50 text-orange-300 hover:bg-orange-500/20 bg-white/10"
              >
                <Settings2 size={16} className="ml-2" />
                شروط وأحكام
              </Button>

              {/* Customize Layout */}
              <Button
                variant="outline"
                size="sm"
                onClick={openLayoutDialog}
                data-testid="button-customize-layout"
                className="glass-button border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20 bg-white/10"
              >
                <LayoutGrid size={16} className="ml-2" />
                تخصيص التخطيط
              </Button>
              
              {/* Save Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveQuotation}
                disabled={createQuotationMutation.isPending}
                className="glass-button border-green-500/50 text-green-300 hover:bg-green-500/20 bg-white/10"
              >
                <Save size={16} className="ml-2" />
                {createQuotationMutation.isPending ? "جاري الحفظ..." : `حفظ ${isInvoiceMode ? "الفاتورة" : "العرض"}`}
              </Button>
              
              {/* WhatsApp Share */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (customerPhone && customerPhone.trim()) {
                    const cleanPhone = customerPhone.replace(/\D/g, '').replace(/^0/, '').replace(/^966/, '');
                    setWhatsappNumber('+966' + cleanPhone);
                  }
                  setShowWhatsappDialog(true);
                }}
                className="glass-button border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/20 bg-white/10"
              >
                <MessageCircle size={16} className="ml-2" />
                مشاركة واتساب
              </Button>

              {/* Toggles */}
              <div className="flex items-center gap-4 bg-white/5 p-1.5 rounded-lg border border-white/10">
                {/* Stamp Toggle */}
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-9 h-5 rounded-full cursor-pointer relative transition-all duration-300 ${
                      showStamp ? 'bg-red-500' : 'bg-red-300/50'
                    }`}
                    onClick={() => setShowStamp(!showStamp)}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-300 ${showStamp ? 'right-0.5' : 'right-4.5'}`} />
                  </div>
                  <span className="text-xs text-red-300">الختم</span>
                </div>

                {/* Invoice Mode Toggle */}
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-9 h-5 rounded-full cursor-pointer relative transition-all duration-300 ${
                      isInvoiceMode ? 'bg-purple-600' : 'bg-purple-300/50'
                    }`}
                    onClick={() => setIsInvoiceMode(!isInvoiceMode)}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-300 ${isInvoiceMode ? 'right-0.5' : 'right-4.5'}`} />
                  </div>
                  <span className="text-xs text-purple-300">فاتورة</span>
                </div>

                {/* Representative Toggle */}
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-9 h-5 rounded-full cursor-pointer relative transition-all duration-300 ${
                      showRepresentative ? 'bg-blue-600' : 'bg-blue-300/50'
                    }`}
                    onClick={() => setShowRepresentative(!showRepresentative)}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-300 ${showRepresentative ? 'right-0.5' : 'right-4.5'}`} />
                  </div>
                  <span className="text-xs text-blue-300">المندوب</span>
                </div>
              </div>

              {/* Export Button */}
              <EnhancedPDFExport
                targetElementId="quotation"
                filename={`عرض_سعر_${authorizationNumber || quoteNumber || generateQuoteNumber()}`}
                showJPGExport={true}
                showPDFExport={true}
                showPrintButton={true}
              />
            </div>
          </div>
        </div>
      </GlassBackground>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Customer Information Card - Now at the Top */}
        <div data-section-id="customer" style={sectionStyle("customer")}>
        <GlassBackground variant="container" className="glass-container">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white drop-shadow-md mb-4 flex items-center">
              <UserIcon className="ml-2" size={20} />
              {isInvoiceMode ? "تخويل الفاتورة" : "بيانات العميل"}
            </h3>
            <div className="space-y-4">
              {isInvoiceMode ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="invoiceNumber" className="text-white/90">رقم الفاتورة</Label>
                    <Input id="invoiceNumber" value={invoiceNumber} readOnly className="glass-input bg-white/10 border-white/20 text-white" />
                  </div>
                  <div>
                    <Label htmlFor="quoteReference" className="text-white/90">رقم عرض السعر المرجعي</Label>
                    <Input id="quoteReference" value={quoteNumber} readOnly className="glass-input bg-white/10 border-white/20 text-white" />
                  </div>
                  <div>
                    <Label htmlFor="authorizationNumber" className="text-white/90">رقم التعميد</Label>
                    <Input id="authorizationNumber" value={authorizationNumber} onChange={(e) => setAuthorizationNumber(e.target.value)} className="glass-input bg-white/10 border-white/20 text-white" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="customerName" className="text-white/90">اسم العميل *</Label>
                    <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="glass-input bg-white/10 border-white/20 text-white" />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone" className="text-white/90">رقم الهاتف</Label>
                    <Input id="customerPhone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="glass-input bg-white/10 border-white/20 text-white" />
                  </div>
                  <div>
                    <Label htmlFor="customerTitle" className="text-white/90">اللقب</Label>
                    <Select value={customerTitle} onValueChange={setCustomerTitle}>
                      <SelectTrigger className="glass-input bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="السادة">السادة</SelectItem>
                        <SelectItem value="السيد">السيد</SelectItem>
                        <SelectItem value="السيدة">السيدة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white/90">المندوب</Label>
                    <Select value={selectedRepresentative} onValueChange={setSelectedRepresentative}>
                      <SelectTrigger className="glass-input bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="اختر المندوب" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user: any) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </GlassBackground>
        </div>

        {/* Combined Vehicle & Pricing Section */}
        <div data-section-id="vehicle" style={sectionStyle("vehicle")}>
        <div className="grid grid-cols-1 gap-6">
          {/* Vehicle Selection */}
          <GlassBackground variant="container" className="glass-container w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <h3 className="text-lg font-semibold text-white drop-shadow-md flex items-center">
                  <Car className="ml-2" size={20} />
                  بيانات السيارة
                </h3>
                
                <div className="flex items-center gap-4 bg-white/5 p-1.5 rounded-lg border border-white/10">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${!isMultiVehicleMode ? 'text-blue-400 font-bold' : 'text-white/60'}`}>عرض فردي</span>
                    <Switch 
                      checked={isMultiVehicleMode} 
                      onCheckedChange={(val) => {
                        setIsMultiVehicleMode(val);
                        if (!val) setMultiItems([]);
                      }} 
                    />
                    <span className={`text-xs ${isMultiVehicleMode ? 'text-blue-400 font-bold' : 'text-white/60'}`}>عرض متعدد</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* Manufacturer */}
                  <div>
                    <Label className="text-white/90">الصانع</Label>
                    <Combobox
                      options={manufacturers.map(m => ({
                        label: m.nameAr,
                        value: m.nameAr,
                        logo: m.logo
                      }))}
                      value={vehicleManufacturer}
                      onValueChange={setVehicleManufacturer}
                      placeholder="اختر الصانع"
                      searchPlaceholder="بحث عن الصانع..."
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  {/* Category */}
                  <div>
                    <Label className="text-white/90">الفئة</Label>
                    <Combobox
                      options={categories.map(c => ({
                        label: c.nameAr,
                        value: c.nameAr
                      }))}
                      value={vehicleCategory}
                      onValueChange={setVehicleCategory}
                      disabled={!vehicleManufacturer}
                      placeholder="اختر الفئة"
                      searchPlaceholder="بحث عن الفئة..."
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  {/* Trim Level */}
                  <div>
                    <Label className="text-white/90">درجة التجهيز</Label>
                    <Combobox
                      options={trimLevels.map(t => ({
                        label: t.nameAr,
                        value: t.nameAr
                      }))}
                      value={vehicleTrimLevel}
                      onValueChange={setVehicleTrimLevel}
                      disabled={!vehicleCategory}
                      placeholder="اختر درجة التجهيز"
                      searchPlaceholder="بحث عن درجة التجهيز..."
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  {/* Year */}
                  <div>
                    <Label className="text-white/90">السنة</Label>
                    <Combobox
                      options={vehicleYears.map(y => ({
                        label: y.toString(),
                        value: y.toString()
                      }))}
                      value={vehicleYear}
                      onValueChange={setVehicleYear}
                      placeholder="اختر السنة"
                      searchPlaceholder="بحث عن سنة..."
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  {/* Engine Capacity */}
                  <div>
                    <Label className="text-white/90">سعة المحرك</Label>
                    <Combobox
                      options={engineCapacities.map(e => ({
                        label: e,
                        value: e
                      }))}
                      value={vehicleEngineCapacity}
                      onValueChange={setVehicleEngineCapacity}
                      placeholder="اختر سعة المحرك"
                      searchPlaceholder="بحث عن سعة..."
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  {/* Exterior Color */}
                  <div>
                    <Label className="text-white/90">اللون الخارجي</Label>
                    <Input 
                      value={vehicleExteriorColor} 
                      onChange={(e) => setVehicleExteriorColor(e.target.value)}
                      className="glass-input bg-white/10 border-white/20 text-white"
                      placeholder="أدخل اللون الخارجي"
                    />
                  </div>
                  {/* Interior Color */}
                  <div>
                    <Label className="text-white/90">اللون الداخلي</Label>
                    <Input 
                      value={vehicleInteriorColor} 
                      onChange={(e) => setVehicleInteriorColor(e.target.value)}
                      className="glass-input bg-white/10 border-white/20 text-white"
                      placeholder="أدخل اللون الداخلي"
                    />
                  </div>
                  {/* Chassis Number */}
                  <div>
                    <Label className="text-white/90">رقم الهيكل</Label>
                    <Input 
                      value={vehicleChassisNumber} 
                      onChange={(e) => setVehicleChassisNumber(e.target.value)}
                      className="glass-input bg-white/10 border-white/20 text-white"
                      placeholder="أدخل رقم الهيكل"
                    />
                  </div>
                  {/* Price Field (Synced with Pricing) */}
                  <div>
                    <Label className="text-white/90">السعر</Label>
                    <Input 
                      type="text" 
                      value={vehiclePrice} 
                      onChange={(e) => {
                        const valStr = convertArabicToEnglishNumerals(e.target.value);
                        const val = parseFloat(valStr) || 0;
                        setVehiclePrice(val);
                        setPricingDetails(prev => ({ ...prev, basePrice: val }));
                      }}
                      className="glass-input bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  {/* Pricing Fields Moved Here */}
                  <div>
                    <Label className="text-white/90">الكمية</Label>
                    <Input 
                      type="text" 
                      value={pricingDetails.quantity} 
                      onChange={(e) => {
                        const val = convertArabicToEnglishNumerals(e.target.value);
                        setPricingDetails(prev => ({ ...prev, quantity: parseInt(val) || 1 }));
                      }}
                      className="glass-input bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white/90">الضريبة (%)</Label>
                    <Input 
                      type="text" 
                      value={pricingDetails.taxRate} 
                      onChange={(e) => {
                        const val = convertArabicToEnglishNumerals(e.target.value);
                        setPricingDetails(prev => ({ ...prev, taxRate: parseFloat(val) || 0 }));
                      }}
                      className="glass-input bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white/90">سعر اللوحات</Label>
                    <Input 
                      type="text" 
                      value={pricingDetails.licensePlatePrice} 
                      onChange={(e) => {
                        const val = convertArabicToEnglishNumerals(e.target.value);
                        setPricingDetails(prev => ({ ...prev, licensePlatePrice: parseFloat(val) || 0 }));
                      }}
                      className="glass-input bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  
                  <div className="flex flex-col justify-center gap-2">
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={pricingDetails.includeLicensePlate} 
                        onCheckedChange={(val) => setPricingDetails(prev => ({ ...prev, includeLicensePlate: val }))} 
                      />
                      <span className="text-sm text-white/90">إضافة اللوحات</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={pricingDetails.isVATInclusive} 
                        onCheckedChange={(val) => setPricingDetails(prev => ({ ...prev, isVATInclusive: val }))} 
                      />
                      <span className="text-sm text-white/90">شامل الضريبة</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                  <Button 
                    onClick={() => setVehicleDescriptionOpen(true)}
                    variant="outline" 
                    className="glass-button border-white/20 text-white px-8"
                  >
                    <Search size={16} className="ml-2" />
                    البحث في المخزون
                  </Button>

                  {isMultiVehicleMode && (
                    <Button 
                      onClick={addVehicleToMultiItems}
                      className="bg-[#C49632] hover:bg-[#A67C2A] text-white px-8"
                    >
                      <Plus size={16} className="ml-2" />
                      إضافة السيارة للجدول
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </GlassBackground>

          {/* Multi-Vehicle Controller Section */}
          {isMultiVehicleMode && multiItems.length > 0 && (
            <GlassBackground variant="container" className="glass-container w-full mt-6">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-6">
                    <h3 className="text-lg font-semibold text-white drop-shadow-md flex items-center">
                      <Package className="ml-2" size={20} />
                      قائمة السيارات في العرض ({multiItems.length})
                    </h3>
                    
                    {/* Column Controller */}
                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
                      <span className="text-[10px] text-white/40 px-2">إظهار الأعمدة:</span>
                      {[
                        { id: 'chassis', label: 'الهيكل' },
                        { id: 'color', label: 'اللون' },
                        { id: 'quantity', label: 'الكمية' },
                        { id: 'unitPrice', label: 'السعر' },
                        { id: 'tax', label: 'الضريبة' },
                        { id: 'license', label: 'اللوحات' },
                        { id: 'total', label: 'الإجمالي' }
                      ].map(col => (
                        <button
                          key={col.id}
                          onClick={() => setVisibleColumns(prev => ({ ...prev, [col.id]: !prev[col.id as keyof typeof visibleColumns] }))}
                          className={`text-[10px] px-2 py-1 rounded transition-colors ${
                            visibleColumns[col.id as keyof typeof visibleColumns] 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-white/5 text-white/40'
                          }`}
                        >
                          {col.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => {
                      if (window.confirm("هل أنت متأكد من مسح كافة السيارات من القائمة؟")) {
                        setMultiItems([]);
                        setIsMultiVehicleMode(false);
                      }
                    }}
                    className="bg-red-500/20 text-red-400 hover:bg-red-500/40 border-red-500/50"
                  >
                    <Trash2 size={14} className="ml-2" />
                    مسح الكل
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-white/90">
                    <thead>
                      <tr className="border-b border-white/10 text-xs text-white/60">
                        <th className="py-3 px-4">المركبة</th>
                        {visibleColumns.chassis && <th className="py-3 px-4">رقم الهيكل</th>}
                        {visibleColumns.color && <th className="py-3 px-4">اللون</th>}
                        {visibleColumns.quantity && <th className="py-3 px-4">الكمية</th>}
                        {visibleColumns.unitPrice && <th className="py-3 px-4">السعر</th>}
                        {visibleColumns.tax && <th className="py-3 px-4">الضريبة</th>}
                        {visibleColumns.license && <th className="py-3 px-4">اللوحات</th>}
                        {visibleColumns.total && <th className="py-3 px-4">الإجمالي</th>}
                        <th className="py-3 px-4">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {multiItems.map((item) => {
                        const mfgLogo = getManufacturerLogo(item.manufacturer) || item.vehicleManufacturerLogo || item.logo;
                        return (
                          <tr key={item.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                {mfgLogo && (
                                  <img src={mfgLogo} alt={item.manufacturer} className="w-10 h-10 object-contain bg-white/10 rounded p-1" />
                                )}
                                <div>
                                  <div className="font-bold">{item.manufacturer} {item.category}</div>
                                  <div className="text-xs text-white/60">{item.trimLevel} - {item.year} - {item.engineCapacity}</div>
                                </div>
                              </div>
                            </td>
                            {visibleColumns.chassis && <td className="py-4 px-4 text-xs font-mono">{item.chassisNumber || "—"}</td>}
                            {visibleColumns.color && (
                              <td className="py-4 px-4 text-xs">
                                <div className="flex flex-col gap-0.5">
                                  <span>خارجي: {item.exteriorColor || "—"}</span>
                                  <span>داخلي: {item.interiorColor || "—"}</span>
                                </div>
                              </td>
                            )}
                            {visibleColumns.quantity && <td className="py-4 px-4 font-mono">{item.quantity}</td>}
                            {visibleColumns.unitPrice && <td className="py-4 px-4 font-mono">{(item.unitPrice || 0).toLocaleString()}</td>}
                            {visibleColumns.tax && <td className="py-4 px-4 font-mono">{(item.taxAmount || 0).toLocaleString()}</td>}
                            {visibleColumns.license && <td className="py-4 px-4 font-mono">{(item.licensePlatePrice || 0).toLocaleString()}</td>}
                            {visibleColumns.total && <td className="py-4 px-4 font-bold text-blue-400 font-mono">{(item.totalPrice || 0).toLocaleString()}</td>}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-1">
                                <div className="flex flex-col gap-0.5 ml-2">
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-6 w-6 text-white/40 hover:text-white"
                                    onClick={() => moveItem(item.id, 'up')}
                                  >
                                    <ChevronUp size={12} />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-6 w-6 text-white/40 hover:text-white"
                                    onClick={() => moveItem(item.id, 'down')}
                                  >
                                    <ChevronDown size={12} />
                                  </Button>
                                </div>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-blue-400 hover:bg-blue-400/20"
                                  onClick={() => {
                                    // Populate form with this item's data
                                    setVehicleManufacturer(item.manufacturer);
                                    setVehicleCategory(item.category);
                                    setVehicleTrimLevel(item.trimLevel);
                                    setVehicleYear(item.year?.toString());
                                    setVehicleEngineCapacity(item.engineCapacity);
                                    setVehicleExteriorColor(item.exteriorColor);
                                    setVehicleInteriorColor(item.interiorColor);
                                    setVehicleChassisNumber(item.chassisNumber);
                                    setVehiclePrice(item.unitPrice);
                                    setPricingDetails({
                                      basePrice: item.unitPrice,
                                      quantity: item.quantity,
                                      taxRate: item.taxRate,
                                      licensePlatePrice: item.licensePlatePrice / item.quantity,
                                      includeLicensePlate: item.licensePlatePrice > 0,
                                      licensePlateSubjectToTax: item.licensePlateSubjectToTax,
                                      isVATInclusive: item.isVATInclusive
                                    });
                                    // Remove from list to "edit" it
                                    removeVehicleFromMultiItems(item.id);
                                    toast({
                                      title: "نمط التعديل",
                                      description: "تم نقل بيانات السيارة إلى النموذج للتعديل",
                                    });
                                  }}
                                >
                                  <Edit3 size={14} />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-red-400 hover:bg-red-400/20"
                                  onClick={() => removeVehicleFromMultiItems(item.id)}
                                >
                                  <X size={14} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-white/5 font-bold">
                        <td 
                          colSpan={Object.values(visibleColumns).filter(v => v).length + 1 - (visibleColumns.total ? 1 : 0)} 
                          className="py-4 px-4 text-left"
                        >
                          الإجمالي الكلي للقائمة:
                        </td>
                        {visibleColumns.total && (
                          <td className="py-4 px-4 text-blue-400 font-mono">
                            {multiItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0).toLocaleString()} SAR
                          </td>
                        )}
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </GlassBackground>
          )}
        </div>
        </div>

        {/* A4 Preview Section - Bottom */}
        <div data-section-id="preview" style={sectionStyle("preview")}>
        <QuotationA4Preview
          selectedCompany={selectedCompanyData}
          selectedVehicle={editableVehicle}
          vehicleSpecs={vehicleSpecs}
          quoteNumber={authorizationNumber || quoteNumber}
          customerName={customerName}
          customerPhone={customerPhone}
          customerEmail={customerEmail}
          customerTitle={customerTitle}
          validUntil={new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000)}
          basePrice={calculateTotals().basePrice}
          finalPrice={calculateTotals().finalTotal}
          taxAmount={calculateTotals().taxAmount}
          licensePlatePrice={calculateTotals().licensePlateTotal}
          includeLicensePlate={pricingDetails.includeLicensePlate}
          licensePlateSubjectToTax={pricingDetails.licensePlateSubjectToTax}
          taxRate={pricingDetails.taxRate}
          isVATInclusive={pricingDetails.isVATInclusive}
          representativeName={users.find((user: any) => user.id.toString() === selectedRepresentative)?.name || ""}
          representativePhone={users.find((user: any) => user.id.toString() === selectedRepresentative)?.phoneNumber || ""}
          representativeEmail={users.find((user: any) => user.id.toString() === selectedRepresentative)?.email || ""}
          representativePosition={users.find((user: any) => user.id.toString() === selectedRepresentative)?.jobTitle || ""}
          notes={notes}
          termsRefreshTrigger={termsRefreshTrigger}
          companyStamp={showStamp ? companyStamp : null}
          isInvoiceMode={isInvoiceMode}
          invoiceNumber={invoiceNumber}
          authorizationNumber={authorizationNumber}
          multiItems={multiItems}
          onRemoveMultiItem={removeVehicleFromMultiItems}
          onSaveSpecs={handleSaveVehicleSpecs}
          visibleColumns={visibleColumns}
          showRepresentative={showRepresentative}
        />
        </div>
      </div>

      {/* Management Dialogs */}
      
      {/* Specifications Management Dialog */}
      <Dialog open={specificationsOpen} onOpenChange={setSpecificationsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>إدارة مواصفات السيارة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {specsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-500">جاري تحميل المواصفات...</p>
              </div>
            ) : vehicleSpecs ? (
              <div className="space-y-6">
                {/* Engine & Performance */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 text-blue-600 dark:text-blue-400">الأداء والمحرك</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(vehicleSpecs as any).engine && (
                      <div>
                        <Label>المحرك</Label>
                        <Input value={(vehicleSpecs as any).engine} readOnly />
                      </div>
                    )}
                    {(vehicleSpecs as any).horsepower && (
                      <div>
                        <Label>القوة الحصانية</Label>
                        <Input value={(vehicleSpecs as any).horsepower} readOnly />
                      </div>
                    )}
                    {(vehicleSpecs as any).torque && (
                      <div>
                        <Label>عزم الدوران</Label>
                        <Input value={(vehicleSpecs as any).torque} readOnly />
                      </div>
                    )}
                    {(vehicleSpecs as any).transmission && (
                      <div>
                        <Label>ناقل الحركة</Label>
                        <Input value={(vehicleSpecs as any).transmission} readOnly />
                      </div>
                    )}
                    {(vehicleSpecs as any).fuelType && (
                      <div>
                        <Label>نوع الوقود</Label>
                        <Input value={(vehicleSpecs as any).fuelType} readOnly />
                      </div>
                    )}
                    {(vehicleSpecs as any).acceleration && (
                      <div>
                        <Label>التسارع 0-100 كم/س</Label>
                        <Input value={(vehicleSpecs as any).acceleration} readOnly />
                      </div>
                    )}
                  </div>
                </div>

                {/* Dimensions */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 text-green-600 dark:text-green-400">الأبعاد والوزن</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(vehicleSpecs as any).length && (
                      <div>
                        <Label>الطول</Label>
                        <Input value={(vehicleSpecs as any).length} readOnly />
                      </div>
                    )}
                    {(vehicleSpecs as any).width && (
                      <div>
                        <Label>العرض</Label>
                        <Input value={(vehicleSpecs as any).width} readOnly />
                      </div>
                    )}
                    {(vehicleSpecs as any).height && (
                      <div>
                        <Label>الارتفاع</Label>
                        <Input value={(vehicleSpecs as any).height} readOnly />
                      </div>
                    )}
                    {(vehicleSpecs as any).wheelbase && (
                      <div>
                        <Label>قاعدة العجلات</Label>
                        <Input value={(vehicleSpecs as any).wheelbase} readOnly />
                      </div>
                    )}
                    {(vehicleSpecs as any).curbWeight && (
                      <div>
                        <Label>الوزن الفارغ</Label>
                        <Input value={(vehicleSpecs as any).curbWeight} readOnly />
                      </div>
                    )}
                    {(vehicleSpecs as any).seatingCapacity && (
                      <div>
                        <Label>عدد المقاعد</Label>
                        <Input value={(vehicleSpecs as any).seatingCapacity} readOnly />
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 text-purple-600 dark:text-purple-400">المميزات والتجهيزات</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {vehicleSpecs.safetyFeatures && (
                      <div>
                        <Label>مميزات الأمان</Label>
                        <Textarea value={vehicleSpecs.safetyFeatures} readOnly rows={2} />
                      </div>
                    )}
                    {vehicleSpecs.comfortFeatures && (
                      <div>
                        <Label>مميزات الراحة</Label>
                        <Textarea value={vehicleSpecs.comfortFeatures} readOnly rows={2} />
                      </div>
                    )}
                    {vehicleSpecs.infotainment && (
                      <div>
                        <Label>نظام المعلومات والترفيه</Label>
                        <Textarea value={vehicleSpecs.infotainment} readOnly rows={2} />
                      </div>
                    )}
                    {vehicleSpecs.driverAssistance && (
                      <div>
                        <Label>مساعدة السائق</Label>
                        <Textarea value={vehicleSpecs.driverAssistance} readOnly rows={2} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Warranty & Notes */}
                {(vehicleSpecs.warranty || vehicleSpecs.notes) && (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 text-orange-600 dark:text-orange-400">الضمان والملاحظات</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {vehicleSpecs.warranty && (
                        <div>
                          <Label>الضمان</Label>
                          <Input value={vehicleSpecs.warranty} readOnly />
                        </div>
                      )}
                      {vehicleSpecs.notes && (
                        <div>
                          <Label>ملاحظات</Label>
                          <Textarea value={vehicleSpecs.notes} readOnly rows={3} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText size={48} className="mx-auto text-slate-400 mb-4" />
                <p className="text-slate-500">لا توجد مواصفات مسجلة لهذه السيارة</p>
                <p className="text-sm text-slate-400 mt-2">
                  يتم جلب المواصفات من إدارة المواصفات بناءً على: {editableVehicle?.manufacturer} - {editableVehicle?.category} - {editableVehicle?.year}
                </p>
                <Button className="mt-4" onClick={() => setSpecificationsOpen(false)}>
                  <Plus size={16} className="ml-2" />
                  إضافة مواصفات جديدة
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>



      

      {/* Vehicle Description and Selection Dialog */}
      <Dialog open={vehicleDescriptionOpen} onOpenChange={setVehicleDescriptionOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>اختيار سيارة من قاعدة البيانات</DialogTitle>
            <DialogDescription>
              يمكنك البحث واختيار أي سيارة من قاعدة البيانات الكاملة لإنشاء عرض السعر
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="البحث برقم الهيكل، الصانع، الفئة، أو اللون..."
                value={vehicleSearchQuery}
                onChange={(e) => setVehicleSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div>
                <Label className="text-sm font-medium">الفئة</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    {Array.from(new Set(availableVehicles.map((v: any) => v.category).filter(Boolean))).map((category: any) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">درجة التجهيز</Label>
                <Select value={filterTrimLevel} onValueChange={setFilterTrimLevel}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    {Array.from(new Set(availableVehicles.map((v: any) => v.trimLevel).filter(Boolean))).map((trimLevel) => (
                      <SelectItem key={trimLevel} value={trimLevel}>
                        {trimLevel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">السنة</Label>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    {Array.from(new Set(availableVehicles.map((v: any) => v.year.toString()))).sort((a, b) => parseInt(b) - parseInt(a)).map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">سعة المحرك</Label>
                <Select value={filterEngineCapacity} onValueChange={setFilterEngineCapacity}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    {Array.from(new Set(availableVehicles.map((v: any) => v.engineCapacity).filter(Boolean))).map((capacity) => (
                      <SelectItem key={capacity} value={capacity}>
                        {capacity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">نوع الاستيراد</Label>
                <Select value={filterImportType} onValueChange={setFilterImportType}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    {Array.from(new Set(availableVehicles.map((v: any) => v.importType).filter(Boolean))).map((importType) => (
                      <SelectItem key={importType} value={importType}>
                        {importType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">الحالة</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    {Array.from(new Set(availableVehicles.map((v: any) => v.status).filter(Boolean))).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">اللون الخارجي</Label>
                <Select value={filterExteriorColor} onValueChange={setFilterExteriorColor}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    {Array.from(new Set(availableVehicles.map((v: any) => v.exteriorColor).filter(Boolean))).map((color) => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">اللون الداخلي</Label>
                <Select value={filterInteriorColor} onValueChange={setFilterInteriorColor}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    {Array.from(new Set(availableVehicles.map((v: any) => v.interiorColor).filter(Boolean))).map((color) => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters Button */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterCategory("all");
                    setFilterTrimLevel("all");
                    setFilterYear("all");
                    setFilterEngineCapacity("all");
                    setFilterImportType("all");
                    setFilterStatus("all");
                    setFilterExteriorColor("all");
                    setFilterInteriorColor("all");
                    setVehicleSearchQuery("");
                  }}
                  className="h-8 text-red-600 hover:text-red-700"
                >
                  <X size={14} className="ml-1" />
                  مسح الفلاتر
                </Button>
              </div>
            </div>

            {/* Vehicle Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableVehicles
                .filter((vehicle: any) => {
                  // Search filter
                  const searchMatch = !vehicleSearchQuery || 
                    vehicle.chassisNumber?.toLowerCase().includes(vehicleSearchQuery.toLowerCase()) ||
                    vehicle.manufacturer?.toLowerCase().includes(vehicleSearchQuery.toLowerCase()) ||
                    vehicle.category?.toLowerCase().includes(vehicleSearchQuery.toLowerCase()) ||
                    vehicle.exteriorColor?.toLowerCase().includes(vehicleSearchQuery.toLowerCase()) ||
                    vehicle.interiorColor?.toLowerCase().includes(vehicleSearchQuery.toLowerCase()) ||
                    vehicle.engineCapacity?.toLowerCase().includes(vehicleSearchQuery.toLowerCase());
                  
                  // Filter conditions
                  const categoryMatch = filterCategory === "all" || vehicle.category === filterCategory;
                  const trimLevelMatch = filterTrimLevel === "all" || vehicle.trimLevel === filterTrimLevel;
                  const yearMatch = filterYear === "all" || vehicle.year.toString() === filterYear;
                  const engineCapacityMatch = filterEngineCapacity === "all" || vehicle.engineCapacity === filterEngineCapacity;
                  const importTypeMatch = filterImportType === "all" || vehicle.importType === filterImportType;
                  const statusMatch = filterStatus === "all" || vehicle.status === filterStatus;
                  const exteriorColorMatch = filterExteriorColor === "all" || vehicle.exteriorColor === filterExteriorColor;
                  const interiorColorMatch = filterInteriorColor === "all" || vehicle.interiorColor === filterInteriorColor;
                  
                  return searchMatch && categoryMatch && trimLevelMatch && yearMatch && 
                         engineCapacityMatch && importTypeMatch && statusMatch && 
                         exteriorColorMatch && interiorColorMatch;
                })
                .map((vehicle: any) => (
                  <Card 
                    key={vehicle.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedVehicleFromDB?.id === vehicle.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedVehicleFromDB(vehicle)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4 space-x-reverse">
                        {/* Manufacturer Logo */}
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
                          {manufacturers.find(m => m.name === vehicle.manufacturer)?.logo ? (
                            <img 
                              src={manufacturers.find(m => m.name === vehicle.manufacturer)?.logo} 
                              alt={vehicle.manufacturer} 
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-lg font-bold text-slate-600 dark:text-slate-300">
                              {vehicle.manufacturer?.charAt(0)}
                            </span>
                          )}
                        </div>
                        
                        {/* Vehicle Info */}
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{vehicle.manufacturer} {vehicle.category}</h3>
                          {vehicle.trimLevel && (
                            <p className="text-sm text-blue-600 font-medium">{vehicle.trimLevel}</p>
                          )}
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                            <div>
                              <span className="text-gray-500">السنة:</span>
                              <span className="font-medium mr-1">{vehicle.year}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">المحرك:</span>
                              <span className="font-medium mr-1">{vehicle.engineCapacity}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">خارجي:</span>
                              <span className="font-medium mr-1">{vehicle.exteriorColor}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">داخلي:</span>
                              <span className="font-medium mr-1">{vehicle.interiorColor}</span>
                            </div>
                          </div>
                          {vehicle.chassisNumber && (
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                              <span className="text-gray-500">رقم الهيكل:</span>
                              <span className="font-mono font-medium mr-1">{vehicle.chassisNumber}</span>
                            </div>
                          )}
                          {vehicle.price && (
                            <div className="mt-2 text-lg font-bold text-green-600">
                              {vehicle.price.toLocaleString()} ريال
                            </div>
                          )}
                          <div className="mt-2 flex gap-2">
                            <Badge variant={vehicle.status === "متوفر" ? "default" : "secondary"}>
                              {vehicle.status}
                            </Badge>
                            <Badge variant="outline">{vehicle.importType}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {/* No vehicles found */}
            {availableVehicles.length === 0 && (
              <div className="text-center py-8">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">لا توجد سيارات متاحة في المخزون</p>
              </div>
            )}

            {/* Selected Vehicle Details */}
            {selectedVehicleFromDB && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-bold mb-4">تفاصيل السيارة المختارة</h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-bold text-xl text-blue-800 dark:text-blue-200">
                        {selectedVehicleFromDB.manufacturer} {selectedVehicleFromDB.category}
                      </h4>
                      {selectedVehicleFromDB.trimLevel && (
                        <p className="text-blue-600 font-medium mt-1">{selectedVehicleFromDB.trimLevel}</p>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-green-600">
                        {selectedVehicleFromDB.price?.toLocaleString()} ريال
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-gray-600">السنة:</span>
                      <p className="font-medium">{selectedVehicleFromDB.year}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">سعة المحرك:</span>
                      <p className="font-medium">{selectedVehicleFromDB.engineCapacity}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">اللون الخارجي:</span>
                      <p className="font-medium">{selectedVehicleFromDB.exteriorColor}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">اللون الداخلي:</span>
                      <p className="font-medium">{selectedVehicleFromDB.interiorColor}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">الحالة:</span>
                      <p className="font-medium">{selectedVehicleFromDB.status}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">نوع الاستيراد:</span>
                      <p className="font-medium">{selectedVehicleFromDB.importType}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">الموقع:</span>
                      <p className="font-medium">{selectedVehicleFromDB.location}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">تاريخ الإدخال:</span>
                      <p className="font-medium">{new Date(selectedVehicleFromDB.entryDate).toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>
                  
                  {selectedVehicleFromDB.chassisNumber && (
                    <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border">
                      <span className="text-gray-600">رقم الهيكل:</span>
                      <p className="font-mono font-bold text-lg">{selectedVehicleFromDB.chassisNumber}</p>
                    </div>
                  )}
                  
                  {selectedVehicleFromDB.notes && (
                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border">
                      <span className="text-gray-600">ملاحظات:</span>
                      <p className="mt-1">{selectedVehicleFromDB.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center border-t pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setVehicleDescriptionOpen(false);
                  setSelectedVehicleFromDB(null);
                  setVehicleSearchQuery("");
                  // Clear filters
                  setFilterCategory("");
                  setFilterTrimLevel("");
                  setFilterYear("");
                  setFilterEngineCapacity("");
                  setFilterImportType("");
                  setFilterStatus("");
                  setFilterExteriorColor("");
                  setFilterInteriorColor("");
                }}
              >
                إلغاء
              </Button>
              <Button 
                onClick={() => {
                  if (selectedVehicleFromDB) {
                    setSelectedVehicle(selectedVehicleFromDB);
                    setEditableVehicle(selectedVehicleFromDB);
                    setPricingDetails(prev => ({
                      ...prev,
                      basePrice: selectedVehicleFromDB.price || 0
                    }));
                    setVehicleDescriptionOpen(false);
                    setSelectedVehicleFromDB(null);
                    setVehicleSearchQuery("");
                    // Clear filters
                    setFilterCategory("");
                    setFilterTrimLevel("");
                    setFilterYear("");
                    setFilterEngineCapacity("");
                    setFilterImportType("");
                    setFilterStatus("");
                    setFilterExteriorColor("");
                    setFilterInteriorColor("");
                  }
                }}
                disabled={!selectedVehicleFromDB}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus size={16} className="ml-2" />
                اختيار هذه السيارة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vehicle Edit Dialog */}
      <Dialog open={vehicleEditOpen} onOpenChange={setVehicleEditOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل بيانات السيارة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editManufacturer">الصانع</Label>
                <Input
                  id="editManufacturer"
                  value={editableVehicle?.manufacturer || ""}
                  onChange={(e) => setEditableVehicle(prev => prev ? { ...prev, manufacturer: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="editCategory">الفئة</Label>
                <Input
                  id="editCategory"
                  value={editableVehicle?.category || ""}
                  onChange={(e) => setEditableVehicle(prev => prev ? { ...prev, category: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="editYear">السنة</Label>
                <Input
                  id="editYear"
                  type="number"
                  value={editableVehicle?.year || ""}
                  onChange={(e) => setEditableVehicle(prev => prev ? { ...prev, year: parseInt(e.target.value) || 2024 } : null)}
                />
              </div>
              <div>
                <Label htmlFor="editEngineCapacity">سعة المحرك</Label>
                <Input
                  id="editEngineCapacity"
                  value={editableVehicle?.engineCapacity || ""}
                  onChange={(e) => setEditableVehicle(prev => prev ? { ...prev, engineCapacity: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="editExteriorColor">اللون الخارجي</Label>
                <Input
                  id="editExteriorColor"
                  value={editableVehicle?.exteriorColor || ""}
                  onChange={(e) => setEditableVehicle(prev => prev ? { ...prev, exteriorColor: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="editInteriorColor">اللون الداخلي</Label>
                <Input
                  id="editInteriorColor"
                  value={editableVehicle?.interiorColor || ""}
                  onChange={(e) => setEditableVehicle(prev => prev ? { ...prev, interiorColor: e.target.value } : null)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="editChassisNumber">رقم الهيكل</Label>
                <Input
                  id="editChassisNumber"
                  value={editableVehicle?.chassisNumber || ""}
                  onChange={(e) => setEditableVehicle(prev => prev ? { ...prev, chassisNumber: e.target.value } : null)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="editDetailedSpecifications">المواصفات التفصيلية</Label>
                <textarea
                  id="editDetailedSpecifications"
                  className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md resize-vertical focus:ring-2 focus:ring-green-500 focus:border-green-500 text-green-700 dark:text-green-400 placeholder-green-500/70"
                  placeholder="أدخل المواصفات التفصيلية للسيارة..."
                  value={editableVehicle?.detailedSpecifications || ""}
                  onChange={(e) => setEditableVehicle(prev => prev ? { ...prev, detailedSpecifications: e.target.value } : null)}
                  style={{ 
                    fontFamily: '"Noto Sans Arabic", Arial, sans-serif', 
                    direction: 'rtl',
                    lineHeight: '1.6'
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button variant="outline" onClick={() => setVehicleEditOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={() => setVehicleEditOpen(false)}>
                حفظ التغييرات
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quotes View Dialog */}
      <Dialog open={quotesViewOpen} onOpenChange={setQuotesViewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>العروض المحفوظة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {quotations.length > 0 ? (
              <div className="grid gap-4">
                {quotations.map((quote: any) => (
                  <Card key={quote.id} className="border border-slate-200 dark:border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{quote.quoteNumber}</h4>
                          <p className="text-slate-600 dark:text-slate-400">العميل: {quote.customerName}</p>
                          <p className="text-sm text-slate-500">
                            {quote.vehicleManufacturer} {quote.vehicleCategory} - {quote.vehicleYear}
                          </p>
                          <p className="text-sm font-medium text-green-600 mt-1">
                            {quote.finalPrice?.toLocaleString()} ريال
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Badge variant={quote.status === "مسودة" ? "secondary" : "default"}>
                            {quote.status}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Edit3 size={14} className="ml-1" />
                            تعديل
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText size={48} className="mx-auto text-slate-400 mb-4" />
                <p className="text-slate-500">لا توجد عروض محفوظة</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Print Layout (hidden on screen, visible when printing) */}
      <div className="hidden print:block print-page">
        {/* Print Header */}
        <div className="print-header">
          <div className="print-header-logo">
            {companyData.logo ? (
              <img src={companyData.logo} alt="Company Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-4xl font-bold">
                ش
              </div>
            )}
          </div>
          <div className="print-header-info">
            <h1 className="text-2xl font-bold mb-2">
              {companyData.name || "شركة السيارات"}
            </h1>
            <p className="text-sm mb-1">
              {companyData.address || "العنوان"}
            </p>
            <p className="text-sm">
              {isInvoiceMode ? 'تاريخ الفاتورة' : 'تاريخ العرض'}: {new Date().toLocaleDateString('en-GB')}
            </p>
          </div>
          <div className="print-header-qr">
            <div className="text-center">
              <div className="text-xs mb-1">QR Code</div>
              <div className="text-xs">{isInvoiceMode ? invoiceNumber : quoteNumber}</div>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="print-section">
          <h3>بيانات العميل</h3>
          <div className="print-row">
            <span className="print-label">اسم العميل:</span>
            <span className="print-value">{customerName}</span>
          </div>
          <div className="print-row">
            <span className="print-label">رقم الهاتف:</span>
            <span className="print-value">{customerPhone}</span>
          </div>
          <div className="print-row">
            <span className="print-label">البريد الإلكتروني:</span>
            <span className="print-value">{customerEmail}</span>
          </div>
        </div>

        {/* Representative Information - Hidden if no representative selected */}
        {(() => {
          const rep = users.find((user: any) => user.id.toString() === selectedRepresentative);
          return rep ? (
            <div className="print-section">
              <h3>بيانات المندوب</h3>
              <div className="print-row">
                <span className="print-label">الاسم:</span>
                <span className="print-value">{rep.name}</span>
              </div>
              <div className="print-row">
                <span className="print-label">رقم الهاتف:</span>
                <span className="print-value">{rep.phone}</span>
              </div>
            </div>
          ) : null;
        })()}

        {/* Vehicle Information */}
        <div className="print-section">
          <h3>بيانات المركبة</h3>
          <div className="flex items-center mb-3">
            <div className="manufacturer-logo mr-3">
              {manufacturerData?.logo ? (
                <img src={manufacturerData.logo} alt={editableVehicle.manufacturer} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-2xl font-bold">
                  {editableVehicle.manufacturer?.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h4 className="text-lg font-bold">{editableVehicle.manufacturer} {editableVehicle.category}</h4>
              <p className="text-sm text-gray-600">الموديل: {editableVehicle.year}</p>
            </div>
          </div>
          <div className="print-row">
            <span className="print-label">سعة المحرك:</span>
            <span className="print-value">{editableVehicle.engineCapacity}</span>
          </div>
          <div className="print-row">
            <span className="print-label">اللون الخارجي:</span>
            <span className="print-value">{editableVehicle.exteriorColor}</span>
          </div>
          <div className="print-row">
            <span className="print-label">اللون الداخلي:</span>
            <span className="print-value">{editableVehicle.interiorColor}</span>
          </div>
          <div className="print-row">
            <span className="print-label">رقم الهيكل:</span>
            <span className="print-value">{editableVehicle.chassisNumber}</span>
          </div>
        </div>

        {/* Price Details */}
        <div className="print-section">
          <h3>تفاصيل السعر</h3>
          <table className="print-table">
            <thead>
              <tr>
                <th>البيان</th>
                <th>المبلغ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>السعر الأساسي</td>
                <td>{(pricingDetails.basePrice || 0).toLocaleString()} ريال</td>
              </tr>
              {pricingDetails.includeLicensePlate && (
                <tr>
                  <td>اللوحات</td>
                  <td>{(pricingDetails.licensePlatePrice || 0).toLocaleString()} ريال</td>
                </tr>
              )}
              <tr>
                <td>
                  {pricingDetails.isVATInclusive ? 'السعر شامل الضريبة' : 'السعر + الضريبة'}
                  {pricingDetails.isVATInclusive && pricingDetails.taxRate > 0 && (
                    <span> (قيمة الضريبة: {(calculateTotals().taxAmount || 0).toLocaleString()} ريال)</span>
                  )}
                </td>
                <td>{(calculateTotals().subtotal || 0).toLocaleString()} ريال</td>
              </tr>
              <tr className="print-total-row">
                <td>الإجمالي</td>
                <td>{(calculateTotals().finalTotal || 0).toLocaleString()} ريال</td>
              </tr>
            </tbody>
          </table>
          
          {/* Arabic Total */}
          <div className="print-arabic-total">
            <strong>المبلغ بالأحرف العربية:</strong><br />
            {numberToArabic(calculateTotals().finalTotal || 0)}
          </div>
        </div>

        {/* Additional Notes */}
        {notes && (
          <div className="print-section">
            <h3>ملاحظات إضافية</h3>
            <p>{notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="print-section mt-8">
          <div className="print-row">
            <span className="print-label">
              {isInvoiceMode ? 'رقم الفاتورة:' : 'رقم عرض السعر:'}
            </span>
            <span className="print-value">{isInvoiceMode ? invoiceNumber : quoteNumber}</span>
          </div>
          {!isInvoiceMode && (
            <div className="print-row">
              <span className="print-label">صالح حتى:</span>
              <span className="print-value">
                {new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}
              </span>
            </div>
          )}
        </div>
      </div>
      

      {/* WhatsApp Dialog */}
      <Dialog open={showWhatsappDialog} onOpenChange={setShowWhatsappDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-emerald-600" />
              مشاركة عبر الواتساب
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Employee Selection */}
            <div>
              <Label htmlFor="employee-select">اختيار الموظف</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر موظف لإرسال الرسالة إليه" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} - {user.jobTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Work Number Checkbox */}
            {selectedEmployee && (
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox 
                  id="send-to-work" 
                  checked={sendToWorkNumber}
                  onCheckedChange={setSendToWorkNumber}
                />
                <Label htmlFor="send-to-work" className="text-sm">
                  إرسال على رقم العمل: {users.find((user: any) => user.id.toString() === selectedEmployee)?.phoneNumber}
                </Label>
              </div>
            )}

            {/* Phone Number Input - Only show if custom number or no work number selected */}
            {(!sendToWorkNumber || !selectedEmployee) && (
              <div>
                <Label htmlFor="whatsapp-number">رقم الواتساب</Label>
                <div className="flex items-center">
                  <div className="bg-gray-100 border border-r-0 rounded-r-md px-3 py-2 text-sm font-medium text-gray-700">
                    🇸🇦 +966
                  </div>
                  <Input
                    id="whatsapp-number"
                    placeholder="501234567"
                    value={whatsappNumber.replace('+966', '')}
                    onChange={(e) => setWhatsappNumber('+966' + e.target.value.replace(/^\+966/, ''))}
                    className="text-left rounded-r-none border-r-0"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={shareViaWhatsApp} className="bg-emerald-600 hover:bg-emerald-700">
                <MessageCircle size={16} className="ml-2" />
                إرسال PDF
              </Button>
              <Button variant="outline" onClick={() => setShowWhatsappDialog(false)}>
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms and Conditions Dialog */}
      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col glass-container border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white text-xl">
              <Settings2 className="h-6 w-6 text-orange-400" />
              الشروط والأحكام
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-6 py-4 px-2" dir="rtl">
            {/* Add New Term Section */}
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-xl border border-white/20 shadow-xl">
              <Label className="text-orange-400 font-bold mb-3 block text-lg">إضافة بند جديد</Label>
              <div className="flex gap-3">
                <Textarea 
                  placeholder="اكتب نص البند الجديد هنا..."
                  value={newTermText}
                  onChange={(e) => setNewTermText(e.target.value)}
                  className="min-h-[100px] bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-orange-500/50 focus:ring-orange-500/20 rounded-xl"
                />
                <Button 
                  onClick={handleAddTerm}
                  disabled={!newTermText.trim()}
                  className="bg-orange-600 hover:bg-orange-700 self-end h-[100px] px-6 rounded-xl shadow-lg shadow-orange-900/40 transition-all hover:scale-105 active:scale-95"
                >
                  <Plus size={24} />
                </Button>
              </div>
            </div>

            {/* Terms List Section */}
            <div className="space-y-4">
              <Label className="font-bold text-xl block border-b border-white/10 pb-3 text-white">قائمة البنود الحالية</Label>
              {existingTerms.length === 0 ? (
                <div className="text-center py-16 text-white/40 bg-white/5 rounded-2xl border border-dashed border-white/10">
                  <Settings2 size={48} className="mx-auto mb-4 opacity-20" />
                  لا توجد شروط وأحكام مضافة بعد
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {existingTerms
                    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                    .map((term) => (
                    <div 
                      key={term.id} 
                      className={`group p-5 rounded-2xl border transition-all duration-300 ${
                        selectedTerms.includes(term.id) 
                          ? 'bg-orange-600/20 border-orange-500/50 shadow-[0_0_20px_rgba(234,88,12,0.15)]' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 shadow-lg'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          <Checkbox 
                            id={`term-${term.id}`}
                            checked={selectedTerms.includes(term.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTerms(prev => [...prev, term.id]);
                              } else {
                                setSelectedTerms(prev => prev.filter(id => id !== term.id));
                              }
                            }}
                            className="h-6 w-6 border-white/30 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600 rounded-md"
                          />
                        </div>
                        
                        <div className="flex-1 space-y-3">
                          {editingTermId === term.id ? (
                            <div className="space-y-3">
                              <Textarea 
                                value={editingTermText}
                                onChange={(e) => setEditingTermText(e.target.value)}
                                className="min-h-[120px] bg-black/30 border-white/20 text-white rounded-xl"
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end">
                                <Button size="sm" onClick={() => saveEditTerm(term.id)} className="bg-green-600 hover:bg-green-700 rounded-lg px-4">حفظ التعديلات</Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingTermId(null)} className="text-white/60 hover:text-white hover:bg-white/10">إلغاء</Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-base leading-relaxed text-white/90 whitespace-pre-wrap font-medium">
                              {term.termText}
                            </p>
                          )}
                        </div>

                        {editingTermId !== term.id && (
                          <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-10 w-10 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl"
                              onClick={() => startEditingTerm(term)}
                            >
                              <Edit3 size={18} />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-10 w-10 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl"
                              onClick={() => handleDeleteTerm(term.id)}
                            >
                              <Trash2 size={18} />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 pt-5 flex justify-between items-center bg-black/40 backdrop-blur-xl -mx-6 -mb-6 p-6 rounded-b-2xl">
            <div className="text-sm font-medium text-white/60 bg-white/5 px-4 py-2 rounded-full border border-white/10">
              تم اختيار <span className="text-orange-400 font-bold mx-1">{selectedTerms.length}</span> بند لتضمينها في العرض
            </div>
            <div className="flex gap-3">
              <Button onClick={applySelectedTerms} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-10 py-6 rounded-xl shadow-lg shadow-orange-900/40 transition-all hover:scale-105 active:scale-95">
                تطبيق على العرض الحالي
              </Button>
              <Button variant="outline" onClick={() => setShowTermsDialog(false)} className="border-white/20 text-white hover:bg-white/10 px-6 py-6 rounded-xl">
                إغلاق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vehicle Edit Dialog */}
      <Dialog open={vehicleEditOpen} onOpenChange={setVehicleEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-blue-600" />
              تعديل بيانات السيارة
            </DialogTitle>
            <DialogDescription>
              يمكنك تعديل جميع بيانات السيارة والمواصفات التفصيلية هنا
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Manufacturer Selection */}
              <div>
                <Label htmlFor="editManufacturer">الصانع</Label>
                <Select 
                  value={editingVehicleData.manufacturer} 
                  onValueChange={(value) => {
                    setEditingVehicleData(prev => ({
                      ...prev,
                      manufacturer: value,
                      category: "", // Clear category when manufacturer changes
                      trimLevel: "" // Clear trim level when manufacturer changes
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الصانع" />
                  </SelectTrigger>
                  <SelectContent>
                    {manufacturers.map((manufacturer) => (
                      <SelectItem key={manufacturer.id} value={manufacturer.nameAr}>
                        {manufacturer.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Selection */}
              <div>
                <Label htmlFor="editCategory">الفئة</Label>
                <Select 
                  value={editingVehicleData.category} 
                  onValueChange={(value) => {
                    setEditingVehicleData(prev => ({
                      ...prev,
                      category: value,
                      trimLevel: "" // Clear trim level when category changes
                    }));
                  }}
                  disabled={!editingVehicleData.manufacturer}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {editingCategories.map((category) => (
                      <SelectItem key={category.id} value={category.nameAr}>
                        {category.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Trim Level Selection */}
              <div>
                <Label htmlFor="editTrimLevel">درجة التجهيز</Label>
                <Select 
                  value={editingVehicleData.trimLevel} 
                  onValueChange={(value) => setEditingVehicleData(prev => ({ ...prev, trimLevel: value }))}
                  disabled={!editingVehicleData.category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر درجة التجهيز" />
                  </SelectTrigger>
                  <SelectContent>
                    {editingTrimLevels.map((trimLevel) => (
                      <SelectItem key={trimLevel.id} value={trimLevel.nameAr}>
                        {trimLevel.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year Selection */}
              <div>
                <Label htmlFor="editYear">السنة</Label>
                <Select 
                  value={editingVehicleData.year} 
                  onValueChange={(value) => setEditingVehicleData(prev => ({ ...prev, year: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر السنة" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Engine Capacity Selection */}
              <div>
                <Label htmlFor="editEngineCapacity">سعة المحرك</Label>
                <Select 
                  value={editingVehicleData.engineCapacity} 
                  onValueChange={(value) => setEditingVehicleData(prev => ({ ...prev, engineCapacity: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر سعة المحرك" />
                  </SelectTrigger>
                  <SelectContent>
                    {engineCapacities.map((capacity) => (
                      <SelectItem key={capacity} value={capacity}>
                        {capacity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Exterior Color */}
              <div>
                <Label htmlFor="editExteriorColor">اللون الخارجي</Label>
                <Input
                  id="editExteriorColor"
                  value={editingVehicleData.exteriorColor}
                  onChange={(e) => setEditingVehicleData(prev => ({ ...prev, exteriorColor: e.target.value }))}
                  placeholder="أدخل اللون الخارجي"
                />
              </div>

              {/* Interior Color */}
              <div>
                <Label htmlFor="editInteriorColor">اللون الداخلي</Label>
                <Input
                  id="editInteriorColor"
                  value={editingVehicleData.interiorColor}
                  onChange={(e) => setEditingVehicleData(prev => ({ ...prev, interiorColor: e.target.value }))}
                  placeholder="أدخل اللون الداخلي"
                />
              </div>

              {/* Chassis Number */}
              <div>
                <Label htmlFor="editChassisNumber">رقم الهيكل</Label>
                <Input
                  id="editChassisNumber"
                  value={editingVehicleData.chassisNumber}
                  onChange={(e) => setEditingVehicleData(prev => ({ ...prev, chassisNumber: e.target.value }))}
                  placeholder="أدخل رقم الهيكل"
                />
              </div>

              {/* Price */}
              <div>
                <Label htmlFor="editPrice">السعر</Label>
                <Input
                  id="editPrice"
                  type="number"
                  value={editingVehicleData.price}
                  onChange={(e) => setEditingVehicleData(prev => ({ ...prev, price: Number(e.target.value) }))}
                  placeholder="أدخل السعر"
                />
              </div>
            </div>

            {/* Vehicle Specifications Preview from Database */}
            {(editingVehicleSpecs || editingSpecsLoading) && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">المواصفات التفصيلية من قاعدة البيانات</h4>
                
                {editingSpecsLoading && (
                  <div className="text-center text-gray-500 py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    جاري تحميل المواصفات...
                  </div>
                )}
                
                {editingVehicleSpecs && !editingSpecsLoading && (
                  <div className="space-y-6">
                    {/* Engine & Performance Specifications */}
                    <div>
                      <h5 className="font-medium text-sm text-gray-600 dark:text-gray-300 mb-2">المحرك والأداء</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {editingVehicleSpecs.engineType && (
                          <div><span className="font-medium">نوع المحرك:</span> {editingVehicleSpecs.engineType}</div>
                        )}
                        {editingVehicleSpecs.horsepower && (
                          <div><span className="font-medium">القوة الحصانية:</span> {editingVehicleSpecs.horsepower}</div>
                        )}
                        {editingVehicleSpecs.torque && (
                          <div><span className="font-medium">عزم الدوران:</span> {editingVehicleSpecs.torque}</div>
                        )}
                        {editingVehicleSpecs.transmission && (
                          <div><span className="font-medium">ناقل الحركة:</span> {editingVehicleSpecs.transmission}</div>
                        )}
                        {editingVehicleSpecs.fuelType && (
                          <div><span className="font-medium">نوع الوقود:</span> {editingVehicleSpecs.fuelType}</div>
                        )}
                        {editingVehicleSpecs.fuelConsumption && (
                          <div><span className="font-medium">استهلاك الوقود:</span> {editingVehicleSpecs.fuelConsumption}</div>
                        )}
                        {editingVehicleSpecs.drivetrain && (
                          <div><span className="font-medium">نوع الدفع:</span> {editingVehicleSpecs.drivetrain}</div>
                        )}
                        {editingVehicleSpecs.acceleration && (
                          <div><span className="font-medium">التسارع 0-100:</span> {editingVehicleSpecs.acceleration}</div>
                        )}
                        {editingVehicleSpecs.topSpeed && (
                          <div><span className="font-medium">السرعة القصوى:</span> {editingVehicleSpecs.topSpeed}</div>
                        )}
                      </div>
                    </div>

                    {/* Dimensions & Weight */}
                    <div>
                      <h5 className="font-medium text-sm text-gray-600 dark:text-gray-300 mb-2">الأبعاد والوزن</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {editingVehicleSpecs.length && (
                          <div><span className="font-medium">الطول:</span> {editingVehicleSpecs.length}</div>
                        )}
                        {editingVehicleSpecs.width && (
                          <div><span className="font-medium">العرض:</span> {editingVehicleSpecs.width}</div>
                        )}
                        {editingVehicleSpecs.height && (
                          <div><span className="font-medium">الارتفاع:</span> {editingVehicleSpecs.height}</div>
                        )}
                        {editingVehicleSpecs.wheelbase && (
                          <div><span className="font-medium">قاعدة العجلات:</span> {editingVehicleSpecs.wheelbase}</div>
                        )}
                        {editingVehicleSpecs.curbWeight && (
                          <div><span className="font-medium">الوزن الفارغ:</span> {editingVehicleSpecs.curbWeight}</div>
                        )}
                        {editingVehicleSpecs.grossWeight && (
                          <div><span className="font-medium">إجمالي الوزن:</span> {editingVehicleSpecs.grossWeight}</div>
                        )}
                        {editingVehicleSpecs.loadCapacity && (
                          <div><span className="font-medium">سعة التحميل:</span> {editingVehicleSpecs.loadCapacity}</div>
                        )}
                        {editingVehicleSpecs.seatingCapacity && (
                          <div><span className="font-medium">عدد المقاعد:</span> {editingVehicleSpecs.seatingCapacity}</div>
                        )}
                      </div>
                    </div>

                    {/* Features & Equipment */}
                    <div>
                      <h5 className="font-medium text-sm text-gray-600 dark:text-gray-300 mb-2">المميزات والتجهيزات</h5>
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        {editingVehicleSpecs.safetyFeatures && (
                          <div><span className="font-medium">مميزات الأمان:</span> {editingVehicleSpecs.safetyFeatures}</div>
                        )}
                        {editingVehicleSpecs.comfortFeatures && (
                          <div><span className="font-medium">مميزات الراحة:</span> {editingVehicleSpecs.comfortFeatures}</div>
                        )}
                        {editingVehicleSpecs.infotainment && (
                          <div><span className="font-medium">نظام المعلومات والترفيه:</span> {editingVehicleSpecs.infotainment}</div>
                        )}
                        {editingVehicleSpecs.driverAssistance && (
                          <div><span className="font-medium">مساعدة السائق:</span> {editingVehicleSpecs.driverAssistance}</div>
                        )}
                        {editingVehicleSpecs.exteriorFeatures && (
                          <div><span className="font-medium">المميزات الخارجية:</span> {editingVehicleSpecs.exteriorFeatures}</div>
                        )}
                        {editingVehicleSpecs.interiorFeatures && (
                          <div><span className="font-medium">المميزات الداخلية:</span> {editingVehicleSpecs.interiorFeatures}</div>
                        )}
                      </div>
                    </div>

                    {/* Technical Specifications */}
                    <div>
                      <h5 className="font-medium text-sm text-gray-600 dark:text-gray-300 mb-2">المواصفات التقنية</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {editingVehicleSpecs.tireSize && (
                          <div><span className="font-medium">مقاس الإطارات:</span> {editingVehicleSpecs.tireSize}</div>
                        )}
                        {editingVehicleSpecs.suspension && (
                          <div><span className="font-medium">نوع التعليق:</span> {editingVehicleSpecs.suspension}</div>
                        )}
                        {editingVehicleSpecs.brakes && (
                          <div><span className="font-medium">نظام الكبح:</span> {editingVehicleSpecs.brakes}</div>
                        )}
                        {editingVehicleSpecs.steering && (
                          <div><span className="font-medium">نظام التوجيه:</span> {editingVehicleSpecs.steering}</div>
                        )}
                        {editingVehicleSpecs.groundClearance && (
                          <div><span className="font-medium">ارتفاع عن الأرض:</span> {editingVehicleSpecs.groundClearance}</div>
                        )}
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div>
                      <h5 className="font-medium text-sm text-gray-600 dark:text-gray-300 mb-2">معلومات إضافية</h5>
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        {editingVehicleSpecs.warranty && (
                          <div><span className="font-medium">الضمان:</span> {editingVehicleSpecs.warranty}</div>
                        )}
                        {editingVehicleSpecs.specifications && (
                          <div><span className="font-medium">الوصف التفصيلي:</span> {editingVehicleSpecs.specifications}</div>
                        )}
                        {editingVehicleSpecs.notes && (
                          <div><span className="font-medium">ملاحظات:</span> {editingVehicleSpecs.notes}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {!editingVehicleSpecs && !editingSpecsLoading && (
                  <div className="text-center text-gray-500 py-4">
                    لا توجد مواصفات تفصيلية متاحة لهذه المركبة
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={() => {
                  // Update the vehicle data
                  const updatedVehicle = {
                    ...editableVehicle,
                    manufacturer: editingVehicleData.manufacturer,
                    category: editingVehicleData.category,
                    trimLevel: editingVehicleData.trimLevel,
                    year: parseInt(editingVehicleData.year),
                    engineCapacity: editingVehicleData.engineCapacity,
                    exteriorColor: editingVehicleData.exteriorColor,
                    interiorColor: editingVehicleData.interiorColor,
                    chassisNumber: editingVehicleData.chassisNumber,
                    price: editingVehicleData.price
                  };
                  
                  setEditableVehicle(updatedVehicle);
                  setSelectedVehicle(updatedVehicle);
                  
                  // Update pricing details with new price
                  setPricingDetails(prev => ({
                    ...prev,
                    basePrice: editingVehicleData.price
                  }));
                  
                  // Update the individual state variables as well
                  setVehicleManufacturer(editingVehicleData.manufacturer);
                  setVehicleCategory(editingVehicleData.category);
                  setVehicleTrimLevel(editingVehicleData.trimLevel);
                  setVehicleYear(editingVehicleData.year);
                  setVehicleEngineCapacity(editingVehicleData.engineCapacity);
                  setVehicleExteriorColor(editingVehicleData.exteriorColor);
                  setVehicleInteriorColor(editingVehicleData.interiorColor);
                  setVehicleChassisNumber(editingVehicleData.chassisNumber);
                  setVehiclePrice(editingVehicleData.price);
                  
                  setVehicleEditOpen(false);
                  
                  toast({
                    title: "تم التحديث",
                    description: "تم تحديث بيانات السيارة والمواصفات بنجاح",
                  });
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save size={16} className="ml-2" />
                حفظ التعديلات
              </Button>
              <Button variant="outline" onClick={() => setVehicleEditOpen(false)}>
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customize Layout Dialog */}
      <Dialog open={showLayoutDialog} onOpenChange={setShowLayoutDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutGrid size={18} />
              تخصيص تخطيط الصفحة
            </DialogTitle>
            <DialogDescription>
              رتّب الأقسام أو أخفِها حسب احتياجك ثم احفظ التخطيط.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {draftOrder.map((id, index) => {
              const isHidden = draftHidden.includes(id);
              return (
                <div
                  key={id}
                  data-testid={`row-layout-section-${id}`}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    isHidden
                      ? "bg-slate-100 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 opacity-70"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-slate-500 w-6 text-center">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium">{SECTION_LABELS[id]}</span>
                    {isHidden && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <EyeOff size={12} />
                        مخفي
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={index === 0}
                      onClick={() => moveDraftSection(index, -1)}
                      data-testid={`button-move-up-${id}`}
                      title="تحريك للأعلى"
                    >
                      <ChevronUp size={16} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={index === draftOrder.length - 1}
                      onClick={() => moveDraftSection(index, 1)}
                      data-testid={`button-move-down-${id}`}
                      title="تحريك للأسفل"
                    >
                      <ChevronDown size={16} />
                    </Button>
                    <div className="flex items-center gap-2 ms-2 ps-2 border-s border-slate-200 dark:border-slate-700">
                      <Switch
                        checked={!isHidden}
                        onCheckedChange={() => toggleDraftHidden(id)}
                        data-testid={`switch-visible-${id}`}
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {isHidden ? "مخفي" : "ظاهر"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetLayout}
              data-testid="button-reset-layout"
            >
              <RotateCcw size={14} className="ml-2" />
              إعادة الافتراضي
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowLayoutDialog(false)}
                data-testid="button-cancel-layout"
              >
                إلغاء
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={saveLayout}
                data-testid="button-save-layout"
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <Save size={14} className="ml-2" />
                حفظ التخطيط
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
    </SystemGlassWrapper>
  );
}
