import { useEffect, useState } from 'react';
import { Search, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { getSubLedgerList, getSubLedgerEmployeeList } from '@/apis/finance/financeApi';

interface SubLedgerRow {
  SubLedgerID: number;
  SubLedgerCode: string;
  // Generic fields
  LegalName?: string;
  EntityLookup?: string;
  // Employee fields
  ProfileName?: string;
  ContactNo?: string;
  EMail?: string;
}

interface Props {
  companyId: number;
  companyGroupId: number;
  subLedgerTypeId: number;
  isEmployeeType: boolean;
  refreshKey: number;
  onEdit: (row: SubLedgerRow) => void;
}

const PAGE_SIZE = 5;

export default function SubLedgerSearch({
  companyId, companyGroupId, subLedgerTypeId, isEmployeeType, refreshKey, onEdit,
}: Props) {
  const [records, setRecords] = useState<SubLedgerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = (p: number) => {
    if (!companyId || !companyGroupId || !subLedgerTypeId) return;
    setLoading(true);
    setError(null);

    const apiFn = isEmployeeType
      ? getSubLedgerEmployeeList(companyId, companyGroupId, subLedgerTypeId, p, PAGE_SIZE)
      : getSubLedgerList(companyId, companyGroupId, subLedgerTypeId, p, PAGE_SIZE);

    apiFn
      .then((res) => {
        const data = res?.data;
        setRecords(data?.SubLedgers ?? []);
        setTotal(data?.TotalRecords ?? 0);
        setTotalPages(data?.TotalPages ?? 1);
        setPage(p);
      })
      .catch(() => {
        setError('Failed to load records.');
        setRecords([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPage(1);
    setSearch('');
  }, [companyId, companyGroupId, subLedgerTypeId, isEmployeeType, refreshKey]);

  const filtered = search.trim()
    ? records.filter((r) => {
        const name = isEmployeeType ? r.ProfileName : r.LegalName;
        return (
          name?.toLowerCase().includes(search.toLowerCase()) ||
          r.SubLedgerCode?.toLowerCase().includes(search.toLowerCase())
        );
      })
    : records;

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative max-w-xs w-full">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isEmployeeType ? 'Search by code or name…' : 'Search by code or legal name…'}
            className="form-input pl-9 pr-8"
            style={{ paddingLeft: '2.25rem' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <span className="text-xs text-slate-400">
          {loading ? 'Loading…' : `${total} total records`}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="data-table">
          <thead>
            {isEmployeeType ? (
              <tr>
                <th className="w-10">#</th>
                <th>Code</th>
                <th>Name</th>
                <th>Contact No</th>
                <th>Email</th>
              </tr>
            ) : (
              <tr>
                <th className="w-10">#</th>
                <th>Code</th>
                <th>Legal Name</th>
                <th>Entity</th>
              </tr>
            )}
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={isEmployeeType ? 5 : 4} className="py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                    <Loader2 size={16} className="animate-spin" /> Loading…
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={isEmployeeType ? 5 : 4} className="py-10 text-center text-red-500 text-sm">
                  {error}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={isEmployeeType ? 5 : 4} className="py-10 text-center text-slate-400 text-sm">
                  No records found
                </td>
              </tr>
            ) : isEmployeeType ? (
              filtered.map((r, idx) => (
                <tr key={r.SubLedgerID} onDoubleClick={() => onEdit(r)} className="cursor-pointer">
                  <td className="text-slate-400">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td><span className="badge badge-slate text-[11px]">{r.SubLedgerCode || '—'}</span></td>
                  <td><span className="font-medium text-slate-800">{r.ProfileName}</span></td>
                  <td><span className="text-xs text-slate-500">{r.ContactNo ?? '—'}</span></td>
                  <td><span className="text-xs text-slate-500">{r.EMail ?? '—'}</span></td>
                </tr>
              ))
            ) : (
              filtered.map((r, idx) => (
                <tr key={r.SubLedgerID} onDoubleClick={() => onEdit(r)} className="cursor-pointer">
                  <td className="text-slate-400">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td><span className="badge badge-slate text-[11px]">{r.SubLedgerCode || '—'}</span></td>
                  <td><span className="font-medium text-slate-800">{r.LegalName}</span></td>
                  <td><span className="badge badge-blue text-[11px]">{r.EntityLookup}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} entries
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchPage(page - 1)}
              disabled={page === 1 || loading}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={13} /> Prev
            </button>
            <span className="w-8 h-7 flex items-center justify-center rounded-md bg-blue-600 text-white text-xs font-medium">
              {page}
            </span>
            <button
              onClick={() => fetchPage(page + 1)}
              disabled={page === totalPages || loading}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}