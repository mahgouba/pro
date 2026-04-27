import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileSpreadsheet, 
  Search, 
  Calendar, 
  User, 
  Car, 
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  ArrowRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface SavedCalculation {
  id: number;
  customerName: string;
  customerPhone: string;
  vehicleManufacturer: string;
  vehicleCategory: string;
  vehiclePrice: string;
  monthlyPayment: string;
  bankName: string;
  createdAt: string;
  financingYears: number;
  interestRate: string;
  totalInterest: string;
  totalAmount: string;
  downPayment: string;
  finalPayment: string;
}

const EXCEL_COLUMNS = [
  { id: "createdAt", label: "التاريخ" },
  { id: "customerName", label: "اسم العميل" },
  { id: "customerPhone", label: "رقم الجوال" },
  { id: "vehicleManufacturer", label: "الشركة المصنعة" },
  { id: "vehicleCategory", label: "الفئة" },
  { id: "vehiclePrice", label: "سعر السيارة" },
  { id: "bankName", label: "البنك" },
  { id: "interestRate", label: "نسبة الربح" },
  { id: "financingYears", label: "مدة التمويل" },
  { id: "monthlyPayment", label: "القسط الشهري" },
  { id: "totalInterest", label: "إجمالي الربح" },
  { id: "totalAmount", label: "إجمالي المبلغ" },
  { id: "downPayment", label: "الدفعة الأولى" },
  { id: "finalPayment", label: "الدفعة الأخيرة" },
];

export default function FinancingCalculationsHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    EXCEL_COLUMNS.map(col => col.id)
  );

  const { data: calculations, isLoading } = useQuery<SavedCalculation[]>({
    queryKey: ["/api/financing-calculations"],
  });

  const filteredCalculations = calculations?.filter(calc => 
    calc.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    calc.customerPhone?.includes(searchTerm) ||
    calc.bankName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    calc.vehicleManufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportExcel = () => {
    if (!filteredCalculations) return;

    const exportData = filteredCalculations.map(calc => {
      const row: any = {};
      selectedColumns.forEach(colId => {
        const column = EXCEL_COLUMNS.find(c => c.id === colId);
        if (column) {
          let value = (calc as any)[colId];
          if (colId === 'createdAt') {
            value = format(new Date(value), 'yyyy-MM-dd HH:mm');
          }
          row[column.label] = value;
        }
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "سجل الحسابات");
    XLSX.writeFile(wb, `سجل_حسابات_التمويل_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    setShowExportDialog(false);
  };

  const toggleColumn = (columnId: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnId) 
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-400" />
            سجل حسابات التمويل
          </h1>
          <p className="text-white/60 mt-1">عرض وتصدير كافة عمليات حساب التمويل المحفوظة تلقائياً</p>
        </div>
        <div className="flex gap-3">
          <Link href="/financing-calculator">
            <Button variant="outline" className="bg-white/10 hover:bg-white/20 text-white gap-2">
              <ArrowRight className="h-4 w-4" />
              العودة للحاسبة
            </Button>
          </Link>
          <Button 
            onClick={() => setShowExportDialog(true)}
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            تصدير إلى Excel
          </Button>
        </div>
      </div>

      <Card className="bg-white/10 border-white/20 backdrop-blur-md">
        <CardHeader className="pb-3 border-b border-white/10">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input 
              placeholder="البحث باسم العميل، رقم الجوال، أو البنك..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 bg-white/5 border-white/20 text-white placeholder:text-white/30"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-transparent border-white/10">
                  <TableHead className="text-right text-white font-bold">التاريخ</TableHead>
                  <TableHead className="text-right text-white font-bold">العميل</TableHead>
                  <TableHead className="text-right text-white font-bold">السيارة</TableHead>
                  <TableHead className="text-right text-white font-bold">البنك</TableHead>
                  <TableHead className="text-right text-white font-bold">السعر</TableHead>
                  <TableHead className="text-right text-white font-bold">القسط</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-white/50">جاري التحميل...</TableCell>
                  </TableRow>
                ) : filteredCalculations?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-white/50">لا توجد سجلات مطابقة</TableCell>
                  </TableRow>
                ) : (
                  filteredCalculations?.map((calc) => (
                    <TableRow key={calc.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="text-white/80 text-xs">
                        {format(new Date(calc.createdAt), 'dd MMM yyyy HH:mm', { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-white font-medium">{calc.customerName || "غير محدد"}</span>
                          <span className="text-white/40 text-[10px]">{calc.customerPhone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-white font-medium">{calc.vehicleManufacturer}</span>
                          <span className="text-white/40 text-[10px]">{calc.vehicleCategory}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-blue-400 font-bold">{calc.bankName}</TableCell>
                      <TableCell className="text-white font-mono">{Number(calc.vehiclePrice).toLocaleString()} ريال</TableCell>
                      <TableCell className="text-green-400 font-bold font-mono">{Number(calc.monthlyPayment).toLocaleString()} ريال</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="bg-slate-900 text-white border-white/20 max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Filter className="h-5 w-5 text-green-400" />
              تخصيص تصدير ملف Excel
            </DialogTitle>
            <DialogDescription className="text-white/60">
              اختر الأعمدة التي تريد تضمينها في ملف Excel المصدّر
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            {EXCEL_COLUMNS.map((col) => (
              <div key={col.id} className="flex items-center space-x-2 space-x-reverse bg-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors">
                <Checkbox 
                  id={`col-${col.id}`} 
                  checked={selectedColumns.includes(col.id)}
                  onCheckedChange={() => toggleColumn(col.id)}
                  className="border-white/30 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                />
                <Label 
                  htmlFor={`col-${col.id}`}
                  className="text-sm cursor-pointer flex-1"
                >
                  {col.label}
                </Label>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowExportDialog(false)}
              className="bg-transparent border-white/20 text-white hover:bg-white/5"
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleExportExcel}
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              تنزيل الملف الآن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
