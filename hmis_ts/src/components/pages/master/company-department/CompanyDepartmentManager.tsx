import { useState } from 'react';
import { Save, X } from 'lucide-react';
import { saveCompanyDepartmentMapping } from '@/apis/master/companyDepartmentApi';
import { useToast } from '@/hooks/useToast';
import PageCard from '@/components/shared/PageCard';
import { Button } from '@/components/ui/Button';
import CompanyDepartmentForm from './CompanyDepartmentForm';

export default function CompanyDepartmentManager() {
  const [saving, setSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const { toast } = useToast();

  const handleSave = async (payload: unknown) => {
    setSaving(true);
    try {
      await saveCompanyDepartmentMapping(payload);
      toast('Company department mapping saved successfully!', 'success');
      setFormKey((k) => k + 1); // reset form
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save mapping.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageCard title="Company / Branch wise Department Mapping">
      <CompanyDepartmentForm key={formKey} onSave={handleSave} />
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="secondary" onClick={() => setFormKey((k) => k + 1)}>
          <X size={13} /> Cancel
        </Button>
        <Button type="submit" form="company-dept-form" disabled={saving}>
          <Save size={13} /> {saving ? 'Saving…' : 'Submit'}
        </Button>
      </div>
    </PageCard>
  );
}