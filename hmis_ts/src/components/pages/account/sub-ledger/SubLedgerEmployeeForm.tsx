import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, X, Loader2 } from 'lucide-react';
import { getBanks, getBankBranches, getSubLedgerLookup } from '@/apis/finance/financeApi';
import FormField from '@/components/shared/FormField';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import type { LookupItem } from '@/types';

interface EmployeeBank {
  EmployeeBankID: number;
  RecordState: number;
  BankID: number;
  BranchID: number;
  BankAccountNo: string;
  BankAccountName: string;
  IsActive: boolean;
  BankName?: string;
  BranchName?: string;
}

interface EmployeeFormData {
  SubLedgerID: number;
  SubLedgerCode: string;
  Employee: {
    ProfileName: string;
    Address: string;
    Address2: string;
    StateLookup: string;
    City: string;
    Pin: string;
    ContactNo: string;
    EMail: string;
    PAN: string;
    Aadhaar: string;
  };
  Banks: EmployeeBank[];
}

interface BankOption { BankID: number; BankName: string; }
interface BranchOption { BranchID: number; BranchName: string; BranchCode: string; IFSCCode: string; MICRCode: string; Address: string; }

const emptyForm: EmployeeFormData = {
  SubLedgerID: 0,
  SubLedgerCode: '',
  Employee: {
    ProfileName: '',
    Address: '',
    Address2: '',
    StateLookup: '',
    City: '',
    Pin: '',
    ContactNo: '',
    EMail: '',
    PAN: '',
    Aadhaar: '',
  },
  Banks: [],
};

const emptyBank: EmployeeBank = {
  EmployeeBankID: 0,
  RecordState: 1,
  BankID: 0,
  BranchID: 0,
  BankAccountNo: '',
  BankAccountName: '',
  IsActive: false,
};

interface Props {
  editData: EmployeeFormData | null;
  companyId: number;
  companyGroupId: number;
  subLedgerTypeId: number;
  onSaved: () => void;
  onCancel: () => void;
  createFn: (data: unknown) => Promise<unknown>;
}

