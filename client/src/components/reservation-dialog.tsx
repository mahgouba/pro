import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Phone, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { InventoryItem } from "@shared/schema";

interface ReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: InventoryItem;
  onSuccess: () => void;
  username?: string; // Add username to auto-assign sales representative
}

export function ReservationDialog({ open, onOpenChange, item, onSuccess, username }: ReservationDialogProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [salesRepresentative, setSalesRepresentative] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [reservationNote, setReservationNote] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      resetForm();
    } else if (open && username) {
      // Auto-assign sales representative when dialog opens
      setSalesRepresentative(username);
    }
  }, [open, username]);

  const reserveMutation = useMutation({
    mutationFn: async (data: {
      customerName: string;
      customerPhone: string;
      salesRepresentative: string;
      paidAmount: string;
      reservationNote: string;
    }) => {
      if (!item) throw new Error("No item selected");
      return apiRequest("PUT", `/api/inventory/${item.id}/reserve`, data);
    },
    onSuccess: () => {
      toast({
        title: "تم الحجز بنجاح",
        description: "تم حجز السيارة وحفظ بيانات العميل",
      });
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "فشل في الحجز",
        description: error.message || "حدث خطأ أثناء حجز السيارة",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setSalesRepresentative("");
    setPaidAmount("");
    setReservationNote("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName.trim() || !customerPhone.trim() || !salesRepresentative.trim() || !paidAmount.trim()) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال اسم العميل ورقم الجوال ومندوب المبيعات والمبلغ المدفوع",
        variant: "destructive",
      });
      return;
    }

    reserveMutation.mutate({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      salesRepresentative: salesRepresentative.trim(),
      paidAmount: paidAmount.trim(),
      reservationNote: reservationNote.trim(),
    });
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">حجز السيارة</DialogTitle>
          <DialogDescription className="text-right text-sm text-slate-600">
            أدخل بيانات العميل لحجز هذه السيارة
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-sm text-slate-600 text-right">
              {item.manufacturer} {item.category} - {item.year} - {item.exteriorColor}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName" className="flex items-center gap-2 justify-end">
                <span>اسم العميل</span>
                <User className="w-4 h-4" />
              </Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="أدخل اسم العميل"
                required
                className="text-right"
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone" className="flex items-center gap-2 justify-end">
                <span>رقم الجوال</span>
                <Phone className="w-4 h-4" />
              </Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="أدخل رقم جوال العميل"
                required
                className="text-right"
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salesRepresentative" className="flex items-center gap-2 justify-end">
                <span>مندوب المبيعات</span>
                <User className="w-4 h-4" />
              </Label>
              <Input
                id="salesRepresentative"
                value={salesRepresentative}
                onChange={(e) => setSalesRepresentative(e.target.value)}
                placeholder="أدخل اسم مندوب المبيعات"
                required
                className="text-right"
                dir="rtl"
                readOnly={!!username} // Make readonly if username is provided
                style={username ? { backgroundColor: '#f1f5f9' } : {}}
              />
              {username && (
                <p className="text-xs text-gray-500 text-right">
                  تم تعيين مندوب المبيعات تلقائياً
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidAmount" className="flex items-center gap-2 justify-end">
                <span>المبلغ المدفوع (ريال)</span>
                <DollarSign className="w-4 h-4" />
              </Label>
              <Input
                id="paidAmount"
                type="number"
                min="0"
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="أدخل المبلغ المدفوع"
                required
                className="text-right"
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservationNote" className="text-right block">
                ملاحظات (اختياري)
              </Label>
              <Textarea
                id="reservationNote"
                value={reservationNote}
                onChange={(e) => setReservationNote(e.target.value)}
                placeholder="أدخل أي ملاحظات إضافية"
                className="text-right"
                dir="rtl"
                rows={3}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={reserveMutation.isPending}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={reserveMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {reserveMutation.isPending ? "جاري الحجز..." : "تأكيد الحجز"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}