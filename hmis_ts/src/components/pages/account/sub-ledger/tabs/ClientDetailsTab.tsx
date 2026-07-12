import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import FormField from '@/components/shared/FormField';
import { Button } from '@/components/ui/Button';
import type { LookupItem, SubLedgerFormData, SubLedgerClient } from '@/types';

interface Props {
  form: SubLedgerFormData;
  lookups: Record<string, LookupItem[]>;
  updateField: <K extends keyof SubLedgerFormData>(field: K, value: SubLedgerFormData[K]) => void;
}

const emptyRow: SubLedgerClient = {
  SubLedgerClientID: 0,
  RecordState: 1,
  OrganizationName: '',
  JobTypeLookup: '',
  AgreementDurationMonths: 0,
  AgreementValue: 0,
};

export default function ClientDetailsTab({ form, lookups, updateField }: Props) {
  const [draft, setDraft] = useState<SubLedgerClient>(emptyRow);

  const handleAdd = () => {
    if (!draft.OrganizationName.trim()) return;
    updateField('Clients', [...form.Clients, draft]);
    setDraft(emptyRow);
  };

  const handleRemove = (index: number) => {
    updateField('Clients', form.Clients.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Add Client</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
          <FormField label="Name of the Organization">
            <input
              type="text"
              className="form-input"
              value={draft.OrganizationName}
              onChange={(e) => setDraft((d) => ({ ...d, OrganizationName: e.target.value }))}
              placeholder="e.g. NKDA"
            />
          </FormField>
          <FormField label="Nature of the Job">
            <select
              className="form-select"
              value={draft.JobTypeLookup}
              onChange={(e) => setDraft((d) => ({ ...d, JobTypeLookup: e.target.value }))}
            >
              <option value="">-- Select --</option>
              {(lookups.JOBTYPE ?? []).map((l) => (
                <option key={l.LookupCode} value={l.LookupName}>{l.LookupName}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Duration of Agreement (Months)">
            <input
              type="number"
              className="form-input"
              value={draft.AgreementDurationMonths || ''}
              onChange={(e) => setDraft((d) => ({ ...d, AgreementDurationMonths: Number(e.target.value) }))}
              placeholder="12"
              min={0}
            />
          </FormField>
          <FormField label="Agreement Value">
            <input
              type="number"
              className="form-input"
              value={draft.AgreementValue || ''}
              onChange={(e) => setDraft((d) => ({ ...d, AgreementValue: Number(e.target.value) }))}
              placeholder="0.00"
              min={0}
              step={0.01}
            />
          </FormField>
        </div>
        <div className="flex justify-end">
          <Button type="button" size="sm" onClick={handleAdd}>
            <Plus size={13} /> Add Client
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name of Organization</th>
              <th>Nature of the Job</th>
              <th>Duration</th>
              <th>Agreement Value</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {form.Clients.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400 text-sm">No clients added</td></tr>
            ) : (
              form.Clients.map((row, idx) => (
                <tr key={idx}>
                  <td className="font-medium text-slate-800">{row.OrganizationName}</td>
                  <td>{row.JobTypeLookup}</td>
                  <td>{row.AgreementDurationMonths} months</td>
                  <td>₹{row.AgreementValue.toLocaleString()}</td>
                  <td>
                    <button type="button" onClick={() => handleRemove(idx)} className="p-1.5 text-slate-400 hover:text-red-500">
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
  );
}