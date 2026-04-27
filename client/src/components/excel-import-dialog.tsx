import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { FileSpreadsheet, Upload, CheckCircle, AlertCircle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import * as XLSX from 'xlsx';

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportStats {
  total: number;
  success: number;
  failed: number;
  duplicates: number;
}

export function ExcelImportDialog({ open, onOpenChange }: ExcelImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (data: any[]) => {
      const response = await apiRequest("POST", "/api/inventory/import-excel", { items: data });
      return response as unknown as ImportStats;
    },
    onSuccess: (result: ImportStats) => {
      setImportStats(result);
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "تم الاستيراد بنجاح",
        description: `تم استيراد ${result.success} عنصر بنجاح من أصل ${result.total}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الاستيراد",
        description: error.message || "حدث خطأ أثناء استيراد البيانات",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
      toast({
        title: "نوع ملف غير صحيح",
        description: "يرجى اختيار ملف Excel (.xlsx أو .xls)",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    processExcelFile(selectedFile);
  }, [toast]);

  const processExcelFile = useCallback((file: File) => {
    setIsProcessing(true);
    setProgress(25);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        setProgress(50);

        // Get the first worksheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        setProgress(75);

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Skip empty rows and header row
        const dataRows = jsonData.slice(1).filter((row: any) => row.length > 0);
        
        // Map Excel columns to our schema
        const mappedData = dataRows.map((row: any, index: number) => {
          return {
            manufacturer: row[0] || '',
            category: row[1] || '',
            trimLevel: row[2] || '',
            year: row[3] ? parseInt(row[3]) : new Date().getFullYear(),
            engineCapacity: row[4] || '',
            drivetrain: row[5] || 'دفع خلفي',
            exteriorColor: row[6] || '',
            interiorColor: row[7] || '',
            mileage: row[8] ? parseInt(row[8]) : 0,
            price: row[9] ? String(row[9]) : '0',
            location: row[10] || 'الرياض',
            status: row[11] || 'متاح للبيع',
            importType: row[12] || 'وكالة',
            ownershipType: row[13] || 'ملكية شخصية',
            notes: row[14] || '',
            chassisNumber: row[15] || '000', // Server will generate unique chassis number if needed
            // Note: serialNumber, fuelType, transmission, drivetrain fields removed from template as requested
          };
        });

        setPreviewData(mappedData); // Show all data for preview
        setProgress(100);
        setIsProcessing(false);

        toast({
          title: "تم تحليل الملف",
          description: `تم العثور على ${mappedData.length} صف من البيانات`,
        });

      } catch (error) {
        console.error('Error processing Excel file:', error);
        toast({
          title: "خطأ في معالجة الملف",
          description: "تعذر قراءة ملف Excel. تأكد من صحة تنسيق الملف",
          variant: "destructive",
        });
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  }, [toast]);

  const handleImport = () => {
    if (previewData.length === 0) {
      toast({
        title: "لا توجد بيانات للاستيراد",
        description: "يرجى اختيار ملف Excel صحيح",
        variant: "destructive",
      });
      return;
    }

    console.log("Importing data:", previewData);
    console.log("Total rows to import:", previewData.length);
    importMutation.mutate(previewData);
  };

  const downloadTemplate = () => {
    // Create template data (removed: الرقم التسلسلي، نظام الدفع، ناقل الحركة، نوع الوقود)
    const templateData = [
      [
        'الشركة المصنعة',
        'الفئة', 
        'مستوى التجهيز',
        'السنة',
        'سعة المحرك',
        'نظام الدفع',
        'لون خارجي',
        'لون داخلي',
        'الكيلومترات',
        'السعر',
        'الموقع',
        'الحالة',
        'نوع الاستيراد',
        'نوع الملكية',
        'ملاحظات',
        'رقم الشاسيه'
      ],
      [
        'تويوتا',
        'كامري',
        'فل كامل',
        '2023',
        '2.5L',
        'دفع أمامي',
        'أبيض لؤلؤي',
        'أسود',
        '15000',
        '125000',
        'الرياض',
        'متاح للبيع',
        'وكالة',
        'ملكية شخصية',
        'سيارة بحالة ممتازة',
        'JTDKARFU1N0123456'
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'قالب المخزون');
    XLSX.writeFile(wb, 'قالب_استيراد_المخزون.xlsx');

    toast({
      title: "تم تحميل القالب",
      description: "يمكنك الآن ملء البيانات في القالب واستيراده",
    });
  };

  const resetDialog = () => {
    setFile(null);
    setPreviewData([]);
    setImportStats(null);
    setProgress(0);
    setIsProcessing(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetDialog();
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <FileSpreadsheet className="h-5 w-5" />
            استيراد المخزون من ملف Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Download template section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">تحميل القالب</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                قم بتحميل قالب Excel لمعرفة التنسيق المطلوب للبيانات
              </p>
              <Button onClick={downloadTemplate} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                تحميل قالب Excel
              </Button>
            </CardContent>
          </Card>

          <Separator />

          {/* File upload section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">اختيار الملف</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="excel-file">ملف Excel</Label>
                  <Input
                    id="excel-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="mt-1"
                  />
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <Label>جاري معالجة الملف...</Label>
                    <Progress value={progress} />
                  </div>
                )}

                {file && !isProcessing && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    تم اختيار الملف: {file.name}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preview section */}
          {previewData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">معاينة البيانات (أول 5 صفوف)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border p-2">الشركة المصنعة</th>
                        <th className="border p-2">الفئة</th>
                        <th className="border p-2">مستوى التجهيز</th>
                        <th className="border p-2">السنة</th>
                        <th className="border p-2">السعر</th>
                        <th className="border p-2">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((item, index) => (
                        <tr key={index}>
                          <td className="border p-2">{item.manufacturer}</td>
                          <td className="border p-2">{item.category}</td>
                          <td className="border p-2">{item.trimLevel}</td>
                          <td className="border p-2">{item.year}</td>
                          <td className="border p-2">{item.price?.toLocaleString()}</td>
                          <td className="border p-2">{item.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import results */}
          {importStats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">نتائج الاستيراد</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{importStats.total}</div>
                    <div className="text-muted-foreground">إجمالي الصفوف</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{importStats.success}</div>
                    <div className="text-muted-foreground">تم بنجاح</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{importStats.failed}</div>
                    <div className="text-muted-foreground">فشل</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{importStats.duplicates}</div>
                    <div className="text-muted-foreground">مكرر</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            {previewData.length > 0 && !importStats && (
              <Button 
                onClick={handleImport} 
                disabled={importMutation.isPending}
                className="min-w-[120px]"
              >
                {importMutation.isPending ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    جاري الاستيراد...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    استيراد البيانات
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}