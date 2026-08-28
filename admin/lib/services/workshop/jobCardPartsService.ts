import { prisma } from '@/lib/prisma';
import { jobCardRepository } from '@/repositories/jobCardRepository';
import { requestJobCardPart, issueJobCardPart, backorderJobCardPart, cancelJobCardPart, PartsIssueError } from '@/lib/services/workshop/partsIssue';

export type JobCardPartResult =
  | { ok: true; line: any }
  | { ok: false; httpStatus: number; error: string };

// FR-401/402 (UC-07): request a part against a job card. Reserves stock
// (SparePart.reservedQty) but does not touch on-hand stock — that happens at
// issue time via updatePartLine('issue').
export async function requestPart(
  jobCardId: string,
  input: { sparePartId: string; quantity: number; isWarranty?: boolean },
  requestedById: string
): Promise<JobCardPartResult> {
  if (!input.sparePartId || !input.quantity) {
    return { ok: false, httpStatus: 400, error: 'sparePartId and quantity are required' };
  }

  const jobCard = await jobCardRepository.findById(jobCardId);
  if (!jobCard) {
    return { ok: false, httpStatus: 404, error: 'Job card not found' };
  }

  try {
    const line = await prisma.$transaction((tx) =>
      requestJobCardPart(tx, {
        jobCardId,
        sparePartId: input.sparePartId,
        quantity: Number(input.quantity),
        isWarranty: Boolean(input.isWarranty),
        requestedById,
      })
    );
    return { ok: true, line };
  } catch (error) {
    if (error instanceof PartsIssueError) {
      return { ok: false, httpStatus: error.status, error: error.message };
    }
    console.error('Error requesting job card part:', error);
    return { ok: false, httpStatus: 500, error: 'Failed to request part' };
  }
}

// FR-401 (UC-07): issue (barcode scan), backorder, or cancel a requested
// part line.
export async function updatePartLine(lineId: string, action: 'issue' | 'backorder' | 'cancel', issuedById: string): Promise<JobCardPartResult> {
  try {
    const line = await prisma.$transaction((tx) => {
      switch (action) {
        case 'issue':
          return issueJobCardPart(tx, lineId, issuedById);
        case 'backorder':
          return backorderJobCardPart(tx, lineId);
        case 'cancel':
          return cancelJobCardPart(tx, lineId);
        default:
          throw new PartsIssueError('action must be one of: issue, backorder, cancel');
      }
    });
    return { ok: true, line };
  } catch (error) {
    if (error instanceof PartsIssueError) {
      return { ok: false, httpStatus: error.status, error: error.message };
    }
    console.error('Error updating job card part:', error);
    return { ok: false, httpStatus: 500, error: 'Failed to update part line' };
  }
}
