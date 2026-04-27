import React from "react";
import type { Company } from "@shared/schema";

interface CompanyPDFTemplatesProps {
  company: Company;
  children: React.ReactNode;
}

export default function CompanyPDFTemplates({ company, children }: CompanyPDFTemplatesProps) {
  // تطبيق تصميم PDF حسب الشركة المختارة
  const pdfStyles = {
    // تصميم كلاسيكي للشركة الأولى
    classic: {
      headerBg: company.pdfHeaderBgColor || "#ffffff",
      headerText: company.pdfHeaderTextColor || "#000000", 
      tableHeaderBg: company.pdfTableHeaderBg || "#f8f9fa",
      tableHeaderText: company.pdfTableHeaderText || "#000000",
      tableBorderColor: company.pdfTableBorderColor || "#dee2e6",
      accentColor: company.pdfAccentColor || "#0891b2",
      fontSize: company.pdfFontSize || 12,
      fontFamily: company.pdfFontFamily || "Noto Sans Arabic",
      lineHeight: company.pdfLineHeight || "1.5",
      logoPosition: company.pdfLogoPosition || "left",
      logoSize: company.pdfLogoSize || "medium",
      showWatermark: company.pdfShowWatermark || false,
      watermarkText: company.pdfWatermarkText || "",
      showQrCode: company.pdfShowQrCode !== false,
      qrPosition: company.pdfQrPosition || "top-right",
      footerText: company.pdfFooterText || "",
      showPageNumbers: company.pdfShowPageNumbers !== false,
      marginTop: company.pdfMarginTop || 20,
      marginBottom: company.pdfMarginBottom || 20,
      marginLeft: company.pdfMarginLeft || 20,
      marginRight: company.pdfMarginRight || 20
    }
  };

  const currentTemplate = company.pdfTemplate || "classic";
  const styles = pdfStyles.classic;

  // تطبيق التصميم المخصص
  const customStyles = {
    '--pdf-header-bg': styles.headerBg,
    '--pdf-header-text': styles.headerText,
    '--pdf-table-header-bg': styles.tableHeaderBg,
    '--pdf-table-header-text': styles.tableHeaderText,
    '--pdf-table-border': styles.tableBorderColor,
    '--pdf-accent': styles.accentColor,
    '--pdf-font-size': `${styles.fontSize}px`,
    '--pdf-font-family': styles.fontFamily,
    '--pdf-line-height': styles.lineHeight,
    '--pdf-margin-top': `${styles.marginTop}px`,
    '--pdf-margin-bottom': `${styles.marginBottom}px`,
    '--pdf-margin-left': `${styles.marginLeft}px`,
    '--pdf-margin-right': `${styles.marginRight}px`
  } as React.CSSProperties;

  return (
    <div 
      className={`pdf-template-${currentTemplate} ${company.name === 'معرض نخبة البريمي للسيارات' ? 'company-one' : 'company-two'}`}
      style={customStyles}
      data-pdf-config={JSON.stringify(styles)}
    >
      {children}
    </div>
  );
}