import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { StockMovement } from "@shared/schema";

export default function RecentActivities() {
  const { data: movements, isLoading } = useQuery<(StockMovement & { productName: string })[]>({
    queryKey: ["/api/dashboard/recent-movements"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>آخر حركات المخزون</CardTitle>
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

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return days === 1 ? "أمس" : `منذ ${days} أيام`;
    }
    if (hours > 0) {
      return hours === 1 ? "منذ ساعة" : `منذ ${hours} ساعات`;
    }
    return "منذ قليل";
  };

  const getMovementTypeLabel = (type: string, reason: string) => {
    if (type === 'in') {
      switch (reason) {
        case 'purchase': return 'إضافة مخزون';
        case 'return': return 'مرتجعات';
        case 'adjustment': return 'تعديل مخزون';
        default: return 'إضافة مخزون';
      }
    } else {
      switch (reason) {
        case 'sale': return 'مبيعات';
        case 'damaged': return 'تالف';
        case 'adjustment': return 'تعديل مخزون';
        default: return 'مبيعات';
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">
          آخر حركات المخزون
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!movements || movements.length === 0 ? (
          <p className="text-gray-500 text-center py-8">لا توجد حركات مخزون حديثة</p>
        ) : (
          <div className="space-y-4">
            {movements.map((movement) => (
              <div 
                key={movement.id} 
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className={`p-2 rounded-lg ${
                    movement.type === 'in' 
                      ? 'bg-green-50' 
                      : 'bg-red-50'
                  }`}>
                    {movement.type === 'in' ? (
                      <ArrowUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{movement.productName}</p>
                    <p className="text-sm text-gray-600">
                      {getMovementTypeLabel(movement.type, movement.reason)}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">
                    {movement.type === 'in' ? '+' : '-'}{movement.quantity}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatTimeAgo(movement.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
