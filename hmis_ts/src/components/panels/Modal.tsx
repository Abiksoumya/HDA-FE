import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import type { ModalConfig } from '@/types';

interface ModalProps extends ModalConfig {
  isOpen: boolean;
  onClose: (result: boolean) => void;
}

const VARIANT_ICON = {
  primary: <Info size={20} className="text-blue-500" />,
  success: <CheckCircle size={20} className="text-emerald-500" />,
  warning: <AlertTriangle size={20} className="text-amber-500" />,
  danger: <XCircle size={20} className="text-red-500" />,
};

const VARIANT_BTN = {
  primary: 'default' as const,
  success: 'success' as const,
  warning: 'warning' as const,
  danger: 'destructive' as const,
};

export default function Modal({
  isOpen,
  onClose,
  title = 'Confirm',
  message,
  variant = 'primary',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showCancelButton = true,
  children,
}: ModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200',
            'p-6 animate-fade-in focus:outline-none',
          )}
        >
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            {VARIANT_ICON[variant]}
            <Dialog.Title className="text-base font-semibold text-slate-800 leading-snug">
              {title}
            </Dialog.Title>
            <button
              className="ml-auto text-slate-400 hover:text-slate-600 transition-colors"
              onClick={() => onClose(false)}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="text-sm text-slate-600 mb-6 leading-relaxed">
            {children ?? <p>{message ?? 'Are you sure?'}</p>}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2">
            {showCancelButton && (
              <Button variant="outline" onClick={() => onClose(false)}>
                {cancelText}
              </Button>
            )}
            <Button variant={VARIANT_BTN[variant]} onClick={() => onClose(true)}>
              {confirmText}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
