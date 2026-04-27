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
  FileText
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { convertArabicToEnglishNumerals } from "@/utils/numeral-converter";

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

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

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
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setFormData(settings)} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            إلغاء التغييرات
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2 bg-primary hover:bg-primary/90">
            <Save className="h-4 w-4" />
            حفظ الإعدادات
          </Button>
        </div>
      </div>

      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-14 bg-slate-100/50 p-1 rounded-xl">
          <TabsTrigger value="branding" className="gap-2 text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <ImageIcon className="h-4 w-4" />
            الهوية والشعار
          </TabsTrigger>
          <TabsTrigger value="colors" className="gap-2 text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Palette className="h-4 w-4" />
            الألوان والسمات
          </TabsTrigger>
          <TabsTrigger value="fonts" className="gap-2 text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Type className="h-4 w-4" />
            الخطوط والأيقونات
          </TabsTrigger>
          <TabsTrigger value="printing" className="gap-2 text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Printer className="h-4 w-4" />
            المطبوعات (PDF)
          </TabsTrigger>
          <TabsTrigger value="quotation" className="gap-2 text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
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
              <CardDescription>خصص ألوان النظام بما يتناسب مع الهوية التجارية للشركة</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label className="flex justify-between">
                    <span>اللون الأساسي (Primary)</span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">{formData.primaryColor || "#03627f"}</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      value={formData.primaryColor || "#03627f"} 
                      onChange={(e) => handleChange("primaryColor", e.target.value)}
                      className="w-12 h-10 p-1 rounded-lg cursor-pointer"
                    />
                    <Input 
                      value={formData.primaryColor || "#03627f"} 
                      onChange={(e) => handleChange("primaryColor", e.target.value)}
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="flex justify-between">
                    <span>اللون الثانوي (Secondary)</span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">{formData.secondaryColor || "#C79C45"}</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      value={formData.secondaryColor || "#C79C45"} 
                      onChange={(e) => handleChange("secondaryColor", e.target.value)}
                      className="w-12 h-10 p-1 rounded-lg cursor-pointer"
                    />
                    <Input 
                      value={formData.secondaryColor || "#C79C45"} 
                      onChange={(e) => handleChange("secondaryColor", e.target.value)}
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="flex justify-between">
                    <span>لون التمييز (Accent)</span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">{formData.accentColor || "#1e293b"}</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      value={formData.accentColor || "#1e293b"} 
                      onChange={(e) => handleChange("accentColor", e.target.value)}
                      className="w-12 h-10 p-1 rounded-lg cursor-pointer"
                    />
                    <Input 
                      value={formData.accentColor || "#1e293b"} 
                      onChange={(e) => handleChange("accentColor", e.target.value)}
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
              </div>

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

              <div className="border-t pt-8 flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">تفعيل الوضع الليلي تلقائياً</Label>
                  <p className="text-xs text-slate-400">تحويل ألوان النظام للألوان الداكنة حسب إعدادات جهاز المستخدم</p>
                </div>
                <Switch 
                  checked={formData.darkModeEnabled || false}
                  onCheckedChange={(checked) => handleChange("darkModeEnabled", checked)}
                />
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
