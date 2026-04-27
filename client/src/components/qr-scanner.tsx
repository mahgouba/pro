import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { X, Camera, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
}

export default function QRCodeScanner({ isOpen, onClose, onScan }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const initQRScanner = async () => {
      setIsInitializing(true);
      setError(null);
      setDebugInfo('جاري تهيئة ماسح الكيو آر كود...');
      
      try {
        // Check if QR scanner can initialize
        if (!QrScanner.hasCamera()) {
          setError('لا توجد كاميرا متاحة في هذا الجهاز');
          setIsInitializing(false);
          return;
        }

        setDebugInfo('التحقق من إعدادات الكاميرا...');
        
        // Initialize QR scanner directly
        const qrScanner = new QrScanner(
          videoRef.current!,
          (result) => {
            console.log('QR Code scanned:', result.data);
            qrScanner.stop(); // Stop scanning immediately after success
            onScan(result.data);
            onClose();
          },
          {
            preferredCamera: 'environment', // Back camera first
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 5,
            returnDetailedScanResult: true,
          }
        );

        setScanner(qrScanner);
        setDebugInfo('تشغيل الكاميرا...');
        
        // Start the scanner
        await qrScanner.start();
        
        setHasPermission(true);
        setIsInitializing(false);
        setDebugInfo('ماسح الكيو آر كود جاهز للاستخدام');
        console.log('QR Scanner started successfully');

      } catch (error: any) {
        console.error('QR Scanner initialization error:', error);
        let errorMessage = 'فشل في تهيئة ماسح الكيو آر كود';
        
        if (error.name === 'NotAllowedError') {
          errorMessage = 'تم رفض الوصول للكاميرا. يرجى السماح بالوصول من إعدادات المتصفح';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'لم يتم العثور على كاميرا متاحة';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'الكاميرا قيد الاستخدام من تطبيق آخر';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = 'إعدادات الكاميرا غير متوافقة';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'المتصفح لا يدعم ماسح الكيو آر كود';
        }
        
        setError(errorMessage);
        setDebugInfo(`تفاصيل الخطأ: ${error.name || error.message}`);
        setIsInitializing(false);
      }
    };

    // Add a small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      if (videoRef.current) {
        initQRScanner();
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };

    return () => {
      // Cleanup scanner
      if (scanner) {
        try {
          scanner.stop();
          scanner.destroy();
        } catch (e) {
          console.warn('Error cleaning up scanner:', e);
        }
      }
    };
  }, [isOpen, onScan, onClose]);

  const handleClose = () => {
    if (scanner) {
      try {
        scanner.stop();
        scanner.destroy();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
      setScanner(null);
    }
    setError(null);
    setHasPermission(null);
    setDebugInfo('');
    setIsInitializing(false);
    setShowManualInput(false);
    setManualCode('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold text-gray-800 dark:text-white flex items-center justify-center gap-2">
            <Camera className="w-6 h-6" />
            مسح الكيو أر كود
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
              <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
              {debugInfo && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-2 opacity-75">
                  معلومات التشخيص: {debugInfo}
                </p>
              )}
              <div className="mt-3 space-y-2">
                <Button
                  onClick={() => {
                    // Clean up everything first
                    if (scanner) {
                      try {
                        scanner.stop();
                        scanner.destroy();
                      } catch (e) {
                        console.warn('Error stopping scanner:', e);
                      }
                      setScanner(null);
                    }
                    
                    // Clear video element
                    if (videoRef.current) {
                      videoRef.current.srcObject = null;
                      videoRef.current.style.display = 'none';
                    }
                    
                    // Reset all states
                    setError(null);
                    setHasPermission(null);
                    setDebugInfo('');
                    setIsInitializing(false);
                    
                    // Close and reopen dialog to trigger fresh initialization
                    onClose();
                    setTimeout(() => {
                      // This would need to be handled by parent component
                      console.log('Retry requested - please close and reopen scanner');
                    }, 100);
                  }}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={isInitializing}
                >
                  {isInitializing ? 'جاري المحاولة...' : 'إعادة المحاولة'}
                </Button>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p>نصائح لحل المشكلة:</p>
                  <ul className="text-right list-disc list-inside space-y-1">
                    <li>تأكد من السماح بالوصول للكاميرا عند ظهور الطلب</li>
                    <li>تحقق من أن الكاميرا غير مستخدمة من تطبيق آخر</li>
                    <li>جرب إعادة تحميل الصفحة</li>
                  </ul>
                  <Button
                    onClick={() => setShowManualInput(true)}
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    <Keyboard className="w-4 h-4 mr-2" />
                    إدخال الكود يدوياً
                  </Button>
                </div>
              </div>
            </div>
          )}

          {showManualInput && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Keyboard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-medium text-blue-800 dark:text-blue-200">إدخال يدوي للكود</h3>
              </div>
              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="أدخل رقم المركبة أو محتوى الكيو آر كود"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="text-center"
                  dir="auto"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (manualCode.trim()) {
                        onScan(manualCode.trim());
                        onClose();
                      }
                    }}
                    disabled={!manualCode.trim()}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    تأكيد
                  </Button>
                  <Button
                    onClick={() => {
                      setShowManualInput(false);
                      setManualCode('');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!error && (
            <div className="relative bg-gray-900 rounded-2xl overflow-hidden" style={{ minHeight: '320px', aspectRatio: '1' }}>
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                playsInline
                muted
                autoPlay
                style={{ 
                  display: 'block',
                  backgroundColor: '#1f2937',
                  zIndex: 1
                }}
              />
              
              {/* Loading overlay */}
              {isInitializing && (
                <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center" style={{ zIndex: 10 }}>
                  <div className="text-center space-y-4">
                    <div className="animate-spin">
                      <Camera className="w-16 h-16 mx-auto text-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-gray-700 dark:text-gray-200 font-semibold text-lg">
                        جاري تهيئة الماسح...
                      </p>
                      {debugInfo && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 max-w-xs mx-auto">
                          {debugInfo}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        يرجى السماح بالوصول للكاميرا عند طلب الإذن
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Debug info when camera is working */}
              {hasPermission && debugInfo && (
                <div className="absolute bottom-2 left-2 right-2 bg-black/50 text-white text-xs p-2 rounded text-center" style={{ zIndex: 4 }}>
                  {debugInfo}
                </div>
              )}

              {/* Scanning guide overlay */}
              {hasPermission && !isInitializing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 5 }}>
                  <div className="relative">
                    {/* Scanning frame */}
                    <div className="w-56 h-56 border-2 border-white/80 rounded-3xl shadow-2xl bg-transparent">
                      {/* Corner indicators */}
                      <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-green-400 rounded-tl-3xl"></div>
                      <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-green-400 rounded-tr-3xl"></div>
                      <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-green-400 rounded-bl-3xl"></div>
                      <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-green-400 rounded-br-3xl"></div>
                      
                      {/* Scanning line animation */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse"></div>
                    </div>
                    
                    {/* Instructions */}
                    <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
                      <p className="text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-full">
                        وجه الكاميرا نحو الكيو آر كود
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {hasPermission && !error && (
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                وجه الكاميرا نحو الكيو أر كود لمسحه
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>الماسح نشط</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700"
            >
              إلغاء
            </Button>
            {!error && !showManualInput && (
              <Button
                onClick={() => setShowManualInput(true)}
                variant="outline"
                className="flex-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-700"
              >
                <Keyboard className="w-4 h-4 mr-2" />
                إدخال يدوي
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}