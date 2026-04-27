import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertInventoryItemSchema, type InsertInventoryItem, type InventoryItem } from "@shared/schema";
import { CloudUpload, Settings } from "lucide-react";

interface InventoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: InventoryItem;
}

// Database types for hierarchical data
interface Manufacturer {
  id: number;
  nameAr: string;
  nameEn?: string;
  logo?: string;
  isActive?: boolean;
  categories?: Category[];
}

interface Category {
  id: number;
  manufacturerId: number;
  nameAr: string;
  nameEn?: string;
  isActive?: boolean;
  trimLevels?: TrimLevel[];
}

interface TrimLevel {
  id: number;
  categoryId: number;
  nameAr: string;
  nameEn?: string;
  isActive?: boolean;
}

interface DropdownItem {
  id: number;
  name: string;
  description?: string;
  isActive?: boolean;
}

interface ColorItem {
  id: number;
  name: string;
  colorType: 'exterior' | 'interior';
  colorCode?: string;
  isActive?: boolean;
}

interface CombinedDropdowns {
  importTypes: DropdownItem[];
  vehicleStatuses: DropdownItem[];
  ownershipTypes: DropdownItem[];
  vehicleLocations: DropdownItem[];
  vehicleYears: DropdownItem[];
  engineCapacities: DropdownItem[];
  vehicleColors: ColorItem[];
}

const initialEngineCapacities = ["2.0L", "1.5L", "3.0L", "4.0L", "5.0L", "V6", "V8"];
const initialYears = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];
const initialStatuses = ["متوفر", "في الطريق", "قيد الصيانة"];
const initialImportTypes = ["شخصي", "شركة", "مستعمل"];
const initialOwnershipTypes = ["ملك الشركة", "عرض (وسيط)"];
const initialLocations = ["المستودع الرئيسي", "المعرض", "الورشة", "الميناء", "مستودع فرعي"];
const initialColors = ["أسود", "أبيض", "رمادي", "أزرق", "أحمر", "بني", "فضي", "ذهبي", "بيج"];

