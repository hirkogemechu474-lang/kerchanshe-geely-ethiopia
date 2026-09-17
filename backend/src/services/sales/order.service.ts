import { salesOrderRepository, quotationRepository, vehicleRepository } from '../../repositories';
import { generateReference, REFERENCE_CATEGORY } from '../../utils/reference';
import { commissionService } from './commission.service';
import { warrantyService } from '../warranty/warranty.service';
import { loyaltyService } from '../loyalty/loyalty.service';
import { seedPdiChecklist } from './pdiChecklist.template';
import { prisma } from '../../config/database';
import { auditService } from '../audit/audit.service';
import { dispatchNotification } from '../email/notifications.dispatch';
import { env } from '../../config/env';
import { signLinkToken } from '../../utils/secureLink';

// The spec's "permanent ownership profile" (Customer -> CustomerVehicle ->
// VIN -> warranty -> service history) previously only got created from the
// workshop check-in flow — a car sold but never yet serviced through this
// pipeline had no CustomerVehicle at all. Called once, best-effort, on the
// DELIVERED transition. Dedupes by phone (same convention as every other
// customer lookup in this schema — see Customer.phone's index comment) and,
// if a VIN is on file, by VIN (CustomerVehicle.vin is unique).
async function registerCustomerVehicleOwnership(order: { id: string; customerName: string; customerPhone: string; vehicleModel: string }): Promise<void> {
  const allocation = await prisma.vehicleAllocation.findUnique({ where: { orderId: order.id } });
  const vin = allocation?.vin ?? null;

  if (vin) {
    const existingByVin = await prisma.customerVehicle.findUnique({ where: { vin } });
    if (existingByVin) return;
  }

  // Customer.phone is deliberately not @unique (see the model's own doc
  // comment — shared/reused numbers are legitimate), so this is a plain
  // find-or-create rather than a real upsert.
  const customer = await prisma.customer.findFirst({ where: { phone: order.customerPhone } })
    ?? await prisma.customer.create({ data: { fullName: order.customerName, phone: order.customerPhone } });

  await prisma.customerVehicle.create({
    data: {
      customerId: customer.id,
      vin,
      plateNo: '',
      model: order.vehicleModel,
    },
  });
}

// Real OrderStatus enum values are QUOTED/BOOKED/FINANCING_PENDING/
// READY_FOR_DELIVERY/DELIVERED/CANCELLED (see schema.prisma) — this used to
// reference 'ALLOCATED'/'INVOICE_GENERATED', which are not valid OrderStatus
// values and would make every real transition attempt fail once a caller
// tried to reach them. Gated per the documented business rules (PDI 100%
// complete, agreement signed, payment confirmed before READY_FOR_DELIVERY;
// registration + invoice before DELIVERED — see getTransitionBlockReason
// below and apps/admin's OrderDetail.tsx, which gates the same way client-side).
export const orderStateMachine = {
  validTransitions: {
    QUOTED: ['BOOKED', 'CANCELLED'],
    BOOKED: ['FINANCING_PENDING', 'READY_FOR_DELIVERY', 'CANCELLED'],
    FINANCING_PENDING: ['READY_FOR_DELIVERY', 'CANCELLED'],
    READY_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
    DELIVERED: [],
    CANCELLED: [],
  } as Record<string, string[]>,

  canTransition(from: string, to: string): boolean {
    return this.validTransitions[from]?.includes(to) ?? false;
  },

  getValidTransitions(status: string): string[] {
    return this.validTransitions[status] ?? [];
  },
};

