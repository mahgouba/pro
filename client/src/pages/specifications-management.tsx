import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Search, Car, Image, Settings, FileText, Link, Palette } from "lucide-react";
import SystemGlassWrapper from "@/components/system-glass-wrapper";
import type { VehicleSpecification, InsertVehicleSpecification, VehicleImageLink, InsertVehicleImageLink } from "@shared/schema";

// Schemas for form validation
const specificationFormSchema = z.object({
  manufacturer: z.string().optional(),
  category: z.string().optional(),
  trimLevel: z.string().optional(),
  year: z.number().optional(),
  engineCapacity: z.string().optional(),
  chassisNumber: z.string().optional(),
  specifications: z.string().min(1, "المواصفات مطلوبة"),
  specificationsEn: z.string().optional(),
});

const imageLinkFormSchema = z.object({
  manufacturer: z.string().optional(),
  category: z.string().optional(),
  trimLevel: z.string().optional(),
  year: z.number().optional(),
  engineCapacity: z.string().optional(),
  exteriorColor: z.string().optional(),
  interiorColor: z.string().optional(),
  chassisNumber: z.string().optional(),
  imageUrl: z.string().url("رابط الصورة غير صحيح"),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
});

type SpecificationFormData = z.infer<typeof specificationFormSchema>;
type ImageLinkFormData = z.infer<typeof imageLinkFormSchema>;

// Database-driven options (will be replaced with API calls)

