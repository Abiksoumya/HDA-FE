

// import { useEffect, useState,useRef  } from 'react';
// import { useForm, useWatch, useFieldArray, FieldValues, Control, UseFormRegister, UseFormSetValue } from 'react-hook-form';
// import { yupResolver } from '@hookform/resolvers/yup';
// import * as Yup from 'yup';
// import { Eye, EyeOff } from 'lucide-react';
// import { getCompaniesForDropdown } from '@/apis/master/companyApi';
// import { getGroupsForDropdown } from '@/apis/master/groupApi';
// import { getCompanyDepartmentMapping } from '@/apis/master/companyDepartmentApi';
// import { getAllUsers } from '@/apis/master/userApi';
// import FormField from '@/components/shared/FormField';
// import UserDepartmentRow from './UserDepartmentRow';
// import { cn } from '@/utils/cn';
// import type { UserFormValues, DeptMappingItem, UserDeptChange, UserDepartment } from '@/types';

// const schema = Yup.object({
//   p_CompanyID: Yup.number().min(1, 'Company is required'),
//   p_GroupID: Yup.number().min(1, 'User Group is required'),
//   p_UserName: Yup.string().required('Full name is required'),
//   p_UserLoginID: Yup.string().required('Login ID is required'),
//   p_Password: Yup.string().when('p_UserID', {
//     is: 0,
//     then: (s) => s.required('Password is required').min(6, 'Min 6 characters'),
//     otherwise: (s) => s.notRequired(), // ← fix
//   }),
//   p_ConfirmPassword: Yup.string().when('p_Password', {
//     is: (v: string) => v && v.length > 0,
//     then: (s) => s.required('Please confirm password').oneOf([Yup.ref('p_Password')], 'Passwords do not match'),
//     otherwise: (s) => s.notRequired(), // ← fix
//   }),
// });

// interface CompanyOption { CompanyID: number; Description: string; ParentCompanyID?: number; }
// interface GroupOption { GroupID: number; GroupName: string; CompanyID: number; GroupCompanyID: number; }

// interface Props {
//   editUser: UserDepartment | null;
//   onSave: (data: unknown, onSuccess?: () => void) => void;
// }



// export default function UserForm({ editUser, onSave }: Props) {
//   const [companyDD, setCompanyDD] = useState<CompanyOption[]>([]);
//   const [groupDD, setGroupDD] = useState<GroupOption[]>([]);
//   const [departmentList, setDepartmentList] = useState<DeptMappingItem[]>([]);
//   const [ddLoaded, setDdLoaded] = useState(false);
//   const [groupLoading, setGroupLoading] = useState(false);
//   const [deptLoading, setDeptLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);
//   const [changesMap, setChangesMap] = useState<Map<number, UserDeptChange>>(new Map());
//    const [isSubmitting, setIsSubmitting] = useState(false);

//   const isEditMode = !!editUser;
  
//   const isFirstLoad = useRef(true);
// const editUserRef = useRef<UserDepartment | null>(null);

//   const { register, handleSubmit, formState: { errors }, reset, setValue, watch, control } =
//     useForm<UserFormValues>({
//       resolver: yupResolver(schema) as never,
//       defaultValues: {
//         p_UserID: 0,
//         p_CompanyID: 0,
//         p_CompanyGroupID: 0,
//         p_GroupID: 0,
//         p_UserLoginID: '',
//         p_Password: '',
//         p_ConfirmPassword: '',
//         p_UserName: '',
//         p_inactive: false,
//       },
//     });

//   const { fields, append, remove } = useFieldArray({ control, name: 'departments' as never });
//   const watchedCompany = useWatch({ control, name: 'p_CompanyID' });

//   // Load company dropdown
//   useEffect(() => {
//     getCompaniesForDropdown()
//       .then((r) => setCompanyDD(r?.data ?? []))
//       .catch(() => setCompanyDD([]))
//       .finally(() => setDdLoaded(true));
//   }, []);

//   // Populate form when editing
//  useEffect(() => {
//   if (editUser && companyDD.length > 0) {
//     editUserRef.current = editUser; // ← store ref
//     reset({
//       p_UserID: editUser.UserID,
//       p_CompanyID: editUser.CompanyID,
//       p_CompanyGroupID: editUser.CompanyGroupID,
//       p_GroupID: editUser.GroupID,
//       p_UserLoginID: editUser.UserLoginID,
//       p_Password: '',
//       p_ConfirmPassword: '',
//       p_UserName: editUser.UserName,
//       p_inactive: editUser.InActive ?? false,
//     });
//     // Load departments explicitly for edit
//     loadDepartments(editUser.CompanyID);
//   } else {
//     editUserRef.current = null;
//   }
// }, [editUser, companyDD, reset]);

//   // Load groups when company changes
//   useEffect(() => {
//     if (!watchedCompany || Number(watchedCompany) === 0) {
//       setGroupDD([]);
//       return;
//     }
//     setGroupLoading(true);
//     getGroupsForDropdown(0, 0)
//       .then((r) => setGroupDD(r?.data ?? []))
//       .catch(() => setGroupDD([]))
//       .finally(() => setGroupLoading(false));
//   }, [watchedCompany]);

