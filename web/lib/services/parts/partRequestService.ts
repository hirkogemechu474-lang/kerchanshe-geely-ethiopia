import { partRequestRepository } from '@/repositories/partRequestRepository';
import { sendFormEmail } from '@/lib/form-email';
import { generateReference, REFERENCE_CATEGORY } from '@/lib/reference';

export type SubmitPartRequestResult =
  | { ok: true; request: any; reference: string; notificationSent: boolean }
  | { ok: false; error: string };

// Submit a parts request / quote from the public parts page cart.
export async function submitPartRequest(body: any): Promise<SubmitPartRequestResult> {
  const { name, company, phone, email, address, notes, items } = body;

  if (!name || !phone || !email) {
    return { ok: false, error: 'Name, phone and email are required' };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: 'At least one part is required' };
  }

  // Normalize items
  const normalizedItems = items.map((item: any) => ({
    partId: item.partId || null,
    partName: item.partName || 'Unknown part',
    partSku: item.partSku || null,
    unitPrice: Number(item.unitPrice) || 0,
    quantity: Math.max(1, Number(item.quantity) || 1),
  }));

  const reference = await generateReference(REFERENCE_CATEGORY.PARTS_REQUEST);
  const partRequest = await partRequestRepository.create({
    name,
    company: company || null,
    phone,
    email,
    address: address || null,
    notes: notes || null,
    status: 'new',
    reference,
    items: {
      create: normalizedItems,
    },
  });

  let notificationSent = false;
  try {
    notificationSent = await sendFormEmail({
      type: 'parts request',
      name,
      email,
      phone,
      subject: `New parts request${company ? ` — ${company}` : ''}`,
      reference,
      details: JSON.stringify({ address, notes, items: normalizedItems }, null, 2),
    });
  } catch (emailError) {
    console.error('[parts-request:email]', emailError);
  }

  return { ok: true, request: partRequest, reference, notificationSent };
}
