import { requirePermission } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/admin/ui';
import WarrantyClaimNewForm from '@/components/admin/workshop/WarrantyClaimNewForm';

export default async function NewWarrantyClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ jobCardId?: string }>;
}) {
  await requirePermission('canManageJobCards');
  const { jobCardId } = await searchParams;

  const jobCard = jobCardId
    ? await prisma.jobCard.findUnique({
        where: { id: jobCardId },
        select: { id: true, jobCardNo: true, plateNo: true, customerName: true, warrantyEndDate: true },
      })
    : null;

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Submit Warranty Claim" description="Draft a claim from a job card (BRD UC-09)" />
      {jobCard ? (
        <WarrantyClaimNewForm
          jobCard={{
            id: jobCard.id,
            jobCardNo: jobCard.jobCardNo,
            plateNo: jobCard.plateNo,
            customerName: jobCard.customerName,
            warrantyEndDate: jobCard.warrantyEndDate?.toISOString() || null,
          }}
        />
      ) : (
        <p className="text-sm text-gray-500">
          Open the job card you want to claim against and use its "Submit Warranty Claim" button —
          a claim always starts from a specific job card.
        </p>
      )}
    </div>
  );
}
