import React from 'react';
import { useAegis } from '../../context/AegisContext';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useAegis();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3">
      {toasts.map((toast) => {
        let borderColor = 'border-[#17232D]';
        let icon = <Info className="w-4 h-4 text-[#48DDF2] shrink-0" />;

        if (toast.type === 'success') {
          borderColor = 'border-[#9FE870]/40';
          icon = <CheckCircle2 className="w-4 h-4 text-[#9FE870] shrink-0" />;
        } else if (toast.type === 'warning') {
          borderColor = 'border-[#FFBF69]/40';
          icon = <AlertCircle className="w-4 h-4 text-[#FFBF69] shrink-0" />;
        } else if (toast.type === 'error') {
          borderColor = 'border-[#FF6464]/40';
          icon = <XCircle className="w-4 h-4 text-[#FF6464] shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto bg-[#111922] border ${borderColor} rounded-lg p-3 shadow-xl backdrop-blur-md flex items-start justify-between gap-3 transition-all duration-200`}
          >
            <div className="flex items-start gap-2.5">
              {icon}
              <div className="space-y-0.5">
                <h5 className="text-xs font-semibold text-[#F3F7FA]">{toast.title}</h5>
                <p className="text-[11px] text-[#8495A5] leading-relaxed">{toast.message}</p>
              </div>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-[#8495A5] hover:text-[#F3F7FA] p-0.5"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
