import { useState, useRef, useEffect } from 'react';
import { QrCode, Camera, StopCircle, AlertCircle } from 'lucide-react';

const QRScanner = ({ onScan, onError }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [QrReaderComponent, setQrReaderComponent] = useState(null);
  const scanTimeoutRef = useRef();

  useEffect(() => {
    let active = true;
    import('react-qr-reader')
      .then((module) => {
        if (active && module?.QrReader) {
          setQrReaderComponent(() => module.QrReader);
        }
      })
      .catch((err) => {
        console.error('Failed to load QR reader', err);
        setError('Unable to load camera QR scanner on this device.');
        onError('Unable to load camera QR scanner.');
      });

    return () => {
      active = false;
    };
  }, [onError]);

  const handleStartScanning = () => {
    setIsScanning(true);
    setError(null);
    setIsLoading(true);
  };

  const handleStopScanning = () => {
    setIsScanning(false);
    setIsLoading(false);
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
  };

  const handleScan = (result) => {
    if (result?.text) {
      handleStopScanning();
      onScan(result.text);
    }
  };

  const handleError = (error) => {
    if (error?.name === 'NotAllowedError') {
      const errorMsg = 'Camera access denied. Please allow camera access to scan QR codes.';
      setError(errorMsg);
      onError(errorMsg);
      setIsScanning(false);
      setIsLoading(false);
    } else if (error?.name === 'NotFoundError') {
      const errorMsg = 'No camera found on this device.';
      setError(errorMsg);
      onError(errorMsg);
      setIsScanning(false);
      setIsLoading(false);
    } else if (!isLoading) {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {!isScanning ? (
        <div className="space-y-4">
          <div className="bg-white border-2 border-black rounded-lg p-8 text-center">
            <QrCode className="w-16 h-16 text-black mx-auto mb-4" />
            <h2 className="text-xl font-bold text-black mb-2">Scan a QR Code</h2>
            <p className="text-black text-sm mb-6">Click the button below to start scanning with your device camera</p>
            <button
              onClick={handleStartScanning}
              className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 px-4 rounded transition-colors flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Start Camera
            </button>
          </div>

          {error && (
            <div className="bg-white border-2 border-black rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-black font-bold text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-square">
            {QrReaderComponent ? (
              <QrReaderComponent
                onResult={handleScan}
                onError={handleError}
                constraints={{ facingMode: 'environment' }}
                containerStyle={{ width: '100%', height: '100%' }}
                videoContainerStyle={{ width: '100%', height: '100%' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-sm">
                Loading scanner...
              </div>
            )}
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-white border-t-black rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-white text-sm font-bold">Scanning...</p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleStopScanning}
            className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 px-4 rounded transition-colors flex items-center justify-center gap-2"
          >
            <StopCircle className="w-5 h-5" />
            Stop Camera
          </button>
        </div>
      )}
    </div>
  );
};

export default QRScanner;

