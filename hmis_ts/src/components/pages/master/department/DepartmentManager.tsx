import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { saveDepartment } from '@/apis/master/departmentApi';
import { useToast } from '@/hooks/useToast';
import PageCard from '@/components/shared/PageCard';
import { Button } from '@/components/ui/Button';
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

  return (
    <>
      {/* Form */}
      <PageCard
        title={editing ? 'Edit Department' : 'Add New Department'}
      >
        <DepartmentForm key={formKey} formdata={editing} onSave={handleSave} />
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="secondary"
            onClick={() => { setEditing(null); setFormKey((k) => k + 1); }}
          >
            <X size={13} /> Cancel
          </Button>
          <Button type="submit" form="department-form" disabled={saving}>
            <Save size={13} /> {saving ? 'Saving…' : 'Submit'}
          </Button>
        </div>
      </PageCard>

      {/* Table */}
      <div className="mt-4">
        <PageCard title="Department List">
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