import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Image, ExternalLink, Edit } from 'lucide-react';

interface ImageLink {
  id: number;
  manufacturer: string;
  category: string;
  trimLevel?: string;
  year: number;
  exteriorColor: string;
  interiorColor: string;
  engineCapacity?: string;
  chassisNumber?: string;
  imageUrl: string;
  description?: string;
  createdAt: Date;
}

interface ImageManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImageManagement({ open, onOpenChange }: ImageManagementProps) {
  const [imageLinks, setImageLinks] = useState<ImageLink[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTrimLevel, setSelectedTrimLevel] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedExteriorColor, setSelectedExteriorColor] = useState<string>('');
  const [selectedInteriorColor, setSelectedInteriorColor] = useState<string>('');
  const [selectedEngineCapacity, setSelectedEngineCapacity] = useState<string>('');
  const [selectedChassisNumber, setSelectedChassisNumber] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('add');
  const { toast } = useToast();

  // Fetch manufacturers from cars.json
  const { data: carsManufacturers = [] } = useQuery<any[]>({
    queryKey: ["/api/cars/manufacturers"],
    enabled: open,
  });

  // Fetch manufacturers from database
  const { data: manufacturersData = [] } = useQuery<any[]>({
    queryKey: ["/api/manufacturers"],
    enabled: open,
  });

  // Fetch categories/models from cars.json for selected manufacturer
  const { data: carsModels = [] } = useQuery<any[]>({
    queryKey: [`/api/cars/models/${selectedManufacturer}`],
    enabled: open && !!selectedManufacturer,
  });

  // Fetch trim levels from cars.json for selected manufacturer and category
  const { data: carsTrims = [] } = useQuery<any[]>({
    queryKey: [`/api/cars/trims/${selectedManufacturer}/${selectedCategory}`],
    enabled: open && !!selectedManufacturer && !!selectedCategory,
  });

  // Fetch engines from cars.json
  const { data: carsEngines = [] } = useQuery<any[]>({
    queryKey: ["/api/cars/engines"],
    enabled: open,
  });

  // Get all manufacturers (combine database and cars.json)
  const allManufacturers = [
    ...carsManufacturers.map(m => m.name_ar),
    ...manufacturersData.map(m => m.name)
  ].filter((value, index, self) => self.indexOf(value) === index);

  // Get categories for selected manufacturer from cars.json
  const categories = carsModels.map(model => model.model_ar) || [];

  // Get trim levels from cars.json
  const trimLevels = carsTrims.map(trim => trim.trim_ar) || [];

  // Get engine capacities from cars.json
  const engineCapacities = carsEngines.map(engine => engine.engine) || [];

  // Generate years from 2020 to current year + 2
  const years = Array.from({ length: new Date().getFullYear() - 2018 }, (_, i) => 2020 + i);

  // Common colors (could be moved to API later)
  const colors = [
    "أبيض", "أسود", "فضي", "رمادي", "أزرق", "أحمر", "بني", "ذهبي", "أخضر", "برتقالي"
  ];

  useEffect(() => {
    loadImageLinks();
  }, []);

  const loadImageLinks = async () => {
    try {
      const response = await fetch('/api/image-links');
      if (response.ok) {
        const data = await response.json();
        setImageLinks(data);
      }
    } catch (error) {
      console.error('Error loading image links:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedManufacturer || !selectedCategory || !selectedExteriorColor || !selectedInteriorColor || !imageUrl) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رابط صالح",
        variant: "destructive",
      });
      return;
    }

    const newImageLink: Partial<ImageLink> = {
      manufacturer: selectedManufacturer,
      category: selectedCategory,
      trimLevel: selectedTrimLevel || undefined,
      year: selectedYear,
      exteriorColor: selectedExteriorColor,
      interiorColor: selectedInteriorColor,
      engineCapacity: (selectedManufacturer === 'رنج روفر' && selectedEngineCapacity) ? selectedEngineCapacity : undefined,
      chassisNumber: selectedChassisNumber || undefined,
      imageUrl,
      description: description || undefined,
      createdAt: new Date()
    };

    try {
      const url = editingId ? `/api/image-links/${editingId}` : '/api/image-links';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newImageLink),
      });

      if (response.ok) {
        toast({
          title: "تم بنجاح",
          description: editingId ? "تم تحديث رابط الصورة" : "تم إضافة رابط الصورة",
        });
        resetForm();
        loadImageLinks();
        setActiveTab('manage');
      } else {
        throw new Error('Failed to save image link');
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ رابط الصورة",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (imageLink: ImageLink) => {
    setSelectedManufacturer(imageLink.manufacturer);
    setSelectedCategory(imageLink.category);
    setSelectedTrimLevel(imageLink.trimLevel || '');
    setSelectedYear(imageLink.year);
    setSelectedExteriorColor(imageLink.exteriorColor);
    setSelectedInteriorColor(imageLink.interiorColor);
    setSelectedEngineCapacity(imageLink.engineCapacity || '');
    setSelectedChassisNumber(imageLink.chassisNumber || '');
    setImageUrl(imageLink.imageUrl);
    setDescription(imageLink.description || '');
    setEditingId(imageLink.id);
    setActiveTab('add');
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/image-links/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "تم بنجاح",
          description: "تم حذف رابط الصورة",
        });
        loadImageLinks();
      } else {
        throw new Error('Failed to delete image link');
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف رابط الصورة",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedManufacturer('');
    setSelectedCategory('');
    setSelectedTrimLevel('');
    setSelectedYear(new Date().getFullYear());
    setSelectedExteriorColor('');
    setSelectedInteriorColor('');
    setSelectedEngineCapacity('');
    setSelectedChassisNumber('');
    setImageUrl('');
    setDescription('');
    setEditingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>إدارة روابط صور السيارات</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add">
              {editingId ? 'تعديل رابط' : 'إضافة رابط'}
            </TabsTrigger>
            <TabsTrigger value="manage">إدارة الروابط</TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingId ? 'تعديل رابط الصورة' : 'إضافة رابط صورة جديد'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">الصانع *</Label>
                    <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الصانع" />
                      </SelectTrigger>
                      <SelectContent>
                        {allManufacturers.map((manufacturer) => (
                          <SelectItem key={manufacturer} value={manufacturer}>
                            {manufacturer}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">الفئة *</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trimLevel">درجة التجهيز</Label>
                    <Select value={selectedTrimLevel} onValueChange={setSelectedTrimLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر درجة التجهيز" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="غير محدد">غير محدد</SelectItem>
                        {trimLevels.map((trim) => (
                          <SelectItem key={trim} value={trim}>
                            {trim}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">السنة *</Label>
                    <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر السنة" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exteriorColor">اللون الخارجي *</Label>
                    <Select value={selectedExteriorColor} onValueChange={setSelectedExteriorColor}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر اللون الخارجي" />
                      </SelectTrigger>
                      <SelectContent>
                        {colors.map((color) => (
                          <SelectItem key={color} value={color}>
                            {color}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interiorColor">اللون الداخلي *</Label>
                    <Select value={selectedInteriorColor} onValueChange={setSelectedInteriorColor}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر اللون الداخلي" />
                      </SelectTrigger>
                      <SelectContent>
                        {colors.map((color) => (
                          <SelectItem key={color} value={color}>
                            {color}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedManufacturer === 'رنج روفر' && (
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="engineCapacity">سعة المحرك</Label>
                      <Input
                        id="engineCapacity"
                        value={selectedEngineCapacity}
                        onChange={(e) => setSelectedEngineCapacity(e.target.value)}
                        placeholder="مثال: 3.0L V6"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chassisNumber">رقم الهيكل (اختياري)</Label>
                  <Input
                    id="chassisNumber"
                    value={selectedChassisNumber}
                    onChange={(e) => setSelectedChassisNumber(e.target.value)}
                    placeholder="رقم الهيكل للربط بسيارة معينة"
                    dir="ltr"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    إذا كنت تريد ربط الصورة بسيارة معينة، أدخل رقم الهيكل
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">رابط الصورة *</Label>
                  <Input
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">وصف (اختياري)</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="وصف مختصر للصورة"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetForm}>
                    إلغاء
                  </Button>
                  <Button onClick={handleSubmit} className="bg-custom-gold hover:bg-custom-gold-dark text-white">
                    {editingId ? 'تحديث' : 'إضافة'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>الروابط المحفوظة ({imageLinks.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {imageLinks.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    لا توجد روابط صور محفوظة
                  </div>
                ) : (
                  <div className="space-y-4">
                    {imageLinks.map((link) => (
                      <div key={link.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {link.manufacturer} - {link.category}
                              </span>
                              {link.trimLevel && (
                                <span className="text-sm text-slate-600">
                                  ({link.trimLevel})
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-slate-600 space-x-2" dir="rtl">
                              <span>السنة: {link.year}</span>
                              <span>الخارجي: {link.exteriorColor}</span>
                              <span>الداخلي: {link.interiorColor}</span>
                              {link.engineCapacity && (
                                <span>المحرك: {link.engineCapacity}</span>
                              )}
                              {link.chassisNumber && (
                                <span>الهيكل: {link.chassisNumber}</span>
                              )}
                            </div>
                            {link.description && (
                              <div className="text-sm text-slate-500">
                                {link.description}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(link.imageUrl, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(link)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(link.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="relative">
                          <img
                            src={link.imageUrl}
                            alt={`${link.manufacturer} ${link.category}`}
                            className="w-full h-32 object-cover rounded border"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = 'none';
                              const errorDiv = img.nextElementSibling as HTMLElement;
                              if (errorDiv) errorDiv.style.display = 'flex';
                            }}
                          />
                          <div 
                            className="hidden absolute inset-0 bg-slate-100 border rounded items-center justify-center text-slate-500"
                          >
                            فشل تحميل الصورة
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}