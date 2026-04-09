import { useState } from 'react';
import { Plus, Search, Edit2, X, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { saveDepartment } from '@/apis/master/departmentApi';
import { useToast } from '@/hooks/useToast';
import { useModal } from '@/hooks/useModal';
import Modal from '@/components/panels/Modal';
import PageCard from '@/components/shared/PageCard';
import { Button } from '@/components/ui/Button';
import { DepartmentForm } from './DepartmentForm';
import { DepartmentSearch } from './DepartmentSearch';
import type { Department, DepartmentFormValues } from '@/types';

type View = 'form' | 'search';

export default function DepartmentManager() {
  const [view, setView] = useState<View>('form');
  const [editing, setEditing] = useState<Department | null>(null);
  const [selected, setSelected] = useState<Department | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { showModal, modalState, handleClose } = useModal();

  const handleSave = async (payload: DepartmentFormValues) => {
    setSaving(true);
    try {
      await saveDepartment(payload);
      toast('Department saved successfully!', 'success');
      setView('search');
      setEditing(null);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selected) {
      await showModal({ title: 'No Selection', message: 'Please select a department row first.', variant: 'warning', showCancelButton: false });
      return;
    }
    setEditing(selected);
    setView('form');
  };

  const title = view === 'form' ? (editing ? 'Edit Department' : 'Add New Department') : 'Department — Search';

  const footer = view === 'form' ? (
    <>
      <div />
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => { setEditing(null); setView('form'); }}><X size={13} /> Cancel</Button>
        <Button type="submit" form="department-form" disabled={saving}>
          <Save size={13} /> {saving ? 'Saving…' : 'Submit'}
        </Button>
      </div>
    </>
  ) : (
    <>
      <Button disabled={!selected} onClick={handleEdit}>
        <Edit2 size={13} /> Edit{selected ? ` (${selected.ADMIN_DEPRT_SNAME})` : ''}
      </Button>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => { setEditing(null); setSelected(null); setView('form'); }}><Plus size={13} /> Create New</Button>
        <Button variant="secondary" onClick={() => setView('form')}>Back</Button>
      </div>
    </>
  );

  return (
    <>
      <Modal {...modalState} isOpen={modalState.isOpen} onClose={handleClose} />
      <PageCard title={title} footer={footer} footerClassName="border-0 shadow-none bg-transparent px-0">
        {view === 'form'
          ? <DepartmentForm formdata={editing} onSave={handleSave} />
          : <DepartmentSearch onSelect={setSelected} onEdit={(r) => { setEditing(r); setView('form'); }} />
        }
      </PageCard>

      {/* Department list section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search bar */}
        <div className="px-4 py-3 border-b border-slate-200">
          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                <th className="px-4 py-3 w-10">#</th>
                <th className="px-4 py-3">Department Name</th>
                <th className="px-4 py-3">Prefix</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={3} className="text-center py-14 text-slate-400 text-sm">
                  No records found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">Showing 0 of 0 entries</span>
          <div className="flex items-center gap-1">
            <button
              disabled
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-slate-200 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronLeft size={13} /> Prev
            </button>
            <button className="px-2.5 py-1 text-xs rounded-md border border-primary bg-primary text-white font-medium">
              1
            </button>
            <button
              disabled
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-slate-200 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
