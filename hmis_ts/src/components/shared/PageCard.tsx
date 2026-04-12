import { cn } from '@/utils/cn';

interface PageCardProps {
  title: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  footerClassName?: string;
}

export default function PageCard({ title, actions, footer, children, className, footerClassName }: PageCardProps) {
  return (
    <div className={cn('space-y-4 animate-fade-in', className)}>
      {/* Title bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-slate-800">{title}</h1>
      </div>

      {/* Body card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        {children}
      </div>

      {/* Footer card */}
      {(footer || actions) && (
        <div className={cn(' px-5 py-3 flex items-center justify-between gap-3', footerClassName)}>
          {footer ?? actions}
        </div>
      )}
    </div>
  );
}
