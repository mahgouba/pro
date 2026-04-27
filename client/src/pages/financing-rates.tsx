import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFinancingRateSchema, type FinancingRate } from "@shared/schema";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Percent, 
  X, 
  Upload, 
  Building2,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Bank } from "@shared/schema";

interface BankRate {
  rateName: string;
  rateValue: number;
}

export default function FinancingRatesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<FinancingRate | null>(null);
  const [bankLogo, setBankLogo] = useState<string>("");
  const [ratesList, setRatesList] = useState<BankRate[]>([{ rateName: "", rateValue: 0 }]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: companyBanks = [] } = useQuery<Bank[]>({
    queryKey: ["/api/banks/type/شركة"],
  });

  const form = useForm({
    resolver: zodResolver(insertFinancingRateSchema),
    defaultValues: {
      bankName: "",
      bankNameEn: "N/A", // Default for removed field
      financingType: "personal", // Default for removed field
      minPeriod: 12, // Default for removed field
      maxPeriod: 60, // Default for removed field
      minAmount: 1, // Default for removed field
      maxAmount: 10000000, // Default for removed field
      features: [] as string[],
      requirements: [] as string[],
      isActive: true,
      rates: [{ rateName: "", rateValue: 0 }]
    }
  });

  // Sync ratesList with form values whenever ratesList changes
  useEffect(() => {
    form.setValue("rates", ratesList as any, { shouldValidate: true });
  }, [ratesList, form]);

  const { data: rates = [], isLoading } = useQuery<FinancingRate[]>({
    queryKey: ["/api/financing-rates"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/financing-rates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financing-rates"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "تمت العملية بنجاح",
        description: "تم إضافة البنك الجديد بنجاح",
      });
    },
    onError: (error: any) => {
      console.error("Save error:", error);
      toast({
        title: "خطأ في الحفظ",
        description: error.message || "حدث خطأ أثناء حفظ البيانات. تأكد من ملء جميع الحقول المطلوبة.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/financing-rates/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financing-rates"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "تمت العملية بنجاح",
        description: "تم تحديث بيانات البنك بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "حدث خطأ أثناء تحديث البيانات",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/financing-rates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financing-rates"] });
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف بيانات البنك بنجاح"
      });
    }
  });

  const resetForm = () => {
    setEditingRate(null);
    setBankLogo("");
    setRatesList([{ rateName: "", rateValue: 0 }]);
    form.reset({
      bankName: "",
      bankNameEn: "N/A",
      financingType: "personal",
      minPeriod: 12,
      maxPeriod: 60,
      minAmount: 1,
      maxAmount: 10000000,
      features: [],
      requirements: [],
      isActive: true,
      rates: [{ rateName: "", rateValue: 0 }]
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBankLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addRateRow = () => {
    setRatesList([...ratesList, { rateName: "", rateValue: 0 }]);
  };

  const removeRateRow = (index: number) => {
    if (ratesList.length > 1) {
      const newList = [...ratesList];
      newList.splice(index, 1);
      setRatesList(newList);
    }
  };

  const updateRateRow = (index: number, field: keyof BankRate, value: any) => {
    const newList = [...ratesList];
    newList[index] = { ...newList[index], [field]: value };
    setRatesList(newList);
  };

  const onSubmit = (values: any) => {
    const data = {
      ...values,
      bankLogo,
      // Ensure rates are correctly formatted and cleaned
      rates: ratesList.filter(r => r.rateName.trim() !== "").map(r => ({
        ...r,
        rateValue: Number(r.rateValue),
        financingType: "installments" // Default for removed field
      }))
    };

    if (data.rates.length === 0) {
      toast({
        title: "خطأ في البيانات",
        description: "يجب إضافة نسبة واحدة على الأقل",
        variant: "destructive",
      });
      return;
    }

    if (editingRate) {
      updateMutation.mutate({ id: editingRate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (rate: FinancingRate) => {
    setEditingRate(rate);
    setBankLogo(rate.bankLogo || "");
    const initialRates = Array.isArray(rate.rates) ? (rate.rates as any[]) : [];
    const formattedRates = initialRates.length > 0 ? initialRates.map(r => ({
      rateName: r.rateName,
      rateValue: r.rateValue
    })) : [{ rateName: "", rateValue: 0 }];
    setRatesList(formattedRates);
    
    form.reset({
      bankName: rate.bankName,
      bankNameEn: rate.bankNameEn || "N/A",
      financingType: (rate.financingType as any) || "personal",
      minPeriod: Number(rate.minPeriod),
      maxPeriod: Number(rate.maxPeriod),
      minAmount: Number(rate.minAmount),
      maxAmount: Number(rate.maxAmount),
      features: (Array.isArray(rate.features) ? rate.features : []) as string[],
      requirements: (Array.isArray(rate.requirements) ? rate.requirements : []) as string[],
      isActive: rate.isActive,
      rates: formattedRates as any
    });
    setIsDialogOpen(true);
  };

  const handleBankSelect = (bankName: string) => {
    const selectedBank = companyBanks.find(b => b.bankName === bankName);
    if (selectedBank) {
      form.setValue("bankName", selectedBank.bankName);
      form.setValue("bankNameEn", selectedBank.nameEn || "N/A");
      setBankLogo(selectedBank.logo || "");
    }
  };

  return (
    <div className="min-h-screen p-6" dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/20">
            <Percent className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">إدارة نسب التمويل (APR)</h1>
            <p className="text-white/60">إدارة معدلات النسبة السنوية (APR) وخيارات التمويل للبنوك</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-11 px-6 shadow-lg shadow-blue-600/20">
              <Plus className="h-5 w-5" />
              إضافة بنك جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl glass-container border-white/20 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-bold mb-4">
                {editingRate ? "تعديل بيانات البنك" : "إضافة بنك جديد"}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  {/* Bank Name Select */}
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">اختر البنك</FormLabel>
                        <Select 
                          onValueChange={(val) => {
                            field.onChange(val);
                            handleBankSelect(val);
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white h-11">
                              <SelectValue placeholder="اختر بنكاً من القائمة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-900 border-white/10 text-white">
                            {companyBanks.map((bank) => (
                              <SelectItem key={bank.id} value={bank.bankName}>
                                <div className="flex items-center gap-2">
                                  {bank.logo && <img src={bank.logo} className="w-6 h-6 object-contain" alt="" />}
                                  {bank.bankName}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Logo Preview (read-only mostly now) */}
                  <div>
                    <FormLabel className="text-white/80 mb-2 block">شعار البنك</FormLabel>
                    <div className="flex items-center gap-4">
                      <div className="relative group">
                        <div className="w-16 h-16 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                          {bankLogo ? (
                            <img src={bankLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                          ) : (
                            <Building2 className="h-8 w-8 text-white/20" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-white/40 italic">يتم جلب الشعار تلقائياً من بيانات البنوك</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <Label className="text-white/90 font-bold text-lg">معدلات APR والشرائح</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addRateRow}
                      className="bg-blue-600/10 border-blue-600/20 text-blue-400 hover:bg-blue-600/20"
                    >
                      <Plus className="h-4 w-4 ml-1" />
                      إضافة نسبة جديدة
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {ratesList.map((rate, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-white/5 rounded-xl border border-white/10 relative group">
                        <div className="md:col-span-7">
                          <Label className="text-white/60 text-xs mb-1 block">اسم الفئة (مثال: موظف قطاع عام)</Label>
                          <Input
                            value={rate.rateName}
                            onChange={(e) => updateRateRow(index, "rateName", e.target.value)}
                            placeholder="اسم الفئة"
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                        <div className="md:col-span-4">
                          <Label className="text-white/60 text-xs mb-1 block">النسبة (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={rate.rateValue}
                            onChange={(e) => updateRateRow(index, "rateValue", parseFloat(e.target.value))}
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                        <div className="md:col-span-1 flex items-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRateRow(index)}
                            disabled={ratesList.length === 1}
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsDialogOpen(false)}
                    className="text-white/60 hover:text-white"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                  >
                    {editingRate ? "تحديث البيانات" : "حفظ البنك"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rates.map((rate) => (
            <Card key={rate.id} className="glass-container border-white/10 overflow-hidden group hover:border-blue-500/30 transition-all">
              <CardHeader className="p-4 flex flex-row items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-white p-1.5 flex items-center justify-center">
                    {rate.bankLogo ? (
                      <img src={rate.bankLogo} alt={rate.bankName} className="w-full h-full object-contain p-1" />
                    ) : (
                      <Building2 className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-white text-base">{rate.bankName}</CardTitle>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(rate)}
                    className="h-8 w-8 text-blue-400 hover:bg-blue-400/10"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("هل أنت متأكد من الحذف؟")) {
                        deleteMutation.mutate(rate.id);
                      }
                    }}
                    className="h-8 w-8 text-red-400 hover:bg-red-400/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] text-white/40 uppercase tracking-wider">النسب والشرائح</Label>
                  <div className="space-y-1.5">
                    {Array.isArray(rate.rates) && (rate.rates as any[]).map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                        <div className="flex flex-col">
                          <span className="text-white/90 text-sm font-medium">{r.rateName}</span>
                        </div>
                        <span className="text-blue-400 font-bold">{r.rateValue}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
