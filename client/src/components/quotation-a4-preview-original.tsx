import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { QrCode, Phone, Mail, Globe, Building } from "lucide-react";
import { numberToArabic } from "@/utils/number-to-arabic";
import type { Company, InventoryItem, Specification } from "@shared/schema";
import { getManufacturerLogo } from "@shared/manufacturer-logos";
import QRCode from "qrcode";


// Background images
const backgroundImages = {
  albarimi1: '/albarimi-1.svg',
  albarimi2: '/albarimi-2.svg'
};

interface QuotationA4PreviewProps {
  selectedCompany: Company | null;
  selectedVehicle: InventoryItem | null;
  vehicleSpecs?: Specification | null;
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
  authorizationNumber = ""
}: QuotationA4PreviewProps) {
  
  const [termsConditions, setTermsConditions] = useState<Array<{ id: number; term_text: string; display_order: number }>>([]);
  const [manufacturerLogo, setManufacturerLogo] = useState<string | null>(null);

  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const [editableSpecs, setEditableSpecs] = useState<string>("");
  const [useAlbarimi2Background, setUseAlbarimi2Background] = useState(true); // Default to albarimi-2
  const previewRef = useRef<HTMLDivElement>(null);

  // Print function for the quotation preview
  const handlePrint = () => {
    const printContent = previewRef.current;
    if (!printContent) {
      console.error('لا يوجد محتوى للطباعة');
      return;
    }

    // Create comprehensive styles for print that match the preview exactly
    const printStyles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap');
        
        @page {
          margin: 0 !important;
          size: A4 portrait !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
          width: 210mm !important;
          height: 297mm !important;
        }
        
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
          print-color-adjust: exact;
        }
        
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          font-family: 'Noto Sans Arabic', Arial, sans-serif !important;
          direction: rtl !important;
          background: white !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
          width: 210mm !important;
          height: 297mm !important;
          overflow: hidden !important;
          transform: none !important;
          zoom: 1 !important;
          scale: 1 !important;
        }
        
        .print-content {
          width: 210mm !important;
          height: 297mm !important;
          min-width: 210mm !important;
          min-height: 297mm !important;
          max-width: 210mm !important;
          max-height: 297mm !important;
          background-size: cover !important;
          background-repeat: no-repeat !important;
          background-position: center !important;
          position: relative !important;
          transform: none !important;
          zoom: 1 !important;
          scale: 1 !important;
          overflow: hidden !important;
          font-family: 'Noto Sans Arabic', Arial, sans-serif !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
          image-rendering: crisp-edges !important;
          image-rendering: -webkit-optimize-contrast !important;
          page-break-inside: avoid !important;
          display: block !important;
          margin: 0 auto !important;
          padding: 0 !important;
        }
        
        /* Mobile print optimization */
        @media screen and (max-width: 768px) {
          .print-content {
            width: 100vw !important;
            height: auto !important;
            min-width: 100vw !important;
            min-height: auto !important;
            max-width: 100vw !important;
            max-height: none !important;
            transform: scale(1) !important;
            zoom: 1 !important;
            overflow: visible !important;
          }
        }
        
        /* Additional mobile compatibility */
        @media print and (max-width: 768px) {
          .print-content {
            width: 210mm !important;
            height: 297mm !important;
            transform: none !important;
            zoom: 1 !important;
            page-break-inside: avoid !important;
          }
          
          html, body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
        
        /* Prevent layout distortion in print */
        @media print {
          * {
            -webkit-box-sizing: border-box !important;
            box-sizing: border-box !important;
            max-width: none !important;
          }
          
          html {
            width: 210mm !important;
            height: 297mm !important;
            font-size: 12pt !important;
          }
          
          body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            font-size: 12pt !important;
          }
          
          .print-content {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
            position: static !important;
            float: none !important;
            clear: both !important;
            page-break-inside: avoid !important;
            overflow: visible !important;
          }
          
          /* Fix container and wrapper issues */
          .print-content > * {
            max-width: 100% !important;
            overflow: visible !important;
          }
        }
        
        /* Hide interactive elements during print */
        .print-content button,
        .print-content .cursor-pointer,
        .print-content [class*="hover:"],
        .print-content .print\\:hidden,
        .print-content [class*="print:hidden"],
        .print-content .no-print,
        .print-content [data-html2canvas-ignore] {
          display: none !important;
          visibility: hidden !important;
        }
        
        /* Ensure all text is black and borders are visible for print */
        .print-content * {
          color: black !important;
          border-color: #cccccc !important;
        }
        
        /* Fix text rendering and spacing issues */
        .print-content {
          line-height: 1.4 !important;
          letter-spacing: normal !important;
        }
        
        /* Fix overlapping text issues */
        .print-content .text-xs {
          font-size: 11px !important;
          line-height: 1.3 !important;
        }
        
        .print-content .text-sm {
          font-size: 13px !important;
          line-height: 1.4 !important;
        }
        
        /* Ensure proper spacing between elements */
        .print-content .space-y-1 > * + * {
          margin-top: 0.25rem !important;
        }
        
        .print-content .space-y-2 > * + * {
          margin-top: 0.5rem !important;
        }
        
        /* Fix general grid cell content alignment */
        .print-content .grid > div {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 0.5rem !important;
        }
        
        /* Ensure proper Arabic text rendering */
        .print-content {
          font-feature-settings: normal !important;
          text-rendering: optimizeLegibility !important;
        }
        
        /* Fix customer and vehicle information sections */
        .print-content .bg-white\\/95 {
          background-color: white !important;
          border: 1px solid #cccccc !important;
          margin-bottom: 1rem !important;
          padding: 1rem !important;
        }
        
        /* Customer info specific styling */
        .print-content .customer-info .flex {
          margin-bottom: 8px !important;
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
        }
        
        /* Vehicle info specific styling */
        .print-content .vehicle-info .flex {
          margin-bottom: 8px !important;
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
        }
        
        /* Representative section fix */
        .print-content .representative-section {
          background-color: white !important;
          border: 1px solid #cccccc !important;
          padding: 0.75rem !important;
        }
        
        /* Terms and conditions section fix */
        .print-content .terms-section {
          background-color: white !important;
          border: 1px solid #cccccc !important;
          padding: 1rem !important;
        }
        
        .print-content .terms-section .flex {
          margin-bottom: 6px !important;
          display: flex !important;
          align-items: flex-start !important;
          gap: 8px !important;
        }
        
        /* Preserve background images and colors */
        .print-content img {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
          print-color-adjust: exact;
        }
        
        /* Stamp sizing for print */
        .print-content img[alt="ختم الشركة"] {
          width: 216px !important;
          height: 144px !important;
          max-width: 216px !important;
          max-height: 144px !important;
        }
        
        /* Ensure proper font sizing and spacing */
        .print-content .text-xs { font-size: 0.75rem; }
        .print-content .text-sm { font-size: 0.875rem; }
        .print-content .text-base { font-size: 1rem; }
        .print-content .text-lg { font-size: 1.125rem; }
        
        /* Maintain grid layouts */
        .print-content .grid { display: grid; }
        .print-content .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .print-content .grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
        .print-content .grid-cols-10 { grid-template-columns: repeat(10, minmax(0, 1fr)); }
        
        /* Maintain flex layouts */
        .print-content .flex { display: flex; }
        .print-content .justify-between { justify-content: space-between; }
        .print-content .items-center { align-items: center; }
        .print-content .justify-center { justify-content: center; }
        
        /* Table cell alignment fixes with proper height and spacing */
        .print-content .grid-cols-5 > div {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-align: center !important;
          min-height: 35px !important;
          padding: 8px 4px !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          white-space: normal !important;
        }
        
        .print-content .grid-cols-10 > div {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-align: center !important;
          min-height: 35px !important;
          padding: 8px 4px !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          white-space: normal !important;
        }
        
        /* Fix pricing table display issues */
        .print-content .grid.grid-cols-5,
        .print-content .grid.grid-cols-10 {
          border-collapse: separate !important;
          border-spacing: 0 !important;
        }
        
        /* Prevent text overflow in narrow columns */
        .print-content .grid-cols-5 > div,
        .print-content .grid-cols-10 > div {
          font-size: 11px !important;
          line-height: 1.2 !important;
          hyphens: auto !important;
        }
        
        /* Preserve margins and padding */
        .print-content .p-2 { padding: 0.5rem; }
        .print-content .p-3 { padding: 0.75rem; }
        .print-content .p-4 { padding: 1rem; }
        .print-content .p-8 { padding: 2rem; }
        .print-content .mb-6 { margin-bottom: 1.5rem; }
        .print-content .mt-3 { margin-top: 0.75rem; }
        .print-content .mt-4 { margin-top: 1rem; }
        
        /* Font weights */
        .print-content .font-bold { font-weight: 700; }
        .print-content .font-semibold { font-weight: 600; }
        .print-content .font-medium { font-weight: 500; }
        
        @media print {
          body { margin: 0; }
          .no-print, button, .cursor-pointer { display: none !important; }
        }
      </style>
    `;

    const printWindow = window.open('', '_blank', 'width=210mm,height=297mm');
    if (printWindow) {
      // Get the background image as absolute URL
      const backgroundUrl = window.location.origin + (useAlbarimi2Background ? backgroundImages.albarimi2 : backgroundImages.albarimi1);
      
      // Clean the content to remove all buttons and interactive elements
      let cleanContent = printContent.innerHTML;
      // Remove all buttons
      cleanContent = cleanContent.replace(/<button[^>]*>.*?<\/button>/gi, '');
      // Remove elements with print:hidden class
      cleanContent = cleanContent.replace(/<[^>]*class="[^"]*print:hidden[^"]*"[^>]*>.*?<\/[^>]*>/gi, '');
      // Remove elements with no-print class
      cleanContent = cleanContent.replace(/<[^>]*class="[^"]*no-print[^"]*"[^>]*>.*?<\/[^>]*>/gi, '');
      
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>طباعة ${isInvoiceMode ? 'فاتورة' : 'عرض سعر'} - ${quoteNumber || invoiceNumber}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="print-color-adjust" content="exact">
            <meta name="color-scheme" content="light">
            ${printStyles}
          </head>
          <body>
            <div class="print-content" style="background-image: url('${backgroundUrl}'); image-rendering: crisp-edges; image-rendering: -webkit-optimize-contrast;">
              ${cleanContent}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      // Wait for all content including images and fonts to load with higher DPI rendering
      printWindow.onload = () => {
        // Set print media type for better quality
        const printMedia = printWindow.document.createElement('style');
        printMedia.innerHTML = `
          @media print {
            * { 
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-content {
              image-rendering: -webkit-optimize-contrast !important;
              image-rendering: crisp-edges !important;
            }
          }
        `;
        printWindow.document.head.appendChild(printMedia);
        
        setTimeout(() => {
          printWindow.print();
        }, 1500);
      };
      
      // Fallback if onload doesn't work
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          printWindow.print();
        }
      }, 2000);
    }
  };

  // Fetch terms and conditions
  useEffect(() => {
    const fetchTermsConditions = async () => {
      try {
        const response = await fetch('/api/terms-conditions');
        if (response.ok) {
          const data = await response.json();
          setTermsConditions(data);
        }
      } catch (error) {
        console.error('Error fetching terms and conditions:', error);
      }
    };

    fetchTermsConditions();
  }, [termsRefreshTrigger]);

  // Fetch manufacturer logo
  useEffect(() => {
    const fetchManufacturerLogo = async () => {
      if (selectedVehicle?.manufacturer) {
        try {
          const response = await fetch(`/api/manufacturers/${encodeURIComponent(selectedVehicle.manufacturer)}`);
          if (response.ok) {
            const data = await response.json();
            setManufacturerLogo(data.logo);
          }
        } catch (error) {
          console.error('Error fetching manufacturer logo:', error);
        }
      }
    };

    fetchManufacturerLogo();
  }, [selectedVehicle?.manufacturer]);

  // Generate QR Code
  useEffect(() => {
    const generateQRCode = async () => {
      if (selectedVehicle && customerName && customerPhone) {
        try {
          const qrData = {
            quoteNumber: isInvoiceMode ? invoiceNumber : quoteNumber,
            customer: customerName,
            phone: customerPhone,
            vehicle: `${selectedVehicle.manufacturer} ${selectedVehicle.category}`,
            year: selectedVehicle.year,
            chassisNumber: selectedVehicle.chassisNumber,
            price: basePrice,
            date: new Date().toLocaleDateString('en-GB')
          };
          
          const qrString = Object.entries(qrData)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
          
          const qrCodeDataURL = await QRCode.toDataURL(qrString, {
            width: 64,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          
          setQrCodeDataURL(qrCodeDataURL);
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      }
    };

    generateQRCode();
  }, [selectedVehicle, customerName, customerPhone, quoteNumber, invoiceNumber, isInvoiceMode, basePrice]);

  // Update editable specs when vehicle specs change
  useEffect(() => {
    setEditableSpecs(vehicleSpecs?.detailedDescription || "");
  }, [vehicleSpecs?.detailedDescription]);



  // Calculate pricing
  const grandTotal = isVATInclusive ? finalPrice : (finalPrice + (finalPrice * taxRate / 100));
  const taxAmount = isVATInclusive ? (finalPrice * taxRate / (100 + taxRate)) : (finalPrice * taxRate / 100);

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Controls - Background Toggle and Print Button */}
      <div className="mb-4 flex justify-center items-center gap-4 print:hidden no-print" data-html2canvas-ignore="true">
        <div className="flex items-center gap-3 border border-yellow-600 rounded-lg px-4 py-3 bg-white">
          <span className="bg-[#cf9b46] text-[#fcfcfc] text-[15px] px-2 py-1 rounded">البريمي</span>
          <div className="relative">
            <div 
              className={`w-11 h-6 rounded-full cursor-pointer transition-all duration-300 ${
                useAlbarimi2Background ? 'bg-yellow-600' : 'bg-yellow-200'
              }`}
              onClick={() => setUseAlbarimi2Background(!useAlbarimi2Background)}
            >
              <div 
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-300 ease-in-out ${
                  useAlbarimi2Background ? 'right-1' : 'right-6'
                }`}
              />
            </div>
          </div>
          <span className="text-sm text-yellow-700 font-medium">خلفية 2</span>
        </div>
        
        <Button 
          onClick={handlePrint}
          className="bg-[#2B4C8C] hover:bg-[#1e3a6f] text-white px-6 py-2 text-sm font-medium shadow-lg"
        >
          🖨️ طباعة الكوتيشن
        </Button>

      </div>

      <div 
        ref={previewRef}
        data-pdf-export="quotation"
        className="mx-auto text-black shadow-2xl print:shadow-none border border-slate-200 overflow-hidden relative print:border-none"
        style={{
          width: '210mm',
          height: '297mm',
          minWidth: '210mm',
          minHeight: '297mm',
          maxWidth: '210mm',
          maxHeight: '297mm',
          fontFamily: '"Noto Sans Arabic", Arial, sans-serif',
          direction: 'rtl',
          backgroundImage: `url(${useAlbarimi2Background ? backgroundImages.albarimi2 : backgroundImages.albarimi1})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          boxSizing: 'border-box',
          position: 'relative',
          transform: 'none',
          zoom: 1,
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
          colorAdjust: 'exact'
        }}
      >
        {/* Content overlay on A4 background */}
        <div className="absolute inset-0 p-8">
          
          {/* Header section with company logo and QR code */}
          <div className="relative mb-8">
            {/* Company Logo */}
            {selectedCompany?.logo && (
              <div className="absolute top-4 left-8 w-20 h-20">
                <img 
                  src={selectedCompany.logo} 
                  alt={selectedCompany.name}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Document Type with Number and Date in same row */}
            <div className="absolute top-20 right-8">
              <div className="flex items-center gap-8">
                <h2 className="text-base font-bold text-[#2B4C8C] print:text-black mt-[4px] mb-[4px]" style={{fontFamily: 'Cairo, sans-serif'}}>
                  {isInvoiceMode ? 'فاتورة' : 'عرض سعر'}
                </h2>
                <div className="text-xs text-[#1A365D] print:text-black">
                  <span className="font-semibold">رقم: </span>
                  <span className="font-bold text-[#C49632]">{isInvoiceMode ? invoiceNumber : quoteNumber}</span>
                </div>
                <div className="text-xs text-[#1A365D] print:text-black">
                  <span className="font-semibold">الإصدار: </span>
                  <span className="font-bold text-[#C49632]">{new Date().toLocaleDateString('en-GB')}</span>
                </div>
                {!isInvoiceMode && (
                  <div className="text-xs text-[#1A365D] print:text-black">
                    <span className="font-semibold">صالح حتى: </span>
                    <span className="font-bold text-[#C49632]">{validUntil.toLocaleDateString('en-GB')}</span>
                  </div>
                )}
              </div>
              
              {/* Customer Information Details below header */}
              <div className="customer-info mt-4 bg-white/95 print:bg-white p-3 pt-[1px] pb-[1px] text-[13px] text-right print:border-none">
                <div className="space-y-2 text-xs">
                  <div className="text-right text-[16px] font-semibold text-[#2B4C8C] print:text-black">
                    {isInvoiceMode ? (
                      <span>بناءً على تعميدكم رقم: <span className="text-[#C49632]">{quoteNumber}</span></span>
                    ) : (
                      <span>{customerTitle} {"\u002F"} <span className="text-[#C49632] ml-[14px] mr-[14px]">{customerName || "غير محدد"}</span> &nbsp;&nbsp;&nbsp; الموقرين</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>



          {/* Vehicle Information Section */}
          <div className="mb-[11px] ml-[25px] mr-[25px]" style={{marginTop: '38px'}}>
            

            {/* Vehicle Information */}
            {selectedVehicle && (
              <div className="vehicle-info relative p-4 w-full mt-[166px] mb-[16px] overflow-hidden print:bg-transparent border border-[#E2E8F0] rounded-lg shadow-lg print:border-none pl-[18px] pr-[18px] ml-[-22px] mr-[-22px]">
                {/* Systematic Manufacturer Logo Watermark Pattern */}
                {selectedVehicle && manufacturerLogo && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Organized grid pattern with systematic layout */}
                    <div className="grid grid-cols-4 grid-rows-3 gap-6 h-full w-full p-4">
                      {Array.from({ length: 12 }).map((_, index) => (
                        <div key={index} className="flex items-center justify-center">
                          <img 
                            src={manufacturerLogo} 
                            alt={`${selectedVehicle.manufacturer} logo`}
                            className="w-16 h-16 object-contain opacity-20"
                            style={{
                              filter: "sepia(1) saturate(2) hue-rotate(25deg) brightness(1.2)",
                              color: '#C79C45'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    
                    {/* Central focal logo with golden color */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div 
                        className="w-24 h-24 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(199, 156, 69, 0.1)' }}
                      >
                        <img 
                          src={manufacturerLogo} 
                          alt={`${selectedVehicle.manufacturer} logo`}
                          className="w-20 h-20 object-contain opacity-30"
                          style={{
                            filter: "sepia(1) saturate(2) hue-rotate(25deg) brightness(1.2)",
                            color: '#C79C45'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="relative z-10 text-xs">
                  {/* Vehicle Information Grid - Two Rows Layout */}
                  <div className="space-y-4 text-[13px]">
                    {/* First Row: Manufacturer, Category, Trim Level */}
                    <div className="grid grid-cols-3 gap-x-6">
                      <div className="flex justify-between">
                        <span className="font-semibold text-[#2B4C8C] print:text-black">الصانع:</span>
                        <span className="text-right text-[#1A365D] font-medium print:text-black">{selectedVehicle.manufacturer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-[#2B4C8C] print:text-black">الفئة:</span>
                        <span className="text-right text-[#1A365D] font-medium print:text-black">{selectedVehicle.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-[#2B4C8C] print:text-black">درجة التجهيز:</span>
                        <span className="text-right text-[#1A365D] font-medium print:text-black">{selectedVehicle.trimLevel || "غير محدد"}</span>
                      </div>
                    </div>
                    
                    {/* Second Row: Year, Exterior Color, Interior Color */}
                    <div className="grid grid-cols-3 gap-x-6">
                      <div className="flex justify-between">
                        <span className="font-semibold text-[#2B4C8C] print:text-black">السنة:</span>
                        <span className="text-right text-[#C49632] font-bold print:text-black">{selectedVehicle.year}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-[#2B4C8C] print:text-black">اللون الخارجي:</span>
                        <span className="text-right text-[#1A365D] font-medium print:text-black">{selectedVehicle.exteriorColor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-[#2B4C8C] print:text-black">اللون الداخلي:</span>
                        <span className="text-right text-[#1A365D] font-medium print:text-black">{selectedVehicle.interiorColor}</span>
                      </div>
                    </div>
                    
                    {/* Third Row: Chassis Number - Full Width */}
                    <div className="flex justify-between w-full">
                      <span className="font-semibold text-[#2B4C8C] print:text-black">رقم الهيكل:</span>
                      <span className="text-right text-[#C49632] font-bold print:text-black">{selectedVehicle.chassisNumber}</span>
                    </div>
                  </div>
                </div>
                
                {/* Detailed Specifications - Full Width Editable */}
<div className="mt-3 pt-3">
                  <div className="flex items-center justify-between mt-[-10px] mb-[-10px] pt-[0px] pb-[0px]">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingSpecs(!isEditingSpecs)}
                      className="text-xs px-2 py-1 print:hidden no-print border-[#C49632] text-[#C49632] hover:bg-[#C49632] hover:text-white"
                      style={{ display: 'none' }}
                      data-html2canvas-ignore="true"
                    >
                      {isEditingSpecs ? "حفظ" : "تحرير"}
                    </Button>
                  </div>
                  {isEditingSpecs ? (
                    <textarea
                      value={editableSpecs}
                      onChange={(e) => setEditableSpecs(e.target.value)}
                      className="w-full h-20 p-2 text-xs text-[#1A365D] border border-[#E2E8F0] rounded resize-none focus:outline-none focus:ring-2 focus:ring-[#C49632] focus:border-[#C49632]"
                      placeholder="اكتب المواصفات التفصيلية هنا..."
                      style={{ direction: 'rtl' }}
                    />
                  ) : (
                    <div className="text-xs text-[#1A365D] whitespace-pre-wrap max-h-20 overflow-y-auto bg-[#F8FAFC] border border-[#E2E8F0] p-2 rounded print:bg-white print:text-black print:border-none">
                      {editableSpecs || "لا توجد مواصفات تفصيلية"}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Price Breakdown Table */}
          <div className="print:bg-transparent border border-[#E2E8F0] rounded-lg mb-4 shadow-lg overflow-hidden p-4 bg-[#c49633a1]"></div>
            
            {/* Table Header */}
            <div className="grid grid-cols-5 print:bg-transparent border-b border-white print:border-white text-xs font-bold">
              <div className="p-2 border-l border-white print:border-white text-[#2B4C8C] print:text-black text-center flex items-center justify-center">الكمية</div>
              <div className="p-2 border-l border-white print:border-white text-[#2B4C8C] print:text-black text-center flex items-center justify-center">السعر الفردي</div>
              <div className="p-2 border-l border-white print:border-white text-[#2B4C8C] print:text-black text-center flex items-center justify-center">الضريبة ({taxRate}%)</div>
              <div className="p-2 border-l border-white print:border-white text-[#2B4C8C] print:text-black text-center flex items-center justify-center">اللوحات</div>
              <div className="p-2 text-[#2B4C8C] print:text-black text-center flex items-center justify-center">الإجمالي</div>
            </div>
            
            {/* Table Data Row */}
            <div className="grid grid-cols-5 print:bg-transparent text-xs">
              <div className="p-2 border-l border-white print:border-white text-[#1A365D] print:text-black text-center flex items-center justify-center">1</div>
              <div className="p-2 border-l border-white print:border-white font-semibold text-[#1A365D] print:text-black text-center flex items-center justify-center">{basePrice.toLocaleString()}</div>
              <div className="p-2 border-l border-white print:border-white font-semibold text-[#1A365D] print:text-black text-center flex items-center justify-center">{taxAmount.toLocaleString()}</div>
              <div className="p-2 border-l border-white print:border-white font-semibold text-[#1A365D] print:text-black text-center flex items-center justify-center">
                {includeLicensePlate ? licensePlatePrice.toLocaleString() : "0"}
              </div>
              <div className="p-2 font-bold text-[#2B4C8C] print:text-black text-center flex items-center justify-center">
                {(grandTotal + (includeLicensePlate ? licensePlatePrice : 0)).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Separate Total Section */}
          <div className="print:bg-transparent border border-[#E2E8F0] rounded-lg shadow-lg overflow-hidden p-4 pt-[1px] pb-[1px] mt-[12px] mb-[12px]">
            <div className="grid grid-cols-10 print:bg-transparent text-xs">
              <div className="p-4 col-span-3 flex items-center justify-center">
                <div className="font-bold text-[#2B4C8C] print:text-black text-[13px] text-center">
                  المجموع: <span className="text-[#2B4C8C] print:text-black">{(grandTotal + (includeLicensePlate ? licensePlatePrice : 0)).toLocaleString()}</span> ريال
                </div>
              </div>
              <div className="p-4 col-span-7 flex items-center justify-center">
                <div className="text-center text-xs font-bold text-[#2B4C8C] print:text-black">
                  {numberToArabic(grandTotal + (includeLicensePlate ? licensePlatePrice : 0))}
                </div>
              </div>
            </div>
          </div>

          {/* Representative Information and Terms & Conditions Section */}
          <div className="flex gap-6 mb-6">
            {/* Terms & Conditions Section - Hidden in invoice mode */}
            {!isInvoiceMode && (
              <div className="terms-section bg-white/95 print:bg-white border border-[#E2E8F0] print:border-none p-4 rounded-lg flex-1 shadow-sm" style={{backgroundColor: '#c49633a1'}}>
                
                <div className="text-xs space-y-2">
                  {termsConditions.length > 0 ? (
                    termsConditions.map((term, index) => (
                      <div key={term.id} className="flex items-start gap-2">
                        <span className="text-[#C49632] print:text-black font-bold min-w-[1rem]">{index + 1}.</span>
                        <span className="leading-relaxed text-[#1A365D] print:text-black">{term.term_text}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[#64748B] print:text-black italic">لم يتم إضافة شروط وأحكام بعد</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Representative Information - Small box on the right - Hidden if no representative selected */}
            {representativeName && (
              <div className="representative-section bg-white/95 print:bg-white border border-[#E2E8F0] print:border-none p-3 rounded-lg shadow-sm w-64">
                <div className="text-center mb-2 pb-1 border-b border-[#E2E8F0] print:border-gray-300">
                  <span className="font-bold text-[#2B4C8C] print:text-black text-sm">المندوب</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-semibold text-[#2B4C8C] print:text-black">الاسم:</span>
                    <span className="text-[#1A365D] font-medium print:text-black">{representativeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-[#2B4C8C] print:text-black">الجوال:</span>
                    <span className="text-[#C49632] font-bold print:text-black">{representativePhone || "غير محدد"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Company Stamp Section */}
          {companyStamp && (
            <div className="flex justify-end mb-6">
              <img 
                src={companyStamp} 
                alt="ختم الشركة" 
                className="w-52 h-36 object-contain max-w-[216px] max-h-[144px] print:w-[216px] print:h-[144px]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
