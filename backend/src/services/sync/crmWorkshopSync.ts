import { prisma } from '../../config/database';

/**
 * CRM ↔ Workshop Sync Service
 * Ensures that when a vehicle is delivered through the sales CRM,
 * it automatically appears in the customer's vehicle list for workshop service,
 * and vice-versa (workshop customers are available for sales follow-up).
 */
export const crmWorkshopSync = {
  /**
   * When a sales order reaches DELIVERED, auto-create Customer + CustomerVehicle
   * records so the workshop can look up the vehicle for service check-in.
   */
  async syncDeliveredVehicle(orderId: string): Promise<{ ok: boolean; customerId?: string; vehicleId?: string; error?: string }> {
    try {
      const order = await prisma.salesOrder.findUnique({ where: { id: orderId } });
      if (!order) return { ok: false, error: 'Order not found.' };

      // Find or create customer
      let customer = await prisma.customer.findFirst({
        where: { phone: order.customerPhone },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            fullName: order.customerName,
            phone: order.customerPhone,
            email: order.customerEmail || null,
          },
        });
      }

      // Extract vehicle details from configurationJson
      const config = order.configurationJson as any;
      const color = config?.color || null;

      // Find or create customer vehicle
      let vehicle = await prisma.customerVehicle.findFirst({
        where: { customerId: customer.id, model: order.vehicleModel },
      });

      if (!vehicle) {
        // plateNo is required on CustomerVehicle; fall back to VIN or a reg-pending marker
        const fallbackPlate = (config?.vin as string) || `UNREG-${order.orderNo}`;
        vehicle = await prisma.customerVehicle.create({
          data: {
            customerId: customer.id,
            make: 'Geely',
            model: order.vehicleModel,
            year: config?.year ? parseInt(config.year) : null,
            color,
            vin: config?.vin || null,
            plateNo: order.registrationNumber || fallbackPlate,
          },
        });
      }

      // Apply registration plate once the vehicle has been registered
      if (order.registrationNumber && vehicle.plateNo.startsWith('UNREG-')) {
        await prisma.customerVehicle.update({
          where: { id: vehicle.id },
          data: { plateNo: order.registrationNumber },
        });
      }

      return { ok: true, customerId: customer.id, vehicleId: vehicle.id };
    } catch (error: any) {
      console.error('[CRM WORKSHOP SYNC ERROR]', error.message);
      return { ok: false, error: 'Failed to sync delivered vehicle.' };
    }
  },

  /**
   * When a workshop job card is completed, update the customer vehicle's
   * lastServiceDate and mileage for CRM tracking.
   */
  async syncServiceCompletion(jobCardId: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const jobCard = await prisma.jobCard.findUnique({ where: { id: jobCardId } });
      if (!jobCard) return { ok: false, error: 'Job card not found.' };

      // Find the customer vehicle
      const vehicleWhere: any = {};
      if (jobCard.vin) vehicleWhere.vin = jobCard.vin;
      else if (jobCard.plateNo) vehicleWhere.plateNo = jobCard.plateNo;
      else return { ok: false, error: 'No VIN or plate number on job card.' };

      const vehicle = await prisma.customerVehicle.findFirst({ where: vehicleWhere });
      if (!vehicle) return { ok: false, error: 'Customer vehicle not found.' };

      await prisma.customerVehicle.update({
        where: { id: vehicle.id },
        data: {
          lastServiceDate: new Date(),
          mileageLastKnown: jobCard.mileage || vehicle.mileageLastKnown,
        },
      });

      return { ok: true };
    } catch (error: any) {
      console.error('[CRM SYNC SERVICE COMPLETION ERROR]', error.message);
      return { ok: false, error: 'Failed to sync service completion.' };
    }
  },

  /**
   * Get full customer 360° view — sales history + service history.
   */
  async getCustomer360(customerId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: { vehicles: true },
      });
      if (!customer) return { ok: false, error: 'Customer not found.' };

      // Get sales history (quotations + orders)
      const [quotations, orders] = await Promise.all([
        prisma.quotation.findMany({
          where: { phoneNumber: customer.phone },
          select: { id: true, reference: true, vehicleModel: true, status: true, createdAt: true, unitPrice: true },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.salesOrder.findMany({
          where: { customerPhone: customer.phone },
          select: { id: true, orderNo: true, vehicleModel: true, status: true, totalPrice: true, deliveredAt: true, commissionStatus: true },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      // Get service history
      const vehicleIds = customer.vehicles.map(v => v.id);
      const [jobCards, serviceBookings, warranty] = await Promise.all([
        prisma.jobCard.findMany({
          where: {
            OR: [
              { customerName: customer.fullName },
              { customerVehicleId: { in: vehicleIds } },
            ],
          },
          select: { id: true, jobCardNo: true, vehicleModel: true, status: true, complaintText: true, openTs: true, closeTs: true },
          orderBy: { openTs: 'desc' },
          take: 20,
        }),
        prisma.serviceBooking.findMany({
          where: { customerPhone: customer.phone },
          select: { id: true, reference: true, serviceType: true, status: true, date: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        orders.length > 0
          ? prisma.warranty.findFirst({
              where: { orderId: orders[0].id },
              select: { id: true, status: true, warrantyEndDate: true, nextServiceDate: true },
            })
          : null,
      ]);

      return {
        ok: true,
        data: {
          customer,
          sales: { quotations, orders },
          service: { jobCards, serviceBookings, warranty },
          summary: {
            totalOrders: orders.length,
            totalJobCards: jobCards.length,
            totalServiceBookings: serviceBookings.length,
            isActiveWarranty: warranty?.status === 'ACTIVE',
          },
        },
      };
    } catch (error: any) {
      console.error('[CRM 360 ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch customer 360 view.' };
    }
  },

  /**
   * Find sales opportunities from workshop customers — vehicles due for
   * service that might be candidates for trade-in or upgrade.
   */
  async findUpgradeOpportunities(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      // Vehicles older than 3 years with high mileage
      const currentYear = new Date().getFullYear();

      const vehicles = await prisma.customerVehicle.findMany({
        where: {
          OR: [
            { year: { lte: currentYear - 3 } },
            { mileageLastKnown: { gte: 80000 } },
          ],
        },
        include: { customer: true },
        take: 50,
      });

      const opportunities = vehicles.map(v => ({
        vehicleId: v.id,
        vin: v.vin,
        plateNo: v.plateNo,
        make: v.make,
        model: v.model,
        year: v.year,
        mileage: v.mileageLastKnown,
        customerId: v.customer?.id,
        customerName: v.customer?.fullName,
        customerPhone: v.customer?.phone,
        reason: v.mileageLastKnown && v.mileageLastKnown >= 80000 ? 'high-mileage' : 'age',
      }));

      return { ok: true, data: opportunities };
    } catch (error: any) {
      console.error('[FIND UPGRADE OPPORTUNITIES ERROR]', error.message);
      return { ok: false, error: 'Failed to find upgrade opportunities.' };
    }
  },
};