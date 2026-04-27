import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Package, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Product, DashboardMetrics } from "@shared/schema";

export default function Reports() {
  const { toast } = useToast();

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: metrics } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const handleExportInventory = async () => {
    try {
      const response = await fetch("/api/reports/inventory");
      const data = await response.json();
      
      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: "application/json" 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inventory-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "تم تصدير التقرير",
        description: "تم تصدير تقرير المخزون بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير التقرير",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = () => {
    if (!products) return;

    const headers = ["اسم المنتج", "رمز المنتج", "الفئة", "السعر", "المخزون الحالي", "الحد الأدنى", "الحالة"];
    const rows = products.map(product => [
      product.name,
      product.sku,
      product.category || "غير محدد",
      product.price,
      product.currentStock,
      product.minThreshold,
      product.currentStock <= product.minThreshold ? "مخزون منخفض" : "متوفر"
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "تم تصدير البيانات",
      description: "تم تصدير بيانات المنتجات بصيغة CSV",
    });
  };

  const lowStockProducts = products?.filter(p => p.currentStock <= p.minThreshold) || [];
  const outOfStockProducts = products?.filter(p => p.currentStock === 0) || [];

  return (
    <>
      <Header title="التقارير" />
      
      <div className="p-6 h-full overflow-y-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">إجمالي المنتجات</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {products?.length || 0}
                  </p>
                </div>
                <Package className="w-12 h-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">مخزون منخفض</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {lowStockProducts.length}
                  </p>
                </div>
                <TrendingDown className="w-12 h-12 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">نفد المخزون</p>
                  <p className="text-3xl font-bold text-red-600">
                    {outOfStockProducts.length}
                  </p>
                </div>
                <Package className="w-12 h-12 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <FileText className="w-5 h-5" />
              <span>تصدير التقارير</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 space-x-reverse">
              <Button onClick={handleExportInventory} className="space-x-2 space-x-reverse">
                <Download className="w-4 h-4" />
                <span>تصدير تقرير شامل (JSON)</span>
              </Button>
              
              <Button variant="outline" onClick={handleExportCSV} className="space-x-2 space-x-reverse">
                <Download className="w-4 h-4" />
                <span>تصدير المنتجات (CSV)</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Report */}
        <Card>
          <CardHeader>
            <CardTitle>تقرير المخزون المنخفض</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">جميع المنتجات في حالة جيدة</p>
                <p className="text-sm text-gray-400">لا توجد منتجات بمخزون منخفض</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المنتج</TableHead>
                    <TableHead className="text-right">رمز المنتج</TableHead>
                    <TableHead className="text-right">المخزون الحالي</TableHead>
                    <TableHead className="text-right">الحد الأدنى</TableHead>
                    <TableHead className="text-right">النقص</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((product) => {
                    const shortage = Math.max(0, product.minThreshold - product.currentStock);
                    const isOutOfStock = product.currentStock === 0;
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                        <TableCell>{product.currentStock}</TableCell>
                        <TableCell>{product.minThreshold}</TableCell>
                        <TableCell>{shortage}</TableCell>
                        <TableCell>
                          <Badge variant={isOutOfStock ? "destructive" : "secondary"}>
                            {isOutOfStock ? "نفد المخزون" : "مخزون منخفض"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
