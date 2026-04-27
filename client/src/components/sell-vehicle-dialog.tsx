import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const sellVehicleSchema = z.object({
  customerName: z.string().min(1, "اسم العميل مطلوب"),
  customerPhone: z.string().min(1, "رقم الهاتف مطلوب"),
  salesRepresentative: z.string().min(1, "مندوب المبيعات مطلوب"),
  salePrice: z.string().min(1, "سعر البيع مطلوب"),
  paymentMethod: z.enum(["نقداً", "بنك"], {
    required_error: "طريقة الدفع مطلوبة",
  }),
  bankName: z.string().optional(),
});

type SellVehicleForm = z.infer<typeof sellVehicleSchema>;

interface SellVehicleDialogProps {
  vehicleId: number;
  vehicleInfo: string;
  onSuccess?: () => void;
}

const banks = [
  "الأهلي السعودي",
  "الراجحي", 
  "سامبا",
  "البنك السعودي للاستثمار",
  "البنك السعودي الفرنسي",
  "بنك الرياض",
  "البنك الأول",
  "بنك الجزيرة",
  "البنك العربي الوطني",
  "بنك ساب",
  "بنك البلاد",
  "الإنماء"
];

export function SellVehicleDialog({ vehicleId, vehicleInfo, onSuccess }: SellVehicleDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SellVehicleForm>({
    resolver: zodResolver(sellVehicleSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      salesRepresentative: "",
      salePrice: "",
      paymentMethod: "نقداً",
      bankName: "",
    },
  });

  const paymentMethod = form.watch("paymentMethod");

  const sellMutation = useMutation({
    mutationFn: async (data: SellVehicleForm) => {
      return apiRequest("PUT", `/api/inventory/${vehicleId}/sell`, {
        ...data,
        bankName: data.paymentMethod === "بنك" ? data.bankName : null,
      });
    },
    onSuccess: () => {
      toast({
        title: "تم البيع بنجاح",
        description: "تم بيع السيارة وحفظ بيانات العميل",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/reserved"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/sold"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/manufacturer-stats"] });
      setOpen(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "فشل في البيع",
        description: error.message || "حدث خطأ أثناء بيع السيارة",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SellVehicleForm) => {
    if (data.paymentMethod === "بنك" && !data.bankName) {
      form.setError("bankName", {
        type: "manual",
        message: "اختيار البنك مطلوب عند الدفع بالبنك",
      });
      return;
    }
    sellMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          بيع
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">بيع السيارة</DialogTitle>
          <p className="text-sm text-gray-600 text-right">{vehicleInfo}</p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right block">اسم العميل</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="أدخل اسم العميل" className="text-right" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right block">رقم الهاتف</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="أدخل رقم الهاتف" className="text-right" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="salesRepresentative"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right block">مندوب المبيعات</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="أدخل اسم مندوب المبيعات" className="text-right" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="salePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right block">سعر البيع (ريال سعودي)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" placeholder="أدخل سعر البيع" className="text-right" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-right block">طريقة الدفع</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <RadioGroupItem value="نقداً" id="cash" />
                        <Label htmlFor="cash">نقداً</Label>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <RadioGroupItem value="بنك" id="bank" />
                        <Label htmlFor="bank">بنك</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {paymentMethod === "بنك" && (
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right block">اسم البنك</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="اختر البنك" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {banks.map((bank) => (
                          <SelectItem key={bank} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={sellMutation.isPending}
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={sellMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {sellMutation.isPending ? "جاري البيع..." : "تأكيد البيع"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}