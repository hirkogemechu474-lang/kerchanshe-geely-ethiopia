import { testDriveRepository } from '@/repositories/testDriveRepository';
import { messageRepository } from '@/repositories/messageRepository';
import { vehicleRepository } from '@/repositories/vehicleRepository';
import { sendFormEmail } from '@/lib/form-email';
import { generateReference, REFERENCE_CATEGORY, type ReferenceCategory } from '@/lib/reference';
import { nextSalesRep } from '@/lib/assignSalesRep';

export interface LeadData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  leadSource: string;
  leadType: 'test-drive' | 'quote' | 'contact' | 'service';
  modelInterest?: string;
  vehicleId?: string;
  trimInterest?: string;
  message?: string;
  preferredDealer?: string;
  preferredDate?: string;
  preferredTime?: string;
  financingInterest?: boolean;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  pageUrl?: string;
  consentGiven: boolean;
}

const STATUS_MAP: Record<string, string> = {
  'test-drive': 'Test Drive Scheduled',
  'quote': 'Quote Requested',
  'contact': 'Contact Requested',
  'service': 'Service Inquiry',
};

const LEAD_TYPE_REFERENCE_CATEGORY: Record<LeadData['leadType'], ReferenceCategory> = {
  'test-drive': REFERENCE_CATEGORY.TEST_DRIVE,
  'quote': REFERENCE_CATEGORY.QUOTATION,
  'contact': REFERENCE_CATEGORY.CONTACT,
  'service': REFERENCE_CATEGORY.SERVICE_INQUIRY,
};

async function saveLocalLead(
  leadData: LeadData,
  reference: string,
  assignedRep: { id: string; name: string } | null
): Promise<{ testDriveId?: string }> {
  if (leadData.leadType === 'test-drive') {
    const vehicle = await vehicleRepository.findByIdOrNameOrSlug({
      id: leadData.vehicleId,
      nameOrSlug: leadData.modelInterest,
    });
    if (vehicle && leadData.preferredDate && leadData.preferredTime) {
      const preferredDate = new Date(`${leadData.preferredDate}T00:00:00`);
      const testDrive = await testDriveRepository.create({
        customerName: `${leadData.firstName} ${leadData.lastName}`.trim(),
        customerEmail: leadData.email,
        customerPhone: leadData.phone,
        vehicle: { connect: { id: vehicle.id } },
        preferredDate,
        preferredTime: leadData.preferredTime,
        location: leadData.preferredDealer || 'To be confirmed',
        specialRequests: leadData.message || null,
        status: 'pending',
        reference,
        salesRepId: assignedRep?.id ?? null,
      });
      return { testDriveId: testDrive.id };
    }
  }
  await messageRepository.create({
    from: `${leadData.firstName} ${leadData.lastName}`.trim(),
    email: leadData.email,
    subject: `${STATUS_MAP[leadData.leadType] || 'Website'}: ${leadData.modelInterest || 'Customer enquiry'}`,
    category: leadData.leadType === 'test-drive' ? 'Test Drive' : leadData.leadType,
    priority: 'medium',
    status: 'unread',
    content: JSON.stringify({ phone: leadData.phone, modelInterest: leadData.modelInterest, preferredDealer: leadData.preferredDealer, preferredDate: leadData.preferredDate, preferredTime: leadData.preferredTime, message: leadData.message }),
    reference,
  });
  return {};
}

export type SubmitLeadResult =
  | { ok: true; notificationSent: boolean; reference: string; testDriveId?: string }
  | { ok: false; httpStatus: 500; error: string };

export async function submitCrmLead(leadData: LeadData): Promise<SubmitLeadResult> {
  const reference = await generateReference(LEAD_TYPE_REFERENCE_CATEGORY[leadData.leadType]);
  const assignedRep = leadData.leadType === 'test-drive' ? await nextSalesRep(leadData.preferredDealer) : null;

  let saved: { testDriveId?: string };
  try {
    saved = await saveLocalLead(leadData, reference, assignedRep);
  } catch (error) {
    console.error('[crm/lead] Failed to save local lead:', error);
    return { ok: false, httpStatus: 500, error: 'Could not save your request. Please try again.' };
  }

  let notificationSent = false;
  try {
    notificationSent = await sendFormEmail({
      type: leadData.leadType,
      name: `${leadData.firstName} ${leadData.lastName}`.trim(),
      email: leadData.email,
      phone: leadData.phone,
      reference,
      subject: `${STATUS_MAP[leadData.leadType] || 'Website enquiry'}${leadData.modelInterest ? ` — ${leadData.modelInterest}` : ''}`,
      details: JSON.stringify({ model: leadData.modelInterest, dealer: leadData.preferredDealer, date: leadData.preferredDate, time: leadData.preferredTime, message: leadData.message, assignedSalesConsultant: assignedRep?.name }, null, 2),
    });
  } catch (error) {
    console.error('[crm/lead:email]', error);
  }

  return { ok: true, notificationSent, reference, testDriveId: saved.testDriveId };
}
