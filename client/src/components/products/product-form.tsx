import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { insertProductSchema } from "@shared/schema";
import type { Product } from "@shared/schema";
import { z } from "zod";

const formSchema = insertProductSchema.extend({
  price: z.string().min(1, "السعر مطلوب"),
  currentStock: z.string().min(1, "الكمية الأولية مطلوبة"),
  minThreshold: z.string().min(1, "الحد الأدنى للمخزون مطلوب"),
});

type FormData = z.infer<typeof formSchema>;

interface ProductFormProps {
  product?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name || "",
      sku: product?.sku || "",
      description: product?.description || "",
      price: product?.price || "",
      currentStock: product?.currentStock?.toString() || "",
      minThreshold: product?.minThreshold?.toString() || "10",
      category: product?.category || "",
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        price: data.price,
        currentStock: parseInt(data.currentStock),
        minThreshold: parseInt(data.minThreshold),
      };
      
      if (product) {
        await apiRequest("PUT", `/api/products/${product.id}`, payload);
      } else {
        await apiRequest("POST", "/api/products", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: product ? "تم تحديث المنتج" : "تم إضافة المنتج",
        description: product 
          ? "تم تحديث بيانات المنتج بنجاح" 
          : "تم إضافة المنتج الجديد إلى النظام",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حفظ المنتج",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createProductMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم المنتج *</FormLabel>
              <FormControl>
                <Input placeholder="أدخل اسم المنتج" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>رمز المنتج (SKU) *</FormLabel>
              <FormControl>
                <Input placeholder="مثال: LAP-DELL-001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الوصف</FormLabel>
              <FormControl>
                <Textarea placeholder="وصف المنتج" rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>السعر *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currentStock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الكمية الأولية *</FormLabel>
                <FormControl>
                  <Input type="number" min="0" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الفئة</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="electronics">إلكترونيات</SelectItem>
                    <SelectItem value="accessories">إكسسوارات</SelectItem>
                    <SelectItem value="peripherals">ملحقات</SelectItem>
                    <SelectItem value="software">برمجيات</SelectItem>
                    <SelectItem value="furniture">أثاث</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="minThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الحد الأدنى للمخزون</FormLabel>
                <FormControl>
                  <Input type="number" min="0" placeholder="10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-end space-x-3 space-x-reverse pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
          <Button 
            type="submit" 
            disabled={createProductMutation.isPending}
            className="space-x-2 space-x-reverse"
          >
            {createProductMutation.isPending ? "جاري الحفظ..." : (
              product ? "تحديث المنتج" : "إضافة المنتج"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
