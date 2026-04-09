import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import debounce from 'lodash.debounce';
import { Search, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  fetchData: (search: string) => Promise<T[]>;
  rowKey: keyof T;
  onSelect?: (row: T | null) => void;
  onDoubleClick?: (row: T) => void;
  searchPlaceholder?: string;
  pageSize?: number;
  deps?: unknown[];
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  fetchData,
  rowKey,
  onSelect,
  onDoubleClick,
  searchPlaceholder = 'Search…',
  pageSize = 8,
  deps = [],
}: DataTableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedKey, setSelectedKey] = useState<unknown>(null);

  const load = useCallback(
    async (q: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchData(q);
        setData(result);
        setPage(1);
        setSelectedKey(null);
        onSelect?.(null);
      } catch {
        setError('Failed to load data. Please try again.');
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchData, ...deps],
  );

  // Debounced search
  const debouncedLoad = useRef(debounce((q: string) => load(q), 300)).current;

  useEffect(() => { load(''); }, [load]);

  const handleSearch = (val: string) => {
    setSearch(val);
    debouncedLoad(val);
  };

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  const totalPages = Math.ceil(data.length / pageSize);

  const handleRowClick = (row: T) => {
    const key = row[rowKey];
    if (key === selectedKey) {
      setSelectedKey(null);
      onSelect?.(null);
    } else {
      setSelectedKey(key);
      onSelect?.(row);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="form-input pl-8 pr-8"
          />
          {search && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <span className="text-xs text-slate-400">
          {loading ? 'Searching…' : `${data.length} record${data.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                {columns.map((col) => (
                  <th key={String(col.key)} className={col.className}>{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                      <Loader2 size={16} className="animate-spin" /> Loading…
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-10 text-center text-red-500 text-sm">
                    {error}
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-10 text-center text-slate-400 text-sm">
                    {search ? `No results for "${search}"` : 'No records found'}
                  </td>
                </tr>
              ) : (
                paginated.map((row, idx) => (
                  <tr
                    key={String(row[rowKey])}
                    className={cn(row[rowKey] === selectedKey && 'selected')}
                    onClick={() => handleRowClick(row)}
                    onDoubleClick={() => onDoubleClick?.(row)}
                  >
                    <td className="text-slate-400">{(page - 1) * pageSize + idx + 1}</td>
                    {columns.map((col) => (
                      <td key={String(col.key)} className={col.className}>
                        {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.length)} of {data.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const n = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={cn(
                    'w-7 h-7 rounded text-xs font-medium transition-colors',
                    n === page
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-100 text-slate-600',
                  )}
                >
                  {n}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
