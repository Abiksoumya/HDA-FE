import { useState } from 'react';
import { saveCompanyDepartmentMapping } from '@/apis/master/companyDepartmentApi';
import { useToast } from '@/hooks/useToast';
import PageCard from '@/components/shared/PageCard';
import DynamicFooter from '@/components/shared/DynamicFooter';
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
      setFormKey((k) => k + 1);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save mapping.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageCard title="Company / Branch wise Department Mapping">
      <CompanyDepartmentForm key={formKey} onSave={handleSave} />
      <DynamicFooter
        formId="company-dept-form"
        saving={saving}
        onClose={() => setFormKey((k) => k + 1)}
        className="mt-4"
      />
    </PageCard>
  );
}
