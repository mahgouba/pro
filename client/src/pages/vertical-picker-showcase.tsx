import React, { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InventoryIOSPicker from "@/components/inventory-ios-picker";
import { ArrowRight, Car, Smartphone, Home } from "lucide-react";

export default function VerticalPickerShowcase() {
  const [lastSelection, setLastSelection] = useState<any>(null);

  const handleSelectionComplete = (selections: any) => {
    setLastSelection(selections);
    console.log('تم اختيار:', selections);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            iOS Style Vertical Picker
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            نظام اختيار عمودي مشابه لـ iOS مع خاصية التمرير والاختيار المغناطيسي
          </p>
          
          {/* Navigation */}
          <div className="flex justify-center space-x-4 space-x-reverse">
            <Link href="/">
              <Button variant="outline" className="bg-white/10">
                <Home className="ml-2" size={16} />
                الرئيسية
              </Button>
            </Link>
            <Link href="/ios-picker-demo">
              <Button variant="outline" className="bg-white/10">
                <Smartphone className="ml-2" size={16} />
                عرض أساسي
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="glass-unified text-white">
            <CardHeader>
              <CardTitle className="text-center text-white">
                <Smartphone className="mx-auto mb-2" size={32} />
                iOS Style
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center text-white/80">
              تجربة مشابهة لمختارات iOS مع تأثيرات التمرير والاختيار المغناطيسي
            </CardContent>
          </Card>

          <Card className="glass-unified text-white">
            <CardHeader>
              <CardTitle className="text-center text-white">
                <Car className="mx-auto mb-2" size={32} />
                للمخزون
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center text-white/80">
              مصمم خصيصاً لنظام إدارة المخزون مع المعايير المناسبة
            </CardContent>
          </Card>

          <Card className="glass-unified text-white">
            <CardHeader>
              <CardTitle className="text-center text-white">
                <ArrowRight className="mx-auto mb-2" size={32} />
                سهل الاستخدام
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center text-white/80">
              واجهة بديهية مع دعم اللمس والسحب للاختيار
            </CardContent>
          </Card>
        </div>

        {/* Main Demo */}
        <Card className="glass-unified text-white">
          <CardHeader>
            <CardTitle className="text-center text-xl text-white">
              جرب iOS Picker للمخزون
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-white/80 mb-4">
                انقر على الزر لفتح محدد السيارات بأسلوب iOS
              </p>
              
              <InventoryIOSPicker
                onSelectionComplete={handleSelectionComplete}
                triggerButton={
                  <Button 
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                  >
                    <Car className="ml-2" size={20} />
                    فتح محدد السيارات
                  </Button>
                }
              />
            </div>

            {/* Last Selection Display */}
            {lastSelection && (
              <div className="glass-unified p-6 rounded-lg mt-6">
                <h3 className="text-center font-semibold text-white mb-4">
                  آخر اختيار تم:
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-blue-300 text-sm">الصانع</div>
                    <div className="font-bold text-white text-lg">{lastSelection.manufacturer}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-300 text-sm">السنة</div>
                    <div className="font-bold text-white text-lg">{lastSelection.year}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-purple-300 text-sm">الموقع</div>
                    <div className="font-bold text-white text-lg">{lastSelection.location}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-yellow-300 text-sm">اللون</div>
                    <div className="font-bold text-white text-lg">{lastSelection.color}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="glass-unified text-white">
          <CardHeader>
            <CardTitle className="text-center text-white">كيفية الاستخدام</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-white/80">
              <div>
                <h4 className="font-semibold text-white mb-2">التمرير والسحب:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• اسحب القوائم عمودياً للتمرير</li>
                  <li>• الاختيار المغناطيسي يجعل العناصر تنجذب للمركز</li>
                  <li>• يعمل مع اللمس والماوس</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">الاختيار:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• انقر على أي عنصر للاختيار المباشر</li>
                  <li>• العنصر المحدد يظهر بلون أزرق</li>
                  <li>• تأثيرات التلاشي للعناصر البعيدة</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}