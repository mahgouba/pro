import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Bell, 
 
  Palette, 
  Building2,
  LogOut,
  Home,
  MessageSquare,
  Filter,
  Edit3,
  Edit2,
  ShoppingCart,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  Moon,
  Sun,
  Calendar,
  X,
  Share2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  CreditCard,
  Plus,
  Receipt,
  UserCheck,
  Copy,
  MessageCircle,
  CheckCircle,
  Check,
  Car
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay } from "date-fns";
import { ar } from "date-fns/locale";
import { Clock, AlertTriangle, Calendar as CalendarIcon, UserX } from "lucide-react";
import { Switch } from "@/components/ui/switch";


import InventoryForm from "@/components/inventory-form";
import VehicleShare from "@/components/vehicle-share";
import QRScannerButton from "@/components/qr-scanner-button";

import QuotationManagement from "@/components/quotation-management";
import { ManufacturerLogo } from "@/components/manufacturer-logo";
import ScrollableFilter from "@/components/scrollable-filter";
import { ReservationDialog } from "@/components/reservation-dialog";
import SystemGlassWrapper from "@/components/system-glass-wrapper";

import { EnhancedSaleDialog } from "@/components/enhanced-sale-dialog";
import { EntryTimer } from "@/components/entry-timer";

import type { InventoryItem } from "@shared/schema";
import { UserRole, canViewPage, canCreateItem, canEditItem, canDeleteItem, canShareItem, canReserveItem } from "@/utils/permissions";

interface CardViewPageProps {
  userRole: string;
  username: string;
  onLogout: () => void;
}

