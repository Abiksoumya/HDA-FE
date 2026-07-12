import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import {
  getAccountTypes,
  getAccountTemplates,
  getBanks,
  getBankBranches,
} from '@/apis/finance/financeApi';
import FormField from '@/components/shared/FormField';
import { cn } from '@/utils/cn';
import type { AccountType, AccountTemplate } from '@/types';

interface GeneralLedgerFormValues {
  AccountID: number;
  AccountParentID: number;
  Code: string;
  Description: string;
  AccountType: string;
  IsSubLedger: boolean;
  IsCostCentre: boolean;
  // Bank fields
  BankID: number;
  BranchID: number;
  BankAccountNo: string;
  BankAccountName: string;
  BankAccountType: string;
}

const schema = Yup.object({
  AccountType: Yup.string().required('Account Type is required'),
  Code: Yup.string().required('Code is required'),
  Description: Yup.string().required('Description is required'),
  BankID: Yup.number().when('AccountType', {
    is: 'BANK',
    then: (s) => s.min(1, 'Bank is required'),
    otherwise: (s) => s.notRequired(),
  }),
  BranchID: Yup.number().when('AccountType', {
    is: 'BANK',
    then: (s) => s.min(1, 'Branch is required'),
    otherwise: (s) => s.notRequired(),
  }),
  BankAccountNo: Yup.string().when('AccountType', {
    is: 'BANK',
    then: (s) => s.required('Account No is required'),
    otherwise: (s) => s.notRequired(),
  }),
  BankAccountName: Yup.string().when('AccountType', {
    is: 'BANK',
    then: (s) => s.required('Account Name is required'),
    otherwise: (s) => s.notRequired(),
  }),
  BankAccountType: Yup.string().when('AccountType', {
    is: 'BANK',
    then: (s) => s.required('Account Type is required'),
    otherwise: (s) => s.notRequired(),
  }),
});

interface BankOption { BankID: number; BankName: string; BankCode: string; }
interface BranchOption { BranchID: number; BranchName: string; BranchCode: string; }

interface Props {
  formdata: AccountTemplate | null;
  onSave: (data: unknown) => void;
}

