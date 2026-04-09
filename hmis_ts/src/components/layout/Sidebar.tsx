import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronDown, ChevronRight, Home, Users, Settings,
  BarChart2, Package, ShoppingCart,
} from 'lucide-react';
import { getMenus } from '@/apis/common/commonApi';
import { transformMenuData } from '@/utils/menuTransformer';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { setActiveItem } from '@/store/slices/uiSlice';
import { cn } from '@/utils/cn';
import type { MenuItem } from '@/types';

const ICON_MAP: Record<string, React.ReactNode> = {
  Home: <Home size={15} />,
  Users: <Users size={15} />,
  Settings: <Settings size={15} />,
  BarChart: <BarChart2 size={15} />,
  Package: <Package size={15} />,
  ShoppingCart: <ShoppingCart size={15} />,
};

function MenuNode({ item, level = 0 }: { item: MenuItem; level?: number }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const activeItem = useAppSelector((s) => s.ui.activeItem);
  const hasChildren = (item.children?.length ?? 0) > 0;
  const isActive = String(activeItem) === String(item.id);
  const [open, setOpen] = useState(false);

  // Auto-expand parent if a child matches the current path
  useEffect(() => {
    if (hasChildren) {
      const childMatch = (items: MenuItem[]): boolean =>
        items.some(
          (c) => c.path === location.pathname || (c.children && childMatch(c.children)),
        );
      if (childMatch(item.children!)) setOpen(true);
    }
  }, [location.pathname]);

  const handleClick = () => {
    if (hasChildren) {
      setOpen((v) => !v);
    } else if (item.path) {
      dispatch(setActiveItem(String(item.id)));
      navigate(item.path);
    }
  };

  const paddingLeft = 12 + level * 16;

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        style={{ paddingLeft }}
        className={cn(
          'flex items-center justify-between pr-3 py-2 mx-1.5 my-px rounded-lg',
          'text-[13px] cursor-pointer select-none transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-blue-300',
          isActive
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700',
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {level === 0 && item.icon && (
            <span className={cn('flex-shrink-0', isActive ? 'text-white' : 'text-slate-400')}>
              {ICON_MAP[item.icon] ?? <Package size={15} />}
            </span>
          )}
          {level > 0 && (
            <span className={cn('w-1 h-1 rounded-full flex-shrink-0', isActive ? 'bg-white' : 'bg-slate-300')} />
          )}
          <span className="truncate leading-snug">{item.label}</span>
        </div>
        {hasChildren && (
          <span className={cn('flex-shrink-0 transition-transform duration-200', open ? 'rotate-0' : '')}>
            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
        )}
      </div>

      {/* Submenu */}
      {hasChildren && (
        <div
          className={cn(
            'overflow-hidden transition-all duration-200',
            open ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          {item.children!.map((child) => (
            <MenuNode key={child.id} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);
  const [menuData, setMenuData] = useState<MenuItem[]>([]);

  useEffect(() => {
    getMenus(1, 2, 1003, 13, '0')
      .then((data) => {
        const transformed = transformMenuData(data);
        console.log('MENU PATHS:', transformed); // 👈 add this
        setMenuData(transformed);
      })
      .catch(() => setMenuData([]));
  }, []);

  return (
    <aside
      className={cn(
        'fixed left-0 top-14 bottom-0 z-40 bg-white border-r border-slate-200',
        'transition-all duration-300 ease-in-out overflow-hidden',
        sidebarOpen ? 'w-60' : 'w-0',
      )}
    >
      <div className="w-60 h-full flex flex-col overflow-y-auto overflow-x-hidden">
        {/* Sidebar header */}
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Navigation
          </p>
        </div>

        {/* Menu items */}
        <nav className="flex-1 py-2">
          {menuData.length > 0 ? (
            menuData.map((item) => <MenuNode key={item.id} item={item} />)
          ) : (
            /* Skeleton placeholders while loading */
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="mx-3 my-1 h-8 rounded-lg bg-slate-100 animate-pulse" />
            ))
          )}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100">
          <p className="text-[10px] text-slate-300 text-center">HMIS v1.0</p>
        </div>
      </div>
    </aside>
  );
}
