import { cn } from '@/utils/cn';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}

export default function FormField({ label, required, error, loading, children, className, hint }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label className="text-xs font-medium text-slate-600">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {loading ? (
        <div className="h-8 rounded-md bg-slate-100 animate-pulse" />
      ) : (
        children
      )}

      {hint && !error && <p className="text-[11px] text-slate-400">{hint}</p>}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
