import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Phone, Mail, Globe, Building, Trash2, List, Eraser, PlusCircle, Type, Edit3, Check, Save, FileText, X, Printer, Download, MessageCircle } from "lucide-react";
import { captureElementToCanvas, canvasToA4Pdf } from "@/utils/pdf-capture";
import { numberToArabic } from "@/utils/number-to-arabic";
import { useToast } from "@/hooks/use-toast";
import type { Company, InventoryItem, Specification, AppearanceSettings } from "@shared/schema";
import { getManufacturerLogo } from "@shared/manufacturer-logos";
import { useQuery } from "@tanstack/react-query";
import QuotationTableLayout from "@/components/quotation-table-layout";


// Background images
const backgroundImages = {
  albarimi1: '/albarimi-1.svg',
  albarimi2: '/albarimi-2.svg'
};

interface QuotationA4PreviewProps {
  selectedCompany: Company | null;
  selectedVehicle: InventoryItem | null;
  vehicleSpecs?: any | null;
  quoteNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerTitle?: string; // التوجيه مثل السادة، السيد، السيدة، الشيخ، سمو الأمير
  validUntil: Date;
  basePrice: number;
  finalPrice: number;
  licensePlatePrice: number;
  includeLicensePlate: boolean;
  licensePlateSubjectToTax: boolean;
  taxRate: number;
  isVATInclusive: boolean;
  representativeName: string;
  representativePhone: string;
  representativeEmail: string;
  representativePosition: string;
  notes: string;
  termsRefreshTrigger?: number;
  companyStamp?: string | null;
  isInvoiceMode?: boolean;
  invoiceNumber?: string;
  authorizationNumber?: string;
  // Added for compatibility with newer versions
  multiItems?: any[];
  onRemoveMultiItem?: (id: number) => void;
  taxAmount?: number;
  subtotal?: number;
  showRepresentative?: boolean;
  onSaveSpecs?: (specs: string) => void;
  visibleColumns?: {
    chassis: boolean;
    quantity: boolean;
    unitPrice: boolean;
    tax: boolean;
    license: boolean;
    total: boolean;
    color: boolean;
    year: boolean;
  };
}

