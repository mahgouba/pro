import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Copy, Share2, ChevronDown, ChevronUp, MessageCircle, Send, CreditCard, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Bank } from "@shared/schema";

export default function PersonalBanks() {
  const [expandedBanks, setExpandedBanks] = useState<Set<number>>(new Set());
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: banks = [], isLoading } = useQuery({
    queryKey: ["/api/banks/type/شخصي"],
    queryFn: async () => {
      const response = await fetch("/api/banks/type/شخصي");
      if (!response.ok) throw new Error("Failed to fetch personal banks");
      return response.json() as Promise<Bank[]>;
    }
  });

  const { data: appearance } = useQuery({
    queryKey: ["/api/appearance"],
    queryFn: async () => {
      const response = await fetch("/api/appearance");
      if (!response.ok) throw new Error("Failed to fetch appearance settings");
      return response.json();
    }
  });

  // Listen for bank data changes from management page
  useEffect(() => {
    const handleBankDataChanged = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banks/type/شخصي"] });
    };

    window.addEventListener('bankDataChanged', handleBankDataChanged);
    return () => {
      window.removeEventListener('bankDataChanged', handleBankDataChanged);
    };
  }, [queryClient]);

  const toggleExpanded = (bankId: number) => {
    const newExpanded = new Set(expandedBanks);
    if (newExpanded.has(bankId)) {
      newExpanded.delete(bankId);
    } else {
      newExpanded.add(bankId);
    }
    setExpandedBanks(newExpanded);
  };

  const copyToClipboard = async (text: string, label: string, elementId?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (elementId) {
        setCopiedText(elementId);
        setTimeout(() => setCopiedText(null), 1000);
      }
      
      toast({
        title: "تم النسخ",
        description: `تم نسخ ${label} بنجاح`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في نسخ النص",
        variant: "destructive"
      });
    }
  };

  const openShareDialog = (bank: Bank) => {
    setSelectedBank(bank);
    setShareDialogOpen(true);
  };

  const getBankShareText = (bank: Bank) => {
    return `بيانات البنك الشخصي
🏦 ${bank.bankName}
👤 ${bank.accountName}
💳 رقم الحساب: ${bank.accountNumber}
🏧 الآيبان: ${bank.iban}`;
  };

  const handleCopyBankData = async () => {
    if (!selectedBank) return;
    await copyToClipboard(getBankShareText(selectedBank), "بيانات البنك");
    setShareDialogOpen(false);
  };

  const handleNativeShare = async () => {
    if (!selectedBank) return;
    const shareText = getBankShareText(selectedBank);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `بيانات ${selectedBank.bankName}`,
          text: shareText
        });
        setShareDialogOpen(false);
      } catch (error) {
        await copyToClipboard(shareText, "بيانات البنك");
      }
    } else {
      await copyToClipboard(shareText, "بيانات البنك");
    }
  };

  const handleWhatsAppShare = () => {
    if (!selectedBank || !phoneNumber.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم الهاتف",
        variant: "destructive"
      });
      return;
    }

    const shareText = getBankShareText(selectedBank);
    const formattedPhone = phoneNumber.startsWith('+966') ? phoneNumber : `+966${phoneNumber.replace(/^0/, '')}`;
    const whatsappUrl = `https://wa.me/${formattedPhone.replace(/\+/g, '')}?text=${encodeURIComponent(shareText)}`;
    
    window.open(whatsappUrl, '_blank');
    setShareDialogOpen(false);
    setPhoneNumber("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#00627F] via-[#004861] to-[#00627F]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">جاري تحميل البنوك...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-[#00627F] via-[#004861] to-[#00627F]" dir="rtl">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 right-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-5">
          <img 
            src={appearance?.companyLogo || "/copmany logo.svg"} 
            alt="شعار الشركة" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <img 
              src={appearance?.companyLogo || "/copmany logo.svg"} 
              alt="شعار الشركة" 
              className="w-24 h-24 mx-auto object-contain drop-shadow-2xl"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
            الحسابات الشخصية
          </h1>
          <p className="text-xl text-blue-100/80 max-w-2xl mx-auto leading-relaxed">
            اختر الحساب المناسب لإتمام عملية التحويل البنكي
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-blue-200/70">
            <span className="flex items-center gap-2">
              <User size={16} />
              حسابات شخصية
            </span>
            <span>•</span>
            <span>{banks.length} حساب متاح</span>
          </div>
        </div>

        {/* Banks Grid */}
        {banks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banks.map((bank) => {
              const isExpanded = expandedBanks.has(bank.id);
              
              return (
                <Card 
                  key={bank.id} 
                  className="backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col space-y-4">
                      {/* Bank Header */}
                      <div 
                        className="w-full flex justify-between items-center cursor-pointer group"
                        onClick={() => toggleExpanded(bank.id)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-4 space-x-reverse">
                            <div className="flex items-center space-x-3 space-x-reverse">
                              {bank.logo ? (
                                <img 
                                  src={bank.logo} 
                                  alt={bank.bankName} 
                                  className="h-16 w-16 object-contain drop-shadow-lg rounded-lg"
                                />
                              ) : (
                                <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                                  <CreditCard className="w-8 h-8 text-white" />
                                </div>
                              )}
                              <div>
                                <h3 className="text-lg font-bold text-white drop-shadow-md">
                                  {bank.bankName}
                                </h3>
                                <p className="text-sm text-blue-200/80">
                                  {bank.accountName}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown className="w-5 h-5 text-white/70" />
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="space-y-4 pt-4 border-t border-white/20 animate-in slide-in-from-top-5 duration-300">
                          {/* Account Number */}
                          <div className="group">
                            <Label className="text-sm font-medium text-blue-200/80 mb-2 block">رقم الحساب</Label>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                                <p className="text-white font-mono text-lg">{bank.accountNumber}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(bank.accountNumber, "رقم الحساب", `account-${bank.id}`);
                                }}
                                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 h-12 w-12"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* IBAN */}
                          <div className="group">
                            <Label className="text-sm font-medium text-blue-200/80 mb-2 block">الآيبان</Label>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                                <p className="text-white font-mono text-lg">{bank.iban}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(bank.iban, "الآيبان", `iban-${bank.id}`);
                                }}
                                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 h-12 w-12"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Share Button */}
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              openShareDialog(bank);
                            }}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            <Share2 className="w-4 h-4 ml-2" />
                            مشاركة بيانات البنك
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mb-6">
              <User className="w-24 h-24 text-white/30 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">لا توجد حسابات شخصية</h3>
            <p className="text-blue-200/60">لم يتم إضافة أي حسابات شخصية بعد</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-blue-200/60 text-sm">
            للمساعدة أو الاستفسار، يرجى التواصل مع خدمة العملاء
          </p>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md backdrop-blur-xl bg-slate-900/90 border border-white/20" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              مشاركة بيانات {selectedBank?.bankName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <Button
                onClick={handleCopyBankData}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Copy className="w-4 h-4 ml-2" />
                نسخ بيانات البنك
              </Button>

              <Button
                onClick={handleNativeShare}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                <Share2 className="w-4 h-4 ml-2" />
                مشاركة عبر النظام
              </Button>
            </div>

            <Separator className="bg-white/20" />
            
            <div className="space-y-3">
              <Label className="text-white">مشاركة عبر واتساب</Label>
              <Input
                placeholder="رقم الهاتف (مثال: 0501234567)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <Button
                onClick={handleWhatsAppShare}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <MessageCircle className="w-4 h-4 ml-2" />
                إرسال عبر واتساب
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}