import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { useModal } from '@/hooks/useModal';
import Modal from '@/components/panels/Modal';
import PageCard from '@/components/shared/PageCard';
import DynamicFooter from '@/components/shared/DynamicFooter';
import CompanyForm from './CompanyForm';
import CompanySearch from './CompanySearch';
import type { Company, CompanyPayload } from '@/types';
import { saveCompany } from '@/apis/master/companyApi';

export default function CompanyManager() {
  const [editing, setEditing] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { modalState, handleClose } = useModal();
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
      setFormKey((k) => k + 1);
      setTableKey((k) => k + 1);
      toast(`${layerName} ${action} successfully!`, 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClose_ = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
  };

  return (
    <>
      <Modal {...modalState} isOpen={modalState.isOpen} onClose={handleClose} />

      <PageCard
        title={editing ? 'Edit Group / Company / Branch / Unit' : 'Add New Group / Company / Branch / Unit'}
      >
        <CompanyForm key={formKey} company={editing} onSave={handleSave} />
        <DynamicFooter
          formId="company-form"
          saving={saving}
          onClose={handleClose_}
          className="mt-4"
        />
      </PageCard>

      <div className="mt-4">
        <PageCard title="Company List" showBackButton={false}>
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
