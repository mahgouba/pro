import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Car, CreditCard, Phone, Search, User, MapPin, Printer, FileSpreadsheet } from "lucide-react";
import { ManufacturerLogo } from "@/components/manufacturer-logo";
import SystemGlassWrapper from "@/components/system-glass-wrapper";
import * as XLSX from 'xlsx';

export default function SoldVehiclesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [salesRepFilter, setSalesRepFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");

  const { data: soldVehicles = [], isLoading } = useQuery({
    queryKey: ["/api/inventory/sold"],
  });

  // Get unique sales representatives for filter
  const salesRepresentatives = useMemo(() => {
    const reps = new Set(
      (soldVehicles as any[])
        .map(item => item.soldBySalesRep)
        .filter(Boolean)
    );
    return Array.from(reps);
  }, [soldVehicles]);

  // Filter sold vehicles based on search query and filters
  const filteredVehicles = useMemo(() => {
    let filtered = soldVehicles as any[];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item: any) =>
        item.soldToCustomerName?.toLowerCase().includes(query) ||
        item.soldToCustomerPhone?.toLowerCase().includes(query) ||
        item.manufacturer?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.chassisNumber?.toLowerCase().includes(query) ||
        item.soldBySalesRep?.toLowerCase().includes(query)
      );
    }

    if (salesRepFilter && salesRepFilter !== "all") {
      filtered = filtered.filter((item: any) => item.soldBySalesRep === salesRepFilter);
    }

    if (paymentMethodFilter && paymentMethodFilter !== "all") {
      filtered = filtered.filter((item: any) => item.paymentMethod === paymentMethodFilter);
    }

    // Filter by date range
    if (fromDate || toDate) {
      filtered = filtered.filter((item: any) => {
        if (!item.soldDate) return false;
        const itemDate = new Date(item.soldDate);
        
        // Check if date is within range
        if (fromDate && toDate) {
          const from = new Date(fromDate);
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999); // Include the entire "to" date
          return itemDate >= from && itemDate <= to;
        } else if (fromDate) {
          const from = new Date(fromDate);
          return itemDate >= from;
        } else if (toDate) {
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999); // Include the entire "to" date
          return itemDate <= to;
        }
        
        return true;
      });
    }

    return filtered;
  }, [soldVehicles, searchQuery, salesRepFilter, paymentMethodFilter, fromDate, toDate]);

  const formatCurrency = (amount: string | null | undefined) => {
    if (!amount) return "غير محدد";
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(parseFloat(amount));
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "غير محدد";
    return new Date(date).toLocaleDateString('en-GB');
  };

  const exportToExcel = () => {
    const exportData = filteredVehicles.map((item: any) => ({
      'رقم الهيكل': item.chassisNumber,
      'الصانع': item.manufacturer,
      'الفئة': item.category,
      'درجة التجهيز': item.trimLevel || 'غير محدد',
      'سعة المحرك': item.engineCapacity,
      'السنة': item.year,
      'اللون الخارجي': item.exteriorColor,
      'اللون الداخلي': item.interiorColor,
      'الموقع': item.location,
      'نوع الاستيراد': item.importType,
      'اسم العميل': item.soldToCustomerName || 'غير محدد',
      'رقم جوال العميل': item.soldToCustomerPhone || 'غير محدد',
      'مندوب المبيعات': item.soldBySalesRep || 'غير محدد',
      'سعر البيع': item.salePrice ? parseFloat(item.salePrice) : 'غير محدد',
      'طريقة الدفع': item.paymentMethod || 'غير محدد',
      'البنك': item.bankName || 'غير محدد',
      'تاريخ البيع': formatDate(item.soldDate),
      'الملاحظات': item.notes || 'لا يوجد'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'السيارات المباعة');
    
    // Set column widths
    const colWidths = [
      { wch: 20 }, // رقم الهيكل
      { wch: 15 }, // الصانع
      { wch: 15 }, // الفئة
      { wch: 15 }, // درجة التجهيز
      { wch: 12 }, // سعة المحرك
      { wch: 8 },  // السنة
      { wch: 12 }, // اللون الخارجي
      { wch: 12 }, // اللون الداخلي
      { wch: 15 }, // الموقع
      { wch: 12 }, // نوع الاستيراد
      { wch: 20 }, // اسم العميل
      { wch: 15 }, // رقم جوال العميل
      { wch: 15 }, // مندوب المبيعات
      { wch: 12 }, // سعر البيع
      { wch: 10 }, // طريقة الدفع
      { wch: 15 }, // البنك
      { wch: 12 }, // تاريخ البيع
      { wch: 20 }  // الملاحظات
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `السيارات_المباعة_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`);
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تقرير السيارات المباعة</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; direction: rtl; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #00627F; padding-bottom: 20px; }
          .header h1 { color: #00627F; margin: 0; font-size: 24px; }
          .header p { color: #666; margin: 5px 0; }
          .filters { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .filters h3 { margin: 0 0 10px 0; color: #00627F; }
          .filter-item { display: inline-block; margin-left: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 11px; }
          th { background-color: #00627F; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .summary { margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
          .summary h3 { color: #00627F; margin: 0 0 15px 0; }
          .stat-item { display: inline-block; margin-left: 30px; }
          @media print {
            body { margin: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تقرير السيارات المباعة</h1>
          <p>تاريخ التقرير: ${new Date().toLocaleDateString('en-GB')}</p>
          <p>إجمالي السيارات المباعة: ${filteredVehicles.length}</p>
        </div>

        ${salesRepFilter || paymentMethodFilter || fromDate || toDate ? `
        <div class="filters">
          <h3>الفلاتر المطبقة:</h3>
          ${salesRepFilter ? `<span class="filter-item"><strong>مندوب المبيعات:</strong> ${salesRepFilter}</span>` : ''}
          ${paymentMethodFilter ? `<span class="filter-item"><strong>طريقة الدفع:</strong> ${paymentMethodFilter}</span>` : ''}
          ${fromDate ? `<span class="filter-item"><strong>من تاريخ:</strong> ${new Date(fromDate).toLocaleDateString('en-GB')}</span>` : ''}
          ${toDate ? `<span class="filter-item"><strong>إلى تاريخ:</strong> ${new Date(toDate).toLocaleDateString('en-GB')}</span>` : ''}
        </div>
        ` : ''}

        <table>
          <thead>
            <tr>
              <th>رقم الهيكل</th>
              <th>الصانع</th>
              <th>الفئة</th>
              <th>السنة</th>
              <th>اسم العميل</th>
              <th>مندوب المبيعات</th>
              <th>سعر البيع</th>
              <th>طريقة الدفع</th>
              <th>البنك</th>
              <th>تاريخ البيع</th>
            </tr>
          </thead>
          <tbody>
            ${filteredVehicles.map((item: any) => `
              <tr>
                <td>${item.chassisNumber}</td>
                <td>${item.manufacturer}</td>
                <td>${item.category}</td>
                <td>${item.year}</td>
                <td>${item.soldToCustomerName || 'غير محدد'}</td>
                <td>${item.soldBySalesRep || 'غير محدد'}</td>
                <td>${formatCurrency(item.salePrice)}</td>
                <td>${item.paymentMethod || 'غير محدد'}</td>
                <td>${item.bankName || (item.paymentMethod === 'نقداً' ? 'نقداً' : 'غير محدد')}</td>
                <td>${formatDate(item.soldDate)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary">
          <h3>ملخص المبيعات:</h3>
          <div class="stat-item"><strong>إجمالي عدد السيارات:</strong> ${filteredVehicles.length}</div>
          <div class="stat-item"><strong>إجمالي قيمة المبيعات:</strong> ${formatCurrency(
            filteredVehicles.reduce((sum: number, item: any) => sum + (parseFloat(item.salePrice) || 0), 0).toString()
          )}</div>
          <div class="stat-item"><strong>المبيعات النقدية:</strong> ${filteredVehicles.filter((item: any) => item.paymentMethod === 'نقداً').length}</div>
          <div class="stat-item"><strong>المبيعات البنكية:</strong> ${filteredVehicles.filter((item: any) => item.paymentMethod === 'بنك').length}</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (isLoading) {
    return (
      <SystemGlassWrapper>
        <div className="container mx-auto p-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
            <p className="mt-2 text-white/70 drop-shadow-sm">جاري تحميل السيارات المباعة...</p>
          </div>
        </div>
      </SystemGlassWrapper>
    );
  }

  return (
    <SystemGlassWrapper>
      <div className="container mx-auto p-4" dir="rtl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white drop-shadow-lg mb-2">
            السيارات المباعة
          </h1>
          <p className="text-white/70 drop-shadow-sm">
            استعراض وإدارة السيارات المباعة مع تقارير المبيعات
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث في السيارات المباعة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 text-right"
              />
            </div>
            
            <Select value={salesRepFilter} onValueChange={setSalesRepFilter}>
              <SelectTrigger className="text-right">
                <SelectValue placeholder="فلتر حسب مندوب المبيعات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المندوبين</SelectItem>
                {salesRepresentatives.map((rep) => (
                  <SelectItem key={rep} value={rep}>
                    {rep}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger className="text-right">
                <SelectValue placeholder="فلتر حسب طريقة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع طرق الدفع</SelectItem>
                <SelectItem value="نقداً">نقداً</SelectItem>
                <SelectItem value="بنك">بنك</SelectItem>
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-white/70 mb-1">من تاريخ</label>
                <Input
                  type="date"
                  placeholder="من تاريخ"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="text-right text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-white/70 mb-1">إلى تاريخ</label>
                <Input
                  type="date"
                  placeholder="إلى تاريخ"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="text-right text-sm"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={printReport}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              طباعة التقرير
            </Button>
            <Button
              onClick={exportToExcel}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              تصدير إلى Excel
            </Button>
            <Button
              onClick={() => {
                setSearchQuery("");
                setSalesRepFilter("all");
                setPaymentMethodFilter("all");
                setFromDate("");
                setToDate("");
              }}
              variant="outline"
            >
              مسح الفلاتر
            </Button>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-container p-4 text-center">
              <div className="text-2xl font-bold text-blue-400 drop-shadow-lg">{filteredVehicles.length}</div>
              <div className="text-sm text-white/70 drop-shadow-sm">إجمالي السيارات المباعة</div>
            </div>
            <div className="glass-container p-4 text-center">
              <div className="text-2xl font-bold text-green-400 drop-shadow-lg">
                {formatCurrency(
                  filteredVehicles.reduce((sum: number, item: any) => sum + (parseFloat(item.salePrice) || 0), 0).toString()
                )}
              </div>
              <div className="text-sm text-white/70 drop-shadow-sm">إجمالي قيمة المبيعات</div>
            </div>
            <div className="glass-container p-4 text-center">
              <div className="text-2xl font-bold text-amber-400 drop-shadow-lg">
                {filteredVehicles.filter((item: any) => item.paymentMethod === 'نقداً').length}
              </div>
              <div className="text-sm text-white/70 drop-shadow-sm">المبيعات النقدية</div>
            </div>
            <div className="glass-container p-4 text-center">
              <div className="text-2xl font-bold text-purple-400 drop-shadow-lg">
                {filteredVehicles.filter((item: any) => item.paymentMethod === 'بنك').length}
              </div>
              <div className="text-sm text-white/70 drop-shadow-sm">المبيعات البنكية</div>
            </div>
          </div>
        </div>

        {/* Vehicles List */}
        {filteredVehicles.length === 0 ? (
          <div className="glass-container text-center py-8">
            <Car className="w-12 h-12 text-white/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white drop-shadow-lg mb-2">
              {searchQuery || salesRepFilter || paymentMethodFilter || fromDate || toDate ? "لا توجد نتائج للبحث" : "لا توجد سيارات مباعة"}
            </h3>
            <p className="text-white/70 drop-shadow-sm">
              {searchQuery || salesRepFilter || paymentMethodFilter || fromDate || toDate ? "جرب تعديل الفلاتر أو البحث" : "لم يتم بيع أي سيارات بعد"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((item: any) => (
              <div key={item.id} className="glass-container overflow-hidden">
                <div className="pb-3 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ManufacturerLogo manufacturerName={item.manufacturer} size="sm" />
                      <h3 className="text-lg font-semibold text-white drop-shadow-lg">{item.manufacturer}</h3>
                    </div>
                    <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
                      مباع
                    </Badge>
                  </div>
                  <div className="text-sm text-white/70 drop-shadow-sm mt-1">
                    {item.category} {item.trimLevel && `- ${item.trimLevel}`}
                  </div>
                </div>
                
                <div className="space-y-4 p-4">
                  {/* Vehicle Info */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Car className="w-3 h-3 text-white/60" />
                      <span className="text-white/70">السنة:</span>
                      <span className="text-white drop-shadow-sm">{item.year}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-white/70">الهيكل:</span>
                      <span className="font-mono text-white/90 drop-shadow-sm">{item.chassisNumber}</span>
                    </div>
                  </div>

                  {/* Sale Information */}
                  <div className="border-t border-white/10 pt-3">
                    <h4 className="font-semibold text-sm mb-2 text-white drop-shadow-sm">معلومات البيع</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-white/60" />
                        <span className="text-white drop-shadow-sm">{item.soldToCustomerName || 'غير محدد'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-white/60" />
                        <span dir="ltr" className="text-white drop-shadow-sm">{item.soldToCustomerPhone || 'غير محدد'}</span>
                      </div>
                      {item.soldBySalesRep && (
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-blue-400" />
                          <span className="text-blue-300 font-medium drop-shadow-sm">
                            مندوب: {item.soldBySalesRep}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3 h-3 text-green-400" />
                        <span className="text-green-400 font-bold drop-shadow-sm">
                          {formatCurrency(item.salePrice)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3 h-3 text-white/60" />
                        <span className="text-white drop-shadow-sm">{item.paymentMethod || 'غير محدد'}</span>
                        {item.bankName && (
                          <span className="text-white/70 drop-shadow-sm">- {item.bankName}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-white/60" />
                        <span className="text-white drop-shadow-sm">{formatDate(item.soldDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SystemGlassWrapper>
  );
}