import { useEffect, useState } from 'react';
import { Search, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { getAllDepartments } from '@/apis/master/departmentApi';
import type { Department } from '@/types';

const PAGE_SIZE = 5;

interface PaginatedResponse {
  data: Department[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface Props {
  onSelect: (row: Department | null) => void;
  onEdit: (row: Department) => void;
}

export default function DepartmentSearch({ onSelect, onEdit }: Props) {
  const [records, setRecords] = useState<Department[]>([]);
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
    getAllDepartments(p, PAGE_SIZE)
      .then((res) => {
        const result = res?.data as PaginatedResponse;
        setRecords(result?.data ?? []);
        setTotal(result?.total ?? 0);
        setTotalPages(result?.totalPages ?? 1);
        setPage(p);
        setSelectedId(null);
        onSelect(null);
      })
      .catch(() => setError('Failed to load departments.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPage(1); }, []);

  const filtered = search.trim()
    ? records.filter(
        (d) =>
          d.Description?.toLowerCase().includes(search.toLowerCase()) ||
          d.Code?.toLowerCase().includes(search.toLowerCase()),
      )
    : records;

  const handleRowClick = (r: Department) => {
    if (selectedId === r.DepartmentID) {
      setSelectedId(null);
      onSelect(null);
    } else {
      setSelectedId(r.DepartmentID);
      onSelect(r);
    }
  };

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
                <th>Department Name</th>
                <th>Code</th>
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
              ) : error ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-red-500 text-sm">{error}</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400 text-sm">
                    No records found
                  </td>
                </tr>
              ) : (
                filtered.map((r, idx) => (
                  <tr
                    key={r.DepartmentID}
                    className={selectedId === r.DepartmentID ? 'selected' : ''}
                    onClick={() => handleRowClick(r)}
                    onDoubleClick={() => onEdit(r)}
                  >
                    <td className="text-slate-400">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td>
                      <span className="font-medium text-slate-800">{r.Description}</span>
                    </td>
                    <td>
                      <span className="badge badge-blue font-mono text-[11px]">{r.Code}</span>
                    </td>
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