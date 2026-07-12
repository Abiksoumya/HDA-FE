// import { useState } from 'react';
// import { X, Save } from 'lucide-react';
// import { saveUser } from '@/apis/master/userApi';
// import { useToast } from '@/hooks/useToast';
// import PageCard from '@/components/shared/PageCard';
// import { Button } from '@/components/ui/Button';
// import UserForm from './UserForm';
// import UserSearch from './UserSearch';

// export default function UserManager() {
//   const [formKey, setFormKey] = useState(0);
//   const [tableKey, setTableKey] = useState(0);
//   const [saving, setSaving] = useState(false);
//   const { toast } = useToast();

//   const handleSave = async (payload: unknown, onSuccess?: () => void) => {
//     setSaving(true);
//     try {
//       await saveUser(payload);
//       const p = payload as { RecordState: number };
//       const action = p.RecordState === 2 ? 'updated' : 'created';
//       toast(`User ${action} successfully!`, 'success');
//       setFormKey((k) => k + 1);
//       setTableKey((k) => k + 1);
//       onSuccess?.();
//     } catch (err: unknown) {
//       toast(err instanceof Error ? err.message : 'Failed to save user.', 'error');
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <>
//       {/* Form */}
//       <PageCard title="Add New User">
//         <UserForm key={formKey} onSave={handleSave} />
//         <div className="flex justify-end gap-2 mt-4">
//           <Button variant="secondary" onClick={() => setFormKey((k) => k + 1)}>
//             <X size={13} /> Cancel
//           </Button>
//           <Button type="submit" form="user-form" disabled={saving}>
//             <Save size={13} /> {saving ? 'Saving…' : 'Submit'}
//           </Button>
//         </div>
//       </PageCard>

//       {/* User list */}
//       <div className="mt-4">
//         <PageCard title="User List">
//           <UserSearch
//             key={tableKey}
//             onEdit={(userId) => // console.log('Edit user:', userId)}
//           />
//         </PageCard>
//       </div>
//     </>
//   );
// }

import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { saveUser } from '@/apis/master/userApi';
import { useToast } from '@/hooks/useToast';
import PageCard from '@/components/shared/PageCard';
import { Button } from '@/components/ui/Button';
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
    setFormKey((k) => k + 1); // ← reset form with new data
    window.scrollTo({ top: 0, behavior: 'smooth' }); // ← scroll to form
  };

  const handleCancel = () => {
    setEditUser(null);
    setFormKey((k) => k + 1);
  };

  return (
    <>
      {/* Form */}
      <PageCard title={editUser ? `Edit User — ${editUser.UserName}` : 'Add New User'}>
        <UserForm key={formKey} editUser={editUser} onSave={handleSave} />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={handleCancel}>
            <X size={13} /> Cancel
          </Button>
          <Button type="submit" form="user-form" disabled={saving}>
            <Save size={13} /> {saving ? 'Saving…' : 'Submit'}
          </Button>
        </div>
      </PageCard>

      {/* User list */}
      <div className="mt-4">
        <PageCard title="User List" showBackButton={false}>
          <UserSearch
            key={tableKey}
            onEdit={handleEdit}
          />
        </PageCard>
      </div>
    </>
  );
}