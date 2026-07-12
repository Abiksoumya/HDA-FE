import { useEffect, useState } from 'react';
import { getAccountTemplates } from '@/apis/finance/financeApi';
import FormField from '@/components/shared/FormField';
import type { LookupItem, SubLedgerFormData, AccountTemplate } from '@/types';

interface Props {
  form: SubLedgerFormData;
  lookups: Record<string, LookupItem[]>;
  updateField: <K extends keyof SubLedgerFormData>(field: K, value: SubLedgerFormData[K]) => void;
}

export default function BusinessActivityTab({ form, lookups, updateField }: Props) {
  const [glAccounts, setGlAccounts] = useState<AccountTemplate[]>([]);

  useEffect(() => {
    getAccountTemplates(0, 0, 'N')
      .then((r) => setGlAccounts(r?.data?.AccountList ?? []))
      .catch(() => setGlAccounts([]));
  }, []);

  const updateBusiness = <K extends keyof SubLedgerFormData['Business']>(
    field: K,
    value: SubLedgerFormData['Business'][K],
  ) => {
    updateField('Business', { ...form.Business, [field]: value });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="No Of Employee">
          <input
            type="number"
            className="form-input"
            value={form.Business.NoOfEmployee || ''}
            onChange={(e) => updateBusiness('NoOfEmployee', Number(e.target.value))}
            placeholder="0"
            min={0}
          />
        </FormField>
        <FormField label="Annual Turnover">
          <input
            type="number"
            className="form-input"
            value={form.Business.AnnualTurnover || ''}
            onChange={(e) => updateBusiness('AnnualTurnover', Number(e.target.value))}
            placeholder="0.00"
            min={0}
            step={0.01}
          />
        </FormField>
        <FormField label="Name of the Auditor (If Any)">
          <input
            type="text"
            className="form-input"
            value={form.Business.AuditorName}
            onChange={(e) => updateBusiness('AuditorName', e.target.value)}
            placeholder="e.g. XYZ & Co"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Business Type">
          <select
            className="form-select"
            value={form.Business.BusinessTypeLookup}
            onChange={(e) => updateBusiness('BusinessTypeLookup', e.target.value)}
          >
            <option value="">-- Select --</option>
            {(lookups.BUSINESS ?? []).map((l) => (
              <option key={l.LookupCode} value={l.LookupName}>{l.LookupName}</option>
            ))}
          </select>
        </FormField>
        <FormField label="GL Head">
          <select
            className="form-select"
            value={form.Business.AccountID || 0}
            onChange={(e) => updateBusiness('AccountID', Number(e.target.value))}
          >
            <option value={0}>-- Select --</option>
            {glAccounts.map((a) => (
              <option key={a.AccountID} value={a.AccountID}>{a.Description}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Nature of Business">
          <select
            className="form-select"
            value={form.Business.NatureOfBizLookup}
            onChange={(e) => updateBusiness('NatureOfBizLookup', e.target.value)}
          >
            <option value="">-- Select --</option>
            {(lookups.NATUREOFBIZ ?? []).map((l) => (
              <option key={l.LookupCode} value={l.LookupName}>{l.LookupName}</option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="License/Certificate No.">
          <input
            type="text"
            className="form-input"
            value={form.Business.LicenseNumber}
            onChange={(e) => updateBusiness('LicenseNumber', e.target.value)}
            placeholder="e.g. LIC-001"
          />
        </FormField>
      </div>
    </div>
  );
}