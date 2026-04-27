import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft,
  FileText, 
  Settings, 
  Building2, 
  User, 
  Save,
  Eye,
  Upload,
  Plus,
  Edit3,
  Trash2,
  Search,
  Calculator,
  Printer,
  Download,
  FileDown,
  MessageCircle,
  FileUp,
  Settings2
} from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";

import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import type { InventoryItem, Specification, InsertQuotation, Company, TermsAndConditions } from "@shared/schema";
import { numberToArabic } from "@/utils/number-to-arabic";
import { generateQuoteNumber } from "@/utils/serial-number";
import { convertArabicToEnglishNumerals } from "@/utils/numeral-converter";
import QuotationA4Preview from "@/components/quotation-a4-preview";
import CompanyManagement from "@/components/company-management";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface QuotationEditPageProps {}

export default function QuotationEditPage({}: QuotationEditPageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/quotation-edit/:id");
  const quotationId = params?.id;

  // Load quotation data
  const { data: quotation, isLoading: quotationLoading } = useQuery({
    queryKey: ['/api/quotations', quotationId],
    enabled: !!quotationId,
  });

  // Theme state
  const companyLogo = null;
  
  // Management states
  const [showA4Preview, setShowA4Preview] = useState(false);
  const [showCompanyManagement, setShowCompanyManagement] = useState(false);
  const [showWhatsappDialog, setShowWhatsappDialog] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("+966");
  const [companyStamp, setCompanyStamp] = useState<string>("");
  
  // Form states - will be populated from quotation data
  const [quoteNumber, setQuoteNumber] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [validityDays, setValidityDays] = useState<number>(30);
  const [notes, setNotes] = useState<string>("");
  
  // Representative selection
  const [selectedRepresentative, setSelectedRepresentative] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  
  // Available representatives
  const representatives = [
    { id: "1", name: "أحمد محمد", phone: "01234567890", email: "ahmed@company.com", position: "مندوب مبيعات أول" },
    { id: "2", name: "محمد عبدالله", phone: "01234567891", email: "mohammed@company.com", position: "مندوب مبيعات" },
    { id: "3", name: "سارة أحمد", phone: "01234567892", email: "sarah@company.com", position: "مديرة مبيعات" },
    { id: "4", name: "عمر حسن", phone: "01234567893", email: "omar@company.com", position: "مستشار مبيعات" },
  ];
  
  // Fetch companies from API
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });
  
  // Fetch terms and conditions
  const { data: termsData = [] } = useQuery<TermsAndConditions[]>({
    queryKey: ["/api/terms-conditions"],
  });
  
  // Vehicle and pricing data
  const [editableVehicle, setEditableVehicle] = useState<InventoryItem | null>(null);
  const [pricingDetails, setPricingDetails] = useState({
    basePrice: 0,
    quantity: 1,
    taxRate: 15,
    isVATInclusive: true,
    includeLicensePlate: true,
    licensePlatePrice: 900,
    isLicensePlateTaxSubject: false
  });

  // Load quotation data into form when it's fetched
  useEffect(() => {
    if (quotation) {
      setQuoteNumber(quotation.quoteNumber || "");
      setCustomerName(quotation.customerName || "");
      setCustomerPhone(quotation.customerPhone || "");
      setCustomerEmail(quotation.customerEmail || "");
      setNotes(quotation.notes || "");
      setValidityDays(quotation.validityDays || 3);
      
      // Parse pricing details if available
      if (quotation.pricingDetails) {
        try {
          const parsedPricing = typeof quotation.pricingDetails === 'string' 
            ? JSON.parse(quotation.pricingDetails) 
            : quotation.pricingDetails;
          setPricingDetails({
            basePrice: parsedPricing.basePrice || 0,
            quantity: parsedPricing.quantity || 1,
            taxRate: parsedPricing.taxRate || 15,
            isVATInclusive: parsedPricing.isVATInclusive || true,
            includeLicensePlate: parsedPricing.includeLicensePlate || true,
            licensePlatePrice: parsedPricing.licensePlatePrice || 900,
            isLicensePlateTaxSubject: parsedPricing.isLicensePlateTaxSubject || false
          });
        } catch (error) {
          console.error("Error parsing pricing details:", error);
        }
      }

      // Set up vehicle data
      setEditableVehicle({
        id: quotation.inventoryItemId || 0,
        manufacturer: quotation.vehicleManufacturer || "",
        category: quotation.vehicleCategory || "",
        trimLevel: quotation.vehicleTrimLevel || "",
        year: quotation.vehicleYear || new Date().getFullYear(),
        exteriorColor: quotation.vehicleExteriorColor || "",
        interiorColor: quotation.vehicleInteriorColor || "",
        chassisNumber: quotation.vehicleChassisNumber || "",
        engineCapacity: quotation.vehicleEngineCapacity || "",
        price: quotation.basePrice ? parseFloat(quotation.basePrice) : 0,
        status: "متوفر",
        importType: "جمرك",
        location: "الرياض",
        entryDate: new Date(),
        images: []
      });

      // Parse and set representative/company data
      try {
        if (quotation.representativeData) {
          const repData = typeof quotation.representativeData === 'string' 
            ? JSON.parse(quotation.representativeData) 
            : quotation.representativeData;
          setSelectedRepresentative(repData.id || "");
        }
        
        if (quotation.companyData) {
          const compData = typeof quotation.companyData === 'string' 
            ? JSON.parse(quotation.companyData) 
            : quotation.companyData;
          setSelectedCompany(compData.id?.toString() || "");
        }
      } catch (error) {
        console.error("Error parsing representative/company data:", error);
      }
    }
  }, [quotation]);

  // Calculate totals
  const calculateTotals = () => {
    const itemPrice = pricingDetails.basePrice * pricingDetails.quantity;
    let subtotal = itemPrice;
    
    if (pricingDetails.includeLicensePlate) {
      subtotal += pricingDetails.licensePlatePrice;
    }
    
    // Calculate tax based on whether license plate is subject to tax
    const taxableAmount = pricingDetails.isLicensePlateTaxSubject 
      ? subtotal 
      : itemPrice; // Only vehicle price is taxable, not license plate
    
    let taxAmount = 0;
    let finalTotal = 0;
    let licensePlateTotal = pricingDetails.includeLicensePlate ? pricingDetails.licensePlatePrice : 0;
    
    if (pricingDetails.isVATInclusive) {
      // VAT is included in the price
      taxAmount = (taxableAmount * pricingDetails.taxRate) / (100 + pricingDetails.taxRate);
      finalTotal = subtotal;
    } else {
      // VAT is added to the price
      taxAmount = (taxableAmount * pricingDetails.taxRate) / 100;
      finalTotal = subtotal + taxAmount;
    }
    
    return {
      subtotal,
      taxAmount,
      finalTotal,
      licensePlateTotal
    };
  };

  // Update quotation mutation
  const updateQuotationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', `/api/quotations/${quotationId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث عرض السعر",
        description: "تم تحديث عرض السعر بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quotations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/quotations', quotationId] });
    },
    onError: (error) => {
      toast({
        title: "خطأ في تحديث عرض السعر",
        description: "حدث خطأ أثناء تحديث عرض السعر. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  });

  // Export quotation as PDF
  const exportToPDF = async () => {
    try {
      const element = document.querySelector('[data-pdf-export="quotation"]');
      if (!element) {
        toast({
          title: "خطأ",
          description: "لا يمكن العثور على العنصر المطلوب تصديره",
          variant: "destructive",
        });
        return;
      }

      // Create canvas from HTML element
      const canvas = await html2canvas(element as HTMLElement, {
        scale: 2,
        logging: false,
        allowTaint: true,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Calculate dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add image to PDF
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        0,
        imgWidth,
        imgHeight
      );

      // Save PDF
      const fileName = `عرض_سعر_${quoteNumber || generateQuoteNumber()}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "تم تصدير عرض السعر",
        description: `تم تصدير عرض السعر بصيغة PDF بنجاح`,
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير العرض إلى PDF",
        variant: "destructive",
      });
    }
  };

  const handleUpdateQuotation = () => {
    if (!editableVehicle) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى التأكد من وجود بيانات السيارة",
        variant: "destructive",
      });
      return;
    }

    const totals = calculateTotals();
    
    // Get selected representative and company data (use defaults if not selected)
    const selectedRepData = representatives.find(rep => rep.id === selectedRepresentative) || {
      id: "",
      name: "",
      phone: "",
      email: "",
      position: ""
    };
    const selectedCompanyData = companies.find(comp => comp.id === selectedCompany) || {
      id: 0,
      name: "",
      logo: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      taxNumber: "",
      primaryColor: "#1a73e8",
      secondaryColor: "#34a853",
      isActive: true
    };

    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + validityDays);

    const quotationData = {
      quoteNumber,
      inventoryItemId: editableVehicle.id,
      vehicleManufacturer: editableVehicle.manufacturer,
      vehicleCategory: editableVehicle.category,
      vehicleTrimLevel: editableVehicle.trimLevel,
      vehicleYear: editableVehicle.year,
      vehicleExteriorColor: editableVehicle.exteriorColor,
      vehicleInteriorColor: editableVehicle.interiorColor,
      vehicleChassisNumber: editableVehicle.chassisNumber,
      vehicleEngineCapacity: editableVehicle.engineCapacity,
      vehicleSpecifications: "",
      basePrice: pricingDetails.basePrice.toString(),
      finalPrice: totals.finalTotal.toString(),
      customerName: customerName || "عميل غير محدد",
      customerPhone,
      customerEmail,
      notes,
      status: "مسودة",
      validUntil: validUntilDate.toISOString(),
      validityDays,
      companyData: JSON.stringify(selectedCompanyData),
      representativeData: JSON.stringify(selectedRepData),
      pricingDetails: JSON.stringify(pricingDetails),
      qrCodeData: JSON.stringify({ 
        quoteNumber, 
        customerName: customerName || "عميل غير محدد", 
        finalPrice: totals.finalTotal 
      })
    };

    updateQuotationMutation.mutate(quotationData);
  };

  if (quotationLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500">جاري تحميل عرض السعر...</p>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-center text-red-600">عرض السعر غير موجود</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              لم يتم العثور على عرض السعر المطلوب
            </p>
            <Link href="/card-view">
              <Button>
                <ArrowLeft size={16} className="ml-2" />
                العودة للصفحة الرئيسية
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black">
      {/* Header */}
      <header className="dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 no-print mt-[8px] mb-[8px] pt-[37px] pb-[37px] pl-[-9px] pr-[-9px] bg-[#ffffff]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Link href="/card-view">
                <Button variant="outline" size="sm">
                  <ArrowLeft size={16} className="ml-2" />
                  العودة
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                تعديل عرض سعر - {quoteNumber}
              </h1>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <Printer size={16} className="ml-2" />
                طباعة
              </Button>
              
              <Button
                onClick={exportToPDF}
                className="bg-red-600 hover:bg-red-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
              >
                <FileDown size={16} className="ml-2" />
                تحميل PDF
              </Button>
              
              <Button
                onClick={handleUpdateQuotation}
                disabled={updateQuotationMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save size={16} className="ml-2" />
                {updateQuotationMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column - Vehicle Info & Basic Form */}
          <div className="space-y-6">
            
            {/* Vehicle Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="ml-2" size={20} />
                  بيانات السيارة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editableVehicle && (
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4 space-x-reverse">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                        <span className="text-2xl font-bold text-slate-600 dark:text-slate-300">
                          {editableVehicle.manufacturer?.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                          {editableVehicle.manufacturer} {editableVehicle.category}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                          {editableVehicle.year} • {editableVehicle.engineCapacity}
                        </p>
                        <div className="flex gap-4 mt-2 text-sm text-slate-500">
                          <span>خارجي: {editableVehicle.exteriorColor}</span>
                          <span>داخلي: {editableVehicle.interiorColor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="ml-2" size={20} />
                  بيانات العميل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customer-name">اسم العميل</Label>
                  <Input
                    id="customer-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="أدخل اسم العميل"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-phone">رقم الهاتف</Label>
                  <Input
                    id="customer-phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="أدخل رقم الهاتف"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-email">البريد الإلكتروني</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="أدخل البريد الإلكتروني"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Additional Notes */}
            <Card>
              <CardHeader>
                <CardTitle>ملاحظات إضافية</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أدخل أي ملاحظات إضافية..."
                  className="min-h-[100px]"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Pricing & Settings */}
          <div className="space-y-6">
            
            {/* Pricing Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="ml-2" size={20} />
                  تفاصيل السعر
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="base-price">السعر الأساسي (ريال)</Label>
                  <Input
                    id="base-price"
                    type="text"
                    value={pricingDetails.basePrice}
                    onChange={(e) => {
                      const val = convertArabicToEnglishNumerals(e.target.value);
                      setPricingDetails(prev => ({ 
                        ...prev, 
                        basePrice: parseFloat(val) || 0 
                      }));
                    }}
                    placeholder="أدخل السعر الأساسي"
                  />
                </div>

                <div>
                  <Label htmlFor="quantity">الكمية</Label>
                  <Input
                    id="quantity"
                    type="text"
                    min="1"
                    value={pricingDetails.quantity}
                    onChange={(e) => {
                      const val = convertArabicToEnglishNumerals(e.target.value);
                      setPricingDetails(prev => ({ 
                        ...prev, 
                        quantity: parseInt(val) || 1 
                      }));
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="tax-rate">معدل الضريبة (%)</Label>
                  <Input
                    id="tax-rate"
                    type="text"
                    min="0"
                    max="100"
                    value={pricingDetails.taxRate}
                    onChange={(e) => {
                      const val = convertArabicToEnglishNumerals(e.target.value);
                      setPricingDetails(prev => ({ 
                        ...prev, 
                        taxRate: parseFloat(val) || 0 
                      }));
                    }}
                  />
                </div>

                {/* Tax Options */}
                <div className="space-y-2">
                  <Label>خيارات الضريبة</Label>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="radio"
                      id="vat-inclusive"
                      name="vat-option"
                      checked={pricingDetails.isVATInclusive}
                      onChange={() => setPricingDetails(prev => ({ ...prev, isVATInclusive: true }))}
                      className="accent-[#C49632]"
                    />
                    <Label htmlFor="vat-inclusive">السعر شامل الضريبة</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="radio"
                      id="vat-exclusive"
                      name="vat-option"
                      checked={!pricingDetails.isVATInclusive}
                      onChange={() => setPricingDetails(prev => ({ ...prev, isVATInclusive: false }))}
                      className="accent-[#C49632]"
                    />
                    <Label htmlFor="vat-exclusive">السعر + الضريبة</Label>
                  </div>
                </div>

                {/* License Plate Options */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="checkbox"
                      id="include-license-plate"
                      checked={pricingDetails.includeLicensePlate}
                      onChange={(e) => setPricingDetails(prev => ({ 
                        ...prev, 
                        includeLicensePlate: e.target.checked 
                      }))}
                      className="accent-[#C49632]"
                    />
                    <Label htmlFor="include-license-plate">تضمين اللوحات</Label>
                  </div>
                  
                  {pricingDetails.includeLicensePlate && (
                    <div>
                      <Label htmlFor="license-plate-price">سعر اللوحات (ريال)</Label>
                      <Input
                        id="license-plate-price"
                        type="text"
                        value={pricingDetails.licensePlatePrice}
                        onChange={(e) => {
                          const val = convertArabicToEnglishNumerals(e.target.value);
                          setPricingDetails(prev => ({ 
                            ...prev, 
                            licensePlatePrice: parseFloat(val) || 0 
                          }));
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Price Summary */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>إجمالي السيارة:</span>
                    <span className="font-medium">{(pricingDetails.basePrice * pricingDetails.quantity || 0).toLocaleString()} ريال</span>
                  </div>
                  {pricingDetails.includeLicensePlate && (
                    <div className="flex justify-between">
                      <span>اللوحات:</span>
                      <span className="font-medium">{(calculateTotals().licensePlateTotal || 0).toLocaleString()} ريال</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>المبلغ الفرعي:</span>
                    <span className="font-medium">{(calculateTotals().subtotal || 0).toLocaleString()} ريال</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الضريبة ({pricingDetails.taxRate}%):</span>
                    <span className="font-medium text-red-600">{(calculateTotals().taxAmount || 0).toLocaleString()} ريال</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 font-semibold text-lg">
                    <span>المجموع النهائي:</span>
                    <span className="text-green-600">{(calculateTotals().finalTotal || 0).toLocaleString()} ريال</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company & Representative Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="ml-2" size={20} />
                  الشركة والمندوب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="company-select">الشركة</Label>
                  <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الشركة" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id.toString()}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="rep-select">المندوب</Label>
                  <Select value={selectedRepresentative} onValueChange={setSelectedRepresentative}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المندوب" />
                    </SelectTrigger>
                    <SelectContent>
                      {representatives.map((rep) => (
                        <SelectItem key={rep.id} value={rep.id}>
                          {rep.name} - {rep.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="validity-days">صالح لمدة (أيام)</Label>
                  <Input
                    id="validity-days"
                    type="number"
                    min="1"
                    value={validityDays}
                    onChange={(e) => setValidityDays(parseInt(e.target.value) || 30)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}