import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { StockAlert } from "@shared/schema";

export default function LowStockAlerts() {
  const { data: alerts, isLoading } = useQuery<StockAlert[]>({
    queryKey: ["/api/dashboard/low-stock-alerts"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>تنبيهات المخزون المنخفض</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAlertColor = (currentStock: number, minThreshold: number) => {
    const ratio = currentStock / minThreshold;
    if (ratio <= 0.3) return { bg: 'bg-red-50', text: 'text-red-600', icon: 'text-red-500' };
    if (ratio <= 0.7) return { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'text-orange-500' };
    return { bg: 'bg-yellow-50', text: 'text-yellow-600', icon: 'text-yellow-500' };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">
          تنبيهات المخزون المنخفض
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!alerts || alerts.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد تنبيهات مخزون منخفض</p>
            <p className="text-sm text-gray-400">جميع المنتجات في حالة جيدة</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => {
              const colors = getAlertColor(alert.currentStock, alert.minThreshold);
              return (
                <div 
                  key={alert.product.id} 
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className={`${colors.bg} p-2 rounded-lg`}>
                      <AlertTriangle className={`w-4 h-4 ${colors.icon}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{alert.product.name}</p>
                      <p className="text-sm text-gray-600">SKU: {alert.product.sku}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className={`font-semibold ${colors.text}`}>
                      {alert.currentStock} قطعة
                    </p>
                    <p className="text-sm text-gray-600">
                      الحد الأدنى: {alert.minThreshold}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
