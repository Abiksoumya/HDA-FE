// DepartmentForm.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import FormField from '@/components/shared/FormField';
import { cn } from '@/utils/cn';
import type { Department, DepartmentFormValues } from '@/types';

const schema = Yup.object({
  p_ADMIN_DEPRT_SNAME: Yup.string().required('Department name is required').min(2, 'Min 2 characters'),
  p_ADMIN_DEPRT_SPREFIX: Yup.string().required('Short name is required').min(2, 'Min 2 characters'),
});

interface Props { formdata: Department | null; onSave: (data: DepartmentFormValues) => void; }

export function DepartmentForm({ formdata, onSave }: Props) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<DepartmentFormValues>({
    resolver: yupResolver(schema),
    defaultValues: { p_ADMIN_DEPRT_NID: 0, p_ADMIN_DEPRT_SNAME: '', p_ADMIN_DEPRT_SPREFIX: '' },
  });

  useEffect(() => {
    if (formdata?.ADMIN_DEPRT_NID) {
      reset({ p_ADMIN_DEPRT_NID: formdata.ADMIN_DEPRT_NID, p_ADMIN_DEPRT_SNAME: formdata.ADMIN_DEPRT_SNAME, p_ADMIN_DEPRT_SPREFIX: formdata.ADMIN_DEPRT_SPREFIX ?? '' });
    } else {
      reset({ p_ADMIN_DEPRT_NID: 0, p_ADMIN_DEPRT_SNAME: '', p_ADMIN_DEPRT_SPREFIX: '' });
    }
  }, [formdata, reset]);

  const I = (k: keyof DepartmentFormValues) => cn('form-input', errors[k] && 'border-red-400 focus:ring-red-400/40');

  return (
    <form id="department-form" onSubmit={handleSubmit(onSave)} noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <FormField label="Department Name" required error={errors.p_ADMIN_DEPRT_SNAME?.message}>
            <input type="text" className={I('p_ADMIN_DEPRT_SNAME')} {...register('p_ADMIN_DEPRT_SNAME')} />
          </FormField>
        </div>
        <FormField label="Short Name" required error={errors.p_ADMIN_DEPRT_SPREFIX?.message}>
          <input type="text" className={I('p_ADMIN_DEPRT_SPREFIX')} {...register('p_ADMIN_DEPRT_SPREFIX')} />
        </FormField>
      </div>
    </form>
  );
}
