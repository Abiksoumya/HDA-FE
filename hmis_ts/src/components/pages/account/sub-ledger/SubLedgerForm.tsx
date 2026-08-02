import { useEffect, useState } from 'react';
import { Save, X, Loader2, User, Briefcase, Landmark, Phone, FileText, Users } from 'lucide-react';
import { getSubLedgerLookup, getSubLedgerTypes, createSubLedger } from '@/apis/finance/financeApi';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import type { LookupItem, SubLedgerFormData } from '@/types';
import ProfileTab from './tabs/ProfileTab';
import BusinessActivityTab from './tabs/BusinessActivityTab';
import BankDetailsTab from './tabs/BankDetailsTab';
import ContactDetailsTab from './tabs/ContactDetailsTab';
import StatutoryDocumentsTab from './tabs/StatutoryDocumentsTab';
import ClientDetailsTab from './tabs/ClientDetailsTab';

// const TABS = [
//   { key: 'profile', label: 'Profile', icon: User },
//   { key: 'business', label: 'Business Activity', icon: Briefcase },
//   { key: 'bank', label: 'Bank Details', icon: Landmark },
//   { key: 'contact', label: 'Contact Details', icon: Phone },
//   { key: 'statutory', label: 'Statutory Documents', icon: FileText },
//   { key: 'client', label: 'Client Details', icon: Users },
// ] as const;

// type TabKey = typeof TABS[number]['key'];

const ALL_TABS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'business', label: 'Business Activity', icon: Briefcase },
  { key: 'bank', label: 'Bank Details', icon: Landmark },
  { key: 'contact', label: 'Contact Details', icon: Phone },
  { key: 'statutory', label: 'Statutory Documents', icon: FileText },
  { key: 'client', label: 'Client Details', icon: Users },
] as const;

type TabKey = typeof ALL_TABS[number]['key'];

// Inside the component — compute visible tabs based on type:


interface SubLedgerType { SubLedgerTypeID: number; SubLedgerType: string; }

const emptyForm: SubLedgerFormData = {
  SubLedgerID: 0,
  CompanyID: 0,
  CompanyGroupID: 0,
  SubLedgerTypeID: 0,
  SubLedgerCode: '',
  LegalName: '',
  EntityLookup: '',
  TDSNatureLookup: '',
  EstablishmentLookup: '',
  DateOfIncorporation: '',
  StateLookup: '',
  CINNumber: '',
  RegOfficeAddress: '',
  BizOfficeAddress: '',
  Remarks: '',
  Contacts: [],
  Banks: [],
  Clients: [],
  Documents: [],
  Business: {
    SubLedgerBusinessID: 0,
    RecordState: 1,
    AccountID: 0,
    NoOfEmployee: 0,
    AnnualTurnover: 0,
    AuditorName: '',
    BusinessTypeLookup: '',
    NatureOfBizLookup: '',
    LicenseNumber: '',
  },
};

interface Props {
  editData: SubLedgerFormData | null;
  companyId: number;
  companyGroupId: number;
  defaultTypeId: number;
  onSaved: () => void;
  onCancel: () => void; // ← add
}

