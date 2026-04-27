import React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Image, FileText, Printer } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface EnhancedPDFExportProps {
  targetElementId: string;
  filename?: string;
  showJPGExport?: boolean;
  showPDFExport?: boolean;
  showPrintButton?: boolean;
}

export default function EnhancedPDFExport({
  targetElementId,
  filename = "quotation",
  showJPGExport = true,
  showPDFExport = true,
  showPrintButton = true
}: EnhancedPDFExportProps) {
  const { toast } = useToast();

  // Export as high-quality JPG image
  const exportAsJPG = async () => {
    try {
      const element = document.querySelector(`[data-pdf-export="${targetElementId}"]`) as HTMLElement;
      if (!element) {
        toast({
          title: "خطأ",
          description: "لا يمكن العثور على العنصر المطلوب",
          variant: "destructive",
        });
        return;
      }

      // Wait for images and fonts to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create high-quality canvas
      const canvas = await html2canvas(element, {
        scale: 3, // Higher scale for better quality
        logging: false,
        allowTaint: true,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        imageTimeout: 0,
        removeContainer: true,
        foreignObjectRendering: false
      });

      // Convert to high-quality JPG
      const imageDataURL = canvas.toDataURL('image/jpeg', 0.95); // High quality JPG
      
      // Create download link
      const link = document.createElement('a');
      link.href = imageDataURL;
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير الصورة بتنسيق JPG عالي الجودة",
      });
    } catch (error) {
      console.error('Error exporting JPG:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير الصورة",
        variant: "destructive",
      });
    }
  };

  // Export as optimized PDF
  const exportAsPDF = async () => {
    try {
      const element = document.querySelector(`[data-pdf-export="${targetElementId}"]`) as HTMLElement;
      if (!element) {
        toast({
          title: "خطأ",
          description: "لا يمكن العثور على العنصر المطلوب",
          variant: "destructive",
        });
        return;
      }

      // Wait for images and fonts to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create high-quality canvas with proper dimensions
      const canvas = await html2canvas(element, {
        scale: 2, // Good balance of quality and file size
        logging: false,
        allowTaint: true,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        imageTimeout: 0,
        removeContainer: true,
        foreignObjectRendering: false
      });

      // Create PDF with proper A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // Calculate dimensions to fit A4
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      // Calculate scaling to fit A4 while maintaining aspect ratio
      const scale = 2; // We know the scale we used
      const widthRatio = pdfWidth / (canvasWidth / scale);
      const heightRatio = pdfHeight / (canvasHeight / scale);
      const ratio = Math.min(widthRatio, heightRatio);
      
      const imgWidth = (canvasWidth / scale) * ratio;
      const imgHeight = (canvasHeight / scale) * ratio;
      
      // Center the image on the page
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;

      // Add image to PDF with optimized quality
      pdf.addImage(
        canvas.toDataURL('image/png', 1.0),
        'PNG',
        x,
        y,
        imgWidth,
        imgHeight,
        '',
        'FAST'
      );

      // Save PDF
      pdf.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير العرض إلى ملف PDF محسن",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      toast({
        title: "خطأ في التصدير",
        description: `فشل تصدير PDF: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  // Enhanced print function to print quotation preview with exact formatting
  const handlePrint = () => {
    try {
      const element = document.querySelector(`[data-pdf-export="${targetElementId}"]`) as HTMLElement;
      if (!element) {
        console.error('Print: Target element not found');
        toast({
          title: "خطأ في الطباعة",
          description: "لا يمكن العثور على قسم المعاينة",
          variant: "destructive",
        });
        return;
      }

      // Clone the element to avoid modifying the original
      const clonedElement = element.cloneNode(true) as HTMLElement;
      
      // Remove interactive elements from clone
      const interactiveElements = clonedElement.querySelectorAll('button, .no-print, [data-html2canvas-ignore="true"]');
      interactiveElements.forEach(el => el.remove());

      // Enhanced print styles maintaining exact A4 preview formatting
      const printStyles = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');
          
          @page {
            size: A4 portrait;
            margin: 0;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            print-color-adjust: exact;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box;
          }
          
          html, body {
            margin: 0;
            padding: 0;
            width: 210mm;
            height: 297mm;
            font-family: 'Noto Sans Arabic', 'Cairo', Arial, sans-serif;
            direction: rtl;
            background: white;
            font-size: 12px;
            line-height: 1.4;
          }
          
          .print-container {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            background-size: cover;
            background-repeat: no-repeat;
            background-position: center;
            position: relative;
            overflow: hidden;
            page-break-inside: avoid;
            transform-origin: top left;
          }
          
          /* Preserve all Tailwind-like classes for exact formatting */
          .text-xs { font-size: 10px; line-height: 1.4; }
          .text-sm { font-size: 12px; line-height: 1.4; }
          .text-base { font-size: 14px; line-height: 1.4; }
          .text-lg { font-size: 16px; line-height: 1.4; }
          .font-bold { font-weight: 700; }
          .font-semibold { font-weight: 600; }
          .font-medium { font-weight: 500; }
          
          /* Layout preservation */
          .grid { display: grid; }
          .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
          .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
          .grid-cols-5 { grid-template-columns: repeat(5, 1fr); }
          .grid-cols-10 { grid-template-columns: repeat(10, 1fr); }
          .grid-rows-3 { grid-template-rows: repeat(3, 1fr); }
          .gap-x-6 { column-gap: 1.5rem; }
          .gap-6 { gap: 1.5rem; }
          .col-span-3 { grid-column: span 3; }
          .col-span-7 { grid-column: span 7; }
          
          .flex { display: flex; }
          .items-center { align-items: center; }
          .items-start { align-items: flex-start; }
          .justify-between { justify-content: space-between; }
          .justify-center { justify-content: center; }
          .justify-end { justify-content: flex-end; }
          
          /* Spacing - maintain exact margins and padding */
          .space-y-1 > * + * { margin-top: 0.25rem; }
          .space-y-2 > * + * { margin-top: 0.5rem; }
          .space-y-4 > * + * { margin-top: 1rem; }
          .p-2 { padding: 0.5rem; }
          .p-3 { padding: 0.75rem; }
          .p-4 { padding: 1rem; }
          .pt-1 { padding-top: 0.25rem; }
          .pb-1 { padding-bottom: 0.25rem; }
          .pl-18 { padding-left: 4.5rem; }
          .pr-18 { padding-right: 4.5rem; }
          .mt-3 { margin-top: 0.75rem; }
          .mt-4 { margin-top: 1rem; }
          .mt-166 { margin-top: 10.375rem; }
          .mb-4 { margin-bottom: 1rem; }
          .mb-6 { margin-bottom: 1.5rem; }
          .mb-11 { margin-bottom: 2.75rem; }
          .mb-16 { margin-bottom: 4rem; }
          .ml-25 { margin-left: 6.25rem; }
          .mr-25 { margin-right: 6.25rem; }
          .ml-neg-22 { margin-left: -5.5rem; }
          .mr-neg-22 { margin-right: -5.5rem; }
          
          /* Colors - ensure proper print colors */
          .text-black, .print\\:text-black { color: black !important; }
          .bg-white, .print\\:bg-white { background-color: white !important; }
          .print\\:bg-transparent { background-color: transparent !important; }
          .bg-white\\/95 { background-color: rgba(255, 255, 255, 0.95) !important; }
          
          /* Borders - maintain exact border styling */
          .border { border: 1px solid #e2e8f0; }
          .border-l { border-left: 1px solid white; }
          .border-b { border-bottom: 1px solid #e2e8f0; }
          .border-white { border-color: white; }
          .print\\:border-white { border-color: white !important; }
          .print\\:border-none { border: none !important; }
          .rounded-lg { border-radius: 0.5rem; }
          
          /* Text alignment */
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          
          /* Position - maintain exact positioning */
          .absolute { position: absolute; }
          .relative { position: relative; }
          .top-4 { top: 1rem; }
          .top-20 { top: 5rem; }
          .right-8 { right: 2rem; }
          .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
          .top-1\\/2 { top: 50%; }
          .left-1\\/2 { left: 50%; }
          .transform { transform: var(--tw-transform); }
          .-translate-x-1\\/2 { --tw-transform: translateX(-50%) translateY(var(--tw-translate-y, 0)); }
          .-translate-y-1\\/2 { --tw-transform: translateX(var(--tw-translate-x, 0)) translateY(-50%); }
          
          /* Width and height - exact sizing */
          .w-16 { width: 4rem; }
          .h-16 { height: 4rem; }
          .w-20 { width: 5rem; }
          .h-20 { height: 5rem; }
          .w-24 { width: 6rem; }
          .h-24 { height: 6rem; }
          .w-54 { width: 13.5rem; }
          .h-36 { height: 9rem; }
          .w-64 { width: 16rem; }
          .w-full { width: 100%; }
          .h-full { height: 100%; }
          .max-w-216 { max-width: 13.5rem; }
          .max-h-144 { max-height: 9rem; }
          .min-w-1rem { min-width: 1rem; }
          
          /* Opacity and z-index */
          .opacity-20 { opacity: 0.2; }
          .opacity-30 { opacity: 0.3; }
          .z-10 { z-index: 10; }
          .pointer-events-none { pointer-events: none; }
          
          /* Hide elements */
          button, .no-print, [data-html2canvas-ignore="true"] { 
            display: none !important; 
          }
          
          /* Image rendering */
          img {
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
            max-width: 100%;
            height: auto;
          }
          
          /* Table grid styling - maintain exact grid layout */
          .grid > div {
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          
          /* Shadow removal for print */
          .shadow-lg, .shadow-sm { box-shadow: none !important; }
          
          /* Overflow handling */
          .overflow-hidden { overflow: hidden; }
          .overflow-y-auto { overflow-y: auto; }
          .whitespace-pre-wrap { white-space: pre-wrap; }
          .max-h-20 { max-height: 5rem; }
          
          /* Background styling */
          .bg-f8fafc { background-color: #f8fafc; }
          .rounded { border-radius: 0.25rem; }
          .rounded-full { border-radius: 9999px; }
          
          /* Flex utilities */
          .flex-1 { flex: 1 1 0%; }
          
          /* Ensure fonts load properly */
          * {
            font-family: 'Noto Sans Arabic', 'Cairo', Arial, sans-serif !important;
          }
          
          @media print {
            body { margin: 0; padding: 0; }
            .no-print { display: none !important; }
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }
        </style>
      `;

      // Create new window for printing
      const printWindow = window.open('', '_blank', 'width=794,height=1123');
      if (!printWindow) {
        toast({
          title: "خطأ في الطباعة",
          description: "تعذر فتح نافذة الطباعة",
          variant: "destructive",
        });
        return;
      }

      const printHTML = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>طباعة عرض السعر</title>
          ${printStyles}
        </head>
        <body>
          <div class="print-container">
            ${clonedElement.outerHTML}
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(printHTML);
      printWindow.document.close();

      // Wait for content and fonts to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }, 2000); // Increased delay for font loading
      };

      toast({
        title: "تم فتح نافذة الطباعة",
        description: "سيتم طباعة قسم المعاينة بالتنسيق والمقاسات الأصلية",
      });

    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "خطأ في الطباعة",
        description: "حدث خطأ أثناء تحضير المعاينة للطباعة",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {showJPGExport && (
        <Button
          onClick={exportAsJPG}
          className="flex-1 glass-button bg-gradient-to-r from-blue-500/70 to-blue-600/70 hover:from-blue-600/80 hover:to-blue-700/80 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm border-0"
          size="sm"
        >
          <Image size={16} className="ml-2" />
          صورة JPG
        </Button>
      )}
      
      {showPDFExport && (
        <Button
          onClick={exportAsPDF}
          className="flex-1 glass-button bg-gradient-to-r from-red-500/70 to-red-600/70 hover:from-red-600/80 hover:to-red-700/80 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm border-0"
          size="sm"
        >
          <FileText size={16} className="ml-2" />
          ملف PDF
        </Button>
      )}
      
      {showPrintButton && (
        <Button
          onClick={handlePrint}
          className="flex-1 glass-button bg-gradient-to-r from-green-500/70 to-green-600/70 hover:from-green-600/80 hover:to-green-700/80 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm border-0"
          size="sm"
        >
          <Printer size={16} className="ml-2" />
          طباعة
        </Button>
      )}
    </div>
  );
}