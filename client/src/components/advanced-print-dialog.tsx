import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Printer, Settings, Palette } from "lucide-react";
import { printTableWithSettings } from "@/lib/utils";

interface PrintSettings {
  visibleColumns: string[];
  orientation: 'portrait' | 'landscape';
  colorTheme: 'default' | 'grayscale' | 'blue' | 'green';
  fontSize: 'small' | 'medium' | 'large';
  includeHeader: boolean;
  includeDate: boolean;
}

interface AdvancedPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const columnOptions = [
  { id: 'manufacturer', label: 'الصانع' },
  { id: 'category', label: 'الفئة' },
  { id: 'trimLevel', label: 'درجة التجهيز' },
  { id: 'engineCapacity', label: 'سعة المحرك' },
  { id: 'year', label: 'السنة' },
  { id: 'exteriorColor', label: 'اللون الخارجي' },
  { id: 'interiorColor', label: 'اللون الداخلي' },
  { id: 'status', label: 'الحالة' },
  { id: 'importType', label: 'نوع الاستيراد' },
  { id: 'location', label: 'الموقع' },
  { id: 'chassisNumber', label: 'رقم الهيكل' },
  { id: 'price', label: 'السعر' },
  { id: 'ownershipType', label: 'نوع الملكية' },
  { id: 'entryDate', label: 'تاريخ الدخول' },
  { id: 'mileage', label: 'الممشي (كم)' },
  { id: 'notes', label: 'الملاحظات' }
];

export function AdvancedPrintDialog({ open, onOpenChange }: AdvancedPrintDialogProps) {
  const [settings, setSettings] = useState<PrintSettings>({
    visibleColumns: columnOptions.map(col => col.id),
    orientation: 'landscape',
    colorTheme: 'default',
    fontSize: 'medium',
    includeHeader: true,
    includeDate: true
  });

  const handleColumnToggle = (columnId: string) => {
    setSettings(prev => ({
      ...prev,
      visibleColumns: prev.visibleColumns.includes(columnId)
        ? prev.visibleColumns.filter(id => id !== columnId)
        : [...prev.visibleColumns, columnId]
    }));
  };

  const handleSelectAll = () => {
    setSettings(prev => ({
      ...prev,
      visibleColumns: columnOptions.map(col => col.id)
    }));
  };

  const handleDeselectAll = () => {
    setSettings(prev => ({
      ...prev,
      visibleColumns: []
    }));
  };

  const handlePrint = () => {
    printTableWithSettings(settings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <Settings className="w-5 h-5" />
            إعدادات الطباعة المتقدمة
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Column Selection */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-right text-lg">تحديد الأعمدة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSelectAll}
                  className="text-sm"
                >
                  تحديد الكل
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDeselectAll}
                  className="text-sm"
                >
                  إلغاء التحديد
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {columnOptions.map((column) => (
                  <div key={column.id} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id={column.id}
                      checked={settings.visibleColumns.includes(column.id)}
                      onCheckedChange={() => handleColumnToggle(column.id)}
                      className="data-[state=checked]:bg-[#C49632] data-[state=checked]:border-[#C49632]"
                    />
                    <Label
                      htmlFor={column.id}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300 text-right">
                  تم تحديد {settings.visibleColumns.length} عمود من أصل {columnOptions.length}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Print Settings */}
          <div className="space-y-6">
            {/* Orientation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right text-lg">اتجاه الصفحة</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={settings.orientation}
                  onValueChange={(value: 'portrait' | 'landscape') =>
                    setSettings(prev => ({ ...prev, orientation: value }))
                  }
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="portrait" id="portrait" />
                    <Label htmlFor="portrait" className="text-sm">طولي</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="landscape" id="landscape" />
                    <Label htmlFor="landscape" className="text-sm">عرضي</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Color Theme */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-right text-lg">
                  <Palette className="w-4 h-4" />
                  نظام الألوان
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={settings.colorTheme}
                  onValueChange={(value: 'default' | 'grayscale' | 'blue' | 'green') =>
                    setSettings(prev => ({ ...prev, colorTheme: value }))
                  }
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="default" id="default" />
                    <Label htmlFor="default" className="text-sm">افتراضي</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="grayscale" id="grayscale" />
                    <Label htmlFor="grayscale" className="text-sm">رمادي</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="blue" id="blue" />
                    <Label htmlFor="blue" className="text-sm">أزرق</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="green" id="green" />
                    <Label htmlFor="green" className="text-sm">أخضر</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Font Size */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right text-lg">حجم الخط</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={settings.fontSize}
                  onValueChange={(value: 'small' | 'medium' | 'large') =>
                    setSettings(prev => ({ ...prev, fontSize: value }))
                  }
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="small" id="small" />
                    <Label htmlFor="small" className="text-sm">صغير</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium" className="text-sm">متوسط</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="large" id="large" />
                    <Label htmlFor="large" className="text-sm">كبير</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Additional Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right text-lg">خيارات إضافية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="includeHeader"
                    checked={settings.includeHeader}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, includeHeader: !!checked }))
                    }
                  />
                  <Label htmlFor="includeHeader" className="text-sm">
                    إضافة رأس الصفحة
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="includeDate"
                    checked={settings.includeDate}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, includeDate: !!checked }))
                    }
                  />
                  <Label htmlFor="includeDate" className="text-sm">
                    إضافة تاريخ الطباعة
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button 
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={settings.visibleColumns.length === 0}
          >
            <Printer className="w-4 h-4 ml-2" />
            طباعة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}