export default function CardViewPage({ userRole, username, onLogout }: CardViewPageProps) {
  const { companyName, companyLogo, darkMode, toggleDarkMode, isUpdatingDarkMode } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [expandedManufacturer, setExpandedManufacturer] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [sellingItemId, setSellingItemId] = useState<number | null>(null);
  const [cancelingReservationId, setCancelingReservationId] = useState<number | null>(null);
  const [reserveItem, setReserveItem] = useState<InventoryItem | undefined>();
  const [reserveDialogOpen, setReserveDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Multiple selection filter arrays
  const [selectedManufacturer, setSelectedManufacturer] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedTrimLevel, setSelectedTrimLevel] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string[]>([]);
  const [selectedEngineCapacity, setSelectedEngineCapacity] = useState<string[]>([]);
  const [selectedInteriorColor, setSelectedInteriorColor] = useState<string[]>([]);
  const [selectedExteriorColor, setSelectedExteriorColor] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedImportType, setSelectedImportType] = useState<string[]>([]);
  const [selectedOwnershipType, setSelectedOwnershipType] = useState<string[]>([]);
  const [showSoldCars, setShowSoldCars] = useState<boolean>(false);
  const [shareVehicle, setShareVehicle] = useState<InventoryItem | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  // Bank sharing states
  const [bankShareDialogOpen, setBankShareDialogOpen] = useState(false);
  const [selectedBankType, setSelectedBankType] = useState<'company' | 'personal' | null>(null);
  const [bankPhoneNumber, setBankPhoneNumber] = useState("");
  
  // Sell dialog states
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [selectedVehicleForSale, setSelectedVehicleForSale] = useState<InventoryItem | null>(null);

  // Price card states
  const [selectedVehicleForPriceCard, setSelectedVehicleForPriceCard] = useState<InventoryItem | null>(null);
  const [priceCardPreviewOpen, setPriceCardPreviewOpen] = useState(false);

  const [quotationManagementOpen, setQuotationManagementOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [arrivedTodayOpen, setArrivedTodayOpen] = useState(false);
  const [arrivedTodayNotificationSeen, setArrivedTodayNotificationSeen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  
  // QR Scanner states
  const [scannedVehicleDialogOpen, setScannedVehicleDialogOpen] = useState(false);
  const [scannedVehicle, setScannedVehicle] = useState<InventoryItem | null>(null);
  
  // Neumorphism design toggle
  const [neumorphismMode, setNeumorphismMode] = useState(false);

  
  // Toggle states for individual filters - default to false (closed)
  const [showManufacturerFilter, setShowManufacturerFilter] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showTrimLevelFilter, setShowTrimLevelFilter] = useState(false);
  const [showYearFilter, setShowYearFilter] = useState(false);
  const [showEngineCapacityFilter, setShowEngineCapacityFilter] = useState(false);
  const [showExteriorColorFilter, setShowExteriorColorFilter] = useState(false);
  const [showInteriorColorFilter, setShowInteriorColorFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showImportTypeFilter, setShowImportTypeFilter] = useState(false);
  const [showOwnershipTypeFilter, setShowOwnershipTypeFilter] = useState(false);

  // Toggle filter function for multiple selection
  const toggleFilter = (
    filterArray: string[], 
    setFilterArray: React.Dispatch<React.SetStateAction<string[]>>, 
    value: string
  ) => {
    if (filterArray.includes(value)) {
      setFilterArray(filterArray.filter(item => item !== value));
    } else {
      setFilterArray([...filterArray, value]);
    }
  };

  const { data: inventoryData = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const { data: manufacturerStats = [] } = useQuery<Array<{
    manufacturer: string;
    total: number;
    personal: number;
    company: number;
    usedPersonal: number;
    logo: string | null;
  }>>({
    queryKey: ["/api/inventory/manufacturer-stats"],
  });

  // Fetch manufacturers with logos from database (for dropdown-options-management integration)
  const { data: manufacturersWithLogo = [] } = useQuery<Array<{
    id: number;
    nameAr: string;
    nameEn?: string;
    logo: string | null;
  }>>({
    queryKey: ["/api/manufacturers"],
  });

  // Filter out sold cars from display unless showSoldCars is true
  let availableItems = showSoldCars ? inventoryData : inventoryData.filter(item => item.status !== "مباع");

  // For regular users, hide cars with status "خاص" (private) or "تشغيل" (operating)
  const restrictedRoles = ['salesperson', 'user', 'bank_accountant', 'seller'];
  if (restrictedRoles.includes(userRole)) {
    availableItems = availableItems.filter(item => 
      item.status !== "خاص" && item.status !== "تشغيل"
    );
  }
  
  // Get vehicles arrived today (within last 24 hours)
  const getVehiclesArrivedToday = () => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const arrivedVehicles = inventoryData.filter(item => {
      if (!item.entryDate) return false;
      const entryDate = new Date(item.entryDate);
      const isArrived = entryDate >= twentyFourHoursAgo && entryDate <= now;
      // Debug logging for troubleshooting
      if (isArrived) {
        console.log('Vehicle arrived today:', item.manufacturer, item.category, 'Entry date:', entryDate);
      }
      return isArrived;
    });
    
    console.log('Total vehicles arrived today:', arrivedVehicles.length);
    return arrivedVehicles;
  };
  
  const arrivedTodayVehicles = getVehiclesArrivedToday();

  // Function to get import type icon based on data
  const getImportTypeIcon = (importType: string) => {
    if (importType.includes("مستعمل")) return "/import-type-secondhand.svg";
    if (importType.includes("شركة")) return "/import-type-company.svg";
    if (importType.includes("شخصي")) return "/import-type-personal.svg"; 
    return "/import-type.svg"; // fallback
  };

  // Get count for each filter option - dynamically based on previously applied filters
  const getFilterCount = (field: keyof InventoryItem, value: string) => {
    const availableData = showSoldCars ? inventoryData : inventoryData.filter(item => item.status !== "مباع");
    
    // Apply all filters that come BEFORE the current field in the hierarchy
    let filteredData = availableData.filter(item => {
      // Apply search filter
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          item.chassisNumber?.toLowerCase().includes(query) ||
          item.category?.toLowerCase().includes(query) ||
          item.trimLevel?.toLowerCase().includes(query) ||
          item.exteriorColor?.toLowerCase().includes(query) ||
          item.interiorColor?.toLowerCase().includes(query) ||
          item.location?.toLowerCase().includes(query) ||
          item.manufacturer?.toLowerCase().includes(query) ||
          item.engineCapacity?.toLowerCase().includes(query) ||
          item.year?.toString().includes(query) ||
          item.status?.toLowerCase().includes(query) ||
          item.importType?.toLowerCase().includes(query) ||
          item.ownershipType?.toLowerCase().includes(query) ||
          item.notes?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Filter hierarchy: manufacturer -> category -> trimLevel -> year -> engineCapacity -> colors -> status -> importType
      if (field === "manufacturer") {
        // No previous filters for manufacturer
        return true;
      }
      
      if (field === "category") {
        // Apply manufacturer filter if set
        if (selectedManufacturer.length > 0 && !selectedManufacturer.includes(item.manufacturer || "")) return false;
        return true;
      }
      
      if (field === "trimLevel") {
        // Apply manufacturer and category filters
        if (selectedManufacturer.length > 0 && !selectedManufacturer.includes(item.manufacturer || "")) return false;
        if (selectedCategory.length > 0 && !selectedCategory.includes(item.category || "")) return false;
        return true;
      }
      
      if (field === "year") {
        // Apply manufacturer, category, trimLevel filters
        if (selectedManufacturer.length > 0 && !selectedManufacturer.includes(item.manufacturer || "")) return false;
        if (selectedCategory.length > 0 && !selectedCategory.includes(item.category || "")) return false;
        if (selectedTrimLevel.length > 0 && !selectedTrimLevel.includes(item.trimLevel || "")) return false;
        return true;
      }
      
      if (field === "engineCapacity") {
        // Apply all previous filters
        if (selectedManufacturer.length > 0 && !selectedManufacturer.includes(item.manufacturer || "")) return false;
        if (selectedCategory.length > 0 && !selectedCategory.includes(item.category || "")) return false;
        if (selectedTrimLevel.length > 0 && !selectedTrimLevel.includes(item.trimLevel || "")) return false;
        if (selectedYear.length > 0 && !selectedYear.includes(String(item.year))) return false;
        return true;
      }
      
      if (field === "exteriorColor") {
        if (selectedManufacturer.length > 0 && !selectedManufacturer.includes(item.manufacturer || "")) return false;
        if (selectedCategory.length > 0 && !selectedCategory.includes(item.category || "")) return false;
        if (selectedTrimLevel.length > 0 && !selectedTrimLevel.includes(item.trimLevel || "")) return false;
        if (selectedYear.length > 0 && !selectedYear.includes(String(item.year))) return false;
        if (selectedEngineCapacity.length > 0 && !selectedEngineCapacity.includes(item.engineCapacity || "")) return false;
        return true;
      }
      
      if (field === "interiorColor") {
        if (selectedManufacturer.length > 0 && !selectedManufacturer.includes(item.manufacturer || "")) return false;
        if (selectedCategory.length > 0 && !selectedCategory.includes(item.category || "")) return false;
        if (selectedTrimLevel.length > 0 && !selectedTrimLevel.includes(item.trimLevel || "")) return false;
        if (selectedYear.length > 0 && !selectedYear.includes(String(item.year))) return false;
        if (selectedEngineCapacity.length > 0 && !selectedEngineCapacity.includes(item.engineCapacity || "")) return false;
        if (selectedExteriorColor.length > 0 && !selectedExteriorColor.includes(item.exteriorColor || "")) return false;
        return true;
      }
      
      if (field === "status") {
        if (selectedManufacturer.length > 0 && !selectedManufacturer.includes(item.manufacturer || "")) return false;
        if (selectedCategory.length > 0 && !selectedCategory.includes(item.category || "")) return false;
        if (selectedTrimLevel.length > 0 && !selectedTrimLevel.includes(item.trimLevel || "")) return false;
        if (selectedYear.length > 0 && !selectedYear.includes(String(item.year))) return false;
        if (selectedEngineCapacity.length > 0 && !selectedEngineCapacity.includes(item.engineCapacity || "")) return false;
        if (selectedExteriorColor.length > 0 && !selectedExteriorColor.includes(item.exteriorColor || "")) return false;
        if (selectedInteriorColor.length > 0 && !selectedInteriorColor.includes(item.interiorColor || "")) return false;
        return true;
      }
      
      if (field === "importType") {
        // Apply all previous filters
        if (selectedManufacturer.length > 0 && !selectedManufacturer.includes(item.manufacturer || "")) return false;
        if (selectedCategory.length > 0 && !selectedCategory.includes(item.category || "")) return false;
        if (selectedTrimLevel.length > 0 && !selectedTrimLevel.includes(item.trimLevel || "")) return false;
        if (selectedYear.length > 0 && !selectedYear.includes(String(item.year))) return false;
        if (selectedEngineCapacity.length > 0 && !selectedEngineCapacity.includes(item.engineCapacity || "")) return false;
        if (selectedExteriorColor.length > 0 && !selectedExteriorColor.includes(item.exteriorColor || "")) return false;
        if (selectedInteriorColor.length > 0 && !selectedInteriorColor.includes(item.interiorColor || "")) return false;
        if (selectedStatus.length > 0 && !selectedStatus.includes(item.status || "")) return false;
        return true;
      }
      
      return true;
    });
    
    // Return count based on value
    if (value === "الكل") {
      return filteredData.length;
    }
    
    // Special handling for year field to handle number/string comparison
    if (field === "year") {
      return filteredData.filter(item => String(item.year) === String(value)).length;
    }
    
    return filteredData.filter(item => item[field] === value).length;
  };

  // Apply search filter
  const searchFilteredItems = searchQuery.trim() === "" 
    ? availableItems 
    : availableItems.filter(item => {
        const query = searchQuery.toLowerCase();
        return (
          item.chassisNumber?.toLowerCase().includes(query) ||
          item.category?.toLowerCase().includes(query) ||
          item.trimLevel?.toLowerCase().includes(query) ||
          item.exteriorColor?.toLowerCase().includes(query) ||
          item.interiorColor?.toLowerCase().includes(query) ||
          item.location?.toLowerCase().includes(query) ||
          item.manufacturer?.toLowerCase().includes(query) ||
          item.engineCapacity?.toLowerCase().includes(query) ||
          item.year?.toString().includes(query) ||
          item.status?.toLowerCase().includes(query) ||
          item.importType?.toLowerCase().includes(query) ||
          item.ownershipType?.toLowerCase().includes(query) ||
          item.notes?.toLowerCase().includes(query)
        );
      });

  // Filter Arrays - removed, now using dynamic data
  
  const manufacturerCategories: Record<string, string[]> = {
    "مرسيدس": ["S-Class", "E-Class", "C-Class", "GLE", "GLS", "A-Class", "CLA", "CLS", "G-Class", "GLC"],
    "بي ام دبليو": ["7 Series", "5 Series", "3 Series", "X7", "X5", "X3", "X1", "i8", "M3", "M5"],
    "اودي": ["A8", "A6", "A4", "Q8", "Q7", "Q5", "Q3", "A3", "TT", "RS6", "e-tron"],
    "تويوتا": ["لاند كروزر", "كامري", "كورولا", "هايلاندر", "بريوس", "أفالون", "RAV4", "سيكويا"],
    "لكزس": ["LX 600", "GX 460", "RX 350", "ES 350", "LS 500", "IS 350", "UX 250h", "LC 500"],
    "رنج روفر": ["Range Rover Vogue", "Range Rover Sport", "Range Rover Evoque", "Range Rover Velar", "Discovery", "Defender"],
    "بورش": ["Cayenne", "Macan", "911", "Panamera", "Taycan", "718"],
    "نيسان": ["باترول", "التيما", "ماكسيما", "اكس تريل", "سنترا", "مورانو", "أرمادا", "Z"],
    "انفينيتي": ["QX80", "QX60", "QX50", "Q50", "Q60", "QX55"],
    "هيونداي": ["النترا", "سوناتا", "توسان", "سانتا في", "باليسايد", "أكسنت", "فيلوستر"],
    "كيا": ["سورينتو", "تيلورايد", "سيراتو", "أوبتيما", "سبورتاج", "كارنيفال", "ستينغر"],
    "فولفو": ["XC90", "XC60", "S90", "V90", "S60", "XC40"],
    "جاكوار": ["F-PACE", "I-PACE", "XF", "XE", "F-TYPE"],
    "مازيراتي": ["Levante", "Ghibli", "Quattroporte", "GranTurismo"],
    "فيراري": ["488", "F8", "Roma", "Portofino", "SF90"],
    "لامبورغيني": ["Aventador", "Huracan", "Urus"],
    "تسلا": ["Model S", "Model 3", "Model X", "Model Y"],
    "لوسيد": ["Air Dream", "Air Touring", "Air Pure"],
    "كاديلاك": ["Escalade", "XT6", "XT5", "XT4", "CT5"],
    "جي ام سي": ["Yukon", "Tahoe", "Sierra", "Canyon", "Terrain"]
  };
  
  // Get dynamic filter arrays based on currently applied filters
  const getFilteredUniqueValues = (field: keyof InventoryItem, appliedFilters: Record<string, string>) => {
    const availableData = inventoryData.filter(item => !showSoldCars ? !item.isSold : true);
    
    let filteredData = availableData.filter(item => {
      // Apply search filter
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          item.chassisNumber?.toLowerCase().includes(query) ||
          item.category?.toLowerCase().includes(query) ||
          item.trimLevel?.toLowerCase().includes(query) ||
          item.exteriorColor?.toLowerCase().includes(query) ||
          item.interiorColor?.toLowerCase().includes(query) ||
          item.location?.toLowerCase().includes(query) ||
          item.manufacturer?.toLowerCase().includes(query) ||
          item.engineCapacity?.toLowerCase().includes(query) ||
          item.year?.toString().includes(query) ||
          item.status?.toLowerCase().includes(query) ||
          item.importType?.toLowerCase().includes(query) ||
          item.ownershipType?.toLowerCase().includes(query) ||
          item.notes?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Apply previous filters in hierarchy order
      if (appliedFilters.manufacturer && appliedFilters.manufacturer !== "الكل" && item.manufacturer !== appliedFilters.manufacturer) return false;
      if (appliedFilters.category && appliedFilters.category !== "الكل" && item.category !== appliedFilters.category) return false;
      if (appliedFilters.trimLevel && appliedFilters.trimLevel !== "الكل" && item.trimLevel !== appliedFilters.trimLevel) return false;
      if (appliedFilters.year && appliedFilters.year !== "الكل" && String(item.year) !== appliedFilters.year) return false;
      if (appliedFilters.engineCapacity && appliedFilters.engineCapacity !== "الكل" && item.engineCapacity !== appliedFilters.engineCapacity) return false;
      if (appliedFilters.exteriorColor && appliedFilters.exteriorColor !== "الكل" && item.exteriorColor !== appliedFilters.exteriorColor) return false;
      if (appliedFilters.interiorColor && appliedFilters.interiorColor !== "الكل" && item.interiorColor !== appliedFilters.interiorColor) return false;
      if (appliedFilters.status && appliedFilters.status !== "الكل" && item.status !== appliedFilters.status) return false;
      
      return true;
    });
    
    const values = filteredData
      .map(item => item[field])
      .filter((value, index, self) => value && self.indexOf(value) === index)
      .sort();
    return values;
  };

  // Get dynamic available options based on current filter selections
  const getFilteredAvailableOptions = (field: keyof InventoryItem): string[] => {
    const availableData = showSoldCars ? inventoryData : inventoryData.filter(item => item.status !== "مباع");
    
    let filteredData = availableData.filter(item => {
      // Apply search filter
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          item.chassisNumber?.toLowerCase().includes(query) ||
          item.category?.toLowerCase().includes(query) ||
          item.trimLevel?.toLowerCase().includes(query) ||
          item.exteriorColor?.toLowerCase().includes(query) ||
          item.interiorColor?.toLowerCase().includes(query) ||
          item.location?.toLowerCase().includes(query) ||
          item.manufacturer?.toLowerCase().includes(query) ||
          item.engineCapacity?.toLowerCase().includes(query) ||
          item.year?.toString().includes(query) ||
          item.status?.toLowerCase().includes(query) ||
          item.importType?.toLowerCase().includes(query) ||
          item.ownershipType?.toLowerCase().includes(query) ||
          item.notes?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Apply filters based on hierarchy - each filter depends on previous ones
      if (field !== "manufacturer" && selectedManufacturer.length > 0 && !selectedManufacturer.includes(item.manufacturer || "")) return false;
      if (field !== "category" && field !== "manufacturer" && selectedCategory.length > 0 && !selectedCategory.includes(item.category || "")) return false;
      if (field !== "trimLevel" && field !== "category" && field !== "manufacturer" && selectedTrimLevel.length > 0 && !selectedTrimLevel.includes(item.trimLevel || "")) return false;
      if (field !== "year" && field !== "trimLevel" && field !== "category" && field !== "manufacturer" && selectedYear.length > 0 && !selectedYear.includes(String(item.year))) return false;
      if (field !== "engineCapacity" && field !== "year" && field !== "trimLevel" && field !== "category" && field !== "manufacturer" && selectedEngineCapacity.length > 0 && !selectedEngineCapacity.includes(item.engineCapacity || "")) return false;
      if (field !== "exteriorColor" && field !== "engineCapacity" && field !== "year" && field !== "trimLevel" && field !== "category" && field !== "manufacturer" && selectedExteriorColor.length > 0 && !selectedExteriorColor.includes(item.exteriorColor || "")) return false;
      if (field !== "interiorColor" && field !== "exteriorColor" && field !== "engineCapacity" && field !== "year" && field !== "trimLevel" && field !== "category" && field !== "manufacturer" && selectedInteriorColor.length > 0 && !selectedInteriorColor.includes(item.interiorColor || "")) return false;
      if (field !== "status" && field !== "interiorColor" && field !== "exteriorColor" && field !== "engineCapacity" && field !== "year" && field !== "trimLevel" && field !== "category" && field !== "manufacturer" && selectedStatus.length > 0 && !selectedStatus.includes(item.status || "")) return false;
      if (field !== "importType" && field !== "status" && field !== "interiorColor" && field !== "exteriorColor" && field !== "engineCapacity" && field !== "year" && field !== "trimLevel" && field !== "category" && field !== "manufacturer" && selectedImportType.length > 0 && !selectedImportType.includes(item.importType || "")) return false;
      
      return true;
    });
    
    const values = filteredData
      .map(item => field === "year" ? String(item[field]) : item[field])
      .filter((value, index, self) => value != null && value !== "" && self.indexOf(value) === index)
      .sort();
      
    return values as string[];
  };

  const availableManufacturers = getFilteredAvailableOptions("manufacturer");
  const availableCategories = getFilteredAvailableOptions("category");
  const availableTrimLevels = getFilteredAvailableOptions("trimLevel");
  const availableYears = getFilteredAvailableOptions("year").sort((a: string, b: string) => parseInt(b) - parseInt(a));
  const availableEngineCapacities = getFilteredAvailableOptions("engineCapacity");
  const availableExteriorColors = getFilteredAvailableOptions("exteriorColor");
  const availableInteriorColors = getFilteredAvailableOptions("interiorColor");
  const availableStatuses = getFilteredAvailableOptions("status");
  const availableImportTypes = getFilteredAvailableOptions("importType");
  const availableOwnershipTypes = getFilteredAvailableOptions("ownershipType");
  
  // Count active filters
  const getActiveFilterCount = () => {
    return selectedManufacturer.length + selectedCategory.length + selectedTrimLevel.length + 
           selectedYear.length + selectedEngineCapacity.length + selectedExteriorColor.length + 
           selectedInteriorColor.length + selectedStatus.length + selectedImportType.length + 
           selectedOwnershipType.length;
  };

  const activeFiltersCount = getActiveFilterCount();
  
  // Reset category filter when manufacturer changes
  const handleManufacturerChange = (value: string) => {
    toggleFilter(selectedManufacturer, setSelectedManufacturer, value);
    setSelectedCategory([]);
  };

  // Apply all multiple selection filters
  const filteredItems = searchFilteredItems.filter(item => {
    return (
      (selectedManufacturer.length === 0 || selectedManufacturer.includes(item.manufacturer || "")) &&
      (selectedCategory.length === 0 || selectedCategory.includes(item.category || "")) &&
      (selectedTrimLevel.length === 0 || selectedTrimLevel.includes(item.trimLevel || "")) &&
      (selectedYear.length === 0 || selectedYear.includes(String(item.year))) &&
      (selectedEngineCapacity.length === 0 || selectedEngineCapacity.includes(item.engineCapacity || "")) &&
      (selectedInteriorColor.length === 0 || selectedInteriorColor.includes(item.interiorColor || "")) &&
      (selectedExteriorColor.length === 0 || selectedExteriorColor.includes(item.exteriorColor || "")) &&
      (selectedStatus.length === 0 || selectedStatus.includes(item.status || "")) &&
      (selectedImportType.length === 0 || selectedImportType.includes(item.importType || "")) &&
      (selectedOwnershipType.length === 0 || selectedOwnershipType.includes(item.ownershipType || ""))
    );
  });

  // Group ALL items by manufacturer first (including sold cars for count calculation)
  const allGroupedData = inventoryData.reduce((acc, item) => {
    if (!acc[item.manufacturer]) {
      acc[item.manufacturer] = {
        items: [],
        logo: null,
      };
    }
    acc[item.manufacturer].items.push(item);
    return acc;
  }, {} as Record<string, { items: InventoryItem[], logo: string | null }>);

  // Then filter for display (only available items)
  const groupedData = filteredItems.reduce((acc, item) => {
    if (!acc[item.manufacturer]) {
      acc[item.manufacturer] = {
        items: [],
        logo: null,
      };
    }
    acc[item.manufacturer].items.push(item);
    return acc;
  }, {} as Record<string, { items: InventoryItem[], logo: string | null }>);

  // Get manufacturer logo from database (dropdown-options-management integration)
  const getManufacturerLogoFromDB = (manufacturerName: string) => {
    if (!manufacturersWithLogo || !Array.isArray(manufacturersWithLogo)) return null;
    // Try to find manufacturer by Arabic name
    const manufacturer = manufacturersWithLogo.find((m: any) => 
      m.nameAr === manufacturerName.trim() || m.nameEn === manufacturerName.trim()
    );
    return manufacturer?.logo || null;
  };

  // Get manufacturer logo (legacy function for manufacturerStats)
  const getManufacturerLogo = (manufacturerName: string) => {
    if (!manufacturerStats || !Array.isArray(manufacturerStats)) return null;
    const manufacturer = manufacturerStats.find((m: any) => m.manufacturer === manufacturerName);
    return manufacturer?.logo || null;
  };

  // Toggle manufacturer expansion
  const toggleManufacturer = (manufacturerName: string) => {
    setExpandedManufacturer(expandedManufacturer === manufacturerName ? null : manufacturerName);
  };

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/inventory/${id}`),
    onSuccess: () => {
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف المركبة من المخزون",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/manufacturer-stats"] });
      setItemToDelete(null);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف المركبة",
        variant: "destructive",
      });
    }
  });

  // Sell item mutation
  const sellItemMutation = useMutation({
    mutationFn: (id: number) => {
      setSellingItemId(id);
      return apiRequest("POST", `/api/inventory/${id}/sell`);
    },
    onSuccess: () => {
      toast({
        title: "تم البيع بنجاح",
        description: "تم تسجيل بيع المركبة",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/manufacturer-stats"] });
      setSellingItemId(null);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تسجيل بيع المركبة",
        variant: "destructive",
      });
      setSellingItemId(null);
    }
  });

  // Reserve item mutation
  // Reservation success handler
  const handleReservationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
    queryClient.invalidateQueries({ queryKey: ["/api/inventory/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/inventory/manufacturer-stats"] });
  };

  // Cancel reservation mutation
  const cancelReservationMutation = useMutation({
    mutationFn: (id: number) => {
      setCancelingReservationId(id);
      return apiRequest("POST", `/api/inventory/${id}/cancel-reservation`);
    },
    onSuccess: () => {
      toast({
        title: "تم إلغاء الحجز",
        description: "تم إلغاء حجز المركبة",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/manufacturer-stats"] });
      setCancelingReservationId(null);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إلغاء حجز المركبة",
        variant: "destructive",
      });
      setCancelingReservationId(null);
    }
  });

  // Handle delete confirmation
  const handleDeleteItem = (item: InventoryItem) => {
    setItemToDelete(item);
  };

  // Handle sell item
  const handleSellItem = (item: InventoryItem) => {
    setSelectedVehicleForSale(item);
    setSellDialogOpen(true);
  };

  // Enhanced sell mutation for dialog
  const enhancedSellMutation = useMutation({
    mutationFn: async (data: { vehicleId: number; saleData: any }) => {
      return apiRequest("POST", `/api/inventory/${data.vehicleId}/sell`, { 
        body: JSON.stringify(data.saleData),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({
        title: "تم البيع بنجاح",
        description: "تم تسجيل بيع المركبة",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/manufacturer-stats"] });
      setSellDialogOpen(false);
      setSelectedVehicleForSale(null);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تسجيل بيع المركبة",
        variant: "destructive",
      });
    }
  });

  const handleConfirmSale = (saleData: any) => {
    if (!selectedVehicleForSale) return;
    
    enhancedSellMutation.mutate({
      vehicleId: selectedVehicleForSale.id,
      saleData
    });
  };

  // Handle reserve item
  const handleReserveItem = (item: InventoryItem) => {
    setReserveItem(item);
    setReserveDialogOpen(true);
  };

  // Handle cancel reservation
  const handleCancelReservation = (item: InventoryItem) => {
    if (cancelingReservationId !== null) return;
    cancelReservationMutation.mutate(item.id);
  };

  // Handle edit item
  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setShowEditDialog(true);
  };

  const handleShareItem = (item: InventoryItem) => {
    setShareVehicle(item);
    setShareDialogOpen(true);
  };

  // Bank sharing functionality
  const handleBankLongPress = (bankType: 'company' | 'personal') => {
    setSelectedBankType(bankType);
    setBankShareDialogOpen(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      return new Promise<void>((resolve, reject) => {
        if (document.execCommand('copy')) {
          resolve();
        } else {
          reject(new Error('Copy failed'));
        }
        document.body.removeChild(textArea);
      });
    } catch (error) {
      console.error('Failed to copy text to clipboard:', error);
      throw error;
    }
  };

  const getBankShareText = () => {
    const bankPageName = selectedBankType === 'company' ? 'بنوك الشركة' : 'البنوك الشخصية';
    const bankUrl = `${window.location.origin}/${selectedBankType === 'company' ? 'banks-company' : 'banks-personal'}`;
    return `${bankPageName}\n${bankUrl}`;
  };

  const handleBankCopy = async () => {
    try {
      await copyToClipboard(getBankShareText());
      toast({
        title: "تم نسخ الرابط",
        description: `تم نسخ رابط صفحة ${selectedBankType === 'company' ? 'بنوك الشركة' : 'البنوك الشخصية'}`
      });
    } catch (error) {
      toast({
        title: "خطأ في النسخ",
        description: "حدث خطأ أثناء نسخ الرابط",
        variant: "destructive"
      });
    }
  };

  const handleBankWhatsAppShare = () => {
    if (!bankPhoneNumber.trim()) {
      toast({
        title: "رقم الجوال مطلوب",
        description: "يرجى إدخال رقم الجوال للمشاركة عبر الواتساب",
        variant: "destructive"
      });
      return;
    }

    const shareText = encodeURIComponent(getBankShareText());
    const phoneNumber = bankPhoneNumber.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${shareText}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleBankShare = async () => {
    const bankPageName = selectedBankType === 'company' ? 'بنوك الشركة' : 'البنوك الشخصية';
    const bankUrl = `${window.location.origin}/${selectedBankType === 'company' ? 'banks-company' : 'banks-personal'}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: bankPageName,
          text: `صفحة ${bankPageName}`,
          url: bankUrl
        });
        toast({
          title: "تم المشاركة بنجاح",
          description: `تم مشاركة صفحة ${bankPageName}`
        });
      } catch (error: any) {
        // If user cancels sharing, don't show error
        if (error.name !== 'AbortError') {
          // Fallback to copy
          await handleBankCopy();
        }
      }
    } else {
      // Fallback to copy functionality
      await handleBankCopy();
    }
  };

  const handleCreateQuote = (item: InventoryItem) => {
    // Store vehicle data in localStorage for the quotation creation page
    localStorage.setItem('selectedVehicleForQuote', JSON.stringify(item));
    // Navigate to quotation creation page
    window.location.href = '/quotation-creation';
  };



  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case "متوفر":
        return "bg-green-100 text-green-800 border-green-200";
      case "في الطريق":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "قيد الصيانة":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "محجوز":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-950 relative">
        {/* Company Logo Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <img 
            src={companyLogo || "/company-logo.svg"} 
            alt="شعار الشركة" 
            className="w-96 h-96 object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/copmany logo.svg";
            }}
          />
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 relative z-10"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative overflow-hidden ${
      neumorphismMode 
        ? 'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400' 
        : 'bg-gradient-to-br from-[#00627F] via-[#004861] to-[#00627F]'
    }`} dir="rtl">
      {/* Company Logo Background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <img 
          src={companyLogo || "/company-logo.svg"} 
          alt="شعار الشركة" 
          className="w-96 h-96 object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/copmany logo.svg";
          }}
        />
      </div>
      {/* Background Animation Removed */}
      <div className="relative z-10" dir="rtl">
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b ${
        neumorphismMode 
          ? 'neuro-container border-gray-300' 
          : 'glass-container border-white/20 dark:border-slate-700/30'
      }`}>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo and Company Name */}
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                  {companyLogo ? (
                    <img 
                      src={companyLogo} 
                      alt="شعار الشركة" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img 
                      src="/copmany logo.svg" 
                      alt="شعار البريمي للسيارات" 
                      className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                    />
                  )}
                </div>
                

              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-white drop-shadow-lg hover:text-amber-400 transition-colors duration-300">{companyName}</h1>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-2 space-x-reverse">


              {/* Dashboard Button - Hidden for normal users (salesperson) */}
              {canViewPage(userRole as UserRole, "inventory") && (
                <Link href="/inventory">
                  <Button variant="outline" size="sm" className={
                    neumorphismMode 
                      ? "neuro-button" 
                      : "glass-button glass-text-primary"
                  }>
                    <Home size={16} className="ml-1" />
                    <span className="hidden sm:inline">لوحة التحكم</span>
                  </Button>
                </Link>
              )}

              {/* Arrived Today Button */}
              <div className="relative">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={
                    neumorphismMode 
                      ? "neuro-button" 
                      : "glass-button glass-text-primary"
                  }
                  onClick={() => {
                    setArrivedTodayOpen(true);
                    setArrivedTodayNotificationSeen(true);
                  }}
                >
                  <Bell size={16} className="ml-1" />
                  <span className="hidden sm:inline">وصل اليوم</span>
                  {arrivedTodayVehicles.length > 0 && !arrivedTodayNotificationSeen && (
                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {arrivedTodayVehicles.length}
                    </div>
                  )}
                </Button>
              </div>

              {/* Attendance Button */}
              <Button 
                variant="outline" 
                size="sm" 
                className={
                  neumorphismMode 
                    ? "neuro-button" 
                    : "glass-button glass-text-primary"
                }
                onClick={() => setAttendanceDialogOpen(true)}
              >
                <UserCheck size={16} className="ml-1" />
                <span className="hidden sm:inline">الدوام</span>
              </Button>



              {/* Bank Header Icons */}
              <div className="flex items-center space-x-1 space-x-reverse">
                <Link href="/banks-company">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="glass-button glass-text-primary p-2" 
                    title="بنوك الشركة"
                    onMouseDown={(e) => {
                      const longPressTimer = setTimeout(() => {
                        handleBankLongPress('company');
                      }, 800);
                      
                      const clearTimer = () => {
                        clearTimeout(longPressTimer);
                        document.removeEventListener('mouseup', clearTimer);
                        document.removeEventListener('mouseleave', clearTimer);
                      };
                      
                      document.addEventListener('mouseup', clearTimer);
                      document.addEventListener('mouseleave', clearTimer);
                    }}
                  >
                    <Building2 size={18} />
                  </Button>
                </Link>
                <Link href="/banks-personal">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="glass-button glass-text-primary p-2" 
                    title="البنوك الشخصية"
                    onMouseDown={(e) => {
                      const longPressTimer = setTimeout(() => {
                        handleBankLongPress('personal');
                      }, 800);
                      
                      const clearTimer = () => {
                        clearTimeout(longPressTimer);
                        document.removeEventListener('mouseup', clearTimer);
                        document.removeEventListener('mouseleave', clearTimer);
                      };
                      
                      document.addEventListener('mouseup', clearTimer);
                      document.addEventListener('mouseleave', clearTimer);
                    }}
                  >
                    <CreditCard size={18} />
                  </Button>
                </Link>
              </div>



              {/* Logout Button */}
              <Button onClick={onLogout} variant="outline" size="sm" className="glass-button glass-text-primary">
                <LogOut size={16} className="ml-1" />
                <span className="hidden sm:inline">تسجيل الخروج</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-8 text-right">
          
          {/* Search and Filter Section */}
          <div className="mt-6">
            {/* Search Input and Filter Toggle */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="relative max-w-md">
                  <Search size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="البحث في رقم الهيكل، الفئة، درجة التجهيز، اللون، الموقع..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="glass-search pr-10 pl-4 py-2 w-full text-right"
                  />
                </div>
                
                {/* QR Scanner Button */}
                <QRScannerButton 
                  onVehicleFound={(vehicleId: number) => {
                    // Vehicle will be navigated to by the QR scanner button itself
                    console.log('Vehicle found:', vehicleId);
                  }}
                  userRole={userRole}
                  username={username}
                  className={
                    neumorphismMode 
                      ? "neuro-button h-10" 
                      : "glass-button glass-text-primary h-10"
                  }
                />
              </div>
              
              {/* Filter Toggle Button - Right Aligned */}
              <div className="flex items-center justify-start w-full sm:w-auto">
                <div className="w-full">
                  <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
                    <div className="flex justify-start w-full">
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="glass-toggle-button flex items-center gap-2"
                        >
                          <Filter size={16} />
                          الفلاتر
                          {activeFiltersCount > 0 && (
                            <span className="glass-badge text-xs px-2 py-1 rounded-full">
                              {activeFiltersCount}
                            </span>
                          )}
                          {filtersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  
                  <CollapsibleContent className="mt-4 w-full">
                    <Card className="glass-collapsible w-full">
                      <CardContent className="p-6 w-full">
                        {/* Enhanced Filter Controls with Button Design */}
                        <div className="space-y-6 animate-in fade-in duration-300">
                          
                          {/* Multi-Select Filter Component */}
                          {(() => {
                            const MultiSelectFilter = ({ title, items, selectedFilters, onFilterToggle, getCount, toggleState, onToggleChange }: {
                              title: string;
                              items: string[];
                              selectedFilters: string[];
                              onFilterToggle: (item: string) => void;
                              getCount: (item: string) => number;
                              toggleState: boolean;
                              onToggleChange: (state: boolean) => void;
                            }) => (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-sm font-medium text-white drop-shadow-md">{title}</h3>
                                  <div className="flex items-center space-x-2 space-x-reverse">
                                    <span className="text-xs text-white/70 drop-shadow-sm">
                                      {selectedFilters.length > 0 ? `(${selectedFilters.length} محدد)` : ""}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onToggleChange(!toggleState)}
                                      className="glass-button p-2 h-8 w-8"
                                    >
                                      {toggleState ? (
                                        <Eye size={16} className="glass-text-accent" />
                                      ) : (
                                        <EyeOff size={16} className="glass-text-secondary" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                                {toggleState && (
                                  <div className="relative group">
                                  <ScrollArea className="w-full">
                                    <div className="flex space-x-2 space-x-reverse pb-2">
                                      {items.map((item) => {
                                        const isSelected = selectedFilters.includes(item);
                                        return (
                                          <Button
                                            key={item}
                                            variant={isSelected ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => onFilterToggle(item)}
                                            className={`glass-button transition-all duration-200 whitespace-nowrap relative ${
                                              isSelected
                                                ? "glass-button-primary text-white drop-shadow-md"
                                                : "glass-text-primary hover:glass-button-secondary"
                                            }`}
                                          >
                                            {isSelected && (
                                              <span className="absolute top-0 left-0 w-2 h-2 bg-green-400 rounded-full transform -translate-x-1 -translate-y-1"></span>
                                            )}
                                            {item} ({getCount(item)})
                                          </Button>
                                        );
                                      })}
                                    </div>
                                  </ScrollArea>
                                  {/* Navigation Arrows */}
                                  <button 
                                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      const scrollArea = e.currentTarget.parentElement?.querySelector('[data-radix-scroll-area-viewport]');
                                      if (scrollArea) scrollArea.scrollBy({ left: -200, behavior: 'smooth' });
                                    }}
                                  >
                                    <ChevronLeft size={16} className="text-slate-600 dark:text-slate-400" />
                                  </button>
                                  <button 
                                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      const scrollArea = e.currentTarget.parentElement?.querySelector('[data-radix-scroll-area-viewport]');
                                      if (scrollArea) scrollArea.scrollBy({ left: 200, behavior: 'smooth' });
                                    }}
                                  >
                                    <ChevronRight size={16} className="text-slate-600 dark:text-slate-400" />
                                  </button>
                                </div>
                                )}
                              </div>
                            );
                            
                            return (
                              <div className="space-y-4">
                                
                                {/* Individual Multiple Selection Filters */}
                                <div className="space-y-3">
                                  <ScrollableFilter
                                    title="الصانع"
                                    items={availableManufacturers}
                                    selectedItems={selectedManufacturer}
                                    onItemToggle={(item) => toggleFilter(selectedManufacturer, setSelectedManufacturer, item)}
                                    onClearSelection={() => setSelectedManufacturer([])}
                                  />
                                  <ScrollableFilter
                                    title="الفئة"
                                    items={availableCategories}
                                    selectedItems={selectedCategory}
                                    onItemToggle={(item) => toggleFilter(selectedCategory, setSelectedCategory, item)}
                                    onClearSelection={() => setSelectedCategory([])}
                                  />
                                  
                                  <ScrollableFilter
                                    title="درجة التجهيز"
                                    items={availableTrimLevels}
                                    selectedItems={selectedTrimLevel}
                                    onItemToggle={(item) => toggleFilter(selectedTrimLevel, setSelectedTrimLevel, item)}
                                    onClearSelection={() => setSelectedTrimLevel([])}
                                  />
                                  
                                  <ScrollableFilter
                                    title="السنة"
                                    items={availableYears}
                                    selectedItems={selectedYear}
                                    onItemToggle={(item) => toggleFilter(selectedYear, setSelectedYear, item)}
                                    onClearSelection={() => setSelectedYear([])}
                                  />
                                  
                                  <ScrollableFilter
                                    title="سعة المحرك"
                                    items={availableEngineCapacities}
                                    selectedItems={selectedEngineCapacity}
                                    onItemToggle={(item) => toggleFilter(selectedEngineCapacity, setSelectedEngineCapacity, item)}
                                    onClearSelection={() => setSelectedEngineCapacity([])}
                                  />
                                  
                                  <ScrollableFilter
                                    title="اللون الخارجي"
                                    items={availableExteriorColors}
                                    selectedItems={selectedExteriorColor}
                                    onItemToggle={(item) => toggleFilter(selectedExteriorColor, setSelectedExteriorColor, item)}
                                    onClearSelection={() => setSelectedExteriorColor([])}
                                  />
                                  
                                  <ScrollableFilter
                                    title="اللون الداخلي"
                                    items={availableInteriorColors}
                                    selectedItems={selectedInteriorColor}
                                    onItemToggle={(item) => toggleFilter(selectedInteriorColor, setSelectedInteriorColor, item)}
                                    onClearSelection={() => setSelectedInteriorColor([])}
                                  />
                                  
                                  <ScrollableFilter
                                    title="الحالة"
                                    items={availableStatuses}
                                    selectedItems={selectedStatus}
                                    onItemToggle={(item) => toggleFilter(selectedStatus, setSelectedStatus, item)}
                                    onClearSelection={() => setSelectedStatus([])}
                                  />
                                  
                                  <ScrollableFilter
                                    title="نوع الاستيراد"
                                    items={availableImportTypes}
                                    selectedItems={selectedImportType}
                                    onItemToggle={(item) => toggleFilter(selectedImportType, setSelectedImportType, item)}
                                    onClearSelection={() => setSelectedImportType([])}
                                  />
                                  
                                  <ScrollableFilter
                                    title="نوع الملكية"
                                    items={availableOwnershipTypes}
                                    selectedItems={selectedOwnershipType}
                                    onItemToggle={(item) => toggleFilter(selectedOwnershipType, setSelectedOwnershipType, item)}
                                    onClearSelection={() => setSelectedOwnershipType([])}
                                  />
                                  
                                  {/* Special Views Section */}
                                  <div className="pt-4 border-t border-white/20 space-y-3">
                                    <h4 className="text-sm font-medium text-white/80 mb-2">عروض خاصة</h4>
                                    
                                    {/* Show Sold Cars Toggle */}
                                    <Button
                                      variant={showSoldCars ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => setShowSoldCars(!showSoldCars)}
                                      className={`glass-button transition-all duration-200 ${
                                        showSoldCars
                                          ? "glass-button-primary text-white"
                                          : "glass-text-primary"
                                      }`}
                                      data-testid="button-toggle-sold-cars"
                                    >
                                      <CheckCircle className="h-4 w-4 ml-2" />
                                      {showSoldCars ? "إخفاء المباعة" : "إظهار المباعة"}
                                      {showSoldCars && (
                                        <Badge variant="secondary" className="mr-2 bg-green-500/20 text-green-300 border-green-400/30">
                                          {inventoryData.filter(item => item.status === "مباع").length}
                                        </Badge>
                                      )}
                                    </Button>

                                    {/* Reset All Filters Button */}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedManufacturer([]);
                                        setSelectedCategory([]);
                                        setSelectedTrimLevel([]);
                                        setSelectedYear([]);
                                        setSelectedEngineCapacity([]);
                                        setSelectedInteriorColor([]);
                                        setSelectedExteriorColor([]);
                                        setSelectedStatus([]);
                                        setSelectedImportType([]);
                                        setSelectedOwnershipType([]);
                                        setShowSoldCars(false);
                                      }}
                                      className="glass-button w-full"
                                      data-testid="button-reset-all-filters"
                                    >
                                      <X className="h-4 w-4 ml-2" />
                                      مسح جميع الفلاتر والعروض
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Search Results Indicator */}
        {searchQuery.trim() !== "" && (
          <div className="mb-6 p-4 bg-dynamic-card border border-dynamic rounded-lg">
            <div className="flex items-center gap-2 text-dynamic-primary">
              <Search size={18} />
              <span className="font-medium">
                نتائج البحث عن "{searchQuery}": {filteredItems.length} نتيجة
              </span>
              {filteredItems.length === 0 && (
                <span className="text-slate-600 mr-2">- لم يتم العثور على نتائج</span>
              )}
            </div>
            {filteredItems.length > 0 && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-2 text-sm text-custom-primary hover:text-custom-primary-dark underline"
              >
                مسح البحث
              </button>
            )}
          </div>
        )}



        {/* Vehicle Cards by Manufacturer */}
        <div className="space-y-8 p-6">
          
          {Object.entries(groupedData)
            .filter(([manufacturer]) => selectedManufacturer.length === 0 || selectedManufacturer.includes(manufacturer))
            .sort(([, a], [, b]) => {
              // Sort by count of available items (highest first)
              const aCount = showSoldCars 
                ? allGroupedData[a.items[0]?.manufacturer]?.items.length || 0
                : allGroupedData[a.items[0]?.manufacturer]?.items.filter(item => item.status !== "مباع").length || 0;
              const bCount = showSoldCars 
                ? allGroupedData[b.items[0]?.manufacturer]?.items.length || 0
                : allGroupedData[b.items[0]?.manufacturer]?.items.filter(item => item.status !== "مباع").length || 0;
              return bCount - aCount; // Descending order (highest first)
            })
            .map(([manufacturer, data]) => {
            const logo = getManufacturerLogo(manufacturer);
            
            return (
              <div key={manufacturer} className="space-y-4 relative z-10">
                {/* Manufacturer Header - Clickable */}
                <div 
                  className="glass-card dark:glass-card-dark rounded-lg p-6 cursor-pointer border-0 transition-all duration-200"
                  onClick={() => toggleManufacturer(manufacturer)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6 space-x-reverse">
                      {/* Manufacturer Logo with Interactive Hover Effect */}
                      <div className="relative group">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
                          <ManufacturerLogo 
                            manufacturerName={manufacturer} 
                            size="lg" 
                            className="w-12 h-12 transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-md"
                            customLogo={getManufacturerLogoFromDB(manufacturer) || undefined}
                          />
                        </div>
                        
                        {/* Hover Ring Effect */}
                        <div className="absolute inset-0 rounded-full border-2 border-dynamic-primary opacity-0 scale-125 transition-all duration-300 group-hover:opacity-50 group-hover:scale-110 pointer-events-none"></div>
                        
                        {/* Pulse Effect */}
                        <div className="absolute inset-0 rounded-full bg-dynamic-primary opacity-0 scale-150 transition-all duration-500 group-hover:opacity-20 group-hover:scale-125 group-hover:animate-pulse pointer-events-none"></div>
                      </div>
                      
                      {/* Manufacturer Name and Count */}
                      <div className="flex flex-col">
                        <h2 className="text-xl sm:text-2xl font-bold text-white dark:text-white mb-2 drop-shadow-lg">{manufacturer}</h2>
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                          <Badge variant="secondary" className="bg-white/20 text-white dark:text-white px-1.5 sm:px-3 py-0.5 sm:py-1 text-xs font-medium sm:font-semibold backdrop-blur-sm border border-white/30 shrink-0">
                            {showSoldCars 
                              ? allGroupedData[manufacturer]?.items.length || 0 
                              : allGroupedData[manufacturer]?.items.filter(item => item.status !== "مباع").length || 0} مركبة
                          </Badge>
                          <Badge variant="outline" className="border-green-300/40 text-green-200 bg-green-500/20 dark:bg-green-900/40 backdrop-blur-sm px-1.5 sm:px-3 py-0.5 sm:py-1 text-xs font-medium sm:font-semibold shrink-0">
                            {data.items.filter(item => item.status === "متوفر").length} متوفر
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Expand/Collapse Icon */}
                    <div className="text-white/60">
                      {expandedManufacturer === manufacturer ? (
                        <ChevronUp size={24} className="text-white drop-shadow-lg" />
                      ) : (
                        <ChevronDown size={24} className="text-white/80 drop-shadow-lg" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Vehicle Cards Grid - Conditionally Rendered with Animation */}
                {expandedManufacturer === manufacturer && (
                  <div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in slide-in-from-top-2 fade-in duration-300"
                  >
                  {data.items.map((item) => (
                    <Card key={item.id} className={`rounded-2xl overflow-hidden border-0 relative ${
                      neumorphismMode 
                        ? 'neuro-card' 
                        : 'glass-card dark:glass-card-dark'
                    }`}>
                      <CardHeader className="pb-3 relative z-10">
                        <div className="flex items-center justify-between">
                          {/* Category and Trim Level Row */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <img src="/car.svg" alt="Category" className="w-9 h-9" style={{filter: 'brightness(0) saturate(100%) invert(53%) sepia(82%) saturate(423%) hue-rotate(9deg) brightness(98%) contrast(88%)'}} />
                              <span className="font-bold text-sm drop-shadow-sm" style={{color: '#C49632'}}>{item.category}</span>
                            </div>
                            {item.trimLevel && (
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-sm drop-shadow-sm" style={{color: '#C49632'}}>{item.trimLevel}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Status and Timer Row */}
                          <div className="flex items-center gap-2">
                            <EntryTimer 
                              entryDate={item.entryDate} 
                              className=""
                            />
                            <Badge variant="secondary" className={`${getStatusColor(item.status)} text-xs`}>
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 relative z-10">
                        <div className="space-y-3 text-sm">
                          {/* Row 1: Engine Capacity, Year, Exterior Color */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="flex items-center gap-1">
                              <img src="/car-engine.svg" alt="Engine" className="w-6 h-6 filter drop-shadow-sm" style={{filter: 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%) drop-shadow(0 1px 2px rgba(0,0,0,0.3))'}} />
                              <span className="font-semibold font-latin text-white dark:text-slate-100 text-xs drop-shadow-sm">{item.engineCapacity}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <img src="/year.svg" alt="Year" className="w-5 h-5 filter drop-shadow-sm" style={{filter: 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%) drop-shadow(0 1px 2px rgba(0,0,0,0.3))'}} />
                              <span className="font-semibold font-latin text-white dark:text-slate-100 text-xs drop-shadow-sm">{item.year}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <img src="/exterior-color.svg" alt="Exterior Color" className="w-6 h-6 filter drop-shadow-sm" style={{filter: 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%) drop-shadow(0 1px 2px rgba(0,0,0,0.3))'}} />
                              <span className="font-semibold text-white dark:text-slate-100 text-xs drop-shadow-sm">{item.exteriorColor}</span>
                            </div>
                          </div>
                          
                          {/* Row 2: Interior Color, Import Type, Ownership Type */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="flex items-center gap-1">
                              <img src="/interior-color.svg" alt="Interior Color" className="w-6 h-6 filter drop-shadow-sm" style={{filter: 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%) drop-shadow(0 1px 2px rgba(0,0,0,0.3))'}} />
                              <span className="font-semibold text-white dark:text-slate-100 text-xs drop-shadow-sm">{item.interiorColor}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <img src={getImportTypeIcon(item.importType)} alt="Import Type" className="w-6 h-6 filter drop-shadow-sm" style={{filter: 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%) drop-shadow(0 1px 2px rgba(0,0,0,0.3))'}} />
                              <span className="font-semibold text-white dark:text-slate-100 text-xs drop-shadow-sm">{item.importType}</span>
                            </div>
                            {item.ownershipType && (
                              <div className="flex items-center gap-1">
                                <img src="/logos/ownerchip.svg" alt="Ownership Type" className="w-6 h-6 filter drop-shadow-sm" style={{filter: 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%) drop-shadow(0 1px 2px rgba(0,0,0,0.3))'}} />
                                <span className="font-semibold text-white dark:text-slate-100 text-xs drop-shadow-sm">{item.ownershipType}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Row 3: Location and Chassis Number */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="flex items-center gap-1">
                              <img src="/location.svg" alt="Location" className="w-6 h-6 filter drop-shadow-sm" style={{filter: 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%) drop-shadow(0 1px 2px rgba(0,0,0,0.3))'}} />
                              <span className="font-semibold text-white dark:text-slate-100 text-xs drop-shadow-sm">{item.location}</span>
                            </div>
                            {item.chassisNumber && item.chassisNumber.trim() !== '' && (
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-white drop-shadow-sm">VIN:</span>
                                <span className="font-medium font-latin text-white dark:text-slate-100 text-xs drop-shadow-sm">
                                  {item.status === "مراجعة المشرف" ? "***" : item.chassisNumber}
                                </span>
                              </div>
                            )}
                            <div></div> {/* Empty cell for alignment */}
                          </div>
                          

                          
                          {/* Price and Mileage Row */}
                          {(item.price || ((item.importType === "مستعمل" || item.importType === "مستعمل شخصي") && (item as any).mileage)) && (
                            <div className="flex justify-between items-center py-2 border-t border-white/20 dark:border-slate-500/20 mt-3">
                              {item.price && (
                                <div className="flex items-center gap-1">
                                  <span className="text-white/80 dark:text-slate-300 font-medium text-sm drop-shadow-sm">السعر:</span>
                                  <span className="font-bold font-latin text-yellow-300 dark:text-yellow-300 text-sm drop-shadow-sm">{item.price}</span>
                                </div>
                              )}
                              {(item.importType === "مستعمل" || item.importType === "مستعمل شخصي") && (item as any).mileage && (
                                <div className="flex items-center gap-1">
                                  <span className="text-white/80 dark:text-slate-300 font-medium text-sm drop-shadow-sm">ممشي:</span>
                                  <span className="font-bold text-orange-300 dark:text-orange-300 text-sm drop-shadow-sm">{(item as any).mileage?.toLocaleString()} كم</span>
                                </div>
                              )}
                            </div>
                          )}


                          
                          {item.reservationDate && (
                            <div className="flex justify-between text-xs pt-2 border-t border-blue-100 mt-2 bg-blue-50 p-2 rounded">
                              <span className="text-blue-600 font-medium">تاريخ الحجز:</span>
                              <span className="font-medium text-blue-700">
                                {new Date(item.reservationDate).toLocaleDateString('en-US')}
                              </span>
                            </div>
                          )}
                          
                          {item.notes && (
                            <div className="pt-2 border-t border-slate-100 mt-2">
                              <span className="text-slate-500 text-xs">ملاحظات:</span>
                              <p className="text-xs text-slate-700 mt-1">{item.notes}</p>
                            </div>
                          )}

                          {/* Action Buttons - First Row */}
                          <div className="pt-3 mt-3 border-t border-slate-200">
                            <div className="flex justify-center gap-1 mb-2">
                              {/* Share button - Available for all users with share permission */}
                              {canShareItem(userRole as UserRole, "cardView") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className={`px-2 h-8 ${
                                    neumorphismMode 
                                      ? 'neuro-button' 
                                      : 'hover:bg-yellow-50 border-yellow-300'
                                  }`}
                                  style={{color: neumorphismMode ? '#333' : '#BF9231'}}
                                  onClick={() => handleShareItem(item)}
                                  title="مشاركة"
                                  data-testid={`button-share-${item.id}`}
                                >
                                  <Share2 size={14} />
                                </Button>
                              )}

                              {/* Hide sell button for salesperson and bank_accountant roles */}
                              {canEditItem(userRole as UserRole, "cardView") && userRole !== "salesperson" && userRole !== "bank_accountant" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="px-2 h-8 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-300"
                                  onClick={() => handleSellItem(item)}
                                  disabled={sellingItemId === item.id || item.isSold}
                                  title="بيع"
                                  data-testid={`button-sell-${item.id}`}
                                >
                                  <ShoppingCart size={14} />
                                </Button>
                              )}

                              {/* Show quote button for bank_accountant, hide for salesperson */}
                              {canViewPage(userRole as UserRole, "quotationCreation") && userRole !== "salesperson" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="px-2 h-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-300"
                                  onClick={() => handleCreateQuote(item)}
                                  title="إنشاء عرض سعر"
                                  data-testid={`button-quote-${item.id}`}
                                >
                                  <FileText size={14} />
                                </Button>
                              )}

                              {/* Hide price card button for salesperson and bank_accountant roles */}
                              {canViewPage(userRole as UserRole, "priceCards") && userRole !== "salesperson" && userRole !== "bank_accountant" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="px-2 h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-300"
                                  onClick={() => {
                                    localStorage.setItem('selectedVehicleForPriceCard', JSON.stringify(item));
                                    window.location.href = '/price-cards';
                                  }}
                                  title="إنشاء بطاقة سعر"
                                  data-testid={`button-price-card-${item.id}`}
                                >
                                  <Receipt size={14} />
                                </Button>
                              )}

                              {/* Reservation buttons - Available for all users with reservation permission */}
                              {canReserveItem(userRole as UserRole, "cardView") && (
                                item.status === "محجوز" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="px-2 h-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-300"
                                    onClick={() => handleCancelReservation(item)}
                                    disabled={cancelingReservationId === item.id}
                                    title="إلغاء الحجز"
                                    data-testid={`button-cancel-reservation-${item.id}`}
                                  >
                                    <X size={14} />
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="px-2 h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300"
                                    onClick={() => handleReserveItem(item)}
                                    disabled={item.status === "محجوز" || item.isSold}
                                    title="حجز"
                                    data-testid={`button-reserve-${item.id}`}
                                  >
                                    <Calendar size={14} />
                                  </Button>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {Object.keys(groupedData).length === 0 && (
          <div className="text-center py-12 relative z-10">
            <div className="text-white/60 text-6xl mb-4 drop-shadow-lg">🚗</div>
            <h3 className="text-xl font-semibold text-white mb-2 drop-shadow-lg">لا توجد مركبات متوفرة</h3>
            <p className="text-white/80 drop-shadow-sm">قم بإضافة مركبات جديدة لعرضها هنا</p>
          </div>
        )}
      </div>

      {/* Static Floating Action Button - Hidden for salesperson */}
      {canCreateItem(userRole as UserRole, "cardView") && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setShowEditDialog(true)}
            className="bg-custom-primary hover:bg-custom-primary-dark text-white shadow-lg hover:shadow-xl rounded-full w-16 h-16 flex items-center justify-center transition-colors duration-200"
            size="lg"
            data-testid="button-add-vehicle"
            title="إضافة مركبة جديدة"
          >
            <Plus size={24} />
          </Button>
        </div>
      )}



      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent className="sm:max-w-md" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              تأكيد حذف المركبة
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              هل أنت متأكد من حذف هذه المركبة؟ لا يمكن التراجع عن هذا الإجراء.
              <br />
              <br />
              <span className="font-semibold">
                {itemToDelete?.manufacturer} {itemToDelete?.category} - {itemToDelete?.year}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && deleteItemMutation.mutate(itemToDelete.id)}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteItemMutation.isPending}
            >
              {deleteItemMutation.isPending ? "جاري الحذف..." : "تأكيد الحذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Item Form */}
      <InventoryForm
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        editItem={editingItem || undefined}
      />

      {/* Vehicle Share Dialog */}
      {shareVehicle && (
        <VehicleShare
          vehicle={shareVehicle}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
        />
      )}



      {/* Quotation Management Dialog */}
      <QuotationManagement
        open={quotationManagementOpen}
        onOpenChange={setQuotationManagementOpen}
      />

      {/* Reservation Dialog */}
      <ReservationDialog
        open={reserveDialogOpen}
        onOpenChange={setReserveDialogOpen}
        item={reserveItem}
        username={username}
        onSuccess={handleReservationSuccess}
      />



      {/* Arrived Today Dialog */}
      <Dialog open={arrivedTodayOpen} onOpenChange={setArrivedTodayOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto z-50" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-amber-600 flex items-center gap-2">
              <Bell className="w-6 h-6" />
              السيارات التي وصلت اليوم
              {arrivedTodayVehicles.length > 0 && (
                <Badge className="bg-yellow-500 text-black">
                  {arrivedTodayVehicles.length} سيارة
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {arrivedTodayVehicles.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">لا توجد سيارات وصلت خلال آخر 24 ساعة</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {arrivedTodayVehicles.map((vehicle) => (
                  <Card key={vehicle.id} className="glass-container border-l-4 border-l-yellow-500">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Vehicle Main Info */}
                        <div className="lg:col-span-2">
                          <div className="flex items-center gap-4 mb-4">
                            <ManufacturerLogo 
                              manufacturerName={vehicle.manufacturer} 
                              size="lg" 
                              className="w-16 h-16"
                              customLogo={getManufacturerLogoFromDB(vehicle.manufacturer) || undefined}
                            />
                            <div>
                              <h3 className="font-bold text-white text-xl">
                                {vehicle.manufacturer} {vehicle.category}
                              </h3>
                              {vehicle.trimLevel && (
                                <p className="text-yellow-400 font-semibold text-lg">
                                  {vehicle.trimLevel}
                                </p>
                              )}
                              <Badge className={`${getStatusColor(vehicle.status)} mt-1`}>
                                {vehicle.status}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Vehicle Details Grid */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-white/80">
                                <Calendar size={16} />
                                <span className="font-medium">السنة:</span>
                                <span className="text-white">{vehicle.year}</span>
                              </div>
                              <div className="flex items-center gap-2 text-white/80">
                                <div className="w-4 h-4 rounded-full border border-white/40"></div>
                                <span className="font-medium">اللون الخارجي:</span>
                                <span className="text-white">{vehicle.exteriorColor}</span>
                              </div>
                              <div className="flex items-center gap-2 text-white/80">
                                <div className="w-4 h-4 rounded border border-white/40"></div>
                                <span className="font-medium">اللون الداخلي:</span>
                                <span className="text-white">{vehicle.interiorColor}</span>
                              </div>
                              <div className="flex items-center gap-2 text-white/80">
                                <img src="/car-engine.svg" alt="engine" className="w-4 h-4" />
                                <span className="font-medium">المحرك:</span>
                                <span className="text-white">{vehicle.engineCapacity}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-white/80">
                                <img src={getImportTypeIcon(vehicle.importType)} alt="import" className="w-4 h-4" />
                                <span className="font-medium">نوع الاستيراد:</span>
                                <span className="text-white">{vehicle.importType}</span>
                              </div>
                              <div className="flex items-center gap-2 text-white/80">
                                <img src="/ownerchip.svg" alt="ownership" className="w-4 h-4" />
                                <span className="font-medium">نوع الملكية:</span>
                                <span className="text-white">{vehicle.ownershipType}</span>
                              </div>
                              <div className="flex items-center gap-2 text-white/80">
                                <img src="/location.svg" alt="location" className="w-4 h-4" />
                                <span className="font-medium">الموقع:</span>
                                <span className="text-white">{vehicle.location}</span>
                              </div>
                              {vehicle.price && (
                                <div className="flex items-center gap-2 text-white/80">
                                  <span className="font-medium">السعر:</span>
                                  <span className="text-green-400 font-bold">{Number(vehicle.price).toLocaleString()} ريال</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Arrival Info */}
                        <div className="lg:col-span-1 bg-white/5 rounded-lg p-4">
                          <h4 className="font-bold text-yellow-400 mb-3">معلومات الوصول</h4>
                          <div className="space-y-2 text-sm">
                            <div className="text-white/80">
                              <span className="font-medium">تاريخ الوصول:</span>
                              <div className="text-white mt-1">
                                {vehicle.entryDate ? new Date(vehicle.entryDate).toLocaleDateString('en-GB', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit'
                                }) : 'غير محدد'}
                              </div>
                            </div>
                            <div className="text-white/80">
                              <span className="font-medium">وقت الوصول:</span>
                              <div className="text-white mt-1">
                                {vehicle.entryDate ? new Date(vehicle.entryDate).toLocaleTimeString('en-GB', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false
                                }) : 'غير محدد'}
                              </div>
                            </div>
                            <div className="text-white/80">
                              <span className="font-medium">رقم الهيكل:</span>
                              <div className="text-white mt-1 font-mono text-xs break-all">
                                {vehicle.status === "مراجعة المشرف" ? "***" : vehicle.chassisNumber}
                              </div>
                            </div>
                            {vehicle.notes && (
                              <div className="text-white/80">
                                <span className="font-medium">ملاحظات:</span>
                                <div className="text-white/90 mt-1 text-xs">
                                  {vehicle.notes}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Action Buttons for Today's Arrivals */}
                          <div className="mt-4 pt-4 border-t border-white/20">
                            <h5 className="font-bold text-white mb-3 text-sm">إجراءات سريعة</h5>
                            <div className="flex gap-2 flex-wrap">
                              {/* Hide sell button for bank_accountant and salesperson roles */}
                              {canEditItem(userRole as UserRole, "cardView") && userRole !== "bank_accountant" && userRole !== "salesperson" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="px-3 h-8 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-300"
                                  onClick={() => handleSellItem(vehicle)}
                                  disabled={sellingItemId === vehicle.id || vehicle.status === "مباع"}
                                  title="بيع"
                                >
                                  <ShoppingCart size={14} className="ml-1" />
                                  بيع
                                </Button>
                              )}
                              
                              {/* Share button - Available for all users */}
                              {canShareItem(userRole as UserRole, "cardView") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="px-3 h-8 hover:bg-yellow-50 border-yellow-300"
                                  style={{color: '#BF9231'}}
                                  onClick={() => handleShareItem(vehicle)}
                                  title="مشاركة"
                                >
                                  <Share2 size={14} className="ml-1" />
                                  مشاركة
                                </Button>
                              )}

                              {/* Hide price card button for bank_accountant and salesperson roles */}
                              {canViewPage(userRole as UserRole, "priceCards") && userRole !== "salesperson" && userRole !== "bank_accountant" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="px-3 h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-300"
                                  onClick={() => {
                                    setSelectedVehicleForPriceCard(vehicle);
                                    setPriceCardPreviewOpen(true);
                                  }}
                                  title="معاينة بطاقة السعر"
                                >
                                  <Receipt size={14} className="ml-1" />
                                  بطاقة سعر
                                </Button>
                              )}

                              {/* Reservation buttons - Available for users with reservation permission */}
                              {canReserveItem(userRole as UserRole, "cardView") && (
                                vehicle.status === "محجوز" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="px-3 h-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-300"
                                    onClick={() => handleCancelReservation(vehicle)}
                                    disabled={cancelingReservationId === vehicle.id}
                                    title="إلغاء الحجز"
                                  >
                                    <X size={14} className="ml-1" />
                                    إلغاء الحجز
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="px-3 h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300"
                                    onClick={() => handleReserveItem(vehicle)}
                                    disabled={vehicle.status === "محجوز" || vehicle.status === "مباع"}
                                    title="حجز"
                                  >
                                    <Calendar size={14} className="ml-1" />
                                    حجز
                                  </Button>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-center">
            <Button onClick={() => setArrivedTodayOpen(false)} className="glass-button">
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>



      {/* Vehicle Share Dialog */}
      {shareVehicle && (
        <VehicleShare 
          vehicle={shareVehicle} 
          open={shareDialogOpen} 
          onOpenChange={(open) => {
            setShareDialogOpen(open);
            if (!open) setShareVehicle(null);
          }} 
        />
      )}

      {/* Bank Share Dialog */}
      <Dialog open={bankShareDialogOpen} onOpenChange={setBankShareDialogOpen}>
        <DialogContent className="glass-morphism max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right text-slate-200">
              مشاركة صفحة {selectedBankType === 'company' ? 'بنوك الشركة' : 'البنوك الشخصية'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Share Button */}
            <Button
              onClick={handleBankShare}
              className="w-full glass-button glass-text-primary"
              variant="outline"
            >
              <Share2 size={18} className="ml-2" />
              مشاركة
            </Button>

            {/* Copy Link Button */}
            <Button
              onClick={handleBankCopy}
              className="w-full glass-button glass-text-primary"
              variant="outline"
            >
              <Copy size={18} className="ml-2" />
              نسخ الرابط
            </Button>
            
            {/* WhatsApp Share Section */}
            <div className="space-y-3">
              <Label className="text-slate-300">مشاركة عبر الواتساب</Label>
              <div className="flex gap-2">
                <span className="flex items-center justify-center px-3 py-2 bg-slate-700 rounded-lg text-slate-300 text-sm">
                  +966
                </span>
                <Input
                  placeholder="أدخل رقم الجوال"
                  value={bankPhoneNumber}
                  onChange={(e) => setBankPhoneNumber(e.target.value)}
                  className="glass-input flex-1"
                  dir="ltr"
                />
              </div>
              <Button
                onClick={handleBankWhatsAppShare}
                className="w-full glass-button glass-text-primary"
                variant="outline"
              >
                <MessageCircle size={18} className="ml-2" />
                إرسال عبر الواتساب
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Sell Dialog */}
      {selectedVehicleForSale && (
        <EnhancedSaleDialog
          isOpen={sellDialogOpen}
          onClose={() => {
            setSellDialogOpen(false);
            setSelectedVehicleForSale(null);
          }}
          onConfirm={handleConfirmSale}
          vehicleData={{
            id: selectedVehicleForSale.id,
            manufacturer: selectedVehicleForSale.manufacturer,
            category: selectedVehicleForSale.category,
            year: selectedVehicleForSale.year,
            chassisNumber: selectedVehicleForSale.chassisNumber || '',
            customerName: selectedVehicleForSale.customerName || undefined,
            customerPhone: selectedVehicleForSale.customerPhone || undefined,
            salesRepresentative: selectedVehicleForSale.salesRepresentative || undefined,
            reservationDate: selectedVehicleForSale.reservationDate ? selectedVehicleForSale.reservationDate.toISOString() : undefined,
            reservationNote: selectedVehicleForSale.reservationNote || undefined
          }}
          isLoading={enhancedSellMutation.isPending}
        />
      )}

      {/* Attendance Management Dialog */}
      <Dialog open={attendanceDialogOpen} onOpenChange={setAttendanceDialogOpen}>
        <DialogContent 
          className="glass-container backdrop-blur-md bg-slate-900/90 border border-white/20 text-white max-w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-y-auto p-3 sm:p-6"
          aria-describedby="attendance-management-description"
        >
          <DialogHeader className="space-y-1 sm:space-y-2">
            <DialogTitle className="text-lg sm:text-xl text-center">
              إدارة الدوام
            </DialogTitle>
            <p className="text-gray-300 text-center text-sm sm:text-base">
              الحضور اليومي والطلبات المعلقة
            </p>
          </DialogHeader>
          
          <div id="attendance-management-description" className="sr-only">
            إدارة شاملة للحضور اليومي والطلبات المعلقة للموظفين
          </div>
          
          <AttendanceManagementContent />
        </DialogContent>
      </Dialog>


      </div>
    </div>
  );
}

// Attendance Management Content Component
function AttendanceManagementContent() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isCreateRequestDialogOpen, setIsCreateRequestDialogOpen] = useState(false);
  const [requestType, setRequestType] = useState("استئذان");
  const [requestDate, setRequestDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [duration, setDuration] = useState("");
  const [durationType, setDurationType] = useState("ساعة");
  const [reason, setReason] = useState("");
  
  // Get current user info to check role - fallback to admin for now
  const currentUser = { id: 1, role: 'admin', name: 'مدير النظام' };
  
  // Fetch daily attendance data
  const { data: dailyAttendance = [] } = useQuery<any[]>({
    queryKey: ["/api/daily-attendance"],
    refetchInterval: 3000
  });

  // Fetch pending leave requests
  const { data: pendingLeaveRequests = [] } = useQuery<any[]>({
    queryKey: ["/api/leave-requests"],
    select: (data: any[]) => data.filter(request => request.status === "pending")
  });

  // Fetch users data
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"]
  });

  // Fetch employee work schedules
  const { data: employeeSchedules = [] } = useQuery<any[]>({
    queryKey: ["/api/employee-work-schedules"]
  });

  // Fetch approved leave requests
  const { data: approvedLeaveRequests = [] } = useQuery<any[]>({
    queryKey: ["/api/leave-requests"],
    select: (data: any[]) => data.filter(request => request.status === "approved")
  });

  // Get month days - only show days up to today
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const today = new Date();
  const endDate = monthEnd > today ? today : monthEnd;
  const monthDays = eachDayOfInterval({ start: monthStart, end: endDate });

  // Calculate expected hours for a given day and schedule
  const calculateExpectedHours = (schedule: any, day: Date): number => {
    const isFriday = format(day, "EEEE", { locale: ar }) === "الجمعة";
    
    if (isFriday) {
      return 5.0; // Friday special hours (4:00 PM to 9:00 PM)
    }
    
    if (schedule.scheduleType === "متصل") {
      // Continuous schedule: 8 hours
      return 8.0;
    } else {
      // Split schedule: 4 hours morning + 4 hours evening = 8 hours
      return 8.0;
    }
  };

  // Calculate hours worked
  const calculateHoursWorked = (schedule: any, attendance: any): string => {
    if (!attendance) return "0.00";
    
    let totalMinutes = 0;
    
    if (schedule.scheduleType === "متصل") {
      // Continuous schedule
      if (attendance.continuousCheckinTime && attendance.continuousCheckoutTime) {
        const checkin = new Date(`2000-01-01T${attendance.continuousCheckinTime}:00`);
        const checkout = new Date(`2000-01-01T${attendance.continuousCheckoutTime}:00`);
        totalMinutes = (checkout.getTime() - checkin.getTime()) / (1000 * 60);
      }
    } else {
      // Split schedule
      // Morning period
      if (attendance.morningCheckinTime && attendance.morningCheckoutTime) {
        const morningCheckin = new Date(`2000-01-01T${attendance.morningCheckinTime}:00`);
        const morningCheckout = new Date(`2000-01-01T${attendance.morningCheckoutTime}:00`);
        totalMinutes += (morningCheckout.getTime() - morningCheckin.getTime()) / (1000 * 60);
      }
      
      // Evening period
      if (attendance.eveningCheckinTime && attendance.eveningCheckoutTime) {
        const eveningCheckin = new Date(`2000-01-01T${attendance.eveningCheckinTime}:00`);
        const eveningCheckout = new Date(`2000-01-01T${attendance.eveningCheckoutTime}:00`);
        totalMinutes += (eveningCheckout.getTime() - eveningCheckin.getTime()) / (1000 * 60);
      }
    }
    
    const hours = Math.max(0, totalMinutes / 60);
    return hours.toFixed(2);
  };

  // Check if there's approved leave for a specific day
  const getApprovedLeaveForDay = (employeeId: number, day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd");
    return approvedLeaveRequests.find(request => {
      const startDate = format(new Date(request.startDate), "yyyy-MM-dd");
      const endDate = request.endDate ? format(new Date(request.endDate), "yyyy-MM-dd") : startDate;
      return request.userId === employeeId && dayStr >= startDate && dayStr <= endDate;
    });
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation for approving leave requests
  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return apiRequest("POST", `/api/leave-requests/${requestId}/approve`);
    },
    onSuccess: () => {
      toast({
        title: "تم اعتماد الطلب",
        description: "تم اعتماد طلب الإجازة بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-attendance"] });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في اعتماد الطلب",
        variant: "destructive",
      });
    }
  });

  // Mutation for rejecting leave requests
  const rejectRequestMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: number; reason: string }) => {
      return apiRequest("POST", `/api/leave-requests/${requestId}/reject`, {
        body: JSON.stringify({ rejectionReason: reason }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({
        title: "تم رفض الطلب",
        description: "تم رفض طلب الإجازة",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في رفض الطلب",
        variant: "destructive",
      });
    }
  });

  // Create leave request mutation
  const createLeaveRequestMutation = useMutation({
    mutationFn: async (requestData: any) => {
      const response = await fetch("/api/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...requestData,
          requestedBy: currentUser.id,
          requestedByName: currentUser.name,
          status: "pending"
        }),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم إنشاء الطلب",
        description: "تم إرسال طلب الإجازة/الاستئذان بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      setIsCreateRequestDialogOpen(false);
      resetRequestForm();
    },
    onError: () => {
      toast({
        title: "خطأ في إنشاء الطلب",
        description: "حدث خطأ أثناء إنشاء الطلب",
        variant: "destructive",
      });
    },
  });

  // Reset request form
  const resetRequestForm = () => {
    setRequestType("استئذان");
    setRequestDate(format(new Date(), "yyyy-MM-dd"));
    setDuration("");
    setDurationType("ساعة");
    setReason("");
  };

  // Handle create request
  const handleCreateRequest = () => {
    if (!duration || !reason) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const requestData = {
      userId: currentUser.id,
      userName: currentUser.name,
      requestType,
      startDate: requestDate,
      endDate: requestType === "إجازة" ? requestDate : null,
      duration: parseInt(duration),
      durationType: requestType === "إجازة" ? "يوم" : durationType,
      reason,
    };

    createLeaveRequestMutation.mutate(requestData);
  };



  return (
    <div className="space-y-6">
      <Tabs defaultValue="daily-attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 h-auto">
          <TabsTrigger 
            value="daily-attendance" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm py-2 px-2 sm:px-4"
          >
            الحضور اليومي
          </TabsTrigger>
          <TabsTrigger 
            value="approved-requests"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs sm:text-sm py-2 px-2 sm:px-4"
          >
            الطلبات المعتمدة
            {approvedLeaveRequests.length > 0 && (
              <Badge className="ml-1 sm:ml-2 bg-green-500 text-black text-xs">
                {approvedLeaveRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily-attendance" className="mt-3 sm:mt-6">
          <div className="glass-container backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-3 sm:p-6">
            {/* Month Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-2 sm:gap-0">
              <h2 className="text-lg sm:text-xl font-semibold text-white">الحضور اليومي</h2>
              <div className="flex items-center gap-2 sm:gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="glass-button p-1.5 sm:p-2"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                <h3 className="text-sm sm:text-lg font-medium text-white min-w-[120px] sm:min-w-[140px] text-center">
                  {format(currentMonth, "MMMM yyyy", { locale: ar })}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="glass-button p-1.5 sm:p-2"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>

            {/* Employee Monthly Calendars */}
            <div className="space-y-3 sm:space-y-6">
              {employeeSchedules.filter((schedule: any) => {
                // Show all employees for admin, only current user for others
                if (!currentUser) return true; // Show all if user info not loaded
                return currentUser.role === 'admin' || schedule.employeeId === currentUser.id;
              }).map((schedule: any) => {
                const monthAttendance = dailyAttendance.filter(a => 
                  a.employeeId === schedule.employeeId &&
                  format(new Date(a.date), "yyyy-MM") === format(currentMonth, "yyyy-MM")
                );

                return (
                  <div key={schedule.id} className="glass-container backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-2 sm:p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2 sm:gap-0">
                      <div>
                        <h3 className="font-semibold text-white text-base sm:text-lg">{schedule.employeeName}</h3>
                        <p className="text-gray-300 text-xs sm:text-sm">{schedule.scheduleType} • {monthAttendance.length} يوم حضور</p>
                      </div>
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 text-xs sm:text-sm self-start sm:self-auto">
                        {format(currentMonth, "MMMM", { locale: ar })}
                      </Badge>
                    </div>

                    {/* Monthly Progress Bars */}
                    <div className="space-y-2 sm:space-y-3">
                      {monthDays.map((day) => {
                        const dayStr = format(day, "yyyy-MM-dd");
                        const dayAttendance = monthAttendance.find(a => a.date === dayStr);
                        const isToday = isSameDay(day, new Date());
                        const hasAttendance = !!dayAttendance;
                        const isHoliday = dayAttendance?.notes === 'إجازة';
                        const approvedLeave = getApprovedLeaveForDay(schedule.employeeId, day);
                        
                        // Calculate hours worked
                        const hoursWorked = hasAttendance && !isHoliday ? parseFloat(calculateHoursWorked(schedule, dayAttendance)) : 0;
                        const expectedHours = calculateExpectedHours(schedule, day);
                        const workPercentage = Math.min((hoursWorked / expectedHours) * 100, 100);
                        
                        // Get day name in Arabic
                        const dayName = format(day, "EEEE", { locale: ar });
                        
                        return (
                          <div
                            key={day.toISOString()}
                            className={`
                              group cursor-pointer transition-all duration-300 hover:scale-[1.02]
                              ${isToday ? 'ring-1 sm:ring-2 ring-blue-400 rounded-lg p-0.5 sm:p-1' : ''}
                            `}
                          >
                            <div className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg bg-white/5 hover:bg-white/10">
                              {/* Date Info */}
                              <div className="flex flex-col items-center min-w-[50px] sm:min-w-[80px]">
                                <div className={`text-lg sm:text-2xl font-bold ${isToday ? 'text-blue-400' : 'text-white'}`}>
                                  {format(day, "d")}
                                </div>
                                <div className="text-xs text-gray-400 truncate">
                                  {dayName}
                                </div>
                              </div>
                              
                              {/* Progress Bar Container */}
                              <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-center">
                                  <div className="text-xs sm:text-sm text-gray-300 truncate">
                                    {(() => {
                                      if (isHoliday) return 'إجازة';
                                      if (approvedLeave) {
                                        switch (approvedLeave.requestType) {
                                          case 'استئذان': return `استئذان (${approvedLeave.duration} ${approvedLeave.durationType})`;
                                          case 'إجازة': return 'إجازة معتمدة';
                                          case 'تأخير في الحضور': return `تأخير (${approvedLeave.duration} ${approvedLeave.durationType})`;
                                          case 'انصراف مبكر': return `انصراف مبكر (${approvedLeave.duration} ${approvedLeave.durationType})`;
                                          default: return 'إجازة معتمدة';
                                        }
                                      }
                                      if (!hasAttendance) return 'لا يوجد سجل';
                                      return `${hoursWorked.toFixed(1)} ساعة`;
                                    })()}
                                  </div>
                                  <div className="text-xs text-gray-400 shrink-0">
                                    {hasAttendance && !isHoliday && !approvedLeave ? `${workPercentage.toFixed(0)}%` : ''}
                                  </div>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                                  {(() => {
                                    if (isHoliday) {
                                      return <div className="h-full bg-yellow-500 rounded-full flex items-center justify-center">
                                        <span className="text-xs text-black font-medium px-2">إجازة</span>
                                      </div>;
                                    }
                                    
                                    if (approvedLeave) {
                                      let bgColor = 'bg-green-500';
                                      if (approvedLeave.requestType === 'استئذان') bgColor = 'bg-blue-500';
                                      else if (approvedLeave.requestType === 'تأخير في الحضور') bgColor = 'bg-orange-500';
                                      else if (approvedLeave.requestType === 'انصراف مبكر') bgColor = 'bg-purple-500';
                                      
                                      return <div className={`h-full ${bgColor} rounded-full`} style={{ width: '100%' }}></div>;
                                    }
                                    
                                    if (!hasAttendance) {
                                      return <div className="h-full bg-gray-600 rounded-full flex items-center justify-center">
                                        <span className="text-xs text-gray-400 px-2">لا يوجد سجل</span>
                                      </div>;
                                    }
                                    
                                    let barColor = 'bg-green-500';
                                    if (workPercentage < 50) barColor = 'bg-red-500';
                                    else if (workPercentage < 80) barColor = 'bg-yellow-500';
                                    
                                    return <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${workPercentage}%` }}></div>;
                                  })()}
                                </div>
                              </div>
                              
                              {/* Status Indicator with Icons */}
                              <div className="flex items-center justify-center w-8 h-8">
                                {(() => {
                                  if (isHoliday) {
                                    return <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                                      <CalendarIcon className="w-3 h-3 text-black" />
                                    </div>;
                                  }
                                  
                                  if (approvedLeave) {
                                    let bgColor = 'bg-green-500';
                                    let IconComponent = CheckCircle;
                                    if (approvedLeave.requestType === 'استئذان') { 
                                      bgColor = 'bg-blue-500'; 
                                      IconComponent = UserX; 
                                    }
                                    else if (approvedLeave.requestType === 'تأخير في الحضور') { 
                                      bgColor = 'bg-orange-500'; 
                                      IconComponent = Clock; 
                                    }
                                    else if (approvedLeave.requestType === 'انصراف مبكر') { 
                                      bgColor = 'bg-purple-500'; 
                                      IconComponent = AlertTriangle; 
                                    }
                                    
                                    return <div className={`w-6 h-6 ${bgColor} rounded-full flex items-center justify-center`}>
                                      <IconComponent className="w-3 h-3 text-white" />
                                    </div>;
                                  }
                                  
                                  if (hasAttendance) {
                                    if (workPercentage >= 80) {
                                      return <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-3 h-3 text-white" />
                                      </div>;
                                    } else if (workPercentage >= 50) {
                                      return <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                                        <AlertTriangle className="w-3 h-3 text-black" />
                                      </div>;
                                    } else {
                                      return <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                        <Clock className="w-3 h-3 text-white" />
                                      </div>;
                                    }
                                  } else {
                                    return <div className="w-6 h-6 border-2 border-gray-500 rounded-full opacity-50 flex items-center justify-center">
                                      <UserX className="w-3 h-3 text-gray-500" />
                                    </div>;
                                  }
                                })()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              
              {employeeSchedules.filter((schedule: any) => {
                if (!currentUser) return true;
                return currentUser.role === 'admin' || schedule.employeeId === currentUser.id;
              }).length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-white text-lg mb-2">
                    {currentUser?.role === 'admin' ? 'لا توجد جداول عمل' : 'لا يوجد جدول عمل لك'}
                  </p>
                  <p className="text-gray-400">
                    {currentUser?.role === 'admin' ? 'يجب إنشاء جداول عمل للموظفين أولاً' : 'يجب على المدير إنشاء جدول عمل لك'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="approved-requests" className="mt-6">
          <div className="glass-container backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">الطلبات المعتمدة</h2>
              <div className="flex gap-3 items-center">
                <Button
                  onClick={() => setIsCreateRequestDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="create-request-button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  إنشاء طلب جديد
                </Button>
                <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                  {approvedLeaveRequests.length} طلب معتمد
                </Badge>
              </div>
            </div>

            {approvedLeaveRequests.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <p className="text-white text-lg mb-2">لا توجد طلبات معتمدة</p>
                <p className="text-gray-400">لم يتم العثور على أي طلبات إجازة أو استئذان معتمدة</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {approvedLeaveRequests.map((request: any) => (
                  <div key={request.id} className="glass-container backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-white text-lg">{request.userName}</h3>
                        <p className="text-gray-300">{request.requestType}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className="border-green-400 text-green-300 bg-green-400/10"
                      >
                        معتمد
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label className="text-gray-300 text-sm">تاريخ البداية</Label>
                        <p className="text-white">{format(new Date(request.startDate), "dd/MM/yyyy", { locale: ar })}</p>
                      </div>
                      {request.endDate && (
                        <div>
                          <Label className="text-gray-300 text-sm">تاريخ النهاية</Label>
                          <p className="text-white">{format(new Date(request.endDate), "dd/MM/yyyy", { locale: ar })}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-gray-300 text-sm">المدة</Label>
                        <p className="text-white">{request.duration} {request.durationType}</p>
                      </div>
                      <div>
                        <Label className="text-gray-300 text-sm">وافق عليه</Label>
                        <p className="text-white">{request.approvedByName || 'غير محدد'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-300 text-sm">تاريخ الموافقة</Label>
                        <p className="text-white">{request.approvedAt ? format(new Date(request.approvedAt), "dd/MM/yyyy", { locale: ar }) : 'غير محدد'}</p>
                      </div>
                    </div>
                    
                    {request.reason && (
                      <div className="mb-4">
                        <Label className="text-gray-300 text-sm">السبب</Label>
                        <p className="text-white bg-slate-800/30 p-3 rounded-lg mt-1">{request.reason}</p>
                      </div>
                    )}
                    
                    {/* Timeline */}
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10 mt-4">
                      <div className="text-xs text-gray-400 space-y-1">
                        <div>تم إنشاء الطلب: {format(new Date(request.createdAt), "dd/MM/yyyy HH:mm", { locale: ar })}</div>
                        {request.approvedAt && (
                          <div>تمت الموافقة: {format(new Date(request.approvedAt), "dd/MM/yyyy HH:mm", { locale: ar })}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Request Dialog */}
      <Dialog open={isCreateRequestDialogOpen} onOpenChange={setIsCreateRequestDialogOpen}>
        <DialogContent 
          className="glass-container backdrop-blur-md bg-slate-900/90 border border-white/20 text-white max-w-md"
          aria-describedby="create-request-dialog-description"
        >
          <DialogHeader>
            <DialogTitle className="text-xl text-center">إنشاء طلب جديد</DialogTitle>
          </DialogHeader>
          
          <div id="create-request-dialog-description" className="sr-only">
            نموذج إنشاء طلب إجازة أو استئذان جديد
          </div>
          
          <div className="space-y-4" dir="rtl">
            {/* اسم المستخدم */}
            <div>
              <Label className="text-gray-300">اسم المستخدم</Label>
              <Input 
                value={currentUser.name} 
                disabled 
                className="bg-white/5 border-white/20 text-white" 
              />
            </div>

            {/* نوع الطلب */}
            <div>
              <Label className="text-gray-300">نوع الطلب</Label>
              <Select value={requestType} onValueChange={setRequestType}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/20">
                  <SelectItem value="استئذان">استئذان (ساعات)</SelectItem>
                  <SelectItem value="إجازة">إجازة (أيام)</SelectItem>
                  <SelectItem value="تأخير في الحضور">تأخير في الحضور</SelectItem>
                  <SelectItem value="انصراف مبكر">انصراف مبكر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* تاريخ البداية / الوقت */}
            <div>
              <Label className="text-gray-300">
                {requestType === "إجازة" ? "تاريخ البداية" : "التاريخ"}
              </Label>
              <Select value={requestDate} onValueChange={setRequestDate}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/20">
                  <SelectItem value={format(new Date(), "yyyy-MM-dd")}>
                    اليوم - {format(new Date(), "dd/MM/yyyy", { locale: ar })}
                  </SelectItem>
                  <SelectItem value={format(new Date(Date.now() - 24 * 60 * 60 * 1000), "yyyy-MM-dd")}>
                    أمس - {format(new Date(Date.now() - 24 * 60 * 60 * 1000), "dd/MM/yyyy", { locale: ar })}
                  </SelectItem>
                  <SelectItem value={format(new Date(Date.now() + 24 * 60 * 60 * 1000), "yyyy-MM-dd")}>
                    غداً - {format(new Date(Date.now() + 24 * 60 * 60 * 1000), "dd/MM/yyyy", { locale: ar })}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* المدة */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-gray-300">المدة</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="أدخل المدة"
                />
              </div>
              <div className="w-24">
                <Label className="text-gray-300">النوع</Label>
                <Select value={durationType} onValueChange={setDurationType}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    <SelectItem value="ساعة">ساعة</SelectItem>
                    <SelectItem value="دقيقة">دقيقة</SelectItem>
                    {requestType === "إجازة" && <SelectItem value="يوم">يوم</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* السبب */}
            <div>
              <Label className="text-gray-300">سبب الطلب</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
                placeholder="أدخل سبب الطلب"
              />
            </div>

            {/* الأزرار */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCreateRequest}
                disabled={createLeaveRequestMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createLeaveRequestMutation.isPending ? "جاري الإرسال..." : "إرسال الطلب"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsCreateRequestDialogOpen(false)}
                disabled={createLeaveRequestMutation.isPending}
                className="px-8 border-white/20 text-white hover:bg-white/10"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>




    </div>
  );
}