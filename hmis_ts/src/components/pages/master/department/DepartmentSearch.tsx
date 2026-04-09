// DepartmentSearch.tsx
import { useCallback } from 'react';
import { getDepartmentSearch } from '@/apis/master/departmentApi';
import DataTable, { type Column } from '@/components/shared/DataTable';
import type { Department } from '@/types';

const COLUMNS: Column<Department>[] = [
  { key: 'ADMIN_DEPRT_SNAME', header: 'Department Name', render: (r) => <span className="font-medium">{r.ADMIN_DEPRT_SNAME}</span> },
  { key: 'ADMIN_DEPRT_SPREFIX', header: 'Short Name', render: (r) => <span className="badge badge-slate">{String(r.ADMIN_DEPRT_SPREFIX ?? '')}</span> },
];

interface SearchProps { onSelect: (row: Department | null) => void; onEdit: (row: Department) => void; }

export function DepartmentSearch({ onSelect, onEdit }: SearchProps) {
  const fetchData = useCallback(async (search: string) => {
    const res = await getDepartmentSearch(0, search || undefined);
    return (res?.data?.data ?? []) as Department[];
  }, []);
  return <DataTable<Department> columns={COLUMNS} fetchData={fetchData} rowKey="ADMIN_DEPRT_NID" onSelect={onSelect} onDoubleClick={onEdit} searchPlaceholder="Search by department name…" />;
}
