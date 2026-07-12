import { useEffect, useState, useMemo } from 'react';
import { Search, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { getAllUsers } from '@/apis/master/userApi';
import type { UserDepartment } from '@/types';

const PAGE_SIZE = 5;

interface Props {
  onEdit: (row: UserDepartment) => void;
}

export default function UserSearch({ onEdit }: Props) {
  const [allRecords, setAllRecords] = useState<UserDepartment[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAllUsers(1, 100, 0, 0)
      .then((res) => {
        const users: UserDepartment[] = res?.data?.UserDepartment ?? [];
        setAllRecords(users);
      })
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false));
  }, []);

  // Filter by search
  const filtered = useMemo(() => {
    if (!search.trim()) return allRecords;
    const q = search.toLowerCase();
    return allRecords.filter(
      (u) =>
        u.UserName.toLowerCase().includes(q) ||
        u.UserLoginID.toLowerCase().includes(q) ||
        u.DepartmentName.toLowerCase().includes(q),
    );
  }, [allRecords, search]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page on search
  useEffect(() => { setPage(1); }, [search]);

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
            placeholder="Search by name, login or department…"
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
          {loading ? 'Loading…' : `${filtered.length} records`}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>Full Name</th>
                <th>Login ID</th>
                <th>Company</th>
                    <th>Layer</th>

                <th>User Group</th>
                <th>Department</th>
                <th>Login Applicable</th>
                <th>Active</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                      <Loader2 size={16} className="animate-spin" /> Loading…
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-red-500 text-sm">{error}</td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 text-sm">No records found</td>
                </tr>
              ) : (
                paged.map((u, idx) => (
                  <tr
                    key={u.UserDepartmentID}
                    onDoubleClick={() => onEdit(u)}
                    className="cursor-pointer"
                  >
                    <td className="text-slate-400">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td>
                      <span className="font-medium text-slate-800">{u.UserName}</span>
                    </td>
                    <td>
                      <span className="badge badge-blue text-[11px]">{u.UserLoginID}</span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-500">{u.CompanyName}</span>
                    </td>
                    <td>
                      <span className="badge badge-slate text-[11px]">{u.CompanyLayer}</span>
                    </td> 

                    <td>
                      <span className="text-xs text-slate-600">{u.GroupName}</span>
                    </td>
                    <td>
                      <span className="badge badge-slate text-[10px]">{u.DepartmentName}</span>
                    </td>
                    <td>
                      <span className={u.IsLoginApplicable ? 'badge badge-green' : 'badge badge-slate'}>
                        {u.IsLoginApplicable ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      <span className={u.IsUserActive ? 'badge badge-green' : 'badge badge-slate'}>
                        {u.IsUserActive ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      <span className={u.InActive ? 'badge badge-red' : 'badge badge-green'}>
                        {u.InActive ? 'Inactive' : 'Active'}
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
          Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} entries
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={13} /> Prev
            </button>
            <span className="w-8 h-7 flex items-center justify-center rounded-md bg-blue-600 text-white text-xs font-medium">
              {page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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