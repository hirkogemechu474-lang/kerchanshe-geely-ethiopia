import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';
import { orderService } from '../services/sales/order.service';
import { vehicleAllocationService } from '../services/sales/vehicleAllocation.service';
import { orderAgreementService } from '../services/sales/orderAgreement.service';
import { orderHandoverService } from '../services/sales/orderHandover.service';
import { orderInvoiceService } from '../services/sales/orderInvoice.service';
import { dispatchNotification } from '../services/email/notifications.dispatch';
import { generateSalesAgreementPdf } from '../services/pdf/salesAgreement.pdf';
import { getCompanyInfo } from '../services/pdf/companyInfo';
import { vehicleRepository, userRepository, documentSignatureRepository, salesOrderRepository } from '../repositories';
import { signLinkToken } from '../utils/secureLink';
import { generateReference, REFERENCE_CATEGORY } from '../utils/reference';
import { validateTin } from '../utils/idValidation';
import { env } from '../config/env';
import { rateLimiters } from '../utils/rateLimit';
import { auditService } from '../services/audit/audit.service';

const router = Router();

const VALID_FINANCING_STATUSES = [
  'NOT_REQUESTED', 'REQUESTED', 'DOCUMENTS_PENDING', 'DOCUMENTS_SUBMITTED',
  'UNDER_REVIEW', 'APPROVED', 'CONDITIONALLY_APPROVED', 'REJECTED',
  'CUSTOMER_DECLINED', 'DISBURSED', 'COMPLETED', 'CANCELLED',
];

