import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useAppSelector } from '@/hooks/redux';
import FormField from '@/components/shared/FormField';
import { cn } from '@/utils/cn';
import type { GroupFormValues, Group } from '@/types';

const schema = Yup.object({
  p_Description: Yup.string().required('Group name is required').min(2, 'Min 2 characters'),
});

interface Props {
  formdata: Group | null;
  onSave: (data: unknown) => void;
}

export default function GroupForm({ formdata, onSave }: Props) {
  const user = useAppSelector((s) => s.auth.user);
const dept = (user as any)?.UserDepartment?.[0];
const companyId = dept?.CompanyGroupID ?? 0;         // ← 2
const companyGroupId = dept?.CompanyGroupParentID ?? 0; // ← 1
const companyGroupName = dept?.CompanyGroupName ?? ''; // ← display name

console.log('dept:', dept);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } =
    useForm<GroupFormValues>({
      resolver: yupResolver(schema) as never,
      defaultValues: {
        p_GroupID: 0,
        p_CompanyID: 0,
        p_GroupCompanyID: 0,
        p_Description: '',
        p_DefaultFlag: 'N',
        p_inactive: false,
      },
    });

  // Populate form when editing
  useEffect(() => {
    if (formdata?.GroupID) {
      reset({
        p_GroupID: formdata.GroupID,
        p_CompanyID: formdata.CompanyID,
        p_GroupCompanyID: formdata.GroupCompanyID,
        p_Description: formdata.GroupName ?? '',
        p_DefaultFlag: formdata.DefaultFlag ?? 'N',
        p_inactive: formdata.InActive ?? false,
      });
    } else {
      reset({
        p_GroupID: 0,
    p_CompanyID: companyId,         // ← 3, not companyGroupId
        p_GroupCompanyID: companyGroupId,
        p_Description: '',
        p_DefaultFlag: 'N',
        p_inactive: false,
      });
    }
  }, [formdata, reset, companyGroupId]);

 const onSubmit = (data: GroupFormValues) => {
  const payload = {
    GroupID: data.p_GroupID ?? 0,
    CompanyID: companyId,       // ← 2
    GroupCompanyID: companyGroupId, // ← 1
    Description: data.p_Description,
    DefaultFlag: data.p_DefaultFlag ?? 'N',
    InActive: data.p_inactive ?? false,
    RecordState: data.p_GroupID ? 2 : 1,
  };
  onSave(payload);
};

  const I = (name: keyof GroupFormValues) =>
    cn('form-input', errors[name] && 'border-red-400 focus:ring-red-400/40');

  return (
    <form id="group-form" onSubmit={handleSubmit(onSubmit)} noValidate>

      {/* Row 1 — Company (read-only) + Status toggle */}
      <div className="flex items-end justify-between gap-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
          <div className="md:col-span-6">
            <FormField label="Company">
              <input
                type="text"
                className="form-input bg-slate-50 text-slate-500 cursor-not-allowed truncate"
                value={companyGroupName}
                readOnly
              />
            </FormField>
          </div>
        </div>

        {/* Status toggle */}
        <div className="flex items-center gap-3 pb-1 flex-shrink-0">
          <span className="text-xs font-medium text-slate-600">Status</span>
          <button
            type="button"
            onClick={() => setValue('p_inactive', !watch('p_inactive'))}
            className={cn(
              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200',
              watch('p_inactive') ? 'bg-red-400' : 'bg-emerald-500',
            )}
          >
            <span className={cn(
              'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200',
              watch('p_inactive') ? 'translate-x-1' : 'translate-x-4',
            )} />
          </button>
          <span className={cn(
            'text-xs font-medium',
            watch('p_inactive') ? 'text-red-500' : 'text-emerald-600',
          )}>
            {watch('p_inactive') ? 'Inactive' : 'Active'}
          </span>
        </div>
      </div>

      {/* Row 2 — Group Name + Default Flag */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-5">
          <FormField label="Group Name" required error={errors.p_Description?.message}>
            <input
              type="text"
              className={I('p_Description')}
              {...register('p_Description')}
              placeholder="Enter group name"
            />
          </FormField>
        </div>
        <div className="md:col-span-3">
          <FormField label="Default Flag">
            <select className="form-select" {...register('p_DefaultFlag')}>
              <option value="N">No</option>
              <option value="Y">Yes</option>
            </select>
          </FormField>
        </div>
      </div>

    </form>
  );
}