export default function SubLedgerForm({ editData, companyId, companyGroupId, defaultTypeId, onSaved, onCancel }: Props) {   

  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [form, setForm] = useState<SubLedgerFormData>(emptyForm);
  const [lookups, setLookups] = useState<Record<string, LookupItem[]>>({});
  // const [subLedgerTypes, setSubLedgerTypes] = useState<SubLedgerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const isEditMode = !!editData?.SubLedgerID;

  const EMPLOYEE_TYPE_ID = 3;
const isEmployee = form.SubLedgerTypeID === EMPLOYEE_TYPE_ID;

const visibleTabs = isEmployee
  ? ALL_TABS.filter((t) => t.key === 'profile' || t.key === 'bank')
    : ALL_TABS;
  
  console.log('form.SubLedgerTypeID:', form.SubLedgerTypeID);
console.log('defaultTypeId:', defaultTypeId);
console.log('isEmployee:', isEmployee);
console.log('EMPLOYEE_TYPE_ID:', EMPLOYEE_TYPE_ID);

  // Load lookups + sub ledger types once
  useEffect(() => {
    Promise.all([
      getSubLedgerLookup().then((r) => {
        const all: LookupItem[] = r?.data ?? [];
        const grouped: Record<string, LookupItem[]> = {};
        all.forEach((item) => {
          if (!grouped[item.KeyName]) grouped[item.KeyName] = [];
          grouped[item.KeyName].push(item);
        });
        setLookups(grouped);
      }),
      // getSubLedgerTypes().then((r) => setSubLedgerTypes(r?.data?.SubLedgerTypeList ?? [])),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Populate form on edit
  useEffect(() => {
    if (editData) {
      setForm(editData);
    } else {
      setForm({
        ...emptyForm,
        CompanyID: companyId,
          CompanyGroupID: companyGroupId,
              SubLedgerTypeID: defaultTypeId, // ← use the default type ID

      });
    }
    setActiveTab('profile');
  }, [editData, companyId, companyGroupId]);

  const updateField = <K extends keyof SubLedgerFormData>(field: K, value: SubLedgerFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.SubLedgerTypeID) {
      toast('Please select Sub Ledger Type.', 'error');
      setActiveTab('profile');
      return;
    }
    if (!form.LegalName.trim()) {
      toast('Legal Name is required.', 'error');
      setActiveTab('profile');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        Contacts: form.Contacts.map((c) => ({ ...c, RecordState: c.SubLedgerContactID ? 2 : 1 })),
        Banks: form.Banks.map((b) => ({ ...b, RecordState: b.SubLedgerBankID ? 2 : 1 })),
        Clients: form.Clients.map((c) => ({ ...c, RecordState: c.SubLedgerClientID ? 2 : 1 })),
        Documents: form.Documents.map((d) => ({ ...d, RecordState: d.SubLedgerDocumentID ? 2 : 1 })),
        Business: { ...form.Business, RecordState: form.Business.SubLedgerBusinessID ? 2 : 1 },
        };
        // console.log('SubLedger payload:', JSON.stringify(payload, null, 2)); // ← add this

      await createSubLedger(payload);
      toast(`Sub ledger ${isEditMode ? 'updated' : 'created'} successfully!`, 'success');
      onSaved();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save sub ledger.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center gap-2 text-slate-400 text-sm">
        <Loader2 size={16} className="animate-spin" /> Loading form data…
      </div>
    );
  }

  return (
    <div>
      {/* Sub Ledger Type — top selector */}
      {/* <div className="w-72 mb-5">
        <label className="text-xs font-medium text-slate-600 mb-1 block">
          Sub Ledger Type <span className="text-red-500">*</span>
        </label>
        <select
          className="form-select"
          value={form.SubLedgerTypeID}
          onChange={(e) => updateField('SubLedgerTypeID', Number(e.target.value))}
          disabled={isEditMode}
        >
          <option value={0}>-- Select --</option>
          {subLedgerTypes.map((t) => (
            <option key={t.SubLedgerTypeID} value={t.SubLedgerTypeID}>{t.SubLedgerType}</option>
          ))}
        </select>
      </div> */}

      {/* Tabs — freely clickable
      <div className="flex items-center gap-1 mb-6 bg-slate-100 rounded-lg p-1 flex-wrap">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all duration-150',
                activeTab === tab.key
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              <Icon size={13} /> {tab.label}
            </button>
          );
        })}
      </div> */}
      {/* Tabs */}
<div className="flex items-center gap-1 mb-5 bg-slate-100 rounded-lg p-1 flex-wrap">
  {visibleTabs.map((tab) => {  // ← visibleTabs instead of TABS
    const Icon = tab.icon;
    return (
      <button
        key={tab.key}
        type="button"
        onClick={() => setActiveTab(tab.key)}
        className={cn(
          'flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all duration-150',
          activeTab === tab.key
            ? 'bg-white text-blue-700 shadow-sm'
            : 'text-slate-500 hover:text-slate-700',
        )}
      >
        <Icon size={13} /> {tab.label}
      </button>
    );
  })}
</div>

      {/* Tab content */}
      <div className="min-h-[300px]">
        {activeTab === 'profile' && (
          <ProfileTab form={form} lookups={lookups} updateField={updateField} />
        )}
        {activeTab === 'business' && (
          <BusinessActivityTab form={form} lookups={lookups} updateField={updateField} />
        )}
        {activeTab === 'bank' && (
          <BankDetailsTab form={form} updateField={updateField} />
        )}
        {activeTab === 'contact' && (
          <ContactDetailsTab form={form} updateField={updateField} />
        )}
        {activeTab === 'statutory' && (
          <StatutoryDocumentsTab form={form} lookups={lookups} updateField={updateField} />
        )}
        {activeTab === 'client' && (
          <ClientDetailsTab form={form} lookups={lookups} updateField={updateField} />
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
        <Button variant="secondary" type="button" onClick={onCancel}> {/* ← changed from onSaved to onCancel */}
  <X size={13} /> Cancel
</Button>
        <Button type="button" onClick={handleSubmit} disabled={saving}>
          <Save size={13} /> {saving ? 'Saving…' : 'Final Submit'}
        </Button>
      </div>
    </div>
  );
}