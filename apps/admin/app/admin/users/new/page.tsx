import { requirePermission } from '@/lib/auth/middleware';
import NewUserForm from '@/components/admin/users/NewUserForm';

export default async function NewUserPage() {
  await requirePermission('canManageUsers');

  return <NewUserForm />;
}
