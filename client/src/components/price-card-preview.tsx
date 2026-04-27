import type { InventoryItem } from "@shared/schema";
import { ManufacturerLogo } from "./manufacturer-logo";

interface PriceCardPreviewProps {
  vehicle: InventoryItem;
}

export function PriceCardPreview({ vehicle }: PriceCardPreviewProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US').format(price);
  };

  const calculatePricing = () => {
    const basePrice = typeof vehicle.price === 'number' ? vehicle.price : (typeof vehicle.price === 'string' ? parseFloat(vehicle.price) || 0 : 0);
    
    // تحديد نوع السعر والضريبة بناءً على نوع الاستيراد
    let showBreakdown = false;
    let vatAmount = 0;
    let totalPrice = basePrice;
    let statusText = "متاح للبيع";
    let showMileage = false;

    if (vehicle.importType === "استيراد شركة" || vehicle.importType === "استيراد شخصي") {
      showBreakdown = true;
      vatAmount = Math.round(basePrice * 0.15);
      totalPrice = basePrice + vatAmount;
    }

    if (vehicle.status === "مستعمل") {
      showMileage = true;
      statusText = "مستعمل - متاح للبيع";
    }

    return {
      basePrice,
      vatAmount,
      totalPrice,
      showBreakdown,
      statusText,
      showMileage
    };
  };

  const pricing = calculatePricing();

  return (
    <div 
      style={{
        width: '800px',
        height: '500px',
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
        borderRadius: '15px',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: '"Noto Sans Arabic", sans-serif',
        direction: 'rtl'
      }}
    >
      {/* Main Content Container */}
      <div style={{ 
        display: 'flex', 
        height: '100%',
        padding: '20px'
      }}>
        {/* Right Section - Vehicle Info and Logo */}
        <div style={{ 
          flex: 1, 
          padding: '25px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {/* Manufacturer Logo - Hide for Land Rover */}
          {vehicle.manufacturer !== "لاند روفر" && vehicle.manufacturer !== "Land Rover" && (
            <div style={{ 
              width: '200px', 
              height: '130px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 15px auto'
            }}>
              <ManufacturerLogo 
                manufacturerName={vehicle.manufacturer} 
                className="w-full h-full object-contain opacity-80"
              />
            </div>
          )}
          
          {/* Vehicle Details */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px',
            textAlign: 'center',
            marginBottom: '10px'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              gap: '12px',
              color: '#CF9B47', 
              fontSize: '48px', 
              fontWeight: 'bold',
              flexWrap: 'wrap'
            }}>
              {vehicle.category && <span>{vehicle.category}</span>}
              {vehicle.trimLevel && vehicle.trimLevel !== 'SE' && <span>{vehicle.trimLevel}</span>}
              {vehicle.engineCapacity && <span>{vehicle.engineCapacity}</span>}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ 
          width: '3px', 
          height: '160px', 
          backgroundColor: 'white', 
          borderRadius: '2px', 
          alignSelf: 'center' 
        }}></div>

        {/* Left Section - Price and Details */}
        <div style={{ 
          flex: 1, 
          padding: '25px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {/* Price Section */}
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            {pricing.showBreakdown ? (
              <div style={{ color: 'white' }}>
                {/* السعر الأساسي */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '14px', color: 'white' }}>السعر الأساسي:</span>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>
                    {formatPrice(pricing.basePrice)}
                  </span>
                </div>
                
                {/* الضريبة */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '14px', color: 'white' }}>الضريبة (15%):</span>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>
                    {formatPrice(pricing.vatAmount)}
                  </span>
                </div>
                
                {/* خط فاصل */}
                <div style={{ 
                  borderTop: '1px solid rgba(255,255,255,0.3)', 
                  margin: '8px 0'
                }}></div>
                
                {/* السعر الشامل */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>السعر الشامل:</span>
                  <span style={{ fontSize: '22px', fontWeight: 'bold', color: 'white' }}>
                    {formatPrice(pricing.totalPrice)}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                color: 'white'
              }}>
                <span style={{ fontSize: '18px', fontWeight: '600', color: 'white' }}>السعر:</span>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px' 
                }}>
                  <span style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold',
                    color: 'white',
                    marginRight: '4px'
                  }}>
                    ر.س
                  </span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                    {formatPrice(pricing.totalPrice)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <div className="bg-[#cf9b46] p-2 rounded-lg" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}>
              <span style={{ 
                color: 'white', 
                fontSize: '16px', 
                fontWeight: '600'
              }}>
                الحالة
              </span>
              <span style={{ 
                fontSize: '18px', 
                fontWeight: 'bold',
                color: 'white'
              }}>
                {pricing.statusText}
              </span>
            </div>
          </div>

          {/* Mileage for used vehicles */}
          {pricing.showMileage && (
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <div style={{ 
                color: 'white', 
                fontSize: '14px', 
                fontWeight: '600', 
                marginBottom: '4px' 
              }}>
                الممشي
              </div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: 'bold',
                color: '#FFD700'
              }}>
                {vehicle.mileage ? `${new Intl.NumberFormat('en-US').format(typeof vehicle.mileage === 'number' ? vehicle.mileage : parseInt(String(vehicle.mileage)) || 0)} كم` : "85,000 كم"}
              </div>
            </div>
          )}

          {/* Vehicle Details */}
          <div style={{ 
            fontSize: '12px', 
            color: 'rgba(255,255,255,0.8)',
            textAlign: 'center'
          }}>
            <div>السنة: {vehicle.year}</div>
            {vehicle.exteriorColor && <div>اللون الخارجي: {vehicle.exteriorColor}</div>}
            {vehicle.interiorColor && <div>اللون الداخلي: {vehicle.interiorColor}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}