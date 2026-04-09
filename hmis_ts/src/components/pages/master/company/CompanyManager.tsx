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
import type { Company, CompanyFormValues } from '@/types';

export default function CompanyManager() {
  const [editing, setEditing] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { showModal, modalState, handleClose } = useModal();

  const handleSave = async (payload: CompanyFormValues) => {
    setSaving(true);
    try {
      await saveGroupCompany(payload);
      toast('Company saved successfully!', 'success');
      setEditing(null);
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
          <X size={13} /> Cancel
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
        <CompanyForm company={editing} onSave={handleSave} />
      </PageCard>

      {/* Table always below */}
      <div className="mt-4">
        <PageCard title="Company List">
          <CompanySearch
            onSelect={() => {}}
            onEdit={(row) => setEditing(row)}
          />
        </PageCard>
      </div>
    </>
  );
}