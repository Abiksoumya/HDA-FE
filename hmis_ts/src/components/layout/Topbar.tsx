import { useNavigate } from 'react-router-dom';
import { Menu, Bell, User, LogOut, Settings } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { logout } from '@/store/slices/authSlice';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { useModal } from '@/hooks/useModal';
import { useToast } from '@/hooks/useToast';
import Modal from '@/components/panels/Modal';
import { cn } from '@/utils/cn';

export default function Topbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const { showModal, modalState, handleClose } = useModal();
  const { toast } = useToast();

  const handleLogout = async () => {
    const confirmed = await showModal({
      title: 'Confirm Logout',
      message: 'Are you sure you want to log out?',
      variant: 'danger',
      confirmText: 'Yes, Logout',
      cancelText: 'Cancel',
    });
    if (confirmed) {
      dispatch(logout());
      toast('You have been logged out.', 'info');
      navigate('/login', { replace: true });
    }
  };

  const initials = user?.login_user_full_name
    ? user.login_user_full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <>
      <Modal {...modalState} isOpen={modalState.isOpen} onClose={handleClose} />

      <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between bg-white/95 backdrop-blur border-b border-slate-200 px-4 shadow-sm">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo_hda_1.png" alt="HDA" className="h-7 w-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span className="text-sm font-semibold text-slate-700 hidden sm:block">
              Haldia Development Authority
            </span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1">
          {/* Notification bell */}
          <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
            <Bell size={17} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
          </button>

          {/* User dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-2 ml-1 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                  {initials}
                </div>
                <span className="text-sm text-slate-700 hidden sm:block max-w-[120px] truncate">
                  {user?.login_user_full_name ?? 'User'}
                </span>
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className={cn(
                  'z-[60] min-w-[200px] bg-white rounded-xl border border-slate-200 shadow-xl p-1',
                  'animate-fade-in',
                )}
                align="end"
                sideOffset={6}
              >
                {/* User info */}
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {user?.login_user_full_name ?? 'User'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{String(user?.email ?? '')}</p>
                </div>

                <DropdownMenu.Item
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 hover:text-slate-800 outline-none transition-colors"
                >
                  <User size={14} /> Profile
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 hover:text-slate-800 outline-none transition-colors"
                >
                  <Settings size={14} /> Settings
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="my-1 h-px bg-slate-100" />

                <DropdownMenu.Item
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-lg cursor-pointer hover:bg-red-50 outline-none transition-colors"
                  onSelect={handleLogout}
                >
                  <LogOut size={14} /> Logout
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </header>
    </>
  );
}
