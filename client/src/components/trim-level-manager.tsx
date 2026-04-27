import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Trash2, Plus, Edit2, Settings } from "lucide-react";
import { apiRequest } from "../lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "../hooks/use-toast";
import type { TrimLevel, InsertTrimLevel } from "@shared/schema";

interface TrimLevelManagerProps {
  manufacturer: string;
  category: string;
  disabled?: boolean;
  onTrimLevelAdded?: (trimLevel: TrimLevel) => void;
}

export default function TrimLevelManager({ manufacturer, category, disabled, onTrimLevelAdded }: TrimLevelManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newTrimLevel, setNewTrimLevel] = useState("");
  const [editingTrimLevel, setEditingTrimLevel] = useState<TrimLevel | null>(null);
  const [editValue, setEditValue] = useState("");
  const queryClient = useQueryClient();

  const { data: trimLevels = [], isLoading } = useQuery({
    queryKey: ["/api/trim-levels"],
    enabled: isOpen,
  });

  const categoryTrimLevels = trimLevels.filter(
    (tl: TrimLevel) => tl.manufacturer === manufacturer && tl.category === category
  );

  const createTrimLevelMutation = useMutation({
    mutationFn: (data: InsertTrimLevel) => apiRequest("POST", "/api/trim-levels", data),
    onSuccess: (newTrimLevel) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trim-levels"] });
      setNewTrimLevel("");
      toast({
        title: "تم إضافة درجة التجهيز بنجاح",
        description: `تم إضافة ${newTrimLevel.trimLevel} للفئة ${category}`,
      });
      onTrimLevelAdded?.(newTrimLevel);
    },
    onError: (error) => {
      console.error("Error creating trim level:", error);
      toast({
        title: "خطأ في إضافة درجة التجهيز",
        description: "حدث خطأ أثناء إضافة درجة التجهيز. تأكد من عدم تكرار الاسم.",
        variant: "destructive",
      });
    },
  });

  const updateTrimLevelMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertTrimLevel> }) =>
      apiRequest("PUT", `/api/trim-levels/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trim-levels"] });
      setEditingTrimLevel(null);
      setEditValue("");
      toast({
        title: "تم تعديل درجة التجهيز بنجاح",
      });
    },
    onError: (error) => {
      console.error("Error updating trim level:", error);
      toast({
        title: "خطأ في تعديل درجة التجهيز",
        description: "حدث خطأ أثناء تعديل درجة التجهيز.",
        variant: "destructive",
      });
    },
  });

  const deleteTrimLevelMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/trim-levels/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trim-levels"] });
      toast({
        title: "تم حذف درجة التجهيز بنجاح",
      });
    },
    onError: (error) => {
      console.error("Error deleting trim level:", error);
      toast({
        title: "خطأ في حذف درجة التجهيز",
        description: "حدث خطأ أثناء حذف درجة التجهيز.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTrimLevel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrimLevel.trim()) return;

    createTrimLevelMutation.mutate({
      manufacturer,
      category,
      trimLevel: newTrimLevel.trim(),
    });
  };

  const handleUpdateTrimLevel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrimLevel || !editValue.trim()) return;

    updateTrimLevelMutation.mutate({
      id: editingTrimLevel.id,
      data: { trimLevel: editValue.trim() },
    });
  };

  const handleDeleteTrimLevel = (id: number) => {
    if (window.confirm("هل أنت متأكد من حذف درجة التجهيز؟")) {
      deleteTrimLevelMutation.mutate(id);
    }
  };

  const startEditing = (trimLevel: TrimLevel) => {
    setEditingTrimLevel(trimLevel);
    setEditValue(trimLevel.trimLevel);
  };

  const cancelEditing = () => {
    setEditingTrimLevel(null);
    setEditValue("");
  };

  if (!manufacturer || !category) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="text-right"
        >
          <Settings className="w-4 h-4 ml-2" />
          إدارة درجات التجهيز
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-right">
            إدارة درجات التجهيز - {manufacturer} {category}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new trim level form */}
          <form onSubmit={handleCreateTrimLevel} className="space-y-3">
            <div>
              <Label htmlFor="newTrimLevel" className="text-right block mb-2">
                إضافة درجة تجهيز جديدة
              </Label>
              <div className="flex gap-2">
                <Input
                  id="newTrimLevel"
                  value={newTrimLevel}
                  onChange={(e) => setNewTrimLevel(e.target.value)}
                  placeholder="أدخل اسم درجة التجهيز"
                  className="text-right"
                  dir="rtl"
                />
                <Button 
                  type="submit"
                  disabled={!newTrimLevel.trim() || createTrimLevelMutation.isPending}
                  size="sm"
                  className="bg-custom-gold hover:bg-custom-gold-dark text-white"
                >
                  <Plus className="w-4 h-4" />
                  إضافة
                </Button>
              </div>
            </div>
          </form>

          {/* Existing trim levels */}
          <div className="space-y-3">
            <h3 className="font-medium text-right">درجات التجهيز الحالية:</h3>
            
            {isLoading ? (
              <div className="text-center py-4">جاري التحميل...</div>
            ) : categoryTrimLevels.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                لا توجد درجات تجهيز محددة لهذه الفئة
              </div>
            ) : (
              <div className="space-y-2">
                {categoryTrimLevels.map((trimLevel: TrimLevel) => (
                  <div key={trimLevel.id} className="flex items-center justify-between p-3 border rounded-lg">
                    {editingTrimLevel?.id === trimLevel.id ? (
                      <form onSubmit={handleUpdateTrimLevel} className="flex-1 flex gap-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="text-right"
                          dir="rtl"
                        />
                        <Button type="submit" size="sm" disabled={!editValue.trim()} className="bg-custom-gold hover:bg-custom-gold-dark text-white">
                          حفظ
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={cancelEditing}>
                          إلغاء
                        </Button>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-right">
                            {trimLevel.trimLevel}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditing(trimLevel)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTrimLevel(trimLevel.id)}
                            disabled={deleteTrimLevelMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}