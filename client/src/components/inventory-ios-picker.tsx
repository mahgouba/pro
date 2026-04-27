import React, { useState } from "react";
import IOSVerticalPicker from "@/components/ui/ios-vertical-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Car, Calendar, MapPin, Palette, Settings, Package, Building } from "lucide-react";

interface InventoryIOSPickerProps {
  onSelectionComplete?: (selections: {
    manufacturer: string;
    year: string;
    location: string;
    color: string;
  }) => void;
  triggerButton?: React.ReactNode;
}

export default function InventoryIOSPicker({ 
  onSelectionComplete,
  triggerButton 
}: InventoryIOSPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState("مرسيدس");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedLocation, setSelectedLocation] = useState("الرياض");
  const [selectedColor, setSelectedColor] = useState("أبيض");

  const manufacturers = [
    { value: "مرسيدس", label: "مرسيدس", icon: <Car /> },
    { value: "بي ام دبليو", label: "بي ام دبليو", icon: <Car /> },
    { value: "تويوتا", label: "تويوتا", icon: <Car /> },
    { value: "لكزس", label: "لكزس", icon: <Car /> },
    { value: "رنج روفر", label: "رنج روفر", icon: <Package /> },
    { value: "بورش", label: "بورش", icon: <Settings /> },
    { value: "أودي", label: "أودي", icon: <Car /> },
    { value: "بنتلي", label: "بنتلي", icon: <Car /> },
    { value: "رولز رويز", label: "رولز رويز", icon: <Settings /> },
    { value: "فيراري", label: "فيراري", icon: <Settings /> },
    { value: "لامبورغيني", label: "لامبورغيني", icon: <Settings /> },
    { value: "نيسان", label: "نيسان", icon: <Car /> },
  ];

  const years = [
    { value: "2020", label: "2020", icon: <Calendar /> },
    { value: "2021", label: "2021", icon: <Calendar /> },
    { value: "2022", label: "2022", icon: <Calendar /> },
    { value: "2023", label: "2023", icon: <Calendar /> },
    { value: "2024", label: "2024", icon: <Calendar /> },
    { value: "2025", label: "2025", icon: <Calendar /> },
  ];

  const locations = [
    { value: "الرياض", label: "الرياض", icon: <MapPin /> },
    { value: "جدة", label: "جدة", icon: <MapPin /> },
    { value: "الدمام", label: "الدمام", icon: <MapPin /> },
    { value: "مكة", label: "مكة المكرمة", icon: <Building /> },
    { value: "المدينة", label: "المدينة المنورة", icon: <Building /> },
    { value: "الطائف", label: "الطائف", icon: <MapPin /> },
    { value: "أبها", label: "أبها", icon: <MapPin /> },
    { value: "تبوك", label: "تبوك", icon: <MapPin /> },
    { value: "الخبر", label: "الخبر", icon: <MapPin /> },
    { value: "القصيم", label: "القصيم", icon: <MapPin /> },
  ];

  const colors = [
    { value: "أبيض", label: "أبيض", icon: <Palette /> },
    { value: "أسود", label: "أسود", icon: <Palette /> },
    { value: "فضي", label: "فضي", icon: <Palette /> },
    { value: "رمادي", label: "رمادي", icon: <Palette /> },
    { value: "أزرق", label: "أزرق", icon: <Palette /> },
    { value: "أحمر", label: "أحمر", icon: <Palette /> },
    { value: "أخضر", label: "أخضر", icon: <Palette /> },
    { value: "بني", label: "بني", icon: <Palette /> },
    { value: "ذهبي", label: "ذهبي", icon: <Palette /> },
    { value: "برونزي", label: "برونزي", icon: <Palette /> },
  ];

  const handleConfirmSelection = () => {
    if (onSelectionComplete) {
      onSelectionComplete({
        manufacturer: selectedManufacturer,
        year: selectedYear,
        location: selectedLocation,
        color: selectedColor,
      });
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button 
            variant="outline" 
            className="bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-300"
          >
            <Settings className="ml-2" size={16} />
            iOS Picker
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl h-[80vh] glass-unified text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-white mb-4">
            اختيار معايير السيارة - iOS Style
          </DialogTitle>
          <div className="sr-only" aria-describedby="picker-description">
            اختر معايير السيارة باستخدام المحدد العمودي بأسلوب iOS
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-full">
          <div className="space-y-2">
            <h3 className="text-center font-semibold text-white/90 text-sm">
              <Car className="mx-auto mb-1" size={18} />
              الصانع
            </h3>
            <IOSVerticalPicker
              items={manufacturers}
              selectedValue={selectedManufacturer}
              onSelectionChange={setSelectedManufacturer}
              className="h-64"
              itemHeight={50}
              visibleItems={5}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-center font-semibold text-white/90 text-sm">
              <Calendar className="mx-auto mb-1" size={18} />
              السنة
            </h3>
            <IOSVerticalPicker
              items={years}
              selectedValue={selectedYear}
              onSelectionChange={setSelectedYear}
              className="h-64"
              itemHeight={50}
              visibleItems={5}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-center font-semibold text-white/90 text-sm">
              <MapPin className="mx-auto mb-1" size={18} />
              الموقع
            </h3>
            <IOSVerticalPicker
              items={locations}
              selectedValue={selectedLocation}
              onSelectionChange={setSelectedLocation}
              className="h-64"
              itemHeight={50}
              visibleItems={5}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-center font-semibold text-white/90 text-sm">
              <Palette className="mx-auto mb-1" size={18} />
              اللون
            </h3>
            <IOSVerticalPicker
              items={colors}
              selectedValue={selectedColor}
              onSelectionChange={setSelectedColor}
              className="h-64"
              itemHeight={50}
              visibleItems={5}
            />
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {/* Selection Preview */}
          <div className="glass-unified p-4 rounded-lg">
            <h4 className="text-center font-semibold text-white mb-2">المحدد حالياً:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="text-center">
                <div className="text-blue-300">الصانع:</div>
                <div className="font-medium text-white">{selectedManufacturer}</div>
              </div>
              <div className="text-center">
                <div className="text-green-300">السنة:</div>
                <div className="font-medium text-white">{selectedYear}</div>
              </div>
              <div className="text-center">
                <div className="text-purple-300">الموقع:</div>
                <div className="font-medium text-white">{selectedLocation}</div>
              </div>
              <div className="text-center">
                <div className="text-yellow-300">اللون:</div>
                <div className="font-medium text-white">{selectedColor}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 space-x-reverse">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white border-gray-500"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleConfirmSelection}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              تأكيد الاختيار
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}