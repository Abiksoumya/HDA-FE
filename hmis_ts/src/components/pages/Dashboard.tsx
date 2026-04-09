import { TrendingUp, TrendingDown, Users, ShoppingCart, Package, DollarSign } from 'lucide-react';
import { useAppSelector } from '@/hooks/redux';

const STATS = [
  { label: 'Total Users', value: '1,234', change: '+12%', trend: 'up' as const, icon: Users, color: 'bg-blue-50 text-blue-600' },
  { label: 'Total Orders', value: '567', change: '+8%', trend: 'up' as const, icon: ShoppingCart, color: 'bg-emerald-50 text-emerald-600' },
  { label: 'Total Products', value: '890', change: '-3%', trend: 'down' as const, icon: Package, color: 'bg-amber-50 text-amber-600' },
  { label: 'Revenue', value: '₹45,678', change: '+15%', trend: 'up' as const, icon: DollarSign, color: 'bg-violet-50 text-violet-600' },
];

const ACTIVITY = [
  { text: 'New user registered', time: '2 minutes ago', dot: 'bg-blue-500' },
  { text: 'Department master updated', time: '15 minutes ago', dot: 'bg-emerald-500' },
  { text: 'Company record added', time: '1 hour ago', dot: 'bg-amber-500' },
  { text: 'User group configured', time: '3 hours ago', dot: 'bg-violet-500' },
];

export default function Dashboard() {
  const user = useAppSelector((s) => s.auth.user);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Welcome back{user?.login_user_full_name ? `, ${user.login_user_full_name}` : ''}! Here's what's happening.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${stat.trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
              {stat.trend === 'up' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {stat.change} this month
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {ACTIVITY.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${item.dot}`} />
              <div>
                <p className="text-sm text-slate-700">{item.text}</p>
                <p className="text-xs text-slate-400">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
