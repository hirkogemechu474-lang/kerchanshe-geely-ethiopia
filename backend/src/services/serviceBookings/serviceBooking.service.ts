import { serviceBookingRepository } from '../../repositories';
import { generateReference, REFERENCE_CATEGORY } from '../../utils/reference';
import { sendServiceBookingConfirmationEmail } from '../email/statusEmail';

export const serviceBookingService = {
  async list(params?: { status?: string; serviceType?: string }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const bookings = await serviceBookingRepository.findMany(params);
      return { ok: true, data: bookings };
    } catch (error: any) {
      console.error('[SERVICE BOOKING LIST ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch service bookings.' };
    }
  },

  async getById(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const booking = await serviceBookingRepository.findByIdWithJobCard(id);
      if (!booking) return { ok: false, error: 'Service booking not found.' };
      return { ok: true, data: booking };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch service booking.' };
    }
  },

  async create(data: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    serviceType: string;
    vehicleInfo: string;
    date: string;
    timeSlot: string;
    notes?: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const reference = await generateReference(REFERENCE_CATEGORY.SERVICE_BOOKING);

      const booking = await serviceBookingRepository.create({
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || '',
        serviceType: data.serviceType,
        vehicleInfo: data.vehicleInfo,
        date: new Date(data.date),
        notes: data.notes,
        reference,
        status: 'PENDING',
      });

      if (data.customerEmail) {
        await sendServiceBookingConfirmationEmail({
          to: data.customerEmail,
          customerName: data.customerName,
          reference,
          serviceType: data.serviceType,
          date: data.date,
          timeSlot: data.timeSlot,
          vehicleInfo: data.vehicleInfo,
        });
      }

      return { ok: true, data: booking };
    } catch (error: any) {
      console.error('[SERVICE BOOKING CREATE ERROR]', error.message);
      return { ok: false, error: 'Failed to create service booking.' };
    }
  },

  async updateStatus(id: string, status: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const booking = await serviceBookingRepository.findByIdWithJobCard(id);
      if (!booking) return { ok: false, error: 'Service booking not found.' };

      return { ok: true, data: booking };
    } catch (error: any) {
      return { ok: false, error: 'Failed to update service booking.' };
    }
  },

  async getStatusByReference(reference: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const booking = await serviceBookingRepository.findByReferenceForStatus(reference);
      if (!booking) return { ok: false, error: 'Service booking not found.' };
      return { ok: true, data: booking };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch status.' };
    }
  },

  async findTodayUnconverted(customerPhone: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      const booking = await serviceBookingRepository.findTodayUnconvertedByPhone(customerPhone, todayStart, todayEnd);
      return { ok: true, data: booking };
    } catch (error: any) {
      return { ok: false, error: 'Failed to find booking.' };
    }
  },
};
