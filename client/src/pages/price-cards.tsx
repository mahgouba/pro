import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Download, Printer, Search, Filter, Plus, RefreshCw, Edit, Trash2, Eye, EyeOff, Save } from "lucide-react";
import { ManufacturerLogo } from "@/components/manufacturer-logo";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { QRCodeSVG } from "qrcode.react";

interface InventoryItem {
  id: number;
  manufacturer: string;
  category: string;
  trimLevel?: string;
  model?: string;
  year?: number;
  price?: number;
  status?: string;
  importType?: string;
  notes?: string;
  engineCapacity?: string;
  exteriorColor?: string;
  interiorColor?: string;
  chassisNumber?: string;
  mileage?: number;
  entryDate?: string;
  createdAt?: string;
}

interface PriceCard {
  id: number;
  inventoryItemId: number;
  manufacturer: string;
  category: string;
  trimLevel?: string;
  model?: string;
  year: number;
  price?: number;
  features: string[];
  status: string;
  importType?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const priceCardSchema = z.object({
  inventoryItemId: z.number(),
  manufacturer: z.string().min(1, "الصانع مطلوب"),
  category: z.string().min(1, "الفئة مطلوبة"),
  trimLevel: z.string().optional(),
  model: z.string().optional(),
  year: z.number().min(2000).max(2030),
  price: z.string().optional(),
  features: z.array(z.string()).default([]),
  status: z.string().default("نشط"),
});

type PriceCardFormData = z.infer<typeof priceCardSchema>;

export default function PriceCardsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [editingCard, setEditingCard] = useState<PriceCard | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // حالات إخفاء البيانات - الوضع التلقائي: الفئة وسعة المحرك مخفية
  const [hiddenFields, setHiddenFields] = useState<{[cardId: number]: {
    category?: boolean;
    trimLevel?: boolean;
    model?: boolean;
    manufacturer?: boolean;
    engineCapacity?: boolean;
  }}>({});

  // وظيفة للحصول على حالة الإخفاء مع القيم التلقائية
  const getFieldVisibility = (cardId: number, field: string) => {
    const validFields = ['category', 'trimLevel', 'model', 'manufacturer', 'engineCapacity'] as const;
    type ValidField = typeof validFields[number];
    
    if (field === 'category' || field === 'engineCapacity') {
      return hiddenFields[cardId]?.[field as ValidField] !== false; // مخفي بشكل تلقائي
    }
    return hiddenFields[cardId]?.[field as ValidField] || false; // ظاهر بشكل تلقائي
  };
  
  // وظيفة تبديل إخفاء الحقول
  const toggleFieldVisibility = (cardId: number, field: 'category' | 'trimLevel' | 'model' | 'manufacturer' | 'engineCapacity') => {
    if (field === 'category' || field === 'engineCapacity') {
      // للحقول المخفية بشكل تلقائي
      setHiddenFields(prev => ({
        ...prev,
        [cardId]: {
          ...prev[cardId],
          [field]: prev[cardId]?.[field] === false ? true : false
        }
      }));
    } else {
      // للحقول الظاهرة بشكل تلقائي
      setHiddenFields(prev => ({
        ...prev,
        [cardId]: {
          ...prev[cardId],
          [field]: !prev[cardId]?.[field]
        }
      }));
    }
  };
  
  // Enhanced filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTrimLevel, setSelectedTrimLevel] = useState<string>("all");
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const [expandedManufacturers, setExpandedManufacturers] = useState<Set<string>>(new Set());

  // Fetch inventory data
  const { data: inventoryData = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  // Fetch existing price cards
  const { data: priceCards = [] } = useQuery<PriceCard[]>({
    queryKey: ["/api/price-cards"],
  });

  // Form for editing price cards
  const form = useForm<PriceCardFormData>({
    resolver: zodResolver(priceCardSchema),
    defaultValues: {
      inventoryItemId: 0,
      manufacturer: "",
      category: "",
      trimLevel: "",
      model: "",
      year: new Date().getFullYear(),
      price: "",
      features: [],
      status: "نشط",
    },
  });

  // Filter price cards based on all filters
  const filteredCards = priceCards.filter(card => {
    const matchesSearch = searchTerm === "" || 
      card.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.trimLevel?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesManufacturer = selectedManufacturer === "all" || card.manufacturer === selectedManufacturer;
    const matchesCategory = selectedCategory === "all" || card.category === selectedCategory;
    const matchesTrimLevel = selectedTrimLevel === "all" || card.trimLevel === selectedTrimLevel;
    const matchesModel = selectedModel === "all" || card.model === selectedModel;
    
    return matchesSearch && matchesManufacturer && matchesCategory && matchesTrimLevel && matchesModel;
  });

  // Get unique values for filters
  const manufacturers = ["all", ...new Set(priceCards.map(card => card.manufacturer).filter(Boolean))];
  const categories = ["all", ...new Set(priceCards.map(card => card.category).filter(Boolean))];
  const trimLevels = ["all", ...new Set(priceCards.map(card => card.trimLevel).filter(Boolean))];
  const models = ["all", ...new Set(priceCards.map(card => card.model).filter(Boolean))];

  // Group cards by manufacturer
  const groupedByManufacturer = filteredCards.reduce((acc, card) => {
    const manufacturer = card.manufacturer || "غير محدد";
    if (!acc[manufacturer]) {
      acc[manufacturer] = [];
    }
    acc[manufacturer].push(card);
    return acc;
  }, {} as Record<string, typeof filteredCards>);

  // Get vehicles that arrived today (within 24 hours)
  const getVehiclesArrivedToday = () => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return inventoryData.filter(vehicle => {
      const entryDate = new Date(vehicle.entryDate || vehicle.createdAt || '');
      return entryDate >= twentyFourHoursAgo && entryDate <= now;
    });
  };

