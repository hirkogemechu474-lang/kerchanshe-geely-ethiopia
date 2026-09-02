import { requirePermission } from '@/lib/auth/middleware';
import EditUserForm from '@/components/admin/users/EditUserForm';

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('canManageUsers');
  const { id } = await params;

  return <EditUserForm id={id} />;
}
