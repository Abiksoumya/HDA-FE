import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getBanks, getBankBranches } from '@/apis/finance/financeApi';
import FormField from '@/components/shared/FormField';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import type { SubLedgerFormData, SubLedgerBank } from '@/types';

interface Props {
  form: SubLedgerFormData;
  updateField: <K extends keyof SubLedgerFormData>(field: K, value: SubLedgerFormData[K]) => void;
}

interface BankOption { BankID: number; BankName: string; }
interface BranchOption { BranchID: number; BranchName: string; BranchCode: string; IFSCCode: string; MICRCode: string; Address: string; }

const emptyRow: SubLedgerBank = {
  SubLedgerBankID: 0,
  RecordState: 1,
  BankID: 0,
  BranchID: 0,
  BankAccountNo: '',
  BankAccountName: '',
  IsActive: false,
};

export default function BankDetailsTab({ form, updateField }: Props) {
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [branchesByBank, setBranchesByBank] = useState<Record<number, BranchOption[]>>({});
  const [draft, setDraft] = useState<SubLedgerBank>(emptyRow);

  useEffect(() => {
    getBanks(1).then((r) => setBanks(r?.data?.BankList ?? [])).catch(() => {});
  }, []);

  const loadBranches = async (bankId: number) => {
    if (branchesByBank[bankId]) return;
    try {
      const r = await getBankBranches(bankId);
      setBranchesByBank((prev) => ({ ...prev, [bankId]: r?.data?.BankBranchList ?? [] }));
    } catch {
      setBranchesByBank((prev) => ({ ...prev, [bankId]: [] }));
    }
  };

  const handleAddRow = () => {
    if (!draft.BankID || !draft.BranchID || !draft.BankAccountNo) return;

    // Relier (IsActive) constraint — only one bank can be active at a time
    const newRow = { ...draft };
    let updatedBanks = [...form.Banks, newRow];
    if (newRow.IsActive) {
      updatedBanks = updatedBanks.map((b, i) =>
        i === updatedBanks.length - 1 ? b : { ...b, IsActive: false }
      );
    }

    updateField('Banks', updatedBanks);
    setDraft(emptyRow);
  };

  const handleRemoveRow = (index: number) => {
    updateField('Banks', form.Banks.filter((_, i) => i !== index));
  };

  const handleSetActive = (index: number) => {
    updateField('Banks', form.Banks.map((b, i) => ({ ...b, IsActive: i === index })));
  };

  const getBankName = (bankId: number) => banks.find((b) => b.BankID === bankId)?.BankName ?? '';
  const getBranchInfo = (bankId: number, branchId: number) =>
    (branchesByBank[bankId] ?? []).find((b) => b.BranchID === branchId);

  return (
    <div className="space-y-5">
      {/* Draft entry row */}
      <div className="rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Add Bank Detail</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
          <FormField label="Bank Name">
            <select
              className="form-select"
              value={draft.BankID}
              onChange={(e) => {
                const bankId = Number(e.target.value);
                setDraft((d) => ({ ...d, BankID: bankId, BranchID: 0 }));
                if (bankId) loadBranches(bankId);
              }}
            >
              <option value={0}>-- Select --</option>
              {banks.map((b) => (
                <option key={b.BankID} value={b.BankID}>{b.BankName}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Branch">
            <select
              className="form-select"
              value={draft.BranchID}
              disabled={!draft.BankID}
              onChange={(e) => setDraft((d) => ({ ...d, BranchID: Number(e.target.value) }))}
            >
              <option value={0}>-- Select --</option>
              {(branchesByBank[draft.BankID] ?? []).map((b) => (
                <option key={b.BranchID} value={b.BranchID}>{b.BranchName} ({b.BranchCode})</option>
              ))}
            </select>
          </FormField>
          <FormField label="Account No">
            <input
              type="text"
              className="form-input"
              value={draft.BankAccountNo}
              onChange={(e) => setDraft((d) => ({ ...d, BankAccountNo: e.target.value }))}
              placeholder="Account number"
            />
          </FormField>
          <FormField label="Account Name">
            <input
              type="text"
              className="form-input"
              value={draft.BankAccountName}
              onChange={(e) => setDraft((d) => ({ ...d, BankAccountName: e.target.value }))}
              placeholder="Account holder name"
            />
          </FormField>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 text-blue-600"
              checked={draft.IsActive}
              onChange={(e) => setDraft((d) => ({ ...d, IsActive: e.target.checked }))}
            />
            <span className="text-sm text-slate-700 font-medium">Relier (use this account)</span>
          </label>
          <Button type="button" size="sm" onClick={handleAddRow}>
            <Plus size={13} /> Add Bank
          </Button>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">N.B. Only one bank can remain Relier at a time</p>
      </div>

      {/* Added banks table */}
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Bank Name</th>
              <th>Branch</th>
              <th>Address</th>
              <th>Account No</th>
              <th>IFSC</th>
              <th className="text-center">Relier</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {form.Banks.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-slate-400 text-sm">No bank details added</td></tr>
            ) : (
              form.Banks.map((row, idx) => {
                const branch = getBranchInfo(row.BankID, row.BranchID);
                return (
                  <tr key={idx}>
                    <td className="font-medium text-slate-800">{getBankName(row.BankID)}</td>
                    <td>{branch?.BranchName ?? '—'}</td>
                    <td className="text-xs text-slate-500 max-w-[160px] truncate">{branch?.Address ?? '—'}</td>
                    <td>{row.BankAccountNo}</td>
                    <td className="text-xs text-slate-500">{branch?.IFSCCode ?? '—'}</td>
                    <td className="text-center">
                      <button
                        type="button"
                        onClick={() => handleSetActive(idx)}
                        className={cn(
                          'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors',
                          row.IsActive ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300',
                        )}
                      >
                        {row.IsActive ? 'YES' : 'NO'}
                      </button>
                    </td>
                    <td>
                      <button type="button" onClick={() => handleRemoveRow(idx)} className="p-1.5 text-slate-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}