export default function SpecificationsManagement() {
  const [activeTab, setActiveTab] = useState("specifications");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSpecDialogOpen, setIsSpecDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState<VehicleSpecification | null>(null);
  const [editingImage, setEditingImage] = useState<VehicleImageLink | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch specifications
  const { data: specifications = [], isLoading: specsLoading } = useQuery({
    queryKey: ['/api/vehicle-specifications'],
  });

  // Fetch image links
  const { data: imageLinks = [], isLoading: imagesLoading } = useQuery({
    queryKey: ['/api/vehicle-image-links'],
  });

  // Fetch hierarchy data from database
  const { data: manufacturers = [] } = useQuery<any[]>({
    queryKey: ["/api/hierarchical/manufacturers"],
  });

  const { data: vehicleYears = [] } = useQuery<number[]>({
    queryKey: ["/api/vehicle-years"],
  });

  const { data: engineCapacities = [] } = useQuery<string[]>({
    queryKey: ["/api/engine-capacities"],
  });

  const { data: colors = [] } = useQuery<any[]>({
    queryKey: ["/api/vehicle-colors"],
  });

  // Fetch inventory items for chassis numbers
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['/api/inventory'],
  });

  // Forms
  const specForm = useForm<SpecificationFormData>({
    resolver: zodResolver(specificationFormSchema),
    defaultValues: {
      manufacturer: "",
      category: "",
      trimLevel: "",
      year: undefined,
      engineCapacity: "",
      chassisNumber: "",
      specifications: "",
      specificationsEn: "",
    },
  });

  // Watch manufacturer/category for spec form cascading dropdowns
  const specWatchedManufacturer = specForm.watch("manufacturer");
  const specWatchedCategory = specForm.watch("category");

  const { data: specCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/hierarchical/categories", specWatchedManufacturer],
    queryFn: async () => {
      if (!specWatchedManufacturer) return [];
      const res = await fetch(`/api/hierarchical/categories?manufacturer=${encodeURIComponent(specWatchedManufacturer)}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!specWatchedManufacturer,
  });

  const { data: specTrimLevels = [] } = useQuery<any[]>({
    queryKey: ["/api/hierarchical/trimLevels", specWatchedManufacturer, specWatchedCategory],
    queryFn: async () => {
      if (!specWatchedManufacturer || !specWatchedCategory) return [];
      const res = await fetch(`/api/hierarchical/trimLevels?manufacturer=${encodeURIComponent(specWatchedManufacturer)}&category=${encodeURIComponent(specWatchedCategory)}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!specWatchedManufacturer && !!specWatchedCategory,
  });

  // Watch chassis number to auto-fill vehicle data
  const watchedChassisNumber = specForm.watch("chassisNumber");
  useEffect(() => {
    if (watchedChassisNumber && watchedChassisNumber.length > 3) {
      const matchedVehicle = (inventoryItems as any[]).find(
        (item: any) => item.chassisNumber === watchedChassisNumber
      );
      if (matchedVehicle) {
        specForm.setValue("manufacturer", matchedVehicle.manufacturer || "");
        specForm.setValue("category", matchedVehicle.category || "");
        specForm.setValue("trimLevel", matchedVehicle.trimLevel || "");
        specForm.setValue("year", matchedVehicle.year || undefined);
        specForm.setValue("engineCapacity", matchedVehicle.engineCapacity || "");
      }
    }
  }, [watchedChassisNumber, inventoryItems, specForm]);

  const imageForm = useForm<ImageLinkFormData>({
    resolver: zodResolver(imageLinkFormSchema),
    defaultValues: {
      manufacturer: "",
      category: "",
      trimLevel: "",
      year: undefined,
      engineCapacity: "",
      exteriorColor: "",
      interiorColor: "",
      chassisNumber: "",
      imageUrl: "",
      description: "",
      descriptionEn: "",
    },
  });

  // Watch manufacturer/category for image form cascading dropdowns
  const imageWatchedManufacturer = imageForm.watch("manufacturer");
  const imageWatchedCategory = imageForm.watch("category");

  const { data: imageCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/hierarchical/categories", imageWatchedManufacturer],
    queryFn: async () => {
      if (!imageWatchedManufacturer) return [];
      const res = await fetch(`/api/hierarchical/categories?manufacturer=${encodeURIComponent(imageWatchedManufacturer)}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!imageWatchedManufacturer,
  });

  const { data: imageTrimLevels = [] } = useQuery<any[]>({
    queryKey: ["/api/hierarchical/trimLevels", imageWatchedManufacturer, imageWatchedCategory],
    queryFn: async () => {
      if (!imageWatchedManufacturer || !imageWatchedCategory) return [];
      const res = await fetch(`/api/hierarchical/trimLevels?manufacturer=${encodeURIComponent(imageWatchedManufacturer)}&category=${encodeURIComponent(imageWatchedCategory)}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!imageWatchedManufacturer && !!imageWatchedCategory,
  });

  // Watch chassis number for image form to auto-fill vehicle data
  const watchedImageChassisNumber = imageForm.watch("chassisNumber");
  useEffect(() => {
    if (watchedImageChassisNumber && watchedImageChassisNumber.length > 3) {
      const matchedVehicle = (inventoryItems as any[]).find(
        (item: any) => item.chassisNumber === watchedImageChassisNumber
      );
      if (matchedVehicle) {
        imageForm.setValue("manufacturer", matchedVehicle.manufacturer || "");
        imageForm.setValue("category", matchedVehicle.category || "");
        imageForm.setValue("trimLevel", matchedVehicle.trimLevel || "");
        imageForm.setValue("year", matchedVehicle.year || undefined);
        imageForm.setValue("engineCapacity", matchedVehicle.engineCapacity || "");
        imageForm.setValue("exteriorColor", matchedVehicle.exteriorColor || "");
        imageForm.setValue("interiorColor", matchedVehicle.interiorColor || "");
      }
    }
  }, [watchedImageChassisNumber, inventoryItems, imageForm]);

  // Create/Update specification mutation
  const specMutation = useMutation({
    mutationFn: async (data: SpecificationFormData) => {
      const url = editingSpec ? `/api/vehicle-specifications/${editingSpec.id}` : '/api/vehicle-specifications';
      const method = editingSpec ? 'PUT' : 'POST';
      return apiRequest(method, url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-specifications'] });
      setIsSpecDialogOpen(false);
      setEditingSpec(null);
      specForm.reset();
      toast({
        title: "تم بنجاح",
        description: editingSpec ? "تم تحديث المواصفات" : "تم إضافة المواصفات",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ المواصفات",
        variant: "destructive",
      });
    },
  });

  // Create/Update image link mutation
  const imageMutation = useMutation({
    mutationFn: async (data: ImageLinkFormData) => {
      const url = editingImage ? `/api/vehicle-image-links/${editingImage.id}` : '/api/vehicle-image-links';
      const method = editingImage ? 'PUT' : 'POST';
      return apiRequest(method, url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-image-links'] });
      setIsImageDialogOpen(false);
      setEditingImage(null);
      imageForm.reset();
      toast({
        title: "تم بنجاح",
        description: editingImage ? "تم تحديث رابط الصورة" : "تم إضافة رابط الصورة",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ رابط الصورة",
        variant: "destructive",
      });
    },
  });

  // Delete specification mutation
  const deleteSpecMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/vehicle-specifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-specifications'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف المواصفات بنجاح",
      });
    },
  });

  // Delete image link mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/vehicle-image-links/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-image-links'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف رابط الصورة بنجاح",
      });
    },
  });

  const onSubmitSpec = (data: SpecificationFormData) => {
    specMutation.mutate(data);
  };

  const onSubmitImage = (data: ImageLinkFormData) => {
    imageMutation.mutate(data);
  };

  const handleEditSpec = (spec: VehicleSpecification) => {
    setEditingSpec(spec);
    specForm.reset({
      manufacturer: spec.manufacturer || "",
      category: spec.category || "",
      trimLevel: spec.trimLevel || "",
      year: spec.year || undefined,
      engineCapacity: spec.engineCapacity || "",
      chassisNumber: spec.chassisNumber || "",
      specifications: spec.specifications || "",
      specificationsEn: spec.specificationsEn || "",
    });
    setIsSpecDialogOpen(true);
  };

  const handleEditImage = (image: VehicleImageLink) => {
    setEditingImage(image);
    imageForm.reset({
      manufacturer: image.manufacturer || "",
      category: image.category || "",
      trimLevel: image.trimLevel || "",
      year: image.year || undefined,
      engineCapacity: "",
      exteriorColor: image.exteriorColor || "",
      interiorColor: image.interiorColor || "",
      chassisNumber: image.chassisNumber || "",
      imageUrl: image.imageUrl || "",
      description: image.description || "",
      descriptionEn: image.descriptionEn || "",
    });
    setIsImageDialogOpen(true);
  };

  const filteredSpecs = (specifications as VehicleSpecification[]).filter((spec: VehicleSpecification) =>
    !searchTerm ||
    spec.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spec.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spec.trimLevel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spec.chassisNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredImages = (imageLinks as VehicleImageLink[]).filter((image: VehicleImageLink) =>
    !searchTerm ||
    image.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    image.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    image.trimLevel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    image.chassisNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (specsLoading || imagesLoading) {
    return (
      <SystemGlassWrapper>
        <div className="container mx-auto p-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
            <p className="mt-2 text-white/70 drop-shadow-sm">جاري تحميل البيانات...</p>
          </div>
        </div>
      </SystemGlassWrapper>
    );
  }

  return (
    <SystemGlassWrapper>
      <div className="container mx-auto p-4" dir="rtl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white drop-shadow-lg mb-2">
            إدارة المواصفات والصور
          </h1>
          <p className="text-white/70 drop-shadow-sm">
            إدارة مواصفات المركبات وروابط الصور التفصيلية
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="البحث في المواصفات والصور..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 text-right"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="glass-container p-4 text-center">
            <div className="text-2xl font-bold text-blue-400 drop-shadow-lg">{filteredSpecs.length}</div>
            <div className="text-sm text-white/70 drop-shadow-sm">مواصفات المركبات</div>
          </div>
          <div className="glass-container p-4 text-center">
            <div className="text-2xl font-bold text-green-400 drop-shadow-lg">{filteredImages.length}</div>
            <div className="text-sm text-white/70 drop-shadow-sm">روابط الصور</div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 glass-container p-1">
            <TabsTrigger 
              value="specifications" 
              className="data-[state=active]:bg-blue-500/80 data-[state=active]:text-white data-[state=active]:shadow-lg text-white/70"
            >
              <FileText className="w-4 h-4 ml-2" />
              مواصفات المركبات
            </TabsTrigger>
            <TabsTrigger 
              value="images" 
              className="data-[state=active]:bg-blue-500/80 data-[state=active]:text-white data-[state=active]:shadow-lg text-white/70"
            >
              <Image className="w-4 h-4 ml-2" />
              روابط الصور
            </TabsTrigger>
          </TabsList>

          {/* Specifications Tab */}
          <TabsContent value="specifications" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white drop-shadow-lg">مواصفات المركبات</h2>
              <Dialog open={isSpecDialogOpen} onOpenChange={setIsSpecDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-green-500/80 hover:bg-green-500 text-white border-green-400/30 shadow-lg"
                    onClick={() => {
                      setEditingSpec(null);
                      specForm.reset();
                    }}
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة مواصفات جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl glass-container">
                  <DialogHeader>
                    <DialogTitle className="text-white drop-shadow-lg">
                      {editingSpec ? "تعديل المواصفات" : "إضافة مواصفات جديدة"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...specForm}>
                    <form onSubmit={specForm.handleSubmit(onSubmitSpec)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={specForm.control}
                          name="manufacturer"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white drop-shadow-sm">الشركة المصنعة</FormLabel>
                              <Select onValueChange={(val) => { field.onChange(val); specForm.setValue("category", ""); specForm.setValue("trimLevel", ""); }} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                    <SelectValue placeholder="اختر الشركة المصنعة" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {manufacturers.map((manufacturer) => (
                                    <SelectItem key={manufacturer.id} value={manufacturer.nameAr}>
                                      {manufacturer.nameAr}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={specForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white drop-shadow-sm">الفئة</FormLabel>
                              <Select onValueChange={(val) => { field.onChange(val); specForm.setValue("trimLevel", ""); }} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                    <SelectValue placeholder="اختر الفئة" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {specCategories.length === 0 && !specWatchedManufacturer ? (
                                    <SelectItem value="_hint" disabled>اختر الشركة المصنعة أولاً</SelectItem>
                                  ) : specCategories.length === 0 ? (
                                    <SelectItem value="_empty" disabled>لا توجد فئات</SelectItem>
                                  ) : specCategories.map((category: any) => (
                                    <SelectItem key={category.id} value={category.nameAr}>
                                      {category.nameAr}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={specForm.control}
                          name="trimLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white drop-shadow-sm">درجة التجهيز</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                    <SelectValue placeholder="اختر درجة التجهيز" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {specTrimLevels.length === 0 && !specWatchedCategory ? (
                                    <SelectItem value="_hint" disabled>اختر الفئة أولاً</SelectItem>
                                  ) : specTrimLevels.length === 0 ? (
                                    <SelectItem value="_empty" disabled>لا توجد درجات تجهيز</SelectItem>
                                  ) : specTrimLevels.map((trim: any) => (
                                    <SelectItem key={trim.id} value={trim.nameAr}>
                                      {trim.nameAr}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={specForm.control}
                          name="year"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white drop-shadow-sm">السنة</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                    <SelectValue placeholder="اختر السنة" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {vehicleYears.map((year) => (
                                    <SelectItem key={year} value={year.toString()}>
                                      {year}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={specForm.control}
                          name="engineCapacity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white drop-shadow-sm">سعة المحرك</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                    <SelectValue placeholder="اختر سعة المحرك" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {engineCapacities.map((capacity) => (
                                    <SelectItem key={capacity} value={capacity}>
                                      {capacity}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={specForm.control}
                          name="chassisNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white drop-shadow-sm">رقم الهيكل (سيتم ملء البيانات تلقائياً)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="أدخل رقم الهيكل..."
                                  {...field}
                                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                />
                              </FormControl>
                              <FormMessage />
                              {watchedChassisNumber && watchedChassisNumber.length > 3 && (
                                <div className="text-xs text-green-400 drop-shadow-sm">
                                  {(inventoryItems as any[]).find((item: any) => item.chassisNumber === watchedChassisNumber) 
                                    ? "✓ تم العثور على المركبة وملء البيانات تلقائياً" 
                                    : "⚠ لم يتم العثور على مركبة بهذا الرقم"}
                                </div>
                              )}
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={specForm.control}
                        name="specifications"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white drop-shadow-sm">المواصفات (عربي)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="اكتب المواصفات التفصيلية..."
                                className="h-32 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={specForm.control}
                        name="specificationsEn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white drop-shadow-sm">المواصفات (إنجليزي)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter detailed specifications..."
                                className="h-32 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2 pt-4">
                        <Button
                          type="submit"
                          disabled={specMutation.isPending}
                          className="bg-green-500/80 hover:bg-green-500 text-white border-green-400/30"
                        >
                          {specMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsSpecDialogOpen(false)}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          إلغاء
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Specifications List */}
            {filteredSpecs.length === 0 ? (
              <div className="glass-container text-center py-8">
                <FileText className="w-12 h-12 text-white/40 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white drop-shadow-lg mb-2">
                  لا توجد مواصفات
                </h3>
                <p className="text-white/70 drop-shadow-sm">
                  لم يتم إضافة أي مواصفات بعد
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSpecs.map((spec: VehicleSpecification) => (
                  <div key={spec.id} className="glass-container">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-white drop-shadow-lg">
                          {spec.manufacturer} {spec.category}
                        </h3>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditSpec(spec)}
                            className="text-blue-400 hover:bg-blue-500/20 p-1 h-8 w-8"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteSpecMutation.mutate(spec.id)}
                            className="text-red-400 hover:bg-red-500/20 p-1 h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {spec.trimLevel && (
                          <div className="text-white/80 drop-shadow-sm">درجة التجهيز: {spec.trimLevel}</div>
                        )}
                        {spec.year && (
                          <div className="text-white/80 drop-shadow-sm">السنة: {spec.year}</div>
                        )}
                        {spec.engineCapacity && (
                          <div className="text-white/80 drop-shadow-sm">سعة المحرك: {spec.engineCapacity}</div>
                        )}
                        {spec.chassisNumber && (
                          <div className="text-white/80 drop-shadow-sm">رقم الهيكل: {spec.chassisNumber}</div>
                        )}
                      </div>
                      
                      <div className="mt-3 p-2 bg-white/5 rounded border border-white/10">
                        <div className="text-xs text-white/90 drop-shadow-sm line-clamp-3">
                          {spec.specifications}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white drop-shadow-lg">روابط الصور</h2>
              <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-green-500/80 hover:bg-green-500 text-white border-green-400/30 shadow-lg"
                    onClick={() => {
                      setEditingImage(null);
                      imageForm.reset();
                    }}
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة رابط صورة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl glass-container">
                  <DialogHeader>
                    <DialogTitle className="text-white drop-shadow-lg">
                      {editingImage ? "تعديل رابط الصورة" : "إضافة رابط صورة جديد"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...imageForm}>
                    <form onSubmit={imageForm.handleSubmit(onSubmitImage)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={imageForm.control}
                          name="manufacturer"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white drop-shadow-sm">الشركة المصنعة</FormLabel>
                              <Select onValueChange={(val) => { field.onChange(val); imageForm.setValue("category", ""); imageForm.setValue("trimLevel", ""); }} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                    <SelectValue placeholder="اختر الشركة المصنعة" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {manufacturers.map((manufacturer) => (
                                    <SelectItem key={manufacturer.id} value={manufacturer.nameAr}>
                                      {manufacturer.nameAr}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={imageForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white drop-shadow-sm">الفئة</FormLabel>
                              <Select onValueChange={(val) => { field.onChange(val); imageForm.setValue("trimLevel", ""); }} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                    <SelectValue placeholder="اختر الفئة" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {imageCategories.length === 0 && !imageWatchedManufacturer ? (
                                    <SelectItem value="_hint" disabled>اختر الشركة المصنعة أولاً</SelectItem>
                                  ) : imageCategories.length === 0 ? (
                                    <SelectItem value="_empty" disabled>لا توجد فئات</SelectItem>
                                  ) : imageCategories.map((category: any) => (
                                    <SelectItem key={category.id} value={category.nameAr}>
                                      {category.nameAr}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={imageForm.control}
                          name="trimLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white drop-shadow-sm">درجة التجهيز</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                    <SelectValue placeholder="اختر درجة التجهيز" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {imageTrimLevels.length === 0 && !imageWatchedCategory ? (
                                    <SelectItem value="_hint" disabled>اختر الفئة أولاً</SelectItem>
                                  ) : imageTrimLevels.length === 0 ? (
                                    <SelectItem value="_empty" disabled>لا توجد درجات تجهيز</SelectItem>
                                  ) : imageTrimLevels.map((trim: any) => (
                                    <SelectItem key={trim.id} value={trim.nameAr}>
                                      {trim.nameAr}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={imageForm.control}
                          name="year"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white drop-shadow-sm">السنة</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                    <SelectValue placeholder="اختر السنة" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {vehicleYears.map((year) => (
                                    <SelectItem key={year} value={year.toString()}>
                                      {year}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={imageForm.control}
                          name="exteriorColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white drop-shadow-sm">اللون الخارجي</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                    <SelectValue placeholder="اختر اللون الخارجي" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {colors.filter((color: any) => color.colorType === 'exterior').map((color: any) => (
                                    <SelectItem key={color.id} value={color.name}>
                                      {color.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={imageForm.control}
                          name="interiorColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white drop-shadow-sm">اللون الداخلي</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                    <SelectValue placeholder="اختر اللون الداخلي" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {colors.filter((color: any) => color.colorType === 'interior').map((color: any) => (
                                    <SelectItem key={color.id} value={color.name}>
                                      {color.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={imageForm.control}
                        name="chassisNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white drop-shadow-sm">رقم الهيكل (سيتم ملء البيانات تلقائياً)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="أدخل رقم الهيكل..."
                                {...field}
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                              />
                            </FormControl>
                            <FormMessage />
                            {watchedImageChassisNumber && watchedImageChassisNumber.length > 3 && (
                              <div className="text-xs text-green-400 drop-shadow-sm">
                                {(inventoryItems as any[]).find((item: any) => item.chassisNumber === watchedImageChassisNumber) 
                                  ? "✓ تم العثور على المركبة وملء البيانات تلقائياً" 
                                  : "⚠ لم يتم العثور على مركبة بهذا الرقم"}
                              </div>
                            )}
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={imageForm.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white drop-shadow-sm">رابط الصورة</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://example.com/image.jpg"
                                {...field}
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={imageForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white drop-shadow-sm">الوصف (عربي)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="وصف الصورة..."
                                className="h-24 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex gap-2 pt-4">
                        <Button
                          type="submit"
                          disabled={imageMutation.isPending}
                          className="bg-green-500/80 hover:bg-green-500 text-white border-green-400/30"
                        >
                          {imageMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsImageDialogOpen(false)}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          إلغاء
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Images List */}
            {filteredImages.length === 0 ? (
              <div className="glass-container text-center py-8">
                <Image className="w-12 h-12 text-white/40 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white drop-shadow-lg mb-2">
                  لا توجد روابط صور
                </h3>
                <p className="text-white/70 drop-shadow-sm">
                  لم يتم إضافة أي روابط صور بعد
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredImages.map((image: VehicleImageLink) => (
                  <div key={image.id} className="glass-container">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-white drop-shadow-lg">
                          {image.manufacturer} {image.category}
                        </h3>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditImage(image)}
                            className="text-blue-400 hover:bg-blue-500/20 p-1 h-8 w-8"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteImageMutation.mutate(image.id)}
                            className="text-red-400 hover:bg-red-500/20 p-1 h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {image.trimLevel && (
                          <div className="text-white/80 drop-shadow-sm">درجة التجهيز: {image.trimLevel}</div>
                        )}
                        {image.year && (
                          <div className="text-white/80 drop-shadow-sm">السنة: {image.year}</div>
                        )}
                        {image.engineCapacity && (
                          <div className="text-white/80 drop-shadow-sm">سعة المحرك: {image.engineCapacity}</div>
                        )}
                        {image.chassisNumber && (
                          <div className="text-white/80 drop-shadow-sm">رقم الهيكل: {image.chassisNumber}</div>
                        )}
                        {image.exteriorColor && (
                          <div className="text-white/80 drop-shadow-sm">اللون الخارجي: {image.exteriorColor}</div>
                        )}
                        {image.interiorColor && (
                          <div className="text-white/80 drop-shadow-sm">اللون الداخلي: {image.interiorColor}</div>
                        )}
                      </div>
                      
                      {image.imageUrl && (
                        <div className="mt-3">
                          <img 
                            src={image.imageUrl} 
                            alt={image.description || "صورة المركبة"}
                            className="w-full h-32 object-cover rounded border border-white/20"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      {image.description && (
                        <div className="mt-3 p-2 bg-white/5 rounded border border-white/10">
                          <div className="text-xs text-white/90 drop-shadow-sm line-clamp-2">
                            {image.description}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </SystemGlassWrapper>
  );
}