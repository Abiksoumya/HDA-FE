import { useEffect, useState } from 'react';
import { useForm, useWatch, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { getCompanyBranch, getCompantDepartmentInfo } from '@/apis/master/companyDepartmentApi';
import FormField from '@/components/shared/FormField';
import DepartmentRow from './DepartmentRow';
import { cn } from '@/utils/cn';
import type { Company, CompanyDeptFormValues, DeptMappingItem } from '@/types';

const schema = Yup.object({
  ADMIN_CMPNY_DEPRT_NCMPNYID: Yup.number().min(1, 'Company/Branch is required'),
});

interface Props {
  onSave: (data: CompanyDeptFormValues) => void;
}

export default function CompanyDepartmentForm({ onSave }: Props) {
  const [branchDD, setBranchDD] = useState<Company[]>([]);
  const [departmentList, setDepartmentList] = useState<DeptMappingItem[]>([]);
  const [ddLoaded, setDdLoaded] = useState(false);
  const [deptLoading, setDeptLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue, control } =
    useForm<CompanyDeptFormValues>({
      resolver: yupResolver(schema) as never,
      defaultValues: {
        ADMIN_CMPNY_DEPRT_NCMPNYID: 0,
        ADMIN_CMPNY_DEPRT_NCMPNYGRPID: 0,
        departments: [],
      },
    });

  const { fields, append, remove } = useFieldArray({ control, name: 'departments' });
  const watchedBranch = useWatch({ control, name: 'ADMIN_CMPNY_DEPRT_NCMPNYID' });

  // Load branch dropdown
  useEffect(() => {
    setDdLoaded(false);
    getCompanyBranch()
      .then((r) => setBranchDD(r?.data?.data ?? []))
      .catch(() => setBranchDD([]))
      .finally(() => setDdLoaded(true));
  }, []);

  // Sync group ID hidden field
  useEffect(() => {
    if (watchedBranch && Number(watchedBranch) !== 0 && branchDD.length > 0) {
      const found = branchDD.find((b) => String(b.ADMIN_COMPANY_NID) === String(watchedBranch));
      setValue('ADMIN_CMPNY_DEPRT_NCMPNYGRPID', found?.ADMIN_COMPANY_NGRPID ?? 0);
    } else {
      setValue('ADMIN_CMPNY_DEPRT_NCMPNYGRPID', 0);
    }
  }, [watchedBranch, branchDD, setValue]);

  // Load departments when branch changes
  useEffect(() => {
    if (!watchedBranch || Number(watchedBranch) === 0) {
      setDepartmentList([]);
      remove();
      return;
    }

    setDeptLoading(true);
    getCompantDepartmentInfo(Number(watchedBranch))
      .then((res) => {
        const depts: DeptMappingItem[] = res?.data?.data ?? [];
        remove();
        depts.forEach((d) =>
          append({
            ADMIN_DEPRT_NID: d.ADMIN_DEPRT_NID ?? 0,
            ADMIN_CMPNY_DEPRT_CTRL_NFLG: d.ADMIN_CMPNY_DEPRT_CTRL_NFLG ? 1 : 0,
            IsSelected: d.IsSelected ? 1 : 0,
          }),
        );
        setDepartmentList(depts);
      })
      .catch(() => {
        setDepartmentList([]);
        remove();
      })
      .finally(() => setDeptLoading(false));
  }, [watchedBranch, append, remove]);

  return (
    <form id="company-dept-form" onSubmit={handleSubmit(onSave)} noValidate>
      {/* Branch selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <FormField label="Company / Branch" loading={!ddLoaded} error={errors.ADMIN_CMPNY_DEPRT_NCMPNYID?.message}>
            <select
              className={cn('form-select max-w-xs', errors.ADMIN_CMPNY_DEPRT_NCMPNYID && 'border-red-400')}
              disabled={!ddLoaded}
              {...register('ADMIN_CMPNY_DEPRT_NCMPNYID', { valueAsNumber: true })}
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
      </div>

      <input type="hidden" {...register('ADMIN_CMPNY_DEPRT_NCMPNYGRPID', { valueAsNumber: true })} />

      <hr className="my-4 border-slate-100" />

      {/* Department mapping table */}
      <div>
        <p className="text-xs font-medium text-slate-600 mb-2">Department List</p>
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          {deptLoading ? (
            <div className="py-10 flex items-center justify-center gap-2 text-slate-400 text-sm">
              <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
              Loading departments…
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-16">Select</th>
                  <th>Department</th>
                  <th className="w-36">Control Flag</th>
                </tr>
              </thead>
              <tbody>
                {departmentList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-slate-400 text-sm">
                      {Number(watchedBranch) === 0
                        ? 'Select a company/branch to load departments'
                        : 'No departments available'}
                    </td>
                  </tr>
                ) : (
                  fields.map((field, index) => (
                    <DepartmentRow
                      key={field.id}
                      index={index}
                      control={control}
                      register={register}
                      setValue={setValue}
                      department={departmentList[index]}
                    />
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </form>
  );
}
