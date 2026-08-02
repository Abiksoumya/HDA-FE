import { useState } from 'react';
import { saveUser } from '@/apis/master/userApi';
import { useToast } from '@/hooks/useToast';
import PageCard from '@/components/shared/PageCard';
import DynamicFooter from '@/components/shared/DynamicFooter';
import UserForm from './UserForm';
import UserSearch from './UserSearch';
import type { UserDepartment } from '@/types';

export default function UserManager() {
  const [formKey, setFormKey] = useState(0);
  const [tableKey, setTableKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [editUser, setEditUser] = useState<UserDepartment | null>(null);
  const { toast } = useToast();

  const handleSave = async (payload: unknown, onSuccess?: () => void) => {
    setSaving(true);
    try {
      await saveUser(payload);
      const p = payload as { RecordState: number };
      const action = p.RecordState === 2 ? 'updated' : 'created';
      toast(`User ${action} successfully!`, 'success');
      setFormKey((k) => k + 1);
      setTableKey((k) => k + 1);
      setEditUser(null);
      onSuccess?.();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save user.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row: UserDepartment) => {
    setEditUser(row);
    setFormKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClose = () => {
    setEditUser(null);
    setFormKey((k) => k + 1);
  };

  return (
    <>
      <PageCard title={editUser ? `Edit User — ${editUser.UserName}` : 'Add New User'}>
        <UserForm key={formKey} editUser={editUser} onSave={handleSave} />
        <DynamicFooter
          formId="user-form"
          saving={saving}
          onClose={handleClose}
          className="mt-4"
        />
      </PageCard>

      <div className="mt-4">
        <PageCard title="User List" showBackButton={false}>
          <UserSearch key={tableKey} onEdit={handleEdit} />
        </PageCard>
      </div>
    </>
  );
}
