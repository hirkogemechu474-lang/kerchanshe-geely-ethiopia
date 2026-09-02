import { requirePermission } from '@/lib/auth/middleware';
import { serverApiClient } from '@/lib/serverApiClient';
import { notFound } from 'next/navigation';
import ServiceSectionForm from '@/components/admin/services/ServiceSectionForm';



export default async function EditServiceSectionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  await requirePermission('canManageContent');

  let section = null;
  try {
    const client = await serverApiClient();
    const { data } = await client.get(`/services-menu/sections/${id}`);
    section = data;
  } catch (error) {
    console.error('Error fetching section:', error);
  }

  if (!section) {
    notFound();
  }

  return <ServiceSectionForm section={section as any} isEdit={true} />;
}
