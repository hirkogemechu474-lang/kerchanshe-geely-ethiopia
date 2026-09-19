import { redirect } from 'next/navigation';
import { requirePermission } from '@/lib/auth/middleware';

// Retain old bookmarks while consolidating showcase controls under Vehicles.
export default async function ShowcaseManagementPage() {
  await requirePermission('canManageContent');
  redirect('/admin/vehicles/settings#sec-360');
}
