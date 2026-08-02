import { useState } from 'react';
import { saveDepartment } from '@/apis/master/departmentApi';
import { useToast } from '@/hooks/useToast';
import PageCard from '@/components/shared/PageCard';
import DynamicFooter from '@/components/shared/DynamicFooter';
import type { Department } from '@/types';
import DepartmentForm from './DepartmentForm';
import DepartmentSearch from './DepartmentSearch';

export default function DepartmentManager() {
  const [editing, setEditing] = useState<Department | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [tableKey, setTableKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async (payload: unknown) => {
    setSaving(true);
    try {
      await saveDepartment(payload);
      const p = payload as { RecordState: number };
      const action = p.RecordState === 2 ? 'updated' : 'created';
      setEditing(null);
      setFormKey((k) => k + 1);
      setTableKey((k) => k + 1);
      toast(`Department ${action} successfully!`, 'success');
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
      <PageCard title={editing ? 'Edit Department' : 'Add New Department'}>
        <DepartmentForm key={formKey} formdata={editing} onSave={handleSave} />
        <DynamicFooter
          formId="department-form"
          saving={saving}
          onClose={handleClose}
          className="mt-4"
        />
      </PageCard>

      <div className="mt-4">
        <PageCard title="Department List" showBackButton={false}>
          <DepartmentSearch
            key={tableKey}
            onSelect={() => {}}
            onEdit={(row) => setEditing(row)}
          />
        </PageCard>
      </div>
    </>
  );
}