// GET /api/orders (admin list)
router.get('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;
    // "direct" = orders placed straight from the public /purchases flow
    // (see public.routes.ts POST /purchases), as opposed to orders created
    // by staff converting a Quotation. quotationId is only ever set on the
    // latter (see admin/app/api/admin/quotations/[id]/convert-to-order),
    // so it doubles as the discriminator — there's no separate `source`
    // column on SalesOrder. Used by the admin "Purchases" screen.
    const direct = req.query.direct as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { orderNo: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (direct === 'true') where.quotationId = null;

    const result = await orderService.list({ where, page, pageSize });
    if (!result.ok) { res.status(500).json({ error: result.error }); return; }

    const counts: Record<string, number> = {};
    for (const row of (result.data.statusCounts as Array<{ status: string; _count: number }>)) {
      counts[row.status] = row._count;
    }
    const stats = {
      total: result.data.total,
      booked: counts['BOOKED'] || 0,
      readyForDelivery: counts['READY_FOR_DELIVERY'] || 0,
      delivered: counts['DELIVERED'] || 0,
    };

    const orders = (result.data.orders as any[]).map((order) => {
      const pdiTotal = order.pdiItems?.length || 0;
      const pdiChecked = order.pdiItems?.filter((p: any) => p.isChecked).length || 0;
      return {
        ...order,
        pdiComplete: pdiTotal > 0 && pdiChecked === pdiTotal,
        // The checklist is only seeded once a vehicle is allocated (see
        // vehicleAllocationService.lockAllocation), so pdiTotal === 0 means
        // "not started yet", not "0 of 0 done".
        pdiProgress: pdiTotal > 0 ? `${pdiChecked}/${pdiTotal}` : 'Not started',
      };
    });

    res.json({
      orders, stats, total: result.data.total, page: result.data.page,
      pageSize: result.data.pageSize, totalPages: result.data.totalPages,
    });
  } catch (error) {
    console.error('List orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders (admin create)
router.post('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    // PDI checklist is seeded once a vehicle is actually allocated (see
    // vehicleAllocationService.lockAllocation), not at creation — no vehicle
    // is necessarily chosen yet at this point.
    const order = await prisma.salesOrder.create({ data: req.body });
    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:id (admin detail)
router.get('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id: req.params.id },
      include: {
        pdiItems: { orderBy: { createdAt: 'asc' } },
        statusHistory: { orderBy: { changedAt: 'asc' } },
        quotation: { select: { id: true } },
        testDrives: { orderBy: { createdAt: 'desc' } },
        vehicleAllocation: { include: { vehicle: { select: { id: true, name: true, model: true, stock: true } } } },
      },
    });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fields that feed the rendered Sales Agreement PDF (see buildAgreementPdfData
// in orderAgreement.service.ts) — locked once the manager has countersigned,
// since the agreement renders live from these fields and a post-execution
// edit would silently change what the "fully executed" document shows.
const AGREEMENT_LOCKED_FIELDS = new Set([
  'totalPrice', 'salesType', 'vehicleType', 'motorBatterySerialNo', 'accessoriesDescription',
  'proformaInvoiceNo', 'proformaInvoiceDate', 'vatAmount', 'registrationCharge', 'accessoriesAmount',
  'purchaserTitle', 'purchaserTin', 'purchaserAddress', 'purchaserAuthorizedRep', 'depositAmount', 'depositDueDate',
  'otherPaymentAmount', 'otherPaymentNote', 'otherPaymentDueDate', 'estimatedDeliveryDate',
  'deliveryLocation', 'exteriorColor', 'interiorColor', 'customerName', 'customerPhone',
  'customerEmail', 'vehicleModel', 'configurationJson',
]);

// PATCH /api/orders/:id (admin update fields)
router.patch('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { totalPrice, commissionRate, purchaserTin } = req.body;
    if (totalPrice != null && (typeof totalPrice !== 'number' || !Number.isFinite(totalPrice) || totalPrice < 0)) {
      res.status(400).json({ error: 'Total price must be a positive number.' });
      return;
    }
    if (commissionRate != null && (typeof commissionRate !== 'number' || !Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100)) {
      res.status(400).json({ error: 'Commission rate must be a number between 0 and 100.' });
      return;
    }
    const tinError = validateTin(purchaserTin);
    if (tinError) { res.status(400).json({ error: tinError }); return; }

    const existing = await prisma.salesOrder.findUnique({ where: { id: req.params.id }, select: { countersignedAt: true, registeredAt: true } });
    if (!existing) { res.status(404).json({ error: 'Order not found' }); return; }
    if (existing.countersignedAt) {
      const touchesLockedField = Object.keys(req.body).some((key) => AGREEMENT_LOCKED_FIELDS.has(key));
      if (touchesLockedField) {
        res.status(423).json({ error: 'The sales agreement has been fully executed and its terms are locked. A correction requires a new version.' });
        return;
      }
    }

    const data: Record<string, unknown> = { ...req.body };

    // Coerce numeric fields that arrive as strings from form inputs
    const numericFields = [
      'totalPrice', 'commissionRate', 'vatAmount', 'registrationCharge',
      'accessoriesAmount', 'depositAmount', 'otherPaymentAmount',
      'commissionAmount', 'commissionSplitPercent', 'odometerAtDelivery',
    ];
    for (const field of numericFields) {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        const num = Number(data[field]);
        data[field] = Number.isFinite(num) ? num : null;
      } else if (data[field] === '') {
        data[field] = null;
      }
    }

    // Coerce date fields that arrive as "YYYY-MM-DD" strings
    const dateFields = [
      'proformaInvoiceDate', 'depositDueDate', 'otherPaymentDueDate',
      'estimatedDeliveryDate', 'approvedAt', 'agreementSentAt', 'signedAt',
      'countersignedAt', 'rejectedAt', 'orderDate', 'deliveredAt',
      'handoverExpectedCompletionDate',
    ];
    for (const field of dateFields) {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        const d = new Date(data[field] as string);
        data[field] = isNaN(d.getTime()) ? null : d;
      } else if (data[field] === '') {
        data[field] = null;
      }
    }

    // Saving a registration number is what "records the vehicle registration"
    // for the DELIVERED gate in getTransitionBlockReason — that gate checks
    // registeredAt, which this route never set on its own, so a recorded
    // number never actually cleared the gate. Stamp it (once) the first time
    // a non-empty number is saved, and clear it if the number is removed.
    if (Object.prototype.hasOwnProperty.call(data, 'registrationNumber')) {
      if (data.registrationNumber) {
        if (!existing.registeredAt) {
          data.registeredAt = new Date();
          data.registeredById = req.adminSession!.user.id;
        }
      } else {
        data.registeredAt = null;
        data.registeredById = null;
      }
    }

    // Proforma invoice no. is optional on the agreement form — leave it
    // blank (see the input's placeholder) and saving stamps a GY-PI-...
    // reference automatically, same numbering scheme as quotationNo/
    // deliveryNoteNo via generateReference().
    if (Object.prototype.hasOwnProperty.call(data, 'proformaInvoiceNo') && !data.proformaInvoiceNo) {
      data.proformaInvoiceNo = await generateReference(REFERENCE_CATEGORY.PROFORMA);
    }

    const order = await prisma.salesOrder.update({ where: { id: req.params.id }, data });
    res.json(order);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/delivery-hold ({ hold: boolean, reason?: string }) —
// manager "Approve Delivery"/"Hold Delivery" gate, distinct from the generic
// status PATCH: a manager can hold a READY_FOR_DELIVERY-eligible order back
// even once every other gate (PDI/agreement/payment/allocation) is clear.
router.post('/:id/delivery-hold', requireAdminApiSession, requirePermission('canCountersignAgreements'), async (req: Request, res: Response) => {
  try {
    const { hold, reason } = req.body ?? {};
    if (hold && !reason) { res.status(400).json({ error: 'A reason is required to hold delivery.' }); return; }
    const order = await prisma.salesOrder.update({
      where: { id: req.params.id },
      data: { deliveryHold: Boolean(hold), deliveryHoldReason: hold ? reason : null },
    });
    await auditService.log({
      entityType: 'order',
      entityId: order.id,
      action: hold ? 'delivery_held' : 'delivery_hold_released',
      performedById: req.adminSession!.user.id,
      reason: hold ? reason : undefined,
    });
    res.json(order);
  } catch (error) {
    console.error('Delivery hold error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/orders/:id/status (transition order status with commission tracking)
router.patch('/:id/status', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { toStatus } = req.body;
    if (!toStatus) { res.status(400).json({ error: 'toStatus is required' }); return; }
    const result = await orderService.transitionWithCommission(req.params.id, toStatus, req.adminSession!.user.id);
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    res.json(result.data);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/approve (sales agent approval)
router.post('/:id/approve', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Order not found' }); return; }
    if (existing.salesAgentId && req.adminSession!.user.role === 'sales' && existing.salesAgentId !== req.adminSession!.user.id) {
      res.status(403).json({ error: 'Only the assigned sales agent can approve this order.' });
      return;
    }
    // The "Sales Agreement format details" editor (OrderApprovalPanel) only
    // renders pre-approval — once approvedAt is set there's no UI left to
    // fill this in, so guarantee it's stamped here rather than leaving it
    // blank on the printed agreement forever.
    const proformaInvoiceNo = existing.proformaInvoiceNo || (await generateReference(REFERENCE_CATEGORY.PROFORMA));

    const order = await prisma.salesOrder.update({
      where: { id: req.params.id },
      data: { approvedAt: new Date(), approvedById: req.adminSession!.user.id, proformaInvoiceNo },
    });
    await auditService.log({
      entityType: 'order',
      entityId: order.id,
      action: 'agreement_approved',
      performedById: req.adminSession!.user.id,
    });
    res.json(order);
  } catch (error) {
    console.error('Approve order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/orders/:id/allocation (reserve a stock unit — RESERVED only; use
// POST .../allocation/allocate below to lock a specific VIN once payment is
// verified). Delegates to vehicleAllocationService so stock accounting
// stays correct and consistent with the automatic-conversion path.
router.put('/:id/allocation', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { vehicleId, vin } = req.body;
    if (!vehicleId) { res.status(400).json({ error: 'vehicleId is required' }); return; }

    const result = await vehicleAllocationService.allocate(req.params.id, vehicleId, { vin: vin || null, allocatedById: req.adminSession!.user.id });
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Allocate vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/allocation/allocate (RESERVED -> ALLOCATED — the
// point a specific VIN gets locked to this order, only once finance has
// verified payment).
router.post('/:id/allocation/allocate', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.id }, select: { paymentVerifiedAt: true } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    if (!order.paymentVerifiedAt) {
      res.status(400).json({ error: 'Payment must be verified before a vehicle can be allocated.' });
      return;
    }
    const result = await vehicleAllocationService.lockAllocation(req.params.id, req.body?.vin);
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    await auditService.log({
      entityType: 'order',
      entityId: req.params.id,
      action: 'vehicle_allocated',
      performedById: req.adminSession!.user.id,
      toValue: { vehicleId: result.data.vehicleId, vin: result.data.vin },
    });

    // Step 12: Notify sales agent and managers that vehicle has been allocated
    try {
      const fullOrder = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
      if (fullOrder) {
        const staffEmails: string[] = [];
        if (fullOrder.salesAgentId) {
          const agent = await prisma.user.findUnique({ where: { id: fullOrder.salesAgentId } });
          if (agent?.email) staffEmails.push(agent.email);
        }
        staffEmails.push(...(await userRepository.findManagerEmails()));
        const uniqueEmails = [...new Set(staffEmails)];
        if (uniqueEmails.length > 0) {
          await dispatchNotification({
            type: 'order_status',
            to: uniqueEmails,
            subject: `Vehicle Allocated — ${fullOrder.orderNo}`,
            data: {
              orderNo: fullOrder.orderNo,
              customerName: fullOrder.customerName,
              vehicleModel: fullOrder.vehicleModel,
              vin: result.data.vin || 'N/A',
              nextStep: 'Vehicle has been allocated. PDI checklist can now be completed.',
              adminLink: `${env.urls.admin}/admin/orders/${fullOrder.id}`,
            },
            ctas: [{ label: 'View Order', url: `${env.urls.admin}/admin/orders/${fullOrder.id}` }],
            inApp: {
              type: 'order_update',
              title: 'Vehicle Allocated',
              body: `Vehicle has been allocated to order ${fullOrder.orderNo} (${fullOrder.customerName}). VIN: ${result.data.vin || 'N/A'}. PDI checklist can now be completed.`,
              link: `/admin/orders/${fullOrder.id}`,
              orderId: fullOrder.id,
              relatedModel: 'order',
              relatedId: fullOrder.id,
              priority: 'normal',
            },
          });
        }
      }
    } catch (allocNotifyError: any) {
      console.error('[VEHICLE ALLOCATED NOTIFICATION ERROR]', allocNotifyError.message);
    }

    res.json(result.data);
  } catch (error) {
    console.error('Allocate step error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/orders/:id/allocation (release allocation — flips to RELEASED
// and gives the stock unit back, rather than deleting the row, so
// allocation history survives).
router.delete('/:id/allocation', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const result = await vehicleAllocationService.deallocate(req.params.id);
    if (!result.ok) { res.status(404).json({ error: result.error }); return; }
    res.json({ success: true, allocation: result.data });
  } catch (error) {
    console.error('Release allocation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:id/agreement (download the Sales Agreement PDF, for staff print/view)
router.get('/:id/agreement', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }

    const result = await orderAgreementService.generateAgreementPdfForStaff(req.params.id);
    if (!result.ok || !result.data) { res.status(500).json({ error: result.error || 'Failed to generate agreement PDF' }); return; }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="agreement-${order.orderNo}.pdf"`);
    res.send(result.data);
  } catch (error) {
    console.error('Get agreement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:id/handover-pdf (download the Delivery & Handover Note PDF, for staff print/view)
router.get('/:id/handover-pdf', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }

    const result = await orderHandoverService.generateHandoverPdfForStaff(req.params.id);
    if (!result.ok || !result.data) { res.status(500).json({ error: result.error || 'Failed to generate handover PDF' }); return; }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="handover-${order.orderNo}.pdf"`);
    res.send(result.data);
  } catch (error) {
    console.error('Get handover PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/delivery-note (stamp a Delivery Note number, one-way like invoiceNo)
router.post('/:id/delivery-note', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    if (order.deliveryNoteNo) { res.status(400).json({ error: 'Delivery note already exists' }); return; }

    const deliveryNoteNo = await generateReference(REFERENCE_CATEGORY.DELIVERY);
    const updated = await prisma.salesOrder.update({ where: { id: req.params.id }, data: { deliveryNoteNo } });
    res.status(201).json(updated);
  } catch (error) {
    console.error('Generate delivery note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/countersign (manager countersign)
router.post('/:id/countersign', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    if (!order.signedAt || !order.signedDocumentUrl) {
      res.status(400).json({ error: 'The customer must sign the agreement before manager countersignature.' });
      return;
    }

    const updated = await prisma.salesOrder.update({
      where: { id: req.params.id },
      data: { countersignedAt: new Date(), countersignedById: req.adminSession!.user.id },
    });

    await auditService.log({
      entityType: 'order',
      entityId: order.id,
      action: 'agreement_fully_executed',
      performedById: req.adminSession!.user.id,
      toValue: { countersignedAt: updated.countersignedAt },
    });

    try {
      const manager = await userRepository.findByIdSlim(req.adminSession!.user.id);
      await documentSignatureRepository.upsert('SALES_AGREEMENT', order.id, 'manager', {
        signedByName: manager?.name ?? req.adminSession!.user.name,
        signatureUrl: manager?.signatureUrl ?? null,
        signedByUserId: req.adminSession!.user.id,
      });
    } catch {
      // Signature-log write failure should not block countersigning.
    }

    let notificationSent = false;
    let notificationError: string | undefined;
    if (order.customerEmail) {
      const paymentToken = signLinkToken('payment', order.id);
      const link = `${env.urls.site}/payment/order/${order.id}?token=${encodeURIComponent(paymentToken)}`;
      const result = await dispatchNotification({
        type: 'order_status',
        to: [order.customerEmail],
        subject: `Complete Your Payment — ${order.orderNo}`,
        data: { orderNo: order.orderNo, vehicleModel: order.vehicleModel, customerName: order.customerName, link },
      });
      notificationSent = result.ok;
      notificationError = result.error;
    }

    // Step 9: Notify sales agent that manager countersigned
    if (order.salesAgentId) {
      try {
        const agent = await prisma.user.findUnique({ where: { id: order.salesAgentId } });
        if (agent?.email) {
          await dispatchNotification({
            type: 'order_status',
            to: [agent.email],
            subject: `Agreement Countersigned — ${order.orderNo}`,
            data: {
              orderNo: order.orderNo,
              customerName: order.customerName,
              vehicleModel: order.vehicleModel,
              nextStep: 'Payment link has been sent to the customer. Monitor payment status.',
              adminLink: `${env.urls.admin}/admin/orders/${order.id}`,
            },
            ctas: [{ label: 'View Order', url: `${env.urls.admin}/admin/orders/${order.id}` }],
            inApp: {
              type: 'order_update',
              title: 'Agreement Countersigned',
              body: `Manager has countersigned the agreement for order ${order.orderNo} (${order.customerName}). Payment link has been sent to the customer.`,
              link: `/admin/orders/${order.id}`,
              orderId: order.id,
              relatedModel: 'order',
              relatedId: order.id,
              priority: 'normal',
            },
          });
        }
      } catch (err: any) {
        console.error('[COUNTERSIGN AGENT NOTIFICATION ERROR]', err.message);
      }
    }

    res.json({ ...updated, notificationSent, notificationError });
  } catch (error) {
    console.error('Countersign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/send-agreement (email agreement)
router.post('/:id/send-agreement', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    if (!order.approvedAt) {
      res.status(400).json({ error: 'The sales agent must approve the order before the agreement can be sent.' });
      return;
    }

    const updated = await prisma.salesOrder.update({ where: { id: req.params.id }, data: { agreementSentAt: new Date() } });

    await auditService.log({
      entityType: 'order',
      entityId: order.id,
      action: 'agreement_sent',
      performedById: req.adminSession!.user.id,
    });

    let notificationSent = false;
    let notificationError: string | undefined;
    if (order.customerEmail) {
      const link = `${env.urls.site}${orderAgreementService.generateAgreementLink(order.id)}`;

      // Generate agreement PDF attachment
      let attachments;
      try {
        const pdfResult = await orderAgreementService.generateAgreementPdfForStaff(order.id);
        if (pdfResult.ok && pdfResult.data) {
          attachments = [{ filename: `agreement-${order.orderNo}.pdf`, content: pdfResult.data, contentType: 'application/pdf' }];
        }
      } catch (_) {
        // PDF generation failure should not block the email
      }

      const statusLink = `${env.urls.site}/status?ref=${encodeURIComponent(order.orderNo)}`;
      const result = await dispatchNotification({
        type: 'order_status',
        to: [order.customerEmail],
        subject: `Sales Agreement Ready to Sign — ${order.orderNo}`,
        data: { orderNo: order.orderNo, vehicleModel: order.vehicleModel, customerName: order.customerName, link },
        attachments,
        ctas: [
          { label: 'Review & Sign Agreement', url: link },
          { label: 'Check Order Status', url: statusLink },
        ],
      });
      notificationSent = result.ok;
      notificationError = result.error;
    }

    res.json({ ...updated, notificationSent, notificationError });
  } catch (error) {
    console.error('Send agreement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/reject-agreement (return for correction)
router.post('/:id/reject-agreement', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    if (!reason) { res.status(400).json({ error: 'A rejection reason is required.' }); return; }
    const order = await prisma.salesOrder.update({
      where: { id: req.params.id },
      data: { rejectedAt: new Date(), rejectedById: req.adminSession!.user.id, rejectionReason: reason },
    });
    res.json(order);
  } catch (error) {
    console.error('Reject agreement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/orders/:id/pdi (set PDI item result: PENDING/PASS/FAIL/NA,
// optionally with failure-evidence photos/notes)
router.patch('/:id/pdi', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { itemId, result: itemResult, photoUrls, notes } = req.body;
    const VALID_RESULTS = ['PENDING', 'PASS', 'FAIL', 'NA'];
    if (!itemId || !VALID_RESULTS.includes(itemResult)) {
      res.status(400).json({ error: 'itemId and a valid result (PENDING/PASS/FAIL/NA) are required' });
      return;
    }

    const result = await orderService.updatePdiItem(itemId, req.params.id, {
      result: itemResult,
      photoUrls: Array.isArray(photoUrls) ? photoUrls : undefined,
      notes: typeof notes === 'string' ? notes : undefined,
      checkedById: req.adminSession!.user.id,
    });
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Update PDI item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:id/invoice (download invoice PDF)
router.get('/:id/invoice', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
    if (!order || !order.invoicedAt) { res.status(404).json({ error: 'Invoice not found' }); return; }

    const result = await orderInvoiceService.generateInvoicePdf(req.params.id);
    if (!result.ok || !result.data) { res.status(500).json({ error: result.error || 'Failed to generate invoice PDF' }); return; }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${order.orderNo}.pdf"`);
    res.send(result.data);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:id/receipt (download payment receipt PDF)
router.get('/:id/receipt', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
    if (!order || !order.paymentVerifiedAt) { res.status(404).json({ error: 'Receipt not found' }); return; }

    const result = await orderInvoiceService.generateReceiptPdf(req.params.id);
    if (!result.ok || !result.data) { res.status(500).json({ error: result.error || 'Failed to generate receipt PDF' }); return; }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="receipt-${order.orderNo}.pdf"`);
    res.send(result.data);
  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/invoice (generate invoice)
router.post('/:id/invoice', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    if (order.invoicedAt) { res.status(400).json({ error: 'Invoice already exists' }); return; }

    // Optional structured invoice details from the new Sales Invoice format
    // (line items / VAT / registration charge / amount already paid / payment
    // method & reference / odometer) — the admin invoice panel submits these;
    // absent fields fall back to the pre-existing single-total behavior.
    const { lineItems, vatAmount, registrationCharge, amountPaid, paymentMethod, paymentReferenceNo, odometerAtDelivery } = req.body ?? {};

    // A blank payment reference no. (see the "create it" placeholder in
    // OrderFulfillmentPanel) is stamped automatically here, same GY-PY-...
    // numbering scheme as the other generateReference() document numbers.
    // A caller that omits the field entirely still leaves it untouched.
    const resolvedPaymentReferenceNo = paymentReferenceNo !== undefined && !paymentReferenceNo
      ? await generateReference(REFERENCE_CATEGORY.PAYMENT)
      : paymentReferenceNo;

    const updated = await prisma.salesOrder.update({
      where: { id: req.params.id },
      data: {
        invoiceNo: `INV-${order.orderNo}`,
        invoiceAmount: order.totalPrice,
        invoicedAt: new Date(),
        invoicedById: req.adminSession!.user.id,
        ...(lineItems !== undefined ? { invoiceLineItems: lineItems } : {}),
        ...(vatAmount !== undefined ? { vatAmount } : {}),
        ...(registrationCharge !== undefined ? { registrationCharge } : {}),
        ...(amountPaid !== undefined ? { amountPaid } : {}),
        ...(paymentMethod !== undefined ? { paymentMethod } : {}),
        ...(resolvedPaymentReferenceNo !== undefined ? { paymentReferenceNo: resolvedPaymentReferenceNo } : {}),
        ...(odometerAtDelivery !== undefined ? { odometerAtDelivery } : {}),
      },
    });

    let notificationSent = false;
    let notificationError: string | undefined;
    if (order.customerEmail) {
      let attachments;
      try {
        const pdfResult = await orderInvoiceService.generateInvoicePdf(order.id);
        if (pdfResult.ok && pdfResult.data) {
          attachments = [{ filename: `invoice-${updated.invoiceNo}.pdf`, content: pdfResult.data, contentType: 'application/pdf' }];
        }
      } catch (_) {
        // PDF generation failure should not block the email
      }

      const statusLink = `${env.urls.site}/status?ref=${encodeURIComponent(order.orderNo)}`;
      const invoiceToken = signLinkToken('invoice', order.id);
      const invoiceLink = `${env.urls.site}/api/public/orders/${order.id}/invoice?token=${encodeURIComponent(invoiceToken)}`;
      const result = await dispatchNotification({
        type: 'order_status',
        to: [order.customerEmail],
        subject: `Sales Invoice — ${order.orderNo}`,
        data: { orderNo: order.orderNo, invoiceNo: updated.invoiceNo, invoiceAmount: updated.invoiceAmount, customerName: order.customerName },
        attachments,
        ctas: [
          { label: 'View Invoice', url: invoiceLink },
          { label: 'Check Order Status', url: statusLink },
        ],
      });
      notificationSent = result.ok;
      notificationError = result.error;
    }

    res.status(201).json({ ...updated, notificationSent, notificationError });
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/payment/confirm (confirm or reject submitted payment proof)
router.post('/:id/payment/confirm', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { action } = req.body;
    if (action !== 'confirm' && action !== 'reject') { res.status(400).json({ error: 'action must be "confirm" or "reject"' }); return; }

    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    if (action === 'confirm' && !order.countersignedAt) {
      res.status(400).json({ error: "Get the manager's countersignature before confirming payment." });
      return;
    }

    const updated = action === 'confirm'
      ? await prisma.salesOrder.update({
          where: { id: req.params.id },
          data: { paymentStatus: 'PAID', paymentConfirmedAt: new Date(), paymentConfirmedById: req.adminSession!.user.id },
        })
      : await prisma.salesOrder.update({
          where: { id: req.params.id },
          data: { paymentStatus: 'UNPAID', paymentProofUrl: null, paymentSubmittedAt: null },
        });

    // Step 10: Notify sales agent, managers, and finance when payment is confirmed
    if (action === 'confirm') {
      const notifyStaff = async (emails: string[], subject: string, data: Record<string, any>) => {
        if (emails.length === 0) return;
        try {
          await dispatchNotification({
            type: 'order_status',
            to: emails,
            subject,
            data,
            ctas: [{ label: 'View Order', url: `${env.urls.admin}/admin/orders/${order.id}` }],
          });
        } catch (err: any) {
          console.error('[PAYMENT CONFIRM STAFF NOTIFICATION ERROR]', err.message);
        }
      };

      const baseData = { orderNo: order.orderNo, vehicleModel: order.vehicleModel, customerName: order.customerName, amountPaid: order.amountPaid };
      const staffEmails: string[] = [];

      // Sales agent
      if (order.salesAgentId) {
        const agent = await prisma.user.findUnique({ where: { id: order.salesAgentId } });
        if (agent?.email) staffEmails.push(agent.email);
      }
      // Managers
      const managerEmails = await userRepository.findManagerEmails();
      staffEmails.push(...managerEmails);
      // Finance
      const financeUsers = await prisma.user.findMany({ where: { role: 'finance', isActive: true }, select: { email: true } });
      const financeEmails = financeUsers.map(f => f.email).filter(Boolean);
      staffEmails.push(...financeEmails);

      const uniqueEmails = [...new Set(staffEmails)];
      await notifyStaff(uniqueEmails, `Payment Confirmed — ${order.orderNo}`, {
        ...baseData,
        nextStep: 'Finance must verify the payment before delivery can proceed.',
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/payment/verify (finance/manager review of an already
// "PAID" payment — distinct from paymentConfirmedAt, which an unreviewed
// online mock-pay success also sets. Delivery requires this, not just
// paymentStatus === 'PAID', per the workflow spec's explicit call-out that
// delivery shouldn't proceed on an unverified payment notification alone.)
router.post('/:id/payment/verify', requireAdminApiSession, requirePermission('canCountersignAgreements'), async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    if (order.paymentStatus !== 'PAID') {
      res.status(400).json({ error: 'Payment must be marked PAID before it can be verified.' });
      return;
    }
    const updated = await salesOrderRepository.verifyPayment(order.id, req.adminSession!.user.id);
    await auditService.log({
      entityType: 'order',
      entityId: order.id,
      action: 'payment_verified',
      performedById: req.adminSession!.user.id,
    });

    let notificationSent = false;
    let notificationError: string | undefined;
    if (order.customerEmail) {
      let attachments;
      try {
        const pdfResult = await orderInvoiceService.generateReceiptPdf(order.id);
        if (pdfResult.ok && pdfResult.data) {
          attachments = [{ filename: `receipt-${order.orderNo}.pdf`, content: pdfResult.data, contentType: 'application/pdf' }];
        }
      } catch (_) {
        // PDF generation failure should not block the email
      }

      const receiptToken = signLinkToken('receipt', order.id);
      const receiptLink = `${env.urls.site}/api/public/orders/${order.id}/receipt?token=${encodeURIComponent(receiptToken)}`;
      const result = await dispatchNotification({
        type: 'order_status',
        to: [order.customerEmail],
        subject: `Payment Confirmed — ${order.orderNo}`,
        data: { orderNo: order.orderNo, vehicleModel: order.vehicleModel, amountPaid: order.amountPaid, customerName: order.customerName },
        attachments,
        ctas: [{ label: 'View Receipt', url: receiptLink }],
      });
      notificationSent = result.ok;
      notificationError = result.error;
    }

    // Step 11: Notify sales agent and managers that payment has been verified
    try {
      const staffEmails: string[] = [];
      if (order.salesAgentId) {
        const agent = await prisma.user.findUnique({ where: { id: order.salesAgentId } });
        if (agent?.email) staffEmails.push(agent.email);
      }
      staffEmails.push(...(await userRepository.findManagerEmails()));
      const uniqueEmails = [...new Set(staffEmails)];
      if (uniqueEmails.length > 0) {
        await dispatchNotification({
          type: 'order_status',
          to: uniqueEmails,
          subject: `Payment Verified — ${order.orderNo}`,
          data: {
            orderNo: order.orderNo,
            vehicleModel: order.vehicleModel,
            customerName: order.customerName,
            nextStep: 'Payment has been verified. Vehicle can now be allocated and delivery can proceed.',
            adminLink: `${env.urls.admin}/admin/orders/${order.id}`,
          },
          ctas: [{ label: 'View Order', url: `${env.urls.admin}/admin/orders/${order.id}` }],
          inApp: {
            type: 'order_update',
            title: 'Payment Verified',
            body: `Payment for order ${order.orderNo} (${order.customerName}) has been verified. Vehicle can now be allocated.`,
            link: `/admin/orders/${order.id}`,
            orderId: order.id,
            relatedModel: 'order',
            relatedId: order.id,
            priority: 'normal',
          },
        });
      }
    } catch (err: any) {
      console.error('[PAYMENT VERIFY STAFF NOTIFICATION ERROR]', err.message);
    }

    res.json({ ...updated, notificationSent, notificationError });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/orders/:id/financing-status (transition financing)
router.patch('/:id/financing-status', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { toStatus } = req.body;
    if (!VALID_FINANCING_STATUSES.includes(toStatus)) { res.status(400).json({ error: 'Invalid financing status.' }); return; }
    const order = await prisma.salesOrder.update({ where: { id: req.params.id }, data: { financingStatus: toStatus } });
    res.json(order);
  } catch (error) {
    console.error('Update financing status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/send-test-drive (invite to test drive)
router.post('/:id/send-test-drive', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { preferredDate, preferredTime, location } = req.body;
    if (!preferredDate || !preferredTime || !location) {
      res.status(400).json({ error: 'preferredDate, preferredTime and location are required' });
      return;
    }

    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    if (!order.customerEmail) { res.status(400).json({ error: 'This order has no customer email on file.' }); return; }

    const vehicle = await vehicleRepository.findIdByName(order.vehicleModel);
    if (!vehicle) { res.status(400).json({ error: 'No matching vehicle found for this order — cannot schedule a test drive.' }); return; }

    const testDrive = await prisma.testDrive.create({
      data: {
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        vehicleId: vehicle.id,
        preferredDate: new Date(preferredDate),
        preferredTime,
        location,
        salesOrderId: req.params.id,
        salesRepId: order.salesAgentId,
      },
    });

    const result = await dispatchNotification({
      type: 'test_drive',
      to: [order.customerEmail],
      subject: `Test Drive Invitation — ${order.vehicleModel}`,
      data: { orderNo: order.orderNo, vehicleModel: order.vehicleModel, preferredDate, preferredTime, location },
    });

    res.status(201).json({ ...testDrive, notificationSent: result.ok, notificationError: result.error });
  } catch (error) {
    console.error('Send test drive error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/handover-email (send delivery confirmation email)
router.post('/:id/handover-email', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }

    const updated = await prisma.salesOrder.update({ where: { id: req.params.id }, data: { handoverNotifiedAt: new Date() } });

    let notificationSent = false;
    let notificationError: string | undefined;
    if (order.customerEmail) {
      // Generate handover PDF attachment
      let attachments;
      try {
        const pdfResult = await orderHandoverService.generateHandoverPdfForStaff(order.id);
        if (pdfResult.ok && pdfResult.data) {
          attachments = [{ filename: `handover-${order.orderNo}.pdf`, content: pdfResult.data, contentType: 'application/pdf' }];
        }
      } catch (_) {
        // PDF generation failure should not block the email
      }

      const result = await dispatchNotification({
        type: 'order_status',
        to: [order.customerEmail],
        subject: `Your ${order.vehicleModel} Has Been Delivered — ${order.orderNo}`,
        data: { orderNo: order.orderNo, vehicleModel: order.vehicleModel, customerName: order.customerName },
        attachments,
      });
      notificationSent = result.ok;
      notificationError = result.error;
    }

    res.json({ ...updated, notificationSent, notificationError });
  } catch (error) {
    console.error('Send handover email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/handover-countersign (manager countersign handover)
router.post('/:id/handover-countersign', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.update({
      where: { id: req.params.id },
      data: { handoverCountersignedAt: new Date(), handoverCountersignedById: req.adminSession!.user.id },
    });

    try {
      const manager = await userRepository.findByIdSlim(req.adminSession!.user.id);
      await documentSignatureRepository.upsert('HANDOVER', order.id, 'manager', {
        signedByName: manager?.name ?? req.adminSession!.user.name,
        signatureUrl: manager?.signatureUrl ?? null,
        signedByUserId: req.adminSession!.user.id,
      });
    } catch {
      // Signature-log write failure should not block countersigning.
    }

    res.json(order);
  } catch (error) {
    console.error('Handover countersign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/send-handover-signoff (email handover sign-off link to customer)
router.post('/:id/send-handover-signoff', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    if (!order.customerEmail) { res.status(400).json({ error: 'No customer email is on file for this order.' }); return; }

    const link = `${env.urls.site}${orderHandoverService.generateHandoverLink(order.id)}`;

    // Generate handover PDF attachment
    let attachments;
    try {
      const pdfResult = await orderHandoverService.generateHandoverPdfForStaff(order.id);
      if (pdfResult.ok && pdfResult.data) {
        attachments = [{ filename: `handover-${order.orderNo}.pdf`, content: pdfResult.data, contentType: 'application/pdf' }];
      }
    } catch (_) {
      // PDF generation failure should not block the email
    }

    const result = await dispatchNotification({
      type: 'order_status',
      to: [order.customerEmail],
      subject: `Confirm Vehicle Handover — ${order.orderNo}`,
      data: { orderNo: order.orderNo, vehicleModel: order.vehicleModel, customerName: order.customerName, link },
      attachments,
    });

    res.json({ notificationSent: result.ok, notificationError: result.error });
  } catch (error) {
    console.error('Send handover signoff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/send-handover-countersign-link (email manager countersign link)
router.post('/:id/send-handover-countersign-link', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }

    const managerEmails = await userRepository.findManagerEmails();
    if (managerEmails.length === 0) { res.status(400).json({ error: 'No manager emails found.' }); return; }

    const link = `${env.urls.site}${orderHandoverService.generateManagerCountersignLink(order.id)}`;

    const result = await dispatchNotification({
      type: 'order_status',
      to: managerEmails,
      subject: `Countersign Handover — ${order.orderNo}`,
      data: { orderNo: order.orderNo, vehicleModel: order.vehicleModel, customerName: order.customerName, link },
    });

    res.json({ notificationSent: result.ok, notificationError: result.error });
  } catch (error) {
    console.error('Send handover countersign link error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/commission/pay (mark commission paid)
router.post('/:id/commission/pay', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.update({ where: { id: req.params.id }, data: { commissionStatus: 'PAID' } });
    res.json(order);
  } catch (error) {
    console.error('Mark commission paid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as orderRoutes };
