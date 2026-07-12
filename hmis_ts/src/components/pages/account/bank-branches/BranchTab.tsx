import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { Search, X, ChevronLeft, ChevronRight, Loader2, Save } from 'lucide-react';
import { getBanks, getBankBranches, createBankBranch } from '@/apis/finance/financeApi';
import { useToast } from '@/hooks/useToast';
import FormField from '@/components/shared/FormField';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface BranchFormValues {
  BranchID: number;
  BankID: number;
  BranchCode: string;
  BranchName: string;
  IFSCCode: string;
  MICRCode: string;
  Address: string;
  PhoneNo: string;
  EmailID: string;
  InActive: boolean;
}

interface Bank { BankID: number; BankName: string; BankCode: string; }
interface Branch {
  BranchID: number; BankID: number; BranchCode: string; BranchName: string;
  BankName?: string; IFSCCode?: string; MICRCode?: string;
  Address?: string; PhoneNo?: string; EmailID?: string; InActive: boolean;
}

const schema = Yup.object({
  BankID: Yup.number().min(1, 'Bank is required'),
  BranchCode: Yup.string().required('Branch Code is required'),
  BranchName: Yup.string().required('Branch Name is required'),
});

const PAGE_SIZE = 5;

export default function BranchTab() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [records, setRecords] = useState<Branch[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [filterBankId, setFilterBankId] = useState(0);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } =
    useForm<BranchFormValues>({
      resolver: yupResolver(schema) as never,
      defaultValues: {
        BranchID: 0, BankID: 0, BranchCode: '', BranchName: '',
        IFSCCode: '', MICRCode: '', Address: '', PhoneNo: '', EmailID: '', InActive: false,
      },
    });

  // Load banks
  useEffect(() => {
    getBanks(1).then((r) => setBanks(r?.data?.BankList ?? [])).catch(() => {});
  }, []);

  // Load branches
  const fetchPage = (p: number, bankId = filterBankId) => {
    setLoading(true);
    getBankBranches(bankId, 0)
      .then((res) => {
        const data = res?.data;
        setRecords(data?.BankBranchList ?? []);
        setTotal(data?.TotalRecords ?? 0);
        setTotalPages(data?.TotalPages ?? 1);
        setPage(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPage(1); }, [formKey, filterBankId]);

  const onSubmit = async (data: BranchFormValues) => {
    setSaving(true);
    try {
      await createBankBranch({
        RecordState: data.BranchID ? 2 : 1,
        BranchID: data.BranchID ?? 0,
        BankID: Number(data.BankID),
        BranchCode: data.BranchCode,
        BranchName: data.BranchName,
        IFSCCode: data.IFSCCode ?? '',
        MICRCode: data.MICRCode ?? '',
        Address: data.Address ?? '',
        PhoneNo: data.PhoneNo ?? '',
        EmailID: data.EmailID ?? '',
        InActive: data.InActive ?? false,
      });
      toast(`Branch ${data.BranchID ? 'updated' : 'created'} successfully!`, 'success');
      setFormKey((k) => k + 1);
      reset({
        BranchID: 0, BankID: 0, BranchCode: '', BranchName: '',
        IFSCCode: '', MICRCode: '', Address: '', PhoneNo: '', EmailID: '', InActive: false,
      });
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save branch.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row: Branch) => {
    reset({
      BranchID: row.BranchID, BankID: row.BankID,
      BranchCode: row.BranchCode, BranchName: row.BranchName,
      IFSCCode: row.IFSCCode ?? '', MICRCode: row.MICRCode ?? '',
      Address: row.Address ?? '', PhoneNo: row.PhoneNo ?? '',
      EmailID: row.EmailID ?? '', InActive: row.InActive,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filtered = search.trim()
    ? records.filter((r) =>
        r.BranchName.toLowerCase().includes(search.toLowerCase()) ||
        r.BranchCode.toLowerCase().includes(search.toLowerCase())
      )
    : records;

  const I = (name: keyof BranchFormValues) =>
    cn('form-input', errors[name] && 'border-red-400 focus:ring-red-400/40');

  return (
    <div className="space-y-6">
      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <FormField label="Bank" required error={errors.BankID?.message}>
            <select
              className={cn('form-select', errors.BankID && 'border-red-400')}
              {...register('BankID', { valueAsNumber: true })}
            >
              <option value={0}>-- Select Bank --</option>
              {banks.map((b) => (
                <option key={b.BankID} value={b.BankID}>{b.BankName} </option>
              ))}
            </select>
          </FormField>

          <FormField label="Branch Code" required error={errors.BranchCode?.message}>
            <input type="text" className={I('BranchCode')} {...register('BranchCode')} placeholder="e.g. SLK" />
          </FormField>

          <FormField label="Branch Name" required error={errors.BranchName?.message}>
            <input type="text" className={I('BranchName')} {...register('BranchName')} placeholder="e.g. Salt Lake Branch" />
          </FormField>

          <FormField label="IFSC Code">
            <input type="text" className={I('IFSCCode')} {...register('IFSCCode')} placeholder="e.g. SBIN0001234" />
          </FormField>

          <FormField label="MICR Code">
            <input type="text" className={I('MICRCode')} {...register('MICRCode')} placeholder="e.g. 700002001" />
          </FormField>

          <FormField label="Phone No">
            <input type="text" className={I('PhoneNo')} {...register('PhoneNo')} placeholder="e.g. 03312345678" />
          </FormField>

          <FormField label="Email ID">
            <input type="text" className={I('EmailID')} {...register('EmailID')} placeholder="branch@bank.com" />
          </FormField>

          <FormField label="Address">
            <input type="text" className={I('Address')} {...register('Address')} placeholder="Branch address" />
          </FormField>
        </div>

        {/* Status + Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setValue('InActive', !watch('InActive'))}
              className={cn(
                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200',
                watch('InActive') ? 'bg-red-400' : 'bg-emerald-500',
              )}
            >
              <span className={cn(
                'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200',
                watch('InActive') ? 'translate-x-1' : 'translate-x-4',
              )} />
            </button>
            <span className={cn('text-xs font-medium', watch('InActive') ? 'text-red-500' : 'text-emerald-600')}>
              {watch('InActive') ? 'Inactive' : 'Active'}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" type="button" onClick={() => reset({
              BranchID: 0, BankID: 0, BranchCode: '', BranchName: '',
              IFSCCode: '', MICRCode: '', Address: '', PhoneNo: '', EmailID: '', InActive: false,
            })}>
              <X size={13} /> Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Save size={13} /> {saving ? 'Saving…' : 'Submit'}
            </Button>
          </div>
        </div>
      </form>

      <hr className="border-slate-100" />

      {/* Filter + Search */}
      <div className="flex items-center gap-3">
        <select
          className="form-select w-52"
          value={filterBankId}
          onChange={(e) => setFilterBankId(Number(e.target.value))}
        >
          <option value={0}>All Banks</option>
          {banks.map((b) => (
            <option key={b.BankID} value={b.BankID}>{b.BankName}</option>
          ))}
        </select>
        <div className="relative max-w-xs w-full">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or name…"
            className="form-input pl-9 pr-8"
            style={{ paddingLeft: '2.25rem' }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>
        <span className="text-xs text-slate-400">{total} total records</span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-10">#</th>
              <th>Bank</th>
              <th>Branch Code</th>
              <th>Branch Name</th>
              <th>IFSC Code</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                    <Loader2 size={16} className="animate-spin" /> Loading…
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400 text-sm">No records found</td>
              </tr>
            ) : (
              filtered.map((r, idx) => (
                <tr key={r.BranchID} onDoubleClick={() => handleEdit(r)} className="cursor-pointer">
                  <td className="text-slate-400">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td><span className="text-xs text-slate-500">{r.BankName}</span></td>
                  <td><span className="badge badge-slate text-[11px]">{r.BranchCode}</span></td>
                  <td><span className="font-medium text-slate-800">{r.BranchName}</span></td>
                  <td><span className="text-xs text-slate-500">{r.IFSCCode ?? '—'}</span></td>
                  <td>
                    <span className={r.InActive ? 'badge badge-red' : 'badge badge-green'}>
                      {r.InActive ? 'Inactive' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Showing {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} entries</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={() => fetchPage(page - 1)} disabled={page === 1 || loading}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft size={13} /> Prev
            </button>
            <span className="w-8 h-7 flex items-center justify-center rounded-md bg-blue-600 text-white text-xs font-medium">{page}</span>
            <button onClick={() => fetchPage(page + 1)} disabled={page === totalPages || loading}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
              Next <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}