import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import FormField from '@/components/shared/FormField';
import { cn } from '@/utils/cn';
import type { Department, DepartmentFormValues } from '@/types';

const schema = Yup.object({
  p_ADMIN_DEPRT_SNAME: Yup.string()
    .required('Department name is required')
    .min(2, 'Min 2 characters'),
  p_ADMIN_DEPRT_SPREFIX: Yup.string()
    .required('Code is required')
    .max(10, 'Max 10 characters'),
});

interface Props {
  formdata: Department | null;
  onSave: (data: unknown) => void;
}

export default function DepartmentForm({ formdata, onSave }: Props) {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } =
    useForm<DepartmentFormValues>({
      resolver: yupResolver(schema) as never,
      defaultValues: {
        p_ADMIN_DEPRT_NID: 0,
        p_ADMIN_DEPRT_SNAME: '',
        p_ADMIN_DEPRT_SPREFIX: '',
        p_inactive: false,
      },
    });

  // Populate form when editing
  useEffect(() => {
    if (formdata?.DepartmentID) {
      reset({
        p_ADMIN_DEPRT_NID: formdata.DepartmentID,
        p_ADMIN_DEPRT_SNAME: formdata.Description ?? '',
        p_ADMIN_DEPRT_SPREFIX: formdata.Code ?? '',
        p_inactive: formdata.InActive ?? false,
      });
    } else {
      reset({
        p_ADMIN_DEPRT_NID: 0,
        p_ADMIN_DEPRT_SNAME: '',
        p_ADMIN_DEPRT_SPREFIX: '',
        p_inactive: false,
      });
    }
  }, [formdata, reset]);

  const onSubmit = (data: DepartmentFormValues) => {
    const payload = {
      DepartmentID: data.p_ADMIN_DEPRT_NID ?? 0,
      Code: data.p_ADMIN_DEPRT_SPREFIX,
      Description: data.p_ADMIN_DEPRT_SNAME,
      InActive: data.p_inactive ?? false,
      RecordState: data.p_ADMIN_DEPRT_NID ? 2 : 1,
    };
    onSave(payload);
  };

  const I = (name: keyof DepartmentFormValues) =>
    cn('form-input', errors[name] && 'border-red-400 focus:ring-red-400/40');

  return (
    <form id="department-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Row 1 — Name + Code + Status toggle */}
      <div className="flex items-end justify-between gap-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
          <div className="md:col-span-5">
            <FormField label="Department Name" required error={errors.p_ADMIN_DEPRT_SNAME?.message}>
              <input
                type="text"
                className={I('p_ADMIN_DEPRT_SNAME')}
                {...register('p_ADMIN_DEPRT_SNAME')}
              />
            </FormField>
          </div>
          <div className="md:col-span-3">
            <FormField label="Code / Short Name" required error={errors.p_ADMIN_DEPRT_SPREFIX?.message}>
              <input
                type="text"
                className={I('p_ADMIN_DEPRT_SPREFIX')}
                {...register('p_ADMIN_DEPRT_SPREFIX')}
              />
            </FormField>
          </div>
           <div className="flex items-center gap-3 pt-3 col-span-2 ">
          <span className="text-xs font-medium text-slate-600">Status</span>
          <button
            type="button"
            onClick={() => setValue('p_inactive', !watch('p_inactive'))}
            className={cn(
              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200',
              watch('p_inactive') ? 'bg-red-600' : 'bg-emerald-700',
            )}
          >
            <span
              className={cn(
                'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200',
                watch('p_inactive') ? 'translate-x-1' : 'translate-x-4',
              )}
            />
          </button>
          {/* <span className={cn(
            'text-xs font-medium',
            watch('p_inactive') ? 'text-red-500' : 'text-emerald-600',
          )}>
            {watch('p_inactive') ? 'Inactive' : 'Active'}
          </span> */}
        </div>
        </div>

       
      </div>
    </form>
  );
}