import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Copy, Share2, ChevronDown, ChevronUp, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Bank } from "@shared/schema";

export default function PersonalBanks() {
  const [expandedBanks, setExpandedBanks] = useState<Set<number>>(new Set());
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const { toast } = useToast();

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--dark-bg-primary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">جاري تحميل البنوك...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800" dir="rtl">
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
                  className="glass-container rounded-2xl hover:scale-105 transition-all duration-300"
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
                                  className="h-18 w-18 object-contain drop-shadow-lg"
                                  style={{ height: '4.5rem', width: '4.5rem' }}
                                />
                              ) : (
                                <div className="h-18 w-18 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                                  <User className="w-8 h-8 text-white" />
                                </div>
                              )}
                              <h3 className="text-lg font-bold text-white drop-shadow-md">
                                {bank.bankName}
                              </h3>
                            </div>
                          </div>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              openShareDialog(bank);
                            }}
                            className="p-2 hover:bg-purple-500/20 rounded-lg transition-all duration-300 backdrop-blur-sm border border-purple-500/30"
                            title="مشاركة معلومات البنك"
                          >
                            <Share2 className="w-4 h-4 text-purple-400" />
                          </Button>
                        </div>
                        
                        {isExpanded ? (
                          <ChevronUp className="w-6 h-6 text-white drop-shadow-md transform transition-all duration-300 group-hover:scale-110" />
                        ) : (
                          <ChevronDown className="w-6 h-6 text-white drop-shadow-md transform transition-all duration-300 group-hover:scale-110" />
                        )}
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="w-full space-y-4 animate-in slide-in-from-top-2 duration-300">
                          <Separator className="bg-white/30 h-px" />

                          <div className="space-y-4">
                            {/* Account Name Row */}
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <span className="text-white text-base">اسم الحساب:</span>
                                <span className="text-white text-base font-medium">{bank.accountName}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(bank.accountName, "اسم الحساب", `accountName-${bank.id}`);
                                }}
                                className={`${
                                  copiedText === `accountName-${bank.id}` 
                                    ? 'bg-green-500/20 scale-110' 
                                    : 'hover:bg-white/20'
                                } p-2 rounded-lg transition-all duration-300`}
                                title={copiedText === `accountName-${bank.id}` ? 'تم النسخ ✓' : 'نسخ اسم الحساب'}
                              >
                                <Copy className="w-4 h-4 text-white" />
                              </Button>
                            </div>

                            <Separator className="bg-white/30 h-px" />

                            {/* Account Number Row */}
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <span className="text-white text-base">رقم الحساب:</span>
                                <span className="text-white text-base font-medium font-mono">{bank.accountNumber}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(bank.accountNumber, "رقم الحساب", `accountNumber-${bank.id}`);
                                }}
                                className={`${
                                  copiedText === `accountNumber-${bank.id}` 
                                    ? 'bg-green-500/20 scale-110' 
                                    : 'hover:bg-white/20'
                                } p-2 rounded-lg transition-all duration-300`}
                                title={copiedText === `accountNumber-${bank.id}` ? 'تم النسخ ✓' : 'نسخ رقم الحساب'}
                              >
                                <Copy className="w-4 h-4 text-white" />
                              </Button>
                            </div>

                            <Separator className="bg-white/30 h-px" />

                            {/* IBAN Row */}
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <span className="text-white text-base">رقم الآيبان:</span>
                                <span className="text-white text-base font-medium font-mono break-all">{bank.iban}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(bank.iban, "الآيبان", `iban-${bank.id}`);
                                }}
                                className={`${
                                  copiedText === `iban-${bank.id}` 
                                    ? 'bg-green-500/20 scale-110' 
                                    : 'hover:bg-white/20'
                                } p-2 rounded-lg transition-all duration-300`}
                                title={copiedText === `iban-${bank.id}` ? 'تم النسخ ✓' : 'نسخ الآيبان'}
                              >
                                <Copy className="w-4 h-4 text-white" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20">
            <User className="w-20 h-20 text-white/50 mx-auto mb-6 drop-shadow-lg" />
            <h3 className="text-2xl font-semibold text-white mb-4 drop-shadow-md">لا توجد بنوك شخصية</h3>
            <p className="text-white/70 text-lg">لم يتم إضافة أي بنوك شخصية حتى الآن</p>
          </div>
        )}
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="glass-container border-white/20 max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-center mb-4">
              مشاركة بيانات {selectedBank?.bankName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Copy Option */}
            <Button
              onClick={handleCopyBankData}
              className="w-full glass-container hover:bg-white/20 text-white border-white/30 flex items-center gap-3 p-4 h-auto"
            >
              <Copy className="w-5 h-5" />
              <span className="text-base">نسخ البيانات</span>
            </Button>

            {/* Native Share Option */}
            <Button
              onClick={handleNativeShare}
              className="w-full glass-container hover:bg-white/20 text-white border-white/30 flex items-center gap-3 p-4 h-auto"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-base">مشاركة</span>
            </Button>

            {/* WhatsApp Share Option */}
            <div className="space-y-3">
              <Label htmlFor="phone" className="text-white text-base">
                إرسال عبر الواتساب
              </Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="5xxxxxxxx"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="glass-container border-white/30 text-white placeholder:text-white/50 flex-1"
                  dir="ltr"
                />
                <Button
                  onClick={handleWhatsAppShare}
                  className="glass-container hover:bg-green-500/20 text-white border-green-500/30 px-4"
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-white/70 text-xs">
                أدخل رقم الهاتف بدون +966 (مثال: 512345678)
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}