import { useState } from 'react';
import { saveGroup } from '@/apis/master/groupApi';
import { useToast } from '@/hooks/useToast';
import PageCard from '@/components/shared/PageCard';
import DynamicFooter from '@/components/shared/DynamicFooter';
import GroupForm from './GroupForm';
import GroupSearch from './GroupSearch';
import type { Group } from '@/types';

export default function GroupManager() {
  const [editing, setEditing] = useState<Group | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [tableKey, setTableKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async (payload: unknown) => {
    setSaving(true);
    try {
      await saveGroup(payload);
      const p = payload as { RecordState: number };
      const action = p.RecordState === 2 ? 'updated' : 'created';
      setEditing(null);
      setFormKey((k) => k + 1);
      setTableKey((k) => k + 1);
      toast(`Group ${action} successfully!`, 'success');
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
      <PageCard title={editing ? 'Edit Group' : 'Add New Group'}>
        <GroupForm key={formKey} formdata={editing} onSave={handleSave} />
        <DynamicFooter
          formId="group-form"
          saving={saving}
          onClose={handleClose}
          className="mt-4"
        />
      </PageCard>

      <div className="mt-4">
        <PageCard title="Group List" showBackButton={false}>
          <GroupSearch
            key={tableKey}
            onSelect={() => {}}
            onEdit={(row) => setEditing(row)}
          />
        </PageCard>
      </div>
    </>
  );
}
