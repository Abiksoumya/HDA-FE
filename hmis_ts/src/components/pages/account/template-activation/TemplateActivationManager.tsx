import { useEffect, useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { useAppSelector } from '@/hooks/redux';
import {
  getAccountTemplateMapOnly,
  createBranchAccount,
} from '@/apis/finance/financeApi';
import { useToast } from '@/hooks/useToast';
import PageCard from '@/components/shared/PageCard';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface Branch {
  CompanyID: number;
  Code: string;
  Description: string;
  IsBranchMapped: boolean;
}

interface Template {
  TemplateID: number;
  TemplateName: string;
  Branch: Branch[];
}

export default function TemplateActivationManager() {
  const { toast } = useToast();
  const user = useAppSelector((s) => s.auth.user);
  const dept = (user as any)?.UserDepartment?.[0];
  const financialYearId = dept?.FinancialYearID ?? 0; // ← from session, not shown in UI

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(0);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

useEffect(() => {
  getAccountTemplateMapOnly(0, 1, 20)
    .then((r) => {
      console.log('Full response:', r);        // ← add
      console.log('Template list:', r?.data?.Template); // ← add
      setTemplates(r?.data?.Template ?? []);
    })
    .catch(() => {})
    .finally(() => setLoading(false));
}, []);

  const handleTemplateChange = (templateId: number) => {
    setSelectedTemplateId(templateId);
    setSelectedBranchIds(new Set());

    const template = templates.find((t) => t.TemplateID === templateId);
    const branchList = template?.Branch ?? [];
    setBranches(branchList);

    // Pre-check already mapped branches
    setSelectedBranchIds(
      new Set(branchList.filter((b) => b.IsBranchMapped).map((b) => b.CompanyID))
    );
  };

  const toggleBranch = (companyId: number) => {
    setSelectedBranchIds((prev) => {
      const next = new Set(prev);
      next.has(companyId) ? next.delete(companyId) : next.add(companyId);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelectedBranchIds(
      checked ? new Set(branches.map((b) => b.CompanyID)) : new Set()
    );
  };

  const handleSubmit = async () => {
    if (!selectedTemplateId) {
      toast('Please select a template.', 'error');
      return;
    }
    if (selectedBranchIds.size === 0) {
      toast('Please select at least one branch.', 'error');
      return;
    }

    setSaving(true);
    try {
      await createBranchAccount({
        RecordState: 1,
        TemplateID: selectedTemplateId,
        FinancialYearID: financialYearId, // ← from session silently
        Branch: Array.from(selectedBranchIds).map((id) => ({ CompanyID: id })),
      });
      toast('Template activated successfully!', 'success');
      setSelectedTemplateId(0);
      setBranches([]);
      setSelectedBranchIds(new Set());
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to activate.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const allChecked = branches.length > 0 &&
    branches.every((b) => selectedBranchIds.has(b.CompanyID));

  if (loading) {
    return (
      <PageCard title="Template Activation">
        <div className="py-16 flex items-center justify-center gap-2 text-slate-400 text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      </PageCard>
    );
  }

  return (
    <PageCard title="Template Activation">

      {/* Template dropdown */}
      <div className="w-72 mb-6">
        <label className="text-xs font-medium text-slate-600 mb-1 block">Template</label>
        <select
          className="form-select"
          value={selectedTemplateId}
          onChange={(e) => handleTemplateChange(Number(e.target.value))}
        >
          <option value={0}>-- Select Template --</option>
          {templates.map((t) => (
            <option key={t.TemplateID} value={t.TemplateID}>{t.TemplateName}</option>
          ))}
        </select>
      </div>

      {/* Branch checkboxes */}
      {selectedTemplateId !== 0 && (
        <div className="mb-6">
          <label className="text-xs font-medium text-slate-600 mb-3 block">Branch</label>
          <div className="rounded-xl border border-slate-200 p-4 space-y-3 max-w-sm">

            {branches.length > 1 && (
              <>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-blue-600"
                    checked={allChecked}
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                  <span className="text-sm font-semibold text-slate-600">Select All</span>
                </label>
                <hr className="border-slate-100" />
              </>
            )}

            {branches.map((b) => (
              <label key={b.CompanyID} className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-blue-600"
                  checked={selectedBranchIds.has(b.CompanyID)}
                  onChange={() => toggleBranch(b.CompanyID)}
                />
                <span className={cn(
                  'text-sm',
                  b.IsBranchMapped ? 'text-emerald-600 font-medium' : 'text-slate-700',
                )}>
                  {b.Description}
                  {b.IsBranchMapped && (
                    <span className="ml-2 badge badge-green text-[10px]">Active</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={saving}>
          <Save size={13} /> {saving ? 'Saving…' : 'Submit'}
        </Button>
      </div>

    </PageCard>
  );
}