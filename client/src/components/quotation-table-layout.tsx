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
}

const RiyalIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 14,
  color = "#1a1a1a",
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M6 4l3 16M14 4l3 16" />
    <path d="M4 10h16M4 16h16" />
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
}: QuotationTableLayoutProps) {
  const headerColor = secondaryColor || "#01637f";
  const formattedQuoteNumber = quoteNumber.replace(/\D/g, "").padStart(5, "0");

  const vehicleNameEn = [
    selectedVehicle?.manufacturer,
    selectedVehicle?.category,
    selectedVehicle?.trimLevel,
    selectedVehicle?.engineCapacity,
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
        <div className="flex items-center gap-2 justify-end">
          <RiyalIcon size={14} color="#1a1a1a" />
          <span className="font-bold text-[14px] tabular-nums">{formatMoney(basePrice)}</span>
        </div>
      ),
      isMoney: true,
    },
    {
      label: `قيمة الضريبة VAT ${taxRate}%`,
      value: (
        <div className="flex items-center gap-2 justify-end">
          <RiyalIcon size={14} color="#1a1a1a" />
          <span className="font-bold text-[14px] tabular-nums">{formatMoney(taxAmount)}</span>
        </div>
      ),
      isMoney: true,
    },
    {
      label: "القيمة الإجمالية",
      value: (
        <div className="flex items-center gap-2 justify-end">
          <RiyalIcon size={16} color="#1a1a1a" />
          <span className="font-black text-[16px] tabular-nums">
            {formatMoney(finalPrice)}
          </span>
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
        className="flex items-start justify-between border-b-2 pb-3 mb-4"
        style={{ borderColor: `${accentColor}40`, marginTop: "75px" }}
      >
        <div className="flex flex-col">
          <h1
            className="text-[26px] font-black"
            style={{ color: primaryColor, letterSpacing: "normal" }}
          >
            {isInvoiceMode ? "فاتورة" : "عرض سعر"}
          </h1>
          {appearance?.companyName && (
            <span className="text-[12px] font-bold opacity-80 mt-1" style={{ color: secondaryColor }}>
              {appearance.companyName}
            </span>
          )}
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
      <div className="mb-4 flex items-center gap-2">
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
          الموقرين
        </span>
      </div>

      {/* The main TABLE - 2 columns: white values on left, dark teal labels on right */}
      <div
        className="border rounded-md overflow-hidden shadow-sm bg-white"
        style={{ borderColor: "#d1d5db" }}
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
              <tr key={idx} style={{ borderBottom: "1px solid #d1d5db" }}>
                {/* Label cell (right in RTL - dark teal background) */}
                <td
                  className="px-4 py-3 align-middle text-center"
                  style={{
                    backgroundColor: headerColor,
                    color: "#ffffff",
                    borderLeft: "1px solid #d1d5db",
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
                  <div className={`text-center ${row.isMoney ? "flex justify-center" : ""}`} style={{ color: "#000000" }}>
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
          className="text-[13px] font-bold"
          style={{ color: "#16a34a" }}
        >
          # ملاحظات:
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
