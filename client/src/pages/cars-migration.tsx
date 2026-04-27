import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Database, FileJson, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface MigrationResult {
  manufacturersCreated: number;
  categoriesCreated: number;
  trimLevelsCreated: number;
}

const CarsMigrationPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleMigration = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setMigrationResult(null);

      const response = await apiRequest('POST', '/api/cars-json/migrate') as any;
      
      if (response.success) {
        setMigrationResult(response.data);
        toast({
          title: "نجح التوزيع",
          description: "تم توزيع بيانات cars.json إلى جداول قاعدة البيانات بنجاح",
          duration: 5000,
        });
      } else {
        throw new Error(response.message || 'فشل في توزيع البيانات');
      }
    } catch (error: any) {
      console.error('Migration error:', error);
      setError(error.message || 'فشل في توزيع البيانات');
      toast({
        title: "خطأ في التوزيع",
        description: error.message || 'فشل في توزيع البيانات',
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            توزيع بيانات السيارات
          </h1>
          <p className="text-slate-300">
            تحويل بيانات cars.json إلى جداول قاعدة البيانات المنفصلة
          </p>
        </div>

        {/* Migration Process Card */}
        <Card className="glass-container border-white/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white text-xl flex items-center gap-2">
              <Database className="w-6 h-6" />
              عملية التوزيع
            </CardTitle>
            <CardDescription className="text-slate-300">
              سيتم تحويل بيانات السيارات من ملف cars.json إلى جداول منفصلة في قاعدة البيانات
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Migration Steps */}
            <div className="grid gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 backdrop-blur-sm">
                <FileJson className="w-5 h-5 text-yellow-400" />
                <div>
                  <h3 className="text-white font-medium">قراءة ملف cars.json</h3>
                  <p className="text-slate-400 text-sm">استخراج بيانات الصناع والفئات ودرجات التجهيز</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 backdrop-blur-sm">
                <ArrowRight className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-white font-medium">إنشاء الجداول المنفصلة</h3>
                  <p className="text-slate-400 text-sm">جدول الصناع، جدول الفئات، وجدول درجات التجهيز</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 backdrop-blur-sm">
                <Database className="w-5 h-5 text-green-400" />
                <div>
                  <h3 className="text-white font-medium">ربط العلاقات</h3>
                  <p className="text-slate-400 text-sm">إنشاء العلاقات بين الجداول باستخدام المفاتيح الخارجية</p>
                </div>
              </div>
            </div>

            {/* Migration Button */}
            <div className="text-center pt-4">
              <Button
                onClick={handleMigration}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    جاري التوزيع...
                  </>
                ) : (
                  <>
                    <Database className="w-5 h-5 mr-2" />
                    بدء عملية التوزيع
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        {migrationResult && (
          <Card className="glass-container border-green-500/30 mb-6">
            <CardHeader>
              <CardTitle className="text-green-400 flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                نتائج التوزيع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {migrationResult.manufacturersCreated}
                  </div>
                  <div className="text-white">صناع جدد</div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {migrationResult.categoriesCreated}
                  </div>
                  <div className="text-white">فئات جديدة</div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="text-2xl font-bold text-purple-400 mb-1">
                    {migrationResult.trimLevelsCreated}
                  </div>
                  <div className="text-white">درجات تجهيز جديدة</div>
                </div>
              </div>
              
              <Alert className="mt-4 border-green-500/30 bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-200">
                  تم توزيع البيانات بنجاح وحذف ملف cars.json. يمكنك الآن استخدام الجداول المنفصلة لإدارة بيانات السيارات.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Error Card */}
        {error && (
          <Card className="glass-container border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <XCircle className="w-6 h-6" />
                خطأ في التوزيع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="border-red-500/30 bg-red-500/10">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-200">
                  {error}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Warning Card */}
        {!migrationResult && !error && (
          <Card className="glass-container border-yellow-500/30">
            <CardHeader>
              <CardTitle className="text-yellow-400 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                تحذير مهم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="border-yellow-500/30 bg-yellow-500/10">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-200">
                  <strong>تنبيه:</strong> هذه العملية ستحول بيانات cars.json إلى جداول منفصلة وستحذف الملف الأصلي. 
                  تأكد من وجود نسخة احتياطية قبل المتابعة.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CarsMigrationPage;