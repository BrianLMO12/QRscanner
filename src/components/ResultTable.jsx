import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { tableToCSV, getQRTypeDisplayName } from '../utils/formatters.js';

const ResultTable = ({ data, type, onScanAgain }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      const csvContent = tableToCSV(data);
      await navigator.clipboard.writeText(csvContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-in fade-in duration-300">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {getQRTypeDisplayName(type)}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Scanned content details
              </p>
            </div>
            <button
              onClick={handleCopyToClipboard}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Field
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((row, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {row.key}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 break-all">
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onScanAgain}
            className="w-full px-4 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Scan Another QR Code
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultTable;