//   // Load departments when company changes
// useEffect(() => {
//   if (!watchedCompany || Number(watchedCompany) === 0) {
//     setDepartmentList([]);
//     setChangesMap(new Map());
//     remove();
//     return;
//   }

//   // Skip if triggered by editUser population — handled separately
//   if (editUserRef.current?.CompanyID === Number(watchedCompany)) return;

//   loadDepartments(Number(watchedCompany));
// }, [watchedCompany]);

//   const loadDepartments = async (companyId: number) => {
//     setDeptLoading(true);
//     try {
//       // Load all company departments
//       const deptRes = await getCompanyDepartmentMapping(companyId, 0, 0);
//       const allDepts: DeptMappingItem[] = deptRes?.data?.Department ?? [];

//       // If edit mode — load user's existing department assignments
//       let userDepts: UserDepartment[] = [];
//       if (editUser) {
//         const userRes = await getAllUsers(1, 100, companyId, 0);
//         const allUserDepts: UserDepartment[] = userRes?.data?.UserDepartment ?? [];
//         // Filter for this specific user
//         userDepts = allUserDepts.filter((u) => u.UserID === editUser.UserID);
//       }

//       // Build a map of user's dept assignments
//       const userDeptMap = new Map<number, UserDepartment>();
//       userDepts.forEach((u) => userDeptMap.set(u.DepartmentID, u));

//       // Merge: mark which departments are already mapped
//       const mergedDepts = allDepts.map((d) => ({
//         ...d,
//         IsMapped: userDeptMap.has(d.DepartmentID),
//         IsLoginApplicable: userDeptMap.get(d.DepartmentID)?.IsLoginApplicable ?? false,
//         IsUserActive: userDeptMap.get(d.DepartmentID)?.IsUserActive ?? false,
//       }));

//       remove();
//       mergedDepts.forEach((d) =>
//         append({
//           ADMIN_DEPRT_NID: d.DepartmentID ?? 0,
//           IsSelected: d.IsMapped ? 1 : 0,
//           IsLoginApplicable: d.IsLoginApplicable ? 1 : 0,
//           IsUserActive: d.IsUserActive ? 1 : 0,
//         } as never, { shouldFocus: false }),
//       );
//       setDepartmentList(mergedDepts);
//       setChangesMap(new Map());

//       // Set CompanyGroupID
//       const selected = companyDD.find((c) => c.CompanyID === companyId);
//       setValue('p_CompanyGroupID', selected?.ParentCompanyID ?? 0);

//     } catch {
//       setDepartmentList([]);
//       remove();
//     } finally {
//       setDeptLoading(false);
//     }
//   };

//   const handleToggleChange = (
//     dept: DeptMappingItem,
//     field: 'IsSelected' | 'IsLoginApplicable' | 'IsUserActive',
//     value: number,
//   ) => {
//     setChangesMap((prev) => {
//       const updated = new Map(prev);
//       const existing = updated.get(dept.DepartmentID) ?? {
//         DepartmentID: dept.DepartmentID,
//         IsSelected: dept.IsMapped ? 1 : 0,
//         IsLoginApplicable: dept.IsLoginApplicable ?? false,
//         IsUserActive: dept.IsUserActive ?? false,
//         InActive: false,
//         wasOriginallyMapped: dept.IsMapped ?? false,
//       };

//       const newEntry = { ...existing };
//       if (field === 'IsSelected') newEntry.IsSelected = value;
//       if (field === 'IsLoginApplicable') newEntry.IsLoginApplicable = value === 1;
//       if (field === 'IsUserActive') newEntry.IsUserActive = value === 1;

//       if (field === 'IsSelected' && value === 0) {
//         newEntry.IsLoginApplicable = false;
//         newEntry.IsUserActive = false;
//       }

//       if (newEntry.IsSelected === 0 && !newEntry.wasOriginallyMapped) {
//         updated.delete(dept.DepartmentID);
//       } else {
//         updated.set(dept.DepartmentID, newEntry);
//       }

//       return updated;
//     });
//   };

//   const onSubmit = (data: UserFormValues) => {
//     if (isSubmitting) return; // ← prevent double submit
//   setIsSubmitting(true);
//     // Build departments — include all mapped + newly mapped
//     const allMappedDepts = departmentList
//       .filter((d) => d.IsMapped)
//       .map((d) => {
//         const change = changesMap.get(d.DepartmentID);
//         return {
//           DepartmentID: d.DepartmentID,
//           IsLoginApplicable: change ? change.IsLoginApplicable : (d.IsLoginApplicable ?? false),
//           IsUserActive: change ? change.IsUserActive : (d.IsUserActive ?? false),
//           InActive: false,
//           RecordState: 2, // update existing
//         };
//       });

//     // Newly mapped departments
//     const newlyMapped = Array.from(changesMap.values())
//       .filter((d) => !d.wasOriginallyMapped && d.IsSelected === 1)
//       .map((d) => ({
//         DepartmentID: d.DepartmentID,
//         IsLoginApplicable: d.IsLoginApplicable,
//         IsUserActive: d.IsUserActive,
//         InActive: false,
//         RecordState: 1, // new
//       }));

