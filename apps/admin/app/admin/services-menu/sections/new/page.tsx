import { requirePermission } from '@/lib/auth/middleware';
import ServiceSectionForm from '@/components/admin/services/ServiceSectionForm';

export default async function NewServiceSectionPage() {
  await requirePermission('canManageContent');

  return <ServiceSectionForm />;
}
