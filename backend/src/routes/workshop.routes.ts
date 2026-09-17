import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';
import { resolveBiMonthRange, computeWorkshopBiMetrics, WorkshopBiMetrics } from '../services/workshop/biSummary.service';
import { jobCardPartsService } from '../services/workshop/jobCardParts.service';
import { jobCardRepository, userRepository } from '../repositories';
import { loyaltyService } from '../services/loyalty/loyalty.service';
import { generateServiceInvoicePdf } from '../services/pdf/serviceInvoice.pdf';
import { getCompanyInfo } from '../services/pdf/companyInfo';
import { dispatchNotification } from '../services/email/notifications.dispatch';
import { env } from '../config/env';

const router = Router();

// All workshop routes require admin session
router.use(requireAdminApiSession);

// GET /api/admin/workshop/dashboard (KPI summary)
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const [totalJobCards, activeJobCards, completedJobCards, pendingParts] = await Promise.all([
      prisma.jobCard.count(),
      prisma.jobCard.count({ where: { status: { notIn: ['INVOICED_CLOSED', 'CANCELLED'] } } }),
      prisma.jobCard.count({ where: { status: 'INVOICED_CLOSED' } }),
      prisma.jobCardPart.count({ where: { status: 'BACKORDERED' } }),
    ]);

    const revenue = await prisma.jobCard.aggregate({ _sum: { invoiceAmount: true }, where: { status: 'INVOICED_CLOSED' } });

    res.json({ totalJobCards, activeJobCards, completedJobCards, pendingParts, totalRevenue: revenue._sum?.invoiceAmount ?? 0 });
  } catch (error) {
    console.error('Workshop dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/workshop/board (bay scheduling board)
router.get('/board', async (req: Request, res: Response) => {
  try {
    const bays = await prisma.serviceBay.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const jobCards = await prisma.jobCard.findMany({
      where: { status: { notIn: ['INVOICED_CLOSED', 'CANCELLED'] } },
      include: { technician: true, bay: true },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = jobCards.map((jc) => ({
      id: jc.id,
      jobCardNo: jc.jobCardNo,
      customerName: jc.customerName,
      status: jc.status,
      bayId: jc.bayId,
      scheduledStart: jc.scheduledStart?.toISOString() ?? null,
      scheduledEnd: jc.scheduledEnd?.toISOString() ?? null,
      technician: jc.technician ? { id: jc.technician.id, name: jc.technician.name } : null,
      bay: jc.bay ? { id: jc.bay.id, name: jc.bay.name } : null,
    }));

    res.json({ bays, jobCards: mapped });
  } catch (error) {
    console.error('Workshop board error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/workshop/job-cards (list)
router.get('/job-cards', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { jobCardNo: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.jobCard.findMany({
        where,
        include: { technician: { select: { name: true } }, bay: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.jobCard.count({ where }),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('List job cards error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/workshop/job-cards (create)
router.post('/job-cards', async (req: Request, res: Response) => {
  try {
    // JobCard has no `createdById` column — this always threw an "Unknown
    // argument" error before reaching the database.
    const jobCard = await prisma.jobCard.create({ data: req.body });

    try {
      const notifyEmails: string[] = await userRepository.findWorkshopManagerEmails();
      // JobCard.technicianId is a Technician, not a User — Technician has no
      // email/login of its own (name/phone/skillLevel only, see
      // schema.prisma), so there's no inbox to notify directly. Still look
      // it up for the technician's name in the manager-facing notification.
      const technician = jobCard.technicianId
        ? await prisma.technician.findUnique({ where: { id: jobCard.technicianId } })
        : null;
      const uniqueEmails = [...new Set(notifyEmails)];
      await dispatchNotification({
        type: 'job_card_status',
        to: uniqueEmails,
        subject: `New Job Card Opened — ${jobCard.jobCardNo}`,
        data: {
          jobCardNo: jobCard.jobCardNo,
          customerName: jobCard.customerName,
          vehicleModel: jobCard.vehicleModel,
          ...(technician?.name && { technicianName: technician.name }),
        },
        ctas: [
          { label: 'View Job Card', url: `${env.urls.admin}/admin/workshop/job-cards/${jobCard.id}` },
        ],
      });
    } catch (notifyError: any) {
      console.error('[JOB CARD CREATED NOTIFICATION ERROR]', notifyError.message);
    }

    res.status(201).json(jobCard);
  } catch (error) {
    console.error('Create job card error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/workshop/job-cards/:id (detail)
router.get('/job-cards/:id', async (req: Request, res: Response) => {
  try {
    const jobCard = await prisma.jobCard.findUnique({
      where: { id: req.params.id },
      include: {
        technician: true,
        bay: true,
        statusHistory: { orderBy: { changedAt: 'asc' } },
        jobCardParts: { include: { sparePart: true }, orderBy: { requestedAt: 'asc' } },
        warrantyClaims: { orderBy: { createdAt: 'desc' } },
        customerVehicle: {
          include: {
            customer: { select: { fullName: true, phone: true } },
            jobCards: { select: { id: true }, orderBy: { openTs: 'desc' } },
          },
        },
      },
    });
    if (!jobCard) { res.status(404).json({ error: 'Job card not found' }); return; }
    res.json({ jobCard });
  } catch (error) {
    console.error('Get job card error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/workshop/job-cards/:id (update fields)
router.patch('/job-cards/:id', async (req: Request, res: Response) => {
  try {
    // The admin UI's "Record Customer Approval" button sends `{ approve:
    // true }` — `approve` isn't a real JobCard column (`customerApprovedAt`
    // is), so this always threw an "Unknown argument" error before reaching
    // the database.
    const { approve, ...rest } = req.body;
    const data = approve ? { ...rest, customerApprovedAt: new Date() } : rest;
    const jobCard = await prisma.jobCard.update({ where: { id: req.params.id }, data });
    res.json(jobCard);
  } catch (error) {
    console.error('Update job card error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/workshop/job-cards/:id/status (transition status)
router.patch('/job-cards/:id/status', async (req: Request, res: Response) => {
  try {
    // The admin UI (JobCardDetail.tsx) sends `toStatus` (plus, from the QC
    // panel, `qcPassed`/`qcNotes`) — this route used to destructure `status`
    // instead, which was always undefined, so Prisma silently skipped
    // setting it and every status transition through this UI was a no-op.
    // `status` is still accepted for any other caller using the old name.
    const { toStatus, status, qcPassed, qcNotes, reasonCode } = req.body;
    const nextStatus = toStatus || status;
    if (!nextStatus) { res.status(400).json({ error: 'toStatus is required' }); return; }

    const current = await prisma.jobCard.findUnique({ where: { id: req.params.id } });
    if (!current) { res.status(404).json({ error: 'Job card not found' }); return; }

    // Quality-check gate: qcPassed/qcNotes/qcById columns already existed
    // but nothing enforced or persisted them — a job card could reach
    // INVOICED_CLOSED with no QC sign-off recorded at all.
    if (nextStatus === 'INVOICED_CLOSED') {
      const willPass = qcPassed !== undefined ? qcPassed === true : current.qcPassed === true;
      if (!willPass) {
        res.status(400).json({ error: 'Record a passing quality check before closing/invoicing this job card.' });
        return;
      }
    }
    // RELEASED is the true "vehicle handed back to customer" step, gated on
    // payment — a job card previously had no status past INVOICED_CLOSED,
    // which conflated "invoiced" with "customer actually has the car back."
    if (nextStatus === 'RELEASED' && current.paymentStatus !== 'PAID') {
      res.status(400).json({ error: 'Confirm payment before releasing the vehicle to the customer.' });
      return;
    }

    const jobCardData: any = { status: nextStatus };
    if (qcPassed !== undefined) {
      jobCardData.qcPassed = qcPassed;
      jobCardData.qcNotes = qcNotes ?? null;
      jobCardData.qcById = req.adminSession!.user.id;
    }

    // Free the assigned bay once the job card leaves active work — the
    // Bay Scheduling Board otherwise shows the bay as permanently occupied.
    const terminalStatuses = ['INVOICED_CLOSED', 'RELEASED', 'CANCELLED'];
    const freeBayId = terminalStatuses.includes(nextStatus) ? current.bayId : null;

    const jobCard = await jobCardRepository.transitionStatus(
      req.params.id,
      current.status,
      jobCardData,
      { toStatus: nextStatus, changedById: req.adminSession!.user.id, reasonCode: reasonCode ?? null },
      freeBayId,
    );

    // Step 19: Notify service advisor on job card status change
    if (current.customerEmail) {
      try {
        const statusLabels: Record<string, string> = {
          DRAFT_CHECKIN: 'Draft Check-in', CHECKED_IN: 'Checked In', IN_PROGRESS: 'In Progress',
          QC_PENDING: 'QC Pending', QC_PASSED: 'QC Passed', READY_FOR_PICKUP: 'Ready for Pickup',
          INVOICED_CLOSED: 'Invoiced & Closed', RELEASED: 'Released', CANCELLED: 'Cancelled',
        };
        const notifyEmails: string[] = [current.customerEmail];
        // Technician (unlike a User) has no email/login of its own — see the
        // schema note on the /job-cards/:id/assign route above — so it can
        // only supply a name for context here, not another recipient.
        const technician = current.technicianId
          ? await prisma.technician.findUnique({ where: { id: current.technicianId } })
          : null;
        // Notify workshop/service managers
        const workshopManagerEmails = await userRepository.findWorkshopManagerEmails();
        notifyEmails.push(...workshopManagerEmails);
        const uniqueEmails = [...new Set(notifyEmails)];
        await dispatchNotification({
          type: 'job_card_status',
          to: uniqueEmails,
          subject: `Service Update — ${current.jobCardNo}`,
          data: {
            jobCardNo: current.jobCardNo,
            customerName: current.customerName,
            vehicleModel: current.vehicleModel,
            status: statusLabels[nextStatus] || nextStatus,
            ...(technician?.name && { technicianName: technician.name }),
          },
          ctas: [
            { label: 'View Job Card', url: `${env.urls.admin}/admin/workshop/job-cards/${current.id}` },
          ],
        });
      } catch (statusNotifyError: any) {
        console.error('[JOB CARD STATUS NOTIFICATION ERROR]', statusNotifyError.message);
      }
    }

    if (nextStatus === 'RELEASED') {
      try {
        await loyaltyService.earnPoints({
          customerPhone: current.customerPhone,
          customerName: current.customerName,
          amount: current.invoiceAmount ?? 0,
          reason: `Service visit — ${current.jobCardNo}`,
          sourceType: 'JOB_CARD',
          sourceId: current.id,
        });
      } catch (loyaltyError: any) {
        console.error('[AUTO LOYALTY EARN ERROR]', loyaltyError.message);
      }
      // Send feedback/survey request after vehicle release
      if (current.customerEmail) {
        try {
          const surveyLink = `${env.urls.site}/csi-survey/${current.id}`;
          await dispatchNotification({
            type: 'job_card_status',
            to: [current.customerEmail],
            subject: `How Was Your Service Experience? — ${current.jobCardNo}`,
            data: { jobCardNo: current.jobCardNo, customerName: current.customerName, vehicleModel: current.vehicleModel },
            ctas: [
              { label: 'Share Feedback', url: surveyLink },
              { label: 'Book Next Service', url: `${env.urls.site}/service` },
            ],
          });
        } catch (surveyError: any) {
          console.error('[FEEDBACK REQUEST ERROR]', surveyError.message);
        }
      }
    }

    res.json(jobCard);
  } catch (error) {
    console.error('Update job card status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/workshop/job-cards/:id/assign (assign tech/bay/schedule)
router.patch('/job-cards/:id/assign', async (req: Request, res: Response) => {
  try {
    const { technicianId, bayId, scheduledStart, scheduledEnd } = req.body;
    const jobCard = await prisma.jobCard.update({
      where: { id: req.params.id },
      data: { technicianId, bayId, scheduledStart, scheduledEnd },
    });

    if (technicianId) {
      try {
        // Technician (unlike a User) has no email/login of its own — there's
        // no inbox to notify the technician directly, so this tells the
        // workshop managers who a job card was just assigned to instead.
        const tech = await prisma.technician.findUnique({ where: { id: technicianId } });
        const notifyEmails = await userRepository.findWorkshopManagerEmails();
        if (notifyEmails.length > 0) {
          await dispatchNotification({
            type: 'job_card_status',
            to: [...new Set(notifyEmails)],
            subject: `Job Card Assigned — ${jobCard.jobCardNo}`,
            data: {
              jobCardNo: jobCard.jobCardNo,
              customerName: jobCard.customerName,
              vehicleModel: jobCard.vehicleModel,
              ...(tech?.name && { technicianName: tech.name }),
              ...(jobCard.bayId && { bay: jobCard.bayId }),
              ...(jobCard.scheduledStart && { scheduledStart: jobCard.scheduledStart.toISOString() }),
            },
            ctas: [
              { label: 'View Job Card', url: `${env.urls.admin}/admin/workshop/job-cards/${jobCard.id}` },
            ],
          });
        }
      } catch (notifyError: any) {
        console.error('[JOB CARD ASSIGNMENT NOTIFICATION ERROR]', notifyError.message);
      }
    }

    res.json(jobCard);
  } catch (error) {
    console.error('Assign job card error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/workshop/job-cards/:id/parts (request part)
router.post('/job-cards/:id/parts', async (req: Request, res: Response) => {
  try {
    const { sparePartId, quantity, isWarranty } = req.body;
    if (!sparePartId || !quantity) { res.status(400).json({ error: 'sparePartId and quantity are required' }); return; }

    const sparePart = await prisma.sparePart.findUnique({ where: { id: sparePartId } });
    if (!sparePart) { res.status(404).json({ error: 'Spare part not found' }); return; }

    // unitPrice/requestedById are required, non-null columns — the admin
    // form only ever sent sparePartId/quantity/isWarranty, so this create
    // always threw a Prisma validation error before reaching the database.
    // unitPrice is a snapshot of the current price, looked up server-side
    // rather than trusted from the client.
    const part = await prisma.jobCardPart.create({
      data: {
        jobCardId: req.params.id,
        sparePartId,
        quantity,
        unitPrice: sparePart.price,
        isWarranty: Boolean(isWarranty),
        requestedById: req.adminSession!.user.id,
      },
    });
    res.status(201).json(part);
  } catch (error) {
    console.error('Request part error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/workshop/job-cards/:id/parts/:lineId (issue/backorder/cancel part)
router.patch('/job-cards/:id/parts/:lineId', async (req: Request, res: Response) => {
  try {
    // The admin UI (JobCardDetail.tsx) sends `action: 'issue'|'backorder'|
    // 'cancel'` — this route used to read `status` instead, which was
    // always undefined, so Prisma silently skipped the update and these
    // buttons never actually changed a part's status. `status` (a real
    // JobCardPartStatus value) is still accepted directly for other callers.
    const ACTION_TO_STATUS: Record<string, string> = { issue: 'ISSUED', backorder: 'BACKORDERED', cancel: 'CANCELLED' };
    const status = req.body.status || ACTION_TO_STATUS[req.body.action];
    if (!status) { res.status(400).json({ error: 'A valid action or status is required' }); return; }
    // Issuing a part actually decrements SparePart.stock (transactionally,
    // via jobCardPartsService.issuePart) — a plain status update here used
    // to silently leave inventory untouched.
    if (status === 'ISSUED') {
      const result = await jobCardPartsService.issuePart(req.params.lineId, req.adminSession!.user.id);
      if (!result.ok) { res.status(400).json({ error: result.error }); return; }
      res.json(result.data);
      return;
    }
    const part = await prisma.jobCardPart.update({ where: { id: req.params.lineId }, data: { status } });
    res.json(part);
  } catch (error) {
    console.error('Update part status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/workshop/job-cards/:id/invoice (generate service invoice: parts + labor)
router.post('/job-cards/:id/invoice', async (req: Request, res: Response) => {
  try {
    const jobCard = await prisma.jobCard.findUnique({
      where: { id: req.params.id },
      include: { jobCardParts: { include: { sparePart: true } } },
    });
    if (!jobCard) { res.status(404).json({ error: 'Job card not found' }); return; }
    if (jobCard.invoiceNo) { res.status(400).json({ error: 'Invoice already exists' }); return; }

    const { laborAmount } = req.body ?? {};
    const issuedParts = jobCard.jobCardParts.filter((p) => p.status === 'ISSUED');
    const partsAmount = issuedParts.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);
    const laborTotal = typeof laborAmount === 'number' ? laborAmount : (jobCard.laborAmount ?? 0);
    const invoiceAmount = partsAmount + laborTotal;
    const invoiceNo = `SINV-${jobCard.jobCardNo}`;

    const updated = await prisma.jobCard.update({
      where: { id: req.params.id },
      data: { invoiceNo, laborAmount: laborTotal, invoiceAmount, paymentStatus: 'UNPAID' },
    });

    let notificationSent = false;
    let notificationError: string | undefined;
    if (jobCard.customerEmail) {
      try {
        const company = await getCompanyInfo();
        const pdfBuffer = await generateServiceInvoicePdf(
          {
            jobCardNo: jobCard.jobCardNo,
            invoiceNo,
            customerName: jobCard.customerName,
            customerPhone: jobCard.customerPhone,
            vehicleModel: jobCard.vehicleModel,
            vin: jobCard.vin,
            plateNo: jobCard.plateNo,
            complaintText: jobCard.complaintText,
            parts: issuedParts.map((p) => ({ name: p.sparePart.name, quantity: p.quantity, unitPrice: p.unitPrice })),
            partsAmount,
            laborAmount: laborTotal,
            invoiceAmount,
            invoiceDate: new Date(),
          },
          company,
        );
        const result = await dispatchNotification({
          type: 'job_card_status',
          to: [jobCard.customerEmail],
          subject: `Service Invoice — ${jobCard.jobCardNo}`,
          data: { jobCardNo: jobCard.jobCardNo, invoiceNo, invoiceAmount, customerName: jobCard.customerName },
          attachments: [{ filename: `${invoiceNo}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }],
        });
        notificationSent = result.ok;
        notificationError = result.error;
      } catch (pdfError: any) {
        console.error('[SERVICE INVOICE PDF ERROR]', pdfError.message);
        notificationError = 'Failed to generate/send invoice PDF';
      }
    }

    res.status(201).json({ ...updated, notificationSent, notificationError });
  } catch (error) {
    console.error('Generate service invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/workshop/job-cards/:id/payment (record/confirm service payment)
router.post('/job-cards/:id/payment', async (req: Request, res: Response) => {
  try {
    const jobCard = await prisma.jobCard.findUnique({ where: { id: req.params.id } });
    if (!jobCard) { res.status(404).json({ error: 'Job card not found' }); return; }
    if (!jobCard.invoiceNo) { res.status(400).json({ error: 'Generate the service invoice before recording payment.' }); return; }

    const updated = await prisma.jobCard.update({
      where: { id: req.params.id },
      data: { paymentStatus: 'PAID', paidAt: new Date() },
    });

    try {
      const notifyEmails: string[] = [];
      if (jobCard.customerEmail) notifyEmails.push(jobCard.customerEmail);
      notifyEmails.push(...(await userRepository.findWorkshopManagerEmails()));
      const uniqueEmails = [...new Set(notifyEmails)];
      await dispatchNotification({
        type: 'job_card_status',
        to: uniqueEmails,
        subject: `Payment Received — ${jobCard.jobCardNo}`,
        data: {
          jobCardNo: jobCard.jobCardNo,
          customerName: jobCard.customerName,
          invoiceAmount: jobCard.invoiceAmount,
        },
      });
    } catch (notifyError: any) {
      console.error('[JOB CARD PAYMENT NOTIFICATION ERROR]', notifyError.message);
    }

    res.json(updated);
  } catch (error) {
    console.error('Record service payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/workshop/bays (list)
router.get('/bays', async (req: Request, res: Response) => {
  try {
    const bays = await prisma.serviceBay.findMany({ orderBy: { name: 'asc' } });
    res.json(bays);
  } catch (error) {
    console.error('List bays error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/workshop/bays (create)
router.post('/bays', async (req: Request, res: Response) => {
  try {
    const bay = await prisma.serviceBay.create({ data: req.body });
    res.status(201).json({ bay });
  } catch (error) {
    console.error('Create bay error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/workshop/bays/:id (update)
router.patch('/bays/:id', async (req: Request, res: Response) => {
  try {
    const bay = await prisma.serviceBay.update({ where: { id: req.params.id }, data: req.body });
    res.json({ bay });
  } catch (error) {
    console.error('Update bay error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/workshop/bays/:id (deactivate)
router.delete('/bays/:id', async (req: Request, res: Response) => {
  try {
    await prisma.serviceBay.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete bay error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/workshop/technicians (list)
router.get('/technicians', async (req: Request, res: Response) => {
  try {
    const technicians = await prisma.technician.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { jobCards: true } } },
    });
    res.json(technicians);
  } catch (error) {
    console.error('List technicians error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/workshop/technicians (create)
router.post('/technicians', async (req: Request, res: Response) => {
  try {
    const technician = await prisma.technician.create({ data: req.body });
    res.status(201).json({ technician });
  } catch (error) {
    console.error('Create technician error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/workshop/technicians/:id (update)
router.patch('/technicians/:id', async (req: Request, res: Response) => {
  try {
    const technician = await prisma.technician.update({ where: { id: req.params.id }, data: req.body });
    res.json({ technician });
  } catch (error) {
    console.error('Update technician error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/workshop/technicians/:id (deactivate)
router.delete('/technicians/:id', async (req: Request, res: Response) => {
  try {
    await prisma.technician.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete technician error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/workshop/warranty-claims (list)
router.get('/warranty-claims', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const [items, total] = await Promise.all([
      prisma.warrantyClaim.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { jobCard: { select: { jobCardNo: true, plateNo: true, customerName: true } } },
      }),
      prisma.warrantyClaim.count(),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('List warranty claims error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/workshop/warranty-claims (create)
router.post('/warranty-claims', async (req: Request, res: Response) => {
  try {
    const claim = await prisma.warrantyClaim.create({ data: req.body });

    try {
      const jobCard = await prisma.jobCard.findUnique({
        where: { id: claim.jobCardId },
        select: { jobCardNo: true, customerName: true, vehicleModel: true },
      });
      const notifyEmails = await userRepository.findWorkshopManagerEmails();
      await dispatchNotification({
        type: 'warranty_claim',
        to: [...new Set(notifyEmails)],
        subject: `New Warranty Claim Drafted — ${claim.claimNo}`,
        data: {
          claimNo: claim.claimNo,
          defectCode: claim.defectCode,
          ...(jobCard?.customerName && { customerName: jobCard.customerName }),
          ...(jobCard?.vehicleModel && { vehicleModel: jobCard.vehicleModel }),
        },
        ctas: [
          { label: 'Review Claim', url: `${env.urls.admin}/admin/workshop/warranty-claims/${claim.id}` },
        ],
      });
    } catch (notifyError: any) {
      console.error('[WARRANTY CLAIM CREATED NOTIFICATION ERROR]', notifyError.message);
    }

    res.status(201).json(claim);
  } catch (error) {
    console.error('Create warranty claim error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/workshop/warranty-claims/:id (detail)
router.get('/warranty-claims/:id', async (req: Request, res: Response) => {
  try {
    const claim = await prisma.warrantyClaim.findUnique({
      where: { id: req.params.id },
      include: { jobCard: true, statusHistory: { orderBy: { changedAt: 'asc' } } },
    });
    if (!claim) { res.status(404).json({ error: 'Warranty claim not found' }); return; }
    res.json({ claim });
  } catch (error) {
    console.error('Get warranty claim error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/workshop/warranty-claims/:id (update)
router.patch('/warranty-claims/:id', async (req: Request, res: Response) => {
  try {
    const claim = await prisma.warrantyClaim.update({ where: { id: req.params.id }, data: req.body });
    res.json(claim);
  } catch (error) {
    console.error('Update warranty claim error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/workshop/warranty-claims/:id/status (transition status)
router.patch('/warranty-claims/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const claim = await prisma.warrantyClaim.update({ where: { id: req.params.id }, data: { status } });
    res.json(claim);
  } catch (error) {
    console.error('Update warranty claim status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/workshop/vehicle-lookup (lookup by VIN/plate)
router.get('/vehicle-lookup', async (req: Request, res: Response) => {
  try {
    const { vin, plate } = req.query;
    if (!vin && !plate) {
      res.status(400).json({ error: 'vin or plate query parameter is required' });
      return;
    }

    const where: any = {};
    if (vin) where.vin = { equals: vin as string, mode: 'insensitive' };
    if (plate) where.plateNo = { equals: plate as string, mode: 'insensitive' };

    const vehicle = await prisma.customerVehicle.findFirst({
      where,
      include: {
        customer: { select: { fullName: true, phone: true, email: true } },
        jobCards: { select: { id: true, jobCardNo: true, status: true, openTs: true }, orderBy: { openTs: 'desc' } },
      },
    });
    if (!vehicle) { res.status(404).json({ error: 'Vehicle not found' }); return; }
    res.json(vehicle);
  } catch (error) {
    console.error('Vehicle lookup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/workshop/parts/reorder-alerts (low stock alerts)
router.get('/parts/reorder-alerts', async (req: Request, res: Response) => {
  try {
    // Prisma can't compare two columns of the same row in a `where` filter,
    // so fetch active parts and filter stock <= reorderPoint in JS (same
    // pattern as vehicles.routes.ts's /stats route).
    const parts = await prisma.sparePart.findMany({ where: { isActive: true } });
    const lowStock = parts.filter((part) => part.stock <= part.reorderPoint);
    res.json(lowStock);
  } catch (error) {
    console.error('Parts reorder alerts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Renders the same BI payload as a flat "metric,value" CSV. Kept working for
// any callers still hitting ?format=csv, but the branded export system now
// handles the primary export path — this is just a fallback, not the main UI.
function buildWorkshopBiCsv(payload: {
  period: { label: string };
  kpis: WorkshopBiMetrics['kpis'];
  revenue: WorkshopBiMetrics['revenue'];
  csi: WorkshopBiMetrics['csi'];
}): string {
  const rows: [string, string | number][] = [
    ['Period', payload.period.label],
    ['Jobs Closed', payload.kpis.jobsClosedCount],
    ['First-Time-Fix Rate (%)', payload.kpis.firstTimeFixRate ?? ''],
    ['Avg Turnaround (hours)', payload.kpis.avgTurnaroundHours ?? ''],
    ['Avg Warranty Turnaround (days)', payload.kpis.avgWarrantyTurnaroundDays ?? ''],
    ['Claims Resolved', payload.kpis.claimsResolved],
    ['Claims Approved', payload.kpis.claimsApproved],
    ['Claims Rejected', payload.kpis.claimsRejected],
    ['Revenue - Standard', payload.revenue.standard],
    ['Revenue - Warranty/Goodwill', payload.revenue.warrantyGoodwill],
    ['Revenue - Total', payload.revenue.total],
    ['CSI Average Rating', payload.csi.available ? payload.csi.averageRating : ''],
    ['CSI Response Count', payload.csi.available ? payload.csi.responseCount : 0],
  ];
  return ['Metric,Value', ...rows.map(([k, v]) => `${k},${v}`)].join('\n');
}

// GET /api/admin/workshop/bi-dashboard (monthly BI dashboard — KPI derivations live in biSummary.service.ts)
// requirePermission here too (not just the Next.js page) — this Express
// route had only been session-gated, so any authenticated staff member could
// hit it directly regardless of the page-level manager-only restriction.
router.get('/bi-dashboard', requirePermission('canViewExecutiveDashboards'), async (req: Request, res: Response) => {
  try {
    const { start, end, monthValue, label } = resolveBiMonthRange(req.query.month as string | undefined);
    const metrics = await computeWorkshopBiMetrics(start, end);

    const payload = {
      period: { from: start.toISOString(), to: new Date(end.getTime() - 1).toISOString(), label, monthValue },
      kpis: metrics.kpis,
      revenue: metrics.revenue,
      csi: metrics.csi,
      generatedAt: new Date().toISOString(),
    };

    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="workshop-bi-${monthValue}.csv"`);
      res.send(buildWorkshopBiCsv(payload));
      return;
    }

    res.json(payload);
  } catch (error) {
    console.error('BI dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/workshop/bi-dashboard/trend (last N months, oldest first — same
// per-month derivations as /bi-dashboard via computeWorkshopBiMetrics)
router.get('/bi-dashboard/trend', requirePermission('canViewExecutiveDashboards'), async (req: Request, res: Response) => {
  try {
    const months = Math.max(1, Math.min(24, parseInt(req.query.months as string) || 6));
    const now = new Date();
    const monthValues = Array.from({ length: months }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

    const trend = await Promise.all(monthValues.map(async (monthValue) => {
      const { start, end, label } = resolveBiMonthRange(monthValue);
      const metrics = await computeWorkshopBiMetrics(start, end);
      return {
        monthValue,
        label,
        jobsClosedCount: metrics.kpis.jobsClosedCount,
        firstTimeFixRate: metrics.kpis.firstTimeFixRate,
        avgTurnaroundHours: metrics.kpis.avgTurnaroundHours,
        revenueTotal: metrics.revenue.total,
        csiAverage: metrics.csi.available ? metrics.csi.averageRating : null,
      };
    }));

    res.json({ trend });
  } catch (error) {
    console.error('BI trend error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as workshopRoutes };
