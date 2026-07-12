import { Controller, FieldValues, useWatch, type Control, type UseFormRegister, type UseFormSetValue } from 'react-hook-form';
import type { CompanyDeptFormValues, DeptMappingItem } from '@/types';
import { cn } from '@/utils/cn';

interface UserDeptFormValues {
  departments: {
    ADMIN_DEPRT_NID: number;
    IsSelected: number;
    IsLoginApplicable: number;
    IsUserActive: number;
  }[];
}

// interface Props {
//   index: number;
//   control: Control<FieldValues>;
//   register: UseFormRegister<any>;
//   setValue: UseFormSetValue<any>;
//   department: DeptMappingItem;
//   onToggleChange: (dept: DeptMappingItem, field: 'IsSelected' | 'IsLoginApplicable' | 'IsUserActive', value: number) => void;
// }
interface Props {
  index: number;
  control: Control<FieldValues>;  // ← change from Control<any>
  register: UseFormRegister<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  department: DeptMappingItem;
  onToggleChange: (dept: DeptMappingItem, field: 'IsSelected' | 'IsLoginApplicable' | 'IsUserActive', value: number) => void;
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

export default function UserDepartmentRow({ index, control, register, setValue, department, onToggleChange }: Props) {
  const isSelected = useWatch({ control, name: `departments.${index}.IsSelected`, defaultValue: 0 });

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
        <input type="hidden" {...register(`departments.${index}.ADMIN_DEPRT_NID`, { valueAsNumber: true })} />
      </td>

      {/* Map toggle — disabled once mapped */}
      {/* <td className="px-4 py-3 text-center">
        <Controller
          name={`departments.${index}.IsSelected`}
          control={control}
          render={({ field }) => (
            <Toggle
              value={field.value === 1}
              onChange={(v) => {
                const val = v ? 1 : 0;
                field.onChange(val);
                onToggleChange(department, 'IsSelected', val);
              }}
              disabled={department.IsMapped === false}
            />
          )}
        />
      </td> */}
      {/* Map toggle — disabled if already mapped */}
<td className="px-4 py-3 text-center">
  <Controller
    name={`departments.${index}.IsSelected`}
    control={control}
    render={({ field }) => (
      <Toggle
        value={field.value === 1}
        onChange={(v) => {
          const val = v ? 1 : 0;
          field.onChange(val);
          onToggleChange(department, 'IsSelected', val);
        }}
        disabled={department.IsMapped === true} // ← disabled if already mapped
      />
    )}
  />
</td>

      {/* Login Applicable — disabled when not mapped */}
      <td className="px-4 py-3 text-center">
        <Controller
          name={`departments.${index}.IsLoginApplicable`}
          control={control}
          render={({ field }) => (
            <Toggle
              value={field.value === 1}
              onChange={(v) => {
                const val = v ? 1 : 0;
                field.onChange(val);
                onToggleChange(department, 'IsLoginApplicable', val);
              }}
              disabled={!isSelected}
            />
          )}
        />
      </td>

      {/* User Active — disabled when not mapped */}
      <td className="px-4 py-3 text-center">
        <Controller
          name={`departments.${index}.IsUserActive`}
          control={control}
          render={({ field }) => (
            <Toggle
              value={field.value === 1}
              onChange={(v) => {
                const val = v ? 1 : 0;
                field.onChange(val);
                onToggleChange(department, 'IsUserActive', val);
              }}
              disabled={!isSelected}
            />
          )}
        />
      </td>
    </tr>
  );
}