export default function GeneralLedgerForm({ formdata, onSave }: Props) {
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [parentGroups, setParentGroups] = useState<AccountTemplate[]>([]);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [ddLoaded, setDdLoaded] = useState(false);
  const [branchLoading, setBranchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'account' | 'bank'>('account');

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } =
    useForm<GeneralLedgerFormValues>({
      resolver: yupResolver(schema) as never,
      defaultValues: {
        AccountID: 0,
        AccountParentID: 0,
        Code: '',
        Description: '',
        AccountType: '',
        IsSubLedger: false,
        IsCostCentre: false,
        BankID: 0,
        BranchID: 0,
        BankAccountNo: '',
        BankAccountName: '',
        BankAccountType: 'SB',
      },
    });

  const watchedAccountType = watch('AccountType');
  const watchedBankID = watch('BankID');
  const isBank = watchedAccountType === 'BANK';

  // Reset tab when account type changes
  useEffect(() => {
    if (!isBank) {
      setActiveTab('account');
      setValue('BankID', 0);
      setValue('BranchID', 0);
      setValue('BankAccountNo', '');
      setValue('BankAccountName', '');
      setValue('BankAccountType', 'SB');
      setBranches([]);
    }
  }, [watchedAccountType]);

  // Load branches when bank changes
  useEffect(() => {
    if (!watchedBankID || Number(watchedBankID) === 0) {
      setBranches([]);
      setValue('BranchID', 0);
      return;
    }
    setBranchLoading(true);
    getBankBranches(Number(watchedBankID))
  .then((r) => setBranches(r?.data?.BankBranchList ?? [])) // ← BankBranchList not BranchList
  .catch(() => setBranches([]))
  .finally(() => setBranchLoading(false));
  }, [watchedBankID]);

  // Load dropdowns
  useEffect(() => {
    Promise.all([
      getAccountTypes().then((r) => setAccountTypes(r?.data ?? [])),
      getAccountTemplates(0, 0, 'Y').then((r) =>
        setParentGroups(r?.data?.AccountList ?? [])
      ),
      getBanks().then((r) => setBanks(r?.data?.BankList ?? [])),
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
        BankID: 0,
        BranchID: 0,
        BankAccountNo: '',
        BankAccountName: '',
        BankAccountType: 'SB',
      });
    } else {
      reset({
        AccountID: 0, AccountParentID: 0, Code: '', Description: '',
        AccountType: '', IsSubLedger: false, IsCostCentre: false,
        BankID: 0, BranchID: 0, BankAccountNo: '',
        BankAccountName: '', BankAccountType: 'SB',
      });
    }
  }, [formdata, reset]);

  const onSubmit = (data: GeneralLedgerFormValues) => {
    const payload = {
      RecordState: data.AccountID ? 2 : 1,
      AccountID: data.AccountID ?? 0,
      AccountParentID: data.AccountParentID ?? 0,
      Code: data.Code,
      Description: data.Description,
      AccountType: data.AccountType,
      GroupFlag: 'N', // ← always N for general ledger
      RootID: 0,
      LevelNo: 1,
      IsLastNode: 'Y', // ← general ledger is last node
      BSPLItem: 'BS',
      ScheduleNo: 0,
      GLSLFlag: 'N',
      CashFlowCaptionRec: '',
      CashFlowCaptionPay: '',
      IsCostCenterApp: data.IsCostCentre,
      BankAccountNo: '',
      LastUpdated: null,
      BankAccount: isBank ? {
        BankID: Number(data.BankID),
        BranchID: Number(data.BranchID),
        BankAccountNo: data.BankAccountNo,
        BankAccountName: data.BankAccountName,
        BankAccountType: data.BankAccountType,
      } : {
        BankID: 0,
        BranchID: 0,
        BankAccountNo: '',
        BankAccountName: '',
        BankAccountType: '',
      },
    };
    onSave(payload);
  };

  const I = (name: keyof GeneralLedgerFormValues) =>
    cn('form-input', errors[name] && 'border-red-400 focus:ring-red-400/40');

  return (
    <form id="general-ledger-form" onSubmit={handleSubmit(onSubmit)} noValidate>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={cn(
            'px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150',
            activeTab === 'account'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700',
          )}
        >
          Account Details
        </button>
        {isBank && (
          <button
            type="button"
            onClick={() => setActiveTab('bank')}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150 flex items-center gap-1.5',
              activeTab === 'bank'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
              // Show red dot if bank fields have errors
              Object.keys(errors).some((k) => ['BankID', 'BranchID', 'BankAccountNo', 'BankAccountName', 'BankAccountType'].includes(k))
                ? 'after:content-[""] after:w-1.5 after:h-1.5 after:bg-red-500 after:rounded-full after:inline-block after:ml-1'
                : '',
            )}
          >
            Bank Details
            {Object.keys(errors).some((k) =>
              ['BankID', 'BranchID', 'BankAccountNo', 'BankAccountName', 'BankAccountType'].includes(k)
            ) && (
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            )}
          </button>
        )}
      </div>

      {/* Tab 1 — Account Details */}
      {activeTab === 'account' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Code" required error={errors.Code?.message}>
              <input type="text" className={I('Code')} {...register('Code')} placeholder="Enter code" />
            </FormField>
            <FormField label="Description" required error={errors.Description?.message}>
              <input type="text" className={I('Description')} {...register('Description')} placeholder="Enter description" />
            </FormField>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600" {...register('IsSubLedger')} />
              <span className="text-sm text-slate-700 font-medium">Sub Ledger</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600" {...register('IsCostCentre')} />
              <span className="text-sm text-slate-700 font-medium">Cost Centre</span>
            </label>
          </div>
        </div>
      )}

      {/* Tab 2 — Bank Details */}
      {activeTab === 'bank' && isBank && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bank dropdown */}
            <FormField label="Bank" required error={errors.BankID?.message}>
              <select
                className={cn('form-select', errors.BankID && 'border-red-400')}
                disabled={!ddLoaded}
                {...register('BankID', { valueAsNumber: true })}
              >
                <option value={0}>-- Select Bank --</option>
                {banks.map((b) => (
                  <option key={b.BankID} value={b.BankID}>
                    {b.BankName} 
                  </option>
                ))}
              </select>
            </FormField>

            {/* Branch dropdown */}
            <FormField label="Branch" required error={errors.BranchID?.message} loading={branchLoading}>
              <select
                className={cn('form-select', errors.BranchID && 'border-red-400')}
                disabled={!ddLoaded || branchLoading || Number(watchedBankID) === 0}
                {...register('BranchID', { valueAsNumber: true })}
              >
                <option value={0}>-- Select Branch --</option>
                {branches.map((b) => (
                  <option key={b.BranchID} value={b.BranchID}>
                    {b.BranchName} ({b.BranchCode})
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Account No" required error={errors.BankAccountNo?.message}>
              <input
                type="text"
                className={I('BankAccountNo')}
                {...register('BankAccountNo')}
                placeholder="e.g. 012784598621"
              />
            </FormField>
            <FormField label="Account Name" required error={errors.BankAccountName?.message}>
              <input
                type="text"
                className={I('BankAccountName')}
                {...register('BankAccountName')}
                placeholder="e.g. HDL SALARY ACCOUNT"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Account Type" required error={errors.BankAccountType?.message}>
              <select
                className={cn('form-select', errors.BankAccountType && 'border-red-400')}
                {...register('BankAccountType')}
              >
                <option value="SB">Savings (SB)</option>
                <option value="CURRENT">Current</option>
                <option value="OVERDRAFT">Overdraft</option>
                <option value="CASH_CREDIT">Cash Credit</option>
              </select>
            </FormField>
          </div>
        </div>
      )}
    </form>
  );
}