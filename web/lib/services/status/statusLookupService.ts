import { quotationRepository } from '@/repositories/quotationRepository';
import { serviceBookingRepository } from '@/repositories/serviceBookingRepository';
import { testDriveRepository } from '@/repositories/testDriveRepository';
import { partRequestRepository } from '@/repositories/partRequestRepository';
import { messageRepository } from '@/repositories/messageRepository';
import { salesOrderRepository } from '@/repositories/salesOrderRepository';

export type StatusResult = {
  type: 'quotation' | 'service' | 'test-drive' | 'parts' | 'purchase' | 'financing' | 'enquiry' | 'order';
  label: string;
  reference: string;
  status: string;
  createdAt: string;
  quotationNo?: string | null;
};

// Looks up a customer-facing reference across every flow that issues one,
// so a single "check your status" page can serve quotes, purchases,
// service bookings, financing applications, parts requests, and test drives.
export async function lookupStatus(ref: string): Promise<StatusResult | null> {
  const [quotation, serviceBooking, testDrive, partRequest, message, order] = await Promise.all([
    quotationRepository.findByReferenceForStatus(ref),
    serviceBookingRepository.findByReferenceForStatus(ref),
    testDriveRepository.findByReferenceForStatus(ref),
    partRequestRepository.findByReferenceForStatus(ref),
    messageRepository.findByReferenceForStatus(ref),
    salesOrderRepository.findByOrderNoForStatus(ref),
  ]);

  if (quotation) {
    return {
      type: 'quotation',
      label: quotation.vehicleModel ? `Quote request — ${quotation.vehicleModel}` : 'Quote request',
      reference: ref,
      status: quotation.status,
      createdAt: quotation.createdAt.toISOString(),
      quotationNo: quotation.quotationNo,
    };
  }
  if (serviceBooking) {
    return {
      type: 'service',
      label: serviceBooking.serviceType ? `Service appointment — ${serviceBooking.serviceType}` : 'Service appointment',
      reference: ref,
      status: serviceBooking.status,
      createdAt: serviceBooking.createdAt.toISOString(),
    };
  }
  if (testDrive) {
    return {
      type: 'test-drive',
      label: 'Test drive booking',
      reference: ref,
      status: testDrive.status,
      createdAt: testDrive.createdAt.toISOString(),
    };
  }
  if (partRequest) {
    return {
      type: 'parts',
      label: 'Parts request',
      reference: ref,
      status: partRequest.status,
      createdAt: partRequest.createdAt.toISOString(),
    };
  }
  if (message) {
    return {
      type: message.category === 'Vehicle Purchase' ? 'purchase' : message.category === 'Financing' ? 'financing' : 'enquiry',
      label: message.category || 'Enquiry',
      reference: ref,
      status: message.status,
      createdAt: message.createdAt.toISOString(),
    };
  }
  if (order) {
    return {
      type: 'order',
      label: `Vehicle order — ${order.vehicleModel}`,
      reference: ref,
      // OrderStatus is a Prisma enum stored uppercase; lowercased here to
      // match the convention every other status value in this union uses.
      status: order.status.toLowerCase(),
      createdAt: order.createdAt.toISOString(),
    };
  }

  return null;
}
