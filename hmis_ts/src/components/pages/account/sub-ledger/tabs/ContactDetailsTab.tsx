import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import FormField from '@/components/shared/FormField';
import { Button } from '@/components/ui/Button';
import type { SubLedgerFormData, SubLedgerContact } from '@/types';

interface Props {
  form: SubLedgerFormData;
  updateField: <K extends keyof SubLedgerFormData>(field: K, value: SubLedgerFormData[K]) => void;
}

const emptyRow: SubLedgerContact = {
  SubLedgerContactID: 0,
  RecordState: 1,
  ContactPerson: '',
  Designation: '',
  ContactNumber: '',
  ContactEmail: '',
  IsPrimary: false,
};

export default function ContactDetailsTab({ form, updateField }: Props) {
  const [draft, setDraft] = useState<SubLedgerContact>(emptyRow);

  const handleAdd = () => {
    if (!draft.ContactPerson.trim()) return;
    updateField('Contacts', [...form.Contacts, draft]);
    setDraft(emptyRow);
  };

  const handleRemove = (index: number) => {
    updateField('Contacts', form.Contacts.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Add Contact</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
          <FormField label="Contact Name">
            <input
              type="text"
              className="form-input"
              value={draft.ContactPerson}
              onChange={(e) => setDraft((d) => ({ ...d, ContactPerson: e.target.value }))}
              placeholder="e.g. Amit"
            />
          </FormField>
          <FormField label="Contact No">
            <input
              type="text"
              className="form-input"
              value={draft.ContactNumber}
              onChange={(e) => setDraft((d) => ({ ...d, ContactNumber: e.target.value }))}
              placeholder="e.g. 9830012345"
            />
          </FormField>
          <FormField label="Designation">
            <input
              type="text"
              className="form-input"
              value={draft.Designation}
              onChange={(e) => setDraft((d) => ({ ...d, Designation: e.target.value }))}
              placeholder="e.g. Accounts"
            />
          </FormField>
          <FormField label="Email">
            <input
              type="email"
              className="form-input"
              value={draft.ContactEmail}
              onChange={(e) => setDraft((d) => ({ ...d, ContactEmail: e.target.value }))}
              placeholder="e.g. amit@test.com"
            />
          </FormField>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 text-blue-600"
              checked={draft.IsPrimary}
              onChange={(e) => setDraft((d) => ({ ...d, IsPrimary: e.target.checked }))}
            />
            <span className="text-sm text-slate-700 font-medium">Primary Contact</span>
          </label>
          <Button type="button" size="sm" onClick={handleAdd}>
            <Plus size={13} /> Add Contact
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Contact Name</th>
              <th>Contact No</th>
              <th>Designation</th>
              <th>Email</th>
              <th className="text-center">Primary</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {form.Contacts.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400 text-sm">No contacts added</td></tr>
            ) : (
              form.Contacts.map((row, idx) => (
                <tr key={idx}>
                  <td className="font-medium text-slate-800">{row.ContactPerson}</td>
                  <td>{row.ContactNumber}</td>
                  <td>{row.Designation}</td>
                  <td className="text-xs text-slate-500">{row.ContactEmail}</td>
                  <td className="text-center">
                    {row.IsPrimary && <span className="badge badge-green text-[10px]">Primary</span>}
                  </td>
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