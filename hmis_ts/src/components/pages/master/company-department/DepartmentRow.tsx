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

export default function DepartmentRow({ index, control, register, setValue, department }: Props) {
  const isSelected = useWatch({
    control,
    name: `departments.${index}.IsSelected`,
    defaultValue: 0,
  });

  // Auto-reset control flag when row is deselected
  useEffect(() => {
    if (!isSelected) {
      setValue(`departments.${index}.ADMIN_CMPNY_DEPRT_CTRL_NFLG`, 0, { shouldDirty: true });
    }
  }, [isSelected, index, setValue]);

  return (
    <tr className={cn(isSelected ? 'bg-blue-50' : 'hover:bg-slate-50', 'transition-colors')}>
      {/* Selection checkbox */}
      <td className="px-3 py-2">
        <Controller
          name={`departments.${index}.IsSelected`}
          control={control}
          render={({ field }) => (
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              checked={field.value === 1}
              onChange={(e) => field.onChange(e.target.checked ? 1 : 0)}
            />
          )}
        />
      </td>

      {/* Department name */}
      <td className="px-3 py-2 text-sm text-slate-700">
        {department?.ADMIN_DEPRT_SNAME}
        <input type="hidden" {...register(`departments.${index}.ADMIN_DEPRT_NID`, { valueAsNumber: true })} />
      </td>

      {/* Control flag checkbox */}
      <td className="px-3 py-2">
        <Controller
          name={`departments.${index}.ADMIN_CMPNY_DEPRT_CTRL_NFLG`}
          control={control}
          render={({ field }) => (
            <input
              type="checkbox"
              className={cn(
                'w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500',
                !isSelected && 'opacity-40 cursor-not-allowed',
              )}
              checked={field.value === 1}
              onChange={(e) => field.onChange(e.target.checked ? 1 : 0)}
              disabled={!isSelected}
            />
          )}
        />
      </td>
    </tr>
  );
}
