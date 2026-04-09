import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={28} className="text-amber-500" />
        </div>
        <h1 className="text-6xl font-bold text-slate-200 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Page Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button onClick={() => navigate('/dashboard')}>
          <Home size={14} /> Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
