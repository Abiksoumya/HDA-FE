import FormField from '@/components/shared/FormField';
import { cn } from '@/utils/cn';
import type { LookupItem, SubLedgerFormData } from '@/types';

interface Props {
  form: SubLedgerFormData;
  lookups: Record<string, LookupItem[]>;
  updateField: <K extends keyof SubLedgerFormData>(field: K, value: SubLedgerFormData[K]) => void;
}

const ESTABLISHMENT_OPTIONS = [
  { code: 'PROPTOR', label: 'Proprietorship' },
  { code: 'PARTNER', label: 'Partnership' },
  { code: 'PVTCOMP', label: 'Private Company' },
  { code: 'PUBCOMP', label: 'Public Company' },
];

export default function ProfileTab({ form, lookups, updateField }: Props) {
  return (
    <div className="space-y-5">
      {/* Code, Legal Name, Entity, TDS Nature */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FormField label="Code">
          <input
            type="text"
            className="form-input"
            value={form.SubLedgerCode}
            onChange={(e) => updateField('SubLedgerCode', e.target.value)}
            placeholder="e.g. SD00001"
          />
        </FormField>
        <FormField label="Legal Name" required>
          <input
            type="text"
            className="form-input"
            value={form.LegalName}
            onChange={(e) => updateField('LegalName', e.target.value)}
            placeholder="e.g. ABC Pvt Ltd"
          />
        </FormField>
        <FormField label="Entity">
          <select
            className="form-select"
            value={form.EntityLookup}
            onChange={(e) => updateField('EntityLookup', e.target.value)}
          >
            <option value="">-- Select --</option>
            {(lookups.ENTITY ?? []).map((l) => (
              <option key={l.LookupCode} value={l.LookupName}>{l.LookupName}</option>
            ))}
          </select>
        </FormField>
        <FormField label="TDS Nature">
          <select
            className="form-select"
            value={form.TDSNatureLookup}
            onChange={(e) => updateField('TDSNatureLookup', e.target.value)}
          >
            <option value="">-- Select --</option>
            {(lookups.TDSNATURE ?? []).map((l) => (
              <option key={l.LookupCode} value={l.LookupName}>{l.LookupName}</option>
            ))}
          </select>
        </FormField>
      </div>

      {/* Type of Establishment — radio buttons */}
      <div>
        <label className="text-xs font-medium text-slate-600 mb-2 block">Type Of Establishment</label>
        <div className="flex flex-wrap gap-4">
          {ESTABLISHMENT_OPTIONS.map((opt) => (
            <label key={opt.code} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="radio"
                name="establishment"
                className="w-4 h-4 text-blue-600 border-slate-300"
                checked={form.EstablishmentLookup === opt.label}
                onChange={() => updateField('EstablishmentLookup', opt.label)}
              />
              <span className="text-sm text-slate-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Date of Incorporation, State, CIN Number */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Date Of Incorporation">
          <input
            type="date"
            className="form-input"
            value={form.DateOfIncorporation?.slice(0, 10) ?? ''}
            onChange={(e) => updateField('DateOfIncorporation', e.target.value)}
          />
        </FormField>
        <FormField label="State">
          <select
            className="form-select"
            value={form.StateLookup}
            onChange={(e) => updateField('StateLookup', e.target.value)}
          >
            <option value="">-- Select --</option>
            {(lookups.STATE ?? []).map((l) => (
              <option key={l.LookupCode} value={l.LookupName}>{l.LookupName}</option>
            ))}
          </select>
        </FormField>
        <FormField label="CIN Number">
          <input
            type="text"
            className="form-input"
            value={form.CINNumber}
            onChange={(e) => updateField('CINNumber', e.target.value)}
            placeholder="e.g. U12345WB2022PTC000001"
          />
        </FormField>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Registered Office Address">
          <textarea
            className={cn('form-input min-h-[70px] resize-none')}
            value={form.RegOfficeAddress}
            onChange={(e) => updateField('RegOfficeAddress', e.target.value)}
            placeholder="Registered office address"
          />
        </FormField>
        <FormField label="Business Office Address">
          <textarea
            className={cn('form-input min-h-[70px] resize-none')}
            value={form.BizOfficeAddress}
            onChange={(e) => updateField('BizOfficeAddress', e.target.value)}
            placeholder="Business office address"
          />
        </FormField>
      </div>

      {/* Remarks */}
      <FormField label="Remarks">
        <textarea
          className={cn('form-input min-h-[60px] resize-none')}
          value={form.Remarks}
          onChange={(e) => updateField('Remarks', e.target.value)}
          placeholder="Additional remarks"
        />
      </FormField>
    </div>
  );
}