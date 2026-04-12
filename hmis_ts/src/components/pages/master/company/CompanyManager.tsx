import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { saveGroupCompany } from '@/apis/master/companyApi';
import { useToast } from '@/hooks/useToast';
import { useModal } from '@/hooks/useModal';
import Modal from '@/components/panels/Modal';
import PageCard from '@/components/shared/PageCard';
import { Button } from '@/components/ui/Button';
import CompanyForm from './CompanyForm';
import CompanySearch from './CompanySearch';
import type { Company, CompanyFormValues, CompanyPayload } from '@/types';
import { saveCompany } from '@/apis/master/companyApi';


export default function CompanyManager() {
  const [editing, setEditing] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { showModal, modalState, handleClose } = useModal();
  const [formKey, setFormKey] = useState(0);
  const [tableKey, setTableKey] = useState(0);


const handleSave = async (payload: CompanyPayload) => {
  setSaving(true);
  try {
    await saveCompany(payload);

    const layerNames: Record<number, string> = {
      1: 'Group Company',
      2: 'Company',
      3: 'Branch',
      4: 'Unit',
    };
    const layerName = layerNames[payload.LayerID] ?? 'Company';
    const action = payload.RecordState === 2 ? 'updated' : 'created';

    setEditing(null);
    setFormKey((k) => k + 1);   // ← clears form
    setTableKey((k) => k + 1);  // ← refreshes table
    toast(`${layerName} ${action} successfully!`, 'success');

  } catch (err: unknown) {
    toast(err instanceof Error ? err.message : 'Failed to save.', 'error');
  } finally {
    setSaving(false);
  }
};

  const footer = (
    <>
      <div />
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setEditing(null)}>
          <X size={13} /> Close
        </Button>
        <Button type="submit" form="company-form" disabled={saving}>
          <Save size={13} /> {saving ? 'Saving…' : 'Submit'}
        </Button>
      </div>
    </>
  );

  return (
    <>
      <Modal {...modalState} isOpen={modalState.isOpen} onClose={handleClose} />

      {/* Form on top */}
      <PageCard
        title={editing ? 'Edit Group / Company / Branch / Unit' : 'Add New Group / Company / Branch / Unit'}
        footer={footer}
      >
        <CompanyForm key={formKey} company={editing} onSave={handleSave} />
      </PageCard>

      {/* Table always below */}
      <div className="mt-4">
        <PageCard title="Company List">
          <CompanySearch
              key={tableKey}

            onSelect={() => {}}
            onEdit={(row) => setEditing(row)}
          />
        </PageCard>
      </div>
    </>
  );
}