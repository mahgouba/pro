import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Plus, Building2, User, Landmark, Eye, EyeOff } from "lucide-react";
import type { Bank, InsertBank } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const BANK_TYPES = ["شخصي", "شركة"] as const;

export default function BankManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState<InsertBank>({
    logo: "",
    bankName: "",
    nameEn: "",
    accountName: "",
    accountNumber: "",
    iban: "",
    type: "شركة",
    isActive: true
  });

  const { data: banks = [], isLoading } = useQuery({
    queryKey: ["/api/banks"],
    queryFn: async () => {
      const response = await fetch("/api/banks");
      if (!response.ok) throw new Error("Failed to fetch banks");
      return response.json() as Promise<Bank[]>;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertBank) => 
      apiRequest("POST", "/api/banks", data),
    onSuccess: () => {
      // Reset form and close dialog first
      setIsDialogOpen(false);
      resetForm();
      
      // Then invalidate queries and notify
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/banks"] });
        queryClient.invalidateQueries({ queryKey: ["/api/banks/type/شخصي"] });
        queryClient.invalidateQueries({ queryKey: ["/api/banks/type/شركة"] });
        
        // Trigger refresh for display pages
        window.dispatchEvent(new CustomEvent('bankDataChanged'));
        
        toast({
          title: "تم بنجاح",
          description: "تم إنشاء البنك بنجاح",
        });
      }, 100);
    },
    onError: () => {
      setTimeout(() => {
        toast({
          title: "خطأ",
          description: "فشل في إنشاء البنك",
          variant: "destructive"
        });
      }, 100);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertBank> }) =>
      apiRequest("PUT", `/api/banks/${id}`, data),
    onSuccess: () => {
      // Reset form and close dialog first
      setIsDialogOpen(false);
      setEditingBank(null);
      resetForm();
      
      // Then invalidate queries and notify
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/banks"] });
        queryClient.invalidateQueries({ queryKey: ["/api/banks/type/شخصي"] });
        queryClient.invalidateQueries({ queryKey: ["/api/banks/type/شركة"] });
        
        // Trigger refresh for display pages
        window.dispatchEvent(new CustomEvent('bankDataChanged'));
        
        toast({
          title: "تم بنجاح",
          description: "تم تحديث البنك بنجاح",
        });
      }, 100);
    },
    onError: () => {
      setTimeout(() => {
        toast({
          title: "خطأ",
          description: "فشل في تحديث البنك",
          variant: "destructive"
        });
      }, 100);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/banks/${id}`),
    onSuccess: () => {
      // Invalidate queries and notify after small delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/banks"] });
        queryClient.invalidateQueries({ queryKey: ["/api/banks/type/شخصي"] });
        queryClient.invalidateQueries({ queryKey: ["/api/banks/type/شركة"] });
        
        // Trigger refresh for display pages
        window.dispatchEvent(new CustomEvent('bankDataChanged'));
        
        toast({
          title: "تم بنجاح",
          description: "تم حذف البنك بنجاح",
        });
      }, 100);
    },
    onError: () => {
      setTimeout(() => {
        toast({
          title: "خطأ",
          description: "فشل في حذف البنك",
          variant: "destructive"
        });
      }, 100);
    }
  });

  // Mutation for toggling bank visibility
  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PUT", `/api/banks/${id}`, { isActive }),
    onSuccess: () => {
      // Invalidate all bank queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/banks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banks/type/شخصي"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banks/type/شركة"] });
      
      // Trigger refresh for display pages
      window.dispatchEvent(new CustomEvent('bankDataChanged'));
      
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة عرض البنك بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة عرض البنك",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      logo: "",
      bankName: "",
      nameEn: "",
      accountName: "",
      accountNumber: "",
      iban: "",
      type: "شركة",
      isActive: true
    });
    setLogoPreview(null);
  };

  const handleSubmit = () => {
    if (editingBank) {
      updateMutation.mutate({ id: editingBank.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (bank: Bank) => {
    setEditingBank(bank);
    setFormData({
      logo: bank.logo || "",
      bankName: bank.bankName,
      nameEn: bank.nameEn || "",
      accountName: bank.accountName,
      accountNumber: bank.accountNumber,
      iban: bank.iban,
      type: bank.type,
      isActive: bank.isActive
    });
    setLogoPreview(bank.logo || null);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا البنك؟")) {
      deleteMutation.mutate(id);
    }
  };

  const toggleBankVisibility = (bank: Bank) => {
    const newActiveState = !bank.isActive;
    toggleVisibilityMutation.mutate({ id: bank.id, isActive: newActiveState });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData(prev => ({ ...prev, logo: base64 }));
        setLogoPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter banks by type - show all banks (both active and inactive) for management
  const allPersonalBanks = banks.filter(bank => bank.type === "شخصي");
  const allCompanyBanks = banks.filter(bank => bank.type === "شركة");
  
  // For stats - count only active banks
  const activePersonalBanks = allPersonalBanks.filter(bank => bank.isActive);
  const activeCompanyBanks = allCompanyBanks.filter(bank => bank.isActive);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00627F] via-[#004861] to-[#00627F]" dir="rtl">
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">إدارة البنوك</h1>
          <p className="text-gray-200">إدارة بيانات البنوك الشخصية والشركات</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingBank(null);
              resetForm();
            }}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة بنك جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {editingBank ? "تعديل بيانات البنك" : "إضافة بنك جديد"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="logo">شعار البنك</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="mt-1"
                />
                {logoPreview && (
                  <div className="mt-2">
                    <img src={logoPreview} alt="Logo preview" className="w-16 h-16 object-contain rounded" />
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="bankName">اسم البنك</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                  placeholder="البنك الأهلي السعودي"
                  required
                />
              </div>

              <div>
                <Label htmlFor="nameEn">الاسم الإنجليزي</Label>
                <Input
                  id="nameEn"
                  value={formData.nameEn || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                  placeholder="National Commercial Bank"
                />
              </div>

              <div>
                <Label htmlFor="accountName">اسم الحساب</Label>
                <Input
                  id="accountName"
                  value={formData.accountName}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                  placeholder="شركة البريمي للسيارات"
                  required
                />
              </div>

              <div>
                <Label htmlFor="accountNumber">رقم الحساب</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder="12345678901234567890"
                  required
                />
              </div>

              <div>
                <Label htmlFor="iban">رقم الآيبان</Label>
                <Input
                  id="iban"
                  value={formData.iban}
                  onChange={(e) => setFormData(prev => ({ ...prev, iban: e.target.value }))}
                  placeholder="SA0312345678901234567890"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">نوع البنك</Label>
                <Select value={formData.type} onValueChange={(value: typeof BANK_TYPES[number]) => 
                  setFormData(prev => ({ ...prev, type: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BANK_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingBank ? "تحديث" : "إضافة"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">البنوك الشخصية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activePersonalBanks.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">بنوك الشركات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeCompanyBanks.length}</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : (
        <div className="space-y-6">
          {/* Company Banks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                بنوك الشركات ({allCompanyBanks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allCompanyBanks.map((bank) => (
                  <Card key={bank.id} className={`border border-blue-200 ${!bank.isActive ? 'opacity-50 border-dashed' : ''}`}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {bank.logo && (
                              <img 
                                src={bank.logo} 
                                alt={bank.bankName} 
                                className="w-12 h-12 object-contain"
                              />
                            )}
                            <div>
                              <h3 className="font-semibold text-lg">{bank.bankName}</h3>
                              <p className="text-sm text-gray-600">{bank.accountName}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleBankVisibility(bank)}
                              title={!bank.isActive ? "إظهار البنك" : "إخفاء البنك"}
                              disabled={toggleVisibilityMutation.isPending}
                            >
                              {!bank.isActive ? (
                                <EyeOff className="w-3 h-3" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(bank)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(bank.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div><strong>رقم الحساب:</strong> {bank.accountNumber}</div>
                          <div><strong>الآيبان:</strong> {bank.iban}</div>
                        </div>
                        
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {bank.type}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {allCompanyBanks.length === 0 && (
                <Alert>
                  <AlertDescription>
                    لا توجد بنوك شركات مضافة حالياً
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Personal Banks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                البنوك الشخصية ({allPersonalBanks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allPersonalBanks.map((bank) => (
                  <Card key={bank.id} className={`border border-green-200 ${!bank.isActive ? 'opacity-50 border-dashed' : ''}`}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {bank.logo && (
                              <img 
                                src={bank.logo} 
                                alt={bank.bankName} 
                                className="w-12 h-12 object-contain"
                              />
                            )}
                            <div>
                              <h3 className="font-semibold text-lg">{bank.bankName}</h3>
                              <p className="text-sm text-gray-600">{bank.accountName}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleBankVisibility(bank)}
                              title={!bank.isActive ? "إظهار البنك" : "إخفاء البنك"}
                              disabled={toggleVisibilityMutation.isPending}
                            >
                              {!bank.isActive ? (
                                <EyeOff className="w-3 h-3" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(bank)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(bank.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div><strong>رقم الحساب:</strong> {bank.accountNumber}</div>
                          <div><strong>الآيبان:</strong> {bank.iban}</div>
                        </div>
                        
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {bank.type}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {allPersonalBanks.length === 0 && (
                <Alert>
                  <AlertDescription>
                    لا توجد بنوك شخصية مضافة حالياً
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
}