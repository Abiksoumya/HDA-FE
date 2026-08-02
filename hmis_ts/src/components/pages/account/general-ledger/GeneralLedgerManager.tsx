import { useState } from 'react';
import { saveAccountTemplate } from '@/apis/finance/financeApi';
import { useToast } from '@/hooks/useToast';
import PageCard from '@/components/shared/PageCard';
import DynamicFooter from '@/components/shared/DynamicFooter';
import GeneralLedgerForm from './GeneralLedgerForm';
import GeneralLedgerSearch from './GeneralLedgerSearch';
import type { AccountTemplate } from '@/types';

export default function GeneralLedgerManager() {
  const [editing, setEditing] = useState<AccountTemplate | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [tableKey, setTableKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async (payload: unknown) => {
    setSaving(true);
    try {
      await saveAccountTemplate(payload);
      const p = payload as { RecordState: number };
      toast(`General ledger ${p.RecordState === 2 ? 'updated' : 'created'} successfully!`, 'success');
      setEditing(null);
      setFormKey((k) => k + 1);
      setTableKey((k) => k + 1);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
  };

  return (
    <>
      <PageCard title={editing ? 'Edit General Ledger' : 'Add New General Ledger'}>
        <GeneralLedgerForm key={formKey} formdata={editing} onSave={handleSave} />
        <DynamicFooter
          formId="general-ledger-form"
          saving={saving}
          onClose={handleClose}
          className="mt-4"
        />
      </PageCard>

      <div className="mt-4">
        <PageCard title="General Ledger List" showBackButton={false}>
          <GeneralLedgerSearch
            key={tableKey}
            onEdit={(row) => {
              setEditing(row);
              setFormKey((k) => k + 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </PageCard>
      </div>
    </>
  );
}