  const vehiclesArrivedToday = getVehiclesArrivedToday();

  // Toggle manufacturer expansion
  const toggleManufacturerExpansion = (manufacturer: string) => {
    const newExpanded = new Set(expandedManufacturers);
    if (newExpanded.has(manufacturer)) {
      newExpanded.delete(manufacturer);
    } else {
      newExpanded.add(manufacturer);
    }
    setExpandedManufacturers(newExpanded);
  };

  // Toggle card expansion
  const toggleCardExpansion = (cardId: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };

  // Format price with English numbers
  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-US').format(numPrice || 0);
  };

  // حساب الأسعار والضرائب حسب نوع الاستيراد
  const calculatePricing = (card: PriceCard) => {
    // البحث عن العنصر المقابل في المخزون للحصول على البيانات الكاملة
    const inventoryItem = inventoryData.find(item => item.id === card.inventoryItemId);
    
    // استخدام سعر بطاقة السعر أولاً، ثم سعر المخزون كبديل
    let basePrice = 0;
    if (card.price && String(card.price) !== "" && String(card.price) !== "0") {
      basePrice = typeof card.price === 'string' ? parseFloat(card.price) : card.price;
    } else if (inventoryItem?.price) {
      basePrice = typeof inventoryItem.price === 'string' ? parseFloat(inventoryItem.price) : inventoryItem.price;
    }
    
    const importType = inventoryItem?.importType || card.importType;
    const isUsed = importType === 'مستعمل' || importType === 'مستعمل شخصي';
    const isCompanyImport = importType === 'شركة';
    const isPersonalImport = importType === 'شخصي';
    
    if (isCompanyImport && !isUsed) {
      // استيراد شركة جديد - السعر في المخزون شامل الضريبة، نحتاج لاستبعادها
      const vatRate = 0.15; // 15% ضريبة القيمة المضافة
      const totalPriceWithVat = basePrice; // السعر الأصلي من المخزون (شامل الضريبة)
      const priceExcludingVat = totalPriceWithVat / (1 + vatRate); // السعر بعد استبعاد الضريبة
      const vatAmount = totalPriceWithVat - priceExcludingVat; // قيمة الضريبة المستبعدة
      
      return {
        type: 'company_new',
        basePrice: priceExcludingVat, // السعر الأساسي (بعد استبعاد الضريبة)
        vatAmount: vatAmount, // قيمة الضريبة (15%)
        totalPrice: totalPriceWithVat, // السعر الشامل (من المخزون)
        showBreakdown: true,
        statusText: 'جديد',
        statusColor: '#16a34a' // أخضر
      };
    } else if (isPersonalImport && !isUsed) {
      // استيراد شخصي جديد - عرض تفصيل باللون الأخضر
      const vatRate = 0.15; // 15% ضريبة القيمة المضافة
      const totalPriceWithVat = basePrice; // السعر الأصلي من المخزون (شامل الضريبة)
      const priceExcludingVat = totalPriceWithVat / (1 + vatRate); // السعر بعد استبعاد الضريبة
      const vatAmount = totalPriceWithVat - priceExcludingVat; // قيمة الضريبة المستبعدة
      
      return {
        type: 'personal_new',
        basePrice: priceExcludingVat, // السعر الأساسي (بعد استبعاد الضريبة)
        vatAmount: vatAmount, // قيمة الضريبة (15%)
        totalPrice: totalPriceWithVat, // السعر الشامل (من المخزون)
        showBreakdown: true,
        statusText: 'جديد',
        statusColor: '#16a34a', // أخضر
        priceColor: '#22c55e' // أخضر للأسعار
      };
    } else {
      // مستعمل أو مستعمل شخصي - سعر بسيط مع إظهار الممشي
      return {
        type: 'used',
        totalPrice: basePrice,
        showBreakdown: false,
        showMileage: true,
        statusText: 'مستعمل',
        statusColor: '#dc2626' // أحمر
      };
    }
  };

  // Generate vehicle URL for QR code
  const generateVehicleURL = (card: PriceCard) => {
    const baseURL = window.location.origin;
    return `${baseURL}/vehicles/${card.inventoryItemId}?view=card&manufacturer=${encodeURIComponent(card.manufacturer)}&category=${encodeURIComponent(card.category)}&year=${card.year}&price=${card.price}`;
  };

  // Create price card from inventory
  const createPriceCardFromInventory = async (inventoryItem: InventoryItem) => {
    try {
      const priceCardData = {
        inventoryItemId: inventoryItem.id,
        manufacturer: inventoryItem.manufacturer,
        category: inventoryItem.category,
        trimLevel: inventoryItem.trimLevel || "",
        model: inventoryItem.model || "",
        year: inventoryItem.year || new Date().getFullYear(),
        price: inventoryItem.price?.toString() || "",
        features: [],
        status: "نشط"
      };
      await apiRequest("POST", "/api/price-cards", priceCardData);
      queryClient.invalidateQueries({ queryKey: ["/api/price-cards"] });
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء بطاقة السعر بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ في إنشاء بطاقة السعر",
        variant: "destructive",
      });
    }
  };

  // Create all price cards mutation
  const createAllPriceCardsMutation = useMutation({
    mutationFn: async () => {
      const results = [];
      const existingInventoryIds = new Set(priceCards.map(card => card.inventoryItemId));
      
      for (const vehicle of inventoryData) {
        // تجنب إنشاء بطاقات مكررة للمركبات التي لديها بطاقات بالفعل
        if (vehicle.manufacturer && vehicle.category && !existingInventoryIds.has(vehicle.id)) {
          try {
            const priceCardData = {
              inventoryItemId: vehicle.id,
              manufacturer: vehicle.manufacturer,
              category: vehicle.category,
              trimLevel: vehicle.trimLevel || "",
              model: vehicle.model || "",
              year: vehicle.year || new Date().getFullYear(),
              price: vehicle.price?.toString() || "",
              features: [],
              status: "نشط"
            };
            const result = await apiRequest("POST", "/api/price-cards", priceCardData);
            results.push(result);
          } catch (error) {
            console.error(`Error creating price card for vehicle ${vehicle.id}:`, error);
          }
        }
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-cards"] });
      toast({
        title: "تم بنجاح",
        description: `تم إنشاء ${results.length} بطاقة سعر تلقائياً`,
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ في إنشاء بطاقات الأسعار",
        variant: "destructive",
      });
    },
  });

  // Create price card mutation
  const createPriceCardMutation = useMutation({
    mutationFn: async (data: PriceCardFormData) => {
      return await apiRequest("POST", "/api/price-cards", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-cards"] });
      setIsEditDialogOpen(false);
      form.reset();
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء بطاقة السعر بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ في إنشاء بطاقة السعر",
        variant: "destructive",
      });
    },
  });

  // Update price card mutation
  const updatePriceCardMutation = useMutation({
    mutationFn: async (data: PriceCardFormData) => {
      if (!editingCard) throw new Error("No card being edited");
      return await apiRequest("PUT", `/api/price-cards/${editingCard.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-cards"] });
      setIsEditDialogOpen(false);
      setEditingCard(null);
      form.reset();
      toast({
        title: "تم بنجاح",
        description: "تم تحديث بطاقة السعر بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحديث بطاقة السعر",
        variant: "destructive",
      });
    },
  });

  // Delete price card mutation
  const deletePriceCardMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/price-cards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-cards"] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف بطاقة السعر بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ في حذف بطاقة السعر",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: PriceCardFormData) => {
    if (editingCard) {
      updatePriceCardMutation.mutate(data);
    } else {
      createPriceCardMutation.mutate(data);
    }
  };

  // Handle edit card
  const handleEditCard = (card: PriceCard) => {
    setEditingCard(card);
    form.reset({
      inventoryItemId: card.inventoryItemId,
      manufacturer: card.manufacturer,
      category: card.category,
      trimLevel: card.trimLevel || "",
      model: card.model || "",
      year: card.year,
      price: card.price?.toString() || "",
      features: card.features || [],
      status: card.status,
    });
    setIsEditDialogOpen(true);
  };

  // Enhanced PDF generation
  const generatePDF = async (card: PriceCard, cardId: string) => {
    setIsGeneratingPDF(true);
    try {
      const element = document.getElementById(cardId);
      if (!element) {
        console.error('Price card element not found');
        return;
      }

      // Wait for fonts and images to load
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create a temporary element for PDF with print-specific styling
      const printElement = element.cloneNode(true) as HTMLElement;
      printElement.style.transform = 'scale(1)';
      printElement.style.transformOrigin = 'top left';
      printElement.style.width = '1123px';
      printElement.style.height = '794px';
      printElement.style.position = 'absolute';
      printElement.style.top = '-9999px';
      printElement.style.left = '-9999px';
      printElement.style.backgroundColor = '#ffffff';
      
      // تثبيت تموضع السنة في PDF
      const yearElements = printElement.querySelectorAll('[style*="fontSize: 250px"]');
      yearElements.forEach((elem: any) => {
        if (elem.style) {
          elem.style.position = 'absolute';
          elem.style.top = '130px';
          elem.style.left = '50%';
          elem.style.transform = 'translateX(-50%)';
          elem.style.textAlign = 'center';
        }
      });
      
      document.body.appendChild(printElement);

      // High-quality canvas generation
      const canvas = await html2canvas(printElement, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 1123,
        height: 794
      });

      // Remove the temporary element
      document.body.removeChild(printElement);

      // Create PDF in landscape orientation (A4)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // A4 landscape dimensions: 297mm x 210mm
      pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
      
      // Save with Arabic filename
      const filename = `بطاقة_سعر_${card.manufacturer}_${card.category}_${card.year}.pdf`;
      pdf.save(filename);

      toast({
        title: "تم بنجاح",
        description: "تم تحميل بطاقة السعر بصيغة PDF",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في إنشاء ملف PDF",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Print function for direct printing - using browser's native print
  const printCard = (card: PriceCard, cardId: string) => {
    const element = document.getElementById(cardId);
    if (!element) {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على البطاقة",
        variant: "destructive",
      });
      return;
    }

    // إنشاء نافذة جديدة للطباعة
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "خطأ",
        description: "لا يمكن فتح نافذة الطباعة",
        variant: "destructive",
      });
      return;
    }

    // استنساخ محتوى البطاقة
    const cardClone = element.cloneNode(true) as HTMLElement;
    
    // إزالة التحويل والحجم للطباعة
    cardClone.style.transform = 'none';
    cardClone.style.width = '297mm';
    cardClone.style.height = '210mm';
    cardClone.style.position = 'relative';
    
    // إنشاء HTML للطباعة
    const printHTML = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>طباعة بطاقة السعر</title>
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 landscape;
              margin: 0;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            html, body {
              width: 297mm;
              height: 210mm;
              margin: 0;
              padding: 0;
              overflow: hidden;
              font-family: 'Noto Sans Arabic', Arial, sans-serif;
              background: white;
            }
            
            body {
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .print-container {
              width: 297mm;
              height: 210mm;
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-size: cover !important;
              background-position: center !important;
              background-repeat: no-repeat !important;
              overflow: hidden;
              transform: none !important;
              box-shadow: none !important;
              border: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            /* إخفاء الأزرار */
            .no-print, button, .flex.gap-2, [class*="gap-2"] button {
              display: none !important;
            }
            
            /* ضبط المحتوى الداخلي */
            .print-container > div {
              width: 100% !important;
              height: 100% !important;
              transform: none !important;
              position: relative !important;
              box-shadow: none !important;
              border: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            /* ضبط النصوص والعناصر */
            div[style*="position: absolute"] {
              position: absolute !important;
            }
            
            /* ضبط الخط الكبير للسنة */
            div[style*="fontSize: 250px"], div[style*="font-size: 250px"] {
              position: absolute !important;
              font-size: 250px !important;
              font-weight: bold !important;
              color: #C49632 !important;
              z-index: 10 !important;
            }
            
            /* ضبط صور الشركات */
            img {
              max-width: 100% !important;
              height: auto !important;
            }
            
            /* ضبط QR Code */
            svg {
              width: 100% !important;
              height: 100% !important;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${cardClone.outerHTML}
          </div>
          <script>
            window.onload = function() {
              // انتظار تحميل الخطوط والصور
              setTimeout(function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 1000);
            };
          </script>
        </body>
      </html>
    `;

    // كتابة HTML في النافذة الجديدة
    printWindow.document.write(printHTML);
    printWindow.document.close();

    toast({
      title: "تم بنجاح",
      description: "تم فتح نافذة الطباعة",
    });
  };

  // Generate JPG from price card
  const generateJPG = async (card: PriceCard, cardId: string) => {
    setIsGeneratingPDF(true);
    try {
      const element = document.getElementById(cardId);
      if (!element) {
        console.error('Price card element not found');
        return;
      }

      // Wait for fonts and images to load
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create a temporary element for JPG with high-quality styling
      const printElement = element.cloneNode(true) as HTMLElement;
      printElement.style.transform = 'scale(1)';
      printElement.style.transformOrigin = 'top left';
      printElement.style.width = '1123px';
      printElement.style.height = '794px';
      printElement.style.position = 'absolute';
      printElement.style.top = '-9999px';
      printElement.style.left = '-9999px';
      printElement.style.backgroundColor = '#ffffff';
      
      // تثبيت تموضع السنة في JPG
      const yearElements = printElement.querySelectorAll('[style*="fontSize: 250px"]');
      yearElements.forEach((elem: any) => {
        if (elem.style) {
          elem.style.position = 'absolute';
          elem.style.top = '130px';
          elem.style.left = '50%';
          elem.style.transform = 'translateX(-50%)';
          elem.style.textAlign = 'center';
        }
      });
      
      document.body.appendChild(printElement);

      // High-quality canvas generation for JPG
      const canvas = await html2canvas(printElement, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 1123,
        height: 794
      });

      // Remove the temporary element
      document.body.removeChild(printElement);

      // Convert to JPG with high quality
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Create download link
      const link = document.createElement('a');
      link.download = `بطاقة_سعر_${card.manufacturer}_${card.category}_${card.year}.jpg`;
      link.href = imgData;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "تم بنجاح",
        description: "تم تحميل بطاقة السعر بصيغة JPG",
      });
    } catch (error) {
      console.error('Error generating JPG:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في إنشاء ملف JPG",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          إدارة بطاقات الأسعار
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          إنشاء وإدارة بطاقات أسعار تفاعلية للمركبات ({filteredCards.length} من {priceCards.length})
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center mb-6">
        <Button 
          onClick={() => createAllPriceCardsMutation.mutate()}
          disabled={createAllPriceCardsMutation.isPending}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
        >
          {createAllPriceCardsMutation.isPending ? (
            <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 ml-2" />
          )}
          إنشاء بطاقات لكل المخزون ({inventoryData.length})
        </Button>
        
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingCard(null);
                form.reset();
              }}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
            >
              <Plus className="w-4 h-4 ml-2" />
              إنشاء بطاقة جديدة
            </Button>
          </DialogTrigger>
        </Dialog>
        
        <Badge variant="secondary" className="text-sm">
          {priceCards.length} بطاقة موجودة
        </Badge>
      </div>

      {/* Vehicles Arrived Today Section */}
      {vehiclesArrivedToday.length > 0 && (
        <Card className="mb-6 border-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              السيارات الواصلة اليوم ({vehiclesArrivedToday.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehiclesArrivedToday.map((vehicle) => (
                <Card key={`today-${vehicle.id}`} className="border-green-200 hover:border-green-400 transition-colors">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">{vehicle.manufacturer} {vehicle.category}</h4>
                          {vehicle.trimLevel && <p className="text-sm text-gray-600">{vehicle.trimLevel}</p>}
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {vehicle.year}
                        </Badge>
                      </div>
                      
                      {vehicle.chassisNumber && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>رقم الهيكل:</span>
                          <span className="font-mono">{vehicle.chassisNumber}</span>
                        </div>
                      )}
                      
                      {vehicle.price && (
                        <div className="text-lg font-bold text-green-700">
                          {formatPrice(vehicle.price)} ريال
                        </div>
                      )}
                      
                      <Button 
                        onClick={() => createPriceCardFromInventory(vehicle)}
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        إنشاء بطاقة سعر
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            الفلاتر والبحث المتقدم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث في بطاقات الأسعار..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Manufacturer Filter */}
            <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
              <SelectTrigger>
                <SelectValue placeholder="الصانع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الصناع</SelectItem>
                {manufacturers.slice(1).map((manufacturer) => (
                  <SelectItem key={manufacturer} value={manufacturer || "empty"}>
                    {manufacturer || "غير محدد"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {categories.slice(1).map((category) => (
                  <SelectItem key={category} value={category || "empty"}>
                    {category || "غير محدد"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Trim Level Filter */}
            <Select value={selectedTrimLevel} onValueChange={setSelectedTrimLevel}>
              <SelectTrigger>
                <SelectValue placeholder="درجة التجهيز" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع درجات التجهيز</SelectItem>
                {trimLevels.slice(1).map((trimLevel) => (
                  <SelectItem key={trimLevel} value={trimLevel || "empty"}>
                    {trimLevel || "غير محدد"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Model Filter */}
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder="الموديل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الموديلات</SelectItem>
                {models.slice(1).map((model) => (
                  <SelectItem key={model} value={model || "empty"}>
                    {model || "غير محدد"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Summary */}
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <Badge variant="outline">البحث: {searchTerm}</Badge>
            )}
            {selectedManufacturer !== "all" && (
              <Badge variant="outline">الصانع: {selectedManufacturer}</Badge>
            )}
            {selectedCategory !== "all" && (
              <Badge variant="outline">الفئة: {selectedCategory}</Badge>
            )}
            {selectedTrimLevel !== "all" && (
              <Badge variant="outline">درجة التجهيز: {selectedTrimLevel}</Badge>
            )}
            {selectedModel !== "all" && (
              <Badge variant="outline">الموديل: {selectedModel}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
            لا توجد بطاقات تطابق الفلاتر المحددة
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            جرب تعديل الفلاتر أو إنشاء بطاقات جديدة
          </p>
        </div>
      ) : (
        <div className="text-center mb-4">
          <Badge variant="secondary" className="text-sm">
            عرض {filteredCards.length} بطاقة من {priceCards.length}
          </Badge>
        </div>
      )}

      {/* Price Cards Grouped by Manufacturer */}
      {Object.entries(groupedByManufacturer)
        .sort(([,a], [,b]) => b.length - a.length) // Sort by count (highest first)
        .map(([manufacturer, cards]) => {
          const isManufacturerExpanded = expandedManufacturers.has(manufacturer);
          
          return (
            <Card key={manufacturer} className="mb-6 border-l-4 border-l-blue-500">
              {/* Manufacturer Header */}
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => toggleManufacturerExpansion(manufacturer)}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-xl font-bold">{manufacturer}</span>
                      <Badge variant="secondary" className="mr-2">
                        {cards.length} مركبة
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isManufacturerExpanded ? (
                      <EyeOff className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </CardTitle>
              </CardHeader>

              {/* Manufacturer's Vehicles */}
              {isManufacturerExpanded && (
                <CardContent className="pt-0 space-y-4">
                  {cards.map((card) => {
                    const isExpanded = expandedCards.has(card.id);
                    const inventoryItem = inventoryData.find(item => item.id === card.inventoryItemId);
                    
                    return (
                      <Card key={card.id} className="border-2 hover:border-blue-300 transition-colors text-[#ffffff]">
                        {/* Card Header - Always Visible */}
                        <CardHeader 
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          onClick={() => toggleCardExpansion(card.id)}
                        >
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <EyeOff className="w-5 h-5 text-blue-600" />
                                ) : (
                                  <Eye className="w-5 h-5 text-gray-400" />
                                )}
                                <span>{card.category}</span>
                                {inventoryItem?.chassisNumber && (
                                  <Badge variant="outline" className="text-xs font-mono">
                                    {inventoryItem.chassisNumber}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {card.trimLevel && (
                                  <Badge variant="secondary">{card.trimLevel}</Badge>
                                )}
                                {card.model && (
                                  <Badge variant="default">{card.model}</Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-2 no-print">
                  {/* عناصر التحكم في إخفاء البيانات */}
                  <div className="flex gap-1 ml-4 border-l pl-2">
                    <Button
                      size="sm"
                      variant={hiddenFields[card.id]?.manufacturer ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFieldVisibility(card.id, 'manufacturer');
                      }}
                      title={hiddenFields[card.id]?.manufacturer ? "إظهار الشعار" : "إخفاء الشعار"}
                      className="px-2 text-xs"
                    >
                      {hiddenFields[card.id]?.manufacturer ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      شعار
                    </Button>
                    <Button
                      size="sm"
                      variant={getFieldVisibility(card.id, 'category') ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFieldVisibility(card.id, 'category');
                      }}
                      title={getFieldVisibility(card.id, 'category') ? "إظهار الفئة" : "إخفاء الفئة"}
                      className="px-2 text-xs"
                    >
                      {getFieldVisibility(card.id, 'category') ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      فئة
                    </Button>
                    <Button
                      size="sm"
                      variant={getFieldVisibility(card.id, 'trimLevel') ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFieldVisibility(card.id, 'trimLevel');
                      }}
                      title={getFieldVisibility(card.id, 'trimLevel') ? "إظهار درجة التجهيز" : "إخفاء درجة التجهيز"}
                      className="px-2 text-xs"
                    >
                      {getFieldVisibility(card.id, 'trimLevel') ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      تجهيز
                    </Button>
                    <Button
                      size="sm"
                      variant={getFieldVisibility(card.id, 'engineCapacity') ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFieldVisibility(card.id, 'engineCapacity');
                      }}
                      title={getFieldVisibility(card.id, 'engineCapacity') ? "إظهار سعة المحرك" : "إخفاء سعة المحرك"}
                      className="px-2 text-xs"
                    >
                      {getFieldVisibility(card.id, 'engineCapacity') ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      محرك
                    </Button>
                  </div>

                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCard(card);
                    }}
                    size="sm"
                    variant="outline"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="w-4 h-4 ml-1" />
                    تحرير
                  </Button>
                  
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('هل أنت متأكد من حذف هذه البطاقة؟')) {
                        deletePriceCardMutation.mutate(card.id);
                      }
                    }}
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 ml-1" />
                    حذف
                  </Button>
                  
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      printCard(card, `price-card-${card.id}`);
                    }}
                    size="sm"
                    variant="outline"
                    className="text-green-600 hover:text-green-700"
                  >
                    <Printer className="w-4 h-4 ml-1" />
                    طباعة
                  </Button>
                  
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      generatePDF(card, `price-card-${card.id}`);
                    }}
                    disabled={isGeneratingPDF}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Download className="w-4 h-4 ml-1" />
                    PDF
                  </Button>
                  
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      generateJPG(card, `price-card-${card.id}`);
                    }}
                    disabled={isGeneratingPDF}
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Download className="w-4 h-4 ml-1" />
                    JPG
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>

            {/* Card Content - Shown only when expanded */}
            {isExpanded && (
              <CardContent className="pt-0">
                <div className="flex justify-center">
                  <div 
                    id={`price-card-${card.id}`}
                    className="relative shadow-2xl border-2 border-gray-200 bg-[#00607f]"
                    style={{
                      width: '1123px',   // Fixed A4 landscape width in pixels
                      height: '794px',   // Fixed A4 landscape height in pixels
                      fontFamily: "'Noto Sans Arabic', Arial, sans-serif",
                      direction: 'rtl',
                      fontSize: '16px',
                      overflow: 'hidden',
                      transform: 'scale(0.6)', // Scale down for display
                      transformOrigin: 'center center',
                      backgroundImage: 'url(/price-card.jpg)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    {/* QR Code - Top Right */}
                    <div style={{
                      position: 'absolute',
                      top: '20px',
                      right: '20px',
                      width: '120px',
                      height: '120px',
                      backgroundColor: 'white',
                      borderRadius: '15px',
                      padding: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 30
                    }}>
                      <QRCodeSVG
                        value={generateVehicleURL(card)}
                        size={95}
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                        level="M"
                        includeMargin={false}
                      />
                    </div>

                    {/* Year - Large Center in White Section */}
                    <div style={{ 
                      position: 'absolute',
                      top: '80px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      color: '#CF9B47', 
                      fontSize: '200px', 
                      fontWeight: '900', 
                      letterSpacing: '8px',
                      textAlign: 'center',
                      width: 'auto',
                      height: 'auto'
                    }}>
                      {card.year}
                    </div>

                    {/* Main Content Card - Bottom Center */}
                    <div style={{
                      position: 'absolute',
                      bottom: '100px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 'auto',
                      minWidth: '1080px',
                      height: '280px',
                      backgroundColor: 'transparent',
                      padding: '20px',
                      zIndex: 10,
                      overflow: 'visible'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '60px', height: '100%' }}>
                        
                        {/* Right Section - Vehicle Details Box */}
                        <div style={{ 
                          flex: 1, 
                          padding: '10px 25px',
                          position: 'relative',
                          minHeight: '240px',
                          minWidth: 'fit-content'
                        }}>
                          {/* Manufacturer Logo */}
                          {card.manufacturer && !hiddenFields[card.id]?.manufacturer && (
                            <div style={{ 
                              width: '240px', 
                              height: '160px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              margin: '0 auto 10px auto'
                            }}>
                              <ManufacturerLogo 
                                manufacturerName={card.manufacturer} 
                                className="w-full h-full object-contain brightness-0 saturate-100 invert-75 sepia-60 saturate-50 hue-rotate-15 brightness-95 contrast-90"
                                showFallback={false}
                              />
                            </div>
                          )}
                          
                          {/* Vehicle Details Row - Category, Trim Level, Engine Capacity */}
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '10px',
                            textAlign: 'center',
                            marginBottom: '15px'
                          }}>
                            {/* First Row: Category, Trim Level, Engine Capacity */}
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center',
                              gap: '15px',
                              color: '#CF9B47', 
                              fontSize: '72px', 
                              fontWeight: 'bold',
                              flexWrap: 'nowrap',
                              whiteSpace: 'nowrap',
                              overflow: 'visible'
                            }}>
                              {!getFieldVisibility(card.id, 'category') && card.category && (
                                <span>{card.category}</span>
                              )}
                              {!getFieldVisibility(card.id, 'trimLevel') && card.trimLevel && (
                                <span>{card.trimLevel}</span>
                              )}
                              {!getFieldVisibility(card.id, 'engineCapacity') && (() => {
                                const inventoryItem = inventoryData.find(item => item.id === card.inventoryItemId);
                                return inventoryItem?.engineCapacity && (
                                  <span>{inventoryItem.engineCapacity}</span>
                                );
                              })()}
                            </div>
                            
                            
                          </div>
                        </div>

                        {/* Divider */}
                        <div style={{ width: '4px', height: '200px', backgroundColor: 'white', borderRadius: '2px', alignSelf: 'center' }}></div>

                        {/* Left Section - Price and Details Box */}
                        <div style={{ 
                          flex: 1, 
                          padding: '25px',
                          position: 'relative',
                          minHeight: '240px'
                        }}>
                          {/* Price */}
                          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            
                            {(() => {
                              const pricing = calculatePricing(card);
                              
                              if (pricing.showBreakdown) {
                                // عرض تفصيل الضريبة للاستيراد شركة والشخصي
                                const textColor = pricing.priceColor || 'white';
                                return (
                                  <div style={{ color: textColor }}>
                                    {/* السعر الأساسي */}
                                    <div style={{ 
                                      display: 'flex', 
                                      justifyContent: 'space-between', 
                                      alignItems: 'center',
                                      marginBottom: '10px'
                                    }}>
                                      <span style={{ fontSize: '16px', color: textColor }}>السعر الأساسي:</span>
                                      <span style={{ fontSize: '22px', fontWeight: 'bold', color: textColor }}>
                                        {formatPrice(pricing.basePrice || 0)}
                                      </span>
                                    </div>
                                    
                                    {/* الضريبة */}
                                    <div style={{ 
                                      display: 'flex', 
                                      justifyContent: 'space-between', 
                                      alignItems: 'center',
                                      marginBottom: '10px'
                                    }}>
                                      <span style={{ fontSize: '16px', color: textColor }}>الضريبة (15%):</span>
                                      <span style={{ fontSize: '22px', fontWeight: 'bold', color: textColor }}>
                                        {formatPrice(pricing.vatAmount || 0)}
                                      </span>
                                    </div>
                                    
                                    {/* خط فاصل */}
                                    <div style={{ 
                                      borderTop: `1px solid ${pricing.priceColor ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.3)'}`, 
                                      margin: '10px 0'
                                    }}></div>
                                    
                                    {/* السعر الشامل */}
                                    <div style={{ 
                                      display: 'flex', 
                                      justifyContent: 'space-between', 
                                      alignItems: 'center'
                                    }}>
                                      <span style={{ fontSize: '22px', fontWeight: 'bold', color: textColor }}>السعر الشامل:</span>
                                      <span style={{ fontSize: '30px', fontWeight: 'bold', color: textColor }}>
                                        {formatPrice(pricing.totalPrice || 0)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              } else {
                                // عرض السعر البسيط - القيمة بجوار التعريف
                                return (
                                  <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    color: 'white'
                                  }}>
                                    <span style={{ fontSize: '24px', fontWeight: '600', color: 'white' }}>السعر:</span>
                                    <div style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '8px' 
                                    }}>
                                      <img 
                                        src="/Saudi_Riyal_Symbol.svg" 
                                        alt="ريال سعودي" 
                                        style={{ 
                                          width: '24px', 
                                          height: '24px', 
                                          filter: 'brightness(0) saturate(100%) invert(100%)'
                                        }} 
                                      />
                                      <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'white' }}>
                                        {formatPrice(pricing.totalPrice || 0)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              }
                            })()}
                          </div>

                          {/* Status */}
                          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                            {(() => {
                              const pricing = calculatePricing(card);
                              return (
                                <div className="bg-[#cf9b46] p-3 rounded-lg" style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center'
                                }}>
                                  <span style={{ 
                                    color: 'white', 
                                    fontSize: '18px', 
                                    fontWeight: '600'
                                  }}>
                                    الحالة
                                  </span>
                                  <span style={{ 
                                    fontSize: '24px', 
                                    fontWeight: 'bold',
                                    color: 'white'
                                  }}>
                                    {pricing.statusText}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Mileage for used vehicles */}
                          {(() => {
                            const pricing = calculatePricing(card);
                            if (pricing.showMileage) {
                              // الحصول على الممشي من بيانات المخزون
                              const inventoryItem = inventoryData.find(item => item.id === card.inventoryItemId);
                              const mileage = inventoryItem?.mileage ? 
                                `${new Intl.NumberFormat('en-US').format(inventoryItem.mileage)} كم` : 
                                "85,000 كم";
                              return (
                                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                  <div style={{ 
                                    color: 'white', 
                                    fontSize: '16px', 
                                    fontWeight: '600', 
                                    marginBottom: '5px' 
                                  }}>
                                    الممشي
                                  </div>
                                  <div style={{ 
                                    fontSize: '20px', 
                                    fontWeight: 'bold',
                                    color: '#FFD700' // ذهبي للممشي
                                  }}>
                                    {mileage}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
                          </Card>
                        );
                      })}
                    </CardContent>
                  )}
                </Card>
              );
            })}

      {/* Edit Price Card Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md mx-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingCard ? 'تحرير بطاقة السعر' : 'إنشاء بطاقة سعر جديدة'}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الصانع</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="مثال: تويوتا" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الفئة</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="مثال: كامري" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="trimLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>درجة التجهيز</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="مثال: فل كامل" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الموديل</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="مثال: GLE" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>السنة</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>السعر</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="150000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحالة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="نشط">نشط</SelectItem>
                        <SelectItem value="متوفر">متوفر</SelectItem>
                        <SelectItem value="محجوز">محجوز</SelectItem>
                        <SelectItem value="مباع">مباع</SelectItem>
                        <SelectItem value="غير متوفر">غير متوفر</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 pt-4">
                {/* Action Buttons - Show only if editing existing card */}
                {editingCard && (
                  <div className="border-t pt-4">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      الإجراءات المتاحة
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => generatePDF(editingCard, `price-card-${editingCard.id}`)}
                        disabled={isGeneratingPDF}
                        className="flex-1 min-w-0"
                      >
                        {isGeneratingPDF ? (
                          <RefreshCw className="w-4 h-4 ml-1 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 ml-1" />
                        )}
                        PDF
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => generateJPG(editingCard, `price-card-${editingCard.id}`)}
                        disabled={isGeneratingPDF}
                        className="flex-1 min-w-0"
                      >
                        {isGeneratingPDF ? (
                          <RefreshCw className="w-4 h-4 ml-1 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 ml-1" />
                        )}
                        JPG
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => printCard(editingCard, `price-card-${editingCard.id}`)}
                        className="flex-1 min-w-0"
                      >
                        <Printer className="w-4 h-4 ml-1" />
                        طباعة
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('هل أنت متأكد من حذف هذه البطاقة؟')) {
                            deletePriceCardMutation.mutate(editingCard.id);
                          }
                        }}
                        disabled={deletePriceCardMutation.isPending}
                        className="flex-1 min-w-0 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      >
                        {deletePriceCardMutation.isPending ? (
                          <RefreshCw className="w-4 h-4 ml-1 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 ml-1" />
                        )}
                        حذف
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Form Submit Buttons */}
                <div className="flex gap-2 border-t pt-4">
                  <Button
                    type="submit"
                    disabled={createPriceCardMutation.isPending || updatePriceCardMutation.isPending}
                    className="flex-1"
                  >
                    {createPriceCardMutation.isPending || updatePriceCardMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 ml-2" />
                    )}
                    {editingCard ? 'تحديث' : 'إنشاء'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Print Styles for A4 Landscape Layout */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4 landscape;
              margin: 0;
            }
            
            html, body {
              width: 297mm;
              height: 210mm;
              margin: 0;
              padding: 0;
              overflow: hidden;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* إخفاء كل شيء ما عدا بطاقة السعر */
            body * {
              visibility: hidden !important;
            }
            
            /* إظهار بطاقة السعر وجميع عناصرها */
            [id^="price-card-"], [id^="price-card-"] * {
              visibility: visible !important;
            }
            
            /* إخفاء عناصر التحكم والحاويات الخارجية */
            .container, .max-w-7xl, .mx-auto, .p-6, .space-y-6, 
            h1, .flex.gap-2, button, .no-print,
            .card-header, .card-title, .card-content,
            nav, header, footer, aside, .sidebar {
              visibility: hidden !important;
              display: none !important;
            }
            
            /* ضبط بطاقة السعر للطباعة */
            [id^="price-card-"] {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              right: 0 !important;
              bottom: 0 !important;
              width: 297mm !important;
              height: 210mm !important;
              margin: 0 !important;
              padding: 0 !important;
              transform: none !important;
              overflow: hidden !important;
              background-size: cover !important;
              background-position: center !important;
              background-repeat: no-repeat !important;
              page-break-inside: avoid !important;
              box-shadow: none !important;
              border: none !important;
              z-index: 9999 !important;
            }
            
            /* الحفاظ على المواضع المطلقة */
            [id^="price-card-"] div[style*="position: absolute"] {
              position: absolute !important;
            }
            
            /* ضبط النص الكبير للسنة */
            [id^="price-card-"] div[style*="fontSize: 200px"], 
            [id^="price-card-"] div[style*="font-size: 200px"] {
              position: absolute !important;
              font-size: 200px !important;
              font-weight: 900 !important;
              color: #CF9B47 !important;
              z-index: 10 !important;
            }
            
            /* ضبط حجم العناصر للطباعة */
            [id^="price-card-"] img {
              max-width: 100% !important;
              height: auto !important;
            }
            
            /* ضبط QR Code */
            [id^="price-card-"] svg {
              width: 100% !important;
              height: 100% !important;
            }
            
            /* إزالة الظلال والحدود في الطباعة */
            [id^="price-card-"], [id^="price-card-"] * {
              box-shadow: none !important;
              border: none !important;
            }
            
            /* إخفاء أي أزرار متبقية */
            button, .btn, .button, [role="button"] {
              display: none !important;
            }
            
            /* ضبط الخط والاتجاه */
            [id^="price-card-"] {
              font-family: 'Noto Sans Arabic', Arial, sans-serif !important;
              direction: rtl !important;
            }
          }
        `
      }} />
    </div>
  );
}