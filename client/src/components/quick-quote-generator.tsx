import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { FileText, Download, Printer, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AlbarimiQuoteTemplate from "./albarimi-quote-template";
import { generateQuoteNumber } from "@/utils/serial-number";
import type { InventoryItem, Company } from "@shared/schema";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface QuickQuoteGeneratorProps {
  vehicle: InventoryItem;
  defaultSalesRep?: string;
}

export default function QuickQuoteGenerator({ vehicle, defaultSalesRep }: QuickQuoteGeneratorProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [salesRepName, setSalesRepName] = useState(defaultSalesRep || "");
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // Fetch company data
  const { data: companies } = useQuery<Company[]>({
    queryKey: ['/api/companies']
  });

  const defaultCompany: Company = {
    id: 1,
    name: "شركة البريمي للسيارات",
    registrationNumber: "1234567890",
    licenseNumber: "LC-2024-001",
    taxNumber: "300123456789003",
    address: "الرياض، المملكة العربية السعودية",
    phone: "920033340",
    email: "info@albarimi.com",
    website: "albarimi.com",
    primaryColor: "#00627F",
    secondaryColor: "#BF9231",
    accentColor: "#0891b2",
    isActive: true,
    pdfTemplate: "classic",
    pdfHeaderStyle: "standard",
    pdfLogoPosition: "left",
    pdfLogoSize: "medium",
    pdfFontFamily: "Noto Sans Arabic",
    pdfFontSize: 12,
    pdfLineHeight: "1.5",
    pdfMarginTop: 20,
    pdfMarginBottom: 20,
    pdfMarginLeft: 20,
    pdfMarginRight: 20,
    pdfHeaderBgColor: "#ffffff",
    pdfHeaderTextColor: "#000000",
    pdfTableHeaderBg: "#f8f9fa",
    pdfTableHeaderText: "#000000",
    pdfTableBorderColor: "#dee2e6",
    pdfAccentColor: "#0891b2",
    pdfShowWatermark: false,
    pdfWatermarkText: null,
    pdfShowQrCode: true,
    pdfQrPosition: "top-right",
    pdfFooterText: null,
    pdfShowPageNumbers: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    logo: null
  };

  const company = companies?.[0] || defaultCompany;

  const generateQuote = async () => {
    setIsGenerating(true);
    
    try {
      // Basic validation
      if (!customerName.trim()) {
        toast({
          title: "خطأ",
          description: "يرجى إدخال اسم العميل",
          variant: "destructive",
        });
        return;
      }

      // Show preview first
      setShowPreview(true);
      
      toast({
        title: "تم إنشاء عرض السعر",
        description: "يمكنك الآن مراجعة عرض السعر وتنزيله",
      });

    } catch (error) {
      console.error('Error generating quote:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء عرض السعر",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async () => {
    setIsDownloadingPDF(true);
    try {
      const element = document.getElementById('quote-preview');
      if (!element) {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على معاينة العرض",
          variant: "destructive",
        });
        return;
      }

      // Check if element has content
      if (element.children.length === 0) {
        toast({
          title: "خطأ",
          description: "معاينة العرض فارغة",
          variant: "destructive",
        });
        return;
      }

      // Wait for content to load
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Ensure element is visible
      const originalDisplay = element.style.display;
      const originalVisibility = element.style.visibility;
      element.style.display = 'block';
      element.style.visibility = 'visible';

      // High-quality canvas with improved settings
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: true,
        allowTaint: true,
        useCORS: true,
        backgroundColor: '#ffffff',
        foreignObjectRendering: false,
        imageTimeout: 15000,
        height: element.scrollHeight,
        width: element.scrollWidth,
        scrollX: 0,
        scrollY: 0
      });

      // Restore display properties
      element.style.display = originalDisplay;
      element.style.visibility = originalVisibility;

      // Check canvas validity
      if (canvas.width === 0 || canvas.height === 0) {
        toast({
          title: "خطأ في إنشاء PDF",
          description: "فشل في تحويل العرض إلى صورة",
          variant: "destructive",
        });
        return;
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // Calculate proper scaling for A4
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasAspectRatio = canvas.height / canvas.width;
      
      let finalWidth = pdfWidth;
      let finalHeight = pdfWidth * canvasAspectRatio;
      
      // If height exceeds page, scale down
      if (finalHeight > pdfHeight) {
        finalHeight = pdfHeight;
        finalWidth = pdfHeight / canvasAspectRatio;
      }
      
      // Center the content
      const xOffset = (pdfWidth - finalWidth) / 2;
      const yOffset = (pdfHeight - finalHeight) / 2;
      
      // High-quality image data
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      pdf.addImage(
        imgData,
        'PNG',
        xOffset,
        yOffset,
        finalWidth,
        finalHeight
      );

      const timestamp = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
      const filename = `عرض_سعر_${vehicle.manufacturer}_${vehicle.category}_${timestamp}.pdf`;
      pdf.save(filename);

      toast({
        title: "تم التنزيل بنجاح",
        description: "تم تنزيل عرض السعر بجودة عالية وأبعاد صحيحة",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تنزيل الملف",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const printQuote = () => {
    const element = document.getElementById('quote-preview');
    if (!element) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>عرض سعر - ${vehicle.manufacturer} ${vehicle.category}</title>
          <style>
            body { margin: 0; font-family: Arial, sans-serif; }
            @media print { 
              body { -webkit-print-color-adjust: exact; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();

    toast({
      title: "تم إرسال للطباعة",
      description: "تم إرسال عرض السعر للطباعة",
    });
  };

  const quotationData = {
    quoteNumber: generateQuoteNumber(),
    quotationNumber: generateQuoteNumber(),
    inventoryItemId: vehicle.id,
    customerName,
    customerPhone,
    salesRepName,
    notes,
    vehicleId: vehicle.id,
    manufacturer: vehicle.manufacturer,
    category: vehicle.category,
    year: vehicle.year,
    engineCapacity: vehicle.engineCapacity,
    exteriorColor: vehicle.exteriorColor,
    interiorColor: vehicle.interiorColor,
    chassisNumber: vehicle.chassisNumber,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    createdBy: salesRepName || "مجهول",
    basePrice: vehicle.price || 0,
    finalPrice: vehicle.price || 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    pricingDetails: JSON.stringify({
      basePrice: vehicle.price || 0,
      quantity: 1,
      includeLicensePlate: true,
      licensePlatePrice: 900,
      taxRate: 15,
      isVATInclusive: false
    })
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg"
        >
          <FileText className="w-4 h-4 mr-2" />
          إنشاء عرض سعر
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">
            إنشاء عرض سعر - {vehicle.manufacturer} {vehicle.category}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!showPreview ? (
            /* Quote Form */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Information */}
              <Card className="p-4 space-y-4">
                <h3 className="font-semibold text-lg text-right">معلومات العميل</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="customerName" className="text-right block">
                    اسم العميل *
                  </Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="أدخل اسم العميل"
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone" className="text-right block">
                    رقم الهاتف
                  </Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="أدخل رقم الهاتف"
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salesRepName" className="text-right block">
                    اسم المندوب
                  </Label>
                  <Input
                    id="salesRepName"
                    value={salesRepName}
                    onChange={(e) => setSalesRepName(e.target.value)}
                    placeholder="أدخل اسم المندوب"
                    className="text-right"
                    disabled={!!defaultSalesRep}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-right block">
                    ملاحظات
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="أدخل أي ملاحظات إضافية"
                    className="text-right"
                    rows={3}
                  />
                </div>
              </Card>

              {/* Vehicle Information */}
              <Card className="p-4">
                <h3 className="font-semibold text-lg text-right mb-4">معلومات المركبة</h3>
                
                <div className="space-y-3 text-right">
                  <div className="flex justify-between">
                    <span className="text-gray-600">الصانع:</span>
                    <span className="font-medium">{vehicle.manufacturer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">الفئة:</span>
                    <span className="font-medium">{vehicle.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">السنة:</span>
                    <span className="font-medium">{vehicle.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">سعة المحرك:</span>
                    <span className="font-medium">{vehicle.engineCapacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">اللون الخارجي:</span>
                    <span className="font-medium">{vehicle.exteriorColor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">اللون الداخلي:</span>
                    <span className="font-medium">{vehicle.interiorColor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">رقم الهيكل:</span>
                    <span className="font-medium text-sm">{vehicle.chassisNumber}</span>
                  </div>
                  {vehicle.price && (
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-600">السعر:</span>
                      <span className="font-bold text-lg text-green-600">
                        {Number(vehicle.price).toLocaleString('ar-SA')} ريال
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ) : (
            /* Quote Preview */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">معاينة عرض السعر</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowPreview(false)}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    تعديل
                  </Button>
                  <Button
                    onClick={printQuote}
                    variant="outline"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    طباعة
                  </Button>
                  <Button
                    onClick={downloadPDF}
                    size="default"
                    disabled={isDownloadingPDF}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg px-6 py-2"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    {isDownloadingPDF ? "جاري التنزيل..." : "تنزيل PDF"}
                  </Button>
                </div>
              </div>

              {/* Quote Preview */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div id="quote-preview" className="bg-white">
                  <AlbarimiQuoteTemplate
                    vehicle={vehicle}
                    company={company}
                    quotationData={quotationData}
                    showWatermark={false}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!showPreview && (
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
              >
                إلغاء
              </Button>
              <Button
                onClick={generateQuote}
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isGenerating ? "جاري الإنشاء..." : "إنشاء عرض السعر"}
              </Button>
              {showPreview && (
                <Button
                  onClick={downloadPDF}
                  disabled={isDownloadingPDF}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isDownloadingPDF ? "جاري التنزيل..." : "تنزيل PDF"}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}