import { useEffect, useState,useRef } from 'react';
import { useForm, useWatch, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { getCompanyBranch, getCompanyDepartmentMapping } from '@/apis/master/companyDepartmentApi';
import FormField from '@/components/shared/FormField';
import DepartmentRow from './DepartmentRow';
import { cn } from '@/utils/cn';
import type { Company, CompanyDeptFormValues, DeptMappingItem } from '@/types';
import { ChevronDown, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/useToast';


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

interface DeptChange {
  DepartmentID: number;
  IsSelected: number;
  ControlFlag: number;
  IsActive: number;
  wasOriginallyMapped: boolean;
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
  const [changesMap, setChangesMap] = useState<Map<number, DeptChange>>(new Map());
  const { toast } = useToast();


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
const handleToggleChange = (
  dept: DeptMappingItem,
  field: 'IsSelected' | 'ControlFlag' | 'IsActive',
  value: number,
) => {
  setChangesMap((prev) => {
    const updated = new Map(prev);
    const existing = updated.get(dept.DepartmentID) ?? {
      DepartmentID: dept.DepartmentID,
      IsSelected: dept.IsMapped ? 1 : 0,
      ControlFlag: dept.ControlFlag ?? 0,
      IsActive: dept.InActive ? 0 : 1,
      wasOriginallyMapped: dept.IsMapped ?? false,
      wasSoftDeleted: false,
    };

    const newEntry = { ...existing };
if (field === 'IsSelected') {
  newEntry.IsSelected = value;
  // When newly mapping — keep IsActive as 0, user sets manually
  if (value === 1 && !existing.wasOriginallyMapped) {
    newEntry.IsActive = 0;
  }
}
if (field === 'ControlFlag') newEntry.ControlFlag = value;
if (field === 'IsActive') newEntry.IsActive = value;

    // If back to original state — remove from map
    const isBackToOriginal =
      newEntry.IsSelected === (dept.IsMapped ? 1 : 0) &&
      newEntry.ControlFlag === (dept.ControlFlag ?? 0) &&
      newEntry.IsActive === (dept.InActive ? 0 : 1);

    if (isBackToOriginal) {
      updated.delete(dept.DepartmentID);
    } else {
      updated.set(dept.DepartmentID, newEntry);
    }

    return updated;
  });
};
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
// Add pagination states at the top with other states
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 5;


// Replace the useEffect
useEffect(() => {
  if (!watchedBranch || Number(watchedBranch) === 0) {
    setDepartmentList([]);
    setCompanyParentID(0);
    setPage(1);
    setTotalPages(1);
    setTotal(0);
    setChangesMap(new Map()); // ← clear changes
    remove();
    return;
  }
  setChangesMap(new Map()); // ← clear changes when switching company
  loadDepartments(1);
}, [watchedBranch]);

// Add this function above the useEffect
const loadDepartments = (p: number) => {
  setDeptLoading(true);
  getCompanyDepartmentMapping(Number(watchedBranch), p, PAGE_SIZE)
    .then((res) => {
      const data = res?.data;

      const selectedBranch = branchDD.find((b) => b.CompanyID === Number(watchedBranch));
      setCompanyParentID(selectedBranch?.ParentCompanyID ?? data?.CompanyParentID ?? 0);

      const depts: DeptMappingItem[] = data?.Department ?? [];

      // ← use TotalRecords from SP response
      const totalRecords = data?.TotalRecords ?? depts.length;
      setTotal(totalRecords);
      setTotalPages(Math.ceil(totalRecords / PAGE_SIZE));
      setPage(p);

      remove();
      depts.forEach((d) =>
  append({
    ADMIN_DEPRT_NID: d.DepartmentID ?? 0,
    IsSelected: d.IsMapped ? 1 : 0,
    ADMIN_CMPNY_DEPRT_CTRL_NFLG: d.ControlFlag ?? 0,
    IsActive: d.IsMapped ? (d.InActive ? 0 : 1) : 0, // ← 0 if not mapped
  }, { shouldFocus: false }),
);
      setDepartmentList(depts);
    })
    .catch(() => {
      setDepartmentList([]);
      remove();
    })
    .finally(() => setDeptLoading(false));
}; // ← remove append/remove from deps to prevent re-trigger

 const handleSubmit2 = (_data: CompanyDeptFormValues) => {
  if (changesMap.size === 0) {
    toast('No changes to save.', 'info');
    return;
  }

  const departmentsToSave = Array.from(changesMap.values())
    .filter((d) => {
      // Skip: never mapped AND still not mapped
      if (!d.wasOriginallyMapped && d.IsSelected === 0) return false;
      return true;
    })
    .map((d) => {
      let RecordState: number;

      if (!d.wasOriginallyMapped && d.IsSelected === 1) {
        // New mapping → INSERT
        RecordState = 1;
      } else {
        // Update ControlFlag or Active → UPDATE
        RecordState = 2;
      }

      return {
        DepartmentID: d.DepartmentID,
        ControlFlag: d.ControlFlag,
        InActive: d.IsActive === 1 ? false : true,
        RecordState,
      };
    });

  if (departmentsToSave.length === 0) {
    toast('No valid changes to save.', 'info');
    return;
  }

  const payload = {
    CompanyID: Number(watchedBranch),
    CompanyParentID: companyParentID,
    Department: departmentsToSave,
  };

  console.log('Payload:', JSON.stringify(payload, null, 2));
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
      {total} departments
    </span>
    <span className="badge badge-green text-[11px]">
      {departmentList.filter((d) => d.IsMapped).length} mapped
    </span>
    {changesMap.size > 0 && (
      <span className="badge badge-amber text-[11px]">
        {changesMap.size} unsaved change{changesMap.size !== 1 ? 's' : ''}
      </span>
    )}
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
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">
                    SL No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Department
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide ">
                    Map
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Control
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide ">
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
    onToggleChange={handleToggleChange} // ← add this
  />
))
                )}
                </tbody>
               
              </table>
              
          )}
        </div>
         {totalPages > 1 && (
  <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
    <span>
      Showing page {page} of {totalPages} ({total} total departments)
    </span>
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => loadDepartments(page - 1)}
        disabled={page === 1 || deptLoading}
        className="inline-flex items-center gap-1 px-3 py-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={13} /> Prev
      </button>
      <span className="w-8 h-7 flex items-center justify-center rounded-md bg-blue-600 text-white text-xs font-medium">
        {page}
      </span>
      <button
        type="button"
        onClick={() => loadDepartments(page + 1)}
        disabled={page === totalPages || deptLoading}
        className="inline-flex items-center gap-1 px-3 py-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next <ChevronRight size={13} />
      </button>
    </div>
  </div>
)}
      </div>
    </form>
  );
}