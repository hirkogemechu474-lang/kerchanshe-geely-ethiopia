import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';
import { orderService } from '../services/sales/order.service';
import { orderAgreementService } from '../services/sales/orderAgreement.service';
import { orderHandoverService } from '../services/sales/orderHandover.service';
import { orderInvoiceService } from '../services/sales/orderInvoice.service';
import { seedPdiChecklist } from '../services/sales/pdiChecklist.template';
import { dispatchNotification } from '../services/email/notifications.dispatch';
import { generateSalesAgreementPdf } from '../services/pdf/salesAgreement.pdf';
import { getCompanyInfo } from '../services/pdf/companyInfo';
import { vehicleAllocationRepository, vehicleRepository, userRepository, documentSignatureRepository } from '../repositories';
import { signLinkToken } from '../utils/secureLink';
import { generateReference, REFERENCE_CATEGORY } from '../utils/reference';
import { env } from '../config/env';
import { rateLimiters } from '../utils/rateLimit';

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
        pdiProgress: `${pdiChecked}/${pdiTotal}`,
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
    const order = await prisma.salesOrder.create({ data: req.body });
    await seedPdiChecklist(prisma, order.id);
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

// PATCH /api/orders/:id (admin update fields)
router.patch('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.update({ where: { id: req.params.id }, data: req.body });
    res.json(order);
  } catch (error) {
    console.error('Update order error:', error);
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
    const order = await prisma.salesOrder.update({
      where: { id: req.params.id },
      data: { approvedAt: new Date(), approvedById: req.adminSession!.user.id },
    });
    res.json(order);
  } catch (error) {
    console.error('Approve order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/orders/:id/allocation (allocate vehicle)
router.put('/:id/allocation', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { vehicleId, vin } = req.body;
    if (!vehicleId) { res.status(400).json({ error: 'vehicleId is required' }); return; }

    const existing = await vehicleAllocationRepository.findByOrderId(req.params.id);
    const allocation = existing
      ? await vehicleAllocationRepository.update(req.params.id, {
          vehicleId, vin: vin || null, status: 'RESERVED', releasedAt: null,
          allocatedById: req.adminSession!.user.id, allocatedAt: new Date(),
        })
      : await vehicleAllocationRepository.create({
          orderId: req.params.id, vehicleId, vin: vin || null,
          allocatedById: req.adminSession!.user.id,
        });

    res.json(allocation);
  } catch (error) {
    console.error('Allocate vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/orders/:id/allocation (release allocation)
router.delete('/:id/allocation', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const existing = await vehicleAllocationRepository.findByOrderId(req.params.id);
    if (!existing) { res.status(404).json({ error: 'No allocation found for this order' }); return; }
    await vehicleAllocationRepository.delete(req.params.id);
    res.json({ success: true });
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
    }

    res.json({ ...updated, notificationSent });
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

    let notificationSent = false;
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

      const result = await dispatchNotification({
        type: 'order_status',
        to: [order.customerEmail],
        subject: `Sales Agreement Ready to Sign — ${order.orderNo}`,
        data: { orderNo: order.orderNo, vehicleModel: order.vehicleModel, customerName: order.customerName, link },
        attachments,
      });
      notificationSent = result.ok;
    }

    res.json({ ...updated, notificationSent });
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

// PATCH /api/orders/:id/pdi (toggle PDI item)
router.patch('/:id/pdi', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { itemId, isChecked } = req.body;
    if (!itemId || typeof isChecked !== 'boolean') { res.status(400).json({ error: 'itemId and isChecked are required' }); return; }

    const result = await orderService.updatePdiItem(itemId, req.params.id, {
      isChecked,
      checkedById: req.adminSession!.user.id,
    });
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Toggle PDI error:', error);
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
        ...(paymentReferenceNo !== undefined ? { paymentReferenceNo } : {}),
        ...(odometerAtDelivery !== undefined ? { odometerAtDelivery } : {}),
      },
    });

    let notificationSent = false;
    if (order.customerEmail) {
      const result = await dispatchNotification({
        type: 'order_status',
        to: [order.customerEmail],
        subject: `Sales Invoice — ${order.orderNo}`,
        data: { orderNo: order.orderNo, invoiceNo: updated.invoiceNo, invoiceAmount: updated.invoiceAmount, customerName: order.customerName },
      });
      notificationSent = result.ok;
    }

    res.status(201).json({ ...updated, notificationSent });
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

    res.json(updated);
  } catch (error) {
    console.error('Confirm payment error:', error);
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

    res.status(201).json({ ...testDrive, notificationSent: result.ok });
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
    if (order.customerEmail) {
      const result = await dispatchNotification({
        type: 'order_status',
        to: [order.customerEmail],
        subject: `Your ${order.vehicleModel} Has Been Delivered — ${order.orderNo}`,
        data: { orderNo: order.orderNo, vehicleModel: order.vehicleModel, customerName: order.customerName },
      });
      notificationSent = result.ok;
    }

    res.json({ ...updated, notificationSent });
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
    const result = await dispatchNotification({
      type: 'order_status',
      to: [order.customerEmail],
      subject: `Confirm Vehicle Handover — ${order.orderNo}`,
      data: { orderNo: order.orderNo, vehicleModel: order.vehicleModel, customerName: order.customerName, link },
    });

    res.json({ notificationSent: result.ok });
  } catch (error) {
    console.error('Send handover signoff error:', error);
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
