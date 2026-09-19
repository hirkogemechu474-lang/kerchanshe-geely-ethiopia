import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { rateLimiters } from '../utils/rateLimit';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';

const router = Router();

// GET /api/service-check-in/lookup — look up customer vehicle by VIN or plate
router.get('/lookup', rateLimiters.serviceCheckInLookup, async (req: Request, res: Response) => {
  try {
    const { vin, plateNo, phone } = req.query;
    if (!vin && !plateNo && !phone) {
      res.status(400).json({ error: 'Provide vin, plateNo, or phone query param.' });
      return;
    }

    let vehicle: any = null;
    let customer: any = null;
    let recentBookings: any[] = [];

    if (vin) {
      vehicle = await prisma.customerVehicle.findFirst({
        where: { vin: vin as string },
        include: { customer: true },
      });
    } else if (plateNo) {
      vehicle = await prisma.customerVehicle.findFirst({
        where: { plateNo: plateNo as string },
        include: { customer: true },
      });
    } else if (phone) {
      customer = await prisma.customer.findFirst({
        where: { phone: phone as string },
        include: { vehicles: true },
      });
      if (customer?.vehicles?.length) {
        vehicle = customer.vehicles[0];
      }
    }

    if (!vehicle && !customer) {
      res.status(404).json({ error: 'No vehicle or customer found.' });
      return;
    }

    // Find recent service bookings for this customer/vehicle
    const foundCustomer = vehicle?.customer ?? customer;
    if (foundCustomer) {
      recentBookings = await prisma.serviceBooking.findMany({
        where: {
          OR: [
            { customerPhone: foundCustomer.phone },
            { customerName: foundCustomer.fullName },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
    }

    // Find any open job cards
    const openJobCards = await prisma.jobCard.findMany({
      where: {
        OR: [
          { vin: vehicle?.vin || undefined },
          { plateNo: vehicle?.plateNo || undefined },
        ],
        status: { notIn: ['INVOICED_CLOSED', 'CANCELLED'] },
      },
      orderBy: { openTs: 'desc' },
      take: 3,
    });

    res.json({
      vehicle: vehicle ? {
        id: vehicle.id,
        vin: vehicle.vin,
        plateNo: vehicle.plateNo,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        mileageLastKnown: vehicle.mileageLastKnown,
        lastServiceDate: vehicle.lastServiceDate,
      } : null,
      customer: vehicle?.customer ? {
        id: vehicle.customer.id,
        fullName: vehicle.customer.fullName,
        phone: vehicle.customer.phone,
        email: vehicle.customer.email,
      } : customer ? {
        id: customer.id,
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
      } : null,
      recentBookings,
      openJobCards,
    });
  } catch (error) {
    console.error('Service check-in lookup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/service-check-in — check in a vehicle for service
router.post('/', rateLimiters.serviceCheckIn, async (req: Request, res: Response) => {
  try {
    const {
      vin, plateNo, customerName, customerPhone, customerEmail,
      vehicleMake, vehicleModel, vehicleYear, vehicleColor,
      serviceType, complaintText, estimatedArrival,
    } = req.body;

    if (!customerName || !customerPhone) {
      res.status(400).json({ error: 'customerName and customerPhone are required.' });
      return;
    }

    // Find or create customer
    let customer = await prisma.customer.findFirst({ where: { phone: customerPhone } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          fullName: customerName,
          phone: customerPhone,
          email: customerEmail || null,
        },
      });
    }

    // Find or create customer vehicle
    let customerVehicle: any = null;
    if (vin || plateNo) {
      customerVehicle = await prisma.customerVehicle.findFirst({
        where: {
          OR: [
            vin ? { vin } : undefined,
            plateNo ? { plateNo } : undefined,
          ].filter(Boolean) as any[],
        },
      });

      // plateNo is required on CustomerVehicle; fall back to VIN if absent
      const resolvedPlateNo = (plateNo as string) || (vin as string) || `UNREG-${customer.id.slice(0, 8)}`;
      if (!customerVehicle) {
        customerVehicle = await prisma.customerVehicle.create({
          data: {
            customerId: customer.id,
            vin: vin || null,
            plateNo: resolvedPlateNo,
            make: vehicleMake || 'Geely',
            model: vehicleModel || null,
            year: vehicleYear ? parseInt(vehicleYear) : null,
            color: vehicleColor || null,
          },
        });
      }
    }

    // Check for existing open job card for this vehicle
    if (vin || plateNo) {
      const existingJobCard = await prisma.jobCard.findFirst({
        where: {
          OR: [
            vin ? { vin } : undefined,
            plateNo ? { plateNo } : undefined,
          ].filter(Boolean) as any[],
          status: { notIn: ['INVOICED_CLOSED', 'CANCELLED'] },
        },
      });

      if (existingJobCard) {
        res.status(409).json({
          error: 'Vehicle already checked in.',
          jobCardNo: existingJobCard.jobCardNo,
          jobCardId: existingJobCard.id,
          status: existingJobCard.status,
        });
        return;
      }
    }

    // Create a ServiceBooking (to be converted to JobCard by workshop)
    const { generateReference, REFERENCE_CATEGORY } = await import('../utils/reference.js');
    const reference = await generateReference(REFERENCE_CATEGORY.SERVICE_BOOKING);

    const booking = await prisma.serviceBooking.create({
      data: {
        reference,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        vehicleInfo: `${vehicleMake || 'Geely'} ${vehicleModel || ''} ${vehicleYear || ''}`.trim(),
        serviceType: serviceType || 'general-service',
        date: estimatedArrival ? new Date(estimatedArrival) : new Date(),
        status: 'checked-in',
      },
    });

    res.status(201).json({
      success: true,
      booking,
      customer: {
        id: customer.id,
        fullName: customer.fullName,
      },
      vehicle: customerVehicle ? {
        id: customerVehicle.id,
        vin: customerVehicle.vin,
        plateNo: customerVehicle.plateNo,
      } : null,
      message: 'Vehicle checked in. A workshop technician will create a job card shortly.',
    });
  } catch (error) {
    console.error('Service check-in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/service-check-in/queue — get current check-in queue (unconverted
// bookings). Unlike /lookup and POST / above (deliberately public — see
// apps/web/app/service-check-in/page.tsx, a self-service kiosk page that
// only ever calls those two), this one is only ever called by the admin
// front-desk view (ServiceCheckInList.tsx) and returns every waiting
// customer's name/phone/vehicle — it had no auth at all, so anyone could
// pull the day's full check-in queue with a bare curl.
router.get('/queue', requireAdminApiSession, requirePermission('canManageServiceBookings'), rateLimiters.serviceCheckIn, async (req: Request, res: Response) => {
  try {
    const bookings = await prisma.serviceBooking.findMany({
      where: {
        status: { in: ['scheduled', 'checked-in'] },
        jobCard: null,
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    const queuePosition = bookings.map((b: any, i: number) => ({
      ...b,
      queuePosition: i + 1,
    }));

    res.json({ queue: queuePosition, total: bookings.length });
  } catch (error) {
    console.error('Service check-in queue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as serviceCheckInRoutes };