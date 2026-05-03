import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calculator, Printer, Save, TrendingUp, Plus, Trash2, Car, Settings, Check, Info, Share2, History, Download, MessageCircle, FileText, Type } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import SystemGlassWrapper from "@/components/system-glass-wrapper";
import { useTheme } from "@/components/theme-provider";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Bank rate type from financing rates management
interface BankRateItem {
  rateName: string;
  rateValue: number;
  financingType?: "installments" | "50-50" | "40-60";
}

interface FinancingRate {
  id: number;
  bankName: string;
  bankNameEn: string;
  bankLogo?: string;
  financingType: "personal" | "commercial";
  rates: BankRateItem[];
  minPeriod: number;
  maxPeriod: number;
  minAmount: number;
  maxAmount: number;
  features: string[];
  requirements: string[];
  isActive: boolean;
  lastUpdated: string;
}

interface BankRate {
  id?: string;
  name: string;
  logo?: string;
  rates: {
    [years: string]: number; // APR percentage
  };
}

interface NewBankForm {
  name: string;
  logo: string;
  rates: { [years: string]: number };
}

// Convert financing rates from management system to calculator format
const convertFinancingRatesToBankRates = (financingRates: FinancingRate[]): any[] => {
  return financingRates
    .filter(rate => rate.isActive) // Only active rates
    .map(rate => ({
      id: rate.id.toString(),
      bankName: rate.bankName,
      name: rate.bankName,
      logo: rate.bankLogo || "",
      rates: rate.rates // Keep as array of objects {rateName, rateValue, financingType}
    }));
};

interface CalculationResult {
  monthlyPayment: number;
  totalAmount: number;
  totalInterest: number;
  totalInsurance: number;
  financedAmount: number;
  effectiveRate: number;
  downPaymentAmount: number;
  downPaymentPercent: number;
  finalPaymentAmount: number;
  finalPaymentPercent: number;
  adminFeesAmount: number;
  adminFeesPercent: number;
}

interface FormData {
  customerName: string;
  customerPhone: string;
  customerAge: string;
  customerJob: string;
  customerSalary: string;
  salaryTransferBank: string;
  financialCommitment: string;
  commitmentType: string;
  vehiclePrice: string;
  downPayment: string;
  downPaymentType: "percentage" | "amount";
  finalPayment: string;
  finalPaymentType: "percentage" | "amount";
  bankName: string;
  bankLogo?: string;
  financingYears: string;
  financingMonths: string;
  financingRate: string; // Profit margin percentage
  financingType: "installments" | "two-payments"; // Default to installments
  administrativeFees: string;
  administrativeFeesType: "percentage" | "amount";
  insuranceRate: string;
  vehicleManufacturer: string;
  vehicleManufacturerLogo?: string;
  vehicleCategory: string;
  vehicleTrimLevel: string;
  vehicleYear: string;
  vehicleExteriorColor: string;
  vehicleInteriorColor: string;
  notes: string;
}

interface SavedCustomer {
  customerName: string;
  customerPhone: string;
  customerSalary: string;
}