export default function InventoryForm({ open, onOpenChange, editItem }: InventoryFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isEditingOptions, setIsEditingOptions] = useState(false);
  
  // Fetch all basic dropdowns in one call
  const { data: dropdowns, isLoading: isLoadingDropdowns } = useQuery<CombinedDropdowns>({
    queryKey: ["/api/combined-dropdowns"],
    enabled: open,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch full hierarchy in one call
  const { data: hierarchy = [], isLoading: isLoadingHierarchy } = useQuery<Manufacturer[]>({
    queryKey: ["/api/hierarchy/full"],
    enabled: open,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Convert database data to arrays for compatibility
  const {
    importTypes,
    vehicleStatuses,
    ownershipTypes,
    vehicleLocations,
    vehicleYears,
    engineCapacities,
    exteriorColors,
    interiorColors
  } = useMemo(() => ({
    importTypes: dropdowns?.importTypes.map(item => item.name).filter(Boolean) || [],
    vehicleStatuses: dropdowns?.vehicleStatuses.map(item => item.name).filter(Boolean) || [],
    ownershipTypes: dropdowns?.ownershipTypes.map(item => item.name).filter(Boolean) || [],
    vehicleLocations: dropdowns?.vehicleLocations.map(item => item.name).filter(Boolean) || [],
    vehicleYears: dropdowns?.vehicleYears.map(item => parseInt(item.name)).filter(Boolean) || [],
    engineCapacities: dropdowns?.engineCapacities.map(item => item.name).filter(Boolean) || [],
    exteriorColors: dropdowns?.vehicleColors.filter(item => item.colorType === 'exterior').map(item => item.name) || [],
    interiorColors: dropdowns?.vehicleColors.filter(item => item.colorType === 'interior').map(item => item.name) || [],
  }), [dropdowns]);

  // Use API data directly or fallback to initial values
  const editableYears = useMemo(() => vehicleYears.length > 0 ? vehicleYears : initialYears, [vehicleYears]);
  const editableEngineCapacities = useMemo(() => engineCapacities.length > 0 ? engineCapacities : initialEngineCapacities, [engineCapacities]);
  const editableStatuses = useMemo(() => vehicleStatuses.length > 0 ? vehicleStatuses : initialStatuses, [vehicleStatuses]);
  const editableImportTypes = useMemo(() => importTypes.length > 0 ? importTypes : initialImportTypes, [importTypes]);
  const editableOwnershipTypes = useMemo(() => ownershipTypes.length > 0 ? ownershipTypes : initialOwnershipTypes, [ownershipTypes]);
  const editableLocations = useMemo(() => vehicleLocations.length > 0 ? vehicleLocations : initialLocations, [vehicleLocations]);
  const editableExteriorColors = useMemo(() => exteriorColors.length > 0 ? exteriorColors : initialColors, [exteriorColors]);
  const editableInteriorColors = useMemo(() => interiorColors.length > 0 ? interiorColors : initialColors, [interiorColors]);
  


  const form = useForm<InsertInventoryItem>({
    resolver: zodResolver(insertInventoryItemSchema),
    defaultValues: {
      manufacturer: "",
      category: "",
      trimLevel: "",
      engineCapacity: "",
      year: new Date().getFullYear(),
      exteriorColor: "",
      interiorColor: "",
      status: "",
      importType: "",
      ownershipType: "ملك الشركة",
      location: "",
      chassisNumber: "",
      images: [],
      logo: "",
      notes: "",
      price: "",
      isSold: false,
      detailedSpecifications: "",
      soldDate: null,
      reservationDate: null,
      reservedBy: "",
      reservationNote: "",
      mileage: undefined,
    },
  });

  // Get current manufacturer name for categories filtering
  const selectedManufacturerName = form.watch("manufacturer");
  
  // Get current category name for trim levels filtering  
  const selectedCategoryName = form.watch("category");
  
  // Local filtering instead of multiple API calls
  const selectedManufacturer = useMemo(() => hierarchy.find(m => m.nameAr === selectedManufacturerName), [hierarchy, selectedManufacturerName]);
  const categories = useMemo(() => selectedManufacturer?.categories || [], [selectedManufacturer]);
  
  const selectedCategory = useMemo(() => categories.find(c => c.nameAr === selectedCategoryName), [categories, selectedCategoryName]);
  const trimLevels = useMemo(() => selectedCategory?.trimLevels || [], [selectedCategory]);

  // Get current trim level for colors filtering
  const selectedTrimLevelName = form.watch("trimLevel");

  // For now, we'll use the editable colors as we don't have specific color APIs yet
  const availableExteriorColors = useMemo(() => editableExteriorColors, [editableExteriorColors]);
  const availableInteriorColors = useMemo(() => editableInteriorColors, [editableInteriorColors]);



  // Handle manufacturer change
  const handleManufacturerChange = (manufacturerName: string) => {
    // Update form values and reset dependent fields
    form.setValue("manufacturer", manufacturerName);
    form.setValue("category", "");
    form.setValue("trimLevel", "");
    form.setValue("exteriorColor", "");
    form.setValue("interiorColor", "");
  };

  // Handle category change
  const handleCategoryChange = (categoryName: string) => {
    // Update form values and reset dependent fields
    form.setValue("category", categoryName);
    form.setValue("trimLevel", "");
    form.setValue("exteriorColor", "");
    form.setValue("interiorColor", "");
  };

  // Handle trim level change
  const handleTrimLevelChange = (trimLevelName: string) => {
    // Update form values and reset color fields
    form.setValue("trimLevel", trimLevelName);
    form.setValue("exteriorColor", "");
    form.setValue("interiorColor", "");
  };

  // Update form when editItem changes
  useEffect(() => {
    if (editItem) {
      // Make sure all fields are properly populated
      const formData = {
        manufacturer: editItem.manufacturer || "",
        category: editItem.category || "",
        trimLevel: editItem.trimLevel || "",
        engineCapacity: editItem.engineCapacity || "",
        year: editItem.year || new Date().getFullYear(),
        exteriorColor: editItem.exteriorColor || "",
        interiorColor: editItem.interiorColor || "",
        status: editItem.status || "",
        importType: editItem.importType || "",
        ownershipType: (editItem as any).ownershipType || "ملك الشركة",
        location: editItem.location || "",
        chassisNumber: editItem.chassisNumber || "",
        images: editItem.images || [],
        logo: editItem.logo || "",
        notes: editItem.notes || "",
        price: editItem.price || "",
        isSold: editItem.isSold || false,
        detailedSpecifications: (editItem as any).detailedSpecifications || "",
        soldDate: (editItem as any).soldDate || null,
        reservationDate: (editItem as any).reservationDate || null,
        reservedBy: (editItem as any).reservedBy || "",
        reservationNote: (editItem as any).reservationNote || "",
        mileage: (editItem as any).mileage || undefined,
      };
      
      form.reset(formData);
    } else {
      // Reset to empty form when creating new item
      form.reset({
        manufacturer: "",
        category: "",
        trimLevel: "",
        engineCapacity: "",
        year: new Date().getFullYear(),
        exteriorColor: "",
        interiorColor: "",
        status: "",
        importType: "",
        ownershipType: "ملك الشركة",
        location: "",
        chassisNumber: "",
        images: [],
        logo: "",
        notes: "",
        price: "",
        isSold: false,
        mileage: undefined,
      });
    }
  }, [editItem]); // Remove form and manufacturers from dependencies to prevent infinite loop

  const createMutation = useMutation({
    mutationFn: (data: InsertInventoryItem) => apiRequest("POST", "/api/inventory", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/stats"] });
      toast({
        title: "تم بنجاح",
        description: "تم إضافة العنصر بنجاح",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إضافة العنصر",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertInventoryItem) => 
      apiRequest("PATCH", `/api/inventory/${editItem?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/stats"] });
      toast({
        title: "تم بنجاح",
        description: "تم تحديث العنصر بنجاح",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث العنصر",
        variant: "destructive",
      });
    },
  });



  const onSubmit = (data: InsertInventoryItem) => {
    if (editItem) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto w-[95vw] sm:w-full glass-container border-0">
        <DialogHeader className="pb-1">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-white flex-1 text-center">
              {editItem ? "تحرير المركبة" : "إضافة مركبة جديدة"}
            </DialogTitle>
            <div className="w-6" /> {/* Spacer for centering */}
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* الصانع */}
              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Combobox
                        options={hierarchy
                          .filter((m) => m.isActive !== false)
                          .map((m) => ({
                            label: m.nameAr,
                            value: m.nameAr,
                            logo: m.logo
                          }))}
                        value={field.value || undefined}
                        onValueChange={(value) => {
                          handleManufacturerChange(value);
                          field.onChange(value);
                        }}
                        placeholder="الصانع"
                        searchPlaceholder="بحث عن الصانع..."
                        disabled={isLoadingHierarchy}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* الفئة */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Combobox
                        options={categories
                          .filter(category => category.isActive !== false)
                          .map((category) => ({
                            label: category.nameAr,
                            value: category.nameAr
                          }))}
                        value={field.value || undefined}
                        onValueChange={(value) => {
                          handleCategoryChange(value);
                          field.onChange(value);
                        }}
                        placeholder={!selectedManufacturerName ? "اختر الصانع أولاً" : "الفئة"}
                        searchPlaceholder="بحث عن الفئة..."
                        disabled={!selectedManufacturerName || isLoadingHierarchy}
                        emptyText={categories.length === 0 ? "لا توجد فئات لهذا الصانع" : "لا توجد نتائج"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* درجة التجهيز */}
              <FormField
                control={form.control}
                name="trimLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Combobox
                        options={trimLevels
                          .filter(trim => trim.isActive !== false)
                          .map((trim) => ({
                            label: trim.nameAr,
                            value: trim.nameAr
                          }))}
                        value={field.value || undefined}
                        onValueChange={(value) => {
                          handleTrimLevelChange(value);
                          field.onChange(value);
                        }}
                        placeholder={!selectedCategoryName ? "اختر الفئة أولاً" : "درجة التجهيز"}
                        searchPlaceholder="بحث عن درجة التجهيز..."
                        disabled={!selectedCategoryName || isLoadingHierarchy}
                        emptyText={trimLevels.length === 0 ? "لا توجد درجات تجهيز لهذه الفئة" : "لا توجد نتائج"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* سعة المحرك */}
              <FormField
                control={form.control}
                name="engineCapacity"
                render={({ field }) => (
                  <FormItem>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <SelectTrigger className="glass-input border-white/20 text-white">
                            <SelectValue placeholder="سعة المحرك" />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingDropdowns ? (
                              <SelectItem key="loading" disabled value="loading">
                                جاري التحميل...
                              </SelectItem>
                            ) : editableEngineCapacities.filter(capacity => capacity && capacity.trim()).map((capacity) => (
                                <SelectItem key={capacity} value={capacity}>
                                  {capacity}
                                </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              {/* السنة */}
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Combobox
                        options={editableYears.map((year) => ({
                          label: year.toString(),
                          value: year.toString()
                        }))}
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        placeholder="السنة"
                        searchPlaceholder="بحث عن سنة..."
                        disabled={isLoadingDropdowns}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* اللون الخارجي */}
              <FormField
                control={form.control}
                name="exteriorColor"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Combobox
                        options={availableExteriorColors
                          .filter(color => color && color.trim())
                          .map((color) => ({
                            label: color,
                            value: color
                          }))}
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                        placeholder={!selectedTrimLevelName ? "اختر درجة التجهيز أولاً" : "اللون الخارجي"}
                        searchPlaceholder="بحث عن لون..."
                        disabled={!selectedTrimLevelName || isLoadingDropdowns}
                        emptyText={availableExteriorColors.length === 0 ? "لا توجد ألوان خارجية لدرجة التجهيز هذه" : "لا توجد نتائج"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* اللون الداخلي */}
              <FormField
                control={form.control}
                name="interiorColor"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Combobox
                        options={availableInteriorColors
                          .filter(color => color && color.trim())
                          .map((color) => ({
                            label: color,
                            value: color
                          }))}
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                        placeholder={!selectedTrimLevelName ? "اختر درجة التجهيز أولاً" : "اللون الداخلي"}
                        searchPlaceholder="بحث عن لون..."
                        disabled={!selectedTrimLevelName || isLoadingDropdowns}
                        emptyText={availableInteriorColors.length === 0 ? "لا توجد ألوان داخلية لدرجة التجهيز هذه" : "لا توجد نتائج"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* نوع الاستيراد */}
              <FormField
                control={form.control}
                name="importType"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <SelectTrigger className="glass-input border-white/20 text-white">
                          <SelectValue placeholder="نوع الاستيراد" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingDropdowns ? (
                            <SelectItem key="loading" disabled value="loading">
                              جاري التحميل...
                            </SelectItem>
                          ) : editableImportTypes.filter(type => type && type.trim()).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* المسافة المقطوعة - للمركبات المستعملة فقط */}
              {form.watch("importType") === "مستعمل" && (
                <FormField
                  control={form.control}
                  name="mileage"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          placeholder="المسافة المقطوعة (كم)" 
                          type="number"
                          min="0"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          className="glass-input border-white/20 text-white placeholder:text-white/60"
                          dir="rtl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* نوع الملكية */}
              <FormField
                control={form.control}
                name="ownershipType"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <SelectTrigger className="glass-input border-white/20 text-white">
                          <SelectValue placeholder="نوع الملكية" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingDropdowns ? (
                            <SelectItem key="loading" disabled value="loading">
                              جاري التحميل...
                            </SelectItem>
                          ) : editableOwnershipTypes.filter(type => type && type.trim()).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* الموقع */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Combobox
                        options={editableLocations
                          .filter(location => location && location.trim())
                          .map((location) => ({
                            label: location,
                            value: location
                          }))}
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                        placeholder="الموقع"
                        searchPlaceholder="بحث عن موقع..."
                        disabled={isLoadingDropdowns}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* الحالة */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Combobox
                        options={editableStatuses
                          .filter(status => status && status.trim())
                          .map((status) => ({
                            label: status,
                            value: status
                          }))}
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                        placeholder="الحالة"
                        searchPlaceholder="بحث عن حالة..."
                        disabled={isLoadingDropdowns}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* رقم الهيكل */}
              <FormField
                control={form.control}
                name="chassisNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        placeholder="رقم الهيكل" 
                        className="glass-input border-white/20 text-white placeholder:text-white/60 font-latin" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* السعر */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        placeholder="السعر (ريال سعودي)" 
                        type="number"
                        value={field.value || ""}
                        onChange={field.onChange}
                        className="glass-input border-white/20 text-white placeholder:text-white/60"
                        dir="rtl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* تاريخ البيع - يظهر فقط عند البيع */}
              {form.watch("isSold") && (
                <FormField
                  control={form.control}
                  name="soldDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          type="date"
                          value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                          className="glass-input border-white/20 text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* تاريخ الحجز - مخفي في نافذة الإضافة */}
              {false && (
                <FormField
                  control={form.control}
                  name="reservationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          type="date"
                          value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                          className="glass-input border-white/20 text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* محجوز بواسطة - مخفي في نافذة الإضافة */}
              {false && (
                <FormField
                  control={form.control}
                  name="reservedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          placeholder="محجوز بواسطة"
                          value={field.value || ""}
                          onChange={field.onChange}
                          className="glass-input border-white/20 text-white placeholder:text-white/60"
                          dir="rtl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* الملاحظات والمواصفات */}
            <div className="grid grid-cols-1 gap-4">
              {/* ملاحظة الحجز - مخفي في نافذة الإضافة */}
              {false && (
                <FormField
                  control={form.control}
                  name="reservationNote"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="ملاحظة الحجز"
                          className="glass-input border-white/20 text-white placeholder:text-white/60 min-h-[80px]"
                          value={field.value || ""}
                          onChange={field.onChange}
                          dir="rtl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}



              {/* الملاحظات العامة */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="الملاحظات العامة"
                        className="glass-input border-white/20 text-white placeholder:text-white/60 min-h-[80px]"
                        value={field.value || ""}
                        onChange={field.onChange}
                        dir="rtl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* أزرار الحفظ */}
            <div className="flex justify-center gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="glass-button px-8"
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="bg-custom-gold hover:bg-custom-gold-dark text-white px-8"
              >
                {isLoading ? "جاري الحفظ..." : editItem ? "تحديث" : "حفظ"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>

    </Dialog>
  );
}
