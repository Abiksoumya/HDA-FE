import { useEffect, useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { useAppSelector } from '@/hooks/redux';
import { getBranchGLAccountsForOpening, saveBranchGLAccountsOpening } from '@/apis/finance/financeApi';
import { useToast } from '@/hooks/useToast';
import PageCard from '@/components/shared/PageCard';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface GLAccount {
  BranchAccountID: number;
  AccountID: number;
  ParentAccountName: string;
  GLAccountCode: string;
  GLAccountName: string;
  GLAccountType: string;
  CurrentOpeningBalance: number;
  CurrentBalanceSign: string;
}

interface Entry { balance: number; sign: string; }

export default function OpeningGLBalanceManager() {
  const { toast } = useToast();
  const user = useAppSelector((s) => s.auth.user);
  const dept = (user as any)?.UserDepartment?.[0];
  const companyId = dept?.CompanyID ?? 0;
  const companyGroupId = dept?.CompanyGroupID ?? 0;
  const financialYearId = dept?.FinancialYearID ?? 0;

  const [accounts, setAccounts] = useState<GLAccount[]>([]);
  const [entries, setEntries] = useState<Map<number, Entry>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getBranchGLAccountsForOpening(companyId, companyGroupId, financialYearId)
      .then((r) => {
        const accs: GLAccount[] = r?.data?.GLAccounts ?? [];
        setAccounts(accs);
        const map = new Map<number, Entry>();
        accs.forEach((a) => {
          const sign = a.CurrentBalanceSign?.trim();
          map.set(a.BranchAccountID, {
            balance: a.CurrentOpeningBalance ?? 0,
            sign: sign === 'C' ? 'C' : 'D',
          });
        });
        setEntries(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getTotals = () => {
    let dr = 0, cr = 0;
    entries.forEach((e) => { if (e.sign === 'D') dr += e.balance; else cr += e.balance; });
    return { dr, cr, diff: Math.abs(dr - cr) };
  };

  const handleSubmit = async () => {
    const { dr, cr, diff } = getTotals();
    if (diff > 0.01) {
      toast(`Dr/Cr totals must be equal. Dr: ${dr.toFixed(2)}, Cr: ${cr.toFixed(2)}`, 'error');
      return;
    }
    setSaving(true);
    try {
      await saveBranchGLAccountsOpening({
        RecordState: 1,
        CompanyID: companyId,
        CompanyGroupID: companyGroupId,
        FinancialYearID: financialYearId,
        GLAccounts: Array.from(entries.entries()).map(([id, e]) => ({
          BranchAccountID: id,
          CurrentOpeningBalance: e.balance,
          CurrentBalanceSign: e.sign,
        })),
      });
      toast('GL opening balance saved successfully!', 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageCard title="Opening GL Balance">
        <div className="py-16 flex items-center justify-center gap-2 text-slate-400 text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      </PageCard>
    );
  }

  const { dr, cr, diff } = getTotals();

  return (
    <PageCard title="Opening GL Balance">
      {/* Info bar */}
      <div className="flex items-center gap-4 mb-5 p-3 rounded-lg bg-slate-50 border border-slate-200">
        <div className="text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Branch:</span>
          <select className="ml-2 form-select text-xs py-0.5 px-2 h-6 w-40" disabled>
            <option>{dept?.CompanyName}</option>
          </select>
        </div>
        <div className="w-px h-4 bg-slate-300" />
        <div className="text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Financial Year:</span>
          <span className="ml-2 font-medium text-slate-800">{dept?.YearShortName}</span>
        </div>
      </div>

      {/* Totals bar */}
      <div className="flex items-center gap-6 mb-4 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
        <span className="text-blue-600 font-semibold">Dr Total: {dr.toFixed(2)}</span>
        <span className="text-emerald-600 font-semibold">Cr Total: {cr.toFixed(2)}</span>
        <span className={cn('font-semibold', diff === 0 ? 'text-emerald-600' : 'text-red-500')}>
          Difference: {diff.toFixed(2)} {diff === 0 ? '✓' : '✗ Must be zero'}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 overflow-hidden mb-4">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-10">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/5">Group Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Account Name</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-blue-500 uppercase tracking-wide w-32">Dr.</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-500 uppercase tracking-wide w-32">Cr.</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr><td colSpan={5} className="py-10 text-center text-slate-400 text-sm">No GL accounts available</td></tr>
            ) : (
              accounts.map((acc, idx) => {
                const entry = entries.get(acc.BranchAccountID) ?? { balance: 0, sign: 'D' };
                return (
                  <tr key={acc.BranchAccountID} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">{acc.ParentAccountName}</td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-slate-800">{acc.GLAccountName}</p>
                      <p className="text-[11px] text-slate-400">{acc.GLAccountCode} · {acc.GLAccountType}</p>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <input
                        type="number"
                        className={cn('form-input w-28 text-right text-sm',
                          entry.sign === 'D' && entry.balance > 0 ? 'border-blue-300 bg-blue-50/30' : '')}
                        value={entry.sign === 'D' ? (entry.balance || '') : ''}
                        placeholder="0.00" min={0} step={0.01}
                        onChange={(e) => setEntries((prev) => {
                          const next = new Map(prev);
                          next.set(acc.BranchAccountID, { balance: Number(e.target.value), sign: 'D' });
                          return next;
                        })}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <input
                        type="number"
                        className={cn('form-input w-28 text-right text-sm',
                          entry.sign === 'C' && entry.balance > 0 ? 'border-emerald-300 bg-emerald-50/30' : '')}
                        value={entry.sign === 'C' ? (entry.balance || '') : ''}
                        placeholder="0.00" min={0} step={0.01}
                        onChange={(e) => setEntries((prev) => {
                          const next = new Map(prev);
                          next.set(acc.BranchAccountID, { balance: Number(e.target.value), sign: 'C' });
                          return next;
                        })}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={saving}>
          <Save size={13} /> {saving ? 'Saving…' : 'Submit'}
        </Button>
      </div>
    </PageCard>
  );
}