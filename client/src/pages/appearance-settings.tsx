import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Palette, 
  Settings, 
  Layout, 
  Printer, 
  Type, 
  Image as ImageIcon,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Info,
  FileText,
  Eye,
  CreditCard
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { convertArabicToEnglishNumerals } from "@/utils/numeral-converter";
import { applyThemeSettings } from "@/components/theme-provider";

export default function AppearanceSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const companyLogoInputRef = useRef<HTMLInputElement>(null);
  const printLogoInputRef = useRef<HTMLInputElement>(null);
  const printStampInputRef = useRef<HTMLInputElement>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/appearance"],
  });

  const updateMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const res = await apiRequest("PUT", "/api/appearance", newSettings);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appearance"] });
      toast({
        title: "تم الحفظ",
        description: "تم تحديث إعدادات المظهر بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في حفظ الإعدادات: " + (error.message || "خطأ غير معروف"),
      });
    },
  });

  const [formData, setFormData] = useState<any>({});
  const [livePreview, setLivePreview] = useState<boolean>(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Live preview: apply formData immediately while toggle is on.
  // When the user disables it (or unmounts), restore the saved settings.
  useEffect(() => {
    if (livePreview) {
      applyThemeSettings(formData);
    } else if (settings) {
      applyThemeSettings(settings);
    }
  }, [livePreview, formData, settings]);

  useEffect(() => {
    return () => {
      // On unmount, ensure saved settings are re-applied
      if (settings) applyThemeSettings(settings);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "نوع ملف غير مدعوم",
          description: "يرجى اختيار صورة (PNG, JPG, SVG) أو ملف PDF.",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // Increased to 5MB for PDFs
        toast({
          variant: "destructive",
          title: "خطأ في الرفع",
          description: "حجم الملف كبير جداً. الحد الأقصى هو 5 ميجابايت.",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange(field, reader.result as string);
        toast({
          title: "تم الرفع",
          description: "تم تحميل الملف بنجاح",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            إعدادات مظهر النظام
          </h1>
          <p className="text-slate-500 mt-1">تحكم في الهوية البصرية، الألوان، الخطوط وتنسيق المطبوعات</p>
        </div>
        <div className="flex gap-3 items-center">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              livePreview
                ? "bg-primary/10 border-primary/40 text-primary"
                : "bg-slate-50 border-slate-200 text-slate-600"
            }`}
            data-testid="container-live-preview"
          >
            <Eye className="h-4 w-4" />
            <Label htmlFor="live-preview-switch" className="text-sm font-bold cursor-pointer select-none">
              معاينة مباشرة
            </Label>
            <Switch
              id="live-preview-switch"
              checked={livePreview}
              onCheckedChange={setLivePreview}
              data-testid="switch-live-preview"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setFormData(settings);
              setLivePreview(false);
            }}
            className="gap-2"
            data-testid="button-cancel-changes"
          >
            <RotateCcw className="h-4 w-4" />
            إلغاء التغييرات
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="gap-2 bg-primary hover:bg-primary/90"
            data-testid="button-save-settings"
          >
            <Save className="h-4 w-4" />
            حفظ الإعدادات
          </Button>
        </div>
      </div>

      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="grid w-full grid-cols-6 h-14 glass-container p-1 rounded-xl border-0">
          <TabsTrigger value="branding" className="gap-2 text-sm font-bold text-white/80 data-[state=active]:bg-white/15 data-[state=active]:text-white data-[state=active]:shadow-sm">
            <ImageIcon className="h-4 w-4" />
            الهوية والشعار
          </TabsTrigger>
          <TabsTrigger value="colors" className="gap-2 text-sm font-bold text-white/80 data-[state=active]:bg-white/15 data-[state=active]:text-white data-[state=active]:shadow-sm">
            <Palette className="h-4 w-4" />
            الألوان والسمات
          </TabsTrigger>
          <TabsTrigger value="fonts" className="gap-2 text-sm font-bold text-white/80 data-[state=active]:bg-white/15 data-[state=active]:text-white data-[state=active]:shadow-sm">
            <Type className="h-4 w-4" />
            الخطوط والأيقونات
          </TabsTrigger>
          <TabsTrigger value="vehicleCard" className="gap-2 text-sm font-bold text-white/80 data-[state=active]:bg-white/15 data-[state=active]:text-white data-[state=active]:shadow-sm" data-testid="tab-vehicle-card">
            <CreditCard className="h-4 w-4" />
            بطاقة السيارة
          </TabsTrigger>
          <TabsTrigger value="printing" className="gap-2 text-sm font-bold text-white/80 data-[state=active]:bg-white/15 data-[state=active]:text-white data-[state=active]:shadow-sm">
            <Printer className="h-4 w-4" />
            المطبوعات (PDF)
          </TabsTrigger>
          <TabsTrigger value="quotation" className="gap-2 text-sm font-bold text-white/80 data-[state=active]:bg-white/15 data-[state=active]:text-white data-[state=active]:shadow-sm">
            <FileText className="h-4 w-4" />
            تصميم عرض السعر
          </TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding" className="mt-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-lg">هوية الشركة والنظام</CardTitle>
              <CardDescription>تحكم في اسم الشركة والشعارات التي تظهر في الواجهة والتقارير</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">اسم الشركة (عربي)</Label>
                  <Input 
                    id="companyName" 
                    value={formData.companyName || ""} 
                    onChange={(e) => handleChange("companyName", e.target.value)}
                    placeholder="مثال: شركة البريمي للسيارات"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyNameEn">اسم الشركة (إنجليزي)</Label>
                  <Input 
                    id="companyNameEn" 
                    value={formData.companyNameEn || ""} 
                    onChange={(e) => handleChange("companyNameEn", e.target.value)}
                    placeholder="Example: Al Barimi Motors"
                    className="text-left"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">السجل التجاري</Label>
                  <Input 
                    id="registrationNumber" 
                    value={formData.registrationNumber || ""} 
                    onChange={(e) => {
                      const val = convertArabicToEnglishNumerals(e.target.value);
                      handleChange("registrationNumber", val);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">رقم الترخيص</Label>
                  <Input 
                    id="licenseNumber" 
                    value={formData.licenseNumber || ""} 
                    onChange={(e) => {
                      const val = convertArabicToEnglishNumerals(e.target.value);
                      handleChange("licenseNumber", val);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxNumber">الرقم الضريبي</Label>
                  <Input 
                    id="taxNumber" 
                    value={formData.taxNumber || ""} 
                    onChange={(e) => {
                      const val = convertArabicToEnglishNumerals(e.target.value);
                      handleChange("taxNumber", val);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم التواصل</Label>
                  <Input 
                    id="phone" 
                    value={formData.phone || ""} 
                    onChange={(e) => {
                      const val = convertArabicToEnglishNumerals(e.target.value);
                      handleChange("phone", val);
                    }}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-4">
                  <Label>شعار النظام الرئيسي</Label>
                  <div className="flex flex-col gap-3">
                    <div 
                      className="h-40 w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center overflow-hidden group relative cursor-pointer hover:border-primary/50 transition-colors"
                      onDoubleClick={() => companyLogoInputRef.current?.click()}
                      title="انقر مرتين لاختيار شعار جديد"
                    >
                      {formData.companyLogo ? (
                        <>
                          {formData.companyLogo.startsWith('data:application/pdf') ? (
                            <div className="flex flex-col items-center gap-2">
                              <Printer className="h-12 w-12 text-primary" />
                              <span className="text-xs font-bold text-slate-600">ملف PDF مرفوع</span>
                            </div>
                          ) : (
                            <img src={formData.companyLogo} alt="Logo" className="max-h-full max-w-full object-contain p-4" />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button size="sm" variant="destructive" onClick={(e) => {
                              e.stopPropagation();
                              handleChange("companyLogo", "");
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="h-10 w-10 text-slate-300 mx-auto" />
                          <span className="text-xs text-slate-400 mt-2 block">PNG, JPG, SVG, PDF</span>
                          <span className="text-[10px] text-primary/60 mt-1 block font-bold">انقر مرتين للتحميل</span>
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        ref={companyLogoInputRef}
                        accept=".png,.jpg,.jpeg,.svg,.pdf"
                        onChange={(e) => handleFileUpload(e, "companyLogo")}
                        className="hidden"
                      />
                      <Button 
                        onClick={() => companyLogoInputRef.current?.click()}
                        className="w-full gap-2 bg-primary hover:bg-primary/90"
                      >
                        <Plus className="h-4 w-4" />
                        اختيار ملف الشعار
                      </Button>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">الحد الأقصى للحجم 5 ميجابايت. يدعم PNG, JPG, SVG, PDF.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>شعار المطبوعات (PDF)</Label>
                  <div className="flex flex-col gap-3">
                    <div 
                      className="h-40 w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center overflow-hidden group relative cursor-pointer hover:border-primary/50 transition-colors"
                      onDoubleClick={() => printLogoInputRef.current?.click()}
                      title="انقر مرتين لاختيار شعار مطبوعات جديد"
                    >
                      {formData.printLogo ? (
                        <>
                          {formData.printLogo.startsWith('data:application/pdf') ? (
                            <div className="flex flex-col items-center gap-2">
                              <Printer className="h-12 w-12 text-primary" />
                              <span className="text-xs font-bold text-slate-600">ملف PDF مرفوع</span>
                            </div>
                          ) : (
                            <img src={formData.printLogo} alt="Print Logo" className="max-h-full max-w-full object-contain p-4" />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button size="sm" variant="destructive" onClick={(e) => {
                              e.stopPropagation();
                              handleChange("printLogo", "");
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center">
                          <Printer className="h-10 w-10 text-slate-300 mx-auto" />
                          <span className="text-xs text-slate-400 mt-2 block">PNG, JPG, SVG, PDF</span>
                          <span className="text-[10px] text-primary/60 mt-1 block font-bold">انقر مرتين للتحميل</span>
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        ref={printLogoInputRef}
                        accept=".png,.jpg,.jpeg,.svg,.pdf"
                        onChange={(e) => handleFileUpload(e, "printLogo")}
                        className="hidden"
                      />
                      <Button 
                        onClick={() => printLogoInputRef.current?.click()}
                        className="w-full gap-2 bg-primary hover:bg-primary/90"
                      >
                        <Plus className="h-4 w-4" />
                        اختيار ملف مطبوعات
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>ختم الشركة الرسمي</Label>
                  <div className="flex flex-col gap-3">
                    <div 
                      className="h-40 w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center overflow-hidden group relative cursor-pointer hover:border-primary/50 transition-colors"
                      onDoubleClick={() => printStampInputRef.current?.click()}
                      title="انقر مرتين لاختيار صورة الختم الجديدة"
                    >
                      {formData.printStamp ? (
                        <>
                          <img src={formData.printStamp} alt="Stamp" className="max-h-full max-w-full object-contain p-4" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button size="sm" variant="destructive" onClick={(e) => {
                              e.stopPropagation();
                              handleChange("printStamp", "");
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center">
                          <FileText className="h-10 w-10 text-slate-300 mx-auto" />
                          <span className="text-xs text-slate-400 mt-2 block">PNG, JPG, SVG</span>
                          <span className="text-[10px] text-primary/60 mt-1 block font-bold">انقر مرتين للتحميل</span>
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        ref={printStampInputRef}
                        accept=".png,.jpg,.jpeg,.svg"
                        onChange={(e) => handleFileUpload(e, "printStamp")}
                        className="hidden"
                      />
                      <Button 
                        onClick={() => printStampInputRef.current?.click()}
                        className="w-full gap-2 bg-primary hover:bg-primary/90"
                      >
                        <Plus className="h-4 w-4" />
                        اختيار ملف الختم
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent value="colors" className="mt-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-lg">سمات الألوان والواجهة</CardTitle>
              <CardDescription>خصص جميع ألوان النظام. التغييرات تُطبَّق فوراً على كامل الواجهة بعد الحفظ.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {/* ===== LIVE PREVIEW ===== */}
              <div
                className="rounded-2xl p-6 border-2"
                style={{
                  background: `linear-gradient(135deg, ${formData.gradientStart || formData.primaryColor || "#0f766e"} 0%, ${formData.gradientEnd || formData.secondaryColor || "#0891b2"} 100%)`,
                  borderColor: formData.borderColor || "#e2e8f0",
                }}
                data-testid="preview-theme"
              >
                <div className="grid md:grid-cols-3 gap-4">
                  <div
                    className="rounded-xl p-4 shadow-lg"
                    style={{
                      background: formData.cardBackgroundColor || "#ffffff",
                      color: formData.textPrimaryColor || "#1e293b",
                      border: `1px solid ${formData.borderColor || "#e2e8f0"}`,
                    }}
                  >
                    <div className="text-sm font-bold mb-1">بطاقة معاينة</div>
                    <div className="text-xs" style={{ color: formData.textSecondaryColor || "#64748b" }}>
                      نص ثانوي للقراءة السريعة
                    </div>
                    <button
                      type="button"
                      className="mt-3 px-4 py-2 rounded-lg text-white text-xs font-bold w-full"
                      style={{ background: formData.primaryColor || "#0f766e" }}
                    >
                      زر أساسي
                    </button>
                  </div>
                  <div
                    className="rounded-xl p-4 shadow-lg"
                    style={{
                      background: formData.cardBackgroundColor || "#ffffff",
                      color: formData.textPrimaryColor || "#1e293b",
                      border: `1px solid ${formData.borderColor || "#e2e8f0"}`,
                    }}
                  >
                    <div className="text-sm font-bold mb-1">عناصر تحكم</div>
                    <div className="flex gap-2 mt-3">
                      <span className="px-3 py-1 rounded-full text-[10px] text-white" style={{ background: formData.secondaryColor || "#0891b2" }}>ثانوي</span>
                      <span className="px-3 py-1 rounded-full text-[10px] text-white" style={{ background: formData.accentColor || "#BF9231" }}>تمييز</span>
                    </div>
                  </div>
                  <div
                    className="rounded-xl p-4 shadow-lg"
                    style={{
                      background: formData.darkCardBackgroundColor || "#141414",
                      color: formData.darkTextPrimaryColor || "#f1f5f9",
                      border: `1px solid ${formData.darkBorderColor || "#374151"}`,
                    }}
                  >
                    <div className="text-sm font-bold mb-1">معاينة وضع ليلي</div>
                    <div className="text-xs" style={{ color: formData.darkTextSecondaryColor || "#94a3b8" }}>
                      ألوان الوضع الداكن
                    </div>
                    <button
                      type="button"
                      className="mt-3 px-4 py-2 rounded-lg text-white text-xs font-bold w-full"
                      style={{ background: formData.darkPrimaryColor || "#14b8a6" }}
                    >
                      زر ليلي
                    </button>
                  </div>
                </div>
              </div>

              {/* ===== LIGHT MODE COLORS ===== */}
              <div>
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  ألوان الوضع النهاري (Light Mode)
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { key: "primaryColor", label: "اللون الأساسي", def: "#0f766e" },
                    { key: "primaryHoverColor", label: "الأساسي عند التمرير", def: "#134e4a" },
                    { key: "secondaryColor", label: "اللون الثانوي", def: "#0891b2" },
                    { key: "secondaryHoverColor", label: "الثانوي عند التمرير", def: "#0c4a6e" },
                    { key: "accentColor", label: "لون التمييز (ذهبي)", def: "#BF9231" },
                    { key: "accentHoverColor", label: "التمييز عند التمرير", def: "#a67c27" },
                    { key: "gradientStart", label: "بداية التدرج (الخلفية)", def: "#0f766e" },
                    { key: "gradientEnd", label: "نهاية التدرج (الخلفية)", def: "#0891b2" },
                    { key: "backgroundColor", label: "خلفية المحتوى", def: "#f8fafc" },
                    { key: "cardBackgroundColor", label: "خلفية البطاقات", def: "#ffffff" },
                    { key: "cardHoverColor", label: "البطاقات عند التمرير", def: "#f8fafc" },
                    { key: "headerBackgroundColor", label: "خلفية الترويسة", def: "#ffffff" },
                    { key: "borderColor", label: "لون الحدود", def: "#e2e8f0" },
                    { key: "borderHoverColor", label: "الحدود عند التمرير", def: "#0f766e" },
                    { key: "textPrimaryColor", label: "النص الرئيسي", def: "#1e293b" },
                    { key: "textSecondaryColor", label: "النص الثانوي", def: "#64748b" },
                  ].map((c) => (
                    <div className="space-y-2" key={c.key}>
                      <Label className="flex justify-between items-center">
                        <span className="text-xs">{c.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono uppercase">
                          {formData[c.key] || c.def}
                        </span>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={formData[c.key] || c.def}
                          onChange={(e) => handleChange(c.key, e.target.value)}
                          className="w-12 h-10 p-1 rounded-lg cursor-pointer"
                          data-testid={`color-${c.key}`}
                        />
                        <Input
                          value={formData[c.key] || c.def}
                          onChange={(e) => handleChange(c.key, e.target.value)}
                          className="flex-1 font-mono text-xs"
                          data-testid={`input-${c.key}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ===== DARK MODE COLORS ===== */}
              <div className="border-t pt-8">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  ألوان الوضع الليلي (Dark Mode)
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { key: "darkPrimaryColor", label: "الأساسي (ليلي)", def: "#14b8a6" },
                    { key: "darkPrimaryHoverColor", label: "الأساسي عند التمرير", def: "#0d9488" },
                    { key: "darkSecondaryColor", label: "الثانوي (ليلي)", def: "#0ea5e9" },
                    { key: "darkSecondaryHoverColor", label: "الثانوي عند التمرير", def: "#0284c7" },
                    { key: "darkAccentColor", label: "التمييز (ليلي)", def: "#f59e0b" },
                    { key: "darkAccentHoverColor", label: "التمييز عند التمرير", def: "#d97706" },
                    { key: "darkBackgroundColor", label: "خلفية المحتوى (ليلي)", def: "#000000" },
                    { key: "darkCardBackgroundColor", label: "خلفية البطاقات (ليلي)", def: "#141414" },
                    { key: "darkCardHoverColor", label: "البطاقات عند التمرير", def: "#282828" },
                    { key: "darkHeaderBackgroundColor", label: "خلفية الترويسة (ليلي)", def: "#141414" },
                    { key: "darkBorderColor", label: "لون الحدود (ليلي)", def: "#374151" },
                    { key: "darkBorderHoverColor", label: "الحدود عند التمرير", def: "#14b8a6" },
                    { key: "darkTextPrimaryColor", label: "النص الرئيسي (ليلي)", def: "#f1f5f9" },
                    { key: "darkTextSecondaryColor", label: "النص الثانوي (ليلي)", def: "#94a3b8" },
                  ].map((c) => (
                    <div className="space-y-2" key={c.key}>
                      <Label className="flex justify-between items-center">
                        <span className="text-xs">{c.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono uppercase">
                          {formData[c.key] || c.def}
                        </span>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={formData[c.key] || c.def}
                          onChange={(e) => handleChange(c.key, e.target.value)}
                          className="w-12 h-10 p-1 rounded-lg cursor-pointer"
                          data-testid={`color-${c.key}`}
                        />
                        <Input
                          value={formData[c.key] || c.def}
                          onChange={(e) => handleChange(c.key, e.target.value)}
                          className="flex-1 font-mono text-xs"
                          data-testid={`input-${c.key}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ===== PRESET PALETTES ===== */}
              <div className="border-t pt-8">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  لوحات ألوان جاهزة
                </h3>
                <div className="grid md:grid-cols-4 gap-3">
                  {[
                    { name: "البريمي الافتراضي", primary: "#00627F", secondary: "#00A3CC", accent: "#C49632", gradStart: "#00627F", gradEnd: "#004861" },
                    { name: "أخضر تجاري", primary: "#0f766e", secondary: "#0891b2", accent: "#BF9231", gradStart: "#0f766e", gradEnd: "#0891b2" },
                    { name: "أزرق ملكي", primary: "#1e40af", secondary: "#3b82f6", accent: "#fbbf24", gradStart: "#1e3a8a", gradEnd: "#3b82f6" },
                    { name: "أحمر فاخر", primary: "#991b1b", secondary: "#dc2626", accent: "#f59e0b", gradStart: "#7f1d1d", gradEnd: "#dc2626" },
                    { name: "بنفسجي حديث", primary: "#6d28d9", secondary: "#8b5cf6", accent: "#f472b6", gradStart: "#5b21b6", gradEnd: "#8b5cf6" },
                    { name: "رمادي راقٍ", primary: "#1f2937", secondary: "#475569", accent: "#d4af37", gradStart: "#111827", gradEnd: "#374151" },
                    { name: "أخضر زمردي", primary: "#065f46", secondary: "#10b981", accent: "#facc15", gradStart: "#064e3b", gradEnd: "#10b981" },
                    { name: "برتقالي شمسي", primary: "#c2410c", secondary: "#f97316", accent: "#fbbf24", gradStart: "#9a3412", gradEnd: "#f97316" },
                  ].map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        setFormData((prev: any) => ({
                          ...prev,
                          primaryColor: p.primary,
                          secondaryColor: p.secondary,
                          accentColor: p.accent,
                          gradientStart: p.gradStart,
                          gradientEnd: p.gradEnd,
                          borderHoverColor: p.primary,
                        }));
                      }}
                      className="rounded-xl p-3 border-2 border-slate-100 hover:border-primary hover:shadow-md transition-all text-left"
                      data-testid={`preset-${p.name}`}
                    >
                      <div className="h-10 rounded-lg mb-2 shadow-inner" style={{ background: `linear-gradient(135deg, ${p.gradStart} 0%, ${p.gradEnd} 100%)` }} />
                      <div className="flex gap-1 mb-2">
                        <div className="h-3 flex-1 rounded" style={{ background: p.primary }} />
                        <div className="h-3 flex-1 rounded" style={{ background: p.secondary }} />
                        <div className="h-3 flex-1 rounded" style={{ background: p.accent }} />
                      </div>
                      <div className="text-xs font-bold text-slate-700">{p.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ===== THEME STYLE ===== */}
              <div className="border-t pt-8">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  نمط الواجهة (Theme Style)
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { id: "glass", name: "زجاجي (Glass)", desc: "شفافية وتأثيرات عصرية" },
                    { id: "classic", name: "كلاسيكي (Classic)", desc: "تصميم نظيف وبسيط" },
                    { id: "neumorphism", name: "نيومورفيزم", desc: "ظلال بارزة وتصميم ثلاثي الأبعاد" }
                  ].map((style) => (
                    <div 
                      key={style.id}
                      onClick={() => handleChange("themeStyle", style.id)}
                      className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                        formData.themeStyle === style.id 
                          ? "border-primary bg-primary/5 shadow-md" 
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                      data-testid={`theme-style-${style.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-800">{style.name}</span>
                        {formData.themeStyle === style.id && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <p className="text-xs text-slate-500">{style.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ===== TOGGLES ===== */}
              <div className="border-t pt-8 grid md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <Label className="text-base">تفعيل الوضع الليلي</Label>
                    <p className="text-[10px] text-slate-400">تطبيق ألوان الوضع الداكن على كل الواجهة</p>
                  </div>
                  <Switch 
                    checked={formData.darkModeEnabled || false}
                    onCheckedChange={(checked) => handleChange("darkModeEnabled", checked)}
                    data-testid="switch-dark-mode"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <Label className="text-base">اتجاه RTL (من اليمين إلى اليسار)</Label>
                    <p className="text-[10px] text-slate-400">تخطيط الواجهة العربي</p>
                  </div>
                  <Switch 
                    checked={formData.rtlLayout !== false}
                    onCheckedChange={(checked) => handleChange("rtlLayout", checked)}
                    data-testid="switch-rtl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fonts Tab */}
        <TabsContent value="fonts" className="mt-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-lg">الخطوط والأيقونات</CardTitle>
              <CardDescription>تحكم في الخطوط المستخدمة في النظام ونمط الأيقونات</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>الخط العربي الأساسي</Label>
                  <Select 
                    value={formData.fontFamily || "Noto Sans Arabic"} 
                    onValueChange={(val) => handleChange("fontFamily", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الخط" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Noto Sans Arabic">Noto Sans Arabic (الافتراضي)</SelectItem>
                      <SelectItem value="Tajawal">Tajawal (تجول)</SelectItem>
                      <SelectItem value="Cairo">Cairo (القاهرة)</SelectItem>
                      <SelectItem value="Almarai">Almarai (المراعي)</SelectItem>
                      <SelectItem value="IBM Plex Sans Arabic">IBM Plex Sans Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="p-4 mt-2 bg-slate-50 rounded-lg border border-slate-100 italic text-slate-600" style={{ fontFamily: formData.fontFamily }}>
                    هذا نص تجريبي لمعاينة الخط العربي المختار في واجهة النظام. (1234567890)
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>أيقونة النظام المصغرة (Favicon)</Label>
                  <div className="flex gap-4 items-center mt-2">
                    <div className="h-16 w-16 bg-white border rounded-lg flex items-center justify-center p-2">
                      {formData.systemIcon ? (
                        <img src={formData.systemIcon} className="w-full h-full object-contain" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Input 
                          placeholder="رابط الأيقونة" 
                          value={formData.systemIcon || ""} 
                          onChange={(e) => handleChange("systemIcon", e.target.value)}
                          className="text-xs"
                        />
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, "systemIcon")}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <Button size="sm" variant="outline" className="shrink-0 gap-2">
                            <Plus className="h-4 w-4" />
                            رفع ملف
                          </Button>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400">تظهر في لسان المتصفح وبجانب اسم النظام.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vehicle Card Tab */}
        <TabsContent value="vehicleCard" className="mt-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-lg">إدارة بطاقة السيارة</CardTitle>
              <CardDescription>تحكم في ألوان البطاقة، إظهار/إخفاء الأيقونات وأزرار الإجراءات في الصفحة الرئيسية</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {/* Live Preview */}
              <div className="sticky top-0 z-20 -mx-6 -mt-6 px-6 pt-4 pb-4 mb-2 bg-gradient-to-b from-slate-100 to-slate-50 border-b border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-700">معاينة مباشرة للبطاقة</h3>
                  <span className="text-[10px] text-slate-400">تتحدث فوراً مع كل تغيير</span>
                </div>
                <div className="flex justify-center">
                  <div
                    className="w-full max-w-sm overflow-hidden border-0 relative shadow-lg"
                    data-testid="preview-vehicle-card"
                    style={
                      formData.vehicleCardUseCustomColors
                        ? {
                            backgroundColor: formData.vehicleCardBgColor || "#7B1E1E",
                            color: formData.vehicleCardTextColor || "#FFFFFF",
                            borderRadius: `${formData.vehicleCardBorderRadius ?? 16}px`,
                          }
                        : {
                            background: "linear-gradient(135deg, rgba(123,30,30,0.95), rgba(90,20,20,0.95))",
                            color: "#FFFFFF",
                            borderRadius: `${formData.vehicleCardBorderRadius ?? 16}px`,
                            backdropFilter: "blur(10px)",
                          }
                    }
                  >
                    <div className="p-4 pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm" style={{ color: formData.vehicleCardAccentColor || "#C49632" }}>فئة كاملة</span>
                          <span className="font-bold text-sm" style={{ color: formData.vehicleCardAccentColor || "#C49632" }}>تجهيز فاخر</span>
                        </div>
                        <span className="text-[10px] bg-green-500/30 text-white px-2 py-0.5 rounded-full">متوفر</span>
                      </div>
                    </div>
                    <div className="px-4 pb-4 space-y-3 text-sm">
                      {(formData.vehicleCardShowEngine !== false || formData.vehicleCardShowYear !== false || formData.vehicleCardShowExteriorColor !== false) && (
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>{formData.vehicleCardShowEngine !== false ? "🔧 3.5L" : ""}</div>
                          <div>{formData.vehicleCardShowYear !== false ? "📅 2025" : ""}</div>
                          <div>{formData.vehicleCardShowExteriorColor !== false ? "🎨 أبيض" : ""}</div>
                        </div>
                      )}
                      {(formData.vehicleCardShowInteriorColor !== false || formData.vehicleCardShowImportType !== false || formData.vehicleCardShowOwnership !== false) && (
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>{formData.vehicleCardShowInteriorColor !== false ? "🪑 بيج" : ""}</div>
                          <div>{formData.vehicleCardShowImportType !== false ? "🚢 شخصي" : ""}</div>
                          <div>{formData.vehicleCardShowOwnership !== false ? "🏷️ مستعمل" : ""}</div>
                        </div>
                      )}
                      {(formData.vehicleCardShowLocation !== false || formData.vehicleCardShowVin !== false) && (
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>{formData.vehicleCardShowLocation !== false ? "📍 المعرض" : ""}</div>
                          <div className="col-span-2">{formData.vehicleCardShowVin !== false ? "VIN: WDB1234567890" : ""}</div>
                        </div>
                      )}
                      {(formData.vehicleCardShowPrice !== false || formData.vehicleCardShowMileage !== false) && (
                        <div
                          className="flex justify-between items-center py-2 border-t mt-3"
                          style={{ borderColor: formData.vehicleCardUseCustomColors ? (formData.vehicleCardBorderColor || "#FFFFFF") : "rgba(255,255,255,0.2)" }}
                        >
                          {formData.vehicleCardShowPrice !== false && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs opacity-80">السعر:</span>
                              <span className="font-bold text-sm" style={{ color: formData.vehicleCardPriceColor || "#FCD34D" }}>250,000 ر.س</span>
                            </div>
                          )}
                          {formData.vehicleCardShowMileage !== false && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs opacity-80">ممشي:</span>
                              <span className="font-bold text-sm" style={{ color: formData.vehicleCardPriceColor || "#FCD34D" }}>15,000 كم</span>
                            </div>
                          )}
                        </div>
                      )}
                      {(formData.vehicleCardShowShareBtn !== false || formData.vehicleCardShowSellBtn !== false || formData.vehicleCardShowQuoteBtn !== false || formData.vehicleCardShowPriceCardBtn !== false || formData.vehicleCardShowReserveBtn !== false) && (
                        <div
                          className="pt-3 mt-3 border-t flex justify-center gap-1"
                          style={{ borderColor: formData.vehicleCardUseCustomColors ? (formData.vehicleCardBorderColor || "#FFFFFF") : "rgba(255,255,255,0.2)" }}
                        >
                          {formData.vehicleCardShowShareBtn !== false && (
                            <span className="px-2 h-7 inline-flex items-center justify-center rounded border border-yellow-300 bg-white/10 text-[11px]" style={{ color: "#BF9231" }}>↗</span>
                          )}
                          {formData.vehicleCardShowSellBtn !== false && (
                            <span className="px-2 h-7 inline-flex items-center justify-center rounded border border-green-300 bg-white/10 text-[11px] text-green-300">🛒</span>
                          )}
                          {formData.vehicleCardShowQuoteBtn !== false && (
                            <span className="px-2 h-7 inline-flex items-center justify-center rounded border border-purple-300 bg-white/10 text-[11px] text-purple-300">📄</span>
                          )}
                          {formData.vehicleCardShowPriceCardBtn !== false && (
                            <span className="px-2 h-7 inline-flex items-center justify-center rounded border border-indigo-300 bg-white/10 text-[11px] text-indigo-300">🧾</span>
                          )}
                          {formData.vehicleCardShowReserveBtn !== false && (
                            <span className="px-2 h-7 inline-flex items-center justify-center rounded border border-blue-300 bg-white/10 text-[11px] text-blue-300">📅</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Colors Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <Label>استخدام ألوان مخصصة للبطاقة</Label>
                  <p className="text-[10px] text-slate-400">عند التفعيل سيتم تطبيق الألوان أدناه بدل الألوان الافتراضية للبطاقة الزجاجية</p>
                </div>
                <Switch
                  data-testid="switch-card-custom-colors"
                  checked={formData.vehicleCardUseCustomColors || false}
                  onCheckedChange={(checked) => handleChange("vehicleCardUseCustomColors", checked)}
                />
              </div>

              {/* Colors */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-700">ألوان البطاقة</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">لون خلفية البطاقة</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.vehicleCardBgColor || "#7B1E1E"}
                        onChange={(e) => handleChange("vehicleCardBgColor", e.target.value)}
                        className="w-14 h-10 p-1 cursor-pointer"
                        data-testid="input-card-bg-color"
                      />
                      <Input
                        value={formData.vehicleCardBgColor || "#7B1E1E"}
                        onChange={(e) => handleChange("vehicleCardBgColor", e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">لون نص البطاقة</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.vehicleCardTextColor || "#FFFFFF"}
                        onChange={(e) => handleChange("vehicleCardTextColor", e.target.value)}
                        className="w-14 h-10 p-1 cursor-pointer"
                        data-testid="input-card-text-color"
                      />
                      <Input
                        value={formData.vehicleCardTextColor || "#FFFFFF"}
                        onChange={(e) => handleChange("vehicleCardTextColor", e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">لون السعر</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.vehicleCardPriceColor || "#FCD34D"}
                        onChange={(e) => handleChange("vehicleCardPriceColor", e.target.value)}
                        className="w-14 h-10 p-1 cursor-pointer"
                        data-testid="input-card-price-color"
                      />
                      <Input
                        value={formData.vehicleCardPriceColor || "#FCD34D"}
                        onChange={(e) => handleChange("vehicleCardPriceColor", e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">لون التمييز (الفئة ودرجة التجهيز)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.vehicleCardAccentColor || "#C49632"}
                        onChange={(e) => handleChange("vehicleCardAccentColor", e.target.value)}
                        className="w-14 h-10 p-1 cursor-pointer"
                        data-testid="input-card-accent-color"
                      />
                      <Input
                        value={formData.vehicleCardAccentColor || "#C49632"}
                        onChange={(e) => handleChange("vehicleCardAccentColor", e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">لون الحدود الفاصلة</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.vehicleCardBorderColor || "#FFFFFF"}
                        onChange={(e) => handleChange("vehicleCardBorderColor", e.target.value)}
                        className="w-14 h-10 p-1 cursor-pointer"
                        data-testid="input-card-border-color"
                      />
                      <Input
                        value={formData.vehicleCardBorderColor || "#FFFFFF"}
                        onChange={(e) => handleChange("vehicleCardBorderColor", e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">انحناء الزوايا (px)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={48}
                      value={formData.vehicleCardBorderRadius ?? 16}
                      onChange={(e) => handleChange("vehicleCardBorderRadius", parseInt(e.target.value) || 0)}
                      data-testid="input-card-radius"
                    />
                  </div>
                </div>
              </div>

              {/* Field Visibility */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-bold text-slate-700">إظهار/إخفاء الأيقونات والحقول</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { key: "vehicleCardShowEngine", label: "سعة المحرك" },
                    { key: "vehicleCardShowYear", label: "سنة الصنع" },
                    { key: "vehicleCardShowExteriorColor", label: "اللون الخارجي" },
                    { key: "vehicleCardShowInteriorColor", label: "اللون الداخلي" },
                    { key: "vehicleCardShowImportType", label: "نوع الاستيراد" },
                    { key: "vehicleCardShowOwnership", label: "نوع الملكية" },
                    { key: "vehicleCardShowLocation", label: "الموقع" },
                    { key: "vehicleCardShowVin", label: "رقم الهيكل (VIN)" },
                    { key: "vehicleCardShowPrice", label: "السعر" },
                    { key: "vehicleCardShowMileage", label: "الممشي" },
                  ].map((f) => (
                    <div key={f.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <Label className="text-sm">{f.label}</Label>
                      <Switch
                        data-testid={`switch-${f.key}`}
                        checked={formData[f.key] !== false}
                        onCheckedChange={(checked) => handleChange(f.key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons Visibility */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-bold text-slate-700">إظهار/إخفاء أزرار الإجراءات</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { key: "vehicleCardShowShareBtn", label: "زر المشاركة" },
                    { key: "vehicleCardShowSellBtn", label: "زر البيع" },
                    { key: "vehicleCardShowQuoteBtn", label: "زر إنشاء عرض سعر" },
                    { key: "vehicleCardShowPriceCardBtn", label: "زر بطاقة السعر" },
                    { key: "vehicleCardShowReserveBtn", label: "زر الحجز / إلغاء الحجز" },
                  ].map((f) => (
                    <div key={f.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <Label className="text-sm">{f.label}</Label>
                      <Switch
                        data-testid={`switch-${f.key}`}
                        checked={formData[f.key] !== false}
                        onCheckedChange={(checked) => handleChange(f.key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Printing Tab */}
        <TabsContent value="printing" className="mt-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-lg">إعدادات المطبوعات (PDF)</CardTitle>
              <CardDescription>تخصيص ترويسة وتذييل الصفحات في عروض الأسعار والتقارير</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Layout className="h-4 w-4 text-primary" />
                  ترويسة المطبوعات (Header)
                </Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">القسم الأيمن</Label>
                    <Input 
                      value={formData.printHeaderRight || ""} 
                      onChange={(e) => handleChange("printHeaderRight", e.target.value)}
                      placeholder="بيانات اليمين..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">القسم الأوسط</Label>
                    <Input 
                      value={formData.printHeaderCenter || ""} 
                      onChange={(e) => handleChange("printHeaderCenter", e.target.value)}
                      placeholder="بيانات الوسط..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">القسم الأيسر</Label>
                    <Input 
                      value={formData.printHeaderLeft || ""} 
                      onChange={(e) => handleChange("printHeaderLeft", e.target.value)}
                      placeholder="بيانات اليسار..."
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <Label className="text-xs">نص إضافي للترويسة (HTML)</Label>
                  <Textarea 
                    value={formData.printHeader || ""} 
                    onChange={(e) => handleChange("printHeader", e.target.value)}
                    placeholder="أدخل نص الترويسة أو وسوم HTML مخصصة..."
                    className="min-h-[80px] font-mono text-sm"
                  />
                </div>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  يمكنك استخدام وسوم HTML البسيطة لتنسيق النص.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Label className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-primary" />
                  تذييل المطبوعات (Footer)
                </Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">القسم الأيمن</Label>
                    <Input 
                      value={formData.printFooterRight || ""} 
                      onChange={(e) => handleChange("printFooterRight", e.target.value)}
                      placeholder="بيانات اليمين..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">القسم الأوسط</Label>
                    <Input 
                      value={formData.printFooterCenter || ""} 
                      onChange={(e) => handleChange("printFooterCenter", e.target.value)}
                      placeholder="بيانات الوسط..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">القسم الأيسر</Label>
                    <Input 
                      value={formData.printFooterLeft || ""} 
                      onChange={(e) => handleChange("printFooterLeft", e.target.value)}
                      placeholder="بيانات اليسار..."
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <Label className="text-xs">نص إضافي للتذييل (HTML)</Label>
                  <Textarea 
                    value={formData.printFooter || ""} 
                    onChange={(e) => handleChange("printFooter", e.target.value)}
                    placeholder="أدخل نص التذييل (مثلاً: العنوان، أرقام التواصل، السجل التجاري)..."
                    className="min-h-[80px] font-mono text-sm"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <Label>إظهار العلامة المائية</Label>
                    <p className="text-[10px] text-slate-400">وضع شعار الشركة خلفية باهتة في منتصف الورقة</p>
                  </div>
                  <Switch 
                    checked={formData.watermarkEnabled || false}
                    onCheckedChange={(checked) => handleChange("watermarkEnabled", checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <Label>تضمين تفاصيل البنك تلقائياً</Label>
                    <p className="text-[10px] text-slate-400">إضافة بيانات الحساب البنكي في نهاية عروض الأسعار</p>
                  </div>
                  <Switch 
                    checked={formData.showBankDetails || false}
                    onCheckedChange={(checked) => handleChange("showBankDetails", checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <Label>إظهار شعار الشركة في خلفية الصفحة الرئيسية</Label>
                    <p className="text-[10px] text-slate-400">عرض شعار الشركة كعلامة مائية باهتة خلف بطاقات السيارات</p>
                  </div>
                  <Switch 
                    data-testid="switch-home-watermark"
                    checked={formData.homeWatermarkEnabled !== false}
                    onCheckedChange={(checked) => handleChange("homeWatermarkEnabled", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Quotation Tab */}
        <TabsContent value="quotation" className="mt-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-lg">تخصيص تصميم عرض السعر</CardTitle>
              <CardDescription>التحكم في خلفية عرض السعر، الألوان، والخطوط</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>نوع الخلفية</Label>
                  <Select 
                    value={formData.quotationBackgroundType || "albarimi2"} 
                    onValueChange={(value) => handleChange("quotationBackgroundType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع الخلفية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="albarimi1">البريمي 1 (SVG)</SelectItem>
                      <SelectItem value="albarimi2">البريمي 2 (SVG)</SelectItem>
                      <SelectItem value="dynamic">خلفية ديناميكية (قابلة للتخصيص)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>نوع الخط في عرض السعر</Label>
                  <Select 
                    value={formData.quotationFontFamily || "Noto Sans Arabic"} 
                    onValueChange={(value) => handleChange("quotationFontFamily", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الخط" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Noto Sans Arabic">Noto Sans Arabic</SelectItem>
                      <SelectItem value="Cairo">Cairo</SelectItem>
                      <SelectItem value="Almarai">Almarai</SelectItem>
                      <SelectItem value="Tajawal">Tajawal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Greeting & Closing */}
              <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                <div className="space-y-2">
                  <Label>النص الترحيبي في عرض السعر</Label>
                  <textarea
                    value={formData.quotationGreeting ?? "تحية طيبة وبعد، يسعدنا تزويدكم بعرض السعر بناءً على طلبكم الكريم."}
                    onChange={(e) => handleChange("quotationGreeting", e.target.value)}
                    rows={2}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    placeholder="أدخل النص الترحيبي الذي يظهر تحت اسم العميل..."
                    dir="rtl"
                  />
                  <p className="text-xs text-muted-foreground">يظهر تحت سطر السادة / اسم العميل.</p>
                </div>
                <div className="space-y-2">
                  <Label>لقب الختام (يسار السطر)</Label>
                  <Input
                    value={formData.quotationClosingSalutation ?? ""}
                    onChange={(e) => handleChange("quotationClosingSalutation", e.target.value)}
                    placeholder="مثال: الموقرين  (تلقائي حسب اللقب)"
                    dir="rtl"
                  />
                  <p className="text-xs text-muted-foreground">اتركه فارغاً للتحديد التلقائي (الموقر / الموقرة / الموقرين) حسب لقب العميل.</p>
                </div>
              </div>

              {/* Footer */}
              <div className="space-y-2 pt-4 border-t">
                <Label>ذيل عرض السعر (Footer)</Label>
                <textarea
                  value={formData.quotationFooter ?? ""}
                  onChange={(e) => handleChange("quotationFooter", e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  placeholder="نص يظهر في أسفل عرض السعر، مثال: نشكركم على ثقتكم بنا..."
                  dir="rtl"
                />
                <p className="text-xs text-muted-foreground">يظهر هذا النص في الذيل أسفل الشروط والأحكام والمندوب والختم.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 pt-4 border-t">
                <div className="space-y-2">
                  <Label>اللون الأساسي (Primary)</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      value={formData.quotationPrimaryColor || "#1A365D"} 
                      onChange={(e) => handleChange("quotationPrimaryColor", e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input 
                      value={formData.quotationPrimaryColor || "#1A365D"} 
                      onChange={(e) => handleChange("quotationPrimaryColor", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>اللون الثانوي (Secondary)</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      value={formData.quotationSecondaryColor || "#2B4C8C"} 
                      onChange={(e) => handleChange("quotationSecondaryColor", e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input 
                      value={formData.quotationSecondaryColor || "#2B4C8C"} 
                      onChange={(e) => handleChange("quotationSecondaryColor", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>اللون التمييزي (Accent/Gold)</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      value={formData.quotationAccentColor || "#C49632"} 
                      onChange={(e) => handleChange("quotationAccentColor", e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input 
                      value={formData.quotationAccentColor || "#C49632"} 
                      onChange={(e) => handleChange("quotationAccentColor", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
