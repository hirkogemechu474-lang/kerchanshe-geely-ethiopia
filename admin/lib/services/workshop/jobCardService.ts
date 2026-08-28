import { jobCardRepository } from '@/repositories/jobCardRepository';
import { customerRepository } from '@/repositories/customerRepository';
import { serviceBayRepository } from '@/repositories/serviceBayRepository';
import { nextJobCardNo } from '@/lib/services/workshop/jobCardNumber';
import { findBayConflict } from '@/lib/services/workshop/bayConflict';
import { assertTransitionAllowed, JobCardTransitionError } from '@/lib/services/workshop/jobCardStateMachine';
import { sendJobCardMilestoneNotification } from '@/lib/services/workshop/customerNotifications';
import { sendCsiSurveyInvite } from '@/lib/services/workshop/csiSurvey';
import type { JobCardStatus } from '@prisma/client';

export async function listJobCards(filters: { status?: JobCardStatus | null; technicianId?: string | null; bayId?: string | null; date?: string | null }) {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.technicianId) where.technicianId = filters.technicianId;
  if (filters.bayId) where.bayId = filters.bayId;
  if (filters.date) {
    const dayStart = new Date(`${filters.date}T00:00:00`);
    const dayEnd = new Date(`${filters.date}T23:59:59.999`);
    where.openTs = { gte: dayStart, lte: dayEnd };
  }

  return jobCardRepository.findMany(where);
}

