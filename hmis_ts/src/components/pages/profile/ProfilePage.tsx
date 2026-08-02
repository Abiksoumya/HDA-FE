import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { Eye, EyeOff, Save, Loader2, RefreshCw } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { useToast } from '@/hooks/useToast';
import { setUser } from '@/store/slices/authSlice';
import { refreshMenus } from '@/store/slices/uiSlice'; // ← replace setMenuData
import PageCard from '@/components/shared/PageCard';
import FormField from '@/components/shared/FormField';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { axiosClient } from '@/utils/apiClient';
import {
  getFinancialYears,
  getProfileSwitchDepartments,
  changePassword,
} from '@/apis/common/profileApi';
// import { transformMenuData } from '@/utils/menuTransformer';
import { updateProfileSwitch } from '@/apis/common/profileApi';


interface FinancialYear { FinancialYearID: number; YearShortName: string; }
interface Department { ID: number; Code: string; Description: string; IsDefault: boolean; }
interface Company { ID: number; Code: string; Description: string; Department: Department[]; }
interface CurrentProfile {
  CompanyID: number;
  CompanyGroupID: number;
  DepartmentID: number;
  FinancialYearID: number;
  FinancialYear: string;
}

interface PasswordFormValues {
  OldPassword: string;
  NewPassword: string;
  ConfirmPassword: string;
}

const passwordSchema = Yup.object({
  OldPassword: Yup.string().required('Old password is required'),
  NewPassword: Yup.string().required('New password is required').min(6, 'Min 6 characters'),
  ConfirmPassword: Yup.string()
    .required('Please confirm password')
    .oneOf([Yup.ref('NewPassword')], 'Passwords do not match'),
});

type TabKey = 'switch' | 'password';

