import React, { forwardRef } from "react";
import { generateQuoteNumber } from "@/utils/serial-number";
import type { InventoryItem, Company, InsertQuotation } from "@shared/schema";

interface AlbarimiQuoteTemplateProps {
  vehicle: InventoryItem;
  company: Company;
  quotationData?: InsertQuotation;
  qrCodeUrl?: string;
  showWatermark?: boolean;
}

const AlbarimiQuoteTemplate = forwardRef<HTMLDivElement, AlbarimiQuoteTemplateProps>(
  ({ vehicle, company, quotationData, qrCodeUrl, showWatermark = false }, ref) => {
    const currentDate = new Date().toLocaleDateString('en-GB');
    const quotationNumber = quotationData?.quotationNumber || generateQuoteNumber();

    return (
      <div ref={ref} className="albarimi-quote-template">
        {/* Include CSS styles */}
        <style>{`
          .albarimi-quote-template {
            background: #ffffff;
            height: 842px;
            position: relative;
            overflow: hidden;
            font-family: 'Arial', sans-serif;
            direction: rtl;
            width: 595px;
            margin: 0 auto;
          }

          .footer-element {
            background: #00627f;
            width: 595px;
            height: 40px;
            position: absolute;
            left: 0px;
            top: 802px;
          }

          .footer-element-2 {
            background: #c49632;
            width: 88px;
            height: 68px;
            position: absolute;
            left: 26px;
            top: 774px;
          }

          .right-side-element-2 {
            background: #00627f;
            width: 22px;
            height: 839px;
            position: absolute;
            left: 573px;
            top: 0px;
          }

          .company-name {
            color: #000000;
            text-align: right;
            font-size: 20px;
            font-weight: 700;
            position: absolute;
            left: 147px;
            top: 23px;
            width: 275px;
            height: 62px;
            line-height: 1.4;
          }

          .quote-title {
            color: #000000;
            text-align: right;
            font-size: 12px;
            font-weight: 400;
            position: absolute;
            left: 510px;
            top: 62px;
          }

          .company-info {
            color: #000000;
            text-align: right;
            font-size: 8px;
            font-weight: 400;
            position: absolute;
          }

          .commercial-reg {
            left: 371px;
            top: 84px;
          }

          .quote-number {
            left: 544px;
            top: 83px;
          }

          .date-field {
            left: 544px;
            top: 100px;
          }

          .address-field {
            left: 544px;
            top: 117px;
          }

          .license-field {
            left: 371px;
            top: 100px;
          }

          .tax-field {
            left: 371px;
            top: 117px;
          }

          .vehicle-details {
            position: absolute;
            top: 150px;
            left: 50px;
            right: 50px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            text-align: right;
          }

          .vehicle-details h3 {
            color: #00627f;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 15px;
            border-bottom: 2px solid #c49632;
            padding-bottom: 8px;
          }

          .vehicle-specs {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 15px;
          }

          .spec-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: white;
            border-radius: 4px;
            border: 1px solid #e0e0e0;
          }

          .spec-label {
            font-weight: 600;
            color: #333;
          }

          .spec-value {
            color: #666;
            font-weight: 400;
          }

          .price-section {
            position: absolute;
            top: 450px;
            left: 50px;
            right: 50px;
            background: #00627f;
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
          }

          .price-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 10px;
          }

          .price-amount {
            font-size: 24px;
            font-weight: 700;
            color: #c49632;
          }

          .thanks-section {
            position: absolute;
            top: 600px;
            left: 50px;
            right: 50px;
            text-align: center;
            line-height: 1.6;
          }

          .thanks-word {
            color: #000000;
            font-size: 12px;
            margin-bottom: 10px;
          }

          .contact-info {
            position: absolute;
            bottom: 120px;
            left: 50px;
            right: 50px;
            text-align: center;
            color: #666;
          }

          .website-info {
            font-size: 14px;
            font-weight: 600;
            color: #00627f;
            margin-bottom: 5px;
          }

          .phone-info {
            font-size: 12px;
            color: #666;
          }

          .qr-code {
            position: absolute;
            bottom: 60px;
            left: 50px;
            width: 60px;
            height: 60px;
            border: 2px solid #c49632;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
          }

          .qr-code img {
            width: 50px;
            height: 50px;
          }

          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 48px;
            color: rgba(0, 98, 127, 0.1);
            font-weight: bold;
            z-index: 1;
            pointer-events: none;
          }

          .line-decoration {
            position: absolute;
            bottom: 40px;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(to right, #00627f, #c49632, #00627f);
          }
        `}</style>

        <div className="footer-element"></div>
        <div className="footer-element-2"></div>
        <div className="right-side-element-2"></div>

        <div className="company-name">
          {company.name || "شركة البريمي للسيارات"}
        </div>

        <div className="quote-title">عرض سعـــر</div>

        <div className="company-info commercial-reg">
          سجل تجاري رقم: {company.registrationNumber || "123456789"}
        </div>

        <div className="company-info quote-number">
          رقم: {quotationNumber}
        </div>

        <div className="company-info date-field">
          التاريخ: {currentDate}
        </div>

        <div className="company-info address-field">
          العنوان: {company.address || "المملكة العربية السعودية"}
        </div>

        <div className="company-info license-field">
          رخصة رقم: {company.licenseNumber || "987654321"}
        </div>

        <div className="company-info tax-field">
          الرقم الضريبي: {company.taxNumber || "300123456789003"}
        </div>

        {/* Vehicle Details Section */}
        <div className="vehicle-details">
          <h3>تفاصيل المركبة</h3>
          <div className="vehicle-specs">
            <div className="spec-item">
              <span className="spec-label">الصانع:</span>
              <span className="spec-value">{vehicle.manufacturer}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">الفئة:</span>
              <span className="spec-value">{vehicle.category}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">سعة المحرك:</span>
              <span className="spec-value">{String(vehicle.engineCapacity || '')}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">السنة:</span>
              <span className="spec-value">{vehicle.year}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">اللون الخارجي:</span>
              <span className="spec-value">{vehicle.exteriorColor}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">اللون الداخلي:</span>
              <span className="spec-value">{vehicle.interiorColor}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">رقم الهيكل:</span>
              <span className="spec-value">{vehicle.chassisNumber}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">الموقع:</span>
              <span className="spec-value">{vehicle.location}</span>
            </div>
          </div>
        </div>

        {/* Price Section */}
        {vehicle.price && (
          <div className="price-section">
            <div className="price-title">السعر المقترح</div>
            <div className="price-amount">
              {Number(vehicle.price).toLocaleString('ar-SA')} ريال سعودي
            </div>
          </div>
        )}

        {/* Thanks Section */}
        <div className="thanks-section">
          <div className="thanks-word">
            وتفضلوا بقبول فائق الاحترام،،،
            <br />
            {company.name || "شركة البريمي للسيارات"}
          </div>
        </div>

        {/* Contact Information */}
        <div className="contact-info">
          <div className="website-info">
            <span style={{ color: '#00627f' }}>Albarimi</span>
            <span style={{ color: '#c49632' }}>.com</span>
          </div>
          <div className="phone-info">
            @albarimi_cars | {company.phone || "920033340"}
          </div>
        </div>

        {/* Watermark */}
        {showWatermark && (
          <div className="watermark">
            {company.name || "البريمي"}
          </div>
        )}

        {/* Decorative Line */}
        <div className="line-decoration"></div>
      </div>
    );
  }
);

AlbarimiQuoteTemplate.displayName = "AlbarimiQuoteTemplate";

export default AlbarimiQuoteTemplate;