//     const departments = isEditMode
//       ? [...allMappedDepts, ...newlyMapped]
//       : Array.from(changesMap.values())
//           .filter((d) => d.IsSelected === 1)
//           .map((d) => ({
//             DepartmentID: d.DepartmentID,
//             IsLoginApplicable: d.IsLoginApplicable,
//             IsUserActive: d.IsUserActive,
//             InActive: false,
//             RecordState: 1,
//           }));

//     const payload: Record<string, unknown> = {
//       UserID: data.p_UserID ?? 0,
//       UserLoginID: data.p_UserLoginID,
//       UserName: data.p_UserName,
//       CompanyID: Number(data.p_CompanyID),
//       CompanyGroupID: Number(data.p_CompanyGroupID),
//       GroupID: Number(data.p_GroupID),
//       InActive: data.p_inactive ?? false,
//       RecordState: isEditMode ? 2 : 1,
//       Departments: departments,
//     };

//     // Only include password if filled
//     if (data.p_Password && data.p_Password.length > 0) {
//       payload.Password = data.p_Password;
//     } else if (!isEditMode) {
//       payload.Password = data.p_Password;
//     }

//     onSave(payload, () => {
//           setIsSubmitting(false);

//       reset();
//       setChangesMap(new Map());
//       remove();
//       setDepartmentList([]);
//     });
//   };

//   const I = (name: keyof UserFormValues) =>
//     cn('form-input', errors[name] && 'border-red-400 focus:ring-red-400/40');

//   return (
//     <form id="user-form" onSubmit={handleSubmit(onSubmit)} noValidate>
//       {/* Row 1 — Company + Group + Status */}
//       <div className="flex items-end justify-between gap-4 mb-4">
//         <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
//           <div className="md:col-span-4">
//             <FormField label="Company / Branch" loading={!ddLoaded} error={errors.p_CompanyID?.message}>
//               <select
//                 className={cn('form-select', errors.p_CompanyID && 'border-red-400')}
//                 disabled={!ddLoaded || isEditMode} // ← disabled on edit
//                 {...register('p_CompanyID', { valueAsNumber: true })}
//               >
//                 <option value={0}>-- Select --</option>
//                 {companyDD.map((opt) => (
//                   <option key={opt.CompanyID} value={opt.CompanyID}>{opt.Description}</option>
//                 ))}
//               </select>
//             </FormField>
//           </div>

//           <div className="md:col-span-4">
//             <FormField label="User Group" loading={groupLoading} error={errors.p_GroupID?.message}>
//               <select
//                 className={cn('form-select', errors.p_GroupID && 'border-red-400')}
//                 disabled={groupLoading || groupDD.length === 0}
//                 {...register('p_GroupID', { valueAsNumber: true })}
//               >
//                 <option value={0}>-- Select --</option>
//                 {groupDD.map((opt) => (
//                   <option key={opt.GroupID} value={opt.GroupID}>{opt.GroupName}</option>
//                 ))}
//               </select>
//             </FormField>
//           </div>
//         </div>

//         {/* Status toggle */}
//         <div className="flex items-center gap-3 pb-1 flex-shrink-0">
//           <span className="text-xs font-medium text-slate-600">Status</span>
//           <button
//             type="button"
//             onClick={() => setValue('p_inactive', !watch('p_inactive'))}
//             className={cn(
//               'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200',
//               watch('p_inactive') ? 'bg-red-400' : 'bg-emerald-500',
//             )}
//           >
//             <span className={cn(
//               'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200',
//               watch('p_inactive') ? 'translate-x-1' : 'translate-x-4',
//             )} />
//           </button>
//           <span className={cn('text-xs font-medium', watch('p_inactive') ? 'text-red-500' : 'text-emerald-600')}>
//             {watch('p_inactive') ? 'Inactive' : 'Active'}
//           </span>
//         </div>
//       </div>

//       {/* Row 2 — User details */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
//         <div className="md:col-span-2">
//           <FormField label="Full Name" required error={errors.p_UserName?.message}>
//             <input type="text" className={I('p_UserName')} {...register('p_UserName')} placeholder="Enter full name" />
//           </FormField>
//         </div>
//         <FormField label="Login ID" required error={errors.p_UserLoginID?.message}>
//           <input
//             type="text"
//             className={I('p_UserLoginID')}
//             {...register('p_UserLoginID')}
//             placeholder="Enter login ID"
//             readOnly={isEditMode} // ← readonly on edit
//           />
//         </FormField>
//       </div>

//       {/* Row 3 — Password */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//         <FormField
//           label={isEditMode ? 'New Password (leave blank to keep)' : 'Password'}
//           required={!isEditMode}
//           error={errors.p_Password?.message}
//         >
//           <div className="relative">
//             <input
//               type={showPassword ? 'text' : 'password'}
//               className={cn(I('p_Password'), 'pr-9')}
//               {...register('p_Password')}
//               placeholder="••••••••"
//             />
//             <button type="button" onClick={() => setShowPassword((v) => !v)}
//               className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
//               {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
//             </button>
//           </div>
//         </FormField>

