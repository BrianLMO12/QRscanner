import { useState } from 'react';
import { QrCode } from 'lucide-react';
import { QRScanner } from './components/QRScanner';
import { ResultTable } from './components/ResultTable';
import { ErrorMessage } from './components/ErrorMessage';
import { parseQRCode } from './utils/qrParser';

function App() {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [scannerKey, setScannerKey] = useState(0);

  const handleScan = (rawData) => {
    try {
      const parsed = parseQRCode(rawData);
      setScanResult(parsed);
      setError(null);
    } catch (err) {
      setError('Failed to parse QR code. Please try again.');
      setScanResult(null);
    }
  };

  const handleScanAgain = () => {
    setScanResult(null);
    setError(null);
    setScannerKey(prev => prev + 1); // Force remount of QRScanner
  };

  const handleError = (errorMsg) => {
    setError(errorMsg);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <QrCode className="w-10 h-10 text-black" />
            <h1 className="text-4xl md:text-5xl font-bold text-black">
              QR Scanner
            </h1>
          </div>
          <p className="text-black text-lg md:text-xl max-w-2xl">
            Scan QR codes instantly and view their contents in an organized table format
          </p>
        </div>

        <div className="w-full max-w-2xl">
          {error && !scanResult && (
            <div className="mb-6">
              <ErrorMessage
                message={error}
                onDismiss={() => setError(null)}
              />
            </div>
          )}

          {scanResult ? (
            <ResultTable result={scanResult} onScanAgain={handleScanAgain} />
          ) : (
            <QRScanner key={scannerKey} onScan={handleScan} onError={handleError} />
          )}
        </div>

        <div className="mt-12 text-center text-black text-sm">
          <p>Supports: JSON, vCard, WiFi, URLs, Email, Phone Numbers, and Plain Text</p>
        </div>
      </div>
    </div>
  );
}

export default App;