export default function SubLedgerEmployeeForm({
  editData, companyId, companyGroupId, subLedgerTypeId, onSaved, onCancel, createFn
}: Props) {
  const [activeTab, setActiveTab] = useState<'profile' | 'bank'>('profile');
  const [form, setForm] = useState<EmployeeFormData>(emptyForm);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [branchesByBank, setBranchesByBank] = useState<Record<number, BranchOption[]>>({});
  const [stateLookups, setStateLookups] = useState<LookupItem[]>([]);
  const [draft, setDraft] = useState<EmployeeBank>(emptyBank);
  const [saving, setSaving] = useState(false);

  // Load banks + state lookups
  useEffect(() => {
    getBanks(1).then((r) => setBanks(r?.data?.BankList ?? [])).catch(() => {});
    getSubLedgerLookup().then((r) => {
      const all: LookupItem[] = r?.data ?? [];
      setStateLookups(all.filter((l) => l.KeyName === 'STATE'));
    }).catch(() => {});
  }, []);

  // Populate on edit
  useEffect(() => {
    if (editData) {
      setForm(editData);
      // Pre-load branches for existing banks
      editData.Banks.forEach((b) => {
        if (b.BankID) loadBranches(b.BankID);
      });
    } else {
      setForm(emptyForm);
    }
    setActiveTab('profile');
    setDraft(emptyBank);
  }, [editData]);

  const loadBranches = async (bankId: number) => {
    if (branchesByBank[bankId]) return;
    try {
      const r = await getBankBranches(bankId);
      setBranchesByBank((prev) => ({ ...prev, [bankId]: r?.data?.BankBranchList ?? [] }));
    } catch {
      setBranchesByBank((prev) => ({ ...prev, [bankId]: [] }));
    }
  };

  const updateEmployee = <K extends keyof EmployeeFormData['Employee']>(
    field: K, value: EmployeeFormData['Employee'][K]
  ) => {
    setForm((prev) => ({ ...prev, Employee: { ...prev.Employee, [field]: value } }));
  };

  const handleAddBank = () => {
    if (!draft.BankID || !draft.BranchID || !draft.BankAccountNo) return;
    const bankName = banks.find((b) => b.BankID === draft.BankID)?.BankName ?? '';
    const branchName = (branchesByBank[draft.BankID] ?? []).find((b) => b.BranchID === draft.BranchID)?.BranchName ?? '';
    const newRow = { ...draft, BankName: bankName, BranchName: branchName };
    let updatedBanks = [...form.Banks, newRow];
    if (newRow.IsActive) {
      updatedBanks = updatedBanks.map((b, i) =>
        i === updatedBanks.length - 1 ? b : { ...b, IsActive: false }
      );
    }
    setForm((prev) => ({ ...prev, Banks: updatedBanks }));
    setDraft(emptyBank);
  };

  const handleRemoveBank = (index: number) => {
    setForm((prev) => ({ ...prev, Banks: prev.Banks.filter((_, i) => i !== index) }));
  };

  const handleSetActive = (index: number) => {
    setForm((prev) => ({
      ...prev,
      Banks: prev.Banks.map((b, i) => ({ ...b, IsActive: i === index })),
    }));
  };

  const handleSubmit = async () => {
    if (!form.Employee.ProfileName.trim()) {
      alert('Name is required.');
      setActiveTab('profile');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        RecordState: form.SubLedgerID ? 2 : 1,
        SubLedgerID: form.SubLedgerID ?? 0,
        CompanyID: companyId,
        CompanyGroupID: companyGroupId,
        SubLedgerTypeID: subLedgerTypeId,
        SubLedgerCode: form.SubLedgerCode,
        Employee: form.Employee,
        Banks: form.Banks.map((b) => ({
          RecordState: b.EmployeeBankID ? 2 : 1,
          EmployeeBankID: b.EmployeeBankID ?? 0,
          BankID: b.BankID,
          BranchID: b.BranchID,
          BankAccountNo: b.BankAccountNo,
          BankAccountName: b.BankAccountName,
          IsActive: b.IsActive,
        })),
      };
      await createFn(payload);
      onSaved();
    } catch {
      // noop — error handling in parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 bg-slate-100 rounded-lg p-1 w-fit">
        {(['profile', 'bank'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150 capitalize',
              activeTab === tab ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {tab === 'profile' ? 'Profile' : 'Bank Details'}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Code">
              <input type="text" className="form-input" value={form.SubLedgerCode}
                onChange={(e) => setForm((p) => ({ ...p, SubLedgerCode: e.target.value }))}
                placeholder="e.g. EMP-001" />
            </FormField>
            <FormField label="Name" required>
              <input type="text" className="form-input" value={form.Employee.ProfileName}
                onChange={(e) => updateEmployee('ProfileName', e.target.value)}
                placeholder="Employee name" />
            </FormField>
          </div>

          <FormField label="Address 1">
            <input type="text" className="form-input" value={form.Employee.Address}
              onChange={(e) => updateEmployee('Address', e.target.value)}
              placeholder="Address line 1" />
          </FormField>

          <FormField label="Address 2">
            <input type="text" className="form-input" value={form.Employee.Address2}
              onChange={(e) => updateEmployee('Address2', e.target.value)}
              placeholder="Address line 2" />
          </FormField>

          <FormField label="State">
            <select className="form-select" value={form.Employee.StateLookup}
              onChange={(e) => updateEmployee('StateLookup', e.target.value)}>
              <option value="">-- Select --</option>
              {stateLookups.map((l) => (
                <option key={l.LookupCode} value={l.LookupName}>{l.LookupName}</option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="City">
              <input type="text" className="form-input" value={form.Employee.City}
                onChange={(e) => updateEmployee('City', e.target.value)}
                placeholder="City" />
            </FormField>
            <FormField label="PIN">
              <input type="text" className="form-input" value={form.Employee.Pin}
                onChange={(e) => updateEmployee('Pin', e.target.value)}
                placeholder="PIN code" maxLength={6} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Contact No.">
              <input type="text" className="form-input" value={form.Employee.ContactNo}
                onChange={(e) => updateEmployee('ContactNo', e.target.value)}
                placeholder="e.g. 9830012345" />
            </FormField>
            <FormField label="E-Mail">
              <input type="email" className="form-input" value={form.Employee.EMail}
                onChange={(e) => updateEmployee('EMail', e.target.value)}
                placeholder="e.g. employee@company.com" />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="PAN">
              <input type="text" className="form-input" value={form.Employee.PAN}
                onChange={(e) => updateEmployee('PAN', e.target.value)}
                placeholder="e.g. ABCDE1234F" maxLength={10} />
            </FormField>
            <FormField label="Aadhaar">
              <input type="text" className="form-input" value={form.Employee.Aadhaar}
                onChange={(e) => updateEmployee('Aadhaar', e.target.value)}
                placeholder="12-digit Aadhaar number" maxLength={12} />
            </FormField>
          </div>
        </div>
      )}

      {/* Bank Details Tab */}
      {activeTab === 'bank' && (
        <div className="space-y-5">
          {/* Draft entry */}
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Add Bank</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <FormField label="Bank Name">
                <select className="form-select" value={draft.BankID}
                  onChange={(e) => {
                    const bankId = Number(e.target.value);
                    setDraft((d) => ({ ...d, BankID: bankId, BranchID: 0 }));
                    if (bankId) loadBranches(bankId);
                  }}>
                  <option value={0}>-- Select --</option>
                  {banks.map((b) => (
                    <option key={b.BankID} value={b.BankID}>{b.BankName}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Branch">
                <select className="form-select" value={draft.BranchID}
                  disabled={!draft.BankID}
                  onChange={(e) => setDraft((d) => ({ ...d, BranchID: Number(e.target.value) }))}>
                  <option value={0}>-- Select --</option>
                  {(branchesByBank[draft.BankID] ?? []).map((b) => (
                    <option key={b.BranchID} value={b.BranchID}>{b.BranchName} ({b.BranchCode})</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Account No">
                <input type="text" className="form-input" value={draft.BankAccountNo}
                  onChange={(e) => setDraft((d) => ({ ...d, BankAccountNo: e.target.value }))}
                  placeholder="Account number" />
              </FormField>
              <FormField label="Account Name">
                <input type="text" className="form-input" value={draft.BankAccountName}
                  onChange={(e) => setDraft((d) => ({ ...d, BankAccountName: e.target.value }))}
                  placeholder="Account holder name" />
              </FormField>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600"
                  checked={draft.IsActive}
                  onChange={(e) => setDraft((d) => ({ ...d, IsActive: e.target.checked }))} />
                <span className="text-sm text-slate-700 font-medium">Relier (use this account)</span>
              </label>
              <Button type="button" size="sm" onClick={handleAddBank}>
                <Plus size={13} /> Add Bank
              </Button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">N.B. Only one bank can remain Relier at a time</p>
          </div>

          {/* Banks table */}
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bank Name</th>
                  <th>Branch</th>
                  <th>Account No</th>
                  <th>Account Name</th>
                  <th className="text-center">Relier</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {form.Banks.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-400 text-sm">No banks added</td></tr>
                ) : (
                  form.Banks.map((row, idx) => (
                    <tr key={idx}>
                      <td className="font-medium text-slate-800">{row.BankName ?? banks.find((b) => b.BankID === row.BankID)?.BankName ?? '—'}</td>
                      <td>{row.BranchName ?? (branchesByBank[row.BankID] ?? []).find((b) => b.BranchID === row.BranchID)?.BranchName ?? '—'}</td>
                      <td>{row.BankAccountNo}</td>
                      <td>{row.BankAccountName}</td>
                      <td className="text-center">
                        <button type="button" onClick={() => handleSetActive(idx)}
                          className={cn(
                            'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors',
                            row.IsActive ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300',
                          )}>
                          {row.IsActive ? 'YES' : 'NO'}
                        </button>
                      </td>
                      <td>
                        <button type="button" onClick={() => handleRemoveBank(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
        <Button variant="secondary" type="button" onClick={onCancel}>
          <X size={13} /> Cancel
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={saving}>
          <Save size={13} /> {saving ? 'Saving…' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}