// BR: "An order cannot be marked 'ready for delivery' until the PDI
// checklist is 100% complete" (see PdiChecklistItem model comment), plus the
// agreement + payment gates the Approval/Payment panels enforce, and the
// registration + invoice gates the Fulfillment panel enforces before
// DELIVERED. Returns a human-readable reason the transition is blocked, or
// null if it's allowed.
function getTransitionBlockReason(order: { pdiItems?: { isChecked: boolean }[]; approvedAt: Date | null; signedDocumentUrl: string | null; countersignedAt: Date | null; paymentStatus: string; paymentVerifiedAt?: Date | null; registeredAt: Date | null; invoicedAt: Date | null; vehicleAllocation?: { status: string } | null; deliveryHold?: boolean }, toStatus: string): string | null {
  if (toStatus === 'READY_FOR_DELIVERY') {
    const pdiItems = order.pdiItems ?? [];
    const pdiComplete = pdiItems.length > 0 && pdiItems.every((p) => p.isChecked);
    if (!pdiComplete) return 'Complete the PDI checklist before marking this order ready for delivery.';
    const agreementComplete = Boolean(order.approvedAt) && Boolean(order.signedDocumentUrl);
    if (!agreementComplete) return 'Approve the order and attach the signed agreement before marking it ready for delivery.';
    if (!order.countersignedAt) return "Get the manager's countersignature before marking this order ready for delivery.";
    if (order.paymentStatus !== 'PAID') return 'Confirm payment before marking this order ready for delivery.';
    if (!order.paymentVerifiedAt) return 'Finance must verify the payment before marking this order ready for delivery.';
    if (order.vehicleAllocation?.status !== 'ALLOCATED') return 'Allocate a specific vehicle (VIN) to this order before marking it ready for delivery.';
    if (order.deliveryHold) return 'Delivery is on hold for this order.';
  }
  if (toStatus === 'DELIVERED') {
    if (!order.registeredAt) return 'Record the vehicle registration number before marking this order delivered.';
    if (!order.invoicedAt) return 'Generate the sales invoice before marking this order delivered.';
  }
  return null;
}