// Data source for the Bay Scheduling Board (BRD Screen 6): every active bay,
// plus the job cards scheduled against it for the given day.
export async function getBoard(date: string) {
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59.999`);

  const [bays, jobCards] = await Promise.all([
    serviceBayRepository.findActive(),
    jobCardRepository.findManyForBoard(dayStart, dayEnd),
  ]);

  return { date, bays, jobCards };
}

export type CreateJobCardResult =
  | { ok: true; jobCard: any }
  | { ok: false; httpStatus: 400 | 409 | 500; error: string };

export async function createJobCard(body: any, createdById: string): Promise<CreateJobCardResult> {
  const {
    plateNo,
    vin,
    vehicleModel,
    vehicleYear,
    mileage,
    customerName,
    customerPhone,
    customerEmail,
    complaintText,
    technicianId,
    bayId,
    scheduledStart,
    scheduledEnd,
    // Phase 6 — Customer/Vehicle ownership (BRD FR-501, UC-01, UC-04):
    customerVehicleId, // advisor confirmed a vehicle-lookup match
    saveAsNewVehicleRecord, // advisor chose to save this as a new record
    warrantyStartDate,
    warrantyEndDate,
  } = body;

  if (!plateNo || !customerName || !customerPhone || !complaintText) {
    return { ok: false, httpStatus: 400, error: 'plateNo, customerName, customerPhone, and complaintText are required' };
  }

  try {
    // Resolve vehicle-ownership linkage before creating the job card so its
    // warranty dates can be derived rather than trusted blindly from the
    // client. Two paths only — never an implicit background match, so the
    // advisor is always the one who decided this via the lookup UI.
    let resolvedCustomerVehicleId: string | null = null;
    let resolvedWarrantyStart = warrantyStartDate ? new Date(warrantyStartDate) : null;
    let resolvedWarrantyEnd = warrantyEndDate ? new Date(warrantyEndDate) : null;

    if (customerVehicleId) {
      const matched = await customerRepository.findVehicleById(customerVehicleId);
      if (!matched) {
        return { ok: false, httpStatus: 400, error: 'Selected vehicle record was not found' };
      }
      resolvedCustomerVehicleId = matched.id;
      resolvedWarrantyStart = matched.warrantyStartDate;
      resolvedWarrantyEnd = matched.warrantyEndDate;
    } else if (saveAsNewVehicleRecord) {
      // UC-01 dedupe rule: match an existing customer by phone before
      // creating a duplicate.
      let customer = await customerRepository.findByPhone(customerPhone);
      if (!customer) {
        customer = await customerRepository.create({ fullName: customerName, phone: customerPhone, email: customerEmail || null });
      }
      const newVehicle = await customerRepository.createVehicle({
        customer: { connect: { id: customer.id } },
        vin: vin || null,
        plateNo,
        model: vehicleModel || null,
        warrantyStartDate: resolvedWarrantyStart,
        warrantyEndDate: resolvedWarrantyEnd,
      });
      resolvedCustomerVehicleId = newVehicle.id;
    }

    // BR-008: a bay cannot be double-booked for overlapping time windows.
    if (bayId && scheduledStart && scheduledEnd) {
      const conflict = await findBayConflict(bayId, new Date(scheduledStart), new Date(scheduledEnd));
      if (conflict) {
        return { ok: false, httpStatus: 409, error: `Bay is already booked for ${conflict.jobCardNo} in this time window` };
      }
    }

    const jobCardNo = await nextJobCardNo();
    const initialStatus = bayId ? 'DRAFT_CHECKIN' : 'AWAITING_BAY';

    const jobCard = await jobCardRepository.create({
      jobCardNo,
      plateNo,
      vin: vin || null,
      vehicleModel: vehicleModel || null,
      vehicleYear: vehicleYear ? Number(vehicleYear) : null,
      mileage: mileage ? Number(mileage) : null,
      customerName,
      customerPhone,
      customerEmail: customerEmail || null,
      complaintText,
      customerVehicle: resolvedCustomerVehicleId ? { connect: { id: resolvedCustomerVehicleId } } : undefined,
      warrantyStartDate: resolvedWarrantyStart,
      warrantyEndDate: resolvedWarrantyEnd,
      technician: technicianId ? { connect: { id: technicianId } } : undefined,
      bay: bayId ? { connect: { id: bayId } } : undefined,
      scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
      scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
      status: initialStatus,
      statusHistory: {
        create: { fromStatus: null, toStatus: initialStatus, changedById: createdById },
      },
    });

    if (bayId) {
      await serviceBayRepository.update(bayId, { status: 'OCCUPIED' });
    }

    return { ok: true, jobCard };
  } catch (error) {
    console.error('Error creating job card:', error);
    return { ok: false, httpStatus: 500, error: 'Failed to create job card' };
  }
}

export async function getJobCardDetail(id: string) {
  return jobCardRepository.findByIdWithDetail(id);
}

// Field-level edits only (complaint/diagnosis/estimate/approval/warranty flag).
// Status transitions go through transitionJobCardStatus; technician+bay
// assignment through assignJobCard.
export async function updateJobCardFields(id: string, body: any) {
  const {
    complaintText,
    diagnosisNotes,
    estimateAmount,
    isWarrantyOrGoodwill,
    approve,
    invoiceAmount,
    warrantyStartDate,
    warrantyEndDate,
  } = body;

  return jobCardRepository.update(id, {
    ...(complaintText !== undefined && { complaintText }),
    ...(diagnosisNotes !== undefined && { diagnosisNotes }),
    ...(estimateAmount !== undefined && { estimateAmount: estimateAmount === null ? null : Number(estimateAmount) }),
    ...(isWarrantyOrGoodwill !== undefined && { isWarrantyOrGoodwill }),
    ...(approve === true && { customerApprovedAt: new Date() }),
    ...(invoiceAmount !== undefined && { invoiceAmount: invoiceAmount === null ? null : Number(invoiceAmount) }),
    ...(warrantyStartDate !== undefined && { warrantyStartDate: warrantyStartDate ? new Date(warrantyStartDate) : null }),
    ...(warrantyEndDate !== undefined && { warrantyEndDate: warrantyEndDate ? new Date(warrantyEndDate) : null }),
  });
}

export type TransitionJobCardStatusResult =
  | { ok: true; jobCard: any; notification: any; csiSurveyInvite: any }
  | { ok: false; httpStatus: 400 | 403 | 404 | 409; error: string };

export async function transitionJobCardStatus(
  id: string,
  toStatus: JobCardStatus,
  reasonCode: string | undefined,
  qcPassed: boolean | undefined,
  qcNotes: string | undefined,
  actingUserId: string,
  permissions: { canManageJobCards: boolean; canPerformQC: boolean }
): Promise<TransitionJobCardStatusResult> {
  const jobCard = await jobCardRepository.findById(id);
  if (!jobCard) {
    return { ok: false, httpStatus: 404, error: 'Job card not found' };
  }

  // Any transition OUT of Quality Control records the QC outcome (pass -> the
  // Invoiced/Closed branch, fail -> the In Progress rework branch), so it's
  // gated on the QC permission rather than the general job-card permission.
  const isQcOutcome = jobCard.status === 'QUALITY_CONTROL';
  const hasPermission = isQcOutcome ? permissions.canPerformQC : permissions.canManageJobCards;
  if (!hasPermission) {
    return { ok: false, httpStatus: 403, error: 'Forbidden' };
  }

  try {
    assertTransitionAllowed(jobCard.status, toStatus, {
      isWarrantyOrGoodwill: jobCard.isWarrantyOrGoodwill,
      customerApprovedAt: jobCard.customerApprovedAt,
      qcPassed: isQcOutcome ? (qcPassed ?? jobCard.qcPassed) : jobCard.qcPassed,
      complaintText: jobCard.complaintText,
    });
  } catch (err) {
    if (err instanceof JobCardTransitionError) {
      return { ok: false, httpStatus: 409, error: err.message };
    }
    throw err;
  }

  const freeBayId = (toStatus === 'INVOICED_CLOSED' || toStatus === 'CANCELLED') && jobCard.bayId ? jobCard.bayId : null;

  const updated = await jobCardRepository.transitionStatus(
    id,
    jobCard.status,
    {
      status: toStatus,
      ...(isQcOutcome && qcPassed !== undefined && { qcPassed, qcNotes: qcNotes || null, qcById: actingUserId }),
      ...(toStatus === 'INVOICED_CLOSED' && { closeTs: new Date() }),
      ...(toStatus === 'CANCELLED' && { closeTs: new Date() }),
    },
    { toStatus, changedById: actingUserId, reasonCode: reasonCode || null },
    freeBayId
  );

  // FR-601: fire the milestone notification outside the transaction so a
  // slow/misconfigured provider never blocks or rolls back the status
  // change itself. sendJobCardMilestoneNotification never throws.
  const notification = await sendJobCardMilestoneNotification(
    {
      customerEmail: jobCard.customerEmail,
      customerPhone: jobCard.customerPhone,
      customerName: jobCard.customerName,
      jobCardNo: jobCard.jobCardNo,
    },
    jobCard.status,
    toStatus
  );

  // FR-602/UC-16: the CSI survey invite is triggered automatically on
  // closure — never manually by staff — so it lives here, not on a separate
  // staff-facing action.
  const csiSurveyInvite =
    toStatus === 'INVOICED_CLOSED'
      ? await sendCsiSurveyInvite({
          id: jobCard.id,
          jobCardNo: jobCard.jobCardNo,
          customerEmail: jobCard.customerEmail,
          customerName: jobCard.customerName,
        })
      : null;

  return { ok: true, jobCard: updated, notification, csiSurveyInvite };
}

export type AssignJobCardResult =
  | { ok: true; jobCard: any }
  | { ok: false; httpStatus: 404 | 409; error: string };

export async function assignJobCard(
  id: string,
  input: { technicianId?: string | null; bayId?: string | null; scheduledStart?: string | null; scheduledEnd?: string | null }
): Promise<AssignJobCardResult> {
  const { technicianId, bayId, scheduledStart, scheduledEnd } = input;

  const jobCard = await jobCardRepository.findById(id);
  if (!jobCard) {
    return { ok: false, httpStatus: 404, error: 'Job card not found' };
  }

  const nextBayId = bayId === undefined ? jobCard.bayId : bayId;
  const nextStart = scheduledStart === undefined ? jobCard.scheduledStart : scheduledStart ? new Date(scheduledStart) : null;
  const nextEnd = scheduledEnd === undefined ? jobCard.scheduledEnd : scheduledEnd ? new Date(scheduledEnd) : null;

  // BR-008: reject an overlapping booking on the target bay.
  if (nextBayId && nextStart && nextEnd) {
    const conflict = await findBayConflict(nextBayId, nextStart, nextEnd, id);
    if (conflict) {
      return { ok: false, httpStatus: 409, error: `Bay is already booked for ${conflict.jobCardNo} in this time window` };
    }
  }

  const previousBayId = jobCard.bayId;

  const updated = await jobCardRepository.assignTechnicianBay(
    id,
    {
      ...(technicianId !== undefined && { technician: technicianId ? { connect: { id: technicianId } } : { disconnect: true } }),
      ...(bayId !== undefined && { bay: bayId ? { connect: { id: bayId } } : { disconnect: true } }),
      ...(scheduledStart !== undefined && { scheduledStart: nextStart }),
      ...(scheduledEnd !== undefined && { scheduledEnd: nextEnd }),
      // Reassigning off "awaiting a bay" now has a home for the vehicle.
      ...(jobCard.status === 'AWAITING_BAY' && bayId && { status: 'DRAFT_CHECKIN' }),
    },
    previousBayId,
    nextBayId
  );

  return { ok: true, jobCard: updated };
}
