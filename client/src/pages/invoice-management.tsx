import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  CreditCard,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  Car,
  User,
  Building,
} from "lucide-react";

interface Invoice {
  id: number;
  invoiceNumber: string;
  quoteNumber?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  manufacturer: string;
  category: string;
  year: number;
  chassisNumber: string;
  basePrice: string;
  finalPrice: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  paidAmount?: string;
  remainingAmount?: string;
  dueDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  companyData?: string;
  representativeData?: string;
  pricingDetails?: string;
}

export default function InvoiceManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  // Fetch invoices
  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/invoices");
      return response.json();
    },
  });

  // Update invoice mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: (data: { id: number; updates: Partial<Invoice> }) =>
      apiRequest("PUT", `/api/invoices/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات الفاتورة",
      });
    },
    onError: (error) => {
      console.error("Error updating invoice:", error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث الفاتورة",
        variant: "destructive",
      });
    },
  });

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف الفاتورة",
      });
    },
    onError: (error) => {
      console.error("Error deleting invoice:", error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف الفاتورة",
        variant: "destructive",
      });
    },
  });

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.chassisNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || invoice.paymentStatus === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "مسودة": return "bg-gray-100 text-gray-800";
      case "مرسل": return "bg-blue-100 text-blue-800";
      case "مدفوع": return "bg-green-100 text-green-800";
      case "ملغى": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Get payment status badge color
  const getPaymentBadgeColor = (status: string) => {
    switch (status) {
      case "غير مدفوع": return "bg-red-100 text-red-800";
      case "مدفوع جزئي": return "bg-yellow-100 text-yellow-800";
      case "مدفوع كامل": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Handle payment update
  const handlePaymentUpdate = () => {
    if (!selectedInvoice || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    const finalPrice = parseFloat(selectedInvoice.finalPrice);
    const currentPaid = parseFloat(selectedInvoice.paidAmount || "0");
    const newPaidAmount = currentPaid + amount;
    const newRemainingAmount = finalPrice - newPaidAmount;

    let paymentStatus = "غير مدفوع";
    if (newRemainingAmount <= 0) {
      paymentStatus = "مدفوع كامل";
    } else if (newPaidAmount > 0) {
      paymentStatus = "مدفوع جزئي";
    }

    updateInvoiceMutation.mutate({
      id: selectedInvoice.id,
      updates: {
        paidAmount: newPaidAmount.toString(),
        remainingAmount: Math.max(0, newRemainingAmount).toString(),
        paymentStatus,
        paymentMethod: paymentMethod || selectedInvoice.paymentMethod,
        status: paymentStatus === "مدفوع كامل" ? "مدفوع" : selectedInvoice.status,
      },
    });

    setShowPaymentDialog(false);
    setPaymentAmount("");
    setPaymentMethod("");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">إدارة الفواتير</h1>
          <p className="text-gray-600 mt-2">إدارة فواتير المبيعات والدفعات</p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="ml-2" size={20} />
            البحث والتصفية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">البحث</Label>
              <Input
                id="search"
                type="text"
                placeholder="رقم الفاتورة، اسم العميل، رقم الهيكل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="statusFilter">حالة الفاتورة</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="مسودة">مسودة</SelectItem>
                  <SelectItem value="مرسل">مرسل</SelectItem>
                  <SelectItem value="مدفوع">مدفوع</SelectItem>
                  <SelectItem value="ملغى">ملغى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="paymentFilter">حالة الدفع</Label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر حالة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="غير مدفوع">غير مدفوع</SelectItem>
                  <SelectItem value="مدفوع جزئي">مدفوع جزئي</SelectItem>
                  <SelectItem value="مدفوع كامل">مدفوع كامل</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPaymentFilter("all");
                }}
                variant="outline"
                className="w-full"
              >
                مسح المرشحات
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>الفواتير ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الفاتورة</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>السيارة</TableHead>
                  <TableHead>المبلغ النهائي</TableHead>
                  <TableHead>حالة الفاتورة</TableHead>
                  <TableHead>حالة الدفع</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                      {invoice.quoteNumber && (
                        <div className="text-xs text-gray-500 mt-1">
                          من العرض: {invoice.quoteNumber}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{invoice.customerName}</span>
                        {invoice.customerPhone && (
                          <span className="text-xs text-gray-500 flex items-center mt-1">
                            <Phone size={10} className="ml-1" />
                            {invoice.customerPhone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {invoice.manufacturer} {invoice.category}
                        </span>
                        <span className="text-xs text-gray-500">{invoice.year}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-green-600">
                          {parseFloat(invoice.finalPrice).toLocaleString()} ريال
                        </span>
                        {invoice.paidAmount && parseFloat(invoice.paidAmount) > 0 && (
                          <span className="text-xs text-gray-500">
                            مدفوع: {parseFloat(invoice.paidAmount).toLocaleString()} ريال
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPaymentBadgeColor(invoice.paymentStatus)}>
                        {invoice.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.createdAt).toLocaleDateString("ar-SA")}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2 space-x-reverse">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowInvoiceDialog(true);
                          }}
                        >
                          <Eye size={14} className="ml-1" />
                          عرض
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowPaymentDialog(true);
                          }}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CreditCard size={14} className="ml-1" />
                          دفع
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteInvoiceMutation.mutate(invoice.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={14} className="ml-1" />
                          حذف
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Details Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل الفاتورة</DialogTitle>
            <DialogDescription>
              {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">بيانات الفاتورة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="font-medium">رقم الفاتورة: </span>
                      <span>{selectedInvoice.invoiceNumber}</span>
                    </div>
                    {selectedInvoice.quoteNumber && (
                      <div>
                        <span className="font-medium">رقم العرض المرجعي: </span>
                        <span>{selectedInvoice.quoteNumber}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">الحالة: </span>
                      <Badge className={getStatusBadgeColor(selectedInvoice.status)}>
                        {selectedInvoice.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">حالة الدفع: </span>
                      <Badge className={getPaymentBadgeColor(selectedInvoice.paymentStatus)}>
                        {selectedInvoice.paymentStatus}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">تاريخ الإنشاء: </span>
                      <span>{new Date(selectedInvoice.createdAt).toLocaleDateString("ar-SA")}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">بيانات العميل</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="font-medium">الاسم: </span>
                      <span>{selectedInvoice.customerName}</span>
                    </div>
                    {selectedInvoice.customerPhone && (
                      <div>
                        <span className="font-medium">الهاتف: </span>
                        <span>{selectedInvoice.customerPhone}</span>
                      </div>
                    )}
                    {selectedInvoice.customerEmail && (
                      <div>
                        <span className="font-medium">البريد الإلكتروني: </span>
                        <span>{selectedInvoice.customerEmail}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Vehicle Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">بيانات السيارة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">الصانع: </span>
                      <span>{selectedInvoice.manufacturer}</span>
                    </div>
                    <div>
                      <span className="font-medium">الفئة: </span>
                      <span>{selectedInvoice.category}</span>
                    </div>
                    <div>
                      <span className="font-medium">السنة: </span>
                      <span>{selectedInvoice.year}</span>
                    </div>
                    <div>
                      <span className="font-medium">رقم الهيكل: </span>
                      <span>{selectedInvoice.chassisNumber}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">بيانات الدفع</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">السعر الأساسي: </span>
                      <span>{parseFloat(selectedInvoice.basePrice).toLocaleString()} ريال</span>
                    </div>
                    <div>
                      <span className="font-medium">المبلغ النهائي: </span>
                      <span className="text-green-600 font-bold">
                        {parseFloat(selectedInvoice.finalPrice).toLocaleString()} ريال
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">المبلغ المدفوع: </span>
                      <span className="text-blue-600">
                        {parseFloat(selectedInvoice.paidAmount || "0").toLocaleString()} ريال
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">المبلغ المتبقي: </span>
                      <span className="text-red-600">
                        {parseFloat(selectedInvoice.remainingAmount || "0").toLocaleString()} ريال
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {selectedInvoice.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">الملاحظات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{selectedInvoice.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة دفعة</DialogTitle>
            <DialogDescription>
              تسجيل دفعة جديدة للفاتورة {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">المبلغ النهائي: </span>
                  <span className="text-green-600">
                    {parseFloat(selectedInvoice.finalPrice).toLocaleString()} ريال
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">المبلغ المدفوع: </span>
                  <span className="text-blue-600">
                    {parseFloat(selectedInvoice.paidAmount || "0").toLocaleString()} ريال
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">المبلغ المتبقي: </span>
                  <span className="text-red-600">
                    {parseFloat(selectedInvoice.remainingAmount || "0").toLocaleString()} ريال
                  </span>
                </p>
              </div>

              <div>
                <Label htmlFor="paymentAmount">مبلغ الدفعة *</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="أدخل مبلغ الدفعة"
                  min="0"
                  max={selectedInvoice.remainingAmount || "0"}
                />
              </div>

              <div>
                <Label htmlFor="paymentMethod">طريقة الدفع</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر طريقة الدفع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="نقدي">نقدي</SelectItem>
                    <SelectItem value="تحويل">تحويل بنكي</SelectItem>
                    <SelectItem value="شيك">شيك</SelectItem>
                    <SelectItem value="بطاقة">بطاقة ائتمان</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-2 space-x-reverse">
                <Button
                  onClick={handlePaymentUpdate}
                  disabled={!paymentAmount || updateInvoiceMutation.isPending}
                  className="flex-1"
                >
                  {updateInvoiceMutation.isPending ? "جاري التحديث..." : "تسجيل الدفعة"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentDialog(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}