import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getSubLedgerTypes, getSubLedgerAccountTemplate, saveSubLedgerAccountTemplate } from '@/apis/finance/financeApi';
import { useToast } from '@/hooks/useToast';
import PageCard from '@/components/shared/PageCard';
import DynamicFooter from '@/components/shared/DynamicFooter';
import { cn } from '@/utils/cn';

interface SubLedgerType {
  SubLedgerTypeID: number;
  SubLedgerType: string;
  NGFlag: string;
}

interface Account {
  RecordNo: number;
  AccountID: number;
  AccountCode: string;
  AccountName: string;
  AccountType: string;
  IsSubLedgerAccountMapped: boolean;
}

export default function SubLedgerTypeManager() {
  const [types, setTypes] = useState<SubLedgerType[]>([]);
  const [selectedType, setSelectedType] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [checkedMap, setCheckedMap] = useState<Map<number, boolean>>(new Map());
  const [typesLoading, setTypesLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load sub ledger types
  useEffect(() => {
    setTypesLoading(true);
    getSubLedgerTypes()
      .then((r) => setTypes(r?.data?.SubLedgerTypeList ?? []))
      .catch(() => setTypes([]))
      .finally(() => setTypesLoading(false));
  }, []);

  // Load accounts when type changes
  useEffect(() => {
    if (!selectedType) {
      setAccounts([]);
      setCheckedMap(new Map());
      return;
    }

    setAccountsLoading(true);
    getSubLedgerAccountTemplate(selectedType)
      .then((r) => {
        const accs: Account[] = r?.data?.Accounts ?? [];
        setAccounts(accs);

        // Pre-populate checked state from IsSubLedgerAccountMapped
        const map = new Map<number, boolean>();
        accs.forEach((a) => map.set(a.AccountID, a.IsSubLedgerAccountMapped));
        setCheckedMap(map);
      })
      .catch(() => { setAccounts([]); setCheckedMap(new Map()); })
      .finally(() => setAccountsLoading(false));
  }, [selectedType]);

  const handleCheck = (accountId: number, checked: boolean) => {
    setCheckedMap((prev) => {
      const updated = new Map(prev);
      updated.set(accountId, checked);
      return updated;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setCheckedMap((prev) => {
      const updated = new Map(prev);
      accounts.forEach((a) => updated.set(a.AccountID, checked));
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      toast('Please select a Sub Ledger Type.', 'error');
      return;
    }

    const selectedAccounts = Array.from(checkedMap.entries())
      .filter(([, checked]) => checked)
      .map(([accountId]) => ({
        RecordState: 1,
        AccountID: accountId,
      }));

    if (selectedAccounts.length === 0) {
      toast('Please select at least one GL account.', 'error');
      return;
    }

    setSaving(true);
    try {
      await saveSubLedgerAccountTemplate({
        SubLedgerTypeID: selectedType,
        Accounts: selectedAccounts,
      });
      toast('Sub ledger account template saved successfully!', 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const allChecked = accounts.length > 0 && accounts.every((a) => checkedMap.get(a.AccountID));
  const checkedCount = Array.from(checkedMap.values()).filter(Boolean).length;

  return (
    <PageCard title="Sub Ledger Wise GL">
      {/* Type selector */}
      <div className="flex items-end gap-4 mb-6">
        <div className="w-80">
          <label className="text-xs font-medium text-slate-600 mb-1 block">Type Name</label>
          {typesLoading ? (
            <div className="form-select flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 size={13} className="animate-spin" /> Loading…
            </div>
          ) : (
            <select
              className="form-select"
              value={selectedType}
              onChange={(e) => setSelectedType(Number(e.target.value))}
            >
              <option value={0}>-- Select --</option>
              {types.map((t) => (
                <option key={t.SubLedgerTypeID} value={t.SubLedgerTypeID}>
                  {t.SubLedgerType}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Summary badge */}
        {selectedType !== 0 && !accountsLoading && accounts.length > 0 && (
          <div className="flex items-center gap-2 pb-1">
            <span className="badge badge-blue text-[11px]">{checkedCount} selected</span>
            <span className="badge badge-slate text-[11px]">{accounts.length} total</span>
          </div>
        )}
      </div>

      {/* Accounts table */}
      <div className={cn(
        'rounded-xl border border-slate-200 overflow-hidden transition-opacity duration-200',
        accountsLoading ? 'opacity-50' : 'opacity-100',
      )}>
        {accountsLoading ? (
          <div className="py-14 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Loader2 size={16} className="animate-spin" /> Loading GL accounts…
          </div>
        ) : (
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 w-12 text-center">
                  {accounts.length > 0 && (
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-blue-600"
                      checked={allChecked}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  )}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/4">
                  GL Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  GL Head
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-32">
                  Account Type
                </th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-14 text-center text-slate-400 text-sm">
                    {selectedType === 0
                      ? 'Select a Sub Ledger Type to load GL accounts'
                      : 'No GL accounts available'}
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => (
                  <tr
                    key={acc.AccountID}
                    onClick={() => handleCheck(acc.AccountID, !checkedMap.get(acc.AccountID))}
                    className={cn(
                      'border-b border-slate-100 last:border-0 cursor-pointer transition-colors',
                      checkedMap.get(acc.AccountID) ? 'bg-blue-50/40' : 'hover:bg-slate-50',
                    )}
                  >
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-blue-600"
                        checked={checkedMap.get(acc.AccountID) ?? false}
                        onChange={(e) => handleCheck(acc.AccountID, e.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge badge-slate text-[11px]">{acc.AccountCode}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800 font-medium">{acc.AccountName}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="badge badge-blue text-[10px]">{acc.AccountType}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedType !== 0 && !accountsLoading && (
        <DynamicFooter
          saving={saving}
          onSubmit={handleSubmit}
          onClose={() => {
            setSelectedType(0);
            setAccounts([]);
            setCheckedMap(new Map());
          }}
          className="mt-4"
        />
      )}
    </PageCard>
  );
}