export default function QuotationA4Preview({
  selectedCompany,
  selectedVehicle,
  vehicleSpecs,
  quoteNumber,
  customerName,
  customerPhone,
  customerEmail,
  customerTitle = "السادة",
  validUntil,
  basePrice,
  finalPrice,
  licensePlatePrice,
  includeLicensePlate,
  licensePlateSubjectToTax,
  taxRate,
  isVATInclusive,
  representativeName,
  representativePhone,
  representativeEmail,
  representativePosition,
  notes,
  termsRefreshTrigger = 0,
  companyStamp = null,
  isInvoiceMode = false,
  invoiceNumber = "",
  authorizationNumber = "",
  multiItems = [],
  onRemoveMultiItem,
  taxAmount: passedTaxAmount,
  subtotal: passedSubtotal,
  showRepresentative = true,
  onSaveSpecs,
  visibleColumns = {
    chassis: true,
    quantity: true,
    unitPrice: true,
    tax: true,
    license: true,
    total: true,
    color: true,
    year: true
  }
}: QuotationA4PreviewProps) {
  
  const [termsConditions, setTermsConditions] = useState<Array<{ id: number; term_text: string; display_order: number }>>([]);
  const [manufacturerLogo, setManufacturerLogo] = useState<string | null>(null);
  const [localStamp, setLocalStamp] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const [editableSpecs, setEditableSpecs] = useState<string>("");
  const [isTextEditMode, setIsTextEditMode] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // WhatsApp share state
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState("");

  // Saved templates (custom edited quote snapshots stored in localStorage)
  type QuoteTemplate = { id: string; name: string; html: string; savedAt: number };
  const TEMPLATES_STORAGE_KEY = "quotationCustomTemplates";
  const [templates, setTemplates] = useState<QuoteTemplate[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const activeTemplate = templates.find((t) => t.id === activeTemplateId) || null;

  const persistTemplates = (next: QuoteTemplate[]) => {
    setTemplates(next);
    try {
      window.localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Failed to save templates", e);
    }
  };

  const handleSaveTemplate = () => {
    if (!previewRef.current) return;
    const defaultName = `قالب ${new Date().toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}`;
    const name = window.prompt("اسم القالب:", defaultName);
    if (!name || !name.trim()) return;
    const html = previewRef.current.innerHTML;
    const newTemplate: QuoteTemplate = {
      id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      html,
      savedAt: Date.now(),
    };
    persistTemplates([newTemplate, ...templates]);
    setActiveTemplateId(newTemplate.id);
    setIsTextEditMode(false);
  };

  const handleApplyTemplate = (id: string) => {
    if (id === "__none__") {
      setActiveTemplateId(null);
      return;
    }
    setIsTextEditMode(false);
    setActiveTemplateId(id);
  };

  const handleDeleteTemplate = (id: string) => {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    if (!window.confirm(`حذف القالب "${tpl.name}"؟`)) return;
    const next = templates.filter((t) => t.id !== id);
    persistTemplates(next);
    if (activeTemplateId === id) setActiveTemplateId(null);
  };

  const { data: appearance } = useQuery<AppearanceSettings>({
    queryKey: ["/api/appearance"],
  });

  const [currentBgType, setCurrentBgType] = useState<string>("albarimi2");

  // Layout style toggle: "standard" = original A4 layout, "table" = vertical 2-column table layout
  const [layoutStyle, setLayoutStyle] = useState<"standard" | "table">(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("quotationLayoutStyle");
      if (saved === "table" || saved === "standard") return saved;
    }
    return "standard";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("quotationLayoutStyle", layoutStyle);
    }
  }, [layoutStyle]);

  useEffect(() => {
    if (appearance?.quotationBackgroundType) {
      setCurrentBgType(appearance.quotationBackgroundType);
    }
  }, [appearance]);

  const bgType = currentBgType;
  const primaryColor = appearance?.quotationPrimaryColor || "#1A365D";
  const secondaryColor = appearance?.quotationSecondaryColor || "#2B4C8C";
  const accentColor = appearance?.quotationAccentColor || "#C49632";
  const fontFamily = appearance?.quotationFontFamily || "Noto Sans Arabic";

  // Print function for the quotation preview
  const handlePrint = () => {
    window.print();
  };

  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportPDF = async () => {
    const el = previewRef.current;
    if (!el) return;
    setIsExportingPDF(true);
    try {
      const canvas = await captureElementToCanvas(el);
      const pdf = canvasToA4Pdf(canvas, el);
      const fileName = `عرض-سعر-${quoteNumber || "quotation"}.pdf`;
      pdf.save(fileName);
    } catch (e) {
      console.error("PDF export error", e);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);

  const handleOpenWhatsAppDialog = () => {
    // Pre-fill with customer phone if available
    const raw = customerPhone || "";
    const cleaned = raw.replace(/\D/g, "").replace(/^00/, "").replace(/^966/, "");
    setWhatsAppPhone(cleaned);
    setShowWhatsAppDialog(true);
  };

  const handleSendWhatsApp = async () => {
    const cleaned = whatsAppPhone.replace(/\D/g, "").replace(/^00/, "").replace(/^966/, "");
    if (!cleaned) {
      toast({ title: "رقم الهاتف مطلوب", variant: "destructive" });
      return;
    }
    const fullPhone = `966${cleaned}`;
    setIsSharingWhatsApp(true);
    try {
      // Generate and download the PDF first
      const el = previewRef.current;
      if (el) {
        const canvas = await captureElementToCanvas(el);
        const pdf = canvasToA4Pdf(canvas, el);
        const fileName = `عرض-سعر-${quoteNumber || "quotation"}.pdf`;
        pdf.save(fileName);
      }
      // Build the WhatsApp message
      const vehicleName = selectedVehicle
        ? `${selectedVehicle.manufacturer || ""} ${selectedVehicle.category || ""} ${selectedVehicle.year || ""}`.trim()
        : "";
      const msg = `السلام عليكم ${customerName ? `/ ${customerName}` : ""}،\n\nيسعدنا نشارككم عرض السعر${vehicleName ? ` للمركبة: ${vehicleName}` : ""}.\n\nرقم العرض: ${quoteNumber}\n\nيُرجى مراجعة ملف PDF المُرفق معه.\n\nشكراً لتواصلكم — فريق المبيعات`;
      setTimeout(() => {
        window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, "_blank");
        toast({ title: "تم إرسال الواتساب", description: "تم تحميل PDF وفتح محادثة الواتساب" });
      }, 800);
    } catch (e) {
      console.error("WhatsApp share error", e);
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setIsSharingWhatsApp(false);
      setShowWhatsAppDialog(false);
    }
  };

  useEffect(() => {
    if (appearance?.printStamp) {
      setLocalStamp(appearance.printStamp);
    } else {
      setLocalStamp(companyStamp);
    }
  }, [appearance?.printStamp, companyStamp]);

  const handleStampDoubleClick = () => {
    fileInputRef.current?.click();
  };

  const handleStampChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        setLocalStamp(base64Image);
        
        // Save the new stamp to appearance settings in database
        try {
          const response = await fetch('/api/appearance', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ printStamp: base64Image })
          });
          
          if (!response.ok) {
            throw new Error('Failed to save stamp');
          }
          console.log('Stamp saved successfully to database');
        } catch (error) {
          console.error('Error saving stamp:', error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Load terms and conditions
  useEffect(() => {
    async function loadTerms() {
      try {
        const response = await fetch("/api/terms-conditions");
        if (response.ok) {
          const data = await response.json();
          // Filter out terms that are empty or null
          const validTerms = data.filter((t: any) => t.term_text && t.term_text.trim() !== "");
          setTermsConditions(validTerms);
        }
      } catch (error) {
        console.error("Error loading terms:", error);
      }
    }
    loadTerms();
  }, [termsRefreshTrigger]);

  // Set manufacturer logo when vehicle changes
  useEffect(() => {
    if (selectedVehicle?.manufacturer) {
      const logo = getManufacturerLogo(selectedVehicle.manufacturer);
      setManufacturerLogo(logo || null);
    } else {
      setManufacturerLogo(null);
    }
  }, [selectedVehicle]);

  // Handle detailed specs synchronization
  useEffect(() => {
    if (selectedVehicle?.detailedSpecifications) {
      setEditableSpecs(selectedVehicle.detailedSpecifications);
    } else if (vehicleSpecs) {
      // If we have separate specs object, format it as string
      const specsString = Object.entries(vehicleSpecs)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      setEditableSpecs(specsString);
    }
  }, [selectedVehicle, vehicleSpecs]);

  const isMulti = multiItems && multiItems.length > 0;
  
  // Calculate totals based on whether we are in multi-item mode or single vehicle mode
  const baseSubtotal = isMulti 
    ? multiItems.reduce((sum, item) => sum + (Number(item.unitPrice || item.price || item.basePrice || 0) * (item.quantity || 1)), 0)
    : basePrice;

  const totalTax = isMulti
    ? multiItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0)
    : (isVATInclusive 
        ? (baseSubtotal * taxRate / (100 + taxRate)) 
        : (baseSubtotal * taxRate / 100));

  const totalLicense = includeLicensePlate 
    ? (isMulti ? multiItems.reduce((sum, item) => sum + Number(item.licensePlatePrice || 0), 0) : licensePlatePrice) 
    : 0;

  const totalWithLicense = isMulti
    ? multiItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
    : (isVATInclusive 
        ? (baseSubtotal + totalLicense) 
        : (baseSubtotal + totalTax + totalLicense));

  const taxAmount = totalTax;
  const grandTotal = baseSubtotal; // For backward compatibility

  // Format quote number: remove non-digits and pad to 5 digits
  const formattedQuoteNumber = quoteNumber.replace(/\D/g, '').padStart(5, '0');

  return (
    <div className="w-full max-w-4xl mx-auto p-6 print:p-0 print:m-0">
      {/* Controls - Background Toggle and Print Button */}
      <div className="mb-4 flex justify-center items-center gap-3 print:hidden no-print flex-wrap" data-html2canvas-ignore="true">

        {/* الخلفية */}
        <div className="flex items-center gap-2 border-2 border-[#C79C45] rounded-xl px-3 py-1.5 bg-white shadow-md h-10">
          <span className="text-xs font-bold text-[#01637f] whitespace-nowrap">الخلفية:</span>
          <Select value={currentBgType} onValueChange={setCurrentBgType}>
            <SelectTrigger className="w-[150px] h-7 text-xs border-none shadow-none focus:ring-0 text-[#01637f] font-medium" data-testid="select-background">
              <SelectValue placeholder="اختر الخلفية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="albarimi1">البريمي 1</SelectItem>
              <SelectItem value="albarimi2">البريمي 2</SelectItem>
              <SelectItem value="dynamic">خلفية ديناميكية</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* التخطيط */}
        <div className="flex items-center gap-2 border-2 border-[#C79C45] rounded-xl px-3 py-1.5 bg-white shadow-md h-10">
          <span className="text-xs font-bold text-[#01637f] whitespace-nowrap">التخطيط:</span>
          <Select
            value={layoutStyle}
            onValueChange={(v) => setLayoutStyle(v as "standard" | "table")}
          >
            <SelectTrigger
              className="w-[150px] h-7 text-xs border-none shadow-none focus:ring-0 text-[#01637f] font-medium"
              data-testid="select-layout-style"
            >
              <SelectValue placeholder="اختر التخطيط" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">الافتراضي</SelectItem>
              <SelectItem value="table">جدول عمودي</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* زر تحرير النصوص */}
        <Button
          onClick={() => setIsTextEditMode((v) => !v)}
          className={`h-10 px-5 text-xs font-bold rounded-xl shadow-md gap-2 border-2 transition-all ${
            isTextEditMode
              ? "bg-[#01637f] hover:bg-[#014f67] text-white border-[#01637f]"
              : "bg-white hover:bg-[#f0fafa] text-[#01637f] border-[#C79C45]"
          }`}
          data-testid="button-toggle-text-edit"
        >
          {isTextEditMode ? (
            <>
              <Check size={14} />
              إنهاء التحرير
            </>
          ) : (
            <>
              <Edit3 size={14} />
              تحرير النصوص
            </>
          )}
        </Button>

        {/* زر حفظ كقالب */}
        {isTextEditMode && (
          <Button
            onClick={handleSaveTemplate}
            className="h-10 px-5 text-xs font-bold rounded-xl shadow-md gap-2 border-2 bg-[#C79C45] hover:bg-[#b08a3a] text-white border-[#C79C45]"
            data-testid="button-save-template"
          >
            <Save size={14} />
            حفظ كقالب
          </Button>
        )}

        {/* القوالب */}
        <div className="flex items-center gap-2 border-2 border-[#C79C45] rounded-xl px-3 py-1.5 bg-white shadow-md h-10">
          <FileText size={14} className="text-[#C79C45]" />
          <span className="text-xs font-bold text-[#01637f] whitespace-nowrap">القوالب:</span>
          <Select
            value={activeTemplateId || "__none__"}
            onValueChange={handleApplyTemplate}
          >
            <SelectTrigger
              className="w-[140px] h-7 text-xs border-none shadow-none focus:ring-0 text-[#01637f] font-medium"
              data-testid="select-template"
            >
              <SelectValue placeholder="اختر قالباً" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— بدون قالب —</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeTemplateId && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
              onClick={() => handleDeleteTemplate(activeTemplateId)}
              title="حذف القالب الحالي"
              data-testid="button-delete-template"
            >
              <Trash2 size={13} />
            </Button>
          )}
        </div>

        {/* زر الطباعة */}
        <Button
          onClick={handlePrint}
          className="h-10 px-5 text-xs font-bold rounded-xl shadow-md gap-2 border-2 bg-white hover:bg-[#f0fafa] text-[#01637f] border-[#C79C45] transition-all"
          data-testid="button-print"
        >
          <Printer size={14} />
          طباعة
        </Button>

        {/* زر تحميل PDF */}
        <Button
          onClick={handleExportPDF}
          disabled={isExportingPDF}
          className="h-10 px-5 text-xs font-bold rounded-xl shadow-md gap-2 border-2 bg-[#01637f] hover:bg-[#014f67] text-white border-[#01637f] transition-all disabled:opacity-60"
          data-testid="button-export-pdf"
        >
          <Download size={14} />
          {isExportingPDF ? "جارٍ التصدير..." : "تحميل PDF"}
        </Button>

        {/* زر مشاركة واتساب */}
        <Button
          onClick={handleOpenWhatsAppDialog}
          className="h-10 px-5 text-xs font-bold rounded-xl shadow-md gap-2 border-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white border-[#25D366] transition-all"
          data-testid="button-whatsapp-share"
        >
          <MessageCircle size={14} />
          واتساب
        </Button>

      </div>

      {activeTemplate && (
        <div
          className="mb-3 mx-auto max-w-2xl flex items-center justify-center gap-3 text-[12px] font-bold text-purple-800 bg-purple-50 border border-purple-300 rounded-md py-2 px-3 print:hidden no-print"
          data-html2canvas-ignore="true"
          data-testid="active-template-banner"
        >
          <FileText size={14} />
          <span>القالب المفعّل: {activeTemplate.name}</span>
          <button
            type="button"
            onClick={() => setActiveTemplateId(null)}
            className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-purple-300 hover:bg-purple-100"
            data-testid="button-clear-template"
          >
            <X size={12} />
            إلغاء القالب
          </button>
        </div>
      )}

      {isTextEditMode && (
        <div
          className="mb-3 mx-auto max-w-2xl text-center text-[12px] font-bold text-amber-800 bg-amber-50 border border-amber-300 rounded-md py-2 px-3 print:hidden no-print"
          data-html2canvas-ignore="true"
          data-testid="text-edit-mode-banner"
        >
          وضع التحرير مفعّل — انقر على أي نص في عرض السعر للتعديل عليه مباشرة. التغييرات للعرض والطباعة فقط.
        </div>
      )}

      {/* Main Preview Container */}
      {activeTemplate ? (
        <div
          key={activeTemplate.id}
          id="quotation"
          className={`print-content shadow-2xl mx-auto ${isTextEditMode ? "ring-2 ring-amber-400 ring-offset-2 quotation-edit-mode" : ""}`}
          data-pdf-export="quotation"
          contentEditable={isTextEditMode}
          suppressContentEditableWarning={true}
          spellCheck={false}
          data-testid="quotation-preview-container"
          ref={previewRef}
          style={{
            width: '210mm',
            height: '297mm',
            backgroundColor: 'white',
            position: 'relative',
            overflow: 'hidden',
            direction: 'rtl',
            fontFamily: fontFamily,
            outline: isTextEditMode ? 'none' : undefined,
            cursor: isTextEditMode ? 'text' : undefined,
          }}
          dangerouslySetInnerHTML={{ __html: activeTemplate.html }}
        />
      ) : (
      <div 
        ref={previewRef}
        id="quotation"
        className={`print-content shadow-2xl mx-auto ${isTextEditMode ? "ring-2 ring-amber-400 ring-offset-2 quotation-edit-mode" : ""}`}
        data-pdf-export="quotation"
        contentEditable={isTextEditMode}
        suppressContentEditableWarning={true}
        spellCheck={false}
        data-testid="quotation-preview-container"
        style={{
          width: '210mm',
          height: '297mm',
          backgroundColor: 'white',
          backgroundImage: bgType === "dynamic" ? 'none' : `url(${bgType === "albarimi2" ? backgroundImages.albarimi2 : backgroundImages.albarimi1})`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          overflow: 'hidden',
          direction: 'rtl',
          fontFamily: fontFamily,
          outline: isTextEditMode ? 'none' : undefined,
          cursor: isTextEditMode ? 'text' : undefined,
        }}
      >
        {bgType === "dynamic" && (
          <div className="absolute inset-0 z-0 pointer-events-none">
            {/* Blue Header Bar */}
            <div 
              className="absolute top-0 left-0 right-0 h-[170px] z-10" 
              style={{ backgroundColor: '#01637f' }}
            />
            
            {/* Watermark Logo */}
            {appearance?.printLogo && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] rotate-[-15deg]">
                <img src={appearance.printLogo} alt="watermark" className="w-[500px] h-auto grayscale" />
              </div>
            )}
            
            {/* Header Logo and Company Name for Dynamic Background - Swapped: Company Right, Logo Left */}
            <div className="absolute top-[30px] left-[40px] right-[40px] z-30 flex justify-between items-start flex-row-reverse">
              {appearance?.printLogo && (
                <div className="flex flex-col items-start gap-1">
                  <img src={appearance.printLogo} alt="logo" className="h-[100px] w-auto object-contain mb-1 brightness-0 invert" />
                  {/* Removed absolute info block from here as it's now in the title row */}
                </div>
              )}
              
              {appearance?.companyName && (
                <div className="flex flex-col items-start">
                  <h2 className="text-[28px] font-black" style={{ color: '#ffffff' }}>{appearance.companyName}</h2>
                  {appearance.companyNameEn && (
                    <span className="text-[14px] font-bold opacity-80 uppercase tracking-wider" style={{ color: '#ffffff' }}>{appearance.companyNameEn}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {layoutStyle === "table" ? (
          <QuotationTableLayout
            selectedCompany={selectedCompany}
            selectedVehicle={selectedVehicle}
            appearance={appearance}
            quoteNumber={quoteNumber}
            customerName={customerName}
            customerTitle={customerTitle}
            validUntil={validUntil}
            basePrice={baseSubtotal}
            taxAmount={taxAmount}
            finalPrice={totalWithLicense}
            taxRate={taxRate}
            notes={notes}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            accentColor={accentColor}
            fontFamily={fontFamily}
            isInvoiceMode={isInvoiceMode}
            includeLicensePlate={includeLicensePlate}
            licensePlatePrice={totalLicense}
          />
        ) : (
        <div className="p-[25px] flex flex-col h-full relative z-10">
          {/* Header info for non-dynamic backgrounds - hidden now as it's moved to the title row */}
          {bgType !== "dynamic" && (
            <div className="absolute top-[115px] left-[65px] z-30 hidden flex-col text-[10px] font-bold">
              <div className="flex items-center gap-1">
                <span style={{ color: accentColor }}>الرقم:</span>
                <span style={{ color: primaryColor }}>{formattedQuoteNumber}</span>
              </div>
              <div className="flex items-center gap-1">
                <span style={{ color: accentColor }}>التاريخ:</span>
                <span style={{ color: primaryColor }}>{new Date().toLocaleDateString('en-GB')}</span>
              </div>
              <div className="flex items-center gap-1">
                <span style={{ color: accentColor }}>صالح حتى:</span>
                <span style={{ color: primaryColor }}>{validUntil.toLocaleDateString('en-GB')}</span>
              </div>
            </div>
          )}
          {/* Appearance Header Extra Sections */}
          {appearance && (appearance.printHeaderLeft || appearance.printHeaderCenter || appearance.printHeaderRight || appearance.printHeader) && (
            <div className="absolute top-[25px] left-[50px] right-[50px] flex flex-col gap-2 z-20">
              <div className="flex justify-between items-start text-[10px] font-bold" style={{ color: '#4b5563' }}>
                <div className="w-1/3 text-right">{appearance.printHeaderRight}</div>
                <div className="w-1/3 text-center">{appearance.printHeaderCenter}</div>
                <div className="w-1/3 text-left">{appearance.printHeaderLeft}</div>
              </div>
              {appearance.printHeader && (
                <div 
                  className="text-[10px] text-center"
                  style={{ color: '#4b5563' }}
                  dangerouslySetInnerHTML={{ __html: appearance.printHeader }}
                />
              )}
            </div>
          )}

          {/* Header Info - Pushed down to avoid overlap with background header */}
          <div className="ml-[25px] mr-[25px] mb-[15px]" style={{ marginTop: bgType === "dynamic" ? '85px' : '75px' }}>
            {/* New Row Layout: Quotation Title, Number, Date, and Valid Until in one row */}
            <div className="flex items-center justify-between border-b-2 pb-2" style={{ borderColor: `${accentColor}40`, marginTop: '8px', marginBottom: '8px' }}>
              <h1 className="text-[26px] font-black" style={{ color: bgType === "dynamic" ? '#ffffff' : '#c49633', paddingTop: '2px', paddingBottom: '2px' }}>عرض سعر</h1>
              
              <div className="flex items-center gap-6 text-[12px] font-bold pl-[18px] pr-[18px] ml-[82px] mr-[82px]">
                <div className="flex items-center gap-2">
                  <span style={{ color: bgType === "dynamic" ? '#ffffff' : accentColor, opacity: 0.8 }}>الرقم:</span>
                  <span style={{ color: bgType === "dynamic" ? '#ffffff' : primaryColor }}>{formattedQuoteNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: bgType === "dynamic" ? '#ffffff' : accentColor, opacity: 0.8 }}>التاريخ:</span>
                  <span style={{ color: bgType === "dynamic" ? '#ffffff' : primaryColor }}>{new Date().toLocaleDateString('en-GB')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: bgType === "dynamic" ? '#ffffff' : accentColor, opacity: 0.8 }}>صالح حتى:</span>
                  <span style={{ color: bgType === "dynamic" ? '#ffffff' : primaryColor }}>{validUntil.toLocaleDateString('en-GB')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Greeting Section */}
          <div className="mb-[6px] ml-[25px] mr-[25px] mt-0">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold" style={{ color: secondaryColor }}>{customerTitle || "السادة"} /</span>
              <span className="text-[16px] font-black underline decoration-dotted underline-offset-4" style={{ color: accentColor }}>
                {customerName || "عميلنا العزيز"}
              </span>
              <span className="text-[15px] font-bold" style={{ color: secondaryColor, marginLeft: '176px', marginRight: '176px' }}>
                {customerTitle === "السيد" ? "الموقر" : customerTitle === "السيدة" ? "الموقرة" : "الموقرين"}
              </span>
            </div>
            <div className="text-[13px] font-medium opacity-80 mt-0.5" style={{ color: primaryColor }}>
              تحية طيبة وبعد، يسعدنا تزويدكم بعرض السعر بناءً على طلبكم الكريم.
            </div>
          </div>

          {/* Vehicle Information Section */}
          <div className="mb-[6px] ml-[25px] mr-[25px]" style={{marginTop: '0px', width: '693px'}}>
            {/* Multi-item Table View */}
            {multiItems && multiItems.length > 0 ? (
              <>
                <div className="vehicle-info relative w-full mb-[10px] overflow-hidden print:bg-transparent ml-[-22px] mr-[-22px]" style={{ marginTop: bgType === "dynamic" ? '2px' : '5px' }}>
                  <table className="w-full text-[10px] text-right border-collapse">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="p-2 font-bold print:text-black" style={{ color: secondaryColor }}>المركبة</th>
                        {visibleColumns.chassis && <th className="p-2 font-bold print:text-black text-center" style={{ color: secondaryColor }}>رقم الهيكل</th>}
                        {visibleColumns.year && <th className="p-2 font-bold print:text-black text-center" style={{ color: secondaryColor }}>الموديل</th>}
                        {visibleColumns.color && <th className="p-2 font-bold print:text-black text-center" style={{ color: secondaryColor }}>اللون</th>}
                        {visibleColumns.quantity && <th className="p-2 font-bold print:text-black text-center" style={{ color: secondaryColor }}>الكمية</th>}
                        {visibleColumns.unitPrice && <th className="p-2 font-bold print:text-black text-center" style={{ color: secondaryColor }}>السعر</th>}
                        {visibleColumns.tax && <th className="p-2 font-bold print:text-black text-center" style={{ color: secondaryColor }}>الضريبة</th>}
                        {visibleColumns.license && <th className="p-2 font-bold print:text-black text-center" style={{ color: secondaryColor }}>اللوحات</th>}
                        {visibleColumns.total && <th className="p-2 font-bold print:text-black text-center" style={{ color: secondaryColor }}>الاجمالي</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {multiItems.map((item, index) => {
                        const qty = item.quantity || 1;
                        const rawUnitPrice = Number(item.unitPrice || item.price || item.basePrice || 0);
                        
                        // Use item-specific VAT settings if available, otherwise fallback to global props
                        const itemIsVATInclusive = item.isVATInclusive !== undefined ? item.isVATInclusive : isVATInclusive;
                        const itemTaxRate = item.taxRate !== undefined ? item.taxRate : taxRate;

                        // If inclusive, rawUnitPrice is the total price including tax.
                        // We need to show price BEFORE tax in the price column.
                        const unitBasePrice = itemIsVATInclusive 
                          ? (rawUnitPrice / (1 + itemTaxRate / 100))
                          : rawUnitPrice;
                          
                        const rowBasePriceTotal = unitBasePrice * qty;
                        const rowTaxTotal = itemIsVATInclusive 
                          ? ((rawUnitPrice * qty) - rowBasePriceTotal) 
                          : (rowBasePriceTotal * itemTaxRate / 100);
  
                        const totalRow = rowBasePriceTotal + rowTaxTotal + (item.licensePlatePrice || 0);
                        
                        // Robust logo fetching: try exact name, then first word of manufacturer name
                        let mfgLogo = getManufacturerLogo(item.manufacturer) || item.vehicleManufacturerLogo || item.logo;
                        if (!mfgLogo && item.manufacturer) {
                          const firstWord = item.manufacturer.split(' ')[0];
                          mfgLogo = getManufacturerLogo(firstWord);
                        }

                        return (
                          <tr key={index} className="border-b border-gray-200 hover:bg-gray-50/30 transition-colors">
                            <td className="p-2">
                              <div className="flex items-center gap-3">
                                {mfgLogo && (
                                  <img src={mfgLogo} alt={item.manufacturer} className="w-12 h-12 object-contain shrink-0" />
                                )}
                                <div className="flex flex-col">
                                  <span className="print:text-black font-bold text-[13px] leading-tight" style={{ color: primaryColor }}>
                                    {item.manufacturer} {item.category}
                                  </span>
                                  <span className="text-[11px] text-gray-600 font-bold" style={{ color: accentColor }}>
                                    {item.trimLevel} {item.engineCapacity}
                                  </span>
                                </div>
                              </div>
                            </td>
                            {visibleColumns.chassis && <td className="p-2 print:text-black font-bold text-center text-sm" style={{ color: accentColor }}>{item.chassisNumber || "—"}</td>}
                            {visibleColumns.year && <td className="p-2 print:text-black font-bold text-center text-sm" style={{ color: accentColor }}>{item.year}</td>}
                            {visibleColumns.color && <td className="p-2 print:text-black text-center text-sm" style={{ color: primaryColor }}>{item.exteriorColor}</td>}
                            {visibleColumns.quantity && <td className="p-2 print:text-black text-center text-sm" style={{ color: primaryColor }}>{qty}</td>}
                            {visibleColumns.unitPrice && (
                              <td className="p-2 print:text-black text-center font-medium text-sm" style={{ color: primaryColor }}>
                                {rowBasePriceTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </td>
                            )}
                            {visibleColumns.tax && (
                              <td className="p-2 print:text-black text-center text-sm" style={{ color: primaryColor }}>
                                {rowTaxTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </td>
                            )}
                            {visibleColumns.license && (
                              <td className="p-2 print:text-black text-center text-sm" style={{ color: primaryColor }}>
                                {(item.licensePlatePrice || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </td>
                            )}
                            {visibleColumns.total && (
                              <td className="p-2 print:text-black font-bold text-center text-sm" style={{ color: secondaryColor }}>
                                {totalRow.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="font-bold border-t-2" style={{ borderColor: `${secondaryColor}20` }}>
                        <td 
                          colSpan={1 + (visibleColumns.chassis ? 1 : 0) + (visibleColumns.year ? 1 : 0) + (visibleColumns.color ? 1 : 0) + (visibleColumns.quantity ? 1 : 0)} 
                          className="p-2 print:text-black text-center"
                          style={{ color: secondaryColor }}
                        >
                          الإجمالي العام
                        </td>
                        {visibleColumns.unitPrice && (
                          <td className="p-2 print:text-black text-center" style={{ color: secondaryColor }}>
                            {multiItems.reduce((sum, item) => {
                              const rawPrice = Number(item.unitPrice || item.price || item.basePrice || 0);
                              const qty = item.quantity || 1;
                              const itemIsVATInclusive = item.isVATInclusive !== undefined ? item.isVATInclusive : isVATInclusive;
                              const itemTaxRate = item.taxRate !== undefined ? item.taxRate : taxRate;
                              const base = itemIsVATInclusive ? (rawPrice / (1 + itemTaxRate / 100)) : rawPrice;
                              return sum + (base * qty);
                            }, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                        )}
                        {visibleColumns.tax && (
                          <td className="p-2 print:text-black text-center" style={{ color: secondaryColor }}>
                            {multiItems.reduce((sum, item) => {
                              const rawPrice = Number(item.unitPrice || item.price || item.basePrice || 0);
                              const qty = item.quantity || 1;
                              const itemIsVATInclusive = item.isVATInclusive !== undefined ? item.isVATInclusive : isVATInclusive;
                              const itemTaxRate = item.taxRate !== undefined ? item.taxRate : taxRate;
                              const base = itemIsVATInclusive ? (rawPrice / (1 + itemTaxRate / 100)) : rawPrice;
                              const tax = itemIsVATInclusive ? ((rawPrice * qty) - (base * qty)) : (base * qty * itemTaxRate / 100);
                              return sum + tax;
                            }, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                        )}
                        {visibleColumns.license && (
                          <td className="p-2 print:text-black text-center" style={{ color: secondaryColor }}>
                            {multiItems.reduce((sum, item) => sum + (item.licensePlatePrice || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                        )}
                        {visibleColumns.total && (
                          <td className="p-2 print:text-black text-center" style={{ color: secondaryColor }}>
                            {totalWithLicense.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                        )}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            ) : selectedVehicle ? (
              /* Single Item View */
              <div className="vehicle-info relative mb-[10px] overflow-hidden bg-transparent" style={{ width: '720px', marginTop: bgType === "dynamic" ? '2px' : '5px', padding: '0.75rem 0' }}>
                {/* Logo Watermark in background */}
                {manufacturerLogo && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                    <img src={manufacturerLogo} alt="Logo" className="w-1/2 h-1/2 object-contain grayscale" />
                  </div>
                )}
                
                <div className="relative z-10" style={{ paddingLeft: '8px', paddingRight: '8px' }}>
                  <div className="flex flex-col gap-3">
                    {/* First Row: Comprehensive Vehicle Name - Redesigned for more prominence */}
                    <div className="overflow-hidden rounded-lg border shadow-sm bg-white/60" style={{ borderColor: `${accentColor}40` }}>
                      <div className="px-3 py-2 flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 shrink-0">
                          {manufacturerLogo ? (
                            <img src={manufacturerLogo} alt={selectedVehicle.manufacturer} className="w-full h-full object-contain" />
                          ) : (
                            <Building className="w-5 h-5" style={{ color: secondaryColor }} />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-black print:text-black" style={{ color: secondaryColor }}>السيارة :</span>
                          <span className="text-[14px] font-black print:text-black" style={{ color: primaryColor }}>
                            {selectedVehicle.manufacturer} {selectedVehicle.category} {selectedVehicle.trimLevel} {selectedVehicle.engineCapacity}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Second Row: Model Year, Exterior Color, Interior Color, and Chassis Number */}
                    <div className="grid grid-cols-4 gap-3">
                      <div className="flex flex-col gap-1 p-3 rounded-lg border bg-white/40" style={{ borderColor: `${accentColor}20` }}>
                        <span className="text-[9px] font-bold opacity-60" style={{ color: secondaryColor }}>موديل السنة / MODEL</span>
                        <span className="font-black text-[12px] print:text-black" style={{ color: accentColor }}>{selectedVehicle.year}</span>
                      </div>

                      <div className="flex flex-col gap-1 p-3 rounded-lg border bg-white/40" style={{ borderColor: `${accentColor}20` }}>
                        <span className="text-[9px] font-bold opacity-60" style={{ color: secondaryColor }}>اللون الخارجي / EXTERIOR</span>
                        <span className="font-black text-[12px] print:text-black" style={{ color: primaryColor }}>{selectedVehicle.exteriorColor}</span>
                      </div>
                      
                      <div className="flex flex-col gap-1 p-3 rounded-lg border bg-white/40" style={{ borderColor: `${accentColor}20` }}>
                        <span className="text-[9px] font-bold opacity-60" style={{ color: secondaryColor }}>اللون الداخلي / INTERIOR</span>
                        <span className="font-black text-[12px] print:text-black" style={{ color: primaryColor }}>{selectedVehicle.interiorColor}</span>
                      </div>
                      
                      <div className="flex flex-col gap-1 p-3 rounded-lg border bg-white/40" style={{ borderColor: `${accentColor}20` }}>
                        <span className="text-[9px] font-bold opacity-60" style={{ color: secondaryColor }}>رقم الهيكل / CHASSIS NO.</span>
                        <span className="font-black text-[12px] print:text-black font-mono tracking-wider" style={{ color: accentColor }}>{selectedVehicle.chassisNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Specifications - Improved with Header Bar */}
                  <div className="mt-2 overflow-hidden rounded-lg border shadow-sm" style={{ borderColor: `${accentColor}30` }}>
                    {/* Formatting Bar / Header */}
                    <div 
                      className="flex items-center justify-between px-4 py-1.5 border-b" 
                      style={{ backgroundColor: `${secondaryColor}10`, borderColor: `${accentColor}30` }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-3 rounded-full" style={{ backgroundColor: accentColor }} />
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: secondaryColor }}>
                          المواصفات التفصيلية / Detailed Specifications
                        </span>
                      </div>
                      <div className="flex gap-1 print:hidden">
                        <div className="w-1.5 h-1.5 rounded-full opacity-30" style={{ backgroundColor: accentColor }} />
                        <div className="w-1.5 h-1.5 rounded-full opacity-50" style={{ backgroundColor: accentColor }} />
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
                      </div>
                    </div>

                    {isEditingSpecs ? (
                      <div className="flex flex-col gap-2 p-3 bg-white">
                        {/* Formatting Toolbar */}
                        <div className="flex items-center gap-2 pb-2 mb-1 border-b border-slate-100 overflow-x-auto scrollbar-hide">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 px-2 gap-1 text-[10px] font-bold text-slate-600 hover:bg-slate-100"
                            onClick={() => {
                              const lines = editableSpecs.split('\n');
                              const lastLine = lines[lines.length - 1];
                              if (lastLine.trim() && !lastLine.startsWith('•')) {
                                setEditableSpecs(prev => prev + '\n• ');
                              } else if (!editableSpecs.includes('•')) {
                                setEditableSpecs(prev => prev + '• ');
                              } else {
                                setEditableSpecs(prev => prev + '\n• ');
                              }
                            }}
                          >
                            <List size={14} className="text-blue-500" />
                            إضافة نقطة
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 px-2 gap-1 text-[10px] font-bold text-slate-600 hover:bg-slate-100"
                            onClick={() => setEditableSpecs(prev => prev + '\n')}
                          >
                            <PlusCircle size={14} className="text-green-500" />
                            سطر جديد
                          </Button>

                          <div className="h-4 w-[1px] bg-slate-200 mx-1" />

                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 px-2 gap-1 text-[10px] font-bold text-red-500 hover:bg-red-50"
                            onClick={() => setEditableSpecs("")}
                          >
                            <Eraser size={14} />
                            مسح الكل
                          </Button>
                        </div>

                        <textarea
                          autoFocus
                          value={editableSpecs}
                          onChange={(e) => setEditableSpecs(e.target.value)}
                          className="w-full min-h-[120px] p-3 text-sm border-2 rounded-lg resize-y focus:outline-none focus:ring-2 bg-white print:hidden shadow-sm transition-all"
                          placeholder="اكتب المواصفات التفصيلية هنا... (استخدم أسطر جديدة للفصل)"
                          style={{ 
                            direction: 'rtl', 
                            color: '#000000', 
                            borderColor: accentColor,
                            lineHeight: '1.6'
                          }}
                        />
                        <div className="flex justify-end gap-2 print:hidden">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setIsEditingSpecs(false)}
                          >
                            إلغاء
                          </Button>
                          <Button 
                            size="sm" 
                            style={{ backgroundColor: secondaryColor }}
                            onClick={() => {
                              setIsEditingSpecs(false);
                              if (onSaveSpecs) {
                                onSaveSpecs(editableSpecs);
                              }
                            }}
                          >
                            حفظ المواصفات
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onDoubleClick={() => setIsEditingSpecs(true)}
                        className="text-[11px] whitespace-pre-wrap min-h-[60px] bg-white/40 backdrop-blur-sm p-3 cursor-edit transition-all hover:bg-white/60 print:bg-transparent print:text-black print:overflow-visible"
                        style={{ 
                          color: primaryColor, 
                          lineHeight: '1.6',
                          letterSpacing: 'normal',
                          fontFeatureSettings: '"liga" 1, "calt" 1',
                          textAlign: 'right'
                        }}
                        title="اضغط مرتين للتعديل"
                      >
                        {editableSpecs ? (
                          <div className="space-y-0.5">
                            {editableSpecs.split('\n').map((line, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
                                <span>{line}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="italic opacity-50">لا توجد مواصفات تفصيلية (اضغط مرتين للإضافة)</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Financial Details moved here - under specifications */}
                  {!isMulti && (
                    <div className="mt-3 print:bg-transparent border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden" style={{ padding: '3px 14px' }}>
                      <div className="grid grid-cols-5 text-[10px] font-bold border-b border-slate-100">
                        <div className="p-1 text-center" style={{ color: secondaryColor }}>الكمية</div>
                        <div className="p-1 text-center" style={{ color: secondaryColor }}>السعر الفردي</div>
                        <div className="p-1 text-center" style={{ color: secondaryColor }}>الضريبة ({taxRate}%)</div>
                        <div className="p-1 text-center" style={{ color: secondaryColor }}>اللوحات</div>
                        <div className="p-1 text-center" style={{ color: secondaryColor }}>الإجمالي</div>
                      </div>
                      <div className="grid grid-cols-5 text-[10px]">
                        <div className="p-1 text-center" style={{ color: primaryColor }}>1</div>
                        <div className="p-1 text-center font-semibold" style={{ color: primaryColor }}>
                          {(isVATInclusive ? (basePrice - taxAmount) : basePrice).toLocaleString()}
                        </div>
                        <div className="p-1 text-center font-semibold" style={{ color: primaryColor }}>{taxAmount.toLocaleString()}</div>
                        <div className="p-1 text-center font-semibold" style={{ color: primaryColor }}>
                          {includeLicensePlate ? licensePlatePrice.toLocaleString() : "0"}
                        </div>
                        <div className="p-1 text-center font-bold" style={{ color: secondaryColor }}>
                          {totalWithLicense.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Separate Total Section - moved here */}
                  {!isMulti && (
                    <div className="print:bg-transparent border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden p-1.5 mt-2 mb-1 bg-slate-50/30">
                      <div className="grid grid-cols-10 text-xs items-center">
                        <div className="col-span-3 flex items-center justify-center border-l border-slate-100">
                          <div className="font-bold print:text-black text-[11px] text-center" style={{ color: secondaryColor }}>
                            المجموع: <span className="print:text-black" style={{ color: secondaryColor }}>{totalWithLicense.toLocaleString()}</span> ريال
                          </div>
                        </div>
                        <div className="col-span-7 flex items-center justify-center p-0.5">
                          <div className="text-center text-[10px] font-bold print:text-black" style={{ color: secondaryColor }}>
                            {numberToArabic(totalWithLicense)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Terms and Representative Row - Moved here independently as child #2 of div.mb-[11px] */}
            {!isInvoiceMode && (
              <div className="flex gap-4 mt-2">
                {/* Terms & Conditions - Flex Grow */}
                <div className="terms-section bg-white/30 backdrop-blur-sm border border-slate-100 p-2.5 rounded-lg shadow-sm flex-1">
                  <div className="flex items-center gap-2 mb-1.5 border-b border-slate-100 pb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-70" style={{ color: secondaryColor }}>الشروط والأحكام / Terms & Conditions</span>
                  </div>
                  <div className="text-[10px] space-y-0.5">
                    {termsConditions.length > 0 ? (
                      termsConditions.map((term, index) => (
                        <div key={term.id} className="flex items-start gap-2">
                          <span className="print:text-black font-bold min-w-[0.75rem]" style={{ color: accentColor }}>{index + 1}.</span>
                          <span className="leading-normal print:text-black" style={{ color: primaryColor }}>{term.term_text}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[#64748B] print:text-black italic text-[9px]">لم يتم إضافة شروط وأحكام بعد</p>
                    )}
                  </div>
                </div>

                {/* Representative Info - Fixed Width */}
                {showRepresentative && representativeName && (
                  <div className="representative-section bg-white/95 print:bg-white border border-[#E2E8F0] print:border-none p-2.5 rounded-lg shadow-sm w-56 self-start">
                    <div className="text-center mb-1.5 pb-1 border-b border-[#E2E8F0] print:border-gray-300">
                      <span className="font-bold print:text-black text-[11px]" style={{ color: secondaryColor }}>المندوب</span>
                    </div>
                    <div className="space-y-0.5 text-[10px]">
                      <div className="flex justify-between">
                        <span className="font-semibold print:text-black" style={{ color: secondaryColor }}>الاسم:</span>
                        <span className="font-medium print:text-black" style={{ color: primaryColor }}>{representativeName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold print:text-black" style={{ color: secondaryColor }}>الجوال:</span>
                        <span className="font-bold print:text-black" style={{ color: accentColor }}>{representativePhone || "—"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Company Stamp Section - Moved here independently as child #3 of div.mb-[11px] */}
            {localStamp && (
              <div 
                className="flex justify-center mt-2 cursor-pointer hover:opacity-80 transition-opacity"
                onDoubleClick={handleStampDoubleClick}
                title="Double click to change stamp"
              >
                <img 
                  src={localStamp} 
                  alt="ختم الشركة" 
                  className="w-48 h-32 object-contain max-w-[200px] max-h-[130px] print:w-[200px] print:h-[130px]"
                />
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleStampChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            )}

            {/* Appearance Footer Extra Sections - Moved to absolute position at the bottom of the page */}
            {appearance && (appearance.printFooterLeft || appearance.printFooterCenter || appearance.printFooterRight || appearance.printFooter) && (
              <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col" style={{ width: '210mm' }}>
                <div className="flex justify-between items-center text-[10px] font-bold py-[15px]" style={{ width: '210mm', paddingLeft: '40px', paddingRight: '40px', backgroundColor: '#01637f', color: '#ffffff' }}>
                  <div className="text-center" style={{ width: '30%' }}>{appearance.printFooterRight}</div>
                  <div className="flex-1 text-center">{appearance.printFooterCenter}</div>
                  <div className="flex-1 text-center" style={{ width: '30%' }}>{appearance.printFooterLeft}</div>
                </div>
                {appearance.printFooter && (
                  <div 
                    className="text-[10px] text-center py-2 flex justify-center items-center"
                    style={{ backgroundColor: '#01637f', color: '#ffffff', borderTop: '1px solid rgba(255,255,255,0.1)', width: '210mm' }}
                    dangerouslySetInnerHTML={{ __html: appearance.printFooter }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
        )}
      </div>
      )}
    {/* WhatsApp Share Dialog */}
    <Dialog open={showWhatsAppDialog} onOpenChange={setShowWhatsAppDialog}>
      <DialogContent className="max-w-sm" style={{ direction: "rtl" }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#01637f]">
            <MessageCircle size={18} className="text-[#25D366]" />
            إرسال عرض السعر عبر واتساب
          </DialogTitle>
        </DialogHeader>

        <div className="py-3 space-y-3">
          <p className="text-sm text-gray-600">
            سيتم تحميل ملف PDF أولاً، ثم فتح محادثة واتساب مع رسالة جاهزة.
          </p>
          <div>
            <label className="text-xs font-bold text-[#01637f] mb-1 block">رقم الجوال (بدون مفتاح الدولة)</label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-2 rounded-lg border">+966</span>
              <Input
                value={whatsAppPhone}
                onChange={(e) => setWhatsAppPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="5xxxxxxxx"
                className="flex-1 text-left ltr border-[#C79C45] focus:ring-[#01637f]"
                maxLength={9}
                data-testid="input-whatsapp-phone"
              />
            </div>
          </div>
          {customerName && (
            <p className="text-xs text-gray-500">العميل: <span className="font-bold text-[#01637f]">{customerName}</span></p>
          )}
        </div>

        <DialogFooter className="flex gap-2 flex-row-reverse">
          <Button
            onClick={handleSendWhatsApp}
            disabled={isSharingWhatsApp || !whatsAppPhone}
            className="flex-1 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold gap-2 rounded-xl"
            data-testid="button-confirm-whatsapp"
          >
            <MessageCircle size={15} />
            {isSharingWhatsApp ? "جارٍ الإرسال..." : "إرسال"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowWhatsAppDialog(false)}
            className="flex-1 rounded-xl border-gray-300"
            data-testid="button-cancel-whatsapp"
          >
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </div>
  );
}
