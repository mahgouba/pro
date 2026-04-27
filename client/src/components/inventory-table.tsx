import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, Images, ArrowUpDown, ShoppingCart, DollarSign, Calendar, X, FileText } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getStatusColor } from "@/lib/utils";
import type { InventoryItem } from "@shared/schema";
import InventoryForm from "./inventory-form";
import { ManufacturerLogo } from "./manufacturer-logo";
import { ReservationDialog } from "./reservation-dialog";
import { SellVehicleDialog } from "./sell-vehicle-dialog";
import { canDeleteItem, canEditItem, UserRole } from "@/utils/permissions";


interface InventoryTableProps {
  searchQuery: string;
  manufacturerFilter: string[];
  categoryFilter: string[];
  trimLevelFilter: string[];
  yearFilter: string[];
  engineCapacityFilter: string[];
  interiorColorFilter: string[];
  exteriorColorFilter: string[];
  statusFilter: string[];
  importTypeFilter: string[];
  ownershipTypeFilter: string[];
  fromDate: string;
  toDate: string;
  showSoldCars: boolean;
  userRole: string;
  username: string;
  onEdit?: (item: InventoryItem) => void;
}

export default function InventoryTable({ 
  searchQuery, 
  manufacturerFilter, 
  categoryFilter, 
  trimLevelFilter, 
  yearFilter, 
  engineCapacityFilter, 
  interiorColorFilter, 
  exteriorColorFilter, 
  statusFilter, 
  importTypeFilter, 
  ownershipTypeFilter, 
  fromDate,
  toDate,
  showSoldCars, 
  userRole, 
  username, 
  onEdit 
}: InventoryTableProps) {
  const [editItem, setEditItem] = useState<InventoryItem | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [reserveItem, setReserveItem] = useState<InventoryItem | undefined>();
  const [reserveDialogOpen, setReserveDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  // Calculate days since entry
  const getDaysSinceEntry = (entryDate: string) => {
    const entry = new Date(entryDate);
    const now = new Date();
    const diffTime = now.getTime() - entry.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get color for days indicator circle
  const getDaysIndicatorColor = (days: number) => {
    if (days > 40) {
      return "bg-red-500"; // Red after 40 days
    }
    return "bg-green-500"; // Green for 40 days or less
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/inventory/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/manufacturer-stats"] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف العنصر بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف العنصر",
        variant: "destructive",
      });
    },
  });

  const sellMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PUT", `/api/inventory/${id}/sell`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/manufacturer-stats"] });
      toast({
        title: "تم بنجاح",
        description: "تم تحديد السيارة كمباعة",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديد السيارة كمباعة",
        variant: "destructive",
      });
    },
  });

  const reserveMutation = useMutation({
    mutationFn: (data: { id: number; reservedBy: string; reservationNote?: string }) => 
      apiRequest("POST", `/api/inventory/${data.id}/reserve`, {
        reservedBy: data.reservedBy,
        reservationNote: data.reservationNote
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/manufacturer-stats"] });
      toast({
        title: "تم الحجز",
        description: "تم حجز المركبة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حجز المركبة",
        variant: "destructive",
      });
    },
  });

  const cancelReservationMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/inventory/${id}/cancel-reservation`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/manufacturer-stats"] });
      toast({
        title: "تم إلغاء الحجز",
        description: "تم إلغاء حجز المركبة",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إلغاء حجز المركبة",
        variant: "destructive",
      });
    },
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleEdit = (item: InventoryItem) => {
    if (onEdit) {
      onEdit(item);
    } else {
      setEditItem(item);
      setFormOpen(true);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذا العنصر؟")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSell = (id: number) => {
    if (window.confirm("هل أنت متأكد من تحديد هذه السيارة كمباعة؟")) {
      sellMutation.mutate(id);
    }
  };



  const handleCancelReservation = (id: number) => {
    if (window.confirm("هل أنت متأكد من إلغاء حجز هذه السيارة؟")) {
      cancelReservationMutation.mutate(id);
    }
  };

  const handleReserve = (id: number) => {
    const item = items.find(item => item.id === id);
    if (item) {
      setReserveItem(item);
      setReserveDialogOpen(true);
    }
  };

  const handleReservationSuccess = () => {
    setReserveDialogOpen(false);
    setReserveItem(undefined);
    queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
    queryClient.invalidateQueries({ queryKey: ["/api/inventory/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/inventory/manufacturer-stats"] });
  };

  const filteredAndSortedItems = items
    .filter((item: InventoryItem) => {
      const matchesSearch = !searchQuery || 
        Object.values(item).some(value => 
          value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
        );
      const matchesManufacturer = manufacturerFilter.length === 0 || manufacturerFilter.includes(item.manufacturer || "");
      const matchesCategory = categoryFilter.length === 0 || categoryFilter.includes(item.category || "");
      const matchesTrimLevel = trimLevelFilter.length === 0 || trimLevelFilter.includes(item.trimLevel || "");
      const matchesYear = yearFilter.length === 0 || yearFilter.includes(String(item.year));
      const matchesEngineCapacity = engineCapacityFilter.length === 0 || engineCapacityFilter.includes(item.engineCapacity || "");
      const matchesInteriorColor = interiorColorFilter.length === 0 || interiorColorFilter.includes(item.interiorColor || "");
      const matchesExteriorColor = exteriorColorFilter.length === 0 || exteriorColorFilter.includes(item.exteriorColor || "");
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(item.status || "");
      const matchesImportType = importTypeFilter.length === 0 || importTypeFilter.includes(item.importType || "");
      const matchesOwnershipType = ownershipTypeFilter.length === 0 || ownershipTypeFilter.includes(item.ownershipType || "");
      
      // Date range filter
      const matchesDateRange = (() => {
        if (!fromDate && !toDate) return true;
        
        const itemDate = new Date(item.entryDate);
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;
        
        if (from && to) {
          return itemDate >= from && itemDate <= to;
        } else if (from) {
          return itemDate >= from;
        } else if (to) {
          return itemDate <= to;
        }
        return true;
      })();
      
      // إذا كان إظهار السيارات المباعة مفعلاً، اعرض جميع السيارات
      // إذا كان مطفياً، اعرض فقط السيارات غير المباعة
      const matchesSoldFilter = showSoldCars ? true : item.status !== "مباع";
      
      // إخفاء السيارات ذات الحالة "خاص" أو "تشغيل" عن الأدوار المحدودة
      const restrictedRoles = ['salesperson', 'user', 'bank_accountant', 'seller'];
      const isRestrictedVehicle = item.status === "خاص" || item.status === "تشغيل";
      const matchesRoleFilter = restrictedRoles.includes(userRole) ? !isRestrictedVehicle : true;
      
      return matchesSearch && matchesManufacturer && matchesCategory && matchesTrimLevel && matchesYear && matchesEngineCapacity && matchesInteriorColor && matchesExteriorColor && matchesStatus && matchesImportType && matchesOwnershipType && matchesDateRange && matchesSoldFilter && matchesRoleFilter;
    })
    .sort((a: InventoryItem, b: InventoryItem) => {
      if (!sortColumn) return 0;
      
      const aValue = a[sortColumn as keyof InventoryItem];
      const bValue = b[sortColumn as keyof InventoryItem];
      
      if (aValue && bValue) {
        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });

  if (isLoading) {
    return (
      <div className="glass-container overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/60 mx-auto"></div>
          <p className="mt-2 text-white/80">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-container overflow-hidden">
      <div className="overflow-x-auto">
        <Table data-table="inventory-table" className="glass-table">
          <TableHeader className="bg-custom-primary">
            <TableRow>
              <TableHead className="text-white text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-teal-100 hover:bg-custom-primary-dark p-1"
                  onClick={() => handleSort("manufacturer")}
                >
                  الصانع
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                </Button>
              </TableHead>

              <TableHead className="text-white text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-teal-100 hover:bg-custom-primary-dark p-1"
                  onClick={() => handleSort("category")}
                >
                  الفئة
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-white text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-teal-100 hover:bg-custom-primary-dark p-1"
                  onClick={() => handleSort("trimLevel")}
                >
                  درجة التجهيز
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-white text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-teal-100 hover:bg-custom-primary-dark p-1"
                  onClick={() => handleSort("engineCapacity")}
                >
                  سعة المحرك
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-white text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-teal-100 hover:bg-custom-primary-dark p-1"
                  onClick={() => handleSort("year")}
                >
                  السنة
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-white text-right">اللون الخارجي</TableHead>
              <TableHead className="text-white text-right">اللون الداخلي</TableHead>
              <TableHead className="text-white text-right">الحالة</TableHead>
              <TableHead className="text-white text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-teal-100 hover:bg-custom-primary-dark p-1"
                  onClick={() => handleSort("location")}
                >
                  الموقع
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-white text-right">الاستيراد</TableHead>
              <TableHead className="text-white text-right">رقم الهيكل</TableHead>
              <TableHead className="text-white text-right">نوع الملكية</TableHead>
              <TableHead className="text-white text-right">تاريخ الدخول</TableHead>
              <TableHead className="text-white text-right">الممشي (كم)</TableHead>
              <TableHead className="text-white text-right">السعر</TableHead>
              <TableHead className="text-white text-right">الملاحظات</TableHead>
              <TableHead className="text-white text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={17} className="text-center py-8">
                  <p className="text-white/70">لا توجد عناصر للعرض</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedItems.map((item: InventoryItem) => (
                <TableRow key={item.id} className={`hover:bg-white/10 ${item.isSold ? 'bg-red-500/20 border-l-4 border-red-400' : ''}`}>
                  <TableCell className="text-sm text-white">
                    <div className="flex items-center gap-2">
                      <ManufacturerLogo manufacturerName={item.manufacturer} size="sm" />
                      <span>{item.manufacturer}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-sm text-white">{item.category}</TableCell>
                  <TableCell className="text-sm text-white">{item.trimLevel || '-'}</TableCell>
                  <TableCell className="text-sm text-white font-latin">{item.engineCapacity}</TableCell>
                  <TableCell className="text-sm text-white font-latin">{item.year}</TableCell>
                  <TableCell className="text-sm text-white">{item.exteriorColor}</TableCell>
                  <TableCell className="text-sm text-white">{item.interiorColor}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                      {(() => {
                        const daysSinceEntry = getDaysSinceEntry(item.entryDate);
                        const indicatorColor = getDaysIndicatorColor(daysSinceEntry);
                        return (
                          <div 
                            className={`w-6 h-6 rounded-full ${indicatorColor} flex items-center justify-center text-white text-xs font-bold shadow-sm`}
                            title={`${daysSinceEntry} ${daysSinceEntry === 1 ? 'يوم' : 'أيام'} منذ الدخول`}
                          >
                            {daysSinceEntry}
                          </div>
                        );
                      })()}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-white">{item.location}</TableCell>
                  <TableCell className="text-sm text-white">{item.importType}</TableCell>
                  <TableCell className="text-sm text-white/80 font-latin">
                    {item.status === "مراجعة المشرف" ? "***" : item.chassisNumber}
                  </TableCell>
                  <TableCell className="text-sm text-white">{item.ownershipType}</TableCell>
                  <TableCell className="text-sm text-white/80 font-latin">
                    {new Date(item.entryDate).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="text-sm text-white font-latin">
                    {item.mileage ? `${item.mileage?.toLocaleString()} كم` : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-white font-latin">
                    {item.price ? `${parseFloat(item.price).toLocaleString()} ر.س` : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-white/80">{item.notes || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      {canEditItem(userRole as UserRole, "inventory") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          className="text-custom-primary hover:text-custom-primary-dark p-1"
                          title="تحرير"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}

                      {canDeleteItem(userRole as UserRole, "inventory") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="حذف"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {item.status === "محجوز" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelReservation(item.id)}
                          className="text-orange-600 hover:text-orange-800 p-1"
                          title="إلغاء الحجز"
                          disabled={cancelReservationMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReserve(item.id)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="حجز"
                          disabled={reserveMutation.isPending || item.status === "محجوز" || item.isSold}
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                      )}
                      <SellVehicleDialog
                        vehicleId={item.id}
                        vehicleInfo={`${item.manufacturer} ${item.category} - ${item.year} - ${item.chassisNumber}`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>



      <InventoryForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditItem(undefined);
        }}
        editItem={editItem}
      />

      <ReservationDialog
        open={reserveDialogOpen}
        onOpenChange={setReserveDialogOpen}
        item={reserveItem}
        onSuccess={handleReservationSuccess}
      />
    </div>
  );
}
