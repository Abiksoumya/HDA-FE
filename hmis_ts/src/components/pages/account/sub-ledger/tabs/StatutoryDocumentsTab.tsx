import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import FormField from '@/components/shared/FormField';
import { Button } from '@/components/ui/Button';
import type { LookupItem, SubLedgerFormData, SubLedgerDocument } from '@/types';

interface Props {
  form: SubLedgerFormData;
  lookups: Record<string, LookupItem[]>;
  updateField: <K extends keyof SubLedgerFormData>(field: K, value: SubLedgerFormData[K]) => void;
}

const emptyRow: SubLedgerDocument = {
  SubLedgerDocumentID: 0,
  RecordState: 1,
  DocumentTypeLookup: '',
  DocumentNo: '',
};

export default function StatutoryDocumentsTab({ form, lookups, updateField }: Props) {
  const [draft, setDraft] = useState<SubLedgerDocument>(emptyRow);

  const handleAdd = () => {
    if (!draft.DocumentTypeLookup || !draft.DocumentNo.trim()) return;
    updateField('Documents', [...form.Documents, draft]);
    setDraft(emptyRow);
  };

  const handleRemove = (index: number) => {
    updateField('Documents', form.Documents.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Add Statutory Document</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          <FormField label="Type Of Document">
            <select
              className="form-select"
              value={draft.DocumentTypeLookup}
              onChange={(e) => setDraft((d) => ({ ...d, DocumentTypeLookup: e.target.value }))}
            >
              <option value="">-- Select --</option>
              {(lookups.STATUTORY ?? []).map((l) => (
                <option key={l.LookupCode} value={l.LookupName}>{l.LookupName}</option>
              ))}
            </select>
          </FormField>
          <FormField label="ID/Registration No.">
            <input
              type="text"
              className="form-input"
              value={draft.DocumentNo}
              onChange={(e) => setDraft((d) => ({ ...d, DocumentNo: e.target.value }))}
              placeholder="e.g. ABCDE1234F"
            />
          </FormField>
          <div className="flex items-end">
            <Button type="button" size="sm" onClick={handleAdd}>
              <Plus size={13} /> Add
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-12">Sl No.</th>
              <th>Type of Document</th>
              <th>No.</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {form.Documents.length === 0 ? (
              <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-sm">No documents added</td></tr>
            ) : (
              form.Documents.map((row, idx) => (
                <tr key={idx}>
                  <td className="text-slate-400">{idx + 1}</td>
                  <td className="font-medium text-slate-800">{row.DocumentTypeLookup}</td>
                  <td>{row.DocumentNo}</td>
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