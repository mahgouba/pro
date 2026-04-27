import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Database, RefreshCw, Download, AlertTriangle } from "lucide-react";

interface ImportStats {
  manufacturers: number;
  categories: number;
  trimLevels: number;
  inventory: number;
  users: number;
  banks: number;
}

export function FreshImportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/admin/fresh-import', {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      setStats(data.stats);
      toast({
        title: "نجح التحديث",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "فشل التحديث",
        description: error.message || "حدث خطأ أثناء تحديث قاعدة البيانات",
        variant: "destructive",
      });
    }
  });

  const handleImport = () => {
    importMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="glass-button flex items-center gap-2">
          <Database className="h-4 w-4" />
          تحديث قاعدة البيانات
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-modal max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <Database className="h-5 w-5" />
            إعادة تهيئة قاعدة البيانات
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-200">تحذير</span>
            </div>
            <p className="text-sm text-gray-300">
              ستقوم هذه العملية بحذف جميع البيانات الحالية وإعادة استيرادها من قاعدة البيانات الخارجية.
              هذا الإجراء لا يمكن التراجع عنه.
            </p>
          </div>

          {importMutation.isPending && (
            <div className="text-center py-4">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-300">جاري تحديث قاعدة البيانات...</p>
              <p className="text-xs text-gray-400 mt-1">قد تستغرق هذه العملية بضع دقائق</p>
            </div>
          )}

          {stats && (
            <div className="glass-section p-4 rounded-lg">
              <h4 className="font-medium text-white mb-3 text-right">تم استيراد البيانات بنجاح:</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between items-center">
                  <Badge variant="secondary" className="glass-badge">{stats.manufacturers}</Badge>
                  <span className="text-sm text-gray-300">صانع</span>
                </div>
                <div className="flex justify-between items-center">
                  <Badge variant="secondary" className="glass-badge">{stats.categories}</Badge>
                  <span className="text-sm text-gray-300">فئة</span>
                </div>
                <div className="flex justify-between items-center">
                  <Badge variant="secondary" className="glass-badge">{stats.trimLevels}</Badge>
                  <span className="text-sm text-gray-300">درجة تجهيز</span>
                </div>
                <div className="flex justify-between items-center">
                  <Badge variant="secondary" className="glass-badge">{stats.inventory}</Badge>
                  <span className="text-sm text-gray-300">مركبة</span>
                </div>
                <div className="flex justify-between items-center">
                  <Badge variant="secondary" className="glass-badge">{stats.users}</Badge>
                  <span className="text-sm text-gray-300">مستخدم</span>
                </div>
                <div className="flex justify-between items-center">
                  <Badge variant="secondary" className="glass-badge">{stats.banks}</Badge>
                  <span className="text-sm text-gray-300">بنك</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            {!importMutation.isPending && !stats && (
              <Button
                onClick={handleImport}
                className="glass-button flex-1 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                بدء التحديث
              </Button>
            )}
            
            <Button
              onClick={() => {
                setIsOpen(false);
                setStats(null);
                importMutation.reset();
              }}
              variant="outline"
              className="flex-1"
            >
              {stats ? 'إغلاق' : 'إلغاء'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}