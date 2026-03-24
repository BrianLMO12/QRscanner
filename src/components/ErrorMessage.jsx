import { AlertCircle, X } from 'lucide-react';

export function ErrorMessage({ message, onDismiss }) {
  return (
    <div className="w-full max-w-2xl mx-auto bg-white border-l-4 border-black rounded-lg p-4 flex items-start gap-4">
      <AlertCircle className="w-6 h-6 text-black flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="font-bold text-black mb-1">Error</h3>
        <p className="text-black text-sm">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-black hover:font-bold transition-colors flex-shrink-0"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
