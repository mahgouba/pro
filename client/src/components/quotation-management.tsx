import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar, 
  User, 
  Phone, 
  Mail,
  DollarSign,
  Car
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Quotation {
  id: number;
  quoteNumber: string;
  inventoryItemId: number;
  manufacturer: string;
  category: string;
  trimLevel?: string;
  year: number;
  exteriorColor: string;
  interiorColor: string;
  chassisNumber: string;
  engineCapacity: string;
  specifications?: string;
  basePrice: string;
  finalPrice: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
  validUntil: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface QuotationManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuotationManagement({ open, onOpenChange }: QuotationManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "view">("list");

  // Fetch all quotations
  const { data: quotations = [], isLoading } = useQuery<Quotation[]>({
    queryKey: ["/api/quotations"],
    enabled: open,
  });

  // Delete quotation mutation
  const deleteQuotationMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/quotations/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "تم حذف عرض السعر",
        description: "تم حذف عرض السعر بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quotations'] });
    },
    onError: (error: any) => {
      toast({
        title: "فشل في حذف عرض السعر",
        description: error.message || "حدث خطأ أثناء الحذف",
        variant: "destructive",
      });
    },
  });

  // Filter quotations based on search term
  const filteredQuotations = quotations.filter(quotation =>
    quotation.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.chassisNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group quotations by status
  const quotationsByStatus = {
    مسودة: filteredQuotations.filter(q => q.status === "مسودة"),
    مرسل: filteredQuotations.filter(q => q.status === "مرسل"),
    مقبول: filteredQuotations.filter(q => q.status === "مقبول"),
    مرفوض: filteredQuotations.filter(q => q.status === "مرفوض"),
  };

  const handleView = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setViewMode("view");
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف عرض السعر هذا؟")) {
      deleteQuotationMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "مسودة": return "bg-gray-100 text-gray-800";
      case "مرسل": return "bg-blue-100 text-blue-800";
      case "مقبول": return "bg-green-100 text-green-800";
      case "مرفوض": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(parseFloat(price));
  };

  if (viewMode === "view" && selectedQuotation) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold">
                عرض السعر - {selectedQuotation.quoteNumber}
              </DialogTitle>
              <Button 
                variant="outline" 
                onClick={() => setViewMode("list")}
              >
                العودة للقائمة
              </Button>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vehicle Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  بيانات المركبة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">الصانع:</span> {selectedQuotation.manufacturer}
                  </div>
                  <div>
                    <span className="font-semibold">الفئة:</span> {selectedQuotation.category}
                  </div>
                  {selectedQuotation.trimLevel && (
                    <div>
                      <span className="font-semibold">درجة التجهيز:</span> {selectedQuotation.trimLevel}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold">الموديل:</span> {selectedQuotation.year}
                  </div>
                  <div>
                    <span className="font-semibold">سعة المحرك:</span> {selectedQuotation.engineCapacity}
                  </div>
                  <div>
                    <span className="font-semibold">اللون الخارجي:</span> {selectedQuotation.exteriorColor}
                  </div>
                  <div>
                    <span className="font-semibold">اللون الداخلي:</span> {selectedQuotation.interiorColor}
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold">رقم الهيكل:</span> {selectedQuotation.chassisNumber}
                  </div>
                </div>

                {selectedQuotation.specifications && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="font-semibold mb-2">المواصفات التفصيلية:</div>
                    <div className="text-sm whitespace-pre-line">
                      {selectedQuotation.specifications}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer and Quote Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  بيانات العميل والعرض
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(selectedQuotation.status)}>
                    {selectedQuotation.status}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {selectedQuotation.quoteNumber}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-semibold">العميل:</span> {selectedQuotation.customerName}
                  </div>
                  
                  {selectedQuotation.customerPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span className="font-semibold">الهاتف:</span> {selectedQuotation.customerPhone}
                    </div>
                  )}
                  
                  {selectedQuotation.customerEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="font-semibold">البريد:</span> {selectedQuotation.customerEmail}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-semibold">السعر الأساسي:</span> {formatPrice(selectedQuotation.basePrice)}
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-semibold">السعر النهائي:</span> {formatPrice(selectedQuotation.finalPrice)}
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-semibold">صالح حتى:</span> {formatDate(selectedQuotation.validUntil)}
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-semibold">تاريخ الإنشاء:</span> {formatDate(selectedQuotation.createdAt)}
                  </div>
                </div>

                {selectedQuotation.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="font-semibold mb-2">ملاحظات:</div>
                    <div className="text-sm">{selectedQuotation.notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            إدارة عروض الأسعار
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="flex items-center gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث في عروض الأسعار..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        {/* Quotations Tabs */}
        <Tabs defaultValue="مسودة" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="مسودة">
              مسودات ({quotationsByStatus.مسودة.length})
            </TabsTrigger>
            <TabsTrigger value="مرسل">
              مرسلة ({quotationsByStatus.مرسل.length})
            </TabsTrigger>
            <TabsTrigger value="مقبول">
              مقبولة ({quotationsByStatus.مقبول.length})
            </TabsTrigger>
            <TabsTrigger value="مرفوض">
              مرفوضة ({quotationsByStatus.مرفوض.length})
            </TabsTrigger>
          </TabsList>

          {Object.entries(quotationsByStatus).map(([status, statusQuotations]) => (
            <TabsContent key={status} value={status} className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-slate-600 mt-2">جاري التحميل...</p>
                </div>
              ) : statusQuotations.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="text-sm text-slate-600 mt-2">
                    لا توجد عروض أسعار بحالة "{status}"
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {statusQuotations.map((quotation) => (
                    <Card key={quotation.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {quotation.manufacturer} {quotation.category} - {quotation.customerName}
                            </CardTitle>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline">{quotation.quoteNumber}</Badge>
                              <Badge variant="outline">{quotation.year}</Badge>
                              <Badge className={getStatusColor(quotation.status)}>
                                {quotation.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleView(quotation)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(quotation.id)}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-semibold">رقم الهيكل:</span> {quotation.chassisNumber}
                          </div>
                          <div>
                            <span className="font-semibold">السعر النهائي:</span> {formatPrice(quotation.finalPrice)}
                          </div>
                          <div>
                            <span className="font-semibold">صالح حتى:</span> {formatDate(quotation.validUntil)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}