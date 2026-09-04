import { prisma } from '../../config/database';
import { dispatchNotification } from '../email/notifications.dispatch';

export const warrantyService = {
  /**
   * Register warranty on vehicle delivery.
   * Called automatically when order status reaches DELIVERED.
   */
  async registerWarranty(orderId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const order = await prisma.salesOrder.findUnique({ where: { id: orderId } });
      if (!order) return { ok: false, error: 'Order not found.' };
      if (order.status !== 'DELIVERED') return { ok: false, error: 'Order must be DELIVERED to register warranty.' };

      // Check if warranty already exists
      const existing = await prisma.warranty.findUnique({ where: { orderId } });
      if (existing) return { ok: false, error: 'Warranty already registered for this order.' };

      const purchaseDate = order.deliveredAt || new Date();
      const warrantyStartDate = purchaseDate;
      const warrantyEndDate = new Date(purchaseDate.getTime() + 3 * 365 * 24 * 60 * 60 * 1000); // 3 years

      const warranty = await prisma.warranty.create({
        data: {
          orderId,
          vehicleModel: order.vehicleModel,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerEmail: order.customerEmail,
          purchaseDate,
          warrantyStartDate,
          warrantyEndDate,
          warrantyYears: 3,
          warrantyKm: 100000,
          currentKm: 0,
          status: 'ACTIVE',
          nextServiceDate: new Date(purchaseDate.getTime() + 6 * 30 * 24 * 60 * 60 * 1000), // 6 months
          nextServiceKm: 10000,
        },
      });

      // Send warranty registration email
      if (order.customerEmail) {
        await dispatchNotification({
          type: 'warranty_registered',
          to: [order.customerEmail],
          subject: `Warranty Registered - ${order.vehicleModel}`,
          data: {
            customerName: order.customerName,
            vehicleModel: order.vehicleModel,
            orderNo: order.orderNo,
            warrantyStart: warrantyStartDate.toLocaleDateString(),
            warrantyEnd: warrantyEndDate.toLocaleDateString(),
            warrantyYears: 3,
            warrantyKm: 100000,
            nextServiceDate: warranty.nextServiceDate?.toLocaleDateString(),
          },
        });
      }

      return { ok: true, data: warranty };
    } catch (error: any) {
      console.error('[WARRANTY REGISTER ERROR]', error.message);
      return { ok: false, error: 'Failed to register warranty.' };
    }
  },

  /**
   * Get warranty details.
   */
  async getWarranty(orderId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const warranty = await prisma.warranty.findUnique({
        where: { orderId },
        include: { serviceHistory: { orderBy: { serviceDate: 'desc' } } },
      });
      if (!warranty) return { ok: false, error: 'Warranty not found.' };
      return { ok: true, data: warranty };
    } catch (error: any) {
      console.error('[WARRANTY GET ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch warranty.' };
    }
  },

  /**
   * Get warranty by VIN.
   */
  async getWarrantyByVin(vin: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const warranty = await prisma.warranty.findFirst({
        where: { vin },
        include: { serviceHistory: { orderBy: { serviceDate: 'desc' } } },
      });
      if (!warranty) return { ok: false, error: 'Warranty not found for this VIN.' };
      return { ok: true, data: warranty };
    } catch (error: any) {
      console.error('[WARRANTY GET BY VIN ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch warranty.' };
    }
  },

  /**
   * Add service record to warranty.
   */
  async addServiceRecord(
    warrantyId: string,
    data: {
      serviceDate: Date;
      serviceType: string;
      description?: string;
      kmAtService?: number;
      cost?: number;
      performedBy?: string;
      nextServiceDate?: Date;
      nextServiceKm?: number;
      documents?: any;
    }
  ): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const warranty = await prisma.warranty.findUnique({ where: { id: warrantyId } });
      if (!warranty) return { ok: false, error: 'Warranty not found.' };

      const record = await prisma.serviceRecord.create({
        data: {
          warrantyId,
          serviceDate: data.serviceDate,
          serviceType: data.serviceType,
          description: data.description,
          kmAtService: data.kmAtService,
          cost: data.cost,
          performedBy: data.performedBy,
          nextServiceDate: data.nextServiceDate,
          nextServiceKm: data.nextServiceKm,
          documents: data.documents,
        },
      });

      // Update warranty with latest service info
      await prisma.warranty.update({
        where: { id: warrantyId },
        data: {
          lastServiceDate: data.serviceDate,
          nextServiceDate: data.nextServiceDate || warranty.nextServiceDate,
          nextServiceKm: data.nextServiceKm || warranty.nextServiceKm,
          currentKm: data.kmAtService || warranty.currentKm,
        },
      });

      return { ok: true, data: record };
    } catch (error: any) {
      console.error('[WARRANTY ADD SERVICE ERROR]', error.message);
      return { ok: false, error: 'Failed to add service record.' };
    }
  },

  /**
   * Check for warranties with upcoming service dates.
   */
  async getUpcomingServices(daysAhead: number = 30): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const now = new Date();
      const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

      const warranties = await prisma.warranty.findMany({
        where: {
          status: 'ACTIVE',
          nextServiceDate: {
            gte: now,
            lte: futureDate,
          },
        },
        orderBy: { nextServiceDate: 'asc' },
      });

      return { ok: true, data: warranties };
    } catch (error: any) {
      console.error('[WARRANTY UPCOMING SERVICES ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch upcoming services.' };
    }
  },

  /**
   * Send service reminders for upcoming services.
   */
  async sendServiceReminders(): Promise<{ ok: boolean; sentCount: number }> {
    try {
      const upcoming = await this.getUpcomingServices(14); // 2 weeks ahead
      if (!upcoming.ok || !upcoming.data) return { ok: false, sentCount: 0 };

      let sentCount = 0;
      for (const warranty of upcoming.data) {
        if (warranty.customerEmail) {
          await dispatchNotification({
            type: 'service_reminder',
            to: [warranty.customerEmail],
            subject: `Service Reminder - ${warranty.vehicleModel}`,
            data: {
              customerName: warranty.customerName,
              vehicleModel: warranty.vehicleModel,
              nextServiceDate: warranty.nextServiceDate?.toLocaleDateString(),
              nextServiceKm: warranty.nextServiceKm,
            },
          });
          sentCount++;
        }
      }

      return { ok: true, sentCount };
    } catch (error: any) {
      console.error('[WARRANTY SEND REMINDERS ERROR]', error.message);
      return { ok: false, sentCount: 0 };
    }
  },

  /**
   * List warranties with filters.
   */
  async list(params: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 20;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (params.status) where.status = params.status;

      const [warranties, total] = await Promise.all([
        prisma.warranty.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
        prisma.warranty.count({ where }),
      ]);

      return {
        ok: true,
        data: {
          warranties,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } catch (error: any) {
      console.error('[WARRANTY LIST ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch warranties.' };
    }
  },
};