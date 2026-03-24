import { useState } from 'react';
import { Copy, Check, ExternalLink, RotateCw } from 'lucide-react';
import { formatValue, formatFieldName, isURL } from '../utils/formatters';

export function ResultTable({ result, onScanAgain }) {
  const [copied, setCopied] = useState(false);

  const handleCopyToClipboard = () => {
    const tableData = Object.entries(result.data)
      .map(([key, value]) => `${formatFieldName(key)}: ${formatValue(value)}`)
      .join('\n');

    navigator.clipboard.writeText(tableData).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const entries = Object.entries(result.data);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="bg-white border-2 border-black rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm font-bold text-black">QR Code Detected</p>
            <h2 className="text-2xl font-bold text-black">
              {result.type}
            </h2>
          </div>
          <button
            onClick={handleCopyToClipboard}
            className="bg-white hover:bg-gray-100 border-2 border-black text-black font-bold py-2 px-4 rounded transition-colors flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy
              </>
            )}
          </button>
        </div>

        <div className="bg-white rounded-lg overflow-hidden border-2 border-black">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-200 border-b-2 border-black">
                <th className="px-4 py-3 text-left font-bold text-black text-sm">
                  Field
                </th>
                <th className="px-4 py-3 text-left font-bold text-black text-sm">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([key, value], index) => {
                const formattedKey = formatFieldName(key);
                const formattedValue = formatValue(value);
                const isLink = isURL(formattedValue);

                return (
                  <tr
                    key={index}
                    className={
                      index % 2 === 0
                        ? 'bg-white border-b border-gray-300'
                        : 'bg-gray-100 border-b border-gray-300'
                    }
                  >
                    <td className="px-4 py-3 font-bold text-black text-sm">
                      {formattedKey}
                    </td>
                    <td className="px-4 py-3 text-black text-sm break-all">
                      {isLink ? (
                        <a
                          href={formattedValue}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-black underline hover:font-bold inline-flex items-center gap-1"
                        >
                          {formattedValue}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        formattedValue
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <button
        onClick={onScanAgain}
        className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 px-4 rounded transition-colors flex items-center justify-center gap-2"
      >
        <RotateCw className="w-5 h-5" />
        Scan Another QR Code
      </button>
    </div>
  );
}
