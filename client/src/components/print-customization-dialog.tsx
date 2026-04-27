import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, Settings, Palette, RotateCcw } from 'lucide-react';

interface PrintCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint: (settings: PrintSettings) => void;
}

export interface PrintSettings {
  visibleColumns: string[];
  orientation: 'portrait' | 'landscape';
  colorTheme: 'default' | 'grayscale' | 'blue' | 'green';
  fontSize: 'small' | 'medium' | 'large';
  includeHeader: boolean;
  includeDate: boolean;
}

// Available columns that can be hidden/shown
const AVAILABLE_COLUMNS = [
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
  { id: 'entryDate', label: 'تاريخ الوصول' },
  { id: 'notes', label: 'الملاحظات' }
];

const COLOR_THEMES = [
  { id: 'default', label: 'الألوان الافتراضية', preview: '#00627F' },
  { id: 'grayscale', label: 'رمادي', preview: '#6b7280' },
  { id: 'blue', label: 'أزرق', preview: '#3b82f6' },
  { id: 'green', label: 'أخضر', preview: '#10b981' }
];

export function PrintCustomizationDialog({ open, onOpenChange, onPrint }: PrintCustomizationDialogProps) {
  const [settings, setSettings] = useState<PrintSettings>({
    visibleColumns: AVAILABLE_COLUMNS.map(col => col.id),
    orientation: 'landscape',
    colorTheme: 'default',
    fontSize: 'medium',
    includeHeader: true,
    includeDate: true
  });

  const handleColumnToggle = (columnId: string, checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      visibleColumns: checked 
        ? [...prev.visibleColumns, columnId]
        : prev.visibleColumns.filter(id => id !== columnId)
    }));
  };

  const handleSelectAll = () => {
    setSettings(prev => ({
      ...prev,
      visibleColumns: AVAILABLE_COLUMNS.map(col => col.id)
    }));
  };

  const handleSelectNone = () => {
    setSettings(prev => ({
      ...prev,
      visibleColumns: []
    }));
  };

  const handleReset = () => {
    setSettings({
      visibleColumns: AVAILABLE_COLUMNS.map(col => col.id),
      orientation: 'landscape',
      colorTheme: 'default',
      fontSize: 'medium',
      includeHeader: true,
      includeDate: true
    });
  };

  const handlePrint = () => {
    onPrint(settings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <Settings className="w-5 h-5" />
            تخصيص الطباعة
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right flex items-center gap-2">
                <Printer className="w-4 h-4" />
                اختيار الأعمدة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  اختيار الكل
                </Button>
                <Button variant="outline" size="sm" onClick={handleSelectNone}>
                  إلغاء الكل
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {AVAILABLE_COLUMNS.map(column => (
                  <div key={column.id} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id={column.id}
                      checked={settings.visibleColumns.includes(column.id)}
                      onCheckedChange={(checked) => handleColumnToggle(column.id, !!checked)}
                      className="data-[state=checked]:bg-[#C49632] data-[state=checked]:border-[#C49632]"
                    />
                    <Label
                      htmlFor={column.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-sm text-gray-600 text-right">
                عدد الأعمدة المختارة: {settings.visibleColumns.length}
              </div>
            </CardContent>
          </Card>

          {/* Print Settings */}
          <div className="space-y-6">
            {/* Page Orientation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  اتجاه الصفحة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={settings.orientation}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, orientation: value as 'portrait' | 'landscape' }))}
                  className="text-right"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="landscape" id="landscape" />
                    <Label htmlFor="landscape">عرضي (أفضل للجداول)</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="portrait" id="portrait" />
                    <Label htmlFor="portrait">طولي</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Color Theme */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  نظام الألوان
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={settings.colorTheme}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, colorTheme: value as any }))}
                  className="space-y-3"
                >
                  {COLOR_THEMES.map(theme => (
                    <div key={theme.id} className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value={theme.id} id={theme.id} />
                      <Label htmlFor={theme.id} className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: theme.preview }}
                        />
                        {theme.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Font Size */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right">حجم الخط</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={settings.fontSize}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, fontSize: value as any }))}
                  className="text-right"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="small" id="small" />
                    <Label htmlFor="small">صغير (مناسب لجداول كبيرة)</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium">متوسط</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="large" id="large" />
                    <Label htmlFor="large">كبير</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Additional Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right">خيارات إضافية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="includeHeader"
                    checked={settings.includeHeader}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includeHeader: !!checked }))}
                    className="data-[state=checked]:bg-[#C49632] data-[state=checked]:border-[#C49632]"
                  />
                  <Label htmlFor="includeHeader">
                    تضمين العنوان الرئيسي
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="includeDate"
                    checked={settings.includeDate}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includeDate: !!checked }))}
                    className="data-[state=checked]:bg-[#C49632] data-[state=checked]:border-[#C49632]"
                  />
                  <Label htmlFor="includeDate">
                    تضمين تاريخ الطباعة
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 ml-2" />
              إعادة تعيين
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button onClick={handlePrint} disabled={settings.visibleColumns.length === 0}>
              <Printer className="w-4 h-4 ml-2" />
              طباعة
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}