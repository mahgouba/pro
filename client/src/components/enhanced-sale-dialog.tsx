import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, DollarSign, User, Phone, Car, ShoppingCart } from "lucide-react";

interface EnhancedSaleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (saleData: {
    salePrice: string;
    saleDate: string;
    customerName: string;
    customerPhone: string;
    salesRepresentative: string;
    saleNotes: string;
  }) => void;
  vehicleData: {
    id: number;
    manufacturer: string;
    category: string;
    year: number;
    chassisNumber: string;
    customerName?: string;
    customerPhone?: string;
    salesRepresentative?: string;
    reservationDate?: string;
    reservationNote?: string;
  };
  isLoading?: boolean;
}

export function EnhancedSaleDialog({
  isOpen,
  onClose,
  onConfirm,
  vehicleData,
  isLoading = false
}: EnhancedSaleDialogProps) {
  const [salePrice, setSalePrice] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]); // Gregorian date
  const [customerName, setCustomerName] = useState(vehicleData.customerName || "");
  const [customerPhone, setCustomerPhone] = useState(vehicleData.customerPhone || "");
  const [salesRepresentative, setSalesRepresentative] = useState(vehicleData.salesRepresentative || "");
  const [saleNotes, setSaleNotes] = useState("");

  const handleSubmit = () => {
    if (!salePrice.trim()) {
      alert("يرجى إدخال سعر البيع");
      return;
    }

    onConfirm({
      salePrice: salePrice.trim(),
      saleDate,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      salesRepresentative: salesRepresentative.trim(),
      saleNotes: saleNotes.trim()
    });
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "غير محدد";
    return new Date(dateString).toLocaleDateString('en-US'); // Use Gregorian calendar
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <ShoppingCart className="w-5 h-5" />
            تأكيد بيع السيارة
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vehicle Information */}
          <div className="dark:bg-blue-900/20 p-4 rounded-lg bg-[#eff6ff00]">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
              <Car className="w-4 h-4" />
              بيانات السيارة
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">الصانع:</span> {vehicleData.manufacturer}
              </div>
              <div>
                <span className="font-medium">الفئة:</span> {vehicleData.category}
              </div>
              <div>
                <span className="font-medium">السنة:</span> {vehicleData.year}
              </div>
              <div>
                <span className="font-medium">رقم الهيكل:</span> {vehicleData.chassisNumber}
              </div>
            </div>
          </div>

          {/* Existing Reservation Data */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              بيانات الحجز السابقة
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">تاريخ الحجز:</span> {formatDate(vehicleData.reservationDate)}
              </div>
              {vehicleData.reservationNote && (
                <div className="md:col-span-2">
                  <span className="font-medium">ملاحظات الحجز:</span> {vehicleData.reservationNote}
                </div>
              )}
            </div>
          </div>

          {/* Sale Information Form */}
          <div className="space-y-4">
            <h3 className="font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              بيانات البيع
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salePrice">سعر البيع *</Label>
                <Input
                  id="salePrice"
                  type="number"
                  placeholder="أدخل سعر البيع بالريال السعودي"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="text-right"
                />
              </div>

              <div>
                <Label htmlFor="saleDate">تاريخ إتمام البيع (ميلادي) *</Label>
                <Input
                  id="saleDate"
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">اسم العميل</Label>
                <Input
                  id="customerName"
                  placeholder="اسم العميل"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="text-right"
                />
              </div>

              <div>
                <Label htmlFor="customerPhone">رقم هاتف العميل</Label>
                <Input
                  id="customerPhone"
                  placeholder="رقم الهاتف"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="text-right"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="salesRepresentative">مندوب المبيعات</Label>
              <Input
                id="salesRepresentative"
                placeholder="اسم مندوب المبيعات"
                value={salesRepresentative}
                onChange={(e) => setSalesRepresentative(e.target.value)}
                className="text-right"
              />
            </div>

            <div>
              <Label htmlFor="saleNotes">ملاحظات البيع</Label>
              <Textarea
                id="saleNotes"
                placeholder="أي ملاحظات إضافية حول عملية البيع..."
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
                className="text-right"
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !salePrice.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? "جاري البيع..." : "تأكيد البيع"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}