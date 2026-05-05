import React from "react";
import type { Company, InventoryItem, AppearanceSettings } from "@shared/schema";
import { getManufacturerLogo } from "@shared/manufacturer-logos";

interface QuotationTableLayoutProps {
  selectedCompany: Company | null;
  selectedVehicle: InventoryItem | null;
  appearance?: AppearanceSettings | null;
  quoteNumber: string;
  customerName: string;
  customerTitle?: string;
  validUntil: Date;
  basePrice: number;
  taxAmount: number;
  finalPrice: number;
  taxRate: number;
  notes?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily?: string;
  isInvoiceMode?: boolean;
  includeLicensePlate?: boolean;
  licensePlatePrice?: number;
}

const RiyalIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 14,
  color = "#C79C45",
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size * (1256.39 / 1124.14)}
    viewBox="0 0 1124.14 1256.39"
    fill={color}
    aria-hidden
  >
    <path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"/>
    <path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"/>
  </svg>
);

export default function QuotationTableLayout({
  selectedCompany,
  selectedVehicle,
  appearance,
  quoteNumber,
  customerName,
  customerTitle = "السادة",
  validUntil,
  basePrice,
  taxAmount,
  finalPrice,
  taxRate,
  notes,
  primaryColor,
  secondaryColor,
  accentColor,
  fontFamily = "Noto Sans Arabic",
  isInvoiceMode = false,
  includeLicensePlate = false,
  licensePlatePrice = 0,
}: QuotationTableLayoutProps) {
  const headerColor = secondaryColor || "#01637f";
  const formattedQuoteNumber = quoteNumber.replace(/\D/g, "").padStart(5, "0");

  const vehicleNameEn = [
    selectedVehicle?.manufacturer,
    selectedVehicle?.category,
    selectedVehicle?.trimLevel,
    selectedVehicle?.engineCapacity?.replace(/L$/i, ""),
  ]
    .filter(Boolean)
    .join(" ");

  const vehicleCode = selectedVehicle?.chassisNumber || "—";
  const exteriorColorName = selectedVehicle?.exteriorColor || "—";
  const interiorColorCode =
    (selectedVehicle as any)?.exteriorColorCode || (selectedVehicle as any)?.colorCode || "";
  const specsText =
    selectedVehicle?.detailedSpecifications ||
    (selectedVehicle as any)?.specifications ||
    "—";
  const warrantyText =
    notes && notes.trim().length > 0
      ? notes
      : "خمس سنوات أو 150000 كلم ايهما يسبق اولاً ( ضمان الناغي )";

  const manufacturerLogo = selectedVehicle?.manufacturer
    ? getManufacturerLogo(selectedVehicle.manufacturer)
    : null;

  const formatMoney = (n: number) =>
    Number(n || 0).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });

  const rows: { label: string; value: React.ReactNode; isMoney?: boolean; isSpecs?: boolean }[] = [
    {
      label: "نوع السيارة / رمز السيارة",
      value: (
        <div className="flex items-center justify-between gap-3">
          <span
            className="font-bold text-[14px]"
            style={{ direction: "ltr", letterSpacing: "normal" }}
          >
            {vehicleNameEn || "—"}
          </span>
          {vehicleCode && vehicleCode !== "—" && (
            <span className="text-[11px] text-gray-500 font-mono">{vehicleCode}</span>
          )}
        </div>
      ),
    },
    {
      label: "الموديل",
      value: (
        <span className="font-bold text-[14px]">{selectedVehicle?.year || "—"}</span>
      ),
    },
    {
      label: "المواصفات",
      value: (
        <div
          className="text-[11px] leading-[1.7] whitespace-pre-wrap break-words"
          style={{
            letterSpacing: "normal",
            fontFeatureSettings: '"liga" 1, "calt" 1',
          }}
        >
          {specsText}
        </div>
      ),
      isSpecs: true,
    },
    {
      label: "الضمان",
      value: <span className="text-[12px] font-semibold">{warrantyText}</span>,
    },
    {
      label: "اللون / رمز اللون",
      value: (
        <div className="flex items-center justify-between gap-3">
          <span className="font-bold text-[13px]">{exteriorColorName}</span>
          {interiorColorCode && (
            <span className="text-[11px] text-gray-500 font-mono">{interiorColorCode}</span>
          )}
        </div>
      ),
    },
    {
      label: "السعر النقدي",
      value: (
        <div className="flex items-center gap-2 justify-start">
          <span className="font-bold text-[14px] tabular-nums">{formatMoney(basePrice)}</span>
          <RiyalIcon size={14} color="#C79C45" />
        </div>
      ),
      isMoney: true,
    },
    {
      label: `قيمة الضريبة VAT ${taxRate}%`,
      value: (
        <div className="flex items-center gap-2 justify-start">
          <span className="font-bold text-[14px] tabular-nums">{formatMoney(taxAmount)}</span>
          <RiyalIcon size={14} color="#C79C45" />
        </div>
      ),
      isMoney: true,
    },
    ...(includeLicensePlate ? [{
      label: "اللوحات",
      value: (
        <div className="flex items-center gap-2 justify-start">
          <span className="font-bold text-[14px] tabular-nums">{formatMoney(licensePlatePrice)}</span>
          <RiyalIcon size={14} color="#C79C45" />
        </div>
      ),
      isMoney: true,
    }] : []),
    {
      label: "القيمة الإجمالية",
      value: (
        <div className="flex items-center gap-2 justify-start">
          <span className="font-bold text-[14px] tabular-nums">{formatMoney(finalPrice)}</span>
          <RiyalIcon size={14} color="#C79C45" />
        </div>
      ),
      isMoney: true,
    },
  ];

  return (
    <div
      className="p-[25px] flex flex-col h-full relative z-10 ml-[10px] mr-[10px]"
      style={{ direction: "rtl", fontFamily }}
    >
      {/* Top header: company logo + quote info */}
      <div
        className="flex items-start justify-between pb-3 mb-4 mt-[77px]"
      >
        <div className="flex flex-col">
          <h1
            className="text-[26px] font-black"
            style={{ color: primaryColor, letterSpacing: "normal" }}
          >
            {isInvoiceMode ? "فاتورة" : "عرض سعر"}
          </h1>
        </div>

        <div className="flex items-center gap-6 text-[11px] font-bold pt-2 ml-[115px] mr-[115px]">
          <div className="flex items-center gap-2">
            <span style={{ color: accentColor, opacity: 0.8 }}>الرقم:</span>
            <span style={{ color: primaryColor }}>{formattedQuoteNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: accentColor, opacity: 0.8 }}>التاريخ:</span>
            <span style={{ color: primaryColor }}>
              {new Date().toLocaleDateString("en-GB")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: accentColor, opacity: 0.8 }}>صالح حتى:</span>
            <span style={{ color: primaryColor }}>
              {validUntil.toLocaleDateString("en-GB")}
            </span>
          </div>
        </div>
      </div>

      {/* Customer greeting */}
      <div className="mb-1 flex items-center gap-2">
        <span className="text-[14px] font-bold" style={{ color: secondaryColor }}>
          {customerTitle} /
        </span>
        <span
          className="text-[16px] font-black underline decoration-dotted underline-offset-4"
          style={{ color: accentColor }}
        >
          {customerName || "عميلنا العزيز"}
        </span>
        <span className="text-[14px] font-bold mr-auto" style={{ color: secondaryColor }}>
          {appearance?.quotationClosingSalutation ||
            (customerTitle === "السيد" ? "الموقر" : customerTitle === "السيدة" ? "الموقرة" : "الموقرين")}
        </span>
      </div>
      {(appearance?.quotationGreeting || "تحية طيبة وبعد، يسعدنا تزويدكم بعرض السعر بناءً على طلبكم الكريم.") && (
        <div className="mb-3 text-[13px] font-medium" style={{ color: primaryColor, opacity: 0.85 }}>
          {appearance?.quotationGreeting || "تحية طيبة وبعد، يسعدنا تزويدكم بعرض السعر بناءً على طلبكم الكريم."}
        </div>
      )}

      {/* The main TABLE - 2 columns: white values on left, dark teal labels on right */}
      <div
        className="rounded-md overflow-hidden shadow-sm bg-white"
        style={{ border: "1px solid #C79C45" }}
      >
        <table
          className="w-full border-collapse"
          style={{ direction: "rtl" }}
        >
          <colgroup>
            <col style={{ width: "25%" }} />
            <col style={{ width: "75%" }} />
          </colgroup>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #C79C45" }}>
                {/* Label cell (right in RTL - dark teal background) */}
                <td
                  className="px-4 py-3 align-middle bg-[#01637f] text-[#ffffff] text-right"
                  style={{
                    borderRight: "4px solid #C79C45",
                  }}
                >
                  <span
                    className="text-[12px] font-bold"
                    style={{ letterSpacing: "normal" }}
                  >
                    {row.label}
                  </span>
                </td>
                {/* Value cell (left in RTL - white background) */}
                <td
                  className="px-4 py-3 align-middle bg-white"
                  style={{
                    minHeight: row.isSpecs ? 72 : undefined,
                    color: "#000000",
                  }}
                >
                  <div className={`${row.isMoney ? "flex justify-start" : ""}`} style={{ color: "#000000" }}>
                    {row.value}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes link at the bottom */}
      <div className="mt-4 flex justify-end">
        <a
          href="#notes"
          className="text-[13px] font-bold ml-[605px] mr-[605px] mt-[-18px] mb-[-18px] pl-[36px] pr-[36px] text-[#eb1010]"
        >
          الشروط والاحكام 
        </a>
      </div>

      {/* Notes content (if provided) */}
      {notes && notes.trim().length > 0 && (
        <div
          className="mt-2 p-3 rounded-md border bg-white text-[11px] leading-[1.7] whitespace-pre-wrap"
          style={{ borderColor: "#fecaca", color: "#374151" }}
        >
          {notes}
        </div>
      )}

      {/* Manufacturer logo (subtle, bottom-left) */}
      {manufacturerLogo && (
        <div className="absolute bottom-[40px] left-[40px] opacity-60">
          <img
            src={manufacturerLogo}
            alt={selectedVehicle?.manufacturer || ""}
            className="h-10 w-auto object-contain"
          />
        </div>
      )}
    </div>
  );
}
