import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Car, Copy, MessageCircle, ExternalLink, Image, 
  FileText, Calculator, Edit2, Settings, Eye,
  Share, Phone, ImageIcon, LinkIcon, Palette
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VehicleShareProps {
  vehicle: {
    id: number;
    manufacturer: string;
    category: string;
    trimLevel?: string;
    engineCapacity: string;
    year: number;
    exteriorColor: string;
    interiorColor: string;
    status: string;
    importType: string;
    ownershipType: string;
    location: string;
    chassisNumber: string;
    images?: string[];
    price?: string;
    mileage?: number;
    detailedSpecifications?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VehicleSpecification {
  id: number;
  manufacturer: string | null;
  category: string | null;
  trimLevel: string | null;
  engineCapacity: string | null;
  year: number | null;
  chassisNumber: string | null;
  specifications: string | null;
  specificationsEn: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface VehicleImageLink {
  id: number;
  manufacturer: string | null;
  category: string | null;
  trimLevel: string | null;
  engineCapacity: string | null;
  year: number | null;
  exteriorColor: string | null;
  interiorColor: string | null;
  chassisNumber: string | null;
  imageUrl: string | null;
  description: string | null;
  descriptionEn: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function VehicleShareDialog({ vehicle, open, onOpenChange }: VehicleShareProps) {
  const { toast } = useToast();
  
  // State management
  const [sharePrice, setSharePrice] = useState(vehicle.price || "");
  const [taxRate, setTaxRate] = useState("15");
  const [whatsappPhoneNumber, setWhatsappPhoneNumber] = useState("");
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  
  // Hierarchy data
  const [hierarchySpecifications, setHierarchySpecifications] = useState<VehicleSpecification[]>([]);
  const [selectedHierarchySpec, setSelectedHierarchySpec] = useState<VehicleSpecification | null>(null);
  const [selectedHierarchyImages, setSelectedHierarchyImages] = useState<VehicleImageLink[]>([]);
  const [linkedImageUrl, setLinkedImageUrl] = useState("");

  // Include fields state
  const [includeFields, setIncludeFields] = useState({
    basicInfo: true,
    technical: true,
    colors: true,
    price: false,
    images: true,
    specifications: false,
    linkedImage: false,
    mileage: true
  });

  // Fetch hierarchy data on component mount
  useEffect(() => {
    if (!open) return;
    
    const fetchHierarchyData = async () => {
      try {
        // Fetch vehicle specifications
        const specsResponse = await fetch('/api/vehicle-specifications');
        if (specsResponse.ok) {
          const allSpecs: VehicleSpecification[] = await specsResponse.json();
          
          // Find matching specifications
          const matchingSpecs = allSpecs.filter((spec: VehicleSpecification) => {
            // First try exact chassis number match
            if (vehicle.chassisNumber && spec.chassisNumber === vehicle.chassisNumber) {
              return true;
            }
            
            // Otherwise match by vehicle details
            return spec.manufacturer === vehicle.manufacturer &&
                   spec.category === vehicle.category &&
                   (!spec.trimLevel || spec.trimLevel === vehicle.trimLevel) &&
                   (!spec.year || spec.year === vehicle.year);
          });
          
          setHierarchySpecifications(matchingSpecs);
          
          if (matchingSpecs.length > 0) {
            // Prefer chassis match first
            const chassisMatch = matchingSpecs.find((spec: VehicleSpecification) => 
              vehicle.chassisNumber && spec.chassisNumber === vehicle.chassisNumber
            );
            
            // Then prefer exact trim and year match
            const exactMatch = matchingSpecs.find((spec: VehicleSpecification) => 
              spec.year === vehicle.year && spec.trimLevel === vehicle.trimLevel
            );
            
            setSelectedHierarchySpec(chassisMatch || exactMatch || matchingSpecs[0]);
          }
        }

        // Fetch vehicle image links
        const imageResponse = await fetch('/api/vehicle-image-links');
        if (imageResponse.ok) {
          const allImageLinks: VehicleImageLink[] = await imageResponse.json();
          
          // Find matching image links
          const matchingImages = allImageLinks.filter((imageLink: VehicleImageLink) => {
            if (vehicle.chassisNumber && imageLink.chassisNumber === vehicle.chassisNumber) {
              return true;
            }
            
            return imageLink.manufacturer === vehicle.manufacturer &&
                   imageLink.category === vehicle.category &&
                   (!imageLink.trimLevel || imageLink.trimLevel === vehicle.trimLevel) &&
                   (!imageLink.year || imageLink.year === vehicle.year);
          });
          
          setSelectedHierarchyImages(matchingImages);
          
          // Set the first linked image URL if available
          if (matchingImages.length > 0 && matchingImages[0].imageUrl) {
            setLinkedImageUrl(matchingImages[0].imageUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching hierarchy data:', error);
      }
    };

    fetchHierarchyData();
  }, [open, vehicle]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const calculatePriceBreakdown = () => {
    if (!sharePrice || !taxRate) return null;
    
    const totalPrice = parseFloat(sharePrice);
    const taxRateNum = parseFloat(taxRate);
    const basePrice = totalPrice / (1 + taxRateNum / 100);
    const taxAmount = totalPrice - basePrice;
    
    return {
      basePrice: basePrice.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      totalPrice: totalPrice.toFixed(2)
    };
  };

  const generateShareText = () => {
    if (!includeFields.basicInfo && !includeFields.technical && !includeFields.colors && !includeFields.price && !includeFields.specifications) {
      return "";
    }

    let shareText = "";

    // Basic Information
    if (includeFields.basicInfo) {
      shareText += `🚗 ${vehicle.manufacturer} ${vehicle.category}`;
      if (vehicle.trimLevel) shareText += ` - ${vehicle.trimLevel}`;
      shareText += `\n📅 الموديل: ${vehicle.year}`;
      shareText += `\n📍 الموقع: ${vehicle.location}`;
      shareText += `\n🔢 رقم الهيكل: ${vehicle.chassisNumber}`;
      shareText += `\n📋 الحالة: ${vehicle.status}`;
      shareText += `\n📦 نوع الاستيراد: ${vehicle.importType}`;
      shareText += `\n🏢 نوع الملكية: ${vehicle.ownershipType}`;
    }

    // Technical Details
    if (includeFields.technical) {
      shareText += `\n\n⚙️ المواصفات التقنية:`;
      shareText += `\n🔧 سعة المحرك: ${vehicle.engineCapacity}`;
    }

    // Colors
    if (includeFields.colors) {
      shareText += `\n\n🎨 الألوان:`;
      shareText += `\n🎨 اللون الخارجي: ${vehicle.exteriorColor}`;
      shareText += `\n🛋️ اللون الداخلي: ${vehicle.interiorColor}`;
    }

    // Price
    if (includeFields.price && sharePrice) {
      const priceBreakdown = calculatePriceBreakdown();
      shareText += `\n\n💰 تفاصيل السعر:`;
      if (priceBreakdown) {
        shareText += `\n💵 السعر الأساسي: ${Number(priceBreakdown.basePrice).toLocaleString()} ريال`;
        shareText += `\n📊 الضريبة (${taxRate}%): ${Number(priceBreakdown.taxAmount).toLocaleString()} ريال`;
        shareText += `\n💳 السعر الإجمالي: ${Number(priceBreakdown.totalPrice).toLocaleString()} ريال`;
      } else {
        shareText += `\n💳 السعر: ${sharePrice}`;
      }
    }

    // Specifications from hierarchy
    if (includeFields.specifications && selectedHierarchySpec?.specifications) {
      shareText += `\n\n📋 المواصفات التفصيلية:`;
      const specs = selectedHierarchySpec.specifications;
      
      if (typeof specs === 'string') {
        shareText += `\n${specs}`;
      } else if (typeof specs === 'object') {
        const specsObj = specs as any;
        if (specsObj.engine) shareText += `\n🔧 المحرك: ${specsObj.engine}`;
        if (specsObj.power) shareText += `\n⚡ القوة: ${specsObj.power}`;
        if (specsObj.transmission) shareText += `\n⚙️ ناقل الحركة: ${specsObj.transmission}`;
        if (specsObj.fuelType) shareText += `\n⛽ نوع الوقود: ${specsObj.fuelType}`;
        if (specsObj.features) shareText += `\n✨ المزايا: ${specsObj.features}`;
      }
    }

    // Mileage for used cars
    if (includeFields.mileage && (vehicle.importType === "شخصي مستعمل" || vehicle.importType === "مستعمل") && vehicle.mileage) {
      shareText += `\n\n📏 الممشي: ${vehicle.mileage.toLocaleString()} كم`;
    }

    // Image links from hierarchy
    if (includeFields.linkedImage && selectedHierarchyImages.length > 0) {
      shareText += `\n\n🖼️ روابط الصور:`;
      selectedHierarchyImages.forEach((imageLink, index) => {
        if (imageLink.imageUrl) {
          shareText += `\n📸 صورة ${index + 1}: ${imageLink.imageUrl}`;
        }
      });
    }

    return shareText;
  };

  const handleShare = async () => {
    const shareText = generateShareText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${vehicle.manufacturer} ${vehicle.category}`,
          text: shareText,
        });
      } catch (error) {
        await copyToClipboard(shareText);
        toast({
          title: "تم النسخ",
          description: "تم نسخ تفاصيل السيارة إلى الحافظة",
        });
      }
    } else {
      await copyToClipboard(shareText);
      toast({
        title: "تم النسخ",
        description: "تم نسخ تفاصيل السيارة إلى الحافظة",
      });
    }
  };

  const handleCopyText = async () => {
    const shareText = generateShareText();
    try {
      await copyToClipboard(shareText);
      toast({
        title: "تم النسخ",
        description: "تم نسخ النص إلى الحافظة",
      });
    } catch (error) {
      toast({
        title: "خطأ في النسخ",
        description: "لم نتمكن من نسخ النص",
        variant: "destructive",
      });
    }
  };

  const handleWhatsAppShare = () => {
    if (!whatsappPhoneNumber.trim()) {
      toast({
        title: "رقم الهاتف مطلوب",
        description: "يرجى إدخال رقم الهاتف أولاً",
        variant: "destructive",
      });
      return;
    }

    const shareText = generateShareText();
    const cleanPhoneNumber = whatsappPhoneNumber.replace(/^0+/, "");
    const formattedNumber = cleanPhoneNumber.startsWith("966") ? cleanPhoneNumber : `966${cleanPhoneNumber}`;
    
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] bg-gradient-to-br from-white to-amber-50/30">
        <DialogHeader className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-4 rounded-t-lg -m-6 mb-4">
          <DialogTitle className="text-xl flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Share className="h-6 w-6" />
            </div>
            <div>
              <div>مشاركة السيارة</div>
              <div className="text-sm font-normal text-amber-100">
                {vehicle.manufacturer} {vehicle.category} - {vehicle.year}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(95vh-120px)]">
          <div className="space-y-6 p-2">

            {/* Fields Selection Card */}
            <Card className="border-amber-200 shadow-lg bg-gradient-to-r from-white to-amber-50/50">
              <CardHeader className="bg-gradient-to-r from-amber-100 to-amber-200/50 -m-6 mb-4 rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-3 text-amber-800">
                  <Eye className="h-5 w-5" />
                  اختيار البيانات للمشاركة
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 space-x-reverse p-3 bg-white rounded-lg border border-amber-200">
                  <Checkbox 
                    id="basicInfo"
                    checked={includeFields.basicInfo}
                    onCheckedChange={(checked) => setIncludeFields(prev => ({ ...prev, basicInfo: !!checked }))}
                    className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                  />
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-amber-600" />
                    <Label htmlFor="basicInfo" className="text-sm font-medium">المعلومات الأساسية</Label>
                  </div>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse p-3 bg-white rounded-lg border border-amber-200">
                  <Checkbox 
                    id="technical"
                    checked={includeFields.technical}
                    onCheckedChange={(checked) => setIncludeFields(prev => ({ ...prev, technical: !!checked }))}
                    className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                  />
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-amber-600" />
                    <Label htmlFor="technical" className="text-sm font-medium">المواصفات التقنية</Label>
                  </div>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse p-3 bg-white rounded-lg border border-amber-200">
                  <Checkbox 
                    id="colors"
                    checked={includeFields.colors}
                    onCheckedChange={(checked) => setIncludeFields(prev => ({ ...prev, colors: !!checked }))}
                    className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                  />
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-amber-600" />
                    <Label htmlFor="colors" className="text-sm font-medium">الألوان</Label>
                  </div>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse p-3 bg-white rounded-lg border border-amber-200">
                  <Checkbox 
                    id="price"
                    checked={includeFields.price}
                    onCheckedChange={(checked) => setIncludeFields(prev => ({ ...prev, price: !!checked }))}
                    className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                  />
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-amber-600" />
                    <Label htmlFor="price" className="text-sm font-medium">السعر</Label>
                  </div>
                </div>

                {hierarchySpecifications.length > 0 && (
                  <div className="flex items-center space-x-2 space-x-reverse p-3 bg-white rounded-lg border border-amber-200">
                    <Checkbox 
                      id="specifications"
                      checked={includeFields.specifications}
                      onCheckedChange={(checked) => setIncludeFields(prev => ({ ...prev, specifications: !!checked }))}
                      className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                    />
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-600" />
                      <Label htmlFor="specifications" className="text-sm font-medium">
                        المواصفات التفصيلية
                        <Badge variant="secondary" className="mr-2 bg-amber-100 text-amber-700">
                          {hierarchySpecifications.length}
                        </Badge>
                      </Label>
                    </div>
                  </div>
                )}

                {selectedHierarchyImages.length > 0 && (
                  <div className="flex items-center space-x-2 space-x-reverse p-3 bg-white rounded-lg border border-amber-200">
                    <Checkbox 
                      id="linkedImage"
                      checked={includeFields.linkedImage}
                      onCheckedChange={(checked) => setIncludeFields(prev => ({ ...prev, linkedImage: !!checked }))}
                      className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                    />
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-amber-600" />
                      <Label htmlFor="linkedImage" className="text-sm font-medium">
                        روابط الصور المحفوظة
                        <Badge variant="secondary" className="mr-2 bg-amber-100 text-amber-700">
                          {selectedHierarchyImages.length}
                        </Badge>
                      </Label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Price Configuration */}
            {includeFields.price && (
              <Card className="border-green-200 shadow-lg bg-gradient-to-r from-white to-green-50/50">
                <CardHeader className="bg-gradient-to-r from-green-100 to-green-200/50 -m-6 mb-4 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-3 text-green-800">
                      <Calculator className="h-5 w-5" />
                      تكوين السعر
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingPrice(!isEditingPrice)}
                      className="text-green-700 hover:bg-green-100"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditingPrice ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-green-800">السعر الإجمالي (شامل الضريبة)</Label>
                        <Input
                          value={sharePrice}
                          onChange={(e) => setSharePrice(e.target.value)}
                          placeholder="أدخل السعر الإجمالي..."
                          className="mt-1 border-green-200 focus:border-green-400"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-green-800">معدل الضريبة (%)</Label>
                        <Input
                          value={taxRate}
                          onChange={(e) => setTaxRate(e.target.value)}
                          placeholder="15"
                          className="mt-1 border-green-200 focus:border-green-400"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sharePrice && (() => {
                        const priceBreakdown = calculatePriceBreakdown();
                        return priceBreakdown ? (
                          <div className="bg-green-50 p-4 rounded-lg space-y-2 border border-green-200">
                            <div className="flex justify-between text-sm">
                              <span className="text-green-700">السعر الأساسي:</span>
                              <span className="font-mono text-green-800">{Number(priceBreakdown.basePrice).toLocaleString()} ريال</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-green-700">الضريبة ({taxRate}%):</span>
                              <span className="font-mono text-green-800">{Number(priceBreakdown.taxAmount).toLocaleString()} ريال</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-sm font-bold">
                              <span className="text-green-800">السعر الإجمالي:</span>
                              <span className="font-mono text-green-900">{Number(priceBreakdown.totalPrice).toLocaleString()} ريال</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-green-600 font-medium text-center py-4">{sharePrice}</p>
                        );
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Share Preview */}
            <Card className="border-blue-200 shadow-lg bg-gradient-to-r from-white to-blue-50/50">
              <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-200/50 -m-6 mb-4 rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-3 text-blue-800">
                  <Eye className="h-5 w-5" />
                  معاينة المشاركة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-blue-50 to-slate-50 p-4 rounded-lg border-r-4 border-blue-400 min-h-[150px]">
                  {generateShareText() ? (
                    <pre className="text-sm whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">
                      {generateShareText()}
                    </pre>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-500">
                        اختر البيانات التي تريد مشاركتها لرؤية المعاينة
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Main Share Actions */}
              <Card className="border-purple-200 shadow-lg bg-gradient-to-r from-white to-purple-50/30">
                <CardHeader className="bg-gradient-to-r from-purple-100 to-purple-200/50 -m-6 mb-4 rounded-t-lg">
                  <CardTitle className="text-lg flex items-center gap-3 text-purple-800">
                    <Share className="h-5 w-5" />
                    مشاركة عامة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={handleShare}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                    disabled={!generateShareText()}
                  >
                    <Share className="h-4 w-4 ml-2" />
                    مشاركة
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCopyText}
                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                    disabled={!generateShareText()}
                  >
                    <Copy className="h-4 w-4 ml-2" />
                    نسخ النص
                  </Button>
                </CardContent>
              </Card>

              {/* WhatsApp Share */}
              <Card className="border-green-200 shadow-lg bg-gradient-to-r from-white to-green-50/30">
                <CardHeader className="bg-gradient-to-r from-green-100 to-green-200/50 -m-6 mb-4 rounded-t-lg">
                  <CardTitle className="text-lg flex items-center gap-3 text-green-800">
                    <MessageCircle className="h-5 w-5" />
                    واتساب
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="tel"
                      placeholder="5xxxxxxxx"
                      value={whatsappPhoneNumber}
                      onChange={(e) => setWhatsappPhoneNumber(e.target.value)}
                      className="flex-1 border-green-200 focus:border-green-400"
                      dir="ltr"
                      disabled={!generateShareText()}
                    />
                    <Button
                      onClick={handleWhatsAppShare}
                      className="px-4 bg-green-600 hover:bg-green-700"
                      disabled={!generateShareText() || !whatsappPhoneNumber.trim()}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-green-600 text-center">
                    أدخل رقم الهاتف بدون +966
                  </p>
                </CardContent>
              </Card>

            </div>

            {/* Image Links Actions */}
            {(includeFields.linkedImage && selectedHierarchyImages.length > 0) || (includeFields.images && vehicle.images && vehicle.images.length > 0) ? (
              <Card className="border-orange-200 shadow-lg bg-gradient-to-r from-white to-orange-50/30">
                <CardHeader className="bg-gradient-to-r from-orange-100 to-orange-200/50 -m-6 mb-4 rounded-t-lg">
                  <CardTitle className="text-lg flex items-center gap-3 text-orange-800">
                    <ImageIcon className="h-5 w-5" />
                    روابط الصور
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {includeFields.linkedImage && linkedImageUrl && (
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await copyToClipboard(linkedImageUrl);
                          toast({
                            title: "تم النسخ",
                            description: "تم نسخ رابط الصورة المحفوظ",
                          });
                        } catch (error) {
                          toast({
                            title: "خطأ في النسخ",
                            description: "لم نتمكن من نسخ رابط الصورة",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="w-full bg-orange-100 hover:bg-orange-200 text-orange-800 border-orange-300"
                    >
                      <LinkIcon className="h-4 w-4 ml-2" />
                      نسخ رابط الصورة المحفوظ
                    </Button>
                  )}
                  
                  {includeFields.images && vehicle.images && vehicle.images.length > 0 && (
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        const imageLinks = vehicle.images!.join('\n');
                        try {
                          await copyToClipboard(imageLinks);
                          toast({
                            title: "تم النسخ",
                            description: `تم نسخ ${vehicle.images!.length} رابط صورة`,
                          });
                        } catch (error) {
                          toast({
                            title: "خطأ في النسخ",
                            description: "لم نتمكن من نسخ روابط الصور",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="w-full bg-orange-100 hover:bg-orange-200 text-orange-800 border-orange-300"
                    >
                      <ImageIcon className="h-4 w-4 ml-2" />
                      نسخ روابط الصور المرفقة ({vehicle.images.length})
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : null}

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}