//         <FormField label="Confirm Password" error={errors.p_ConfirmPassword?.message}>
//           <div className="relative">
//             <input
//               type={showConfirm ? 'text' : 'password'}
//               className={cn(I('p_ConfirmPassword'), 'pr-9')}
//               {...register('p_ConfirmPassword')}
//               placeholder="••••••••"
//             />
//             <button type="button" onClick={() => setShowConfirm((v) => !v)}
//               className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
//               {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
//             </button>
//           </div>
//         </FormField>
//       </div>

//       {/* Department table */}
//       <div>
//         <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
//           Department Assignment
//         </p>
//         <div className={cn(
//           'rounded-xl border border-slate-200 overflow-hidden transition-opacity duration-200',
//           deptLoading ? 'opacity-50' : 'opacity-100',
//         )}>
//           {deptLoading ? (
//             <div className="py-10 flex items-center justify-center gap-2 text-slate-400 text-sm">
//               <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
//               Loading departments…
//             </div>
//           ) : (
//             <table className="w-full text-sm">
//               <thead>
//                 <tr className="bg-slate-50 border-b border-slate-200">
//                   <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-16">SL No.</th>
//                   <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Department</th>
//                   <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-32">Map</th>
//                   <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-40 whitespace-nowrap">Login Applicable</th>
//                   <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-32">Active</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {departmentList.length === 0 ? (
//                   <tr>
//                     <td colSpan={5} className="py-10 text-center text-slate-400 text-sm">
//                       {Number(watchedCompany) === 0
//                         ? 'Select a company to load departments'
//                         : 'No departments available'}
//                     </td>
//                   </tr>
//                 ) : (
//                   fields.map((field, index) => (
//                     <UserDepartmentRow
//   key={field.id}
//   index={index}
//   control={control as unknown as Control<FieldValues>}  // ← cast
//   register={register as unknown as UseFormRegister<FieldValues>}
//   setValue={setValue as unknown as UseFormSetValue<FieldValues>}
//   department={departmentList[index]}
//   onToggleChange={handleToggleChange}
// />
//                   ))
//                 )}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </div>
//     </form>
//   );
// }

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { Eye, EyeOff, Plus, X as XIcon, Building2 } from 'lucide-react';
import { getCompaniesForDropdown } from '@/apis/master/companyApi';
import { getGroupsForDropdown } from '@/apis/master/groupApi';
import { getCompanyDepartmentMapping } from '@/apis/master/companyDepartmentApi';
import { getAllUsers } from '@/apis/master/userApi';
import FormField from '@/components/shared/FormField';
import UserDepartmentRow from './UserDepartmentRow';
import { cn } from '@/utils/cn';
import type { UserDepartment } from '@/types';
import { Button } from '@/components/ui/Button';

interface CompanyOption { CompanyID: number; Description: string; ParentCompanyID?: number; }
interface GroupOption { GroupID: number; GroupName: string; CompanyID: number; GroupCompanyID: number; }
interface DeptMappingItem {
  DepartmentID: number;
  Department?: string;
  ADMIN_DEPRT_SNAME?: string;
  IsMapped?: boolean;
  IsLoginApplicable?: boolean;
  IsUserActive?: boolean;
}

interface StagedCompany {
  CompanyID: number;
  CompanyName: string;
  CompanyGroupID: number;
  Departments: {
    DepartmentID: number;
    DepartmentName: string;
    IsLoginApplicable: boolean;
    IsUserActive: boolean;
  }[];
}

interface UserFormValues {
  p_UserID: number;
  p_GroupID: number;
  p_UserLoginID: string;
  p_Password: string;
  p_ConfirmPassword: string;
  p_UserName: string;
  p_inactive: boolean;
}

const schema = Yup.object({
  p_GroupID: Yup.number().min(1, 'User Group is required'),
  p_UserName: Yup.string().required('Full name is required'),
  p_UserLoginID: Yup.string().required('Login ID is required'),
  p_Password: Yup.string().when('p_UserID', {
    is: 0,
    then: (s) => s.required('Password is required').min(6, 'Min 6 characters'),
    otherwise: (s) => s.notRequired(),
  }),
  p_ConfirmPassword: Yup.string().when('p_Password', {
    is: (v: string) => v && v.length > 0,
    then: (s) => s.required('Please confirm password').oneOf([Yup.ref('p_Password')], 'Passwords do not match'),
    otherwise: (s) => s.notRequired(),
  }),
});

interface Props {
  editUser: UserDepartment | null;
  onSave: (data: unknown, onSuccess?: () => void) => void;
}

