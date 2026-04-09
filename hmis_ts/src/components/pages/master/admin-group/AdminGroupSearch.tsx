import { useCallback } from 'react';
import { getUserGroup } from '@/apis/master/adminGroupApi';
import DataTable, { type Column } from '@/components/shared/DataTable';
import type { AdminGroup } from '@/types';

const COLUMNS: Column<AdminGroup>[] = [
  {
    key: 'ADMIN_COMPANY_SNAME',
    header: 'Company / Branch',
    render: (r) => <span className="text-slate-600">{String(r.ADMIN_COMPANY_SNAME ?? '')}</span>,
  },
  {
    key: 'ADMIN_GROUP_SNAME',
    header: 'User Group Name',
    render: (r) => <span className="font-medium text-slate-800">{r.ADMIN_GROUP_SNAME}</span>,
  },
];

interface Props {
  onSelect: (row: AdminGroup | null) => void;
  onEdit: (row: AdminGroup) => void;
}

export default function AdminGroupSearch({ onSelect, onEdit }: Props) {
  const fetchData = useCallback(async (search: string) => {
    const res = await getUserGroup(0, 0, search, 0);
    return (res?.data?.data ?? []) as AdminGroup[];
  }, []);

  return (
    <DataTable<AdminGroup>
      columns={COLUMNS}
      fetchData={fetchData}
      rowKey="ADMIN_GROUP_NID"
      onSelect={onSelect}
      onDoubleClick={onEdit}
      searchPlaceholder="Search by user group name…"
    />
  );
}
