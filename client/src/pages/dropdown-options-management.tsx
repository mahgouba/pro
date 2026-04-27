import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SystemGlassWrapper from "@/components/system-glass-wrapper";
import { ManufacturerLogo } from "@/components/manufacturer-logo";
import {
  Building2,
  Car,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Palette,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Download,
  Upload,
  Image,
  Calendar
} from "lucide-react";

interface Manufacturer {
  id: number;
  nameAr: string;
  nameEn?: string;
  logo?: string;
  isActive?: boolean;
}

interface Category {
  id: number;
  nameAr: string;
  nameEn?: string;
  manufacturerId: number;
  isActive?: boolean;
  trimLevels: TrimLevel[];
}

interface TrimLevel {
  id: number;
  nameAr: string;
  nameEn?: string;
  categoryId: number;
  isActive?: boolean;
}

interface Color {
  id: number;
  name: string;
  nameEn?: string;
  code: string;
  type: 'exterior' | 'interior';
  manufacturerId?: number;
  categoryId?: number;
  trimLevelId?: number;
  isActive?: boolean;
}

interface HierarchyData {
  id: number;
  nameAr: string;
  nameEn?: string;
  logo?: string;
  isActive?: boolean;
  categories: Category[];
}

export default function DropdownOptionsManagement() {
  const queryClient = useQueryClient();
  
  // State for expanded items
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  
  // State for modals
  const [isAddManufacturerOpen, setIsAddManufacturerOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddTrimLevelOpen, setIsAddTrimLevelOpen] = useState(false);
  const [isAddColorOpen, setIsAddColorOpen] = useState(false);
  const [isAddYearOpen, setIsAddYearOpen] = useState(false);
  
  // State for contextual adding (linked to specific items)
  const [isAddCategoryToManufacturerOpen, setIsAddCategoryToManufacturerOpen] = useState(false);
  const [isAddTrimLevelToCategoryOpen, setIsAddTrimLevelToCategoryOpen] = useState(false);
  const [isAddColorToManufacturerOpen, setIsAddColorToManufacturerOpen] = useState(false);
  const [isAddColorToCategoryOpen, setIsAddColorToCategoryOpen] = useState(false);
  const [isAddColorToTrimLevelOpen, setIsAddColorToTrimLevelOpen] = useState(false);
  
  // State for logo upload
  const [isLogoUploadOpen, setIsLogoUploadOpen] = useState(false);
  const [selectedManufacturerForLogo, setSelectedManufacturerForLogo] = useState<number | null>(null);
  
  // Form states for adding new items
  const [manufacturerNameAr, setManufacturerNameAr] = useState("");
  const [manufacturerNameEn, setManufacturerNameEn] = useState("");
  const [manufacturerLogo, setManufacturerLogo] = useState("");
  
  const [categoryNameAr, setCategoryNameAr] = useState("");
  const [categoryNameEn, setCategoryNameEn] = useState("");
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<number | null>(null);
  
  const [trimLevelNameAr, setTrimLevelNameAr] = useState("");
  const [trimLevelNameEn, setTrimLevelNameEn] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  
  const [colorName, setColorName] = useState("");
  const [colorNameEn, setColorNameEn] = useState("");
  const [colorCode, setColorCode] = useState("#FFFFFF");
  const [colorType, setColorType] = useState<'exterior' | 'interior'>('exterior');
  
  const [yearValue, setYearValue] = useState<number>(new Date().getFullYear());
  
  // Edit states
  const [isEditManufacturerOpen, setIsEditManufacturerOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isEditTrimLevelOpen, setIsEditTrimLevelOpen] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingTrimLevel, setEditingTrimLevel] = useState<TrimLevel | null>(null);
  
  // State for tracking contextual relationships
  const [contextManufacturerId, setContextManufacturerId] = useState<number | null>(null);
  const [contextCategoryId, setContextCategoryId] = useState<number | null>(null);
  const [contextTrimLevelId, setContextTrimLevelId] = useState<number | null>(null);

  // Fetch data
  const { data: hierarchyData = [], isLoading } = useQuery<HierarchyData[]>({
    queryKey: ['/api/hierarchy/full'],
  });

  const { data: manufacturers = [] } = useQuery<Manufacturer[]>({
    queryKey: ['/api/manufacturers'],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: trimLevels = [] } = useQuery<TrimLevel[]>({
    queryKey: ['/api/trim-levels'],
  });

  const { data: vehicleYears = [] } = useQuery<any[]>({
    queryKey: ['/api/vehicle-years-full'],
  });

  // Toggle manufacturer active status
  const toggleManufacturerMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return apiRequest('PUT', `/api/manufacturers/${id}/toggle`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hierarchy/full'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الشركة المصنعة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الشركة المصنعة",
        variant: "destructive",
      });
    }
  });

  // Toggle category active status
  const toggleCategoryMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return apiRequest('PUT', `/api/categories/${id}/toggle`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hierarchy/full'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الفئة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الفئة",
        variant: "destructive",
      });
    }
  });

  // Toggle trim level active status
  const toggleTrimLevelMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return apiRequest('PUT', `/api/trim-levels/${id}/toggle`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trim-levels'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hierarchy/full'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة درجة التجهيز بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة درجة التجهيز",
        variant: "destructive",
      });
    }
  });

  // Edit manufacturer mutation
  const editManufacturerMutation = useMutation({
    mutationFn: async (data: { id: number; nameAr: string; nameEn?: string }) => {
      return apiRequest('PUT', `/api/manufacturers/${data.id}`, { 
        nameAr: data.nameAr, 
        nameEn: data.nameEn 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hierarchy/full'] });
      setIsEditManufacturerOpen(false);
      setEditingManufacturer(null);
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات الشركة المصنعة بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error?.message || "فشل في تحديث بيانات الشركة المصنعة",
        variant: "destructive",
      });
    }
  });

  // Delete manufacturer mutation
  // Helper function to extract error message
  const getErrorMessage = (error: any) => {
    if (error?.message) {
      // Try to parse if it's a "status: {json}" string
      const match = error.message.match(/^\d+: (\{.*\})$/);
      if (match) {
        try {
          const parsed = JSON.parse(match[1]);
          return parsed.message || parsed.error || error.message;
        } catch (e) {
          return error.message;
        }
      }
      return error.message;
    }
    return null;
  };

  // Helper that returns parsed JSON body of an error if it's "status: {json}"
  const getErrorBody = (error: any): any | null => {
    if (!error?.message) return null;
    const match = error.message.match(/^\d+: (\{.*\})$/);
    if (!match) return null;
    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  };

  const deleteManufacturerMutation = useMutation({
    mutationFn: async ({ id, force }: { id: number; force?: boolean }) => {
      const url = force ? `/api/manufacturers/${id}?force=true` : `/api/manufacturers/${id}`;
      return apiRequest('DELETE', url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hierarchy/full'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trim-levels'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف الشركة المصنعة بنجاح",
      });
    },
    onError: (error: any, variables) => {
      const body = getErrorBody(error);
      // Backend asks for cascade confirmation (409 with canForce=true)
      if (body?.canForce && !variables.force) {
        const confirmMsg = `${body.message}\n\nسيتم حذف ${body.linkedCategories} فئة و ${body.linkedTrimLevels} درجة تجهيز نهائياً. هل تريد المتابعة؟`;
        if (window.confirm(confirmMsg)) {
          deleteManufacturerMutation.mutate({ id: variables.id, force: true });
        }
        return;
      }
      toast({
        title: "خطأ",
        description: body?.message || getErrorMessage(error) || "فشل في حذف الشركة المصنعة",
        variant: "destructive",
      });
    }
  });

  // Edit category mutation  
  const editCategoryMutation = useMutation({
    mutationFn: async (data: { id: number; nameAr: string; nameEn?: string; manufacturerId: number }) => {
      return apiRequest('PUT', `/api/categories/${data.id}`, { 
        nameAr: data.nameAr, 
        nameEn: data.nameEn,
        manufacturerId: data.manufacturerId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hierarchy/full'] });
      setIsEditCategoryOpen(false);
      setEditingCategory(null);
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات الفئة بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: getErrorMessage(error) || "فشل في تحديث بيانات الفئة",
        variant: "destructive",
      });
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async ({ id, force }: { id: number; force?: boolean }) => {
      const url = force ? `/api/categories/${id}?force=true` : `/api/categories/${id}`;
      return apiRequest('DELETE', url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hierarchy/full'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trim-levels'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف الفئة بنجاح",
      });
    },
    onError: (error: any, variables) => {
      const body = getErrorBody(error);
      if (body?.canForce && !variables.force) {
        const confirmMsg = `${body.message}\n\nسيتم حذف ${body.linkedTrimLevels} درجة تجهيز نهائياً. هل تريد المتابعة؟`;
        if (window.confirm(confirmMsg)) {
          deleteCategoryMutation.mutate({ id: variables.id, force: true });
        }
        return;
      }
      toast({
        title: "خطأ",
        description: body?.message || getErrorMessage(error) || "فشل في حذف الفئة",
        variant: "destructive",
      });
    }
  });

  // Edit trim level mutation
  const editTrimLevelMutation = useMutation({
    mutationFn: async (data: { id: number; nameAr: string; nameEn?: string; categoryId: number }) => {
      return apiRequest('PUT', `/api/trim-levels/${data.id}`, { 
        nameAr: data.nameAr, 
        nameEn: data.nameEn,
        categoryId: data.categoryId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trim-levels'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hierarchy/full'] });
      setIsEditTrimLevelOpen(false);
      setEditingTrimLevel(null);
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات درجة التجهيز بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: getErrorMessage(error) || "فشل في تحديث بيانات درجة التجهيز",
        variant: "destructive",
      });
    }
  });

  // Delete trim level mutation
  const deleteTrimLevelMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/trim-levels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trim-levels'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hierarchy/full'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف درجة التجهيز بنجاح",
      });
    },
    onError: (error: any) => {
      const body = getErrorBody(error);
      toast({
        title: "خطأ",
        description: body?.message || getErrorMessage(error) || "فشل في حذف درجة التجهيز",
        variant: "destructive",
      });
    }
  });

  // Add manufacturer mutation
  const addManufacturerMutation = useMutation({
    mutationFn: async (data: { nameAr: string; nameEn?: string; logo?: string }) => {
      return apiRequest('POST', '/api/manufacturers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hierarchy/full'] });
      toast({
        title: "تم الإنشاء بنجاح",
        description: "تم إضافة الشركة المصنعة بنجاح",
      });
      // Reset form
      setManufacturerNameAr("");
      setManufacturerNameEn("");
      setManufacturerLogo("");
      setIsAddManufacturerOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الإنشاء",
        description: getErrorMessage(error) || "فشل في إضافة الشركة المصنعة",
        variant: "destructive"
      });
    }
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (data: { nameAr: string; nameEn?: string; manufacturerId: number }) => {
      return apiRequest('POST', '/api/categories', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hierarchy/full'] });
      toast({
        title: "تم الإنشاء بنجاح",
        description: "تم إضافة الفئة بنجاح",
      });
      // Reset form
      setCategoryNameAr("");
      setCategoryNameEn("");
      setSelectedManufacturerId(null);
      setContextManufacturerId(null);
      setIsAddCategoryOpen(false);
      setIsAddCategoryToManufacturerOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الإنشاء",
        description: getErrorMessage(error) || "فشل في إضافة الفئة",
        variant: "destructive"
      });
    }
  });

  // Add trim level mutation
  const addTrimLevelMutation = useMutation({
    mutationFn: async (data: { nameAr: string; nameEn?: string; categoryId: number }) => {
      return apiRequest('POST', '/api/trim-levels', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trim-levels'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hierarchy/full'] });
      toast({
        title: "تم الإنشاء بنجاح",
        description: "تم إضافة درجة التجهيز بنجاح",
      });
      // Reset form
      setTrimLevelNameAr("");
      setTrimLevelNameEn("");
      setSelectedCategoryId(null);
      setContextCategoryId(null);
      setIsAddTrimLevelOpen(false);
      setIsAddTrimLevelToCategoryOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الإنشاء",
        description: getErrorMessage(error) || "فشل في إضافة درجة التجهيز",
        variant: "destructive"
      });
    }
  });

  // Add color mutation
  const addColorMutation = useMutation({
    mutationFn: async (data: { 
      manufacturer: string; 
      category?: string; 
      trimLevel?: string; 
      colorType: 'exterior' | 'interior';
      colorName: string;
      colorCode: string;
    }) => {
      return apiRequest('POST', '/api/hierarchical/colors', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hierarchical/colors'] });
      toast({
        title: "تم الإنشاء بنجاح",
        description: "تم إضافة اللون بنجاح",
      });
      // Reset form
      setColorName("");
      setColorNameEn("");
      setColorCode("#FFFFFF");
      setIsAddColorOpen(false);
      setIsAddColorToManufacturerOpen(false);
      setIsAddColorToCategoryOpen(false);
      setIsAddColorToTrimLevelOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الإنشاء",
        description: error?.message || "فشل في إضافة اللون",
        variant: "destructive"
      });
    }
  });

  // Add year mutation
  const addYearMutation = useMutation({
    mutationFn: async (year: number) => {
      return apiRequest('POST', '/api/vehicle-years', { year, isActive: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/combined-dropdowns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-years-full'] });
      toast({
        title: "تم الإنشاء بنجاح",
        description: "تم إضافة السنة بنجاح",
      });
      setIsAddYearOpen(false);
      setYearValue(new Date().getFullYear());
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الإنشاء",
        description: getErrorMessage(error) || "فشل في إضافة السنة",
        variant: "destructive"
      });
    }
  });

  // Logo upload mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async ({ manufacturerId, file }: { manufacturerId: number; file: File }) => {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await fetch(`/api/manufacturers/${manufacturerId}/upload-logo`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('فشل في رفع الشعار');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hierarchy/full'] });
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturers'] });
      toast({
        title: "تم الرفع بنجاح",
        description: "تم رفع شعار الصانع بنجاح",
      });
      setIsLogoUploadOpen(false);
    },
    onError: (error) => {
      toast({
        title: "خطأ في الرفع",
        description: error instanceof Error ? error.message : "فشل في رفع الشعار",
        variant: "destructive"
      });
    }
  });

  // Handle file upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedManufacturerForLogo) {
      // Validate file type
      const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "نوع الملف غير مدعوم",
          description: "يرجى رفع ملف بصيغة SVG أو PNG فقط",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "الملف كبير جداً",
          description: "يرجى رفع ملف أصغر من 2 ميجابايت",
          variant: "destructive"
        });
        return;
      }

      uploadLogoMutation.mutate({ 
        manufacturerId: selectedManufacturerForLogo, 
        file 
      });
    }
    // Reset the input value to allow re-selecting the same file
    event.target.value = '';
  };

  // Toggle expanded state
  const toggleExpanded = (key: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedItems(newExpanded);
  };

  // Filter data based on search and type - show ALL manufacturers (active and inactive)
  const filteredData = hierarchyData.filter(item => {
    if (!item || !item.nameAr) return false;
    
    const matchesSearch = item.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.nameEn && item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Show all manufacturers regardless of active status for management purposes
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <SystemGlassWrapper>
        <div className="relative z-10" dir="rtl">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pr-24">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white/60 mx-auto mb-4"></div>
                <p className="text-lg text-white/80">جاري تحميل بيانات القوائم...</p>
              </div>
            </div>
          </main>
        </div>
      </SystemGlassWrapper>
    );
  }

  return (
    <SystemGlassWrapper>
      <div className="relative z-10" dir="rtl">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pr-24 space-y-6">
        
        {/* Header Section */}
        <Card className="glass-container p-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white mb-4">
              إدارة الشركات المصنعة والفئات ودرجات التجهيز
            </h1>
            <p className="text-lg text-white/80">
              إدارة شاملة لجميع خيارات القوائم المنسدلة في النظام
            </p>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-white/60" />
              <Input
                placeholder="البحث في الشركات المصنعة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-search pr-10 h-12 text-lg"
                data-testid="search-manufacturers"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="glass-button w-full lg:w-48 h-12">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue placeholder="نوع البيانات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع البيانات</SelectItem>
                <SelectItem value="manufacturers">الشركات المصنعة</SelectItem>
                <SelectItem value="categories">الفئات</SelectItem>
                <SelectItem value="trimlevels">درجات التجهيز</SelectItem>
                <SelectItem value="years">السنوات</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Dialog open={isAddManufacturerOpen} onOpenChange={setIsAddManufacturerOpen}>
              <DialogTrigger asChild>
                <Button className="glass-button-primary h-16 shadow-lg rounded-2xl transition-all duration-300 hover:scale-105">
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="w-6 h-6" />
                    <span className="font-semibold">شركة مصنعة</span>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-center text-blue-600">إضافة شركة مصنعة جديدة</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 p-2">
                  <div>
                    <Label htmlFor="manufacturer-name-ar" className="text-lg">الاسم بالعربية</Label>
                    <Input
                      id="manufacturer-name-ar"
                      value={manufacturerNameAr}
                      onChange={(e) => setManufacturerNameAr(e.target.value)}
                      placeholder="أدخل اسم الشركة المصنعة بالعربية"
                      className="h-12 text-lg rounded-xl"
                      data-testid="input-manufacturer-name-ar"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manufacturer-name-en" className="text-lg">الاسم بالإنجليزية (اختياري)</Label>
                    <Input
                      id="manufacturer-name-en"
                      value={manufacturerNameEn}
                      onChange={(e) => setManufacturerNameEn(e.target.value)}
                      placeholder="أدخل اسم الشركة المصنعة بالإنجليزية"
                      className="h-12 text-lg rounded-xl"
                      data-testid="input-manufacturer-name-en"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manufacturer-logo" className="text-lg">رابط الشعار (اختياري)</Label>
                    <Input
                      id="manufacturer-logo"
                      value={manufacturerLogo}
                      onChange={(e) => setManufacturerLogo(e.target.value)}
                      placeholder="أدخل رابط شعار الشركة"
                      className="h-12 text-lg rounded-xl"
                      data-testid="input-manufacturer-logo"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => {
                        if (!manufacturerNameAr.trim()) {
                          toast({
                            title: "خطأ",
                            description: "يرجى إدخال اسم الشركة بالعربية",
                            variant: "destructive"
                          });
                          return;
                        }
                        addManufacturerMutation.mutate({
                          nameAr: manufacturerNameAr.trim(),
                          nameEn: manufacturerNameEn.trim() || undefined,
                          logo: manufacturerLogo.trim() || undefined,
                        });
                      }}
                      disabled={addManufacturerMutation.isPending}
                      className="flex-1 h-12 bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-50"
                      data-testid="button-save-manufacturer"
                    >
                      <Save className="w-5 h-5 ml-2" />
                      {addManufacturerMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setManufacturerNameAr("");
                        setManufacturerNameEn("");
                        setManufacturerLogo("");
                        setIsAddManufacturerOpen(false);
                      }}
                      className="h-12 rounded-xl"
                      data-testid="button-cancel-manufacturer"
                    >
                      <X className="w-5 h-5 ml-2" />
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
              <DialogTrigger asChild>
                <Button className="glass-button-primary h-16 shadow-lg rounded-2xl transition-all duration-300 hover:scale-105">
                  <div className="flex flex-col items-center gap-2">
                    <Car className="w-6 h-6" />
                    <span className="font-semibold">فئة جديدة</span>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-center text-green-600">إضافة فئة جديدة</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 p-2">
                  <div>
                    <Label className="text-lg">الشركة المصنعة</Label>
                    <Select value={selectedManufacturerId?.toString()} onValueChange={(value) => setSelectedManufacturerId(Number(value))}>
                      <SelectTrigger className="h-12 rounded-xl" data-testid="select-category-manufacturer">
                        <SelectValue placeholder="اختر الشركة المصنعة" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(manufacturers) && manufacturers.map((manufacturer: Manufacturer) => (
                          <SelectItem key={manufacturer.id} value={manufacturer.id.toString()}>
                            {manufacturer.nameAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-lg">الاسم بالعربية</Label>
                    <Input
                      value={categoryNameAr}
                      onChange={(e) => setCategoryNameAr(e.target.value)}
                      placeholder="أدخل اسم الفئة بالعربية"
                      className="h-12 text-lg rounded-xl"
                      data-testid="input-category-name-ar"
                    />
                  </div>
                  <div>
                    <Label className="text-lg">الاسم بالإنجليزية (اختياري)</Label>
                    <Input
                      value={categoryNameEn}
                      onChange={(e) => setCategoryNameEn(e.target.value)}
                      placeholder="أدخل اسم الفئة بالإنجليزية"
                      className="h-12 text-lg rounded-xl"
                      data-testid="input-category-name-en"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => {
                        if (!categoryNameAr.trim()) {
                          toast({
                            title: "خطأ",
                            description: "يرجى إدخال اسم الفئة بالعربية",
                            variant: "destructive"
                          });
                          return;
                        }
                        if (!selectedManufacturerId) {
                          toast({
                            title: "خطأ",
                            description: "يرجى اختيار الشركة المصنعة",
                            variant: "destructive"
                          });
                          return;
                        }
                        addCategoryMutation.mutate({
                          nameAr: categoryNameAr.trim(),
                          nameEn: categoryNameEn.trim() || undefined,
                          manufacturerId: selectedManufacturerId,
                        });
                      }}
                      disabled={addCategoryMutation.isPending}
                      className="flex-1 h-12 bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-50"
                      data-testid="button-save-category"
                    >
                      <Save className="w-5 h-5 ml-2" />
                      {addCategoryMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddCategoryOpen(false)}
                      className="h-12 rounded-xl"
                      data-testid="button-cancel-category"
                    >
                      <X className="w-5 h-5 ml-2" />
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddTrimLevelOpen} onOpenChange={setIsAddTrimLevelOpen}>
              <DialogTrigger asChild>
                <Button className="glass-button-primary h-16 shadow-lg rounded-2xl transition-all duration-300 hover:scale-105">
                  <div className="flex flex-col items-center gap-2">
                    <Settings className="w-6 h-6" />
                    <span className="font-semibold">درجة تجهيز</span>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-center text-purple-600">إضافة درجة تجهيز جديدة</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 p-2">
                  <div>
                    <Label className="text-lg">الفئة</Label>
                    <Select value={selectedCategoryId?.toString()} onValueChange={(value) => setSelectedCategoryId(Number(value))}>
                      <SelectTrigger className="h-12 rounded-xl" data-testid="select-trimlevel-category">
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(hierarchyData) && hierarchyData.flatMap((item: HierarchyData) => 
                          item.categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {item.nameAr} - {cat.nameAr}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-lg">الاسم بالعربية</Label>
                    <Input
                      value={trimLevelNameAr}
                      onChange={(e) => setTrimLevelNameAr(e.target.value)}
                      placeholder="أدخل اسم درجة التجهيز بالعربية"
                      className="h-12 text-lg rounded-xl"
                      data-testid="input-trimlevel-name-ar"
                    />
                  </div>
                  <div>
                    <Label className="text-lg">الاسم بالإنجليزية (اختياري)</Label>
                    <Input
                      value={trimLevelNameEn}
                      onChange={(e) => setTrimLevelNameEn(e.target.value)}
                      placeholder="أدخل اسم درجة التجهيز بالإنجليزية"
                      className="h-12 text-lg rounded-xl"
                      data-testid="input-trimlevel-name-en"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => {
                        if (!trimLevelNameAr.trim()) {
                          toast({
                            title: "خطأ",
                            description: "يرجى إدخال اسم درجة التجهيز بالعربية",
                            variant: "destructive"
                          });
                          return;
                        }
                        if (!selectedCategoryId) {
                          toast({
                            title: "خطأ",
                            description: "يرجى اختيار الفئة",
                            variant: "destructive"
                          });
                          return;
                        }
                        addTrimLevelMutation.mutate({
                          nameAr: trimLevelNameAr.trim(),
                          nameEn: trimLevelNameEn.trim() || undefined,
                          categoryId: selectedCategoryId,
                        });
                      }}
                      disabled={addTrimLevelMutation.isPending}
                      className="flex-1 h-12 bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-50"
                      data-testid="button-save-trimlevel"
                    >
                      <Save className="w-5 h-5 ml-2" />
                      {addTrimLevelMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddTrimLevelOpen(false)}
                      className="h-12 rounded-xl"
                      data-testid="button-cancel-trimlevel"
                    >
                      <X className="w-5 h-5 ml-2" />
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddColorOpen} onOpenChange={setIsAddColorOpen}>
              <DialogTrigger asChild>
                <Button className="glass-button-primary h-16 shadow-lg rounded-2xl transition-all duration-300 hover:scale-105">
                  <div className="flex flex-col items-center gap-2">
                    <Palette className="w-6 h-6" />
                    <span className="font-semibold">لون جديد</span>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-center text-orange-600">إضافة لون جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 p-2">
                  <div>
                    <Label className="text-lg">نوع اللون</Label>
                    <Select value={colorType} onValueChange={(value: 'exterior' | 'interior') => setColorType(value)}>
                      <SelectTrigger className="h-12 rounded-xl" data-testid="select-color-type">
                        <SelectValue placeholder="اختر نوع اللون" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exterior">خارجي</SelectItem>
                        <SelectItem value="interior">داخلي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-lg">الاسم بالعربية</Label>
                    <Input
                      value={colorName}
                      onChange={(e) => setColorName(e.target.value)}
                      placeholder="أدخل اسم اللون بالعربية"
                      className="h-12 text-lg rounded-xl"
                      data-testid="input-color-name"
                    />
                  </div>
                  <div>
                    <Label className="text-lg">كود اللون</Label>
                    <div className="flex gap-3">
                      <Input
                        value={colorCode}
                        onChange={(e) => setColorCode(e.target.value)}
                        placeholder="#FFFFFF"
                        className="h-12 text-lg rounded-xl"
                        data-testid="input-color-code"
                      />
                      <div 
                        className="w-16 h-12 rounded-xl border-2 border-gray-300"
                        style={{ backgroundColor: colorCode }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => {
                        if (!colorName.trim()) {
                          toast({
                            title: "خطأ",
                            description: "يرجى إدخال اسم اللون",
                            variant: "destructive"
                          });
                          return;
                        }
                        // This is a general add color, might need manufacturer/category context
                        // For now let's just show a message that it needs context
                        toast({
                          title: "تنبيه",
                          description: "يرجى إضافة اللون من خلال شركة أو فئة محددة لربطه بشكل صحيح",
                        });
                      }}
                      disabled={addColorMutation.isPending}
                      className="flex-1 h-12 bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-50"
                      data-testid="button-save-color"
                    >
                      <Save className="w-5 h-5 ml-2" />
                      {addColorMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddColorOpen(false)}
                      className="h-12 rounded-xl"
                      data-testid="button-cancel-color"
                    >
                      <X className="w-5 h-5 ml-2" />
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddYearOpen} onOpenChange={setIsAddYearOpen}>
              <DialogTrigger asChild>
                <Button className="glass-button-primary h-16 shadow-lg rounded-2xl transition-all duration-300 hover:scale-105">
                  <div className="flex flex-col items-center gap-2">
                    <Calendar className="w-6 h-6" />
                    <span className="font-semibold">سنة جديدة</span>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-center text-cyan-600">إضافة سنة جديدة</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 p-2">
                  <div>
                    <Label className="text-lg">السنة</Label>
                    <Input
                      type="number"
                      value={yearValue}
                      onChange={(e) => setYearValue(Number(e.target.value))}
                      placeholder="أدخل السنة"
                      className="h-12 text-lg rounded-xl"
                      data-testid="input-year-value"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => {
                        if (!yearValue || yearValue < 1900 || yearValue > new Date().getFullYear() + 2) {
                          toast({
                            title: "خطأ",
                            description: "يرجى إدخال سنة صحيحة",
                            variant: "destructive"
                          });
                          return;
                        }
                        addYearMutation.mutate(yearValue);
                      }}
                      disabled={addYearMutation.isPending}
                      className="flex-1 h-12 bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-50"
                      data-testid="button-save-year"
                    >
                      <Save className="w-5 h-5 ml-2" />
                      {addYearMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddYearOpen(false)}
                      className="h-12 rounded-xl"
                      data-testid="button-cancel-year"
                    >
                      <X className="w-5 h-5 ml-2" />
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Contextual Add Category to Manufacturer Dialog */}
            <Dialog open={isAddCategoryToManufacturerOpen} onOpenChange={setIsAddCategoryToManufacturerOpen}>
              <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-center text-blue-600">إضافة فئة للصانع</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 p-2">
                  <div>
                    <Label className="text-lg">الصانع المحدد</Label>
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <span className="text-blue-800 font-medium">
                        {hierarchyData.find(m => m.id === contextManufacturerId)?.nameAr || "غير محدد"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-lg">الاسم بالعربية</Label>
                    <Input
                      value={categoryNameAr}
                      onChange={(e) => setCategoryNameAr(e.target.value)}
                      placeholder="أدخل اسم الفئة بالعربية"
                      className="h-12 text-lg rounded-xl"
                      data-testid="input-category-name-ar-contextual"
                    />
                  </div>
                  <div>
                    <Label className="text-lg">الاسم بالإنجليزية (اختياري)</Label>
                    <Input
                      value={categoryNameEn}
                      onChange={(e) => setCategoryNameEn(e.target.value)}
                      placeholder="أدخل اسم الفئة بالإنجليزية"
                      className="h-12 text-lg rounded-xl"
                      data-testid="input-category-name-en-contextual"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => {
                        if (!categoryNameAr.trim()) {
                          toast({
                            title: "خطأ",
                            description: "يرجى إدخال اسم الفئة بالعربية",
                            variant: "destructive"
                          });
                          return;
                        }
                        if (!contextManufacturerId) {
                          toast({
                            title: "خطأ",
                            description: "لم يتم تحديد صانع",
                            variant: "destructive"
                          });
                          return;
                        }
                        addCategoryMutation.mutate({
                          nameAr: categoryNameAr.trim(),
                          nameEn: categoryNameEn.trim() || undefined,
                          manufacturerId: contextManufacturerId,
                        });
                      }}
                      disabled={addCategoryMutation.isPending}
                      className="flex-1 h-12 bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-50"
                      data-testid="button-save-category-contextual"
                    >
                      <Save className="w-5 h-5 ml-2" />
                      {addCategoryMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddCategoryToManufacturerOpen(false)}
                      className="h-12 rounded-xl"
                      data-testid="button-cancel-category-contextual"
                    >
                      <X className="w-5 h-5 ml-2" />
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Contextual Add Trim Level to Category Dialog */}
            <Dialog open={isAddTrimLevelToCategoryOpen} onOpenChange={setIsAddTrimLevelToCategoryOpen}>
              <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-center text-purple-600">إضافة درجة تجهيز للفئة</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 p-2">
                  <div>
                    <Label className="text-lg">الفئة المحددة</Label>
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                      <span className="text-purple-800 font-medium">
                        {hierarchyData.flatMap(m => m.categories).find(c => c.id === contextCategoryId)?.nameAr || "غير محدد"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-lg">الاسم بالعربية</Label>
                    <Input
                      value={trimLevelNameAr}
                      onChange={(e) => setTrimLevelNameAr(e.target.value)}
                      placeholder="أدخل اسم درجة التجهيز بالعربية"
                      className="h-12 text-lg rounded-xl"
                      data-testid="input-trimlevel-name-ar-contextual"
                    />
                  </div>
                  <div>
                    <Label className="text-lg">الاسم بالإنجليزية (اختياري)</Label>
                    <Input
                      value={trimLevelNameEn}
                      onChange={(e) => setTrimLevelNameEn(e.target.value)}
                      placeholder="أدخل اسم درجة التجهيز بالإنجليزية"
                      className="h-12 text-lg rounded-xl"
                      data-testid="input-trimlevel-name-en-contextual"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => {
                        if (!trimLevelNameAr.trim()) {
                          toast({
                            title: "خطأ",
                            description: "يرجى إدخال اسم درجة التجهيز بالعربية",
                            variant: "destructive"
                          });
                          return;
                        }
                        if (!contextCategoryId) {
                          toast({
                            title: "خطأ",
                            description: "لم يتم تحديد فئة",
                            variant: "destructive"
                          });
                          return;
                        }
                        addTrimLevelMutation.mutate({
                          nameAr: trimLevelNameAr.trim(),
                          nameEn: trimLevelNameEn.trim() || undefined,
                          categoryId: contextCategoryId,
                        });
                      }}
                      disabled={addTrimLevelMutation.isPending}
                      className="flex-1 h-12 bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-50"
                      data-testid="button-save-trimlevel-contextual"
                    >
                      <Save className="w-5 h-5 ml-2" />
                      {addTrimLevelMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddTrimLevelToCategoryOpen(false)}
                      className="h-12 rounded-xl"
                      data-testid="button-cancel-trimlevel-contextual"
                    >
                      <X className="w-5 h-5 ml-2" />
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Contextual Add Color to Manufacturer Dialog */}
            <Dialog open={isAddColorToManufacturerOpen} onOpenChange={setIsAddColorToManufacturerOpen}>
              <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-center text-orange-600">إضافة لون للصانع</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 p-2">
                  <div>
                    <Label className="text-lg">الصانع المحدد</Label>
                    <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
                      <span className="text-orange-800 font-medium">
                        {hierarchyData.find(m => m.id === contextManufacturerId)?.nameAr || "غير محدد"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-lg">نوع اللون</Label>
                    <Select value={colorType} onValueChange={(value: 'exterior' | 'interior') => setColorType(value)}>
                      <SelectTrigger className="h-12 rounded-xl" data-testid="select-color-type-manufacturer">
                        <SelectValue placeholder="اختر نوع اللون" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exterior">خارجي</SelectItem>
                        <SelectItem value="interior">داخلي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-lg">الاسم بالعربية</Label>
                    <Input
                      value={colorName}
                      onChange={(e) => setColorName(e.target.value)}
                      placeholder="أدخل اسم اللون بالعربية"
                      className="h-12 text-lg rounded-xl"
                      data-testid="input-color-name-manufacturer"
                    />
                  </div>
                  <div>
                    <Label className="text-lg">كود اللون</Label>
                    <div className="flex gap-3">
                      <Input
                        value={colorCode}
                        onChange={(e) => setColorCode(e.target.value)}
                        placeholder="#FFFFFF"
                        className="h-12 text-lg rounded-xl"
                        data-testid="input-color-code-manufacturer"
                      />
                      <div 
                        className="w-16 h-12 rounded-xl border-2 border-gray-300"
                        style={{ backgroundColor: colorCode }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => {
                        if (!colorName.trim()) {
                          toast({
                            title: "خطأ",
                            description: "يرجى إدخال اسم اللون",
                            variant: "destructive"
                          });
                          return;
                        }
                        const manufacturer = hierarchyData.find(m => m.id === contextManufacturerId);
                        if (!manufacturer) return;

                        addColorMutation.mutate({
                          manufacturer: manufacturer.nameAr,
                          colorType,
                          colorName: colorName.trim(),
                          colorCode,
                        });
                      }}
                      disabled={addColorMutation.isPending}
                      className="flex-1 h-12 bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-50"
                      data-testid="button-save-color-manufacturer"
                    >
                      <Save className="w-5 h-5 ml-2" />
                      {addColorMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddColorToManufacturerOpen(false)}
                      className="h-12 rounded-xl"
                      data-testid="button-cancel-color-manufacturer"
                    >
                      <X className="w-5 h-5 ml-2" />
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Contextual Add Color to Category Dialog */}
            <Dialog open={isAddColorToCategoryOpen} onOpenChange={setIsAddColorToCategoryOpen}>
              <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-center text-pink-600">إضافة لون للفئة</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 p-2">
                  <div>
                    <Label className="text-lg">الفئة المحددة</Label>
                    <div className="p-3 bg-pink-50 rounded-xl border border-pink-200">
                      <span className="text-pink-800 font-medium">
                        {hierarchyData.flatMap(m => m.categories).find(c => c.id === contextCategoryId)?.nameAr || "غير محدد"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-lg">نوع اللون</Label>
                    <Select value={colorType} onValueChange={(value: 'exterior' | 'interior') => setColorType(value)}>
                      <SelectTrigger className="h-12 rounded-xl" data-testid="select-color-type-category">
                        <SelectValue placeholder="اختر نوع اللون" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exterior">خارجي</SelectItem>
                        <SelectItem value="interior">داخلي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-lg">الاسم بالعربية</Label>
                    <Input
                      value={colorName}
                      onChange={(e) => setColorName(e.target.value)}
                      placeholder="أدخل اسم اللون بالعربية"
                      className="h-12 text-lg rounded-xl"
                      data-testid="input-color-name-category"
                    />
                  </div>
                  <div>
                    <Label className="text-lg">كود اللون</Label>
                    <div className="flex gap-3">
                      <Input
                        value={colorCode}
                        onChange={(e) => setColorCode(e.target.value)}
                        placeholder="#FFFFFF"
                        className="h-12 text-lg rounded-xl"
                        data-testid="input-color-code-category"
                      />
                      <div 
                        className="w-16 h-12 rounded-xl border-2 border-gray-300"
                        style={{ backgroundColor: colorCode }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => {
                        if (!colorName.trim()) {
                          toast({
                            title: "خطأ",
                            description: "يرجى إدخال اسم اللون",
                            variant: "destructive"
                          });
                          return;
                        }
                        const manufacturer = hierarchyData.find(m => m.categories.some(c => c.id === contextCategoryId));
                        const category = manufacturer?.categories.find(c => c.id === contextCategoryId);
                        if (!manufacturer || !category) return;

                        addColorMutation.mutate({
                          manufacturer: manufacturer.nameAr,
                          category: category.nameAr,
                          colorType,
                          colorName: colorName.trim(),
                          colorCode,
                        });
                      }}
                      disabled={addColorMutation.isPending}
                      className="flex-1 h-12 bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-50"
                      data-testid="button-save-color-category"
                    >
                      <Save className="w-5 h-5 ml-2" />
                      {addColorMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddColorToCategoryOpen(false)}
                      className="h-12 rounded-xl"
                      data-testid="button-cancel-color-category"
                    >
                      <X className="w-5 h-5 ml-2" />
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Contextual Add Color to Trim Level Dialog */}
            <Dialog open={isAddColorToTrimLevelOpen} onOpenChange={setIsAddColorToTrimLevelOpen}>
              <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-center text-yellow-600">إضافة لون لدرجة التجهيز</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 p-2">
                  <div>
                    <Label className="text-lg">درجة التجهيز المحددة</Label>
                    <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                      <span className="text-yellow-800 font-medium">
                        {hierarchyData.flatMap(m => m.categories).flatMap(c => c.trimLevels).find(t => t.id === contextTrimLevelId)?.nameAr || "غير محدد"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-lg">نوع اللون</Label>
                    <Select value={colorType} onValueChange={(value: 'exterior' | 'interior') => setColorType(value)}>
                      <SelectTrigger className="h-12 rounded-xl" data-testid="select-color-type-trimlevel">
                        <SelectValue placeholder="اختر نوع اللون" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exterior">خارجي</SelectItem>
                        <SelectItem value="interior">داخلي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-lg">الاسم بالعربية</Label>
                    <Input
                      value={colorName}
                      onChange={(e) => setColorName(e.target.value)}
                      placeholder="أدخل اسم اللون بالعربية"
                      className="h-12 text-lg rounded-xl"
                      data-testid="input-color-name-trimlevel"
                    />
                  </div>
                  <div>
                    <Label className="text-lg">كود اللون</Label>
                    <div className="flex gap-3">
                      <Input
                        value={colorCode}
                        onChange={(e) => setColorCode(e.target.value)}
                        placeholder="#FFFFFF"
                        className="h-12 text-lg rounded-xl"
                        data-testid="input-color-code-trimlevel"
                      />
                      <div 
                        className="w-16 h-12 rounded-xl border-2 border-gray-300"
                        style={{ backgroundColor: colorCode }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => {
                        if (!colorName.trim()) {
                          toast({
                            title: "خطأ",
                            description: "يرجى إدخال اسم اللون",
                            variant: "destructive"
                          });
                          return;
                        }
                        const manufacturer = hierarchyData.find(m => m.categories.some(c => c.trimLevels.some(t => t.id === contextTrimLevelId)));
                        const category = manufacturer?.categories.find(c => c.trimLevels.some(t => t.id === contextTrimLevelId));
                        const trimLevel = category?.trimLevels.find(t => t.id === contextTrimLevelId);
                        
                        if (!manufacturer || !category || !trimLevel) return;

                        addColorMutation.mutate({
                          manufacturer: manufacturer.nameAr,
                          category: category.nameAr,
                          trimLevel: trimLevel.nameAr,
                          colorType,
                          colorName: colorName.trim(),
                          colorCode,
                        });
                      }}
                      disabled={addColorMutation.isPending}
                      className="flex-1 h-12 bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-50"
                      data-testid="button-save-color-trimlevel"
                    >
                      <Save className="w-5 h-5 ml-2" />
                      {addColorMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddColorToTrimLevelOpen(false)}
                      className="h-12 rounded-xl"
                      data-testid="button-cancel-color-trimlevel"
                    >
                      <X className="w-5 h-5 ml-2" />
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <Card className="glass-container shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">إجمالي الشركات</p>
                  <p className="text-3xl font-bold text-white">{filteredData.length}</p>
                </div>
                <Building2 className="w-12 h-12 text-white/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-container shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">إجمالي الفئات</p>
                  <p className="text-3xl font-bold text-white">
                    {filteredData.reduce((total, item) => total + item.categories.length, 0)}
                  </p>
                </div>
                <Car className="w-12 h-12 text-white/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-container shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">درجات التجهيز</p>
                  <p className="text-3xl font-bold text-white">
                    {filteredData.reduce((total, item) => 
                      total + item.categories.reduce((catTotal, cat) => 
                        catTotal + cat.trimLevels.length, 0), 0)}
                  </p>
                </div>
                <Settings className="w-12 h-12 text-white/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-container shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">الألوان</p>
                  <p className="text-3xl font-bold text-white">0</p>
                </div>
                <Palette className="w-12 h-12 text-white/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-container shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">إجمالي السنوات</p>
                  <p className="text-3xl font-bold text-white">{vehicleYears.length}</p>
                </div>
                <Calendar className="w-12 h-12 text-white/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="glass-container p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              الهيكل الهرمي للشركات والفئات
            </h2>
            <p className="text-white/80">
              عرض تفصيلي للشركات المصنعة والفئات ودرجات التجهيز
            </p>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filterType === 'years' && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {vehicleYears.map((year: any) => (
                    <Card key={year.id} className="glass-container border-2 border-white/20 p-4 flex items-center justify-between">
                      <span className="text-xl font-bold text-white">{year.year}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-300 hover:text-red-400"
                        onClick={() => {
                          if (window.confirm(`هل أنت متأكد من حذف السنة ${year.year}؟`)) {
                            // Using a simple apiRequest for deletion since I don't want to add another mutation
                            apiRequest('DELETE', `/api/vehicle-years/${year.id}`).then(() => {
                              queryClient.invalidateQueries({ queryKey: ['/api/vehicle-years-full'] });
                              toast({ title: "تم الحذف", description: "تم حذف السنة بنجاح" });
                            });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
              {filterType !== 'years' && filteredData.length > 0 ? filteredData.map((item: HierarchyData) => (
                <Card key={item.id} className={`glass-container border-2 shadow-lg rounded-2xl overflow-hidden ${item.isActive !== false ? 'border-green-400/30 bg-green-900/10' : 'border-red-400/30 bg-red-900/10 opacity-75'}`}>
                  <Collapsible 
                    open={expandedItems.has(`manufacturer-${item.id}`)}
                    onOpenChange={() => toggleExpanded(`manufacturer-${item.id}`)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-white/10 transition-all duration-300 p-6">
                        <CardTitle className="flex items-center justify-between text-xl">
                          <div className="flex items-center gap-4">
                            <div 
                              className="p-3 bg-white/20 rounded-2xl cursor-pointer hover:bg-white/30 transition-all duration-300"
                              onDoubleClick={() => {
                                setSelectedManufacturerForLogo(item.id);
                                setIsLogoUploadOpen(true);
                              }}
                              title="اضغط دبل كليك لرفع الشعار"
                            >
                              <ManufacturerLogo 
                                manufacturerName={item.nameAr}
                                customLogo={item.logo}
                                size="lg"
                                className="w-8 h-8"
                                showFallback={true}
                              />
                            </div>
                            <div>
                              <h3 className={`text-2xl font-bold ${item.isActive !== false ? 'text-white' : 'text-white/70'}`}>{item.nameAr}</h3>
                              {item.nameEn && (
                                <p className={`text-sm ${item.isActive !== false ? 'text-white/60' : 'text-white/40'}`}>({item.nameEn})</p>
                              )}
                              {item.isActive === false && (
                                <p className="text-xs text-red-300 font-medium">مخفي</p>
                              )}
                            </div>
                            <Badge variant="outline" className="bg-white/20 text-white border-white/30 px-4 py-2 text-lg">
                              {item.categories.length} فئة
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Add Category Button */}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="glass-button bg-blue-600/20 hover:bg-blue-600/30"
                              onClick={(e) => {
                                e.stopPropagation();
                                setContextManufacturerId(item.id);
                                setSelectedManufacturerId(item.id);
                                setIsAddCategoryToManufacturerOpen(true);
                              }}
                              data-testid={`add-category-${item.id}`}
                              title="إضافة فئة"
                            >
                              <Plus className="w-4 h-4 text-blue-300" />
                              <Car className="w-4 h-4 text-blue-300 mr-1" />
                            </Button>
                            
                            {/* Add Color to Manufacturer Button */}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="glass-button bg-orange-600/20 hover:bg-orange-600/30"
                              onClick={(e) => {
                                e.stopPropagation();
                                setContextManufacturerId(item.id);
                                setIsAddColorToManufacturerOpen(true);
                              }}
                              data-testid={`add-color-manufacturer-${item.id}`}
                              title="إضافة لون للصانع"
                            >
                              <Plus className="w-4 h-4 text-orange-300" />
                              <Palette className="w-4 h-4 text-orange-300 mr-1" />
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={`glass-button ${item.isActive !== false ? 'bg-green-600/20' : 'bg-red-600/20'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleManufacturerMutation.mutate({ 
                                  id: item.id, 
                                  isActive: item.isActive === false 
                                });
                              }}
                              data-testid={`toggle-manufacturer-${item.id}`}
                            >
                              {item.isActive !== false ? (
                                <Eye className="w-4 h-4 text-green-300" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-red-300" />
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="glass-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingManufacturer(item);
                                setIsEditManufacturerOpen(true);
                              }}
                              data-testid={`edit-manufacturer-${item.id}`}
                              title="تحرير الصانع"
                            >
                              <Edit className="w-4 h-4 text-white" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="glass-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`هل أنت متأكد من حذف الصانع "${item.nameAr}"؟`)) {
                                  deleteManufacturerMutation.mutate(item.id);
                                }
                              }}
                              data-testid={`delete-manufacturer-${item.id}`}
                              title="حذف الصانع"
                            >
                              <Trash2 className="w-4 h-4 text-white" />
                            </Button>
                            {expandedItems.has(`manufacturer-${item.id}`) ? (
                              <ChevronDown className="w-6 h-6 text-white" />
                            ) : (
                              <ChevronRight className="w-6 h-6 text-white" />
                            )}
                          </div>
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="px-8 pb-6">
                        {item.categories && item.categories.length > 0 ? (
                          <div className="space-y-4">
                            {item.categories.map((category) => (
                              <div key={category.id} className="border border-white/20 rounded-2xl overflow-hidden">
                                <Collapsible 
                                  open={expandedItems.has(`category-${category.id}`)}
                                  onOpenChange={() => toggleExpanded(`category-${category.id}`)}
                                >
                                  <CollapsibleTrigger asChild>
                                    <div className="flex items-center justify-between p-6 bg-white/10 cursor-pointer hover:bg-white/20 transition-all duration-300">
                                      <div className="flex items-center gap-4">
                                        <div className="p-2 bg-white/20 rounded-xl">
                                          <Car className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                          <h4 className="font-bold text-lg text-white">{category.nameAr}</h4>
                                          {category.nameEn && (
                                            <p className="text-sm text-white/60">({category.nameEn})</p>
                                          )}
                                        </div>
                                        <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                                          {category.trimLevels.length} درجة تجهيز
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {/* Add Trim Level Button */}
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="glass-button bg-purple-600/20 hover:bg-purple-600/30"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setContextCategoryId(category.id);
                                            setSelectedCategoryId(category.id);
                                            setIsAddTrimLevelToCategoryOpen(true);
                                          }}
                                          data-testid={`add-trim-level-${category.id}`}
                                          title="إضافة درجة تجهيز"
                                        >
                                          <Plus className="w-4 h-4 text-purple-300" />
                                          <Settings className="w-4 h-4 text-purple-300 mr-1" />
                                        </Button>
                                        
                                        {/* Add Color to Category Button */}
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="glass-button bg-pink-600/20 hover:bg-pink-600/30"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setContextCategoryId(category.id);
                                            setIsAddColorToCategoryOpen(true);
                                          }}
                                          data-testid={`add-color-category-${category.id}`}
                                          title="إضافة لون للفئة"
                                        >
                                          <Plus className="w-4 h-4 text-pink-300" />
                                          <Palette className="w-4 h-4 text-pink-300 mr-1" />
                                        </Button>
                                        
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className={`glass-button ${category.isActive !== false ? 'bg-green-600/20' : 'bg-red-600/20'}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleCategoryMutation.mutate({ 
                                              id: category.id, 
                                              isActive: category.isActive === false 
                                            });
                                          }}
                                          data-testid={`toggle-category-${category.id}`}
                                        >
                                          {category.isActive !== false ? (
                                            <Eye className="w-4 h-4 text-green-300" />
                                          ) : (
                                            <EyeOff className="w-4 h-4 text-red-300" />
                                          )}
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="glass-button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingCategory(category);
                                            setIsEditCategoryOpen(true);
                                          }}
                                          data-testid={`edit-category-${category.id}`}
                                          title="تحرير الفئة"
                                        >
                                          <Edit className="w-4 h-4 text-white" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="glass-button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm(`هل أنت متأكد من حذف الفئة "${category.nameAr}"؟`)) {
                                              deleteCategoryMutation.mutate({ id: category.id });
                                            }
                                          }}
                                          data-testid={`delete-category-${category.id}`}
                                          title="حذف الفئة"
                                        >
                                          <Trash2 className="w-4 h-4 text-white" />
                                        </Button>
                                        {expandedItems.has(`category-${category.id}`) ? (
                                          <ChevronDown className="w-5 h-5 text-white" />
                                        ) : (
                                          <ChevronRight className="w-5 h-5 text-white" />
                                        )}
                                      </div>
                                    </div>
                                  </CollapsibleTrigger>
                                  
                                  <CollapsibleContent>
                                    <div className="p-6 bg-white/5">
                                      {category.trimLevels && category.trimLevels.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                                          {category.trimLevels.map((trimLevel) => (
                                            <div key={trimLevel.id} className="bg-white/10 rounded-xl border border-white/20 p-4 hover:bg-white/15 transition-all duration-300 group">
                                              <div className="flex flex-col items-center text-center space-y-3">
                                                <div className="p-3 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
                                                  <Settings className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="flex-1 min-h-[3rem] flex flex-col justify-center">
                                                  <p className="font-bold text-white text-sm leading-tight">{trimLevel.nameAr}</p>
                                                  {trimLevel.nameEn && (
                                                    <p className="text-xs text-white/60 mt-1">({trimLevel.nameEn})</p>
                                                  )}
                                                </div>
                                                <div className="flex items-center justify-center gap-1 w-full pt-2 border-t border-white/20">
                                                  {/* Add Color to Trim Level Button */}
                                                  <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="glass-button h-8 w-8 p-0 bg-yellow-600/20 hover:bg-yellow-600/30"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setContextTrimLevelId(trimLevel.id);
                                                      setIsAddColorToTrimLevelOpen(true);
                                                    }}
                                                    data-testid={`add-color-trim-${trimLevel.id}`}
                                                    title="إضافة لون لدرجة التجهيز"
                                                  >
                                                    <Plus className="w-3 h-3 text-yellow-300" />
                                                  </Button>
                                                  
                                                  <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className={`glass-button h-8 w-8 p-0 ${trimLevel.isActive !== false ? 'bg-green-600/30 hover:bg-green-600/40' : 'bg-red-600/30 hover:bg-red-600/40'}`}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      toggleTrimLevelMutation.mutate({ 
                                                        id: trimLevel.id, 
                                                        isActive: trimLevel.isActive === false 
                                                      });
                                                    }}
                                                    data-testid={`toggle-trim-${trimLevel.id}`}
                                                    title={trimLevel.isActive !== false ? 'إخفاء' : 'إظهار'}
                                                  >
                                                    {trimLevel.isActive !== false ? (
                                                      <Eye className="w-3 h-3 text-green-300" />
                                                    ) : (
                                                      <EyeOff className="w-3 h-3 text-red-300" />
                                                    )}
                                                  </Button>
                                                  <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="glass-button h-8 w-8 p-0 hover:bg-blue-600/30"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setEditingTrimLevel(trimLevel);
                                                      setIsEditTrimLevelOpen(true);
                                                    }}
                                                    data-testid={`edit-trim-${trimLevel.id}`}
                                                    title="تحرير درجة التجهيز"
                                                  >
                                                    <Edit className="w-3 h-3 text-white" />
                                                  </Button>
                                                  <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="glass-button h-8 w-8 p-0 hover:bg-red-600/30"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      if (window.confirm(`هل أنت متأكد من حذف درجة التجهيز "${trimLevel.nameAr}"؟`)) {
                                                        deleteTrimLevelMutation.mutate(trimLevel.id);
                                                      }
                                                    }}
                                                    data-testid={`delete-trim-${trimLevel.id}`}
                                                    title="حذف درجة التجهيز"
                                                  >
                                                    <Trash2 className="w-3 h-3 text-white" />
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-center py-8">
                                          <Settings className="w-16 h-16 text-white/40 mx-auto mb-4" />
                                          <p className="text-white/60">لا توجد درجات تجهيز لهذه الفئة</p>
                                        </div>
                                      )}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <Car className="w-16 h-16 text-white/40 mx-auto mb-4" />
                            <p className="text-white/60 text-lg">لا توجد فئات لهذه الشركة المصنعة</p>
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )) : (
                <Card className="glass-container text-center py-16 rounded-2xl">
                  <CardContent>
                    <Building2 className="w-24 h-24 text-white/40 mx-auto mb-6" />
                    <h3 className="text-2xl font-semibold text-white mb-4">
                      {hierarchyData && hierarchyData.length > 0 
                        ? "لا توجد بيانات تطابق البحث" 
                        : "لا توجد بيانات للعرض"
                      }
                    </h3>
                    <p className="text-white/60 text-lg">
                      {hierarchyData && hierarchyData.length > 0 
                        ? "جرب تغيير معايير البحث أو الفلتر" 
                        : "ابدأ بإضافة شركة مصنعة جديدة لتظهر هنا"
                      }
                    </p>
                    <div className="mt-4 p-4 bg-yellow-500/20 rounded-lg">
                      <p className="text-sm text-yellow-200">
                        البيانات المتاحة: {hierarchyData?.length || 0} شركة
                      </p>
                      <p className="text-sm text-yellow-200">
                        البيانات المفلترة: {filteredData?.length || 0} شركة
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Logo Upload Dialog */}
        <Dialog open={isLogoUploadOpen} onOpenChange={setIsLogoUploadOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-center text-blue-600 flex items-center justify-center gap-3">
                <Image className="w-8 h-8" />
                رفع شعار الصانع
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 p-2">
              <div>
                <Label className="text-lg">الصانع المحدد</Label>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <span className="text-blue-800 font-medium">
                    {hierarchyData.find(m => m.id === selectedManufacturerForLogo)?.nameAr || "غير محدد"}
                  </span>
                </div>
              </div>
              
              {selectedManufacturerForLogo && (
                <div>
                  <Label className="text-lg mb-3 block">الشعار الحالي</Label>
                  <div className="flex items-center justify-center p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <ManufacturerLogo 
                      manufacturerName={hierarchyData.find(m => m.id === selectedManufacturerForLogo)?.nameAr || ""}
                      customLogo={hierarchyData.find(m => m.id === selectedManufacturerForLogo)?.logo}
                      size="lg"
                      className="w-16 h-16"
                      showFallback={true}
                    />
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="logo-upload" className="text-lg">اختيار ملف الشعار الجديد</Label>
                <div className="mt-2">
                  <input
                    id="logo-upload"
                    type="file"
                    accept=".svg,.png,.jpg,.jpeg"
                    onChange={handleLogoUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    data-testid="input-logo-upload"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    الصيغ المدعومة: SVG, PNG, JPG (أقصى حجم: 2 ميجابايت)
                  </p>
                </div>
              </div>
              
              {uploadLogoMutation.isPending && (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="mr-3 text-blue-600">جاري رفع الشعار...</span>
                </div>
              )}
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsLogoUploadOpen(false)}
                  className="flex-1 h-12 rounded-xl"
                  disabled={uploadLogoMutation.isPending}
                  data-testid="button-cancel-logo-upload"
                >
                  <X className="w-5 h-5 ml-2" />
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Manufacturer Dialog */}
        <Dialog open={isEditManufacturerOpen} onOpenChange={setIsEditManufacturerOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-center text-blue-600 flex items-center justify-center gap-3">
                <Edit className="w-8 h-8" />
                تحرير الصانع
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 p-2">
              <div>
                <Label htmlFor="editManufacturerNameAr" className="text-lg">الاسم بالعربي</Label>
                <Input
                  id="editManufacturerNameAr"
                  value={editingManufacturer?.nameAr || ""}
                  onChange={(e) => setEditingManufacturer(prev => prev ? {...prev, nameAr: e.target.value} : null)}
                  className="text-lg h-12 rounded-xl"
                  dir="rtl"
                  data-testid="input-edit-manufacturer-name-ar"
                />
              </div>
              
              <div>
                <Label htmlFor="editManufacturerNameEn" className="text-lg">الاسم بالإنجليزي (اختياري)</Label>
                <Input
                  id="editManufacturerNameEn"
                  value={editingManufacturer?.nameEn || ""}
                  onChange={(e) => setEditingManufacturer(prev => prev ? {...prev, nameEn: e.target.value} : null)}
                  className="text-lg h-12 rounded-xl"
                  placeholder="Manufacturer Name (Optional)"
                  data-testid="input-edit-manufacturer-name-en"
                />
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditManufacturerOpen(false);
                    setEditingManufacturer(null);
                  }}
                  className="flex-1 h-12 rounded-xl"
                  data-testid="button-cancel-edit-manufacturer"
                >
                  <X className="w-5 h-5 ml-2" />
                  إلغاء
                </Button>
                <Button 
                  onClick={() => {
                    if (editingManufacturer) {
                      editManufacturerMutation.mutate({
                        id: editingManufacturer.id,
                        nameAr: editingManufacturer.nameAr,
                        nameEn: editingManufacturer.nameEn || ""
                      });
                    }
                  }}
                  disabled={!editingManufacturer?.nameAr || editManufacturerMutation.isPending}
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                  data-testid="button-submit-edit-manufacturer"
                >
                  <Save className="w-5 h-5 ml-2" />
                  {editManufacturerMutation.isPending ? "جاري التحديث..." : "تحديث"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-center text-blue-600 flex items-center justify-center gap-3">
                <Edit className="w-8 h-8" />
                تحرير الفئة
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 p-2">
              <div>
                <Label htmlFor="editCategoryNameAr" className="text-lg">الاسم بالعربي</Label>
                <Input
                  id="editCategoryNameAr"
                  value={editingCategory?.nameAr || ""}
                  onChange={(e) => setEditingCategory(prev => prev ? {...prev, nameAr: e.target.value} : null)}
                  className="text-lg h-12 rounded-xl"
                  dir="rtl"
                  data-testid="input-edit-category-name-ar"
                />
              </div>
              
              <div>
                <Label htmlFor="editCategoryNameEn" className="text-lg">الاسم بالإنجليزي (اختياري)</Label>
                <Input
                  id="editCategoryNameEn"
                  value={editingCategory?.nameEn || ""}
                  onChange={(e) => setEditingCategory(prev => prev ? {...prev, nameEn: e.target.value} : null)}
                  className="text-lg h-12 rounded-xl"
                  placeholder="Category Name (Optional)"
                  data-testid="input-edit-category-name-en"
                />
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditCategoryOpen(false);
                    setEditingCategory(null);
                  }}
                  className="flex-1 h-12 rounded-xl"
                  data-testid="button-cancel-edit-category"
                >
                  <X className="w-5 h-5 ml-2" />
                  إلغاء
                </Button>
                <Button 
                  onClick={() => {
                    if (editingCategory) {
                        editCategoryMutation.mutate({
                          id: Number(editingCategory.id),
                          nameAr: editingCategory.nameAr,
                          nameEn: editingCategory.nameEn || "",
                          manufacturerId: Number(editingCategory.manufacturerId)
                        });
                    }
                  }}
                  disabled={!editingCategory?.nameAr || editCategoryMutation.isPending}
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                  data-testid="button-submit-edit-category"
                >
                  <Save className="w-5 h-5 ml-2" />
                  {editCategoryMutation.isPending ? "جاري التحديث..." : "تحديث"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Trim Level Dialog */}
        <Dialog open={isEditTrimLevelOpen} onOpenChange={setIsEditTrimLevelOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-center text-blue-600 flex items-center justify-center gap-3">
                <Edit className="w-8 h-8" />
                تحرير درجة التجهيز
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 p-2">
              <div>
                <Label htmlFor="editTrimLevelNameAr" className="text-lg">الاسم بالعربي</Label>
                <Input
                  id="editTrimLevelNameAr"
                  value={editingTrimLevel?.nameAr || ""}
                  onChange={(e) => setEditingTrimLevel(prev => prev ? {...prev, nameAr: e.target.value} : null)}
                  className="text-lg h-12 rounded-xl"
                  dir="rtl"
                  data-testid="input-edit-trim-level-name-ar"
                />
              </div>
              
              <div>
                <Label htmlFor="editTrimLevelNameEn" className="text-lg">الاسم بالإنجليزي (اختياري)</Label>
                <Input
                  id="editTrimLevelNameEn"
                  value={editingTrimLevel?.nameEn || ""}
                  onChange={(e) => setEditingTrimLevel(prev => prev ? {...prev, nameEn: e.target.value} : null)}
                  className="text-lg h-12 rounded-xl"
                  placeholder="Trim Level Name (Optional)"
                  data-testid="input-edit-trim-level-name-en"
                />
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditTrimLevelOpen(false);
                    setEditingTrimLevel(null);
                  }}
                  className="flex-1 h-12 rounded-xl"
                  data-testid="button-cancel-edit-trim-level"
                >
                  <X className="w-5 h-5 ml-2" />
                  إلغاء
                </Button>
                <Button 
                  onClick={() => {
                    if (editingTrimLevel) {
                        editTrimLevelMutation.mutate({
                          id: Number(editingTrimLevel.id),
                          nameAr: editingTrimLevel.nameAr,
                          nameEn: editingTrimLevel.nameEn || "",
                          categoryId: Number(editingTrimLevel.categoryId)
                        });
                    }
                  }}
                  disabled={!editingTrimLevel?.nameAr || editTrimLevelMutation.isPending}
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                  data-testid="button-submit-edit-trim-level"
                >
                  <Save className="w-5 h-5 ml-2" />
                  {editTrimLevelMutation.isPending ? "جاري التحديث..." : "تحديث"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        </main>
      </div>
    </SystemGlassWrapper>
  );
}