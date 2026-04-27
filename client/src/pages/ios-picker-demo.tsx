import React, { useState } from "react";
import IOSVerticalPicker from "@/components/ui/ios-vertical-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Car, 
  Calendar, 
  MapPin, 
  Palette, 
  Zap, 
  Settings,
  User,
  Building,
  Package,
  Truck
} from "lucide-react";

export default function IOSPickerDemo() {
  const [selectedManufacturer, setSelectedManufacturer] = useState("مرسيدس");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedLocation, setSelectedLocation] = useState("الرياض");

  const manufacturers = [
    { value: "مرسيدس", label: "مرسيدس", icon: <Car /> },
    { value: "بي ام دبليو", label: "بي ام دبليو", icon: <Car /> },
    { value: "تويوتا", label: "تويوتا", icon: <Car /> },
    { value: "لكزس", label: "لكزس", icon: <Car /> },
    { value: "رنج روفر", label: "رنج روفر", icon: <Truck /> },
    { value: "بورش", label: "بورش", icon: <Zap /> },
    { value: "أودي", label: "أودي", icon: <Car /> },
    { value: "بنتلي", label: "بنتلي", icon: <Car /> },
    { value: "رولز رويز", label: "رولز رويز", icon: <Settings /> },
    { value: "فيراري", label: "فيراري", icon: <Zap /> },
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
    { value: "مكة", label: "مكة", icon: <MapPin /> },
    { value: "المدينة", label: "المدينة", icon: <MapPin /> },
    { value: "الطائف", label: "الطائف", icon: <MapPin /> },
    { value: "أبها", label: "أبها", icon: <MapPin /> },
    { value: "تبوك", label: "تبوك", icon: <MapPin /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-slate-900 dark:text-white">
          iOS Style Vertical Picker Demo
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-container">
            <CardHeader>
              <CardTitle className="text-center text-slate-800 dark:text-white">
                <Car className="mx-auto mb-2" size={24} />
                اختر الصانع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IOSVerticalPicker
                items={manufacturers}
                selectedValue={selectedManufacturer}
                onSelectionChange={setSelectedManufacturer}
                className="h-80"
                itemHeight={60}
                visibleItems={5}
              />
            </CardContent>
          </Card>

          <Card className="glass-container">
            <CardHeader>
              <CardTitle className="text-center text-slate-800 dark:text-white">
                <Calendar className="mx-auto mb-2" size={24} />
                اختر السنة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IOSVerticalPicker
                items={years}
                selectedValue={selectedYear}
                onSelectionChange={setSelectedYear}
                className="h-80"
                itemHeight={60}
                visibleItems={5}
              />
            </CardContent>
          </Card>

          <Card className="glass-container">
            <CardHeader>
              <CardTitle className="text-center text-slate-800 dark:text-white">
                <MapPin className="mx-auto mb-2" size={24} />
                اختر الموقع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IOSVerticalPicker
                items={locations}
                selectedValue={selectedLocation}
                onSelectionChange={setSelectedLocation}
                className="h-80"
                itemHeight={60}
                visibleItems={5}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="glass-container">
          <CardHeader>
            <CardTitle className="text-center text-slate-800 dark:text-white">
              النتيجة المحددة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-lg">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="font-semibold text-blue-800 dark:text-blue-200">الصانع:</div>
                  <div className="text-blue-600 dark:text-blue-300">{selectedManufacturer}</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="font-semibold text-green-800 dark:text-green-200">السنة:</div>
                  <div className="text-green-600 dark:text-green-300">{selectedYear}</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="font-semibold text-purple-800 dark:text-purple-200">الموقع:</div>
                  <div className="text-purple-600 dark:text-purple-300">{selectedLocation}</div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <p className="text-slate-700 dark:text-slate-300">
                  لقد اخترت: <span className="font-bold text-slate-900 dark:text-white">
                    {selectedManufacturer} - {selectedYear} - {selectedLocation}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-slate-600 dark:text-slate-400">
          <p className="mb-2">استخدم الإيماءات للتمرير أو انقر على العناصر للاختيار</p>
          <p>يمكنك سحب القوائم عمودياً مثل iOS Picker</p>
        </div>
      </div>
    </div>
  );
}