import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { Search, X, ChevronLeft, ChevronRight, Loader2, Save } from 'lucide-react';
import { getBanks, createBank } from '@/apis/finance/financeApi';
import { useToast } from '@/hooks/useToast';
import FormField from '@/components/shared/FormField';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface BankFormValues {
  BankID: number;
  BankName: string;
  InActive: boolean;
}

interface Bank {
  BankID: number;
  BankCode: string;
  BankName: string;
  InActive: boolean;
}

const schema = Yup.object({
  BankName: Yup.string().required('Bank Name is required'),
});

const PAGE_SIZE = 5;

export default function BankTab() {
  const [records, setRecords] = useState<Bank[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } =
    useForm<BankFormValues>({
      resolver: yupResolver(schema) as never,
defaultValues: { BankID: 0, BankName: '', InActive: false },
    });

  const fetchPage = (p: number) => {
    setLoading(true);
    getBanks(0)
      .then((res) => {
        const data = res?.data;
        setRecords(data?.BankList ?? []);
        setTotal(data?.TotalRecords ?? 0);
        setTotalPages(data?.TotalPages ?? 1);
        setPage(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPage(1); }, [formKey]);

  const onSubmit = async (data: BankFormValues) => {
    setSaving(true);
    try {
      await createBank({
  RecordState: data.BankID ? 2 : 1,
  BankID: data.BankID ?? 0,
  BankName: data.BankName,
  InActive: data.InActive ?? false,
});
      toast(`Bank ${data.BankID ? 'updated' : 'created'} successfully!`, 'success');
      setFormKey((k) => k + 1);
      reset({ BankID: 0, BankName: '', InActive: false });
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save bank.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row: Bank) => {
    reset({
      BankID: row.BankID,
      BankName: row.BankName,
      InActive: row.InActive,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filtered = search.trim()
    ? records.filter((r) =>
        r.BankName.toLowerCase().includes(search.toLowerCase()) ||
        r.BankCode.toLowerCase().includes(search.toLowerCase())
      )
    : records;

  const I = (name: keyof BankFormValues) =>
    cn('form-input', errors[name] && 'border-red-400 focus:ring-red-400/40');

  return (
    <div className="space-y-6">
      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
  <div className="md:col-span-6">
    <FormField label="Bank Name" required error={errors.BankName?.message}>
      <input
        type="text"
        className={I('BankName')}
        {...register('BankName')}
        placeholder="e.g. State Bank of India"
      />
    </FormField>
  </div>

  {/* Status toggle */}
  <div className="md:col-span-3 flex items-end pb-1 gap-3">
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
</div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => reset({ BankID: 0,  BankName: '', InActive: false })}>
            <X size={13} /> Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            <Save size={13} /> {saving ? 'Saving…' : 'Submit'}
          </Button>
        </div>
      </form>

      <hr className="border-slate-100" />

      {/* Search */}
      <div className="flex items-center gap-2">
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
              <th>Bank Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                    <Loader2 size={16} className="animate-spin" /> Loading…
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-slate-400 text-sm">No records found</td>
              </tr>
            ) : (
              filtered.map((r, idx) => (
                <tr key={r.BankID} onDoubleClick={() => handleEdit(r)} className="cursor-pointer">
                  <td className="text-slate-400">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td><span className="font-medium text-slate-800">{r.BankName}</span></td>
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