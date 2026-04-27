import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import SystemGlassWrapper from "@/components/system-glass-wrapper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  Car,
  User,
  Building,
} from "lucide-react";

interface Quotation {
  id: number;
  quoteNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  manufacturer: string;
  category: string;
  trimLevel?: string;
  year: number;
  chassisNumber: string;
  basePrice: string;
  finalPrice: string;
  status: string;
  validUntil?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  companyData?: string;
  representativeData?: string;
  pricingDetails?: string;
}

export default function QuotationManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showQuotationDialog, setShowQuotationDialog] = useState(false);

  // Fetch quotations
  const { data: quotations = [], isLoading } = useQuery<Quotation[]>({
    queryKey: ["/api/quotations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/quotations");
      return response.json();
    },
  });

  // Update quotation mutation
  const updateQuotationMutation = useMutation({
    mutationFn: (data: { id: number; updates: Partial<Quotation> }) =>
      apiRequest("PUT", `/api/quotations/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات العرض",
      });
    },
    onError: (error) => {
      console.error("Error updating quotation:", error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث العرض",
        variant: "destructive",
      });
    },
  });

  // Delete quotation mutation
  const deleteQuotationMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/quotations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف العرض",
      });
    },
    onError: (error) => {
      console.error("Error deleting quotation:", error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف العرض",
        variant: "destructive",
      });
    },
  });

  // Filter quotations
  const filteredQuotations = (quotations as Quotation[]).filter((quotation: Quotation) => {
    const matchesSearch = searchTerm === "" || 
      quotation.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.chassisNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || quotation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Status badge color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case "مسودة":
        return "bg-gray-100 text-gray-800";
      case "مرسل":
        return "bg-blue-100 text-blue-800";
      case "مقبول":
        return "bg-green-100 text-green-800";
      case "مرفوض":
        return "bg-red-100 text-red-800";
      case "منتهي الصلاحية":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPrice = (price: string) => {
    return parseFloat(price).toLocaleString("ar-SA") + " ريال";
  };

  const handleViewQuotation = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setShowQuotationDialog(true);
  };

  const handleEditQuotation = (quotation: Quotation) => {
    // Store quotation data in localStorage for the creation page to pick up
    localStorage.setItem('editingQuotation', JSON.stringify(quotation));
    // Navigate to quotation creation page
    window.location.href = `/quotation-creation`;
  };

  const handleDeleteQuotation = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا العرض؟")) {
      deleteQuotationMutation.mutate(id);
    }
  };

  const handleUpdateStatus = (id: number, newStatus: string) => {
    updateQuotationMutation.mutate({
      id,
      updates: { status: newStatus }
    });
  };

  if (isLoading) {
    return (
      <SystemGlassWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-4 text-white drop-shadow-lg">جاري تحميل العروض...</p>
          </div>
        </div>
      </SystemGlassWrapper>
    );
  }

  return (
    <SystemGlassWrapper>
      <div className="min-h-screen" dir="rtl">
        {/* Header */}
        <div className="glass-header border-white/20 dark:border-slate-700/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-reverse space-x-4">
                <FileText className="h-8 w-8 text-white drop-shadow-lg" />
                <div>
                  <h1 className="text-xl font-bold text-white drop-shadow-lg">
                    إدارة العروض المحفوظة
                  </h1>
                  <p className="text-sm text-white/80 drop-shadow-lg">
                    عرض وإدارة جميع عروض الأسعار المحفوظة
                  </p>
                </div>
              </div>
              <div className="flex space-x-reverse space-x-3">
                <Link href="/quotation-creation">
                  <Button className="glass-button bg-blue-600/80 hover:bg-blue-700/80 text-white border-white/20">
                    <Plus className="h-4 w-4 ml-2" />
                    عرض جديد
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-container p-4">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-white drop-shadow-lg">إجمالي العروض</h3>
              <FileText className="h-4 w-4 text-white drop-shadow-lg" />
            </div>
            <div className="text-2xl font-bold text-white drop-shadow-lg">{(quotations as Quotation[]).length}</div>
          </div>
          <div className="glass-container p-4">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-white drop-shadow-lg">مسودات</h3>
              <Edit className="h-4 w-4 text-white drop-shadow-lg" />
            </div>
            <div className="text-2xl font-bold text-white drop-shadow-lg">
              {(quotations as Quotation[]).filter((q: Quotation) => q.status === "مسودة").length}
            </div>
          </div>
          <div className="glass-container p-4">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-white drop-shadow-lg">مرسلة</h3>
              <Mail className="h-4 w-4 text-white drop-shadow-lg" />
            </div>
            <div className="text-2xl font-bold text-white drop-shadow-lg">
              {(quotations as Quotation[]).filter((q: Quotation) => q.status === "مرسل").length}
            </div>
          </div>
          <div className="glass-container p-4">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-white drop-shadow-lg">مقبولة</h3>
              <DollarSign className="h-4 w-4 text-green-400 drop-shadow-lg" />
            </div>
            <div className="text-2xl font-bold text-white drop-shadow-lg">
              {(quotations as Quotation[]).filter((q: Quotation) => q.status === "مقبول").length}
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="glass-container p-6 mb-6">
          <h2 className="flex items-center text-lg font-semibold text-white drop-shadow-lg mb-4">
            <Search className="h-5 w-5 ml-2" />
            البحث والتصفية
          </h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-white drop-shadow-lg mb-2">البحث</label>
              <Input
                id="search"
                placeholder="البحث برقم العرض، اسم العميل، الصانع، أو رقم الهيكل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div className="w-full md:w-48">
              <label htmlFor="status-filter" className="block text-sm font-medium text-white drop-shadow-lg mb-2">حالة العرض</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="glass-input bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="مسودة">مسودة</SelectItem>
                  <SelectItem value="مرسل">مرسل</SelectItem>
                  <SelectItem value="مقبول">مقبول</SelectItem>
                  <SelectItem value="مرفوض">مرفوض</SelectItem>
                  <SelectItem value="منتهي الصلاحية">منتهي الصلاحية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Quotations Table */}
        <div className="glass-container">
          <div className="p-6 border-b border-white/20">
            <h2 className="text-lg font-semibold text-white drop-shadow-lg">العروض المحفوظة</h2>
            <p className="text-sm text-white/80 drop-shadow-lg mt-1">
              عدد العروض الظاهرة: {filteredQuotations.length} من أصل {(quotations as Quotation[]).length}
            </p>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right text-white drop-shadow-lg font-semibold">رقم العرض</TableHead>
                    <TableHead className="text-right text-white drop-shadow-lg font-semibold">العميل</TableHead>
                    <TableHead className="text-right text-white drop-shadow-lg font-semibold">المركبة</TableHead>
                    <TableHead className="text-right text-white drop-shadow-lg font-semibold">السعر النهائي</TableHead>
                    <TableHead className="text-right text-white drop-shadow-lg font-semibold">الحالة</TableHead>
                    <TableHead className="text-right text-white drop-shadow-lg font-semibold">تاريخ الإنشاء</TableHead>
                    <TableHead className="text-right text-white drop-shadow-lg font-semibold">صالح حتى</TableHead>
                    <TableHead className="text-right text-white drop-shadow-lg font-semibold">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.map((quotation: Quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell className="font-medium text-white drop-shadow-lg">
                        {quotation.quoteNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-white drop-shadow-lg">{quotation.customerName}</div>
                          {quotation.customerPhone && (
                            <div className="text-sm text-white/70 drop-shadow-lg">{quotation.customerPhone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-white drop-shadow-lg">
                            {quotation.manufacturer} {quotation.category}
                          </div>
                          <div className="text-sm text-white/70 drop-shadow-lg">
                            {quotation.year} - {quotation.chassisNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-white drop-shadow-lg">
                        {formatPrice(quotation.finalPrice)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(quotation.status)}>
                          {quotation.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white drop-shadow-lg">
                        {formatDate(quotation.createdAt)}
                      </TableCell>
                      <TableCell className="text-white drop-shadow-lg">
                        {quotation.validUntil ? formatDate(quotation.validUntil) : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewQuotation(quotation)}
                            className="glass-button border-white/20 text-white hover:bg-white/10"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditQuotation(quotation)}
                            className="glass-button border-white/20 text-white hover:bg-white/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteQuotation(quotation.id)}
                            className="glass-button border-red-300/20 text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
              {filteredQuotations.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-white/40 drop-shadow-lg mx-auto mb-4" />
                  <p className="text-white/70 drop-shadow-lg">لم يتم العثور على عروض</p>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Quotation Details Dialog */}
      <Dialog open={showQuotationDialog} onOpenChange={setShowQuotationDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل العرض</DialogTitle>
            <DialogDescription>
              عرض تفاصيل العرض رقم {selectedQuotation?.quoteNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedQuotation && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">معلومات العرض</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">رقم العرض:</span>
                      <span>{selectedQuotation.quoteNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">الحالة:</span>
                      <Badge className={getStatusColor(selectedQuotation.status)}>
                        {selectedQuotation.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">تاريخ الإنشاء:</span>
                      <span>{formatDate(selectedQuotation.createdAt)}</span>
                    </div>
                    {selectedQuotation.validUntil && (
                      <div className="flex justify-between">
                        <span className="font-medium">صالح حتى:</span>
                        <span>{formatDate(selectedQuotation.validUntil)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">معلومات العميل</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">اسم العميل:</span>
                      <span>{selectedQuotation.customerName}</span>
                    </div>
                    {selectedQuotation.customerPhone && (
                      <div className="flex justify-between">
                        <span className="font-medium">الهاتف:</span>
                        <span>{selectedQuotation.customerPhone}</span>
                      </div>
                    )}
                    {selectedQuotation.customerEmail && (
                      <div className="flex justify-between">
                        <span className="font-medium">البريد الإلكتروني:</span>
                        <span>{selectedQuotation.customerEmail}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Vehicle Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">معلومات المركبة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="font-medium">الصانع:</span>
                      <span>{selectedQuotation.manufacturer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">الفئة:</span>
                      <span>{selectedQuotation.category}</span>
                    </div>
                    {selectedQuotation.trimLevel && (
                      <div className="flex justify-between">
                        <span className="font-medium">درجة التجهيز:</span>
                        <span>{selectedQuotation.trimLevel}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="font-medium">السنة:</span>
                      <span>{selectedQuotation.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">رقم الهيكل:</span>
                      <span>{selectedQuotation.chassisNumber}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">معلومات التسعير</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="font-medium">السعر الأساسي:</span>
                      <span>{formatPrice(selectedQuotation.basePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">السعر النهائي:</span>
                      <span className="font-bold text-lg">{formatPrice(selectedQuotation.finalPrice)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {selectedQuotation.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">الملاحظات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300">
                      {selectedQuotation.notes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button
                  variant="outline"
                  onClick={() => setShowQuotationDialog(false)}
                >
                  إغلاق
                </Button>
                <Button
                  onClick={() => handleEditQuotation(selectedQuotation)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Edit className="h-4 w-4 ml-2" />
                  تعديل
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </SystemGlassWrapper>
  );
}