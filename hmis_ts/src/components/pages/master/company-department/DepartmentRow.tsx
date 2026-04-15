import { useEffect } from 'react';
import { Controller, useWatch, type Control, type UseFormRegister, type UseFormSetValue } from 'react-hook-form';
import type { CompanyDeptFormValues, DeptMappingItem } from '@/types';
import { cn } from '@/utils/cn';

interface Props {
  index: number;
  control: Control<CompanyDeptFormValues>;
  register: UseFormRegister<CompanyDeptFormValues>;
  setValue: UseFormSetValue<CompanyDeptFormValues>;
  department: DeptMappingItem;
}

function Toggle({
  value,
  onChange,
  disabled = false,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(!value)}
      className={cn(
        'relative inline-flex h-7 w-16 items-center rounded-full transition-colors duration-200 select-none',
        value ? 'bg-emerald-500' : 'bg-slate-300',
        disabled && 'opacity-30 cursor-not-allowed',
      )}
    >
      <span className={cn(
        'absolute text-[10px] font-bold text-white transition-all duration-200',
        value ? 'left-2' : 'right-2',
      )}>
        {value ? 'YES' : 'NO'}
      </span>
      <span className={cn(
        'absolute h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
        value ? 'translate-x-9' : 'translate-x-1',
      )} />
    </button>
  );
}

export default function DepartmentRow({ index, control, register, setValue, department }: Props) {
  const isSelected = useWatch({ control, name: `departments.${index}.IsSelected`, defaultValue: 0 });

  // Reset control and active when unmapped
  useEffect(() => {
    if (!isSelected) {
      setValue(`departments.${index}.ADMIN_CMPNY_DEPRT_CTRL_NFLG`, 0, { shouldDirty: true });
      setValue(`departments.${index}.IsActive`, 0, { shouldDirty: true });
    }
  }, [isSelected, index, setValue]);

  return (
    <tr className={cn(
      'border-b border-slate-100 last:border-0 transition-colors',
      isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50',
    )}>
      {/* SL No */}
      <td className="px-4 py-3 text-slate-400 text-sm text-center">{index + 1}</td>

     {/* Department name */}
<td className="px-4 py-3 text-sm text-slate-700 font-medium">
  {department?.Department ?? department?.ADMIN_DEPRT_SNAME ?? ''}
  <input
    type="hidden"
    {...register(`departments.${index}.ADMIN_DEPRT_NID`, { valueAsNumber: true })}
  />
</td>

      {/* Map toggle */}
      <td className="px-4 py-3 text-center">
        <Controller
          name={`departments.${index}.IsSelected`}
          control={control}
          render={({ field }) => (
            <Toggle value={field.value === 1} onChange={(v) => field.onChange(v ? 1 : 0)} />
          )}
        />
      </td>

      {/* Control toggle — disabled when not mapped */}
      <td className="px-4 py-3 text-center">
        <Controller
          name={`departments.${index}.ADMIN_CMPNY_DEPRT_CTRL_NFLG`}
          control={control}
          render={({ field }) => (
            <Toggle
              value={field.value === 1}
              onChange={(v) => field.onChange(v ? 1 : 0)}
              disabled={!isSelected}
            />
          )}
        />
      </td>

      {/* Active toggle — disabled when not mapped */}
      <td className="px-4 py-3 text-center">
        <Controller
          name={`departments.${index}.IsActive`}
          control={control}
          render={({ field }) => (
            <Toggle
              value={field.value === 1}
              onChange={(v) => field.onChange(v ? 1 : 0)}
              disabled={!isSelected}
            />
          )}
        />
      </td>
    </tr>
  );
}