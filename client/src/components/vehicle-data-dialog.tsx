import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  X, 
  Calendar, 
  ShoppingCart, 
  Share2, 
  Info,
  MapPin,
  Palette,
  Settings,
  Eye,
  UserCheck,
  CheckCircle
} from 'lucide-react';
import { ManufacturerLogo } from '@/components/manufacturer-logo';
import { ReservationDialog } from '@/components/reservation-dialog';
import { EnhancedSaleDialog } from '@/components/enhanced-sale-dialog';
import VehicleShare from '@/components/vehicle-share';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import type { InventoryItem } from '@shared/schema';

interface VehicleDataDialogProps {
  vehicleId: number | null;
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  username: string;
}

export function VehicleDataDialog({ vehicleId, isOpen, onClose, userRole, username }: VehicleDataDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  const [reserveDialogOpen, setReserveDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sellingItemId, setSellingItemId] = useState<number | null>(null);
  const [cancelingReservationId, setCancelingReservationId] = useState<number | null>(null);

  // Fetch vehicle data
  const { data: vehicle, isLoading, error } = useQuery<InventoryItem>({
    queryKey: [`/api/inventory/${vehicleId}`],
    enabled: !!vehicleId && isOpen,
    retry: (failureCount, error: any) => {
      // Don't retry if it's a 404 error (vehicle not found)
      if (error?.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
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
          interiorColor: vehicleData.interiorColor,
          chassisNumber: vehicleData.chassisNumber,
          notes: vehicleData.notes || '',
          // specifications: JSON.stringify(vehicleData.specifications || {}),
          reservedBy: username,
          reservationNote: '',
          reservationDate: new Date().toISOString(),
          detailedSpecifications: vehicleData.detailedSpecifications
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "تم الحجز بنجاح",
        description: "تم حجز المركبة بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setReserveDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحجز",
        description: error.message || "فشل في حجز المركبة",
        variant: "destructive",
      });
    },
  });

  // Cancel reservation mutation
  const cancelReservationMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/reservations/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "تم إلغاء الحجز",
        description: "تم إلغاء حجز المركبة بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setCancelingReservationId(null);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إلغاء الحجز",
        description: error.message || "فشل في إلغاء حجز المركبة",
        variant: "destructive",
      });
      setCancelingReservationId(null);
    },
  });

  const handleReserve = (vehicleData: InventoryItem) => {
    setReserveDialogOpen(true);
  };

  const handleShare = (vehicleData: InventoryItem) => {
    setShareDialogOpen(true);
  };

  const handleSell = (vehicleData: InventoryItem) => {
    setSellingItemId(vehicleData.id);
    setSellDialogOpen(true);
  };

  const handleViewDetails = () => {
    if (vehicle) {
      navigate(`/vehicles/${vehicle.id}`);
      onClose();
    }
  };

  const handleCancelReservation = (vehicleData: InventoryItem) => {
    setCancelingReservationId(vehicleData.id);
    cancelReservationMutation.mutate(vehicleData.id);
  };

  if (!isOpen || !vehicleId) return null;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl mx-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400">جاري تحميل بيانات المركبة...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !vehicle) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl mx-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                <X className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-red-600 dark:text-red-400 font-medium">لم يتم العثور على المركبة</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {vehicleId ? 
                    `المركبة برقم ${vehicleId} غير موجودة في النظام` : 
                    'الكود المسوح غير صحيح أو المركبة غير موجودة'
                  }
                </p>
                {error && (
                  <p className="text-xs text-red-400 mt-2 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    خطأ: {error instanceof Error ? error.message : 'خطأ غير معروف'}
                  </p>
                )}
              </div>
              <Button onClick={onClose} variant="outline">
                إغلاق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'متاح': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'محجوز': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'مباع': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      case 'قيد الصيانة': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
    }
  };

  const canReserve = vehicle.status === 'متاح' && !vehicle.isSold;
  const canSell = vehicle.status !== 'مباع' && !vehicle.isSold;
  const isReserved = vehicle.status === 'محجوز';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl mx-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ManufacturerLogo 
                  manufacturerName={vehicle.manufacturer} 
                  size="lg"
                  customLogo={vehicle.logo || undefined}
                />
                <div className="text-right">
                  <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-white">
                    {vehicle.manufacturer} {vehicle.category}
                  </DialogTitle>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {vehicle.year} • {vehicle.trimLevel}
                  </p>
                </div>
              </div>
              <Badge className={`${getStatusColor(vehicle.status)} border px-3 py-1`}>
                {vehicle.status}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Vehicle Images */}
            {vehicle.images && vehicle.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {vehicle.images.slice(0, 6).map((image, index) => (
                  <div key={index} className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
                    <img 
                      src={image} 
                      alt={`صورة المركبة ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card className="glass-card">
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">السنة:</span>
                      <p className="font-medium">{vehicle.year}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">المحرك:</span>
                      <p className="font-medium">{vehicle.engineCapacity}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">رقم الهيكل:</span>
                      <p className="font-medium text-xs break-all">{vehicle.chassisNumber}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">نوع الاستيراد:</span>
                      <p className="font-medium">{vehicle.importType}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Colors and Location */}
              <Card className="glass-card">
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">اللون الخارجي:</span>
                      <p className="font-medium">{vehicle.exteriorColor}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">اللون الداخلي:</span>
                      <p className="font-medium">{vehicle.interiorColor}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        الموقع:
                      </span>
                      <p className="font-medium">{vehicle.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Price Information */}
            {vehicle.price && parseFloat(vehicle.price) > 0 && (
              <Card className="glass-card border-green-200 dark:border-green-800">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">السعر</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {parseFloat(vehicle.price).toLocaleString('ar-SA')} ريال
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reservation Info */}
            {isReserved && vehicle.reservedBy && (
              <Card className="glass-card border-yellow-200 dark:border-yellow-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-6 h-6 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">محجوز من قبل</p>
                      <p className="text-yellow-600 dark:text-yellow-400">{vehicle.reservedBy}</p>
                      {vehicle.reservationDate && (
                        <p className="text-xs text-yellow-500 dark:text-yellow-500">
                          {new Date(vehicle.reservationDate).toLocaleDateString('ar-SA')}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detailed Specifications */}
            {vehicle.detailedSpecifications && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="w-5 h-5 text-orange-600" />
                    المواصفات التفصيلية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                      {vehicle.detailedSpecifications}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleShare(vehicle)}
                  variant="outline"
                  className="bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  مشاركة
                </Button>

                {canReserve && (
                  <Button
                    onClick={() => handleReserve(vehicle)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    حجز
                  </Button>
                )}

                {canSell && ['admin', 'manager'].includes(userRole) && (
                  <Button
                    onClick={() => handleSell(vehicle)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    بيع المركبة
                  </Button>
                )}

                {isReserved && vehicle.reservedBy === username && (
                  <Button
                    onClick={() => handleCancelReservation(vehicle)}
                    variant="outline"
                    disabled={cancelingReservationId === vehicle.id}
                    className="bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300"
                  >
                    {cancelingReservationId === vehicle.id ? (
                      <div className="animate-spin w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full mr-2" />
                    ) : (
                      <X className="w-4 h-4 mr-2" />
                    )}
                    إلغاء الحجز
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reservation Dialog */}
      <ReservationDialog
        open={reserveDialogOpen}
        onOpenChange={setReserveDialogOpen}
        item={vehicle}
        onSuccess={() => {
          if (vehicle) {
            reserveMutation.mutate(vehicle);
          }
        }}
        username={username}
      />

      {/* Sale Dialog */}
      {vehicle && (
        <EnhancedSaleDialog
          isOpen={sellDialogOpen}
          onClose={() => setSellDialogOpen(false)}
          onConfirm={(saleData) => {
            // Handle sale confirmation here
            console.log('Sale data:', saleData);
            setSellDialogOpen(false);
            setSellingItemId(null);
            queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
            onClose(); // Close the vehicle data dialog after sale
          }}
          vehicleData={{
            id: vehicle.id,
            manufacturer: vehicle.manufacturer,
            category: vehicle.category,
            year: vehicle.year,
            chassisNumber: vehicle.chassisNumber,
            customerName: vehicle.customerName || undefined,
            customerPhone: vehicle.customerPhone || undefined,
            salesRepresentative: vehicle.salesRepresentative || undefined,
            reservationDate: vehicle.reservationDate ? vehicle.reservationDate.toString() : undefined,
            reservationNote: vehicle.reservationNote || undefined
          }}
          isLoading={false}
        />
      )}

      {/* Share Dialog */}
      <VehicleShare
        vehicle={vehicle}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />
    </>
  );
}