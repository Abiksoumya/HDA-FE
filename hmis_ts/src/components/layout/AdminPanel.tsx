import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import { cn } from '@/utils/cn';
import PageLoader from '@/components/shared/PageLoader';

export default function AdminPanel() {
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);

  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar />
      <Sidebar />
      <main
        className={cn(
          'pt-14 min-h-screen transition-all duration-300',
          sidebarOpen ? 'ml-60' : 'ml-0',
        )}
      >
        <div className="p-5">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
