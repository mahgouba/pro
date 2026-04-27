import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import type { Product } from "@shared/schema";

const formSchema = z.object({
  productId: z.string().min(1, "يجب اختيار منتج"),
  quantity: z.string().min(1, "الكمية مطلوبة"),
  reason: z.string().min(1, "السبب مطلوب"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface StockAdjustmentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StockAdjustmentForm({ onSuccess, onCancel }: StockAdjustmentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: "",
      quantity: "",
      reason: "",
      notes: "",
    },
  });

  const adjustStockMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        productId: parseInt(data.productId),
        quantity: parseInt(data.quantity),
        reason: data.reason,
        notes: data.notes,
      };
      
      await apiRequest("POST", "/api/stock/adjust", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "تم تعديل المخزون",
        description: "تم تعديل المخزون بنجاح",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تعديل المخزون",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    adjustStockMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>المنتج *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المنتج" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} - مخزون حالي: {product.currentStock}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الكمية *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="أدخل الكمية (+ للإضافة، - للخصم)" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>السبب *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر السبب" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="purchase">شراء</SelectItem>
                    <SelectItem value="sale">مبيعات</SelectItem>
                    <SelectItem value="return">مرتجعات</SelectItem>
                    <SelectItem value="damaged">تالف</SelectItem>
                    <SelectItem value="adjustment">تعديل</SelectItem>
                    <SelectItem value="theft">سرقة</SelectItem>
                    <SelectItem value="expired">منتهي الصلاحية</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ملاحظات</FormLabel>
              <FormControl>
                <Textarea placeholder="ملاحظات إضافية (اختيارية)" rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end space-x-3 space-x-reverse pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
          <Button 
            type="submit" 
            disabled={adjustStockMutation.isPending}
          >
            {adjustStockMutation.isPending ? "جاري التعديل..." : "تعديل المخزون"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
