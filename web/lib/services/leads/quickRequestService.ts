import { quotationRepository } from '@/repositories/quotationRepository';
import { sendFormEmail } from '@/lib/form-email';
import { generateReference, REFERENCE_CATEGORY } from '@/lib/reference';
import { nextSalesRep } from '@/lib/assignSalesRep';

export type SubmitQuickRequestResult =
  | { ok: true; reference: string; notificationSent: boolean }
  | { ok: false; error: string };

// The "one tap" alternative to the full quote form — name + phone only, no
// email/consent/financing/timeframe questions. Creates a real Quotation
// (source: 'quick-request') so it shows up in the normal admin pipeline,
// just tagged distinctly. Email is intentionally omitted (Quotation.email
// is nullable), so only the admin notification fires — sendFormEmail skips
// the customer confirmation when there's no address to send it to.
export async function submitQuickRequest(body: any): Promise<SubmitQuickRequestResult> {
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  const vehicleModel = String(body.vehicleModel || '').trim() || null;

  if (!name || !phone) {
    return { ok: false, error: 'Name and phone are required' };
  }

  const reference = await generateReference(REFERENCE_CATEGORY.QUOTATION);
  const assignedRep = await nextSalesRep();

  await quotationRepository.create({
    customerName: name,
    phoneNumber: phone,
    vehicleModel,
    source: 'quick-request',
    status: 'new',
    reference,
    assignedTo: assignedRep?.name ?? null,
  });

  let notificationSent = false;
  try {
    notificationSent = await sendFormEmail({
      type: 'callback request',
      name,
      phone,
      reference,
      subject: `New callback request${vehicleModel ? ` — ${vehicleModel}` : ''}`,
      details: [
        vehicleModel ? `Vehicle: ${vehicleModel}` : '',
        assignedRep ? `Assigned Sales Consultant: ${assignedRep.name}` : '',
      ].filter(Boolean).join('\n'),
    });
  } catch (error) {
    console.error('[quick-request:email]', error);
  }

  return { ok: true, reference, notificationSent };
}