function CustomerSearchInput({
  field,
  value,
  onChange,
  onSelectCustomer,
  savedCustomers,
  placeholder,
  testId,
}: {
  field: "name" | "phone";
  value: string;
  onChange: (value: string) => void;
  onSelectCustomer: (customer: SavedCustomer) => void;
  savedCustomers: SavedCustomer[];
  placeholder: string;
  testId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const query = (value || "").trim().toLowerCase();
  const matches = query.length >= 1
    ? savedCustomers.filter((c) => {
        const target = field === "name" ? c.customerName : c.customerPhone;
        return target && target.toLowerCase().includes(query) && target.toLowerCase() !== query;
      }).slice(0, 8)
    : [];

  return (
    <div className="relative" ref={containerRef}>
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="bg-white/5 border-white/20 text-white"
        data-testid={testId}
        autoComplete="off"
      />
      {isOpen && matches.length > 0 && (
        <div
          className="absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded-md border border-white/20 bg-slate-900/95 backdrop-blur-md shadow-xl"
          data-testid={`dropdown-customer-${field}`}
        >
          {matches.map((c, idx) => (
            <button
              type="button"
              key={`${c.customerName}-${c.customerPhone}-${idx}`}
              onClick={() => {
                onSelectCustomer(c);
                setIsOpen(false);
              }}
              className="w-full text-right px-3 py-2 hover:bg-white/10 border-b border-white/5 last:border-b-0 transition-colors"
              data-testid={`option-customer-${idx}`}
            >
              <div className="text-white text-sm font-medium">{c.customerName || "غير محدد"}</div>
              <div className="text-white/50 text-xs flex justify-between gap-2">
                <span>{c.customerPhone || "—"}</span>
                {c.customerSalary && parseFloat(c.customerSalary) > 0 && (
                  <span>راتب: {parseFloat(c.customerSalary).toLocaleString()} ر.س</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FinancingCalculatorPage() {
  const { settings } = useTheme();
  // State definitions first
  const [formData, setFormData] = useState<FormData>({
    customerName: "",
    customerPhone: "",
    customerAge: "",
    customerJob: "",
    customerSalary: "",
    salaryTransferBank: "",
    financialCommitment: "",
    commitmentType: "",
    vehiclePrice: "",
    downPayment: "",
    downPaymentType: "percentage",
    finalPayment: "",
    finalPaymentType: "percentage",
    bankName: "",
    bankLogo: "",
    financingYears: "5",
    financingMonths: "0",
    financingRate: "", // Profit margin percentage
    financingType: "installments", // Default to installments
    administrativeFees: "0",
    administrativeFeesType: "percentage",
    insuranceRate: "4.0", // Default comprehensive insurance rate
    vehicleManufacturer: "",
    vehicleManufacturerLogo: "",
    vehicleCategory: "",
    vehicleTrimLevel: "",
    vehicleYear: new Date().getFullYear().toString(),
    vehicleExteriorColor: "",
    vehicleInteriorColor: "",
    notes: ""
  });

  // Fetch hierarchical data
  const { data: hierarchicalManufacturers = [] } = useQuery<any[]>({
    queryKey: ["/api/hierarchical/manufacturers"],
  });

  const { data: hierarchicalCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/hierarchical/categories", formData.vehicleManufacturer],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(`${queryKey[0]}?manufacturer=${encodeURIComponent(queryKey[1] as string)}`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
    enabled: !!formData.vehicleManufacturer
  });

  const { data: hierarchicalTrimLevels = [] } = useQuery<any[]>({
    queryKey: ["/api/hierarchical/trimLevels", formData.vehicleManufacturer, formData.vehicleCategory],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(`${queryKey[0]}?manufacturer=${encodeURIComponent(queryKey[1] as string)}&category=${encodeURIComponent(queryKey[2] as string)}`);
      if (!res.ok) throw new Error("Failed to fetch trim levels");
      return res.json();
    },
    enabled: !!formData.vehicleManufacturer && !!formData.vehicleCategory
  });

  const { data: hierarchicalExteriorColors = [] } = useQuery<any[]>({
    queryKey: ["/api/hierarchical/colors", formData.vehicleManufacturer, formData.vehicleCategory, formData.vehicleTrimLevel, "exterior"],
    queryFn: async ({ queryKey }) => {
      // Find the endpoint for colors in routes.ts - it seems it might be different or not fully implemented for filtering by vehicle
      const res = await fetch(`/api/hierarchical/colors`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!formData.vehicleManufacturer && !!formData.vehicleCategory
  });

  const { data: hierarchicalInteriorColors = [] } = useQuery<any[]>({
    queryKey: ["/api/hierarchical/colors", formData.vehicleManufacturer, formData.vehicleCategory, formData.vehicleTrimLevel, "interior"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(`/api/hierarchical/colors`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!formData.vehicleManufacturer && !!formData.vehicleCategory
  });

  // Fetch Company Data for logo
  const { data: companiesData = [] } = useQuery<any[]>({
    queryKey: ["/api/companies"],
  });
  const mainCompany = companiesData[0]; // Assume the first one is the main company

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [selectedBank, setSelectedBank] = useState<BankRate | null>(null);
  const [customBanks, setCustomBanks] = useState<BankRate[]>([]);
  const [showAddBankDialog, setShowAddBankDialog] = useState(false);
  const [newBank, setNewBank] = useState<NewBankForm>({
    name: "",
    logo: "",
    rates: {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
      "6": 0,
      "7": 0
    }
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch financing rates from management system
  const { data: financingRatesData = [], isLoading: isLoadingRates } = useQuery<FinancingRate[]>({
    queryKey: ["/api/financing-rates"],
  });

  // Convert financing rates to bank rates format
  const managedBanks = convertFinancingRatesToBankRates(financingRatesData);
  
  // Get all available banks (managed + custom)
  const allBanks = [...managedBanks, ...customBanks];

  // Update financing rate when selected bank changes
  useEffect(() => {
    if (selectedBank && Object.keys(selectedBank.rates).length > 0) {
      // Get the first available rate from the selected bank as default
      const uniqueRates = [...new Set(Object.values(selectedBank.rates))];
      const sortedRates = uniqueRates.sort((a, b) => a - b);
      if (sortedRates.length > 0 && !formData.financingRate) {
        handleInputChange("financingRate", sortedRates[0].toString());
      }
    } else {
      // Reset financing rate if no bank selected
      if (formData.financingRate) {
        handleInputChange("financingRate", "");
      }
    }
  }, [selectedBank]);

  // Update bank rates when bank selection changes
  useEffect(() => {
    if (formData.bankName) {
      const bank = allBanks.find(b => b.name === formData.bankName);
      setSelectedBank(bank || null);
    }
  }, [formData.bankName, customBanks, managedBanks]);

  // Reset dependent fields when parent fields change
  useEffect(() => {
    if (formData.vehicleManufacturer) {
      setFormData(prev => ({
        ...prev,
        vehicleCategory: "",
        vehicleTrimLevel: "",
        vehicleExteriorColor: "",
        vehicleInteriorColor: ""
      }));
    }
  }, [formData.vehicleManufacturer]);

  useEffect(() => {
    if (formData.vehicleCategory) {
      setFormData(prev => ({
        ...prev,
        vehicleTrimLevel: "",
        vehicleExteriorColor: "",
        vehicleInteriorColor: ""
      }));
    }
  }, [formData.vehicleCategory]);

  useEffect(() => {
    if (formData.vehicleTrimLevel) {
      setFormData(prev => ({
        ...prev,
        vehicleExteriorColor: "",
        vehicleInteriorColor: ""
      }));
    }
  }, [formData.vehicleTrimLevel]);

  // Auto-update interest rate when bank and years change
  useEffect(() => {
    if (selectedBank && formData.financingYears) {
      const rate = selectedBank.rates[formData.financingYears];
      if (rate) {
        // Rate is automatically used in calculation
      }
    }
  }, [selectedBank, formData.financingYears]);

  const [selectedRateCategory, setSelectedRateCategory] = useState<string>("");
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [showSavedCalculations, setShowSavedCalculations] = useState(false);

  // Fetch saved calculations
  const { data: savedCalculations = [] } = useQuery<any[]>({
    queryKey: ["/api/financing-calculations"],
  });

  // Build a unique list of customers from saved calculations (most recent first)
  const uniqueCustomers: SavedCustomer[] = (() => {
    const seen = new Set<string>();
    const list: SavedCustomer[] = [];
    for (const calc of savedCalculations) {
      const name = (calc?.customerName || "").trim();
      const phone = (calc?.customerPhone || "").trim();
      if (!name && !phone) continue;
      if (name === "غير محدد" && !phone) continue;
      const key = `${name.toLowerCase()}|${phone.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push({
        customerName: name,
        customerPhone: phone,
        customerSalary: calc?.customerSalary?.toString() || "",
      });
    }
    return list;
  })();
   useEffect(() => {
     if (selectedBank && (selectedBank as any).rates) {
       // In this system, selectedBank.rates is actually the rates array from FinancingRate
       const rates = (selectedBank as any).rates;
       setAvailableCategories(Array.isArray(rates) ? rates : []);
       setSelectedRateCategory("");
     } else {
       setAvailableCategories([]);
     }
   }, [selectedBank]);

  const convertArabicToEnglish = (value: string): string => {
    return value
      .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
      .replace(/٫/g, "."); // Replace Arabic decimal separator with dot
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    let processedValue = value;
    
    // Convert Arabic numbers to English if the value is a string
    if (typeof value === "string") {
      processedValue = convertArabicToEnglish(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
  };

  // Bank management functions
  const handleAddBank = () => {
    if (!newBank.name.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال اسم البنك",
        variant: "destructive"
      });
      return;
    }

    const bankWithId: BankRate = {
      ...newBank,
      id: Date.now().toString()
    };

    setCustomBanks(prev => [...prev, bankWithId]);
    setNewBank({
      name: "",
      logo: "",
      rates: {
        "1": 0,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0
      }
    });
    setShowAddBankDialog(false);
    
    toast({
      title: "تم بنجاح",
      description: "تم إضافة البنك بنجاح",
    });
  };

  const handleDeleteBank = (bankId: string) => {
    setCustomBanks(prev => prev.filter(bank => bank.id !== bankId));
    toast({
      title: "تم بنجاح",
      description: "تم حذف البنك بنجاح",
    });
  };

  const handleBankRateChange = (year: string, rate: string) => {
    const processedRate = convertArabicToEnglish(rate);
    const rateValue = parseFloat(processedRate) || 0;
    setNewBank(prev => ({
      ...prev,
      rates: {
        ...prev.rates,
        [year]: rateValue
      }
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const logoUrl = event.target?.result as string;
        setNewBank(prev => ({ ...prev, logo: logoUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateFinancing = () => {
    const vehiclePrice = parseFloat(formData.vehiclePrice) || 0;
    
    // Calculate down payment based on type
    const downPaymentValue = parseFloat(formData.downPayment) || 0;
    const downPayment = formData.downPaymentType === "percentage" 
      ? (vehiclePrice * downPaymentValue) / 100 
      : downPaymentValue;

    // Calculate final payment based on type
    const finalPaymentValue = parseFloat(formData.finalPayment) || 0;
    const finalPayment = formData.finalPaymentType === "percentage" 
      ? (vehiclePrice * finalPaymentValue) / 100 
      : finalPaymentValue;

    const adminFeesValue = parseFloat(formData.administrativeFees) || 0;
    const adminFees = formData.administrativeFeesType === "percentage"
      ? (vehiclePrice * adminFeesValue) / 100
      : adminFeesValue;

    const insuranceRateInput = parseFloat(formData.insuranceRate) || 0;
    const years = parseInt(formData.financingYears) || 0;
    const months = parseInt(formData.financingMonths) || 0;
    const totalMonths = (years * 12) + months;

    if (!selectedBank || totalMonths === 0) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى اختيار البنك ومدة التمويل",
        variant: "destructive"
      });
      return;
    }

    const profitMargin = parseFloat(formData.financingRate) || 0;
    
    // Bank calculation logic (e.g., Al Rajhi):
    // 1. Monthly Profit Rate = Nominal Annual Rate / 12
    const monthlyProfitRate = (profitMargin / 100) / 12;
    
    // Total financed amount (Total amount borrowed from bank)
    const financedAmount = vehiclePrice - downPayment + adminFees;
    
    // 2. Calculate Base Monthly Installment (Principal + Profit)
    // Using standard loan formula: M = P * (r * (1+r)^n - F * r) / ((1+r)^n - 1)
    let baseMonthlyInstallment = 0;
    if (monthlyProfitRate > 0) {
      const p = financedAmount;
      const r = monthlyProfitRate;
      const n = totalMonths;
      const f = finalPayment;
      
      const numerator = (p * r * Math.pow(1 + r, n)) - (f * r);
      const denominator = Math.pow(1 + r, n) - 1;
      baseMonthlyInstallment = numerator / denominator;
    } else {
      baseMonthlyInstallment = (totalMonths > 0 ? (financedAmount - finalPayment) / totalMonths : 0);
    }

    // 3. Calculate Insurance (Distributed equally over the term)
    // Applying annual depreciation of 15% on vehicle price (matches Al Rajhi's new standard)
    let totalInsurance = 0;
    const annualInsuranceRate = insuranceRateInput / 100;
    const depreciationRate = 0.15; // Updated to 15% depreciation to match the 53,404 total in image
    
    for (let i = 0; i < years; i++) {
      totalInsurance += (vehiclePrice * Math.pow(1 - depreciationRate, i)) * annualInsuranceRate;
    }
    if (months > 0) {
      totalInsurance += (vehiclePrice * Math.pow(1 - depreciationRate, years)) * annualInsuranceRate * (months / 12);
    }
    const monthlyInsurance = totalMonths > 0 ? totalInsurance / totalMonths : 0;
    
    // 4. Total Monthly Payment (Final amount the customer pays)
    const totalMonthlyPayment = baseMonthlyInstallment + monthlyInsurance;
    
    // 5. Calculate Effective APR (Internal Rate of Return including Insurance)
    // Newton-Raphson method to solve: PV = PMT * (1 - (1+i)^-n) / i + FV * (1+i)^-n
    const calculateAPR = (loan: number, payment: number, balloon: number, n: number): number => {
      let r = 0.01; // Initial guess
      for (let i = 0; i < 20; i++) {
        const factor = Math.pow(1 + r, -n);
        const f = payment * (1 - factor) / r + balloon * factor - loan;
        const df = payment * ( (n * factor / (1 + r)) / r - (1 - factor) / (r * r) ) - n * balloon * factor / (1 + r);
        const nextR = r - f / df;
        if (Math.abs(nextR - r) < 0.000001) {
          r = nextR;
          break;
        }
        r = nextR;
      }
      // Convert monthly rate to effective annual rate: (1+r)^12 - 1
      return (Math.pow(1 + r, 12) - 1) * 100;
    };

    const effectiveAPR = calculateAPR(financedAmount, totalMonthlyPayment - monthlyInsurance + monthlyInsurance, finalPayment, totalMonths);
    
    const calculationResult: CalculationResult = {
      monthlyPayment: totalMonthlyPayment,
      totalAmount: downPayment + (totalMonthlyPayment * totalMonths) + finalPayment,
      totalInterest: (baseMonthlyInstallment * totalMonths) + finalPayment - financedAmount,
      totalInsurance,
      financedAmount,
      effectiveRate: effectiveAPR,
      downPaymentAmount: downPayment,
      downPaymentPercent: formData.downPaymentType === "percentage" ? downPaymentValue : (downPayment / vehiclePrice) * 100,
      finalPaymentAmount: finalPayment,
      finalPaymentPercent: formData.finalPaymentType === "percentage" ? finalPaymentValue : (finalPayment / vehiclePrice) * 100,
      adminFeesAmount: adminFees,
      adminFeesPercent: (adminFees / vehiclePrice) * 100
    };

    setFormData(prev => ({
      ...prev,
      financingType: "installments"
    }));

    setResult(calculationResult);
  };

  const calculateTwoPayments = () => {
    const vehiclePrice = parseFloat(formData.vehiclePrice) || 0;
    const profitMargin = parseFloat(formData.financingRate) || 0;
    const insuranceRateInput = parseFloat(formData.insuranceRate) || 0;
    const adminFeesValue = parseFloat(formData.administrativeFees) || 0;
    const years = parseInt(formData.financingYears) || 2; // Default to 2 years for 50/50 if not set

    if (vehiclePrice === 0) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال سعر السيارة",
        variant: "destructive"
      });
      return;
    }

    // 1. Calculate Total Interest (Simple interest for 50/50 plans usually)
    const totalInterest = (vehiclePrice * (profitMargin / 100)) * years;
    
    // 2. Calculate Total Insurance
    let totalInsurance = 0;
    const annualInsuranceRate = insuranceRateInput / 100;
    const depreciationRate = 0.15;
    for (let i = 0; i < years; i++) {
      totalInsurance += (vehiclePrice * Math.pow(1 - depreciationRate, i)) * annualInsuranceRate;
    }

    // 3. Calculate Administrative Fees
    const adminFees = formData.administrativeFeesType === "percentage"
      ? (vehiclePrice * adminFeesValue) / 100
      : adminFeesValue;

    // 4. Total Amount
    const totalAmount = vehiclePrice + totalInterest + totalInsurance + adminFees;
    
    // 5. Split into two payments
    const installmentAmount = totalAmount / 2;

    const calculationResult: CalculationResult = {
      monthlyPayment: installmentAmount, // We'll use this as "installment amount" in the UI
      totalAmount: totalAmount,
      totalInterest: totalInterest,
      totalInsurance: totalInsurance,
      financedAmount: vehiclePrice,
      effectiveRate: profitMargin,
      downPaymentAmount: installmentAmount,
      downPaymentPercent: 50,
      finalPaymentAmount: installmentAmount,
      finalPaymentPercent: 50,
      adminFeesAmount: adminFees,
      adminFeesPercent: (adminFees / vehiclePrice) * 100
    };

    setFormData(prev => ({
      ...prev,
      financingType: "two-payments",
      downPayment: "50",
      downPaymentType: "percentage",
      finalPayment: "50",
      finalPaymentType: "percentage"
    }));

    setResult(calculationResult);
    
    toast({
      title: "تم الحساب",
      description: "تم حساب خطة الدفعتين (50/50) بنجاح",
    });
  };

  const saveCalculationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/financing-calculations", data);
    },
    onSuccess: () => {
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ حسابات التمويل في النظام"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/financing-calculations"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحفظ",
        description: error.message || "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive"
      });
    },
  });

  // Auto-save calculation when result changes
  useEffect(() => {
    if (result) {
      const saveData = {
        customerName: formData.customerName || "عميل غير مسمى",
        customerPhone: formData.customerPhone || "",
        customerAge: formData.customerAge || "",
        customerJob: formData.customerJob || "",
        customerSalary: formData.customerSalary || "0",
        salaryTransferBank: formData.salaryTransferBank || "",
        financialCommitment: formData.financialCommitment || "0",
        commitmentType: formData.commitmentType || "",
        vehiclePrice: formData.vehiclePrice || "0",
        downPayment: formData.downPayment || "0",
        downPaymentPercentage: (formData.downPaymentType === "percentage" ? (formData.downPayment || "0") : ((parseFloat(formData.downPayment || "0") / parseFloat(formData.vehiclePrice || "1")) * 100).toString()),
        finalPayment: formData.finalPayment || "0",
        finalPaymentPercentage: (formData.finalPaymentType === "percentage" ? (formData.finalPayment || "0") : ((parseFloat(formData.finalPayment || "0") / parseFloat(formData.vehiclePrice || "1")) * 100).toString()),
        bankName: formData.bankName || "غير محدد",
        bankLogo: formData.bankLogo || "",
        interestRate: formData.financingRate || "0",
        effectiveApr: result.effectiveRate?.toString() || "0",
        financingYears: parseInt(formData.financingYears || "5"),
        administrativeFees: formData.administrativeFees || "0",
        insuranceRate: formData.insuranceRate || "0",
        monthlyPayment: result.monthlyPayment?.toString() || "0",
        totalAmount: result.totalAmount?.toString() || "0",
        totalInterest: result.totalInterest?.toString() || "0",
        totalInsurance: result.totalInsurance?.toString() || "0",
        vehicleManufacturer: formData.vehicleManufacturer || "",
        vehicleManufacturerLogo: formData.vehicleManufacturerLogo || "",
        vehicleCategory: formData.vehicleCategory || "",
        vehicleTrimLevel: formData.vehicleTrimLevel || "",
        vehicleYear: formData.vehicleYear || "",
        vehicleExteriorColor: formData.vehicleExteriorColor || "",
        vehicleInteriorColor: formData.vehicleInteriorColor || "",
        notes: formData.notes || ""
      };
      saveCalculationMutation.mutate(saveData);
    }
  }, [result]); // Trigger auto-save when calculation result is updated

  const buildPdfBlob = async (): Promise<Blob | null> => {
    if (!result) return null;

    const tempDiv = document.createElement('div');
    tempDiv.dir = "rtl";
    tempDiv.style.position = 'fixed';
    tempDiv.style.top = '0';
    tempDiv.style.left = '0';
    tempDiv.style.width = '210mm';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.zIndex = '-1000';
    
    tempDiv.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap');
        
        .pdf-container {
          font-family: 'Noto Sans Arabic', sans-serif; 
          padding: 15mm;
          line-height: 1.6;
          color: #333;
          background-color: #fff;
          width: 210mm;
          min-height: 297mm;
          box-sizing: border-box;
        }

        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #03627f;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }

        .company-logo { height: 60px; }
        .bank-logo { height: 40px; }
        .mfg-logo { height: 35px; }

        .main-title {
          text-align: center;
          font-size: 24px;
          font-weight: 900;
          color: #03627f;
          margin: 10px 0;
          border-bottom: 3px solid #C79C45;
          display: inline-block;
          padding: 0 40px 5px 40px;
        }

        .section {
          margin-bottom: 8px;
          border: 1.5px solid #03627f;
          border-radius: 12px;
          overflow: hidden;
        }

        .section-title {
          background-color: #03627f;
          padding: 5px 20px;
          font-weight: 800;
          color: #C79C45;
          font-size: 15px;
        }

        .section-content {
          padding: 8px 20px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 5px 30px;
        }

        .field {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          border-bottom: 1px solid #f3e8d2;
        }
        
        /* Hide field if value is empty or not specified */
        .field:empty, .field[data-empty="true"] {
          display: none !important;
        }

        .label {
          font-weight: 600;
          color: #03627f;
          font-size: 13px;
        }

        .value {
          font-weight: 700;
          color: #1e293b;
          font-size: 13px;
        }

        .highlight-box {
          background-color: #03627f;
          border: 2px solid #C79C45;
          color: white;
          padding: 15px;
          border-radius: 15px;
          text-align: center;
          margin: 10px 0;
        }

        .highlight-label {
          font-size: 14px;
          font-weight: 500;
          color: #C79C45;
          margin-bottom: 3px;
        }

        .highlight-value {
          font-size: 28px;
          font-weight: 900;
        }

        .disclaimer {
          background-color: #fdfaf3;
          border: 1px solid #e2d1a8;
          color: #856404;
          padding: 10px;
          border-radius: 8px;
          font-size: 10px;
          text-align: center;
          margin-top: 10px;
        }

        .footer {
          margin-top: 20px;
          border-top: 2px solid #C79C45;
          padding-top: 10px;
          font-size: 10px;
          color: #03627f;
          text-align: center;
          font-weight: 600;
        }
      </style>
      <div class="pdf-container">
        <div class="header-row">
          <div style="display: flex; align-items: center; gap: 15px;">
            <img src="${settings?.companyLogo || mainCompany?.logo || '/company-logo.svg'}" class="company-logo" />
            <div style="display: flex; flex-direction: column;">
              <div style="font-weight: 900; color: #03627f; font-size: 20px;">${settings?.companyName || "شركة البريمي للسيارات"}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 600;">التاريخ: ${new Date().toLocaleDateString('en-US')}</div>
            </div>
          </div>
          <div style="display: flex; gap: 20px; align-items: center;">
            ${formData.vehicleManufacturerLogo ? `<img src="${formData.vehicleManufacturerLogo}" class="mfg-logo" />` : ''}
            ${formData.bankLogo ? `<img src="${formData.bankLogo}" class="bank-logo" />` : ''}
          </div>
        </div>

        <div style="text-align: center;">
          <div class="main-title">${formData.financingType === 'two-payments' ? 'عرض تمويل - نظام الدفعتين (50/50)' : 'عرض تمويل سيارة تقريبي'}</div>
        </div>

        <div class="section">
          <div class="section-title">بيانات العميل</div>
          <div class="section-content">
            <div class="grid">
              <div class="field" data-empty="${!formData.customerName}"><span class="label">اسم العميل:</span><span class="value">${formData.customerName || "غير محدد"}</span></div>
              <div class="field" data-empty="${!formData.customerPhone}"><span class="label">رقم الجوال:</span><span class="value">${formData.customerPhone || "غير محدد"}</span></div>
              <div class="field" data-empty="${!formData.customerSalary}"><span class="label">الراتب الشهري:</span><span class="value">${formData.customerSalary ? formatCurrency(parseFloat(formData.customerSalary)) : "غير محدد"}</span></div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">بيانات المركبة</div>
          <div class="section-content">
            <div class="grid">
              <div class="field" data-empty="${!formData.vehicleManufacturer && !formData.vehicleCategory}"><span class="label">نوع السيارة:</span><span class="value">${formData.vehicleManufacturer} ${formData.vehicleCategory}</span></div>
              <div class="field" data-empty="${!formData.vehicleTrimLevel}"><span class="label">درجة التجهيز:</span><span class="value">${formData.vehicleTrimLevel || "غير محدد"}</span></div>
              <div class="field" data-empty="${!formData.vehicleYear}"><span class="label">الموديل:</span><span class="value">${formData.vehicleYear || "غير محدد"}</span></div>
              <div class="field" data-empty="${!formData.vehicleExteriorColor}"><span class="label">اللون الخارجي:</span><span class="value">${formData.vehicleExteriorColor || "غير محدد"}</span></div>
              <div class="field" data-empty="${!formData.vehicleInteriorColor}"><span class="label">اللون الداخلي:</span><span class="value">${formData.vehicleInteriorColor || "غير محدد"}</span></div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">التفاصيل المالية</div>
          <div class="section-content">
            <div class="grid">
              <div class="field" data-empty="${!formData.vehiclePrice}"><span class="label">سعر السيارة:</span><span class="value">${formatCurrency(parseFloat(formData.vehiclePrice))}</span></div>
              <div class="field" data-empty="${!formData.bankName}"><span class="label">البنك الممول:</span><span class="value">${formData.bankName}</span></div>
              
              ${formData.financingType === 'two-payments' ? `
                <div class="field"><span class="label">قيمة الدفعة الأولى (50%):</span><span class="value">${formatCurrency(result.downPaymentAmount)}</span></div>
                <div class="field"><span class="label">قيمة الدفعة الأخيرة (50%):</span><span class="value">${formatCurrency(result.finalPaymentAmount)}</span></div>
              ` : `
                <div class="field"><span class="label">الدفعة الأولى (${result.downPaymentPercent.toFixed(1)}%):</span><span class="value">${formatCurrency(result.downPaymentAmount)}</span></div>
                <div class="field"><span class="label">الدفعة الأخيرة (${result.finalPaymentPercent.toFixed(1)}%):</span><span class="value">${formatCurrency(result.finalPaymentAmount)}</span></div>
              `}
              
              <div class="field"><span class="label">هامش الربح السنوي:</span><span class="value">${formData.financingRate}%</span></div>
              <div class="field"><span class="label">إجمالي هامش الربح:</span><span class="value">${formatCurrency(result.totalInterest)}</span></div>
              <div class="field"><span class="label">مدة التمويل:</span><span class="value">${formData.financingYears} سنوات</span></div>
              <div class="field"><span class="label">الرسوم الإدارية (${result.adminFeesPercent.toFixed(2)}%):</span><span class="value">${formatCurrency(result.adminFeesAmount)}</span></div>
              <div class="field"><span class="label">نسبة التأمين (سنوي):</span><span class="value">${formData.insuranceRate}%</span></div>
              <div class="field"><span class="label">إجمالي مبلغ التأمين:</span><span class="value">${formatCurrency(result.totalInsurance)}</span></div>
            </div>
          </div>
        </div>

        <div class="highlight-box">
          <div class="highlight-label">${formData.financingType === 'two-payments' ? 'قيمة الدفعة الواحدة (شاملة الأرباح والتأمين والرسوم)' : 'القسط الشهري المتوقع (شامل التأمين وضريبة القيمة المضافة)'}</div>
          <div class="highlight-value">${formatCurrency(result.monthlyPayment)}</div>
        </div>

        <div class="disclaimer">
          ⚠️ ملحوظة: هذه الحسبة تقريبية ولأغراض الاسترشاد فقط، ولا تعتبر عرضاً ملزماً. النتائج النهائية تخضع لموافقة الجهة التمويلية وشروطها وأحكامها وقت التنفيذ.
        </div>

        <div class="footer">
          ${settings?.printFooter ? settings.printFooter : ''}
        </div>
      </div>
    `;

    document.body.appendChild(tempDiv);

    try {
      // Wait for fonts and images to load
      await new Promise(resolve => setTimeout(resolve, 1500));

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      const blob = pdf.output('blob');
      return blob as Blob;
    } catch (error) {
      console.error('PDF generation error:', error);
      return null;
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result) {
      toast({
        title: "لا توجد نتائج للتحميل",
        description: "يرجى إجراء الحساب أولاً",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "جاري تجهيز ملف PDF",
      description: "يرجى الانتظار لحظات...",
    });

    const blob = await buildPdfBlob();
    if (!blob) {
      toast({
        title: "خطأ في التحميل",
        description: "حدث خطأ أثناء إنشاء ملف PDF",
        variant: "destructive"
      });
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financing_offer_${formData.customerName || 'customer'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "تم التحميل بنجاح",
      description: "تم تحميل ملف PDF الخاص بعرض التمويل",
    });
  };

  const normalizeSaudiPhone = (raw: string | null | undefined): string =>
    (raw ?? "").replace(/\D/g, "").replace(/^0/, "").replace(/^966/, "");

  const buildShareTextMessage = (): string => {
    if (!result) return "";
    const monthsPart = formData.financingMonths !== "0" ? ` و ${formData.financingMonths} شهر` : "";
    return [
      `*عرض تمويل سيارة تقريبي*`,
      ``,
      `*العميل:* ${formData.customerName || "غير محدد"}`,
      `*السيارة:* ${formData.vehicleManufacturer} ${formData.vehicleCategory} ${formData.vehicleTrimLevel}`,
      `*قيمة المركبة:* ${formatCurrency(parseFloat(formData.vehiclePrice))}`,
      `*البنك:* ${formData.bankName}`,
      `*الدفعة الأولى:* ${formatCurrency(result.downPaymentAmount)} (${result.downPaymentPercent.toFixed(1)}%)`,
      `*الدفعة الأخيرة:* ${formatCurrency(result.finalPaymentAmount)} (${result.finalPaymentPercent.toFixed(1)}%)`,
      `*إجمالي الأرباح:* ${formatCurrency(result.totalInterest)}`,
      `*إجمالي التأمين:* ${formatCurrency(result.totalInsurance)}`,
      `*الرسوم الإدارية:* ${formatCurrency(result.adminFeesAmount)}`,
      `*القسط الشهري:* ${formatCurrency(result.monthlyPayment)}`,
      `*مدة التمويل:* ${formData.financingYears} سنوات${monthsPart}`,
      ``,
      `_هذه الحسبة غير أكيدة وتخضع لشروط البنك_`,
    ].join("\n");
  };

  const { data: shareUsersList = [] } = useQuery<any[]>({ queryKey: ["/api/users"] });
  const { data: shareBanksList = [] } = useQuery<any[]>({ queryKey: ["/api/banks"] });

  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareTarget, setShareTarget] = useState<"customer" | "employee" | "bank">("customer");
  const [shareFormat, setShareFormat] = useState<"pdf" | "text">("pdf");
  const [shareCustomerPhone, setShareCustomerPhone] = useState("");
  const [shareSelectedEmployee, setShareSelectedEmployee] = useState("");
  const [shareSelectedBankId, setShareSelectedBankId] = useState("");
  const [shareSelectedBankRepId, setShareSelectedBankRepId] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  const openShareDialog = () => {
    if (!result) {
      toast({
        title: "لا توجد نتائج للمشاركة",
        description: "يرجى إجراء الحساب أولاً",
        variant: "destructive",
      });
      return;
    }
    setShareCustomerPhone(normalizeSaudiPhone(formData.customerPhone));
    setShowShareDialog(true);
  };

  const resolveShareTarget = (): { phone: string; error: string } => {
    if (shareTarget === "employee") {
      const emp = (shareUsersList as any[]).find((u) => u.id.toString() === shareSelectedEmployee);
      return { phone: normalizeSaudiPhone(emp?.phoneNumber), error: "رقم جوال الموظف غير متوفر" };
    }
    if (shareTarget === "bank") {
      const rep = (shareUsersList as any[]).find((u) => u.id.toString() === shareSelectedBankRepId);
      return { phone: normalizeSaudiPhone(rep?.phoneNumber), error: "رقم جوال مندوب البنك غير متوفر" };
    }
    return { phone: normalizeSaudiPhone(shareCustomerPhone), error: "يرجى إدخال رقم العميل" };
  };

  const openWhatsApp = (phone: string, message: string) => {
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareSubmit = async () => {
    if (!result) return;

    const { phone, error } = resolveShareTarget();
    if (!phone) {
      toast({ title: "خطأ", description: error, variant: "destructive" });
      return;
    }

    setIsSharing(true);
    try {
      const textMessage = buildShareTextMessage();

      if (shareFormat === "text") {
        openWhatsApp(phone, textMessage);
        toast({ title: "تم بنجاح", description: "تم فتح الواتساب بالرسالة النصية" });
        setShowShareDialog(false);
        return;
      }

      toast({ title: "جاري تجهيز ملف PDF", description: "يرجى الانتظار لحظات..." });
      const pdfBlob = await buildPdfBlob();
      if (!pdfBlob) {
        toast({ title: "خطأ", description: "تعذر إنشاء ملف PDF", variant: "destructive" });
        return;
      }

      const fileName = `financing_offer_${formData.customerName || "customer"}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });
      const nav = navigator as any;
      const canShareFile = nav.share && nav.canShare && nav.canShare({ files: [file] });

      if (canShareFile) {
        await nav.share({
          title: `عرض تمويل - ${formData.customerName || ""}`,
          text: textMessage,
          files: [file],
        });
      } else {
        downloadBlob(pdfBlob, fileName);
        toast({
          title: "تم تحميل الملف",
          description: "يرجى إرفاق ملف PDF المحمل في محادثة الواتساب التي ستفتح الآن",
        });
        setTimeout(() => openWhatsApp(phone, textMessage), 1000);
      }

      toast({ title: "تم بنجاح", description: "تم إنشاء ومشاركة عرض التمويل" });
      setShowShareDialog(false);
    } catch (err) {
      console.error("Share error:", err);
      toast({ title: "خطأ", description: "حدث خطأ أثناء المشاركة", variant: "destructive" });
    } finally {
      setIsSharing(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <SystemGlassWrapper>
      <div className="container mx-auto p-4" dir="rtl">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <Calculator className="h-7 w-7 text-blue-400 flex-shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">حاسبة التمويل</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/financing-calculations-history">
              <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 text-white gap-2 border-white/20">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">سجل الحسابات</span>
                <span className="sm:hidden">السجل</span>
              </Button>
            </Link>
            <Link href="/financing-rates">
              <Button size="sm" className="bg-[#C79C45] hover:bg-[#B8862F] text-white gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">إدارة البنوك والنسب</span>
                <span className="sm:hidden">البنوك</span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 items-start">
        <div className="space-y-6">
          {/* Customer Information Section */}
          <Card className="glass-container">
            <CardHeader className="pb-3 border-b border-white/10">
              <CardTitle className="text-lg font-semibold text-white drop-shadow-lg flex items-center">
                <Plus className="h-5 w-5 ml-2 text-blue-400" />
                بيانات العميل
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>اسم العميل</Label>
                  <CustomerSearchInput
                    field="name"
                    value={formData.customerName}
                    onChange={(v) => handleInputChange("customerName", v)}
                    onSelectCustomer={(c) => {
                      setFormData((prev) => ({
                        ...prev,
                        customerName: c.customerName || "",
                        customerPhone: c.customerPhone || "",
                        customerSalary: c.customerSalary || "",
                      }));
                    }}
                    savedCustomers={uniqueCustomers}
                    placeholder="الاسم الثلاثي"
                    testId="input-customer-name"
                  />
                </div>
                <div>
                  <Label>رقم الجوال</Label>
                  <CustomerSearchInput
                    field="phone"
                    value={formData.customerPhone}
                    onChange={(v) => handleInputChange("customerPhone", v)}
                    onSelectCustomer={(c) => {
                      setFormData((prev) => ({
                        ...prev,
                        customerName: c.customerName || "",
                        customerPhone: c.customerPhone || "",
                        customerSalary: c.customerSalary || "",
                      }));
                    }}
                    savedCustomers={uniqueCustomers}
                    placeholder="05xxxxxxxx"
                    testId="input-customer-phone"
                  />
                </div>
                <div>
                  <Label>الراتب (ريال)</Label>
                  <Input
                    value={formData.customerSalary}
                    onChange={(e) => handleInputChange("customerSalary", e.target.value)}
                    placeholder="0.00"
                    className="bg-white/5 border-white/20 text-white"
                    data-testid="input-customer-salary"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Information Section */}
          <Card className="glass-container">
            <CardHeader className="pb-3 border-b border-white/10">
              <CardTitle className="text-lg font-semibold text-white drop-shadow-lg flex items-center">
                <Car className="h-5 w-5 ml-2 text-blue-400" />
                بيانات المركبة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Manufacturer */}
                <div>
                  <Label>الصانع</Label>
                  <Combobox
                    options={hierarchicalManufacturers.map((manufacturer: any) => ({
                      label: manufacturer.nameAr || manufacturer.name,
                      value: manufacturer.nameAr || manufacturer.name,
                      logo: manufacturer.logo
                    }))}
                    value={formData.vehicleManufacturer}
                    onValueChange={(value) => {
                      const mfg = hierarchicalManufacturers.find(m => m.nameAr === value || m.name === value);
                      setFormData(prev => ({
                        ...prev,
                        vehicleManufacturer: value,
                        vehicleManufacturerLogo: mfg?.logo || ""
                      }));
                    }}
                    placeholder="اختر الصانع"
                    searchPlaceholder="بحث عن الصانع..."
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                {/* Category */}
                <div>
                  <Label>الفئة</Label>
                  <Combobox
                    options={hierarchicalCategories.map((category: any) => ({
                      label: category.nameAr || category.name,
                      value: category.nameAr || category.name
                    }))}
                    value={formData.vehicleCategory}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      vehicleCategory: value,
                      vehicleTrimLevel: "",
                      vehicleExteriorColor: "",
                      vehicleInteriorColor: ""
                    }))}
                    disabled={!formData.vehicleManufacturer}
                    placeholder="اختر الفئة"
                    searchPlaceholder="بحث عن الفئة..."
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                {/* Trim Level */}
                <div>
                  <Label>درجة التجهيز</Label>
                  <Combobox
                    options={hierarchicalTrimLevels.map((trim: any) => ({
                      label: trim.nameAr || trim.name,
                      value: trim.nameAr || trim.name
                    }))}
                    value={formData.vehicleTrimLevel}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      vehicleTrimLevel: value,
                      vehicleExteriorColor: "",
                      vehicleInteriorColor: ""
                    }))}
                    disabled={!formData.vehicleCategory}
                    placeholder="اختر درجة التجهيز"
                    searchPlaceholder="بحث عن درجة التجهيز..."
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                {/* Model Year */}
                <div>
                  <Label>موديل السنة</Label>
                  <Combobox
                    options={Array.from({ length: 11 }, (_, i) => (new Date().getFullYear() + 1 - i).toString()).map((year) => ({
                      label: year,
                      value: year
                    }))}
                    value={formData.vehicleYear}
                    onValueChange={(value) => handleInputChange("vehicleYear", value)}
                    placeholder="اختر الموديل"
                    searchPlaceholder="بحث عن سنة..."
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                {/* Exterior Color */}
                <div>
                  <Label>اللون الخارجي</Label>
                  <Input 
                    value={formData.vehicleExteriorColor} 
                    onChange={(e) => handleInputChange("vehicleExteriorColor", e.target.value)}
                    placeholder="أدخل اللون الخارجي"
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>

                {/* Interior Color */}
                <div>
                  <Label>اللون الداخلي</Label>
                  <Input 
                    value={formData.vehicleInteriorColor} 
                    onChange={(e) => handleInputChange("vehicleInteriorColor", e.target.value)}
                    placeholder="أدخل اللون الداخلي"
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financing Information Section */}
          <Card className="glass-container">
            <CardHeader className="pb-3 border-b border-white/10">
              <CardTitle className="text-lg font-semibold text-white drop-shadow-lg flex items-center">
                <Calculator className="h-5 w-5 ml-2 text-blue-400" />
                بيانات التمويل
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
              {/* Bank Selection and Rate Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bank Selection */}
                <div>
                  <Label>اختيار البنك</Label>
                  <Combobox
                    options={allBanks.map(bank => ({
                      label: bank.name,
                      value: bank.name,
                      logo: bank.logo,
                      secondaryLabel: bank.id ? "(مُدار)" : "(مخصص)"
                    }))}
                    value={formData.bankName}
                    onValueChange={(value) => {
                      const bank = allBanks.find(b => b.name === value);
                      setFormData(prev => ({
                        ...prev,
                        bankName: value,
                        bankLogo: bank?.logo || "",
                        financingRate: ""
                      }));
                      setSelectedBank(bank || null);
                    }}
                    placeholder="اختر البنك"
                    searchPlaceholder="بحث عن بنك..."
                    className="bg-white/10 border-white/20 text-white mt-1.5"
                  />
                </div>

                {/* Financing Rate Selection */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label>فئة العميل وهامش الربح (%)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-blue-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs bg-slate-900 text-white border-blue-500/30">
                          <p className="text-xs leading-relaxed">
                            هامش الربح (Profit Margin) هو النسبة السنوية المتناقصة التي يستخدمها البنك لحساب الفائدة. يتم حساب معدل النسبة السنوي (APR) تلقائياً بناءً على إجمالي التكاليف بما فيها التأمين.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <div className="space-y-3 mt-1.5">
                    {/* Manual Input Field for Profit Margin */}
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={formData.financingRate}
                        onChange={(e) => handleInputChange("financingRate", e.target.value)}
                        placeholder="أدخل هامش الربح (مثال: 2.5)"
                        className="bg-white/10 border-white/20 text-white pl-10 h-11 focus:ring-blue-500 focus:border-blue-500 transition-all text-right"
                      />
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-blue-400 font-bold">
                        %
                      </div>
                    </div>

                    {selectedBank ? (
                      <div className="grid grid-cols-2 gap-2">
                        {availableCategories.map((rate, index) => (
                          <Button
                            key={`rate-${index}`}
                            type="button"
                            variant={selectedRateCategory === rate.rateName ? "default" : "outline"}
                            className={`h-auto py-2 px-3 text-right flex flex-col items-start gap-1 transition-all duration-200 relative ${
                              selectedRateCategory === rate.rateName
                                ? "bg-[#C79C45] hover:bg-[#B8862F] text-white border-2 border-white/50 shadow-[0_0_15px_rgba(199,156,69,0.4)]" 
                                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-[#C79C45]/50"
                            }`}
                            onClick={() => {
                              setSelectedRateCategory(rate.rateName);
                              handleInputChange("financingRate", rate.rateValue.toString());
                              if (rate.financingType) {
                                handleInputChange("financingType", rate.financingType === "installments" ? "installments" : "two-payments");
                                if (rate.financingType === "50-50") {
                                  handleInputChange("finalPayment", "50");
                                  handleInputChange("finalPaymentType", "percentage");
                                } else if (rate.financingType === "40-60") {
                                  handleInputChange("finalPayment", "60");
                                  handleInputChange("finalPaymentType", "percentage");
                                }
                              }
                            }}
                          >
                            {selectedRateCategory === rate.rateName && (
                              <div className="absolute top-1 left-1 bg-white rounded-full p-0.5">
                                <Check className="h-2 w-2 text-[#C79C45]" strokeWidth={4} />
                              </div>
                            )}
                            <span className={`text-xs font-bold ${selectedRateCategory === rate.rateName ? "text-white" : "text-[#C79C45]"}`}>{rate.rateName}</span>
                            <span className="text-sm font-black">{rate.rateValue}%</span>
                            {rate.financingType && (
                              <span className="text-[10px] opacity-70">
                                {rate.financingType === "installments" ? "أقساط" : `دفعة ${rate.financingType}`}
                              </span>
                            )}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-white/40 text-[10px] italic flex items-center gap-2">
                        <Info className="h-3 w-3" />
                        اختر البنك لعرض الفئات والنسب المتاحة تلقائياً، أو أدخل النسبة يدوياً في الحقل أعلاه.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Price and Payments Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Vehicle Price */}
                <div>
                  <Label htmlFor="vehiclePrice">سعر السيارة (ريال)</Label>
                  <Input
                    id="vehiclePrice"
                    type="text"
                    inputMode="decimal"
                    value={formData.vehiclePrice}
                    onChange={(e) => handleInputChange("vehiclePrice", e.target.value)}
                    placeholder="0"
                    className="bg-white/5 border-white/20 text-white mt-1.5"
                  />
                </div>

                {/* Down Payment */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <Label htmlFor="downPayment">الدفعة الأولى</Label>
                    <div className="flex bg-white/10 rounded-lg p-1 border border-white/20">
                      <button 
                        type="button"
                        onClick={() => handleInputChange("downPaymentType", "percentage")}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all duration-200 ${
                          formData.downPaymentType === 'percentage' 
                            ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' 
                            : 'text-white/40 hover:text-white/80'
                        }`}
                      >
                        %
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleInputChange("downPaymentType", "amount")}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all duration-200 ${
                          formData.downPaymentType === 'amount' 
                            ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' 
                            : 'text-white/40 hover:text-white/80'
                        }`}
                      >
                        ريال
                      </button>
                    </div>
                  </div>
                  <Input
                    id="downPayment"
                    type="text"
                    inputMode="decimal"
                    value={formData.downPayment}
                    onChange={(e) => handleInputChange("downPayment", e.target.value)}
                    placeholder={formData.downPaymentType === "percentage" ? "النسبة %" : "المبلغ ريال"}
                    className="bg-white/5 border-white/20 text-white h-11"
                  />
                </div>

                {/* Final Payment */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <Label htmlFor="finalPayment">الدفعة الأخيرة</Label>
                    <div className="flex bg-white/10 rounded-lg p-1 border border-white/20">
                      <button 
                        type="button"
                        onClick={() => handleInputChange("finalPaymentType", "percentage")}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all duration-200 ${
                          formData.finalPaymentType === 'percentage' 
                            ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' 
                            : 'text-white/40 hover:text-white/80'
                        }`}
                      >
                        %
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleInputChange("finalPaymentType", "amount")}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all duration-200 ${
                          formData.finalPaymentType === 'amount' 
                            ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' 
                            : 'text-white/40 hover:text-white/80'
                        }`}
                      >
                        ريال
                      </button>
                    </div>
                  </div>
                  <Input
                    id="finalPayment"
                    type="text"
                    inputMode="decimal"
                    value={formData.finalPayment}
                    onChange={(e) => handleInputChange("finalPayment", e.target.value)}
                    placeholder={formData.finalPaymentType === "percentage" ? "النسبة %" : "المبلغ ريال"}
                    className="bg-white/5 border-white/20 text-white h-11"
                  />
                </div>
              </div>

              {/* Period and Fees Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Financing Years */}
                <div>
                  <Label>مدة التمويل (سنوات)</Label>
                  <div className="grid grid-cols-5 gap-1.5 mt-1.5">
                    {["1", "2", "3", "4", "5"].map((year) => (
                      <Button
                        key={year}
                        type="button"
                        variant={formData.financingYears === year ? "default" : "outline"}
                        className={`h-11 text-xs px-0 ${
                          formData.financingYears === year 
                            ? "bg-blue-600 hover:bg-blue-700 text-white border-transparent" 
                            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                        }`}
                        onClick={() => handleInputChange("financingYears", year)}
                      >
                        {year} {parseInt(year) === 1 ? "سنة" : "سنوات"}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Administrative Fees */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <Label htmlFor="administrativeFees">الرسوم الإدارية</Label>
                    <div className="flex bg-white/5 rounded-md p-0.5 border border-white/10 scale-75 origin-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`h-6 px-2 text-[10px] ${formData.administrativeFeesType === "percentage" ? "bg-blue-600 text-white" : "text-white/60"}`}
                        onClick={() => handleInputChange("administrativeFeesType", "percentage")}
                      >
                        %
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`h-6 px-2 text-[10px] ${formData.administrativeFeesType === "amount" ? "bg-blue-600 text-white" : "text-white/60"}`}
                        onClick={() => handleInputChange("administrativeFeesType", "amount")}
                      >
                        ريال
                      </Button>
                    </div>
                  </div>
                  <Input
                    id="administrativeFees"
                    value={formData.administrativeFees}
                    onChange={(e) => handleInputChange("administrativeFees", e.target.value)}
                    placeholder={formData.administrativeFeesType === "percentage" ? "النسبة %" : "المبلغ ريال"}
                    className="bg-white/5 border-white/20 text-white h-11"
                  />
                </div>

                {/* Insurance Rate */}
                <div>
                  <Label htmlFor="insuranceRate">نسبة التأمين الشامل (%)</Label>
                  <Input
                    id="insuranceRate"
                    type="text"
                    inputMode="decimal"
                    step="0.1"
                    value={formData.insuranceRate}
                    onChange={(e) => handleInputChange("insuranceRate", e.target.value)}
                    placeholder="4.0"
                    className="bg-white/5 border-white/20 text-white mt-1.5 h-11"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Results Column */}
        <div className="space-y-6">

          {/* Results */}
          {result && (
            <Card className="glass-container overflow-hidden border-blue-500/20">
              <CardHeader className="border-b border-white/10 pb-4">
                <CardTitle className="text-xl font-bold text-white flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-blue-400" />
                    <span>نتائج التمويل</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {mainCompany?.logo && (
                      <div className="h-8 w-auto px-2 py-1 bg-white/5 rounded border border-white/10 flex items-center justify-center">
                        <img src={mainCompany.logo} alt="" className="h-full w-auto object-contain" />
                      </div>
                    )}
                    {formData.vehicleManufacturerLogo && (
                      <div className="h-8 w-8 bg-white/5 rounded border border-white/10 flex items-center justify-center p-1">
                        <img src={formData.vehicleManufacturerLogo} alt="" className="h-full w-full object-contain" />
                      </div>
                    )}
                    {formData.bankLogo && (
                      <div className="h-8 w-8 bg-white/5 rounded border border-white/10 flex items-center justify-center p-1">
                        <img src={formData.bankLogo} alt="" className="h-full w-full object-contain" />
                      </div>
                    )}
                    <div className="flex gap-2 mr-2">
                      <Link href="/financing-calculations-history">
                        <Button variant="outline" size="sm" className="bg-white/5 border-white/20 text-white">
                          <History className="h-4 w-4 ml-1" />
                          السجل
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent id="calculation-result" className="p-0">
                <div className="p-6 space-y-8">
                  {/* Customer Info Section */}
                  <div className="space-y-4">
                    <h3 className="text-blue-400 font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                      <Plus className="h-4 w-4" />
                      بيانات العميل
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                        <span className="text-white/50 text-xs">اسم العميل</span>
                        <span className="text-white font-medium text-sm" data-testid="text-customer-name">{formData.customerName || "غير محدد"}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                        <span className="text-white/50 text-xs">رقم الجوال</span>
                        <span className="text-white font-medium text-sm" data-testid="text-customer-phone">{formData.customerPhone || "غير محدد"}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                        <span className="text-white/50 text-xs">الراتب</span>
                        <span className="text-white font-medium text-sm" data-testid="text-customer-salary">{formData.customerSalary ? formatCurrency(parseFloat(formData.customerSalary)) : "غير محدد"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Info */}
                  <div className="space-y-4">
                    <h3 className="text-blue-400 font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                      <Car className="h-4 w-4" />
                      بيانات المركبة
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                        <span className="text-white/50 text-xs">المركبة</span>
                        <span className="text-white font-medium text-sm">{formData.vehicleManufacturer} {formData.vehicleCategory}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                        <span className="text-white/50 text-xs">الفئة</span>
                        <span className="text-white font-medium text-sm">{formData.vehicleTrimLevel || "غير محدد"}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                        <span className="text-white/50 text-xs">اللون الخارجي</span>
                        <span className="text-white font-medium text-sm">{formData.vehicleExteriorColor || "غير محدد"}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                        <span className="text-white/50 text-xs">اللون الداخلي</span>
                        <span className="text-white font-medium text-sm">{formData.vehicleInteriorColor || "غير محدد"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Details */}
                  <div className="space-y-4">
                    <h3 className="text-blue-400 font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                      <Calculator className="h-4 w-4" />
                      التفاصيل المالية
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                        <span className="text-white/50 text-xs">سعر السيارة</span>
                        <span className="text-white font-bold">{formatCurrency(parseFloat(formData.vehiclePrice) || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                        <div className="flex flex-col">
                          <span className="text-white/50 text-[10px]">الدفعة الأولى</span>
                          <span className="text-blue-400 text-[10px] font-bold">({result.downPaymentPercent.toFixed(1)}%)</span>
                        </div>
                        <span className="text-white font-bold">{formatCurrency(result.downPaymentAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                        <div className="flex flex-col">
                          <span className="text-white/50 text-[10px]">الدفعة الأخيرة</span>
                          <span className="text-blue-400 text-[10px] font-bold">({result.finalPaymentPercent.toFixed(1)}%)</span>
                        </div>
                        <span className="text-white font-bold">{formatCurrency(result.finalPaymentAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                        <span className="text-white/50 text-xs">البنك الممول</span>
                        <span className="text-white font-medium">{formData.bankName}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                        <span className="text-white/50 text-xs">هامش الربح</span>
                        <span className="text-white font-bold">{formData.financingRate}%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                        <span className="text-white/50 text-xs">إجمالي هامش الربح</span>
                        <span className="text-white font-bold">{formatCurrency(result.totalInterest)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                        <span className="text-white/50 text-xs">مدة التمويل</span>
                        <span className="text-white font-medium">{formData.financingYears} سنوات</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                        <div className="flex flex-col">
                          <span className="text-white/50 text-xs">الرسوم الإدارية</span>
                          <span className="text-blue-400 text-[10px] font-bold">({result.adminFeesPercent.toFixed(2)}%)</span>
                        </div>
                        <span className="text-white font-medium">{formatCurrency(result.adminFeesAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                        <span className="text-white/50 text-xs">نسبة التأمين (سنوياً)</span>
                        <span className="text-white font-medium">{formData.insuranceRate}%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                        <span className="text-white/50 text-xs">إجمالي التأمين</span>
                        <span className="text-white font-medium">{formatCurrency(result.totalInsurance)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Payment Highlight */}
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-slate-900 border border-white/10 p-8 rounded-2xl text-center">
                      <div className="text-blue-400 text-xs font-bold mb-2 uppercase tracking-widest">
                        {formData.financingType === 'two-payments' ? 'قيمة الدفعة الواحدة (شاملة الأرباح والتأمين والرسوم)' : 'القسط الشهري المتوقع'}
                      </div>
                      <div className="text-white text-5xl font-black tracking-tighter drop-shadow-md">
                        {formatCurrency(result.monthlyPayment)}
                      </div>
                      <div className="text-white/40 text-[10px] mt-2">
                        {formData.financingType === 'two-payments' ? 'قيمة الدفعة شاملة كافة التكاليف' : 'شامل ضريبة القيمة المضافة والتأمين الشامل'}
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="space-y-4">
                    <h3 className="text-white/60 font-bold text-xs uppercase tracking-wider">ملخص التكاليف الإجمالية</h3>
                    <div className="bg-white/5 rounded-xl p-5 border border-white/5 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/40">إجمالي الأرباح</span>
                        <span className="text-white font-medium">{formatCurrency(result.totalInterest)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/40">إجمالي التأمين</span>
                        <span className="text-white font-medium">{formatCurrency(result.totalInsurance)}</span>
                      </div>
                      <div className="pt-3 mt-3 border-t border-white/10 flex justify-between items-center">
                        <span className="text-white font-bold">إجمالي التكلفة النهائية</span>
                        <span className="text-[#C79C45] font-black text-2xl drop-shadow-sm">{formatCurrency(result.totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-amber-200/60 text-[10px] leading-relaxed text-center flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold">
                      <Info className="h-4 w-4" />
                      <span>تنبيه قانوني</span>
                    </div>
                    ⚠️ ملحوظة: هذه الحسبة تقريبية وغير أكيدة، وتخضع لموافقة الجهة التمويلية وشروطها وقت التنفيذ.
                  </div>

                  <div className="flex flex-wrap gap-3 no-print">
                    <Button 
                      onClick={handleDownloadPDF}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex-1 h-12 text-sm font-bold shadow-lg shadow-blue-600/20"
                      data-testid="button-download-pdf"
                    >
                      <Download className="h-4 w-4 ml-2" />
                      PDF
                    </Button>
                    <Button 
                      onClick={openShareDialog}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 h-12 text-sm font-bold shadow-lg shadow-emerald-600/20"
                      data-testid="button-open-share-dialog"
                    >
                      <Share2 className="h-4 w-4 ml-2" />
                      مشاركة
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        </div>{/* end grid wrapper */}

        {/* Share Dialog - PDF or Text → Customer / Employee / Bank Rep */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-emerald-600" />
                مشاركة نتائج الحسبة
              </DialogTitle>
            </DialogHeader>

            {(() => {
              const SHARE_EMPLOYEE_ROLES = ["salesperson", "sales_director", "inventory_manager", "admin", "seller"];
              const employees = (shareUsersList as any[]).filter((u) => SHARE_EMPLOYEE_ROLES.includes(u.role));
              const bankReps = shareSelectedBankId
                ? (shareUsersList as any[]).filter((u) => u.bankId?.toString() === shareSelectedBankId)
                : [];
              const findUserPhone = (id: string) =>
                (shareUsersList as any[]).find((u) => u.id.toString() === id)?.phoneNumber || "—";

              const formatBtnClass = (active: boolean) => (active ? "bg-blue-600 hover:bg-blue-700" : "");
              const targetBtnClass = (active: boolean) => (active ? "bg-emerald-600 hover:bg-emerald-700" : "");

              return (
                <div className="space-y-4">
                  <div>
                    <Label>صيغة المشاركة</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button
                        type="button"
                        variant={shareFormat === "pdf" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShareFormat("pdf")}
                        data-testid="button-share-format-pdf"
                        className={formatBtnClass(shareFormat === "pdf")}
                      >
                        <FileText className="h-4 w-4 ml-2" />
                        ملف PDF
                      </Button>
                      <Button
                        type="button"
                        variant={shareFormat === "text" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShareFormat("text")}
                        data-testid="button-share-format-text"
                        className={formatBtnClass(shareFormat === "text")}
                      >
                        <Type className="h-4 w-4 ml-2" />
                        رسالة نصية
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>إرسال إلى</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {([
                        { key: "customer", label: "العميل" },
                        { key: "employee", label: "موظف المعرض" },
                        { key: "bank", label: "مندوب البنك" },
                      ] as const).map(({ key, label }) => (
                        <Button
                          key={key}
                          type="button"
                          variant={shareTarget === key ? "default" : "outline"}
                          size="sm"
                          onClick={() => setShareTarget(key)}
                          data-testid={`button-share-target-${key}`}
                          className={targetBtnClass(shareTarget === key)}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {shareTarget === "customer" && (
                    <div>
                      <Label htmlFor="share-customer-phone">رقم العميل</Label>
                      <div className="flex items-center mt-1">
                        <div className="bg-gray-100 border border-l-0 rounded-l-md px-3 py-2 text-sm font-medium text-gray-700">
                          🇸🇦 +966
                        </div>
                        <Input
                          id="share-customer-phone"
                          data-testid="input-share-customer-phone"
                          placeholder="501234567"
                          value={shareCustomerPhone}
                          onChange={(e) => setShareCustomerPhone(normalizeSaudiPhone(e.target.value))}
                          className="text-left rounded-l-none border-l-0"
                        />
                      </div>
                      {formData.customerPhone && (
                        <p className="text-xs text-gray-500 mt-1">
                          رقم العميل من النموذج: {formData.customerPhone}
                        </p>
                      )}
                    </div>
                  )}

                  {shareTarget === "employee" && (
                    <div>
                      <Label htmlFor="share-employee-select">اختيار موظف المعرض</Label>
                      <Select value={shareSelectedEmployee} onValueChange={setShareSelectedEmployee}>
                        <SelectTrigger data-testid="select-share-employee">
                          <SelectValue placeholder="اختر موظف لإرسال الرسالة إليه" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.name} {user.jobTitle ? `- ${user.jobTitle}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {shareSelectedEmployee && (
                        <p className="text-xs text-gray-500 mt-2">
                          سيتم الإرسال على: {findUserPhone(shareSelectedEmployee)}
                        </p>
                      )}
                    </div>
                  )}

                  {shareTarget === "bank" && (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="share-bank-select">اختيار البنك</Label>
                        <Select
                          value={shareSelectedBankId}
                          onValueChange={(v) => {
                            setShareSelectedBankId(v);
                            setShareSelectedBankRepId("");
                          }}
                        >
                          <SelectTrigger data-testid="select-share-bank">
                            <SelectValue placeholder="اختر البنك" />
                          </SelectTrigger>
                          <SelectContent>
                            {(shareBanksList as any[]).map((b) => (
                              <SelectItem key={b.id} value={b.id.toString()}>
                                {b.bankName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {shareSelectedBankId && (
                        <div>
                          <Label htmlFor="share-bank-rep-select">اختيار مندوب البنك</Label>
                          <Select value={shareSelectedBankRepId} onValueChange={setShareSelectedBankRepId}>
                            <SelectTrigger data-testid="select-share-bank-rep">
                              <SelectValue
                                placeholder={bankReps.length ? "اختر المندوب" : "لا يوجد مناديب لهذا البنك"}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {bankReps.map((u) => (
                                <SelectItem key={u.id} value={u.id.toString()}>
                                  {u.name} {u.jobTitle ? `- ${u.jobTitle}` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {bankReps.length === 0 && (
                            <p className="text-xs text-amber-600 mt-1">
                              لا يوجد مناديب مرتبطين بهذا البنك. يمكن ربطهم من إدارة المستخدمين.
                            </p>
                          )}
                          {shareSelectedBankRepId && (
                            <p className="text-xs text-gray-500 mt-2">
                              سيتم الإرسال على: {findUserPhone(shareSelectedBankRepId)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleShareSubmit}
                      disabled={isSharing}
                      data-testid="button-send-share"
                      className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                    >
                      <MessageCircle size={16} className="ml-2" />
                      {isSharing ? "جارٍ المشاركة..." : shareFormat === "pdf" ? "إرسال PDF" : "إرسال نص"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowShareDialog(false)}
                      data-testid="button-cancel-share"
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Add Bank Dialog */}
        <Dialog open={showAddBankDialog} onOpenChange={setShowAddBankDialog}>
          <DialogContent className="glass-container max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-white drop-shadow-lg text-base">إضافة بنك جديد</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-3 p-1 text-xs">
              {/* Bank Name */}
              <div>
                <Label htmlFor="bankName" className="text-white">اسم البنك</Label>
                <Input
                  id="bankName"
                  value={newBank.name}
                  onChange={(e) => setNewBank(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="اسم البنك"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                />
              </div>

              {/* Bank Logo */}
              <div>
                <Label htmlFor="bankLogo" className="text-white">شعار البنك</Label>
                <div className="space-y-3">
                  <Input
                    id="bankLogo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="bg-white/10 border-white/20 text-white file:bg-[#C79C45] file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:text-sm"
                  />
                  {newBank.logo && (
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded border border-white/10">
                      <img src={newBank.logo} alt="معاينة الشعار" className="w-12 h-12 object-contain" />
                      <span className="text-white text-sm">تم رفع الشعار بنجاح</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Interest Rates */}
              <div>
                <Label className="text-white text-lg font-semibold">معدل النسبة السنوي (APR %)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                  {Object.entries(newBank.rates).map(([year, rate]) => (
                    <div key={year}>
                      <Label htmlFor={`rate-${year}`} className="text-white text-sm">
                        {year} {year === "1" ? "سنة" : "سنوات"}
                      </Label>
                      <Input
                        id={`rate-${year}`}
                        type="text"
                        inputMode="decimal"
                        value={rate}
                        onChange={(e) => handleBankRateChange(year, e.target.value)}
                        placeholder="0.0"
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Banks List */}
              {customBanks.length > 0 && (
                <div>
                  <Label className="text-white text-lg font-semibold">البنوك المخصصة</Label>
                  <div className="space-y-2 mt-3 max-h-40 overflow-y-auto">
                    {customBanks.map((bank) => (
                      <div key={bank.id} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                        <div className="flex items-center gap-3">
                          {bank.logo && (
                            <img src={bank.logo} alt={bank.name} className="w-8 h-8 object-contain" />
                          )}
                          <span className="text-white font-medium">{bank.name}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteBank(bank.id!)}
                          className="bg-red-500/80 hover:bg-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={() => setShowAddBankDialog(false)}
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleAddBank}
                  className="bg-[#C79C45] hover:bg-[#B8882A] text-white"
                >
                  <Plus className="h-4 w-4 ml-1" />
                  إضافة البنك
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Saved Calculations Dialog */}
        <Dialog open={showSavedCalculations} onOpenChange={setShowSavedCalculations}>
          <DialogContent className="glass-container max-w-xl max-h-[70vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white drop-shadow-lg text-base flex items-center gap-2">
                <History className="h-4 w-4 text-blue-400" />
                العمليات المحفوظة سابقا
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-3 p-1">
              {savedCalculations.length === 0 ? (
                <div className="text-center py-10 text-white/40 italic">
                  لا توجد عمليات محفوظة حالياً
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedCalculations.map((calc: any) => (
                    <Card key={calc.id} className="bg-white/5 border-white/10 hover:border-blue-500/50 transition-colors cursor-pointer group" onClick={() => {
                      // Load saved calculation back into form
                      setFormData({
                        customerName: calc.customerName,
                        customerPhone: calc.customerPhone || "",
                        customerAge: calc.customerAge || "",
                        customerJob: calc.customerJob || "",
                        customerSalary: calc.customerSalary || "",
                        salaryTransferBank: calc.salaryTransferBank || "",
                        financialCommitment: calc.financialCommitment || "",
                        commitmentType: calc.commitmentType || "",
                        vehiclePrice: calc.vehiclePrice.toString(),
                        downPayment: calc.downPayment.toString(),
                        downPaymentType: "amount",
                        finalPayment: calc.finalPayment.toString(),
                        finalPaymentType: "amount",
                        bankName: calc.bankName,
                        bankLogo: calc.bankLogo || "",
                        financingYears: calc.financingYears.toString(),
                        financingMonths: "0",
                        financingRate: calc.interestRate.toString(),
                        financingType: "installments",
                        administrativeFees: calc.administrativeFees.toString(),
                        administrativeFeesType: "amount",
                        insuranceRate: calc.insuranceRate.toString(),
                        vehicleManufacturer: calc.vehicleManufacturer || "",
                        vehicleManufacturerLogo: calc.vehicleManufacturerLogo || "",
                        vehicleCategory: calc.vehicleCategory || "",
                        vehicleTrimLevel: calc.vehicleTrimLevel || "",
                        vehicleYear: calc.vehicleYear || new Date().getFullYear().toString(),
                        vehicleExteriorColor: calc.vehicleExteriorColor || "",
                        vehicleInteriorColor: calc.vehicleInteriorColor || "",
                        notes: calc.notes || ""
                      });
                      setShowSavedCalculations(false);
                      toast({
                        title: "تم استعادة البيانات",
                        description: `تم تحميل بيانات العميل: ${calc.customerName}`,
                      });
                    }}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-white font-bold">{calc.customerName}</div>
                            <div className="text-white/40 text-[10px]">{new Date(calc.createdAt).toLocaleDateString('ar-SA')}</div>
                          </div>
                          <div className="bg-blue-600/20 text-blue-400 text-[10px] px-2 py-0.5 rounded border border-blue-500/30">
                            {calc.bankName}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-white/60">السيارة: <span className="text-white">{calc.vehicleManufacturer} {calc.vehicleCategory}</span></div>
                          <div className="text-white/60">القسط: <span className="text-green-400 font-bold">{formatCurrency(parseFloat(calc.monthlyPayment))}</span></div>
                          <div className="text-white/60">المدة: <span className="text-white">{calc.financingYears} سنوات</span></div>
                          <div className="text-white/60">الربح: <span className="text-blue-400 font-bold">{formatCurrency(parseFloat(calc.totalInterest))}</span></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SystemGlassWrapper>
  );
}