import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/redux';
import { setActiveItem } from '@/store/slices/uiSlice';
import { cn } from '@/utils/cn';

interface PageCardProps {
  title: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  footerClassName?: string;
  showBackButton?: boolean; // ← add
}

export default function PageCard({
  title, actions, footer, children,
  className, footerClassName,
  showBackButton = true // ← default true
}: PageCardProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleBackToHome = () => {
    dispatch(setActiveItem(''));
    navigate('/dashboard');
  };

  return (
    <div className={cn('space-y-4 animate-fade-in', className)}>
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-slate-800">{title}</h1>
        {showBackButton && (
          <button
            type="button"
            onClick={handleBackToHome}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 hover:border-blue-200"
          >
            <Home size={13} />
            Back to Home
          </button>
        )}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        {children}
      </div>
      {(footer || actions) && (
        <div className={cn('px-5 py-3 flex items-center justify-between gap-3', footerClassName)}>
          {footer ?? actions}
        </div>
      )}
    </div>
  );
}