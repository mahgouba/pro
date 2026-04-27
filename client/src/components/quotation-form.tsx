import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, FileText, User, Phone, Mail } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface InventoryItem {
  id: number;
  manufacturer: string;
  category: string;
  trimLevel?: string;
  year: number;
  exteriorColor: string;
  interiorColor: string;
  chassisNumber: string;
  engineCapacity: string;
  price?: string;
  notes?: string;
}

interface Specification {
  id: number;
  manufacturer: string;
  category: string;
  trimLevel: string;
  year: number;
  engineCapacity: string;
  detailedDescription: string;
}

interface QuotationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleData: InventoryItem;
}

export default function QuotationForm({ open, onOpenChange, vehicleData }: QuotationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [specifications, setSpecifications] = useState("");

  // Fetch specifications for this vehicle
  const { data: vehicleSpecs } = useQuery<Specification>({
    queryKey: ['/api/specifications', vehicleData?.manufacturer, vehicleData?.category, vehicleData?.trimLevel, vehicleData?.year, vehicleData?.engineCapacity],
    enabled: open && !!vehicleData,
    queryFn: async () => {
      if (!vehicleData) return null;
      
      const response = await fetch(
        `/api/specifications/${vehicleData.manufacturer}/${vehicleData.category}/${vehicleData.trimLevel || 'null'}/${vehicleData.year}/${vehicleData.engineCapacity}`
      );
      
      if (response.ok) {
        return response.json();
      }
      return null;
    }
  });

  // Initialize specifications when vehicle specs are loaded
  useEffect(() => {
    if (vehicleSpecs?.detailedDescription) {
      setSpecifications(vehicleSpecs.detailedDescription);
    } else {
      // Fallback specifications based on vehicle data
      const fallbackSpecs = `
السيارة: ${vehicleData?.manufacturer} ${vehicleData?.category}
${vehicleData?.trimLevel ? `درجة التجهيز: ${vehicleData.trimLevel}` : ''}
الموديل: ${vehicleData?.year}
سعة المحرك: ${vehicleData?.engineCapacity}
اللون الخارجي: ${vehicleData?.exteriorColor}
اللون الداخلي: ${vehicleData?.interiorColor}
رقم الهيكل: ${vehicleData?.chassisNumber}
      `.trim();
      setSpecifications(fallbackSpecs);
    }
  }, [vehicleSpecs, vehicleData]);

  // Initialize price if available
  useEffect(() => {
    if (vehicleData?.price) {
      setBasePrice(vehicleData.price);
      setFinalPrice(vehicleData.price);
    }
  }, [vehicleData]);

  // Set default valid until date (30 days from now)
  useEffect(() => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const formattedDate = futureDate.toISOString().split('T')[0];
    setValidUntil(formattedDate);
  }, []);

  const createQuotationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/quotations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "تم إنشاء عرض السعر بنجاح",
        description: "تم حفظ عرض السعر في قاعدة البيانات",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quotations'] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "فشل في إنشاء عرض السعر",
        description: error.message || "حدث خطأ أثناء إنشاء عرض السعر",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!customerName.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "اسم العميل مطلوب",
        variant: "destructive",
      });
      return;
    }

    if (!basePrice.trim() || !finalPrice.trim()) {
      toast({
        title: "خطأ في البيانات", 
        description: "السعر الأساسي والنهائي مطلوبان",
        variant: "destructive",
      });
      return;
    }

    if (!validUntil) {
      toast({
        title: "خطأ في البيانات",
        description: "تاريخ انتهاء الصلاحية مطلوب",
        variant: "destructive",
      });
      return;
    }

    const quotationData = {
      inventoryItemId: vehicleData.id,
      manufacturer: vehicleData.manufacturer,
      category: vehicleData.category,
      trimLevel: vehicleData.trimLevel || null,
      year: vehicleData.year,
      exteriorColor: vehicleData.exteriorColor,
      interiorColor: vehicleData.interiorColor,
      chassisNumber: vehicleData.chassisNumber,
      engineCapacity: vehicleData.engineCapacity,
      specifications: specifications,
      basePrice: basePrice,
      finalPrice: finalPrice,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || null,
      customerEmail: customerEmail.trim() || null,
      notes: notes.trim() || null,
      validUntil: new Date(validUntil).toISOString(),
      status: "مسودة",
      createdBy: "النظام", // This would normally be the current user
    };

    createQuotationMutation.mutate(quotationData);
  };

  const handleClose = () => {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setBasePrice("");
    setFinalPrice("");
    setNotes("");
    setSpecifications("");
    onOpenChange(false);
  };

  if (!vehicleData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            إنشاء عرض سعر - {vehicleData.manufacturer} {vehicleData.category}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                بيانات المركبة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">الصانع:</span> {vehicleData.manufacturer}
                </div>
                <div>
                  <span className="font-semibold">الفئة:</span> {vehicleData.category}
                </div>
                {vehicleData.trimLevel && (
                  <div>
                    <span className="font-semibold">درجة التجهيز:</span> {vehicleData.trimLevel}
                  </div>
                )}
                <div>
                  <span className="font-semibold">الموديل:</span> {vehicleData.year}
                </div>
                <div>
                  <span className="font-semibold">سعة المحرك:</span> {vehicleData.engineCapacity}
                </div>
                <div>
                  <span className="font-semibold">اللون الخارجي:</span> {vehicleData.exteriorColor}
                </div>
                <div>
                  <span className="font-semibold">اللون الداخلي:</span> {vehicleData.interiorColor}
                </div>
                <div className="col-span-2">
                  <span className="font-semibold">رقم الهيكل:</span> {vehicleData.chassisNumber}
                </div>
              </div>

              <div className="mt-4">
                <Label>المواصفات التفصيلية</Label>
                <Textarea
                  value={specifications}
                  onChange={(e) => setSpecifications(e.target.value)}
                  rows={6}
                  className="mt-1"
                  placeholder="أدخل المواصفات التفصيلية للمركبة..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer and Pricing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                بيانات العميل والتسعير
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  اسم العميل *
                </Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="أدخل اسم العميل"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  رقم الهاتف
                </Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="أدخل رقم الهاتف"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  البريد الإلكتروني
                </Label>
                <Input
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="أدخل البريد الإلكتروني"
                  type="email"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>السعر الأساسي *</Label>
                  <Input
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>السعر النهائي *</Label>
                  <Input
                    value={finalPrice}
                    onChange={(e) => setFinalPrice(e.target.value)}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  صالح حتى *
                </Label>
                <Input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>ملاحظات إضافية</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1"
                  placeholder="ملاحظات أو شروط إضافية..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={handleClose}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createQuotationMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {createQuotationMutation.isPending ? "جاري الحفظ..." : "إنشاء عرض السعر"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}