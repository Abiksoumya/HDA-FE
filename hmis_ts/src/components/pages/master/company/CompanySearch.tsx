import { useEffect, useState } from 'react';
import { Search, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { getAllCompanies } from '@/apis/master/companyApi';
import type { Company } from '@/types';

interface CompanyRecord {
  RecordNo: number;
  CompanyID: number;
  Code: string;
  Description: string;
  LayerID: number;
  LevelNo: number;
  ParentCompanyID: number;
  GroupFlag: string;
  GroupFlagDisplay: string;
  MasterLevel: number;
  InActive: boolean;
  InActiveDisplay: string;
  ParentCompany: string;
  CompanyProfile: {
    CompanyID: number;
    Address: string;
    Address2: string;
    Address3: string;
    Phone: string;
    Fax: string;
    EMail: string;
    PANNo: string;
    TANNo: string;
    GSTIN: string;
    InActive: boolean;
    InActiveDisplay: string;
  };
}

interface PaginatedResponse {
  data: CompanyRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const PAGE_SIZE = 5;

interface Props {
  onSelect: (row: Company | null) => void;
  onEdit: (row: Company) => void;
}

export default function CompanySearch({ onSelect, onEdit }: Props) {
  const [records, setRecords] = useState<CompanyRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fetchPage = (p: number) => {
    setLoading(true);
    setError(null);
    getAllCompanies(p, PAGE_SIZE)
      .then((res) => {
        const result = res?.data as PaginatedResponse;
        setRecords(result?.data ?? []);
        setTotal(result?.total ?? 0);
        setTotalPages(result?.totalPages ?? 1);
        setPage(p);
        setSelectedId(null);
        onSelect(null);
      })
      .catch(() => setError('Failed to load companies.'))
      .finally(() => setLoading(false));
  };

  // Load page 1 on mount
  useEffect(() => {
    fetchPage(1);
  }, []);

 const toCompany = (r: CompanyRecord): Company => ({
  ADMIN_COMPANY_NID: r.CompanyID,
  ADMIN_COMPANY_SNAME: r.Description,
  ADMIN_COMPANY_SHORTNAME: r.Code,
  ADIMN_CMPN_LAYER_NID: r.LayerID,           // ← layer
  ADMIN_COMPANY_NGRPID: r.ParentCompanyID,    // ← parent
  ADMIN_COMPANY_PROFILE_SADDR: r.CompanyProfile?.Address ?? '',
  ADMIN_COMPANY_PROFILE_SADDR1: r.CompanyProfile?.Address2 ?? '',
  ADMIN_COMPANY_PROFILE_SPHONE: r.CompanyProfile?.Phone ?? '',
  ADMIN_COMPANY_PROFILE_SEMAIL: r.CompanyProfile?.EMail ?? '',
  ADMIN_COMPANY_PROFILE_SGST: r.CompanyProfile?.GSTIN ?? '',
  ADMIN_COMPANY_PROFILE_SPAN: r.CompanyProfile?.PANNo ?? '',
   ADMIN_COMPANY_PROFILE_STAN: r.CompanyProfile?.TANNo ?? '',
  ADMIN_COMPANY_INACTIVE: r.InActive ?? false, // ← add this
} as Company);

  const handleRowClick = (r: CompanyRecord) => {
    if (selectedId === r.CompanyID) {
      setSelectedId(null);
      onSelect(null);
    } else {
      setSelectedId(r.CompanyID);
      onSelect(toCompany(r));
    }
  };

  // Client-side search filter on current page data
  const filtered = search.trim()
    ? records.filter(
        (c) =>
          c.Description?.toLowerCase().includes(search.toLowerCase()) ||
          c.Code?.toLowerCase().includes(search.toLowerCase()),
      )
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
            placeholder="Search by name or code…"
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
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>Name</th>
                <th>Short Name</th>
                <th>Type</th>
                <th>Address</th>
                <th>Phone</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                      <Loader2 size={16} className="animate-spin" /> Loading…
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-red-500 text-sm">{error}</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-sm">
                    No records found
                  </td>
                </tr>
              ) : (
                filtered.map((r, idx) => (
                  <tr
                    key={r.CompanyID}
                    className={selectedId === r.CompanyID ? 'selected' : ''}
                    onClick={() => handleRowClick(r)}
                    onDoubleClick={() => onEdit(toCompany(r))}
                  >
                    <td className="text-slate-400">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td>
                      <p className="font-medium text-slate-800">{r.Description}</p>
                      {r.ParentCompany && (
                        <p className="text-xs text-slate-400">↳ {r.ParentCompany}</p>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-blue font-mono text-[11px]">{r.Code}</span>
                    </td>
                    <td>
                      <span className={r.GroupFlag === 'Y' ? 'badge badge-green' : 'badge badge-slate'}>
                        {r.GroupFlag === 'Y' ? 'Group' : 'Entity'}
                      </span>
                    </td>
                    <td className="text-xs text-slate-500">{r.CompanyProfile?.Address || '—'}</td>
                    <td className="text-xs">{r.CompanyProfile?.Phone || '—'}</td>
                    <td className="text-xs text-slate-500">{r.CompanyProfile?.EMail || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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