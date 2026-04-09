import { useState } from 'react';
import { Plus, Search, Edit2, X, Save } from 'lucide-react';
import { submit } from '@/apis/master/adminGroupApi';
import { useToast } from '@/hooks/useToast';
import { useModal } from '@/hooks/useModal';
import Modal from '@/components/panels/Modal';
import PageCard from '@/components/shared/PageCard';
import { Button } from '@/components/ui/Button';
import AdminGroupForm from './AdminGroupForm';
import AdminGroupSearch from './AdminGroupSearch';
import type { AdminGroup, AdminGroupFormValues } from '@/types';

type View = 'form' | 'search';

export default function AdminGroupManager() {
  const [view, setView] = useState<View>('form');
  const [editing, setEditing] = useState<AdminGroup | null>(null);
  const [selected, setSelected] = useState<AdminGroup | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { showModal, modalState, handleClose } = useModal();

  const handleSave = async (payload: AdminGroupFormValues) => {
    setSaving(true);
    try {
      await submit(payload);
      toast('User Group saved successfully!', 'success');
      setView('search');
      setEditing(null);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = async () => {
    if (!selected) {
      await showModal({
        title: 'No Selection',
        message: 'Please select a user group row first.',
        variant: 'warning',
        showCancelButton: false,
      });
      return;
    }
    setEditing(selected);
    setView('form');
  };

  const title =
    view === 'form'
      ? editing ? 'Edit User Group' : 'Add New User Group'
      : 'User Group — Search';

  const footer =
    view === 'form' ? (
      <>
        <Button type="submit" form="admin-group-form" disabled={saving}>
          <Save size={13} /> {saving ? 'Saving…' : 'Submit'}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setSelected(null); setView('search'); }}>
            <Search size={13} /> Search
          </Button>
          <Button variant="secondary" onClick={() => { setEditing(null); setView('form'); }}>
            <X size={13} /> Cancel
          </Button>
        </div>
      </>
    ) : (
      <>
        <Button disabled={!selected} onClick={handleEditClick}>
          <Edit2 size={13} /> Edit{selected ? ` (${selected.ADMIN_GROUP_SNAME})` : ''}
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => { setEditing(null); setSelected(null); setView('form'); }}
          >
            <Plus size={13} /> Create New
          </Button>
          <Button variant="secondary" onClick={() => setView('form')}>
            Back
          </Button>
        </div>
      </>
    );

  return (
    <>
      <Modal {...modalState} isOpen={modalState.isOpen} onClose={handleClose} />
      <PageCard title={title} footer={footer}>
        {view === 'form' ? (
          <AdminGroupForm formdata={editing} onSave={handleSave} />
        ) : (
          <AdminGroupSearch
            onSelect={setSelected}
            onEdit={(r) => { setEditing(r); setView('form'); }}
          />
        )}
      </PageCard>
    </>
  );
}
