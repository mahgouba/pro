import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Car, CreditCard, Phone, Search, ShoppingCart, User, X, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ManufacturerLogo } from "@/components/manufacturer-logo";
import { EnhancedSaleDialog } from "@/components/enhanced-sale-dialog";
import SystemGlassWrapper from "@/components/system-glass-wrapper";

export default function ReservationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [salesRepFilter, setSalesRepFilter] = useState("all");
  const [selectedVehicleForSale, setSelectedVehicleForSale] = useState<any>(null);
  const [isEnhancedSaleDialogOpen, setIsEnhancedSaleDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reservedItems = [], isLoading } = useQuery({
    queryKey: ["/api/inventory/reserved"],
  });

  // Get unique sales representatives for filter
  const salesRepresentatives = useMemo(() => {
    const items = reservedItems as any[];
    const reps = items
      .map((item: any) => item.salesRepresentative)
      .filter((rep: string) => rep && rep.trim())
      .filter((rep: string, index: number, arr: string[]) => arr.indexOf(rep) === index)
      .sort();
    return reps;
  }, [reservedItems]);

  // Filter reserved items based on search query and sales representative
  const filteredReservations = useMemo(() => {
    const items = reservedItems as any[];
    let filtered = items;
    
    // Filter by sales representative
    if (salesRepFilter !== "all") {
      filtered = filtered.filter((item: any) => item.salesRepresentative === salesRepFilter);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item: any) =>
        item.customerName?.toLowerCase().includes(query) ||
        item.customerPhone?.toLowerCase().includes(query) ||
        item.manufacturer?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.chassisNumber?.toLowerCase().includes(query) ||
        item.salesRepresentative?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [reservedItems, searchQuery, salesRepFilter]);

  const sellMutation = useMutation({
    mutationFn: async ({ itemId, saleData }: { itemId: number; saleData: any }) => {
      return apiRequest("PUT", `/api/inventory/${itemId}/sell-reserved`, saleData);
    },
    onSuccess: () => {
      toast({
        title: "تم البيع بنجاح",
        description: "تم بيع السيارة مع حفظ جميع بيانات البيع والعميل ومندوب المبيعات",
      });
      setIsEnhancedSaleDialogOpen(false);
      setSelectedVehicleForSale(null);
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/reserved"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/manufacturer-stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "فشل في البيع",
        description: error.message || "حدث خطأ أثناء بيع السيارة",
        variant: "destructive",
      });
    },
  });

  const handleSellVehicle = (vehicle: any) => {
    setSelectedVehicleForSale(vehicle);
    setIsEnhancedSaleDialogOpen(true);
  };

  const handleConfirmSale = (saleData: any) => {
    if (selectedVehicleForSale) {
      sellMutation.mutate({ 
        itemId: selectedVehicleForSale.id, 
        saleData 
      });
    }
  };

  const cancelReservationMutation = useMutation({
    mutationFn: async (itemId: number) => {
      return apiRequest("PUT", `/api/inventory/${itemId}/cancel-reservation`, {});
    },
    onSuccess: () => {
      toast({
        title: "تم إلغاء الحجز",
        description: "تم إلغاء حجز السيارة بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/reserved"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/manufacturer-stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "فشل في إلغاء الحجز",
        description: error.message || "حدث خطأ أثناء إلغاء الحجز",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: string | null | undefined) => {
    if (!amount) return "غير محدد";
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(parseFloat(amount));
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "غير محدد";
    return new Date(date).toLocaleDateString('en-US'); // Use Gregorian calendar
  };

  if (isLoading) {
    return (
      <SystemGlassWrapper>
        <div className="container mx-auto p-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
            <p className="mt-2 text-white/70 drop-shadow-sm">جاري تحميل طلبات الحجز...</p>
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
            إدارة طلبات الحجز
          </h1>
          <p className="text-white/70 drop-shadow-sm">
            إدارة طلبات حجز السيارات وبيانات العملاء
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث في طلبات الحجز..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 text-right"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Select value={salesRepFilter} onValueChange={setSalesRepFilter}>
                <SelectTrigger className="pr-10 text-right">
                  <SelectValue placeholder="فلترة بإسم المندوب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المندوبين</SelectItem>
                  {salesRepresentatives.map((rep: string) => (
                    <SelectItem key={rep} value={rep}>
                      {rep}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Active Filters Display */}
          {(searchQuery || salesRepFilter !== "all") && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">الفلاتر النشطة:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  البحث: {searchQuery}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setSearchQuery("")}
                  />
                </Badge>
              )}
              {salesRepFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  المندوب: {salesRepFilter}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setSalesRepFilter("all")}
                  />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSalesRepFilter("all");
                }}
                className="text-xs h-6"
              >
                مسح جميع الفلاتر
              </Button>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-container p-4 text-center">
              <div className="text-2xl font-bold text-blue-400 drop-shadow-lg">{(reservedItems as any[]).length}</div>
              <div className="text-sm text-white/70 drop-shadow-sm">إجمالي الحجوزات</div>
            </div>
            <div className="glass-container p-4 text-center">
              <div className="text-2xl font-bold text-green-400 drop-shadow-lg">
                {(reservedItems as any[]).reduce((sum: number, item: any) => sum + (parseFloat(item.paidAmount) || 0), 0).toLocaleString('ar-SA')}
              </div>
              <div className="text-sm text-white/70 drop-shadow-sm">إجمالي المبالغ المدفوعة</div>
            </div>
            <div className="glass-container p-4 text-center">
              <div className="text-2xl font-bold text-amber-400 drop-shadow-lg">{filteredReservations.length}</div>
              <div className="text-sm text-white/70 drop-shadow-sm">نتائج البحث</div>
            </div>
          </div>
        </div>

        {/* Reservations List */}
        {filteredReservations.length === 0 ? (
          <div className="glass-container text-center py-8">
            <Calendar className="w-12 h-12 text-white/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white drop-shadow-lg mb-2">
              {searchQuery ? "لا توجد نتائج للبحث" : "لا توجد طلبات حجز"}
            </h3>
            <p className="text-white/70 drop-shadow-sm">
              {searchQuery ? "جرب البحث بكلمات أخرى" : "لم يتم إجراء أي حجوزات بعد"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReservations.map((item: any) => (
              <div key={item.id} className="glass-container overflow-hidden">
                <div className="pb-3 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ManufacturerLogo manufacturerName={item.manufacturer} size="sm" />
                      <h3 className="text-lg font-semibold text-white drop-shadow-lg">{item.manufacturer}</h3>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                      محجوز
                    </Badge>
                  </div>
                  <div className="text-sm text-white/70 drop-shadow-sm mt-1">
                    {item.category} {item.trimLevel && `- ${item.trimLevel}`}
                  </div>
                </div>
                
                <div className="space-y-4 p-4">
                  {/* Vehicle Info */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Car className="w-3 h-3 text-white/60" />
                      <span className="text-white/70">السنة:</span>
                      <span className="text-white drop-shadow-sm">{item.year}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-white/70">الهيكل:</span>
                      <span className="font-mono text-white/90 drop-shadow-sm">{item.chassisNumber}</span>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-3">
                    <h4 className="font-semibold text-sm mb-2 text-white drop-shadow-sm">بيانات العميل</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-white/60" />
                        <span className="text-white drop-shadow-sm">{item.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-white/60" />
                        <span dir="ltr" className="text-white drop-shadow-sm">{item.customerPhone}</span>
                      </div>
                      {item.salesRepresentative && (
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-blue-400" />
                          <span className="text-blue-300 font-medium drop-shadow-sm">
                            مندوب المبيعات: {item.salesRepresentative}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3 h-3 text-white/60" />
                        <span className="font-semibold text-green-400 drop-shadow-sm">
                          {formatCurrency(item.paidAmount)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-white/60" />
                        <span className="text-white drop-shadow-sm">{formatDate(item.reservationDate)}</span>
                      </div>
                    </div>

                    {item.reservationNote && (
                      <div className="mt-2 p-2 bg-white/5 rounded text-xs border border-white/10">
                        <strong className="text-white drop-shadow-sm">ملاحظات:</strong> 
                        <span className="text-white/80 drop-shadow-sm"> {item.reservationNote}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-500/80 hover:bg-green-500 text-white border-green-400/30"
                      onClick={() => handleSellVehicle(item)}
                      disabled={sellMutation.isPending || cancelReservationMutation.isPending}
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      بيع
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-red-500/80 hover:bg-red-500 text-white border-red-400/30"
                      onClick={() => cancelReservationMutation.mutate(item.id)}
                      disabled={sellMutation.isPending || cancelReservationMutation.isPending}
                    >
                      <X className="w-3 h-3 mr-1" />
                      إلغاء
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enhanced Sale Dialog */}
        {selectedVehicleForSale && (
          <EnhancedSaleDialog
            isOpen={isEnhancedSaleDialogOpen}
            onClose={() => {
              setIsEnhancedSaleDialogOpen(false);
              setSelectedVehicleForSale(null);
            }}
            onConfirm={handleConfirmSale}
            vehicleData={selectedVehicleForSale}
            isLoading={sellMutation.isPending}
          />
        )}
      </div>
    </SystemGlassWrapper>
  );
}