import { requirePermission } from '@/lib/auth/middleware';
import { serverApiClient } from '@/lib/serverApiClient';
import { notFound } from 'next/navigation';
import JobCardDetail from '@/components/admin/workshop/JobCardDetail';

export default async function JobCardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission('canViewJobCards');
  const { id } = await params;
  const client = await serverApiClient();

  let jobCard: any;
  try {
    const res = await client.get(`/admin/workshop/job-cards/${id}`);
    jobCard = res.data.jobCard;
  } catch (err: any) {
    if (err?.response?.status === 404) notFound();
    throw err;
  }

  const [{ data: technicians }, { data: bays }, { data: partsPage }] = await Promise.all([
    client.get('/admin/workshop/technicians'),
    client.get('/admin/workshop/bays'),
    client.get('/parts', { params: { pageSize: 1000 } }),
  ]);

  const activeTechnicians = technicians.filter((t: any) => t.isActive);
  const activeBays = bays.filter((b: any) => b.isActive);
  const spareParts = partsPage.items.filter((p: any) => p.isActive);

  return (
    <div className="space-y-6 max-w-4xl">
      <JobCardDetail
        jobCard={jobCard}
        technicians={activeTechnicians.map((t: any) => ({ id: t.id, name: t.name }))}
        bays={activeBays.map((b: any) => ({ id: b.id, name: b.name, bayType: b.bayType }))}
        spareParts={spareParts.map((p: any) => ({ id: p.id, name: p.name, sku: p.sku, price: p.price, stock: p.stock, reservedQty: p.reservedQty }))}
        permissions={session.user.permissions}
      />
    </div>
  );
}
