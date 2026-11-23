import { CheckCircle2, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: number;
  text: string;
  tone?: 'success' | 'info';
}

interface ToastBannerProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function ToastBanner({ toast, onDismiss }: ToastBannerProps) {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-auto"
    >
      <div className="bg-[#0E103D] text-[#F2D7EE] border border-[#A5668B] rounded-xl px-4 py-3 shadow-[0_14px_36px_-10px_rgba(14,16,61,0.45)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {toast.tone === 'info' ? (
            <Info className="w-4 h-4 text-[#F2D7EE] shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#F2D7EE] shrink-0" aria-hidden="true" />
          )}
          <span className="text-sm font-medium leading-snug text-[#FAF2F8]">
            {toast.text}
          </span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          title="Dismiss notification"
          className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg text-[#F2D7EE] hover:bg-[#69306D] transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