export const orderService = {
  async create(data: {
    quotationId?: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    vehicleModel: string;
    color?: string;
    totalPrice: number;
    assignedTo?: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const orderNo = await salesOrderRepository.nextOrderNo();

      // SalesOrder has no `vehicleId`/`color` columns — real allocation
      // happens later via VehicleAllocation, and a requested color is part
      // of configurationJson (same shape Quotation.configurationJson uses;
      // see the field's doc comment on the SalesOrder model).
      const order = await salesOrderRepository.create({
        orderNo,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        vehicleModel: data.vehicleModel,
        ...(data.color && { configurationJson: { color: data.color } }),
        totalPrice: data.totalPrice,
        status: 'QUOTED',
        paymentStatus: 'UNPAID',
        financingStatus: 'NOT_REQUESTED',
        orderDate: new Date(),
        ...(data.assignedTo && { assignedTo: data.assignedTo }),
        ...(data.quotationId && {
          quotation: { connect: { id: data.quotationId } },
        }),
      });

      // Initialize commission ownership if sales agent is assigned
      if (data.assignedTo) {
        await commissionService.initializeCommission(order.id, data.assignedTo);
      }

      await seedPdiChecklist(prisma, order.id);

      return { ok: true, data: order };
    } catch (error: any) {
      console.error('[ORDER CREATE ERROR]', error.message);
      return { ok: false, error: 'Failed to create order.' };
    }
  },

  async getById(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findByIdWithDetail(id);
      if (!order) return { ok: false, error: 'Order not found.' };
      return { ok: true, data: order };
    } catch (error: any) {
      console.error('[ORDER GET ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch order.' };
    }
  },

  async list(params: {
    where?: any;
    page?: number;
    pageSize?: number;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 20;
      const skip = (page - 1) * pageSize;

      const [orders, total, statusCounts] = await salesOrderRepository.findPage(params.where, skip, pageSize);

      return {
        ok: true,
        data: {
          orders,
          total,
          statusCounts,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } catch (error: any) {
      console.error('[ORDER LIST ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch orders.' };
    }
  },

  async transitionWithCommission(id: string, toStatus: string, changedById: string, reasonCode?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findByIdWithPdiItems(id);
      if (!order) return { ok: false, error: 'Order not found.' };

      if (!orderStateMachine.canTransition(order.status, toStatus)) {
        return { ok: false, error: `Cannot transition from ${order.status} to ${toStatus}.` };
      }

      const blockReason = getTransitionBlockReason(order, toStatus);
      if (blockReason) return { ok: false, error: blockReason };

      // Determine commission status based on new status
      let commissionStatus = order.commissionStatus;
      if (toStatus === 'DELIVERED' && commissionStatus !== 'EARNED') {
        commissionStatus = 'EARNED'; // Auto-earn commission when delivered
        // Also use commissionService to properly calculate and record the earned amount
        await commissionService.markEarned(id, changedById);
      } else if (toStatus === 'CANCELLED' && commissionStatus !== 'NOT_APPLICABLE') {
        commissionStatus = 'NOT_APPLICABLE'; // Reset if cancelled
      }

      // commissionStatus is a SalesOrder column, not a SalesOrderStatusHistory
      // one — it belongs in the first (order-update) argument, not the
      // history-row argument (where it doesn't exist and never actually
      // reached the database under the old wiring).
      const result = await salesOrderRepository.transitionStatus(
        id,
        { status: toStatus as any, commissionStatus: commissionStatus as any },
        {
          fromStatus: order.status as any,
          toStatus: toStatus as any,
          changedById,
          reasonCode: reasonCode ?? null,
        }
      );

      await auditService.log({
        entityType: 'order',
        entityId: id,
        action: 'status_changed',
        performedById: changedById,
        fromValue: { status: order.status },
        toValue: { status: toStatus },
        reason: reasonCode,
      });

      if (toStatus === 'READY_FOR_DELIVERY' && order.customerEmail) {
        try {
          const scheduleToken = signLinkToken('delivery-schedule', order.id);
          const scheduleLink = `${env.urls.site}/delivery-schedule/${order.id}?token=${encodeURIComponent(scheduleToken)}`;
          await dispatchNotification({
            type: 'delivery_ready',
            to: [order.customerEmail],
            subject: `Your Vehicle is Ready for Delivery — ${order.orderNo}`,
            data: { orderNo: order.orderNo, vehicleModel: order.vehicleModel, customerName: order.customerName },
            ctas: [
              { label: 'Schedule / Confirm Handover', url: scheduleLink },
              { label: 'Check Order Status', url: `${env.urls.site}/status?ref=${encodeURIComponent(order.orderNo)}` },
            ],
          });
        } catch (notifyError: any) {
          console.error('[DELIVERY READY NOTIFICATION ERROR]', notifyError.message);
        }
        // Notify sales agent that delivery is ready for scheduling
        if (order.salesAgentId) {
          try {
            const agent = await prisma.user.findUnique({ where: { id: order.salesAgentId } });
            if (agent?.email) {
              await dispatchNotification({
                type: 'delivery_ready',
                to: [agent.email],
                subject: `Delivery Ready for Scheduling — ${order.orderNo}`,
                data: { orderNo: order.orderNo, vehicleModel: order.vehicleModel, customerName: order.customerName },
                ctas: [
                  { label: 'View Order', url: `${env.urls.admin}/orders/${order.id}` },
                ],
              });
            }
          } catch (err: any) {
            console.error('[DELIVERY AGENT NOTIFICATION ERROR]', err.message);
          }
        }
        // Notify managers
        try {
          const managers = await prisma.user.findMany({ where: { role: { in: ['manager', 'sales_manager', 'admin'] }, isActive: true } });
          const managerEmails = managers.map(m => m.email).filter(Boolean);
          if (managerEmails.length) {
            await dispatchNotification({
              type: 'delivery_ready',
              to: managerEmails,
              subject: `Vehicle Ready for Delivery — ${order.orderNo}`,
              data: { orderNo: order.orderNo, vehicleModel: order.vehicleModel, customerName: order.customerName },
              ctas: [
                { label: 'View Order', url: `${env.urls.admin}/orders/${order.id}` },
              ],
            });
          }
        } catch (err: any) {
          console.error('[DELIVERY MANAGER NOTIFICATION ERROR]', err.message);
        }
      }

      // Auto-register the warranty once the order is actually DELIVERED
      // (registerWarranty's own docstring always claimed this happened
      // automatically, but nothing called it — this was the only call
      // site). Best-effort: registerWarranty already guards against
      // double-registration, and a failure here shouldn't undo the
      // delivery transition itself. The manual "Register Warranty" admin
      // button remains as a fallback/correction path.
      if (toStatus === 'DELIVERED') {
        try {
          await warrantyService.registerWarranty(id);
        } catch (warrantyError: any) {
          console.error('[AUTO WARRANTY REGISTRATION ERROR]', warrantyError.message);
        }
        try {
          await loyaltyService.earnPoints({
            customerPhone: order.customerPhone,
            customerName: order.customerName,
            amount: order.totalPrice ?? 0,
            reason: `Vehicle purchase — ${order.orderNo}`,
            sourceType: 'SALES_ORDER',
            sourceId: id,
          });
        } catch (loyaltyError: any) {
          console.error('[AUTO LOYALTY EARN ERROR]', loyaltyError.message);
        }
        try {
          await registerCustomerVehicleOwnership(order);
        } catch (ownershipError: any) {
          console.error('[AUTO CUSTOMER VEHICLE ERROR]', ownershipError.message);
        }
        if (order.customerEmail) {
          try {
            await dispatchNotification({
              type: 'delivered',
              to: [order.customerEmail],
              subject: `Congratulations! Your ${order.vehicleModel} Has Been Delivered`,
              data: { orderNo: order.orderNo, vehicleModel: order.vehicleModel, customerName: order.customerName },
              ctas: [{ label: 'Check Order Status', url: `${env.urls.site}/status?ref=${encodeURIComponent(order.orderNo)}` }],
            });
          } catch (notifyError: any) {
            console.error('[DELIVERED NOTIFICATION ERROR]', notifyError.message);
          }
        }

        // Notify sales agent of delivery
        if (order.salesAgentId) {
          try {
            const agent = await prisma.user.findUnique({ where: { id: order.salesAgentId } });
            if (agent?.email) {
              await dispatchNotification({
                type: 'delivered',
                to: [agent.email],
                subject: `Vehicle Delivered — ${order.orderNo}`,
                data: { orderNo: order.orderNo, vehicleModel: order.vehicleModel, customerName: order.customerName },
              });
            }
          } catch (agentError: any) {
            console.error('[DELIVERED AGENT NOTIFICATION ERROR]', agentError.message);
          }
        }

        // Notify managers of delivery
        try {
          const managers = await prisma.user.findMany({
            where: { role: { in: ['manager', 'sales_manager', 'admin', 'gm_geely'] }, isActive: true },
            select: { email: true },
          });
          const managerEmails = managers.map((m) => m.email).filter(Boolean);
          if (managerEmails.length > 0) {
            await dispatchNotification({
              type: 'delivered',
              to: managerEmails,
              subject: `Vehicle Delivered — ${order.orderNo}`,
              data: { orderNo: order.orderNo, vehicleModel: order.vehicleModel, customerName: order.customerName },
            });
          }
        } catch (managerError: any) {
          console.error('[DELIVERED MANAGER NOTIFICATION ERROR]', managerError.message);
        }
      }

      return { ok: true, data: result };
    } catch (error: any) {
      console.error('[ORDER STATE TRANSITION WITH COMMISSION ERROR]', error.message);
      return { ok: false, error: 'Failed to transition order status.' };
    }
  },

  async updatePdiItem(
    itemId: string,
    orderId: string,
    data: { result: 'PENDING' | 'PASS' | 'FAIL' | 'NA'; photoUrls?: string[]; notes?: string; checkedById?: string }
  ): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const item = await salesOrderRepository.findPdiItem(itemId, orderId);
      if (!item) return { ok: false, error: 'PDI item not found.' };

      // isChecked is kept in sync (true iff PASS/NA) for any other reader
      // of the plain checked/unchecked flag (the delivery gate below, the
      // order-list summary) — `result` is the real source of truth,
      // distinguishing "not yet inspected" from "inspected and failed".
      const isChecked = data.result === 'PASS' || data.result === 'NA';
      // A FAIL -> PASS/NA transition is the reinspection loop the workflow
      // spec describes (fail -> repair -> reinspect -> pass) — stamp when
      // that resolution actually happens.
      const wasFail = item.result === 'FAIL';

      const updated = await salesOrderRepository.updatePdiItem(itemId, {
        result: data.result,
        isChecked,
        ...(data.photoUrls !== undefined && { photoUrls: data.photoUrls }),
        ...(data.notes !== undefined && { notes: data.notes }),
        checkedById: data.result !== 'PENDING' ? (data.checkedById ?? null) : null,
        checkedAt: data.result !== 'PENDING' ? new Date() : null,
        ...(wasFail && isChecked && {
          resolvedAt: new Date(),
          resolvedById: data.checkedById ?? null,
        }),
      });

      // Step 13: Notify when PDI is 100% complete
      if (isChecked) {
        try {
          const fullOrder = await salesOrderRepository.findByIdWithPdiItems(orderId);
          if (fullOrder) {
            const pdiTotal = fullOrder.pdiItems?.length ?? 0;
            const pdiChecked = fullOrder.pdiItems?.filter((p: any) => p.isChecked).length ?? 0;
            if (pdiTotal > 0 && pdiChecked === pdiTotal) {
              const staffEmails: string[] = [];
              if (fullOrder.salesAgentId) {
                const agent = await prisma.user.findUnique({ where: { id: fullOrder.salesAgentId } });
                if (agent?.email) staffEmails.push(agent.email);
              }
              const managers = await prisma.user.findMany({ where: { role: { in: ['manager', 'sales_manager', 'admin'] }, isActive: true }, select: { email: true } });
              staffEmails.push(...managers.map(m => m.email).filter(Boolean));
              const serviceUsers = await prisma.user.findMany({ where: { role: { in: ['service', 'service_advisor', 'technician'] }, isActive: true }, select: { email: true } });
              staffEmails.push(...serviceUsers.map(s => s.email).filter(Boolean));
              const uniqueEmails = [...new Set(staffEmails)];
              if (uniqueEmails.length > 0) {
                await dispatchNotification({
                  type: 'order_status',
                  to: uniqueEmails,
                  subject: `PDI Complete — ${fullOrder.orderNo}`,
                  data: {
                    orderNo: fullOrder.orderNo,
                    customerName: fullOrder.customerName,
                    vehicleModel: fullOrder.vehicleModel,
                    nextStep: 'All PDI items have passed. Order is ready for delivery preparation.',
                    adminLink: `${env.urls.admin}/orders/${fullOrder.id}`,
                  },
                  ctas: [{ label: 'View Order', url: `${env.urls.admin}/orders/${fullOrder.id}` }],
                  inApp: {
                    type: 'order_update',
                    title: 'PDI Complete',
                    body: `PDI checklist for order ${fullOrder.orderNo} (${fullOrder.customerName}) is 100% complete. Order is ready for delivery preparation.`,
                    link: `/admin/orders/${fullOrder.id}`,
                    orderId: fullOrder.id,
                    relatedModel: 'order',
                    relatedId: fullOrder.id,
                    priority: 'normal',
                  },
                });
              }
            }
          }
        } catch (pdiNotifyError: any) {
          console.error('[PDI COMPLETE NOTIFICATION ERROR]', pdiNotifyError.message);
        }
      }

      return { ok: true, data: updated };
    } catch (error: any) {
      console.error('[PDI UPDATE ERROR]', error.message);
      return { ok: false, error: 'Failed to update PDI item.' };
    }
  },

  async getOrderWithPdiItems(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findByIdWithPdiItems(id);
      if (!order) return { ok: false, error: 'Order not found.' };
      return { ok: true, data: order };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch order PDI items.' };
    }
  },

  async getStatusByOrderNo(orderNo: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await salesOrderRepository.findByOrderNoForStatus(orderNo);
      if (!order) return { ok: false, error: 'Order not found.' };
      return { ok: true, data: order };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch order status.' };
    }
  },
};