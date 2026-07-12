import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { getAccountTypes, getAccountTemplates  } from '@/apis/finance/financeApi';
import FormField from '@/components/shared/FormField';
import { cn } from '@/utils/cn';
import type { AccountType, AccountTemplate, GroupAccountFormValues } from '@/types';

const schema = Yup.object({
  AccountType: Yup.string().required('Account Type is required'),
  Code: Yup.string().required('Group Code is required'),
  Description: Yup.string().required('Group Description is required'),
//   BankAccountNo: Yup.string().when('AccountType', {
//     is: 'BANK',
//     then: (s) => s.required('Bank is required'),
//     otherwise: (s) => s.notRequired(),
//   }),
});

interface Props {
  formdata: AccountTemplate | null;
  onSave: (data: unknown) => void;
}

export default function GroupAccountForm({ formdata, onSave }: Props) {
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [parentGroups, setParentGroups] = useState<AccountTemplate[]>([]);
  const [ddLoaded, setDdLoaded] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset,watch  } =
    useForm<GroupAccountFormValues>({
      resolver: yupResolver(schema) as never,
      defaultValues: {
        AccountID: 0,
        AccountParentID: 0,
        Code: '',
        Description: '',
        AccountType: '',
        IsSubLedger: false,
          IsCostCentre: false,
        //   BankAccountNo: '', // ← add

      },
    });

  // Load dropdowns
 useEffect(() => {
  Promise.all([
    getAccountTypes().then((r) => setAccountTypes(r?.data ?? [])),
    getAccountTemplates(0, 0, 'Y').then((r) =>
      setParentGroups(r?.data?.AccountList ?? [])
    ),
  ])
    .catch(() => {})
    .finally(() => setDdLoaded(true));
}, []);

  // Populate form on edit
  useEffect(() => {
    if (formdata?.AccountID) {
      reset({
        AccountID: formdata.AccountID,
        AccountParentID: formdata.AccountParentID,
        Code: formdata.Code,
        Description: formdata.Description,
        AccountType: formdata.AccountType,
        IsSubLedger: false,
        IsCostCentre: formdata.IsCostCenterApp ?? false,
      });
    } else {
      reset({
        AccountID: 0,
        AccountParentID: 0,
        Code: '',
        Description: '',
        AccountType: '',
        IsSubLedger: false,
        IsCostCentre: false,
      });
    }
  }, [formdata, reset]);

  const onSubmit = (data: GroupAccountFormValues) => {
    const payload = {
      RecordState: data.AccountID ? 2 : 1,
      AccountID: data.AccountID ?? 0,
      AccountParentID: data.AccountParentID ?? 0,
      Code: data.Code,
      Description: data.Description,
      AccountType: data.AccountType,
      GroupFlag: 'Y',
      RootID: 0,
      LevelNo: 1,
      IsLastNode: 'N',
      BSPLItem: 'BS',
      ScheduleNo: 0,
GLSLFlag: data.IsSubLedger ? 'Y' : 'N', // ← Y/N for Sub Ledger      CashFlowCaptionRec: '',
      CashFlowCaptionPay: '',
      IsCostCenterApp: data.IsCostCentre,
      BankAccountNo: '', 
        LastUpdated: null,
       BankAccount: {
      BankID: 0,
      BranchID: 0,
      BankAccountNo: '',
      BankAccountName: '',
      BankAccountType: '',
    },
    };
    onSave(payload);
  };

  const I = (name: keyof GroupAccountFormValues) =>
    cn('form-input', errors[name] && 'border-red-400 focus:ring-red-400/40');

  return (
    <form id="group-account-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Row 1 — Account Type + Parent Group */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <FormField label="Account Type" required error={errors.AccountType?.message}>
          <select
            className={cn('form-select', errors.AccountType && 'border-red-400')}
            disabled={!ddLoaded}
            {...register('AccountType')}
          >
            <option value="">-- Select --</option>
            {accountTypes.map((t) => (
              <option key={t.RecordNo} value={t.AccountType}>{t.AccountType}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Parent Group">
          <select
            className="form-select"
            disabled={!ddLoaded}
            {...register('AccountParentID', { valueAsNumber: true })}
          >
            <option value={0}>-- Select --</option>
            {parentGroups.map((g) => (
              <option key={g.AccountID} value={g.AccountID}>{g.Description}</option>
            ))}
          </select>
        </FormField>
      </div> */}
          {/* Row 1 — Account Type + Parent Group */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
  <FormField label="Account Type" required error={errors.AccountType?.message}>
    <select
      className={cn('form-select', errors.AccountType && 'border-red-400')}
      disabled={!ddLoaded}
      {...register('AccountType')}
    >
      <option value="">-- Select --</option>
      {accountTypes.map((t) => (
        <option key={t.RecordNo} value={t.AccountType}>{t.AccountType}</option>
      ))}
    </select>
  </FormField>

  <FormField label="Parent Group">
    <select
      className="form-select"
      disabled={!ddLoaded}
      {...register('AccountParentID', { valueAsNumber: true })}
    >
      <option value={0}>-- Select --</option>
      {parentGroups.map((g) => (
        <option key={g.AccountID} value={g.AccountID}>{g.Description}</option>
      ))}
    </select>
  </FormField>
</div>



      {/* Row 2 — Group Code + Group Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <FormField label="Group Code" required error={errors.Code?.message}>
          <input
            type="text"
            className={I('Code')}
            {...register('Code')}
            placeholder="Enter group code"
          />
        </FormField>
        <FormField label="Group Description" required error={errors.Description?.message}>
          <input
            type="text"
            className={I('Description')}
            {...register('Description')}
            placeholder="Enter group description"
          />
        </FormField>
      </div>

      {/* Row 3 — Checkboxes */}
      <div className="flex items-center gap-6 mt-2">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            {...register('IsSubLedger')}
          />
          <span className="text-sm text-slate-700 font-medium">Sub Ledger</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            {...register('IsCostCentre')}
          />
          <span className="text-sm text-slate-700 font-medium">Cost Centre</span>
        </label>
      </div>
    </form>
  );
}