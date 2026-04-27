import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import StockAdjustmentForm from "@/components/stock/stock-adjustment-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowUp, ArrowDown, Plus } from "lucide-react";
import type { StockMovement } from "@shared/schema";

export default function StockMovements() {
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  const { data: movements, isLoading } = useQuery<(StockMovement & { productName: string })[]>({
    queryKey: ["/api/dashboard/recent-movements", { limit: 50 }],
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMovementTypeLabel = (type: string, reason: string) => {
    if (type === 'in') {
      switch (reason) {
        case 'purchase': return 'شراء';
        case 'return': return 'مرتجعات';
        case 'adjustment': return 'تعديل';
        default: return 'إضافة';
      }
    } else {
      switch (reason) {
        case 'sale': return 'مبيعات';
        case 'damaged': return 'تالف';
        case 'adjustment': return 'تعديل';
        default: return 'خروج';
      }
    }
  };

  return (
    <>
      <Header title="حركة المخزون" />
      
      <div className="p-6 h-full overflow-y-auto">
        <div className="mb-6">
          <Button 
            onClick={() => setIsAdjustmentModalOpen(true)}
            className="space-x-2 space-x-reverse"
          >
            <Plus className="w-4 h-4" />
            <span>تعديل مخزون</span>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>سجل حركات المخزون</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : !movements || movements.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">لا توجد حركات مخزون</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">المنتج</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">الكمية</TableHead>
                    <TableHead className="text-right">السبب</TableHead>
                    <TableHead className="text-right">ملاحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>{formatDate(movement.createdAt)}</TableCell>
                      <TableCell className="font-medium">{movement.productName}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {movement.type === 'in' ? (
                            <ArrowUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <ArrowDown className="w-4 h-4 text-red-600" />
                          )}
                          <Badge variant={movement.type === 'in' ? 'default' : 'secondary'}>
                            {movement.type === 'in' ? 'دخول' : 'خروج'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={movement.type === 'in' ? 'text-green-600' : 'text-red-600'}>
                          {movement.type === 'in' ? '+' : '-'}{movement.quantity}
                        </span>
                      </TableCell>
                      <TableCell>{getMovementTypeLabel(movement.type, movement.reason)}</TableCell>
                      <TableCell>{movement.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAdjustmentModalOpen} onOpenChange={setIsAdjustmentModalOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل المخزون</DialogTitle>
          </DialogHeader>
          <StockAdjustmentForm 
            onSuccess={() => setIsAdjustmentModalOpen(false)}
            onCancel={() => setIsAdjustmentModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
