import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SystemGlassWrapper from "@/components/system-glass-wrapper";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  Package,
  Car,
  MapPin,
  Calendar,
  Gauge,
  Palette,
  Building
} from "lucide-react";

// Form schemas
const importTypeSchema = z.object({
  name: z.string().min(1, "اسم نوع الاستيراد مطلوب"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

const vehicleStatusSchema = z.object({
  name: z.string().min(1, "اسم حالة المركبة مطلوب"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

const ownershipTypeSchema = z.object({
  name: z.string().min(1, "اسم نوع الملكية مطلوب"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

const vehicleLocationSchema = z.object({
  name: z.string().min(1, "اسم الموقع مطلوب"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

const vehicleYearSchema = z.object({
  year: z.number().min(1900, "السنة يجب أن تكون أكبر من 1900").max(new Date().getFullYear() + 2, "السنة غير صحيحة"),
  isActive: z.boolean().default(true),
});

const engineCapacitySchema = z.object({
  capacity: z.string().min(1, "سعة المحرك مطلوبة"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

const vehicleColorSchema = z.object({
  name: z.string().min(1, "اسم اللون مطلوب"),
  colorType: z.enum(["exterior", "interior"], { required_error: "نوع اللون مطلوب" }),
  colorCode: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ImportType = z.infer<typeof importTypeSchema> & { id: number };
type VehicleStatus = z.infer<typeof vehicleStatusSchema> & { id: number };
type OwnershipType = z.infer<typeof ownershipTypeSchema> & { id: number };
type VehicleLocation = z.infer<typeof vehicleLocationSchema> & { id: number };
type VehicleYear = z.infer<typeof vehicleYearSchema> & { id: number };
type EngineCapacity = z.infer<typeof engineCapacitySchema> & { id: number };
type VehicleColor = z.infer<typeof vehicleColorSchema> & { id: number };

interface DropdownManagementProps {
  title: string;
  icon: React.ReactNode;
  data: any[];
  isLoading: boolean;
  onAdd: (data: any) => void;
  onUpdate: (id: number, data: any) => void;
  onDelete: (id: number) => void;
  schema: z.ZodSchema;
  fields: {
    key: string;
    label: string;
    type: 'text' | 'number' | 'textarea' | 'select' | 'color';
    options?: { value: string; label: string }[];
  }[];
}

function DropdownManagement({ 
  title, 
  icon, 
  data, 
  isLoading, 
  onAdd, 
  onUpdate, 
  onDelete, 
  schema,
  fields 
}: DropdownManagementProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {},
  });

  const editForm = useForm({
    resolver: zodResolver(schema),
    defaultValues: {},
  });

  const filteredData = data.filter(item => 
    (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.capacity && item.capacity.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.year && item.year.toString().includes(searchQuery))
  );

  const handleAdd = (formData: any) => {
    onAdd(formData);
    form.reset();
    setIsAddOpen(false);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    editForm.reset(item);
  };

  const handleUpdate = (formData: any) => {
    if (editingItem) {
      onUpdate(editingItem.id, formData);
      setEditingItem(null);
      editForm.reset();
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا العنصر؟")) {
      onDelete(id);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-right">
          {icon}
          {title}
        </CardTitle>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة {title} جديد</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAdd)} className="space-y-4">
                {fields.map((field) => (
                  <FormField
                    key={field.key}
                    control={form.control}
                    name={field.key}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel>{field.label}</FormLabel>
                        <FormControl>
                          {field.type === 'textarea' ? (
                            <Textarea {...formField} placeholder={field.label} />
                          ) : field.type === 'select' ? (
                            <Select onValueChange={formField.onChange} value={formField.value}>
                              <SelectTrigger>
                                <SelectValue placeholder={`اختر ${field.label}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options?.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : field.type === 'color' ? (
                            <div className="flex gap-2">
                              <Input 
                                type="color" 
                                {...formField} 
                                className="w-16 h-10 rounded border"
                              />
                              <Input 
                                {...formField} 
                                placeholder="#FFFFFF"
                                className="flex-1"
                              />
                            </div>
                          ) : (
                            <Input 
                              {...formField} 
                              type={field.type}
                              placeholder={field.label}
                              value={formField.value || ''}
                              onChange={(e) => {
                                const value = field.type === 'number' ? Number(e.target.value) : e.target.value;
                                formField.onChange(value);
                              }}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit">
                    <Save className="h-4 w-4 ml-2" />
                    حفظ
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 text-right"
            />
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
          ) : (
            <div className="space-y-2">
              {filteredData.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex-1 text-right">
                    <div className="font-medium">
                      {item.name || item.capacity || item.year}
                    </div>
                    {item.description && (
                      <div className="text-sm text-gray-500">{item.description}</div>
                    )}
                    {item.colorType && (
                      <Badge variant="outline" className="mt-1">
                        {item.colorType === 'exterior' ? 'خارجي' : 'داخلي'}
                      </Badge>
                    )}
                    {item.colorCode && (
                      <div className="flex items-center gap-2 mt-1">
                        <div 
                          className="w-4 h-4 rounded border" 
                          style={{ backgroundColor: item.colorCode }}
                        />
                        <span className="text-xs text-gray-500">{item.colorCode}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? "نشط" : "غير نشط"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(item)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(item.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {filteredData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? "لا توجد نتائج للبحث" : "لا توجد عناصر"}
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Edit Dialog */}
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>تعديل {title}</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
                {fields.map((field) => (
                  <FormField
                    key={field.key}
                    control={editForm.control}
                    name={field.key}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel>{field.label}</FormLabel>
                        <FormControl>
                          {field.type === 'textarea' ? (
                            <Textarea {...formField} placeholder={field.label} />
                          ) : field.type === 'select' ? (
                            <Select onValueChange={formField.onChange} value={formField.value}>
                              <SelectTrigger>
                                <SelectValue placeholder={`اختر ${field.label}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options?.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : field.type === 'color' ? (
                            <div className="flex gap-2">
                              <Input 
                                type="color" 
                                {...formField} 
                                className="w-16 h-10 rounded border"
                              />
                              <Input 
                                {...formField} 
                                placeholder="#FFFFFF"
                                className="flex-1"
                              />
                            </div>
                          ) : (
                            <Input 
                              {...formField} 
                              type={field.type}
                              placeholder={field.label}
                              value={formField.value || ''}
                              onChange={(e) => {
                                const value = field.type === 'number' ? Number(e.target.value) : e.target.value;
                                formField.onChange(value);
                              }}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
                    إلغاء
                  </Button>
                  <Button type="submit">
                    <Save className="h-4 w-4 ml-2" />
                    حفظ التغييرات
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default function BasicDropdownManagement() {
  const queryClient = useQueryClient();

  // Queries for all dropdown types
  const { data: importTypes = [], isLoading: isLoadingImportTypes } = useQuery({
    queryKey: ['/api/import-types'],
  });

  const { data: vehicleStatuses = [], isLoading: isLoadingVehicleStatuses } = useQuery({
    queryKey: ['/api/vehicle-statuses'],
  });

  const { data: ownershipTypes = [], isLoading: isLoadingOwnershipTypes } = useQuery({
    queryKey: ['/api/ownership-types'],
  });

  const { data: vehicleLocations = [], isLoading: isLoadingVehicleLocations } = useQuery({
    queryKey: ['/api/vehicle-locations'],
  });

  const { data: vehicleYears = [], isLoading: isLoadingVehicleYears } = useQuery({
    queryKey: ['/api/vehicle-years-full'],
  });

  const { data: engineCapacities = [], isLoading: isLoadingEngineCapacities } = useQuery({
    queryKey: ['/api/engine-capacities-full'],
  });

  const { data: vehicleColors = [], isLoading: isLoadingVehicleColors } = useQuery({
    queryKey: ['/api/vehicle-colors'],
  });

  // Mutations for import types
  const addImportTypeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/import-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create import type');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/import-types'] });
      toast({ title: "تم إضافة نوع الاستيراد بنجاح" });
    },
  });

  const updateImportTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/import-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update import type');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/import-types'] });
      toast({ title: "تم تحديث نوع الاستيراد بنجاح" });
    },
  });

  const deleteImportTypeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/import-types/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete import type');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/import-types'] });
      toast({ title: "تم حذف نوع الاستيراد بنجاح" });
    },
  });

  // Mutations for vehicle statuses
  const addVehicleStatusMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/vehicle-statuses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-statuses'] });
      toast({ title: "تم إضافة حالة المركبة بنجاح" });
    },
  });

  const updateVehicleStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PUT', `/api/vehicle-statuses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-statuses'] });
      toast({ title: "تم تحديث حالة المركبة بنجاح" });
    },
  });

  const deleteVehicleStatusMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/vehicle-statuses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-statuses'] });
      toast({ title: "تم حذف حالة المركبة بنجاح" });
    },
  });

  // Mutations for ownership types
  const addOwnershipTypeMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/ownership-types', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ownership-types'] });
      toast({ title: "تم إضافة نوع الملكية بنجاح" });
    },
  });

  const updateOwnershipTypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PUT', `/api/ownership-types/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ownership-types'] });
      toast({ title: "تم تحديث نوع الملكية بنجاح" });
    },
  });

  const deleteOwnershipTypeMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/ownership-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ownership-types'] });
      toast({ title: "تم حذف نوع الملكية بنجاح" });
    },
  });

  // Mutations for vehicle locations
  const addVehicleLocationMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/vehicle-locations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-locations'] });
      toast({ title: "تم إضافة الموقع بنجاح" });
    },
  });

  const updateVehicleLocationMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PUT', `/api/vehicle-locations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-locations'] });
      toast({ title: "تم تحديث الموقع بنجاح" });
    },
  });

  const deleteVehicleLocationMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/vehicle-locations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-locations'] });
      toast({ title: "تم حذف الموقع بنجاح" });
    },
  });

  // Mutations for vehicle years
  const addVehicleYearMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/vehicle-years', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-years-full'] });
      toast({ title: "تم إضافة السنة بنجاح" });
    },
  });

  const updateVehicleYearMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PUT', `/api/vehicle-years/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-years-full'] });
      toast({ title: "تم تحديث السنة بنجاح" });
    },
  });

  const deleteVehicleYearMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/vehicle-years/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-years-full'] });
      toast({ title: "تم حذف السنة بنجاح" });
    },
  });

  // Mutations for engine capacities
  const addEngineCapacityMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/engine-capacities', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/engine-capacities-full'] });
      toast({ title: "تم إضافة سعة المحرك بنجاح" });
    },
  });

  const updateEngineCapacityMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PUT', `/api/engine-capacities/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/engine-capacities-full'] });
      toast({ title: "تم تحديث سعة المحرك بنجاح" });
    },
  });

  const deleteEngineCapacityMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/engine-capacities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/engine-capacities-full'] });
      toast({ title: "تم حذف سعة المحرك بنجاح" });
    },
  });

  // Mutations for vehicle colors
  const addVehicleColorMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/vehicle-colors', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-colors'] });
      toast({ title: "تم إضافة اللون بنجاح" });
    },
  });

  const updateVehicleColorMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PUT', `/api/vehicle-colors/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-colors'] });
      toast({ title: "تم تحديث اللون بنجاح" });
    },
  });

  const deleteVehicleColorMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/vehicle-colors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-colors'] });
      toast({ title: "تم حذف اللون بنجاح" });
    },
  });

  // Initialize dropdown data mutation
  const initializeDataMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/initialize-dropdown-data', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to initialize data');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();
      toast({ title: "تم تهيئة البيانات الأساسية بنجاح" });
    },
    onError: () => {
      toast({ 
        title: "فشل في تهيئة البيانات الأساسية", 
        description: "تأكد من الاتصال بقاعدة البيانات"
      });
    },
  });

  const dropdownConfigs = [
    {
      key: 'import-types',
      title: 'أنواع الاستيراد',
      icon: <Package className="h-5 w-5" />,
      data: importTypes,
      isLoading: isLoadingImportTypes,
      onAdd: addImportTypeMutation.mutate,
      onUpdate: (id: number, data: any) => updateImportTypeMutation.mutate({ id, data }),
      onDelete: deleteImportTypeMutation.mutate,
      schema: importTypeSchema,
      fields: [
        { key: 'name', label: 'اسم نوع الاستيراد', type: 'text' as const },
        { key: 'description', label: 'الوصف', type: 'textarea' as const },
      ],
    },
    {
      key: 'vehicle-statuses',
      title: 'حالات المركبات',
      icon: <Car className="h-5 w-5" />,
      data: vehicleStatuses,
      isLoading: isLoadingVehicleStatuses,
      onAdd: addVehicleStatusMutation.mutate,
      onUpdate: (id: number, data: any) => updateVehicleStatusMutation.mutate({ id, data }),
      onDelete: deleteVehicleStatusMutation.mutate,
      schema: vehicleStatusSchema,
      fields: [
        { key: 'name', label: 'اسم حالة المركبة', type: 'text' as const },
        { key: 'description', label: 'الوصف', type: 'textarea' as const },
      ],
    },
    {
      key: 'ownership-types',
      title: 'أنواع الملكية',
      icon: <Building className="h-5 w-5" />,
      data: ownershipTypes,
      isLoading: isLoadingOwnershipTypes,
      onAdd: addOwnershipTypeMutation.mutate,
      onUpdate: (id: number, data: any) => updateOwnershipTypeMutation.mutate({ id, data }),
      onDelete: deleteOwnershipTypeMutation.mutate,
      schema: ownershipTypeSchema,
      fields: [
        { key: 'name', label: 'اسم نوع الملكية', type: 'text' as const },
        { key: 'description', label: 'الوصف', type: 'textarea' as const },
      ],
    },
    {
      key: 'vehicle-locations',
      title: 'مواقع المركبات',
      icon: <MapPin className="h-5 w-5" />,
      data: vehicleLocations,
      isLoading: isLoadingVehicleLocations,
      onAdd: addVehicleLocationMutation.mutate,
      onUpdate: (id: number, data: any) => updateVehicleLocationMutation.mutate({ id, data }),
      onDelete: deleteVehicleLocationMutation.mutate,
      schema: vehicleLocationSchema,
      fields: [
        { key: 'name', label: 'اسم الموقع', type: 'text' as const },
        { key: 'description', label: 'الوصف', type: 'textarea' as const },
      ],
    },
    {
      key: 'vehicle-years',
      title: 'سنوات المركبات',
      icon: <Calendar className="h-5 w-5" />,
      data: vehicleYears,
      isLoading: isLoadingVehicleYears,
      onAdd: addVehicleYearMutation.mutate,
      onUpdate: (id: number, data: any) => updateVehicleYearMutation.mutate({ id, data }),
      onDelete: deleteVehicleYearMutation.mutate,
      schema: vehicleYearSchema,
      fields: [
        { key: 'year', label: 'السنة', type: 'number' as const },
      ],
    },
    {
      key: 'engine-capacities',
      title: 'سعات المحركات',
      icon: <Gauge className="h-5 w-5" />,
      data: engineCapacities,
      isLoading: isLoadingEngineCapacities,
      onAdd: addEngineCapacityMutation.mutate,
      onUpdate: (id: number, data: any) => updateEngineCapacityMutation.mutate({ id, data }),
      onDelete: deleteEngineCapacityMutation.mutate,
      schema: engineCapacitySchema,
      fields: [
        { key: 'capacity', label: 'سعة المحرك', type: 'text' as const },
        { key: 'description', label: 'الوصف', type: 'textarea' as const },
      ],
    },
    {
      key: 'vehicle-colors',
      title: 'ألوان المركبات',
      icon: <Palette className="h-5 w-5" />,
      data: vehicleColors,
      isLoading: isLoadingVehicleColors,
      onAdd: addVehicleColorMutation.mutate,
      onUpdate: (id: number, data: any) => updateVehicleColorMutation.mutate({ id, data }),
      onDelete: deleteVehicleColorMutation.mutate,
      schema: vehicleColorSchema,
      fields: [
        { key: 'name', label: 'اسم اللون', type: 'text' as const },
        { 
          key: 'colorType', 
          label: 'نوع اللون', 
          type: 'select' as const,
          options: [
            { value: 'exterior', label: 'خارجي' },
            { value: 'interior', label: 'داخلي' },
          ]
        },
        { key: 'colorCode', label: 'كود اللون', type: 'color' as const },
      ],
    },
  ];

  return (
    <SystemGlassWrapper>
      <div className="container mx-auto p-6 space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">إدارة القوائم المنسدلة</h1>
            <p className="text-gray-600 dark:text-gray-400">
              إدارة الخيارات الأساسية للنظام (أنواع الاستيراد، الحالات، أنواع الملكية، إلخ)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => initializeDataMutation.mutate()}
              disabled={initializeDataMutation.isPending}
              className="gap-2"
            >
              {initializeDataMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Settings className="h-4 w-4" />
              )}
              تهيئة البيانات الأساسية
            </Button>
            <Settings className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <Tabs defaultValue="import-types" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            {dropdownConfigs.map((config) => (
              <TabsTrigger key={config.key} value={config.key} className="flex items-center gap-2">
                {config.icon}
                <span className="hidden sm:inline">{config.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {dropdownConfigs.map((config) => (
            <TabsContent key={config.key} value={config.key} className="mt-6">
              <DropdownManagement
                title={config.title}
                icon={config.icon}
                data={config.data}
                isLoading={config.isLoading}
                onAdd={config.onAdd}
                onUpdate={config.onUpdate}
                onDelete={config.onDelete}
                schema={config.schema}
                fields={config.fields}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </SystemGlassWrapper>
  );
}