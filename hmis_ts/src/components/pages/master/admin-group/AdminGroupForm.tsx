import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { getCompanyBranch } from '@/apis/master/companyDepartmentApi';
import FormField from '@/components/shared/FormField';
import { cn } from '@/utils/cn';
import type { AdminGroup, AdminGroupFormValues, Company } from '@/types';

const schema = Yup.object({
  p_group_company_nid: Yup.number().min(1, 'Company/Branch is required'),
  p_usergroup_name: Yup.string().required('User Group Name is required').min(2, 'Min 2 characters'),
});

interface Props {
  formdata: AdminGroup | null;
  onSave: (data: AdminGroupFormValues) => void;
}

export default function AdminGroupForm({ formdata, onSave }: Props) {
  const [branchDD, setBranchDD] = useState<Company[]>([]);
  const [ddLoaded, setDdLoaded] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue, control } =
    useForm<AdminGroupFormValues>({
      resolver: yupResolver(schema) as never,
      defaultValues: {
        p_usergroup_id: 0, p_group_company_nid: 0,
        p_group_company_ngrpid: 0, p_group_company_flag: '', p_usergroup_name: '',
      },
    });

  const watchedBranch = useWatch({ control, name: 'p_group_company_nid' });

  // Load branch dropdown
  useEffect(() => {
    setDdLoaded(false);
    getCompanyBranch()
      .then((r) => setBranchDD(r?.data?.data ?? []))
      .catch(() => setBranchDD([]))
      .finally(() => setDdLoaded(true));
  }, []);

  // Sync hidden fields when branch selection changes
  useEffect(() => {
    if (watchedBranch && Number(watchedBranch) !== 0 && branchDD.length > 0) {
      const found = branchDD.find((b) => String(b.ADMIN_COMPANY_NID) === String(watchedBranch));
      setValue('p_group_company_ngrpid', found?.ADMIN_COMPANY_NGRPID ?? 0);
      setValue('p_group_company_flag', found?.ADIMN_CMPN_LAYER_SDSPFLG ?? '');
    } else {
      setValue('p_group_company_ngrpid', 0);
      setValue('p_group_company_flag', '');
    }
  }, [watchedBranch, branchDD, setValue]);

  // Populate form when editing
  useEffect(() => {
    if (!ddLoaded) return;
    if (formdata?.ADMIN_GROUP_NID) {
      reset({
        p_usergroup_id: formdata.ADMIN_GROUP_NID,
        p_group_company_nid: formdata.ADMIN_GROUP_NCMPNYID ?? 0,
        p_group_company_ngrpid: formdata.ADMIN_GROUP_NCMPNYGRPID ?? 0,
        p_group_company_flag: formdata.ADMIN_GROUP_SDEFFLG ?? '',
        p_usergroup_name: formdata.ADMIN_GROUP_SNAME ?? '',
      });
    } else {
      reset({ p_usergroup_id: 0, p_group_company_nid: 0, p_group_company_ngrpid: 0, p_group_company_flag: '', p_usergroup_name: '' });
    }
  }, [ddLoaded, formdata, reset]);

  return (
    <form id="admin-group-form" onSubmit={handleSubmit(onSave)} noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <FormField label="Company / Branch" loading={!ddLoaded} error={errors.p_group_company_nid?.message}>
            <select
              className={cn('form-select', errors.p_group_company_nid && 'border-red-400')}
              disabled={!ddLoaded}
              {...register('p_group_company_nid', { valueAsNumber: true })}
            >
              <option value={0}>-- Select --</option>
              {branchDD.map((opt) => (
                <option key={opt.ADMIN_COMPANY_NID} value={opt.ADMIN_COMPANY_NID}>
                  {opt.ADMIN_COMPANY_SNAME}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="md:col-span-2">
          <FormField label="User Group Name" required error={errors.p_usergroup_name?.message}>
            <input
              type="text"
              className={cn('form-input', errors.p_usergroup_name && 'border-red-400 focus:ring-red-400/40')}
              {...register('p_usergroup_name')}
            />
          </FormField>
        </div>
      </div>

      {/* Hidden fields */}
      <input type="hidden" {...register('p_usergroup_id', { valueAsNumber: true })} />
      <input type="hidden" {...register('p_group_company_ngrpid', { valueAsNumber: true })} />
      <input type="hidden" {...register('p_group_company_flag')} />
    </form>
  );
}
