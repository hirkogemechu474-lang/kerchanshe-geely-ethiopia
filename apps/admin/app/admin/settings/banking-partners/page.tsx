import { redirect } from 'next/navigation';
import { requirePermission } from '@/lib/auth/middleware';

export default async function BankingPartnersRedirect() {
  await requirePermission('canManageSettings');
  redirect('/admin/financing');
}
