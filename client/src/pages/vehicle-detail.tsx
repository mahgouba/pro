import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Calendar, 
  ShoppingCart, 
  Share2, 
  X, 
  ArrowLeft,
  Home
} from "lucide-react";
import { ManufacturerLogo } from "@/components/manufacturer-logo";
import { ReservationDialog } from "@/components/reservation-dialog";
import { EnhancedSaleDialog } from "@/components/enhanced-sale-dialog";
import VehicleShare from "@/components/vehicle-share";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import type { InventoryItem } from "@shared/schema";

interface VehicleDetailPageProps {
  userRole: string;
  username: string;
  onLogout: () => void;
}

export default function VehicleDetailPage({ userRole, username, onLogout }: VehicleDetailPageProps) {
  const [match, params] = useRoute("/vehicles/:id");
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [reserveDialogOpen, setReserveDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sellingItemId, setSellingItemId] = useState<number | null>(null);
  const [cancelingReservationId, setCancelingReservationId] = useState<number | null>(null);

  const vehicleId = params?.id ? parseInt(params.id) : null;

  // Fetch vehicle data
  const { data: vehicle, isLoading, error } = useQuery<InventoryItem>({
    queryKey: [`/api/inventory/${vehicleId}`],
    enabled: !!vehicleId,
  });

  // Reserve mutation  
  const reserveMutation = useMutation({
    mutationFn: async (vehicleData: InventoryItem) => {
      return apiRequest("POST", "/api/reservations", {
        body: JSON.stringify({
          inventoryItemId: vehicleData.id,
          manufacturer: vehicleData.manufacturer,
          category: vehicleData.category,
          year: vehicleData.year,
          exteriorColor: vehicleData.exteriorColor,
          price: vehicleData.price,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "تم الحجز بنجاح",
        description: "تم حجز المركبة بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/inventory/${vehicleId}`] });
      setReserveDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "خطأ في الحجز",
        description: "حدث خطأ أثناء حجز المركبة",
        variant: "destructive",
      });
    }
  });

  // Cancel reservation mutation
  const cancelReservationMutation = useMutation({
    mutationFn: async (itemId: number) => {
      setCancelingReservationId(itemId);
      return apiRequest("DELETE", `/api/reservations/item/${itemId}`);
    },
    onSuccess: () => {
      toast({
        title: "تم إلغاء الحجز",
        description: "تم إلغاء حجز المركبة بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/inventory/${vehicleId}`] });
      setCancelingReservationId(null);
    },
    onError: () => {
      toast({
        title: "خطأ في إلغاء الحجز",
        description: "حدث خطأ أثناء إلغاء حجز المركبة",
        variant: "destructive",
      });
      setCancelingReservationId(null);
    }
  });

  // Sell mutation
  const sellMutation = useMutation({
    mutationFn: async (saleData: any) => {
      if (vehicle) setSellingItemId(vehicle.id);
      return apiRequest("POST", "/api/sold-vehicles", {
        body: JSON.stringify(saleData),
      });
    },
    onSuccess: () => {
      toast({
        title: "تم البيع بنجاح",
        description: "تم بيع المركبة وتحديث المخزون",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/inventory/${vehicleId}`] });
      setSellingItemId(null);
      setSellDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "خطأ في البيع",
        description: "حدث خطأ أثناء بيع المركبة",
        variant: "destructive",
      });
      setSellingItemId(null);
    }
  });

  const handleReserve = () => {
    if (vehicle) {
      reserveMutation.mutate(vehicle);
    }
  };

  const handleCancelReservation = () => {
    if (vehicle) {
      cancelReservationMutation.mutate(vehicle.id);
    }
  };

  const handleSell = (saleData: any) => {
    sellMutation.mutate(saleData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل بيانات المركبة...</p>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">المركبة غير موجودة</h1>
          <p className="text-gray-600 dark:text-gray-400">لم يتم العثور على المركبة المطلوبة</p>
          <Link href="/">
            <Button variant="outline">
              <Home className="w-4 h-4 ml-2" />
              العودة للرئيسية
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            className="glass-button glass-text-primary"
            onClick={() => navigate("/card-view")}
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة للبطاقات
          </Button>
          <h1 className="text-2xl font-bold text-white">تفاصيل المركبة</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60">ID: {vehicle?.id}</span>
          </div>
        </div>

        {/* Vehicle Card */}
        <Card className="glass-morphism border-white/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <ManufacturerLogo
                manufacturerName={vehicle.manufacturer}
                size="md"
                className="w-12 h-12"
              />
              <div>
                <div className="text-xl font-bold">
                  {vehicle.manufacturer} {vehicle.category}
                </div>
                <div className="text-sm text-gray-300">
                  {vehicle.year} • {vehicle.trimLevel}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Vehicle Images */}
            {vehicle.images && vehicle.images.length > 0 && (
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
                <img
                  src={vehicle.images[0]}
                  alt={`${vehicle.manufacturer} ${vehicle.category}`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Vehicle Specifications - Complete Details */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Column 1: Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">المواصفات الأساسية</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">الصانع:</span>
                    <span className="text-white font-medium">{vehicle.manufacturer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">الفئة:</span>
                    <span className="text-white font-medium">{vehicle.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">السنة:</span>
                    <span className="text-white font-medium">{vehicle.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">درجة التجهيز:</span>
                    <span className="text-white font-medium">{vehicle.trimLevel || 'غير محدد'}</span>
                  </div>
                  {vehicle.engineCapacity && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">سعة المحرك:</span>
                      <span className="text-white font-medium">{vehicle.engineCapacity}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: Colors and Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">الألوان والتفاصيل</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">اللون الخارجي:</span>
                    <span className="text-white font-medium">{vehicle.exteriorColor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">اللون الداخلي:</span>
                    <span className="text-white font-medium">{vehicle.interiorColor}</span>
                  </div>
                  {vehicle.chassisNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">رقم الهيكل:</span>
                      <span className="text-white font-medium font-mono text-sm">{vehicle.chassisNumber}</span>
                    </div>
                  )}
                  {vehicle.importType && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">نوع الاستيراد:</span>
                      <span className="text-white font-medium">{vehicle.importType}</span>
                    </div>
                  )}
                  {vehicle.location && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">الموقع:</span>
                      <span className="text-white font-medium">{vehicle.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Column 3: Status and Pricing */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">الحالة والسعر</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">الحالة:</span>
                    <Badge 
                      className="text-sm px-3 py-1"
                      variant={
                        vehicle.status === 'متوفر' ? 'default' : 
                        vehicle.status === 'محجوز' ? 'secondary' : 
                        'destructive'
                      }
                    >
                      {vehicle.status}
                    </Badge>
                  </div>
                  
                  {vehicle.price && (
                    <div className="bg-gradient-to-r from-green-600/20 to-green-500/20 p-4 rounded-lg border border-green-500/30">
                      <div className="text-center">
                        <span className="text-gray-300 text-sm block mb-1">السعر</span>
                        <span className="text-3xl font-bold text-green-400">
                          {vehicle.price.toLocaleString()}
                        </span>
                        <span className="text-green-300 text-lg mr-2">ر.س</span>
                      </div>
                    </div>
                  )}

                  {vehicle.mileage && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">الكيلومترات:</span>
                      <span className="text-white font-medium">{vehicle.mileage.toLocaleString()} كم</span>
                    </div>
                  )}

                  {/* Customer Info if Reserved */}
                  {vehicle.status === 'محجوز' && (
                    <div className="bg-orange-600/20 p-3 rounded-lg border border-orange-500/30 mt-4">
                      <div className="text-orange-300 text-sm font-medium mb-2">معلومات الحجز</div>
                      {vehicle.customerName && (
                        <div className="text-white text-sm">العميل: {vehicle.customerName}</div>
                      )}
                      {vehicle.customerPhone && (
                        <div className="text-white text-sm">الجوال: {vehicle.customerPhone}</div>
                      )}
                      {vehicle.reservationDate && (
                        <div className="text-white text-sm">تاريخ الحجز: {new Date(vehicle.reservationDate).toLocaleDateString('ar-SA')}</div>
                      )}
                    </div>
                  )}

                  {/* Sold Info if Sold */}
                  {vehicle.status === 'مباع' && (
                    <div className="bg-red-600/20 p-3 rounded-lg border border-red-500/30 mt-4">
                      <div className="text-red-300 text-sm font-medium mb-2">معلومات البيع</div>
                      {(vehicle as any).saleDate && (
                        <div className="text-white text-sm">تاريخ البيع: {new Date((vehicle as any).saleDate).toLocaleDateString('ar-SA')}</div>
                      )}
                      {(vehicle as any).salePrice && (
                        <div className="text-white text-sm">سعر البيع: {(vehicle as any).salePrice.toLocaleString()} ر.س</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Notes Section */}
            {(vehicle.notes || vehicle.reservationNote || vehicle.saleNotes) && (
              <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-3">الملاحظات</h3>
                <div className="space-y-2">
                  {vehicle.notes && (
                    <div>
                      <span className="text-gray-400 text-sm">ملاحظات عامة: </span>
                      <span className="text-white">{vehicle.notes}</span>
                    </div>
                  )}
                  {vehicle.reservationNote && (
                    <div>
                      <span className="text-gray-400 text-sm">ملاحظة الحجز: </span>
                      <span className="text-white">{vehicle.reservationNote}</span>
                    </div>
                  )}
                  {(vehicle as any).saleNotes && (
                    <div>
                      <span className="text-gray-400 text-sm">ملاحظات البيع: </span>
                      <span className="text-white">{(vehicle as any).saleNotes}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons - Enhanced Layout */}
            <div className="pt-6 border-t border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">الإجراءات المتاحة</h3>
              
              {/* Primary Actions Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {/* Reserve/Cancel Reservation Button */}
                {vehicle.status === "محجوز" ? (
                  <Button
                    onClick={handleCancelReservation}
                    disabled={cancelingReservationId === vehicle.id}
                    className="bg-orange-600 hover:bg-orange-700 text-white text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <X className="w-5 h-5 ml-2" />
                    {cancelingReservationId === vehicle.id ? "جاري الإلغاء..." : "إلغاء الحجز"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setReserveDialogOpen(true)}
                    disabled={vehicle.status === "محجوز" || vehicle.status === "مباع"}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <Calendar className="w-5 h-5 ml-2" />
                    حجز
                  </Button>
                )}

                {/* Sell Button */}
                <Button
                  onClick={() => setSellDialogOpen(true)}
                  disabled={sellingItemId === vehicle.id || vehicle.status === "مباع"}
                  className="bg-green-600 hover:bg-green-700 text-white text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <ShoppingCart className="w-5 h-5 ml-2" />
                  {sellingItemId === vehicle.id ? "جاري البيع..." : "بيع"}
                </Button>

                {/* Share Button */}
                <Button
                  onClick={() => setShareDialogOpen(true)}
                  className="text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  style={{backgroundColor: '#BF9231', color: 'white'}}
                >
                  <Share2 className="w-5 h-5 ml-2" />
                  مشاركة
                </Button>
              </div>


            </div>

            {/* Price Card Button */}
            <Button
              onClick={() => {
                localStorage.setItem('selectedVehicleForPriceCard', JSON.stringify(vehicle));
                window.location.href = '/price-cards';
              }}
              variant="outline"
              className="w-full glass-button glass-text-primary text-lg py-3"
            >
              <Receipt className="w-5 h-5 ml-2" />
              إنشاء بطاقة سعر
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Reserve Dialog */}
      {vehicle && (
        <ReservationDialog
          open={reserveDialogOpen}
          onOpenChange={setReserveDialogOpen}
          item={vehicle}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: [`/api/inventory/${vehicleId}`] });
          }}
        />
      )}

      {/* Sell Dialog */}
      {vehicle && (
        <EnhancedSaleDialog
          isOpen={sellDialogOpen}
          onClose={() => setSellDialogOpen(false)}
          onConfirm={handleSell}
          vehicleData={{
            id: vehicle.id,
            manufacturer: vehicle.manufacturer,
            category: vehicle.category,
            year: vehicle.year,
            chassisNumber: vehicle.chassisNumber || '',
          }}
        />
      )}

      {/* Share Dialog */}
      {vehicle && (
        <VehicleShare
          vehicle={vehicle}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
        />
      )}
    </div>
  );
}