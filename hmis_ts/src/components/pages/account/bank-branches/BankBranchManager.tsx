import { useState } from 'react';
import { Building2, GitBranch } from 'lucide-react';
import PageCard from '@/components/shared/PageCard';
import { cn } from '@/utils/cn';
import BankTab from './BankTab';
import BranchTab from './BranchTab';
export default function BankBranchManager() {
  const [activeTab, setActiveTab] = useState<'bank' | 'branch'>('bank');

  return (
    <PageCard title="Bank & Branches">
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('bank')}
          className={cn(
            'flex items-center gap-2 px-5 py-1.5 text-sm font-medium rounded-md transition-all duration-150',
            activeTab === 'bank'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700',
          )}
        >
          <Building2 size={14} /> Bank
        </button>
        <button
          onClick={() => setActiveTab('branch')}
          className={cn(
            'flex items-center gap-2 px-5 py-1.5 text-sm font-medium rounded-md transition-all duration-150',
            activeTab === 'branch'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700',
          )}
        >
          <GitBranch size={14} /> Branch
        </button>
      </div>

      {activeTab === 'bank' ? <BankTab /> : <BranchTab />}
    </PageCard>
  );
}