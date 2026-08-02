import { useEffect, useState } from 'react';
import { Save, X, Loader2 } from 'lucide-react';
import {
  getAccountTemplates,
  getSubLedgerTypes,
  getSubLedgerAccountTemplate,
  getAccountTemplateMaps,
  createAccountTemplateMap,
} from '@/apis/finance/financeApi';
import { useToast } from '@/hooks/useToast';
import PageCard from '@/components/shared/PageCard';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface GLAccount { AccountID: number; Code: string; Description: string; AccountType: string; }
interface SubLedgerType { SubLedgerTypeID: number; SubLedgerType: string; }
interface SLAccount { AccountID: number; AccountCode: string; AccountName: string; IsSubLedgerAccountMapped: boolean; }
interface TemplateRow { TemplateID: number; TemplateName: string; }

export default function AccountTemplateManager() {
  const { toast } = useToast();

  // Form state
  const [templateId, setTemplateId] = useState(0);
  const [templateName, setTemplateName] = useState('');
  const [glAccounts, setGlAccounts] = useState<GLAccount[]>([]);
  const [selectedGLIds, setSelectedGLIds] = useState<Set<number>>(new Set());

  // Sub Ledger section
  const [subLedgerTypes, setSubLedgerTypes] = useState<SubLedgerType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState(0);
  const [slAccounts, setSlAccounts] = useState<SLAccount[]>([]);
  const [selectedSLIds, setSelectedSLIds] = useState<Set<number>>(new Set());
  const [slLoading, setSlLoading] = useState(false);

  // Template list
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listKey, setListKey] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load GL accounts + Sub Ledger types on mount
  useEffect(() => {
    Promise.all([
      getAccountTemplates(0, 0, 'N').then((r) =>
        setGlAccounts(r?.data?.AccountList ?? [])
      ),
      getSubLedgerTypes().then((r) =>
        setSubLedgerTypes(r?.data?.SubLedgerTypeList ?? [])
      ),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load template list
  useEffect(() => {
    setListLoading(true);
    getAccountTemplateMaps(0, 1, 1, 20)
      .then((r) => setTemplates(r?.data?.TemplateList ?? r?.data?.Templates ?? []))
      .catch(() => setTemplates([]))
      .finally(() => setListLoading(false));
  }, [listKey]);

  // Load SL accounts when sub ledger type changes
  useEffect(() => {
    if (!selectedTypeId) { setSlAccounts([]); setSelectedSLIds(new Set()); return; }
    setSlLoading(true);
    getSubLedgerAccountTemplate(selectedTypeId)
      .then((r) => {
        const accs: SLAccount[] = r?.data?.Accounts ?? [];
        setSlAccounts(accs);
        setSelectedSLIds(new Set());
      })
      .catch(() => setSlAccounts([]))
      .finally(() => setSlLoading(false));
  }, [selectedTypeId]);

  const toggleGL = (id: number) => {
    setSelectedGLIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSL = (id: number) => {
    setSelectedSLIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllGL = (checked: boolean) => {
    setSelectedGLIds(checked ? new Set(glAccounts.map((a) => a.AccountID)) : new Set());
  };

  const handleReset = () => {
    setTemplateId(0);
    setTemplateName('');
    setSelectedGLIds(new Set());
    setSelectedTypeId(0);
    setSlAccounts([]);
    setSelectedSLIds(new Set());
  };

  const handleEdit = async (row: TemplateRow) => {
    // Load template details for edit
    try {
      const res = await getAccountTemplateMaps(row.TemplateID, 0, 1, 20);
      const data = res?.data;
      setTemplateId(row.TemplateID);
      setTemplateName(row.TemplateName);

      // Pre-select GL accounts
      const glIds = new Set<number>(
        (data?.GLAccounts ?? []).map((a: { GLAccountID: number }) => a.GLAccountID)
      );
      setSelectedGLIds(glIds);

      // Pre-select SL accounts
      const slData = data?.GLSLAccounts ?? [];
      if (slData.length > 0) {
        const typeId = slData[0]?.SLAccountParentID ?? 0;
        setSelectedTypeId(typeId);
        const slIds = new Set<number>(slData.map((a: { SLAccountID: number }) => a.SLAccountID));
        setSelectedSLIds(slIds);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      toast('Failed to load template.', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!templateName.trim()) {
      toast('Template Name is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        RecordState: templateId ? 2 : 1,
        TemplateID: templateId ?? 0,
        TemplateName: templateName,
        GLAccounts: Array.from(selectedGLIds).map((id) => ({
          RecordState: 1,
          GLAccountID: id,
        })),
        GLSLAccounts: Array.from(selectedSLIds).map((id) => ({
          RecordState: 1,
          SLAccountID: id,
          SLAccountParentID: selectedTypeId,
        })),
      };

      await createAccountTemplateMap(payload);
      toast(`Template ${templateId ? 'updated' : 'created'} successfully!`, 'success');
      handleReset();
      setListKey((k) => k + 1);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save template.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageCard title="Account Template">
        <div className="py-16 flex items-center justify-center gap-2 text-slate-400 text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      </PageCard>
    );
  }

  const allGLChecked = glAccounts.length > 0 && glAccounts.every((a) => selectedGLIds.has(a.AccountID));

  return (
    <PageCard title="Account Template">

      {/* Template Name */}
      <div className="mb-5">
        <label className="text-xs font-medium text-slate-600 mb-1 block">
          Template Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className="form-input max-w-sm"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="e.g. Branch Template"
        />
      </div>

      {/* GL Accounts table */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          GL Accounts
          {selectedGLIds.size > 0 && (
            <span className="ml-2 badge badge-blue text-[10px]">{selectedGLIds.size} selected</span>
          )}
        </p>
        <div className="rounded-lg border border-slate-200 overflow-hidden max-h-64 overflow-y-auto">
          <table className="w-full text-sm table-fixed">
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 w-12 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-blue-600"
                    checked={allGLChecked}
                    onChange={(e) => toggleAllGL(e.target.checked)}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/3">
                  GL Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  GL Head
                </th>
              </tr>
            </thead>
            <tbody>
              {glAccounts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400 text-sm">
                    No GL accounts available
                  </td>
                </tr>
              ) : (
                glAccounts.map((acc) => (
                  <tr
                    key={acc.AccountID}
                    onClick={() => toggleGL(acc.AccountID)}
                    className={cn(
                      'border-b border-slate-100 last:border-0 cursor-pointer transition-colors',
                      selectedGLIds.has(acc.AccountID) ? 'bg-blue-50/40' : 'hover:bg-slate-50',
                    )}
                  >
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-blue-600"
                        checked={selectedGLIds.has(acc.AccountID)}
                        onChange={() => toggleGL(acc.AccountID)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge badge-slate text-[11px]">{acc.Code}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800 font-medium">{acc.Description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom section — GL wise Sub Ledger + SL Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* Left — Sub Ledger Types (radio) */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            GL Wise Sub Ledger
          </p>
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 w-12 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Select
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Sub Ledger Type
                  </th>
                </tr>
              </thead>
              <tbody>
                {subLedgerTypes.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-slate-400 text-sm">
                      No types available
                    </td>
                  </tr>
                ) : (
                  subLedgerTypes.map((t) => (
                    <tr
                      key={t.SubLedgerTypeID}
                      onClick={() => setSelectedTypeId(t.SubLedgerTypeID)}
                      className={cn(
                        'border-b border-slate-100 last:border-0 cursor-pointer transition-colors',
                        selectedTypeId === t.SubLedgerTypeID ? 'bg-blue-50/40' : 'hover:bg-slate-50',
                      )}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="radio"
                          name="subLedgerType"
                          className="w-4 h-4 text-blue-600 border-slate-300"
                          checked={selectedTypeId === t.SubLedgerTypeID}
                          onChange={() => setSelectedTypeId(t.SubLedgerTypeID)}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-800 font-medium">
                        {t.SubLedgerType}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right — SL Accounts (checkboxes, loads when type selected) */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Category
            {selectedSLIds.size > 0 && (
              <span className="ml-2 badge badge-blue text-[10px]">{selectedSLIds.size} selected</span>
            )}
          </p>
          <div className="rounded-lg border border-slate-200 overflow-hidden max-h-64 overflow-y-auto">
            {slLoading ? (
              <div className="py-10 flex items-center justify-center gap-2 text-slate-400 text-sm">
                <Loader2 size={14} className="animate-spin" /> Loading…
              </div>
            ) : (
              <table className="w-full text-sm table-fixed">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 w-12 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Select
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/3">
                      SL Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      SL Head
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!selectedTypeId ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400 text-sm">
                        Select a Sub Ledger Type
                      </td>
                    </tr>
                  ) : slAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400 text-sm">
                        No accounts available
                      </td>
                    </tr>
                  ) : (
                    slAccounts.map((acc) => (
                      <tr
                        key={acc.AccountID}
                        onClick={() => toggleSL(acc.AccountID)}
                        className={cn(
                          'border-b border-slate-100 last:border-0 cursor-pointer transition-colors',
                          selectedSLIds.has(acc.AccountID) ? 'bg-blue-50/40' : 'hover:bg-slate-50',
                        )}
                      >
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-blue-600"
                            checked={selectedSLIds.has(acc.AccountID)}
                            onChange={() => toggleSL(acc.AccountID)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="badge badge-slate text-[11px]">{acc.AccountCode}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800 font-medium">{acc.AccountName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2 mb-8 pt-4 border-t border-slate-100">
        <Button variant="secondary" onClick={handleReset}>
          <X size={13} /> Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          <Save size={13} /> {saving ? 'Saving…' : 'Submit'}
        </Button>
      </div>

      {/* Template List */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Template List
        </p>
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>Template Name</th>
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr>
                  <td colSpan={2} className="py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                      <Loader2 size={14} className="animate-spin" /> Loading…
                    </div>
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-10 text-center text-slate-400 text-sm">
                    No templates found
                  </td>
                </tr>
              ) : (
                templates.map((t, idx) => (
                  <tr
                    key={t.TemplateID}
                    onDoubleClick={() => handleEdit(t)}
                    className="cursor-pointer"
                  >
                    <td className="text-slate-400">{idx + 1}</td>
                    <td className="font-medium text-slate-800">{t.TemplateName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </PageCard>
  );
}