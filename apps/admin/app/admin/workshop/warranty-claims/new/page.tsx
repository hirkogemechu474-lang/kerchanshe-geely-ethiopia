import { requirePermission } from '@/lib/auth/middleware';
import { serverApiClient } from '@/lib/serverApiClient';
import { PageHeader } from '@/components/admin/ui';
import WarrantyClaimNewForm from '@/components/admin/workshop/WarrantyClaimNewForm';

export default async function NewWarrantyClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ jobCardId?: string }>;
}) {
  await requirePermission('canManageJobCards');
  const { jobCardId } = await searchParams;

  let jobCard: any = null;
  if (jobCardId) {
    const client = await serverApiClient();
    try {
      const res = await client.get(`/admin/workshop/job-cards/${jobCardId}`);
      jobCard = res.data.jobCard;
    } catch {
      jobCard = null;
    }
  }

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
            warrantyEndDate: jobCard.warrantyEndDate || null,
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
