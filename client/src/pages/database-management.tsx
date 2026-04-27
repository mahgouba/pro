import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Users, 
  Building, 
  CreditCard, 
  Percent, 
  Car, 
  Settings, 
  Tags, 
  Palette, 
  UserCheck, 
  Wrench, 
  Trash2,
  Link,
  Server,
  FileText,
  Gauge,
  Calendar,
  Shield,
  Globe,
  RefreshCw,
  Play,
  Pause,
  Info,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Checkbox } from "@/components/ui/checkbox";
import SystemGlassWrapper from "@/components/system-glass-wrapper";

export default function DatabaseManagement() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionString, setConnectionString] = useState("");
  const [showConnectionString, setShowConnectionString] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connected' | 'failed'>('idle');
  const [selectedExportTypes, setSelectedExportTypes] = useState<string[]>([]);
  const [selectedImportTypes, setSelectedImportTypes] = useState<string[]>([]);
  const [databaseStats, setDatabaseStats] = useState<any>(null);
  const [importSource, setImportSource] = useState<'file' | 'database'>('file');
  const [isClearingInventory, setIsClearingInventory] = useState(false);
  const { toast } = useToast();

  // Updated data types based on current schema
  const dataTypes = [
    { id: 'users', label: 'المستخدمين', icon: Users, description: 'بيانات المستخدمين والصلاحيات', count: 0 },
    { id: 'inventory', label: 'المخزون', icon: Database, description: 'عناصر المخزون والسيارات', count: 0 },
    { id: 'manufacturers', label: 'الصناع', icon: Car, description: 'شركات تصنيع السيارات', count: 0 },
    { id: 'vehicleCategories', label: 'فئات السيارات', icon: Tags, description: 'فئات ونماذج السيارات', count: 0 },
    { id: 'trimLevels', label: 'درجة التجهيز', icon: Wrench, description: 'درجات التجهيز والمواصفات', count: 0 },
    { id: 'banks', label: 'البنوك', icon: Building, description: 'بيانات البنوك الشخصية والشركة', count: 0 },
    { id: 'bankInterestRates', label: 'نسب التمويل', icon: Percent, description: 'نسب التمويل البنكية', count: 0 },
    { id: 'companies', label: 'الشركات', icon: Building, description: 'بيانات الشركات لإدارة العروض', count: 0 },
    { id: 'quotations', label: 'العروض', icon: CreditCard, description: 'عروض الأسعار المحفوظة', count: 0 },
    { id: 'colorAssociations', label: 'ربط الألوان', icon: Palette, description: 'ربط الألوان بالسيارات', count: 0 },
    { id: 'vehicleSpecifications', label: 'المواصفات', icon: FileText, description: 'مواصفات السيارات التفصيلية', count: 0 },
    { id: 'vehicleImageLinks', label: 'روابط الصور', icon: Globe, description: 'روابط صور السيارات', count: 0 },
  ];

  // Load database statistics
  React.useEffect(() => {
    loadDatabaseStats();
  }, []);

  const loadDatabaseStats = async () => {
    try {
      const stats = await apiRequest('GET', '/api/database/stats');
      setDatabaseStats(stats);
    } catch (error) {
      console.error('Error loading database stats:', error);
    }
  };

  const testConnection = async () => {
    if (!connectionString.trim()) {
      toast({
        title: "خطأ في الاتصال",
        description: "يرجى إدخال رابط الاتصال أولاً",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const result = await apiRequest('POST', '/api/database/test-connection', {
        connectionString: connectionString.trim()
      }) as { success: boolean; error?: string; message?: string };
      
      if (result.success) {
        setConnectionStatus('connected');
        toast({
          title: "تم الاتصال بنجاح",
          description: "تم الاتصال بقاعدة البيانات الخارجية بنجاح",
        });
      } else {
        setConnectionStatus('failed');
        toast({
          title: "فشل الاتصال",
          description: result.error || "فشل في الاتصال بقاعدة البيانات",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('failed');
      toast({
        title: "خطأ في الاتصال",
        description: "حدث خطأ أثناء اختبار الاتصال",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleExport = async (selective = false) => {
    setIsExporting(true);
    try {
      const exportTypes = selective ? selectedExportTypes : [];
      const queryParams = exportTypes.length > 0 ? `?types=${exportTypes.join(',')}` : '';
      const response = await fetch(`/api/database/export${queryParams}`);
      if (!response.ok) throw new Error('فشل في تصدير البيانات');
      
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const prefix = selective ? 'selective-' : 'full-';
      a.download = `${prefix}database-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "تم التصدير بنجاح",
        description: selective ? "تم تصدير البيانات المحددة بنجاح" : "تم تصدير قاعدة البيانات بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير قاعدة البيانات",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>, selective = false) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast({
        title: "نوع ملف غير صحيح",
        description: "يرجى اختيار ملف JSON فقط",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const importData = selective ? { ...data, selectedTypes: selectedImportTypes } : data;
      const response = await apiRequest('POST', '/api/database/import', importData);
      
      toast({
        title: "تم الاستيراد بنجاح",
        description: selective ? "تم استيراد البيانات المحددة بنجاح" : "تم استيراد قاعدة البيانات بنجاح",
      });
      
      // Refresh stats
      await loadDatabaseStats();
      
      // Refresh the page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast({
        title: "خطأ في الاستيراد",
        description: "حدث خطأ أثناء استيراد قاعدة البيانات. تأكد من صحة ملف JSON",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleDatabaseImport = async () => {
    if (connectionStatus !== 'connected') {
      toast({
        title: "لا يوجد اتصال",
        description: "يرجى اختبار الاتصال أولاً قبل الاستيراد",
        variant: "destructive",
      });
      return;
    }

    const confirmed = window.confirm(
      "تحذير!\n\nسيتم استيراد البيانات من قاعدة البيانات الخارجية.\nقد يتم استبدال البيانات الحالية.\n\nهل تريد المتابعة؟"
    );
    
    if (!confirmed) return;

    setIsImporting(true);
    try {
      const importData = {
        connectionString: connectionString.trim(),
        selectedTypes: selectedImportTypes.length > 0 ? selectedImportTypes : undefined
      };
      
      await apiRequest('POST', '/api/database/import-from-external', importData);
      
      toast({
        title: "تم الاستيراد بنجاح",
        description: "تم استيراد البيانات من قاعدة البيانات الخارجية بنجاح",
      });
      
      // Refresh stats
      await loadDatabaseStats();
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast({
        title: "خطأ في الاستيراد",
        description: "حدث خطأ أثناء استيراد البيانات من قاعدة البيانات الخارجية",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDatabaseExport = async () => {
    if (connectionStatus !== 'connected') {
      toast({
        title: "لا يوجد اتصال",
        description: "يرجى اختبار الاتصال أولاً قبل التصدير",
        variant: "destructive",
      });
      return;
    }

    const confirmed = window.confirm(
      "تأكيد التصدير!\n\nسيتم تصدير جميع بيانات النظام الحالي إلى قاعدة البيانات الخارجية.\nسيتم استبدال البيانات الموجودة في قاعدة البيانات الخارجية.\n\nهل تريد المتابعة؟"
    );
    
    if (!confirmed) return;

    setIsExporting(true);
    try {
      await apiRequest('POST', '/api/database/export-to-external', {
        connectionString: connectionString.trim()
      });
      
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير جميع البيانات إلى قاعدة البيانات الخارجية بنجاح",
      });
      
    } catch (error) {
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير البيانات إلى قاعدة البيانات الخارجية",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const toggleExportType = (typeId: string) => {
    setSelectedExportTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const toggleImportType = (typeId: string) => {
    setSelectedImportTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleClearInventory = async () => {
    const confirmed = window.confirm(
      "تحذير!\n\nسيتم حذف جميع عناصر المخزون نهائياً.\nهذا الإجراء لا يمكن التراجع عنه.\n\nهل تريد المتابعة؟"
    );
    
    if (!confirmed) return;

    const doubleConfirmed = window.confirm(
      "تأكيد نهائي!\n\nأنت على وشك حذف جميع السيارات والعناصر في المخزون.\nهل أنت متأكد 100%؟"
    );
    
    if (!doubleConfirmed) return;

    setIsClearingInventory(true);
    try {
      await apiRequest('DELETE', '/api/inventory/clear-all');
      
      toast({
        title: "تم حذف المخزون",
        description: "تم حذف جميع عناصر المخزون بنجاح",
      });
      
      // Refresh stats
      await loadDatabaseStats();
      
    } catch (error) {
      toast({
        title: "خطأ في حذف المخزون",
        description: "حدث خطأ أثناء حذف المخزون",
        variant: "destructive",
      });
    } finally {
      setIsClearingInventory(false);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Database className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'border-green-500/50 bg-green-500/10';
      case 'failed':
        return 'border-red-500/50 bg-red-500/10';
      default:
        return 'border-white/20 bg-white/5';
    }
  };

  return (
    <SystemGlassWrapper>
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Database className="w-8 h-8 text-[#C79C45]" />
              <h1 className="text-3xl font-bold text-white">إدارة قاعدة البيانات</h1>
            </div>
            <p className="text-white/70 text-lg">
              استيراد وتصدير بيانات النظام مع إمكانية الربط بقواعد البيانات الخارجية
            </p>
          </div>

          {/* Database Statistics */}
          {databaseStats && (
            <Card className="bg-white/5 backdrop-blur-lg border-white/10 mb-8">
              <CardHeader>
                <CardTitle className="text-white text-center flex items-center justify-center gap-2">
                  <Gauge className="w-5 h-5" />
                  إحصائيات قاعدة البيانات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {dataTypes.map((type) => {
                    const count = databaseStats[type.id] || 0;
                    const IconComponent = type.icon;
                    return (
                      <div key={type.id} className="text-center p-3 bg-white/5 rounded-lg">
                        <IconComponent className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <p className="text-white text-sm font-medium">{type.label}</p>
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 mt-1">
                          {count.toLocaleString('ar-EG')}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="export" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white/10">
              <TabsTrigger value="export" className="data-[state=active]:bg-white/20">
                <Download className="w-4 h-4 mr-2" />
                تصدير البيانات
              </TabsTrigger>
              <TabsTrigger value="import" className="data-[state=active]:bg-white/20">
                <Upload className="w-4 h-4 mr-2" />
                استيراد البيانات
              </TabsTrigger>
              <TabsTrigger value="connection" className="data-[state=active]:bg-white/20">
                <Link className="w-4 h-4 mr-2" />
                ربط قاعدة بيانات
              </TabsTrigger>
            </TabsList>

            {/* Export Tab */}
            <TabsContent value="export">
              <Card className="bg-white/5 backdrop-blur-lg border-white/10">
                <CardHeader className="text-center">
                  <CardTitle className="text-white text-xl flex items-center justify-center gap-2">
                    <Download className="w-6 h-6 text-green-400" />
                    تصدير البيانات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Data Type Selection for Export */}
                  <div>
                    <h3 className="text-white font-semibold mb-4 text-center">اختر نوع البيانات للتصدير</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {dataTypes.map((type) => {
                        const IconComponent = type.icon;
                        const count = databaseStats?.[type.id] || 0;
                        return (
                          <div
                            key={type.id}
                            className="flex items-center space-x-3 space-x-reverse p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                            onClick={() => toggleExportType(type.id)}
                          >
                            <Checkbox
                              checked={selectedExportTypes.includes(type.id)}
                              onCheckedChange={() => toggleExportType(type.id)}
                              className="border-white/30 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                            />
                            <div className="flex items-center gap-3 flex-1">
                              <IconComponent className="w-5 h-5 text-blue-400" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-white font-medium">{type.label}</p>
                                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                                    {count.toLocaleString('ar-EG')}
                                  </Badge>
                                </div>
                                <p className="text-white/60 text-sm">{type.description}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Export Buttons */}
                  <div className="space-y-3">
                    <Button 
                      onClick={() => handleExport(false)}
                      disabled={isExporting}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      data-testid="button-export-all"
                    >
                      {isExporting ? (
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          جاري التصدير...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Download className="w-4 h-4" />
                          تصدير جميع البيانات
                        </div>
                      )}
                    </Button>

                    <Button 
                      onClick={() => handleExport(true)}
                      disabled={isExporting || selectedExportTypes.length === 0}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                      data-testid="button-export-selected"
                    >
                      <div className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        تصدير البيانات المحددة ({selectedExportTypes.length})
                      </div>
                    </Button>

                    {/* Clear Inventory Button */}
                    <div className="border-t border-white/10 pt-4 mt-4">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                          <span className="text-red-200 font-semibold">منطقة خطرة</span>
                        </div>
                        <p className="text-red-200/80 text-sm">
                          سيتم حذف جميع عناصر المخزون والسيارات نهائياً. لا يمكن التراجع عن هذا الإجراء.
                        </p>
                      </div>
                      <Button 
                        onClick={handleClearInventory}
                        disabled={isClearingInventory}
                        variant="destructive"
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                        data-testid="button-clear-inventory"
                      >
                        {isClearingInventory ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            جاري حذف المخزون...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Trash2 className="w-4 h-4" />
                            حذف المخزون بالكامل ({databaseStats?.inventory || 0} عنصر)
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Import Tab */}
            <TabsContent value="import">
              <Card className="bg-white/5 backdrop-blur-lg border-white/10">
                <CardHeader className="text-center">
                  <CardTitle className="text-white text-xl flex items-center justify-center gap-2">
                    <Upload className="w-6 h-6 text-orange-400" />
                    استيراد البيانات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Import Source Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant={importSource === 'file' ? 'default' : 'outline'}
                      onClick={() => setImportSource('file')}
                      className="h-auto p-4 flex-col gap-2"
                      data-testid="button-import-file"
                    >
                      <FileText className="w-6 h-6" />
                      <span>من ملف JSON</span>
                    </Button>
                    <Button
                      variant={importSource === 'database' ? 'default' : 'outline'}
                      onClick={() => setImportSource('database')}
                      className="h-auto p-4 flex-col gap-2"
                      data-testid="button-import-database"
                    >
                      <Server className="w-6 h-6" />
                      <span>من قاعدة بيانات</span>
                    </Button>
                  </div>

                  {/* Data Type Selection for Import */}
                  <div>
                    <h3 className="text-white font-semibold mb-4 text-center">اختر نوع البيانات للاستيراد</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {dataTypes.map((type) => {
                        const IconComponent = type.icon;
                        const count = databaseStats?.[type.id] || 0;
                        return (
                          <div
                            key={type.id}
                            className="flex items-center space-x-3 space-x-reverse p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                            onClick={() => toggleImportType(type.id)}
                          >
                            <Checkbox
                              checked={selectedImportTypes.includes(type.id)}
                              onCheckedChange={() => toggleImportType(type.id)}
                              className="border-white/30 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                            />
                            <div className="flex items-center gap-3 flex-1">
                              <IconComponent className="w-5 h-5 text-orange-400" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-white font-medium">{type.label}</p>
                                  <Badge variant="secondary" className="bg-orange-500/20 text-orange-300">
                                    {count.toLocaleString('ar-EG')}
                                  </Badge>
                                </div>
                                <p className="text-white/60 text-sm">{type.description}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-red-200">
                        <p className="font-medium mb-1">تحذير مهم:</p>
                        <ul className="space-y-1 text-red-300">
                          <li>• سيتم استبدال البيانات المحددة</li>
                          <li>• تأكد من عمل نسخة احتياطية أولاً</li>
                          <li>• {importSource === 'file' ? 'استخدم ملفات JSON صحيحة فقط' : 'تأكد من صحة رابط قاعدة البيانات'}</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Import Actions */}
                  {importSource === 'file' ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type="file"
                          accept=".json"
                          onChange={(e) => handleImport(e, false)}
                          disabled={isImporting}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          data-testid="input-import-file-all"
                        />
                        <Button 
                          disabled={isImporting}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white pointer-events-none"
                        >
                          {isImporting ? (
                            <div className="flex items-center gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              جاري الاستيراد...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Upload className="w-4 h-4" />
                              استيراد جميع البيانات من ملف
                            </div>
                          )}
                        </Button>
                      </div>

                      <div className="relative">
                        <input
                          type="file"
                          accept=".json"
                          onChange={(e) => handleImport(e, true)}
                          disabled={isImporting || selectedImportTypes.length === 0}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          data-testid="input-import-file-selected"
                        />
                        <Button 
                          disabled={isImporting || selectedImportTypes.length === 0}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 pointer-events-none"
                        >
                          <div className="flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            استيراد البيانات المحددة من ملف ({selectedImportTypes.length})
                          </div>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button 
                        onClick={handleDatabaseImport}
                        disabled={isImporting || connectionStatus !== 'connected'}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
                        data-testid="button-import-database-data"
                      >
                        {isImporting ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            جاري الاستيراد...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Server className="w-4 h-4" />
                            استيراد من قاعدة البيانات المتصلة
                          </div>
                        )}
                      </Button>

                      <Button 
                        onClick={handleDatabaseExport}
                        disabled={isExporting || connectionStatus !== 'connected'}
                        className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                        data-testid="button-export-database-data"
                      >
                        {isExporting ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            جاري التصدير...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            تصدير إلى قاعدة البيانات المتصلة
                          </div>
                        )}
                      </Button>
                      
                      {connectionStatus !== 'connected' && (
                        <p className="text-amber-300 text-sm text-center">
                          يرجى الانتقال إلى تبويب "ربط قاعدة بيانات" واختبار الاتصال أولاً
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Database Connection Tab */}
            <TabsContent value="connection">
              <Card className="bg-white/5 backdrop-blur-lg border-white/10">
                <CardHeader className="text-center">
                  <CardTitle className="text-white text-xl flex items-center justify-center gap-2">
                    <Link className="w-6 h-6 text-blue-400" />
                    ربط قاعدة بيانات خارجية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Connection Status */}
                  <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon()}
                        <span className="text-white font-medium">حالة الاتصال</span>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={
                          connectionStatus === 'connected' 
                            ? 'bg-green-500/20 text-green-300'
                            : connectionStatus === 'failed'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-gray-500/20 text-gray-300'
                        }
                      >
                        {connectionStatus === 'connected' ? 'متصل' : connectionStatus === 'failed' ? 'فشل الاتصال' : 'غير متصل'}
                      </Badge>
                    </div>
                    
                    {connectionStatus === 'connected' && (
                      <p className="text-green-200 text-sm">
                        ✓ تم الاتصال بقاعدة البيانات بنجاح. يمكنك الآن استيراد البيانات.
                      </p>
                    )}
                    
                    {connectionStatus === 'failed' && (
                      <p className="text-red-200 text-sm">
                        ✗ فشل في الاتصال. تحقق من صحة رابط الاتصال والمحاولة مرة أخرى.
                      </p>
                    )}
                  </div>

                  {/* Connection String Input */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="connectionString" className="text-white font-medium mb-2 block">
                        رابط الاتصال (Connection String)
                      </Label>
                      <div className="relative">
                        <Input
                          id="connectionString"
                          type={showConnectionString ? "text" : "password"}
                          value={connectionString}
                          onChange={(e) => setConnectionString(e.target.value)}
                          placeholder="postgresql://username:password@host:port/database?sslmode=require"
                          className="bg-white/5 border-white/20 text-white placeholder-white/50 pr-10"
                          data-testid="input-connection-string"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-white/60 hover:text-white"
                          onClick={() => setShowConnectionString(!showConnectionString)}
                          data-testid="button-toggle-connection-visibility"
                        >
                          {showConnectionString ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Connection Format Examples */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-blue-200 text-sm font-medium">أمثلة على أشكال روابط الاتصال:</p>
                      </div>
                      <div className="space-y-2 text-blue-100 text-xs">
                        <p>• PostgreSQL: postgresql://user:pass@host:5432/dbname</p>
                        <p>• Neon: postgresql://user:pass@host.neon.tech/dbname?sslmode=require</p>
                        <p>• Supabase: postgresql://postgres:pass@host.supabase.co:5432/postgres</p>
                      </div>
                    </div>
                  </div>

                  {/* Test Connection Button */}
                  <Button 
                    onClick={testConnection}
                    disabled={isConnecting || !connectionString.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                    data-testid="button-test-connection"
                  >
                    {isConnecting ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        جاري اختبار الاتصال...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        اختبار الاتصال
                      </div>
                    )}
                  </Button>

                  {/* Security Warning */}
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-amber-200">
                        <p className="font-medium mb-1">تنبيه أمني:</p>
                        <ul className="space-y-1 text-amber-300">
                          <li>• تأكد من أن قاعدة البيانات المستهدفة آمنة</li>
                          <li>• لا تشارك روابط الاتصال مع أشخاص غير موثوقين</li>
                          <li>• استخدم كلمات مرور قوية وتشفير SSL</li>
                          <li>• تأكد من وجود نسخة احتياطية قبل الاستيراد</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SystemGlassWrapper>
  );
}