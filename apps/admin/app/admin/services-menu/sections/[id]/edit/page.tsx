import { requirePermission } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ServiceSectionForm from '@/components/admin/services/ServiceSectionForm';



export default async function EditServiceSectionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  await requirePermission('canManageContent');

  const section = await prisma.serviceSection.findUnique({
    where: { id: id },
  });

  if (!section) {
    notFound();
  }

  return <ServiceSectionForm section={section as any} isEdit={true} />;
}