export default function ProfilePage() {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const dept = (user as any)?.UserDepartment?.[0];
  const userId = dept?.UserID ?? 0;
  const userName = dept?.UserName ?? 'User';

  const [activeTab, setActiveTab] = useState<TabKey>('switch');

  // Profile Switch state
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentProfile, setCurrentProfile] = useState<CurrentProfile | null>(null);
  const [selectedYearId, setSelectedYearId] = useState(0);
  const [selectedCompanyId, setSelectedCompanyId] = useState(0);
  const [selectedDeptId, setSelectedDeptId] = useState(0);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  // Password state
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } =
    useForm<PasswordFormValues>({
      resolver: yupResolver(passwordSchema) as never,
      defaultValues: { OldPassword: '', NewPassword: '', ConfirmPassword: '' },
    });

  // Load data on mount
  useEffect(() => {
    Promise.all([
      getFinancialYears().then((r) => setFinancialYears(r?.data?.FinancialYear ?? [])),
      getProfileSwitchDepartments(userId).then((r) => {
        const data = r?.data;
        const profile: CurrentProfile = data?.CurrentProfile;
        const companyList: Company[] = data?.Company ?? [];

        setCurrentProfile(profile);
        setCompanies(companyList);
        setSelectedYearId(profile?.FinancialYearID ?? 0);
        setSelectedCompanyId(profile?.CompanyID ?? 0);
        setSelectedDeptId(profile?.DepartmentID ?? 0);

        const currentCompany = companyList.find((c) => c.ID === profile?.CompanyID);
        setDepartments(currentCompany?.Department ?? []);
      }),
    ])
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, [userId]);

  const handleCompanyChange = (companyId: number) => {
    setSelectedCompanyId(companyId);
    setSelectedDeptId(0);
    const company = companies.find((c) => c.ID === companyId);
    setDepartments(company?.Department ?? []);
  };

const handleSwitch = async () => {
  if (!selectedYearId || !selectedCompanyId || !selectedDeptId) {
    toast('Please select Financial Year, Branch and Department.', 'error');
    return;
  }

  setSwitching(true);
  try {
    // Step 1 — Save Profile Switch SP
    await updateProfileSwitch({
      UserID: userId,
      CompanyID: currentProfile?.CompanyID ?? dept?.CompanyID ?? 0,
      CompanyGroupID: currentProfile?.CompanyGroupID ?? dept?.CompanyGroupID ?? 0,
      FinancialYearID: currentProfile?.FinancialYearID ?? 0,
      DepartmentID: currentProfile?.DepartmentID ?? dept?.DepartmentID ?? 0,
      SwitchToFinancialYearID: selectedYearId,
      SwitchToBranchID: selectedCompanyId,
      SwitchToDepartmentID: selectedDeptId,
    });

    // Step 2 — Manually update Redux user with new branch/dept/year
    const selectedCompany = companies.find((c) => c.ID === selectedCompanyId);
    const selectedDept = departments.find((d) => d.ID === selectedDeptId);
    const selectedYear = financialYears.find((y) => y.FinancialYearID === selectedYearId);

    const updatedUser = {
      ...(user as any),
      UserDepartment: [
        {
          ...(dept ?? {}),
          CompanyID: selectedCompanyId,
          CompanyName: selectedCompany?.Description ?? dept?.CompanyName,
          DepartmentID: selectedDeptId,
          DepartmentName: selectedDept?.Description ?? dept?.DepartmentName,
          FinancialYearID: selectedYearId,
          YearShortName: selectedYear?.YearShortName ?? dept?.YearShortName,
        },
      ],
    };
    dispatch(setUser(updatedUser)); // ← updates topbar immediately

    // Step 3 — Trigger Sidebar to re-fetch menus
    dispatch(refreshMenus());

    // Step 4 — Update current profile display
    setCurrentProfile((prev) => prev ? {
      ...prev,
      CompanyID: selectedCompanyId,
      DepartmentID: selectedDeptId,
      FinancialYearID: selectedYearId,
      FinancialYear: selectedYear?.YearShortName ?? '',
    } : null);

    toast('Profile switched successfully!', 'success');

  } catch (err: unknown) {
    toast(err instanceof Error ? err.message : 'Failed to switch profile.', 'error');
  } finally {
    setSwitching(false);
  }
};

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setSaving(true);
    try {
      await changePassword({
        UserID: userId,
        OldPassword: data.OldPassword,
        NewPassword: data.NewPassword,
        ConfirmPassword: data.ConfirmPassword,
      });
      toast('Password changed successfully!', 'success');
      reset();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to change password.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const I = (name: keyof PasswordFormValues) =>
    cn('form-input pr-9', errors[name] && 'border-red-400 focus:ring-red-400/40');

  return (
    <PageCard title="User Profile">
      {/* User info header */}
      <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-semibold">
          {userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{userName}</p>
          <p className="text-xs text-slate-400">
            {dept?.CompanyName} · {dept?.DepartmentName} · {dept?.YearShortName}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('switch')}
          className={cn(
            'px-5 py-1.5 text-sm font-medium rounded-md transition-all duration-150',
            activeTab === 'switch' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          Profile Switch
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={cn(
            'px-5 py-1.5 text-sm font-medium rounded-md transition-all duration-150',
            activeTab === 'password' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          Change Password
        </button>
      </div>

      {/* Tab 1 — Profile Switch */}
      {activeTab === 'switch' && (
        profileLoading ? (
          <div className="py-16 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Loader2 size={16} className="animate-spin" /> Loading profile…
          </div>
        ) : (
          <div className="max-w-sm space-y-4">
            <FormField label="Financial Year">
              <select
                className="form-select"
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(Number(e.target.value))}
              >
                <option value={0}>-- Select --</option>
                {financialYears.map((y) => (
                  <option key={y.FinancialYearID} value={y.FinancialYearID}>
                    {y.YearShortName}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Branch">
              <select
                className="form-select"
                value={selectedCompanyId}
                onChange={(e) => handleCompanyChange(Number(e.target.value))}
              >
                <option value={0}>-- Select --</option>
                {companies.map((c) => (
                  <option key={c.ID} value={c.ID}>{c.Description}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Department">
              <select
                className="form-select"
                value={selectedDeptId}
                disabled={!selectedCompanyId}
                onChange={(e) => setSelectedDeptId(Number(e.target.value))}
              >
                <option value={0}>-- Select --</option>
                {departments.map((d) => (
                  <option key={d.ID} value={d.ID}>{d.Description}</option>
                ))}
              </select>
            </FormField>

            {/* Current profile info */}
            {/* {currentProfile && (
              <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  Current Active Profile
                </p>
                <p className="text-xs text-slate-600">
                  {companies.find((c) => c.ID === currentProfile.CompanyID)?.Description ?? dept?.CompanyName}
                  {' · '}
                  {departments.find((d) => d.ID === currentProfile.DepartmentID)?.Description ?? dept?.DepartmentName}
                  {' · '}
                  {currentProfile.FinancialYear}
                </p>
              </div>
            )} */}

            <div className="flex justify-end pt-2">
              <Button onClick={handleSwitch} disabled={switching}>
                <RefreshCw size={13} className={switching ? 'animate-spin' : ''} />
                {switching ? 'Switching…' : 'Switch'}
              </Button>
            </div>
          </div>
        )
      )}

      {/* Tab 2 — Change Password */}
      {activeTab === 'password' && (
        <form onSubmit={handleSubmit(onPasswordSubmit)} noValidate className="max-w-sm space-y-4">
          <FormField label="Old Password" required error={errors.OldPassword?.message}>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                className={I('OldPassword')}
                {...register('OldPassword')}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowOld((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showOld ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </FormField>

          <FormField label="New Password" required error={errors.NewPassword?.message}>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                className={I('NewPassword')}
                {...register('NewPassword')}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowNew((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </FormField>

          <FormField label="Confirm Password" required error={errors.ConfirmPassword?.message}>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                className={I('ConfirmPassword')}
                {...register('ConfirmPassword')}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </FormField>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving}>
              <Save size={13} /> {saving ? 'Saving…' : 'Submit'}
            </Button>
          </div>
        </form>
      )}
    </PageCard>
  );
}