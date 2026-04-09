import { useState } from 'react';
import { Save, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { saveGroupCompany } from '@/apis/master/companyDepartmentApi';
import { useToast } from '@/hooks/useToast';
import PageCard from '@/components/shared/PageCard';
import { Button } from '@/components/ui/Button';
import CompanyDepartmentForm from './CompanyDepartmentForm';
import type { CompanyDeptFormValues } from '@/types';

export default function CompanyDepartmentManager() {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async (payload: CompanyDeptFormValues) => {
    setSaving(true);
    try {
      await saveGroupCompany(payload);
      toast('Company–Department mapping saved successfully!', 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save mapping.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <>
      <div />
      <div className="flex gap-2">
        <Button variant="secondary">
          <X size={13} /> Cancel
        </Button>
        <Button variant="default" type="submit" form="company-form" disabled={saving}>
          <Save size={13} /> {saving ? 'Saving…' : 'Submit'}
        </Button>
      </div>
    </>
  );

  return (
    <>
      <PageCard title="Company / Branch wise Department Mapping" footer={footer} footerClassName="border-0 shadow-none bg-transparent px-0">
        <CompanyDepartmentForm onSave={handleSave} />
      </PageCard>

      {/* Mapping list section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search bar */}
        <div className="px-4 py-3 border-b border-slate-200">
          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                <th className="px-4 py-3 w-10">#</th>
                <th className="px-4 py-3">Company / Branch</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Control Flag</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="text-center py-14 text-slate-400 text-sm">
                  No records found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">Showing 0 of 0 entries</span>
          <div className="flex items-center gap-1">
            <button
              disabled
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-slate-200 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronLeft size={13} /> Prev
            </button>
            <button className="px-2.5 py-1 text-xs rounded-md border border-primary bg-primary text-white font-medium">
              1
            </button>
            <button
              disabled
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-slate-200 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
