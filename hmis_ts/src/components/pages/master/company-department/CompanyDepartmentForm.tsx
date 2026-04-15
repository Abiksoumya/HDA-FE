import { useEffect, useState,useRef } from 'react';
import { useForm, useWatch, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { getCompanyBranch, getCompanyDepartmentMapping } from '@/apis/master/companyDepartmentApi';
import FormField from '@/components/shared/FormField';
import DepartmentRow from './DepartmentRow';
import { cn } from '@/utils/cn';
import type { Company, CompanyDeptFormValues, DeptMappingItem } from '@/types';
import { ChevronDown, Check } from 'lucide-react';


const schema = Yup.object({
  ADMIN_CMPNY_DEPRT_NCMPNYID: Yup.number().min(1, 'Company/Branch is required'),
});

interface Props {
  onSave: (data: unknown) => void;
}

interface BranchOption {
  CompanyID: number;
  Description: string;
  ParentCompanyID?: number;
}

// Add this custom dropdown component inside the file
function BranchDropdown({
  options,
  value,
  onChange,
  disabled,
  placeholder = '-- Select --',
}: {
  options: BranchOption[];
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.CompanyID === value);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative w-72">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full h-8 px-3 pr-8 text-sm text-left rounded-md border border-slate-200 bg-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-all duration-150',
        )}
      >
        <span className={selected ? 'text-slate-800' : 'text-slate-400'}>
          {selected ? selected.Description : placeholder}
        </span>
        <ChevronDown
          size={13}
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform duration-150',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-fade-in">
          <div className="max-h-52 overflow-y-auto">
            <div
              className="px-3 py-2 text-sm text-slate-400 hover:bg-slate-500 cursor-pointer"
              onClick={() => { onChange(0); setOpen(false); }}
            >
              {placeholder}
            </div>
            {options.map((opt) => (
              <div
                key={opt.CompanyID}
                onClick={() => { onChange(opt.CompanyID); setOpen(false); }}
                className={cn(
                  'flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors',
                  value === opt.CompanyID
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-slate-700 hover:bg-slate-200',
                )}
              >
                {opt.Description}
                {value === opt.CompanyID && <Check size={13} className="text-blue-600" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompanyDepartmentForm({ onSave }: Props) {
const [branchDD, setBranchDD] = useState<BranchOption[]>([]);
  const [departmentList, setDepartmentList] = useState<DeptMappingItem[]>([]);
  const [ddLoaded, setDdLoaded] = useState(false);
  const [deptLoading, setDeptLoading] = useState(false);
  const [companyParentID, setCompanyParentID] = useState(0);

  const { register, handleSubmit, formState: { errors }, setValue, control } =
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
    .then((r) => {
      const data = r?.data ?? [];
      setBranchDD(data);
    })
    .catch(() => setBranchDD([]))
    .finally(() => setDdLoaded(true));
}, []);

  // Load departments with mapping when branch changes
useEffect(() => {
  if (!watchedBranch || Number(watchedBranch) === 0) {
    setDepartmentList([]);
    setCompanyParentID(0);
    remove();
    return;
  }

  setDeptLoading(true);
  getCompanyDepartmentMapping(Number(watchedBranch))
    .then((res) => {
      const data = res?.data;

      const selectedBranch = branchDD.find((b) => b.CompanyID === Number(watchedBranch));
      setCompanyParentID(selectedBranch?.ParentCompanyID ?? data?.CompanyParentID ?? 0);

      const depts: DeptMappingItem[] = data?.Department ?? [];

      // ← batch: remove all then append all at once
      remove();
      const newFields = depts.map((d) => ({
        ADMIN_DEPRT_NID: d.DepartmentID ?? 0,
        IsSelected: d.IsMapped ? 1 : 0,
        ADMIN_CMPNY_DEPRT_CTRL_NFLG: d.ControlFlag ?? 0,
        IsActive: d.InActive ? 0 : 1,
      }));

      // Use replace instead of multiple appends
      newFields.forEach((f) => append(f, { shouldFocus: false })); // ← shouldFocus: false stops scroll jump

      setDepartmentList(depts);
    })
    .catch(() => {
      setDepartmentList([]);
      remove();
    })
    .finally(() => setDeptLoading(false));
}, [watchedBranch]);  // ← remove append/remove from deps to prevent re-trigger

  const handleSubmit2 = (data: CompanyDeptFormValues) => {
    // Build payload matching SP structure
    const payload = {
      CompanyID: Number(data.ADMIN_CMPNY_DEPRT_NCMPNYID),
      CompanyParentID: companyParentID,
      Department: data.departments.map((d) => ({
        DepartmentID: d.ADMIN_DEPRT_NID,
        ControlFlag: d.ADMIN_CMPNY_DEPRT_CTRL_NFLG ?? 0,
        InActive: d.IsActive === 1 ? false : true, // IsActive=1 means InActive=false
        RecordState: d.IsSelected === 1 ? 1 : 2,   // 1=mapped, 2=unmapped
      })),
    };
    onSave(payload);
  };

  return (
    <form id="company-dept-form" onSubmit={handleSubmit(handleSubmit2)} noValidate>

      {/* Company / Branch selector */}
      <div className="flex items-end gap-4 mb-6">
        <div className="w-72">
          <FormField
  label="Company / Branch"
  loading={!ddLoaded}
  error={errors.ADMIN_CMPNY_DEPRT_NCMPNYID?.message}
>
  <BranchDropdown
    options={branchDD}
    value={Number(watchedBranch) || 0}
    onChange={(v) => setValue('ADMIN_CMPNY_DEPRT_NCMPNYID', v)}
    disabled={!ddLoaded}
  />
</FormField>
        </div>

        {/* Summary badge */}
        {Number(watchedBranch) !== 0 && !deptLoading && departmentList.length > 0 && (
          <div className="flex items-center gap-2 pb-1">
            <span className="badge badge-slate text-[11px]">
              {departmentList.length} departments
            </span>
            <span className="badge badge-green text-[11px]">
              {departmentList.filter((d) => d.IsMapped).length} mapped
            </span>
          </div>
        )}
      </div>

      <input type="hidden" {...register('ADMIN_CMPNY_DEPRT_NCMPNYGRPID', { valueAsNumber: true })} />

      {/* Department mapping table */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          List of Departments
        </p>

        <div className={cn(
  'rounded-xl border border-slate-200 overflow-hidden transition-opacity duration-200',
  deptLoading ? 'opacity-50' : 'opacity-100',
)}>
  {deptLoading ? (
    <div className="py-14 flex items-center justify-center gap-2 text-slate-400 text-sm">
      <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      Loading departments…
    </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-16">
                    SL No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Department
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-36">
                    Map
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-36">
                    Control
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-36">
                    Active
                  </th>
                </tr>
              </thead>
              <tbody>
                {departmentList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-14 text-center text-slate-400 text-sm">
                      {Number(watchedBranch) === 0
                        ? 'Select a company / branch to load departments'
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