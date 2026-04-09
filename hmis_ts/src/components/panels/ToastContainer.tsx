import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { removeToast } from '@/store/slices/uiSlice';
import { cn } from '@/utils/cn';

const ICONS = {
  success: <CheckCircle size={16} className="text-emerald-600" />,
  error: <XCircle size={16} className="text-red-500" />,
  info: <Info size={16} className="text-blue-500" />,
  warning: <AlertTriangle size={16} className="text-amber-500" />,
};

const STYLES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-blue-200 bg-blue-50 text-blue-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
};

function ToastItem({ id, message, type }: { id: string; message: string; type: keyof typeof ICONS }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const t = setTimeout(() => dispatch(removeToast(id)), 4000);
    return () => clearTimeout(t);
  }, [id, dispatch]);

  return (
    <div
      className={cn(
        'flex items-start gap-2 px-4 py-3 rounded-lg border shadow-md text-sm animate-fade-in max-w-xs',
        STYLES[type],
      )}
    >
      {ICONS[type]}
      <span className="flex-1 leading-snug">{message}</span>
      <button onClick={() => dispatch(removeToast(id))} className="opacity-60 hover:opacity-100 transition-opacity mt-px">
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useAppSelector((s) => s.ui.toasts);
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem {...t} type={t.type} />
        </div>
      ))}
    </div>
  );
}
