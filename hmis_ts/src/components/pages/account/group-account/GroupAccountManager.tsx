import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { saveAccountTemplate } from '@/apis/finance/financeApi';
import { useToast } from '@/hooks/useToast';
import PageCard from '@/components/shared/PageCard';
import { Button } from '@/components/ui/Button';
import GroupAccountForm from './GroupAccountForm';
import GroupAccountSearch from './GroupAccountSearch';
import type { AccountTemplate } from '@/types';

export default function GroupAccountManager() {
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
      toast(`Group account ${p.RecordState === 2 ? 'updated' : 'created'} successfully!`, 'success');
      setEditing(null);
      setFormKey((k) => k + 1);
      setTableKey((k) => k + 1);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageCard title={editing ? 'Edit Group Account' : 'Add New Group Account'}>
        <GroupAccountForm key={formKey} formdata={editing} onSave={handleSave} />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => { setEditing(null); setFormKey((k) => k + 1); }}>
            <X size={13} /> Cancel
          </Button>
          <Button type="submit" form="group-account-form" disabled={saving}>
            <Save size={13} /> {saving ? 'Saving…' : 'Submit'}
          </Button>
        </div>
      </PageCard>

      <div className="mt-4">
        <PageCard title="Group Account List" showBackButton={false}>
          <GroupAccountSearch
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