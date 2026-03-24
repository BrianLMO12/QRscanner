import React, { useState } from 'react';
import QRScanner from './components/QRScanner.jsx';
import ResultTable from './components/ResultTable.jsx';
import ErrorMessage from './components/ErrorMessage.jsx';
import { parseQRContent } from './utils/qrParser.js';

function App() {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);

  const handleScan = (result) => {
    try {
      setError(null);
      const parsed = parseQRContent(result);
      setScanResult(parsed);
    } catch (err) {
      setError('Failed to parse QR content. Please try again.');
      console.error('Parse error:', err);
    }
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setScanResult(null);
  };

  const handleScanAgain = () => {
    setScanResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 md:py-8 px-2 md:px-4">
      <div className="max-w-2xl mx-auto">
        {scanResult ? (
          <ResultTable
            data={scanResult.data}
            type={scanResult.type}
            onScanAgain={handleScanAgain}
          />
        ) : (
          <QRScanner onScan={handleScan} onError={handleError} />
        )}
      </div>

      <ErrorMessage
        message={error}
        onClose={() => setError(null)}
      />
    </div>
  );
}

export default App;