export default function UserForm({ editUser, onSave }: Props) {
  const [companyDD, setCompanyDD] = useState<CompanyOption[]>([]);
  const [groupDD, setGroupDD] = useState<GroupOption[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(0);
  const [departmentList, setDepartmentList] = useState<DeptMappingItem[]>([]);
  const [ddLoaded, setDdLoaded] = useState(false);
  const [groupLoading, setGroupLoading] = useState(false);
  const [deptLoading, setDeptLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [stagedCompanies, setStagedCompanies] = useState<StagedCompany[]>([]);
  const [originalDeptIds, setOriginalDeptIds] = useState<Set<string>>(new Set());

  const [changesMap, setChangesMap] = useState<Map<number, {
    DepartmentID: number;
    IsSelected: boolean;
    IsLoginApplicable: boolean;
    IsUserActive: boolean;
  }>>(new Map());

  const isEditMode = !!editUser;

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } =
    useForm<UserFormValues>({
      resolver: yupResolver(schema) as never,
      defaultValues: {
        p_UserID: 0,
        p_GroupID: 0,
        p_UserLoginID: '',
        p_Password: '',
        p_ConfirmPassword: '',
        p_UserName: '',
        p_inactive: false,
      },
    });

  // Load company + group dropdowns
 useEffect(() => {
  Promise.all([
    getCompaniesForDropdown().then((r) => {
      const data = r?.data ?? [];
      const filtered = data.filter((c: { IsLastLayer: boolean }) => c.IsLastLayer === true); // ← filter
      setCompanyDD(filtered);
    }),
    getGroupsForDropdown(0, 0).then((r) => setGroupDD(r?.data ?? [])),
  ])
    .catch(() => {})
    .finally(() => setDdLoaded(true));
}, []);

  // Populate form + staged companies when editing
// Populate form + staged companies when editing
useEffect(() => {
  if (editUser) {
    reset({
      p_UserID: editUser.UserID,
      p_GroupID: editUser.GroupID,
      p_UserLoginID: editUser.UserLoginID,
      p_Password: '',
      p_ConfirmPassword: '',
      p_UserName: editUser.UserName,
      p_inactive: editUser.InActive ?? false,
    });
    loadExistingDepartmentsForEdit(editUser.UserID);
  } else {
    reset({
      p_UserID: 0, p_GroupID: 0, p_UserLoginID: '', p_Password: '',
      p_ConfirmPassword: '', p_UserName: '', p_inactive: false,
    });
    setStagedCompanies([]);
    setSelectedCompanyId(0);     // ← reset on add-new too
    setDepartmentList([]);
  }
}, [editUser, groupDD, reset]); // ← add groupDD as dependency
  const loadExistingDepartmentsForEdit = async (userId: number) => {
  try {
    const res = await getAllUsers(1, 100, 0, 0);
    const allRows: UserDepartment[] = res?.data?.UserDepartment ?? [];
    const userRows = allRows.filter((r) => r.UserID === userId);

    // ← track original company-department combinations
    const origIds = new Set<string>();
    userRows.forEach((row) => {
      origIds.add(`${row.CompanyID}-${row.DepartmentID}`);
    });
    setOriginalDeptIds(origIds); // ← store original IDs

    const grouped = new Map<number, StagedCompany>();
    userRows.forEach((row) => {
      if (!grouped.has(row.CompanyID)) {
        grouped.set(row.CompanyID, {
          CompanyID: row.CompanyID,
          CompanyName: row.CompanyName,
          CompanyGroupID: row.CompanyGroupID,
          Departments: [],
        });
      }
      grouped.get(row.CompanyID)!.Departments.push({
        DepartmentID: row.DepartmentID,
        DepartmentName: row.DepartmentName,
        IsLoginApplicable: row.IsLoginApplicable,
        IsUserActive: row.IsUserActive,
      });
    });

    const stagedList = Array.from(grouped.values());
    setStagedCompanies(stagedList);

    if (stagedList.length > 0) {
      handleSelectCompanyWithStaged(stagedList[0].CompanyID, stagedList);
    }
  } catch {
    setStagedCompanies([]);
  }
};
// const loadExistingDepartmentsForEdit = async (userId: number) => {
//   try {
//     const res = await getAllUsers(1, 100, 0, 0);
//     const allRows: UserDepartment[] = res?.data?.UserDepartment ?? [];
//     const userRows = allRows.filter((r) => r.UserID === userId);

//     const grouped = new Map<number, StagedCompany>();
//     userRows.forEach((row) => {
//       if (!grouped.has(row.CompanyID)) {
//         grouped.set(row.CompanyID, {
//           CompanyID: row.CompanyID,
//           CompanyName: row.CompanyName,
//           CompanyGroupID: row.CompanyGroupID,
//           Departments: [],
//         });
//       }
//       grouped.get(row.CompanyID)!.Departments.push({
//         DepartmentID: row.DepartmentID,
//         DepartmentName: row.DepartmentName,
//         IsLoginApplicable: row.IsLoginApplicable,
//         IsUserActive: row.IsUserActive,
//       });
//     });

//     const stagedList = Array.from(grouped.values());
//     setStagedCompanies(stagedList);

//     // ← pass stagedList directly instead of relying on state
//     if (stagedList.length > 0) {
//       handleSelectCompanyWithStaged(stagedList[0].CompanyID, stagedList);
//     }
//   } catch {
//     setStagedCompanies([]);
//   }
// };

const handleSelectCompanyWithStaged = async (
  companyId: number,
  currentStaged: StagedCompany[], // ← takes staged as param, not from state
) => {
  setSelectedCompanyId(companyId);
  setChangesMap(new Map());

  if (!companyId) {
    setDepartmentList([]);
    return;
  }

  setDeptLoading(true);
  try {
const deptRes = await getCompanyDepartmentMapping(companyId, 1, 0, 0); // ← ShowActiveOnly=1
    const allDepts: DeptMappingItem[] = deptRes?.data?.Department ?? [];
    const mappedDepts = allDepts.filter((d) => d.IsMapped === true);

    // ← use currentStaged param instead of stagedCompanies state
    const existingStaged = currentStaged.find((s) => s.CompanyID === companyId);
    const stagedDeptMap = new Map(
      (existingStaged?.Departments ?? []).map((d) => [d.DepartmentID, d])
    );

    const merged = mappedDepts.map((d) => ({
      ...d,
      IsMapped: stagedDeptMap.has(d.DepartmentID),
      IsLoginApplicable: stagedDeptMap.get(d.DepartmentID)?.IsLoginApplicable ?? false,
      IsUserActive: stagedDeptMap.get(d.DepartmentID)?.IsUserActive ?? false,
    }));

    setDepartmentList(merged);
  } catch {
    setDepartmentList([]);
  } finally {
    setDeptLoading(false);
  }
  };
  const handleSelectCompany = async (companyId: number) => {
  setSelectedCompanyId(companyId);
  setChangesMap(new Map());

  if (!companyId) {
    setDepartmentList([]);
    return;
  }

  setDeptLoading(true);
  try {
    const deptRes = await getCompanyDepartmentMapping(companyId, 0, 0);
    const allDepts: DeptMappingItem[] = deptRes?.data?.Department ?? [];
    const mappedDepts = allDepts.filter((d) => d.IsMapped === true);

    const existingStaged = stagedCompanies.find((s) => s.CompanyID === companyId);
    const stagedDeptMap = new Map(
      (existingStaged?.Departments ?? []).map((d) => [d.DepartmentID, d])
    );

    const merged = mappedDepts.map((d) => ({
      ...d,
      IsMapped: stagedDeptMap.has(d.DepartmentID),
      IsLoginApplicable: stagedDeptMap.get(d.DepartmentID)?.IsLoginApplicable ?? false,
      IsUserActive: stagedDeptMap.get(d.DepartmentID)?.IsUserActive ?? false,
    }));

    setDepartmentList(merged);
  } catch {
    setDepartmentList([]);
  } finally {
    setDeptLoading(false);
  }
};
 


  const handleToggleChange = (
    dept: DeptMappingItem,
    field: 'IsSelected' | 'IsLoginApplicable' | 'IsUserActive',
    value: number,
  ) => {
    setChangesMap((prev) => {
      const updated = new Map(prev);
      const existing = updated.get(dept.DepartmentID) ?? {
        DepartmentID: dept.DepartmentID,
        IsSelected: dept.IsMapped ?? false,
        IsLoginApplicable: dept.IsLoginApplicable ?? false,
        IsUserActive: dept.IsUserActive ?? false,
      };

      const newEntry = { ...existing };
      if (field === 'IsSelected') newEntry.IsSelected = value === 1;
      if (field === 'IsLoginApplicable') newEntry.IsLoginApplicable = value === 1;
      if (field === 'IsUserActive') newEntry.IsUserActive = value === 1;

      if (field === 'IsSelected' && value === 0) {
        newEntry.IsLoginApplicable = false;
        newEntry.IsUserActive = false;
      }

      updated.set(dept.DepartmentID, newEntry);
      return updated;
    });
  };

  // "Add" button — stage current company + its selected departments
  const handleAddCompany = () => {
    if (!selectedCompanyId) return;

    const selectedDepts = departmentList
      .filter((d) => {
        const change = changesMap.get(d.DepartmentID);
        return change ? change.IsSelected : d.IsMapped;
      })
      .map((d) => {
        const change = changesMap.get(d.DepartmentID);
        return {
          DepartmentID: d.DepartmentID,
          DepartmentName: d.Department ?? d.ADMIN_DEPRT_SNAME ?? '',
          IsLoginApplicable: change ? change.IsLoginApplicable : (d.IsLoginApplicable ?? false),
          IsUserActive: change ? change.IsUserActive : (d.IsUserActive ?? false),
        };
      });

    if (selectedDepts.length === 0) return;

    const company = companyDD.find((c) => c.CompanyID === selectedCompanyId);

    setStagedCompanies((prev) => {
      const filtered = prev.filter((s) => s.CompanyID !== selectedCompanyId);
      return [
        ...filtered,
        {
          CompanyID: selectedCompanyId,
          CompanyName: company?.Description ?? '',
          CompanyGroupID: company?.ParentCompanyID ?? 0,
          Departments: selectedDepts,
        },
      ];
    });

    // Reset staging area
    setSelectedCompanyId(0);
    setDepartmentList([]);
    setChangesMap(new Map());
  };

  const handleRemoveStagedCompany = (companyId: number) => {
    setStagedCompanies((prev) => prev.filter((s) => s.CompanyID !== companyId));
  };
  const onSubmit = (data: UserFormValues) => {
  const allDepartments = stagedCompanies.flatMap((s) =>
    s.Departments.map((d) => {
      const wasOriginallyMapped = isEditMode
        ? originalDeptIds.has(`${s.CompanyID}-${d.DepartmentID}`)
        : false;

      return {
        CompanyID: s.CompanyID,
        DepartmentID: d.DepartmentID,
        IsLoginApplicable: d.IsLoginApplicable,
        IsUserActive: d.IsUserActive,
        InActive: false,
        RecordState: isEditMode
          ? (wasOriginallyMapped ? 2 : 1)
          : 1,
      };
    })
  );

  const payload: Record<string, unknown> = {
    UserID: data.p_UserID ?? 0,
    UserLoginID: data.p_UserLoginID,
    UserName: data.p_UserName,
    GroupID: Number(data.p_GroupID),
    CompanyGroupID: stagedCompanies[0]?.CompanyGroupID ?? 0,
    InActive: data.p_inactive ?? false,
    RecordState: isEditMode ? 2 : 1,
    Departments: allDepartments,
  };

  if (data.p_Password && data.p_Password.length > 0) {
    payload.Password = data.p_Password;
  }

  onSave(payload, () => {
    reset();
    setStagedCompanies([]);
    setSelectedCompanyId(0);
    setDepartmentList([]);
    setChangesMap(new Map());
    setOriginalDeptIds(new Set());
  });
};

//   const onSubmit = (data: UserFormValues) => {
//   const allDepartments = stagedCompanies.flatMap((s) =>
//     s.Departments.map((d) => ({
//       CompanyID: s.CompanyID, // ← per-department, correct already
//       DepartmentID: d.DepartmentID,
//       IsLoginApplicable: d.IsLoginApplicable,
//       IsUserActive: d.IsUserActive,
//       InActive: false,
//       RecordState: isEditMode ? 2 : 1,
//     }))
//   );

//   const payload: Record<string, unknown> = {
//     UserID: data.p_UserID ?? 0,
//     UserLoginID: data.p_UserLoginID,
//     UserName: data.p_UserName,
//     GroupID: Number(data.p_GroupID),
//     CompanyGroupID: stagedCompanies[0]?.CompanyGroupID ?? 0, // ← first staged company's group
//     InActive: data.p_inactive ?? false,
//     RecordState: isEditMode ? 2 : 1,
//     Departments: allDepartments,
//   };

//   if (data.p_Password && data.p_Password.length > 0) {
//     payload.Password = data.p_Password;
//   }

//   onSave(payload, () => {
//     reset();
//     setStagedCompanies([]);
//     setSelectedCompanyId(0);
//     setDepartmentList([]);
//     setChangesMap(new Map());
//   });
// };

  const I = (name: keyof UserFormValues) =>
    cn('form-input', errors[name] && 'border-red-400 focus:ring-red-400/40');

  // Companies not yet staged are still selectable; staged ones can be re-selected to edit
  const availableCompanies = companyDD;

  return (
    <form id="user-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Row 1 — User Group + Status */}
      <div className="flex items-end justify-between gap-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
          <div className="md:col-span-4">
            <FormField label="User Group" loading={groupLoading} error={errors.p_GroupID?.message}>
              <select
                className={cn('form-select', errors.p_GroupID && 'border-red-400')}
                disabled={!ddLoaded}
                {...register('p_GroupID', { valueAsNumber: true })}
              >
                <option value={0}>-- Select --</option>
                {groupDD.map((opt) => (
                  <option key={opt.GroupID} value={opt.GroupID}>{opt.GroupName}</option>
                ))}
              </select>
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
          <span className={cn('text-xs font-medium', watch('p_inactive') ? 'text-red-500' : 'text-emerald-600')}>
            {watch('p_inactive') ? 'Inactive' : 'Active'}
          </span>
        </div>
      </div>

      {/* Row 2 — User details */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="md:col-span-2">
          <FormField label="Full Name" required error={errors.p_UserName?.message}>
            <input type="text" className={I('p_UserName')} {...register('p_UserName')} placeholder="Enter full name" />
          </FormField>
        </div>
        <FormField label="Login ID" required error={errors.p_UserLoginID?.message}>
          <input
            type="text"
            className={I('p_UserLoginID')}
            {...register('p_UserLoginID')}
            placeholder="Enter login ID"
            readOnly={isEditMode}
          />
        </FormField>
      </div>

      {/* Row 3 — Password */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <FormField
          label={isEditMode ? 'New Password (leave blank to keep)' : 'Password'}
          required={!isEditMode}
          error={errors.p_Password?.message}
        >
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className={cn(I('p_Password'), 'pr-9')}
              {...register('p_Password')}
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </FormField>

        <FormField label="Confirm Password" error={errors.p_ConfirmPassword?.message}>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              className={cn(I('p_ConfirmPassword'), 'pr-9')}
              {...register('p_ConfirmPassword')}
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </FormField>
      </div>

      <hr className="border-slate-100 mb-6" />

      {/* Company / Branch + Department Assignment staging area */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Company / Branch — Department Assignment
        </p>

        <div className="flex items-end gap-4 mb-4">
          <div className="w-72">
            <FormField label="Company / Branch" loading={!ddLoaded}>
              <select
                className="form-select"
                disabled={!ddLoaded}
                value={selectedCompanyId}
                onChange={(e) => handleSelectCompany(Number(e.target.value))}
              >
                <option value={0}>-- Select --</option>
                {availableCompanies.map((opt) => (
                  <option key={opt.CompanyID} value={opt.CompanyID}>
                    {opt.Description}
                    {stagedCompanies.some((s) => s.CompanyID === opt.CompanyID) ? ' (added)' : ''}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          {/* {selectedCompanyId !== 0 && (
            <Button
              type="button"
              onClick={handleAddCompany}
              className="mb-1"
            >
              <Plus size={13} /> Add
            </Button>
          )} */}
        </div>

        {/* Department table for currently selected company */}
        {selectedCompanyId !== 0 && (
          <div className={cn(
            'rounded-xl border border-slate-200 overflow-hidden transition-opacity duration-200 mb-4',
            deptLoading ? 'opacity-50' : 'opacity-100',
          )}>
            {deptLoading ? (
              <div className="py-10 flex items-center justify-center gap-2 text-slate-400 text-sm">
                <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                Loading departments…
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-16">SL No.</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Department</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-32">Map</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-40">Login Applicable</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-32">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400 text-sm">
                        No departments available
                      </td>
                    </tr>
                  ) : (
                    departmentList.map((dept, index) => (
                      <DeptRowSimple
                        key={dept.DepartmentID}
                        index={index}
                        department={dept}
                        changesMap={changesMap}
                        onToggleChange={handleToggleChange}
                      />
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
        {/* ← Add button now here, below the table */}
{selectedCompanyId !== 0 && (
  <div className="flex justify-end mb-4">
    <Button type="button" onClick={handleAddCompany}>
      <Plus size={13} /> Add
    </Button>
  </div>
)}

        {/* Staged companies list */}
        {stagedCompanies.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Companies Added ({stagedCompanies.length})
            </p>
            {stagedCompanies.map((s) => (
              <div key={s.CompanyID} className="flex items-start justify-between rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
                <div className="flex items-start gap-3">
                  <Building2 size={15} className="text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{s.CompanyName}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {s.Departments.map((d) => (
                        <span key={d.DepartmentID} className="badge badge-blue text-[10px]">
                          {d.DepartmentName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveStagedCompany(s.CompanyID)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <XIcon size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </form>
  );
}

// Simple department row for staging area (no react-hook-form dependency)
function DeptRowSimple({
  index, department, changesMap, onToggleChange,
}: {
  index: number;
  department: DeptMappingItem;
  changesMap: Map<number, { IsSelected: boolean; IsLoginApplicable: boolean; IsUserActive: boolean }>;
  onToggleChange: (dept: DeptMappingItem, field: 'IsSelected' | 'IsLoginApplicable' | 'IsUserActive', value: number) => void;
}) {
  const change = changesMap.get(department.DepartmentID);
  const isSelected = change ? change.IsSelected : (department.IsMapped ?? false);
  const isLoginApplicable = change ? change.IsLoginApplicable : (department.IsLoginApplicable ?? false);
  const isActive = change ? change.IsUserActive : (department.IsUserActive ?? false);

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="px-4 py-3 text-center text-slate-400">{index + 1}</td>
      <td className="px-4 py-3 text-sm text-slate-700">
        {department.Department ?? department.ADMIN_DEPRT_SNAME}
      </td>
      <td className="px-4 py-3 text-center">
        <ToggleSimple
          value={isSelected}
          onChange={(v) => onToggleChange(department, 'IsSelected', v ? 1 : 0)}
        />
      </td>
      <td className="px-4 py-3 text-center">
        <ToggleSimple
          value={isLoginApplicable}
          disabled={!isSelected}
          onChange={(v) => onToggleChange(department, 'IsLoginApplicable', v ? 1 : 0)}
        />
      </td>
      <td className="px-4 py-3 text-center">
        <ToggleSimple
          value={isActive}
          disabled={!isSelected}
          onChange={(v) => onToggleChange(department, 'IsUserActive', v ? 1 : 0)}
        />
      </td>
    </tr>
  );
}

function ToggleSimple({ value, onChange, disabled = false }: {
  value: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(!value)}
      className={cn(
        'relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200 select-none',
        value ? 'bg-emerald-500' : 'bg-slate-300',
        disabled && 'opacity-30 cursor-not-allowed',
      )}
    >
      <span className={cn('absolute text-[9px] font-bold text-white', value ? 'left-1.5' : 'right-1.5')}>
        {value ? 'YES' : 'NO'}
      </span>
      <span className={cn(
        'absolute h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
        value ? 'translate-x-7' : 'translate-x-1',
      )} />
    </button>
  );
}