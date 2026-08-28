import { messageRepository } from '@/repositories/messageRepository';
import { sendFormEmail } from '@/lib/form-email';
import { generateReference, REFERENCE_CATEGORY } from '@/lib/reference';
import { nextSalesRep } from '@/lib/assignSalesRep';

export interface TradeInInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentMake: string;
  currentModel: string;
  currentYear: string;
  currentMileage: string;
  currentCondition: string;
  vin?: string;
  hasAccidents: string;
  hasModifications: string;
  serviceHistory: string;
  interestedModel: string;
  purchaseTimeframe: string;
  financingNeeded: string;
  additionalInfo?: string;
}

// There is no dedicated TradeIn table — this reuses the same generic
// Message-backed pattern as other lead-capture forms, storing the full
// vehicle-condition questionnaire as JSON in `content` so sales staff see
// every field the customer entered, not just a summary line.
export async function submitTradeInRequest(body: TradeInInput) {
  const reference = await generateReference(REFERENCE_CATEGORY.TRADE_IN);
  const name = `${body.firstName} ${body.lastName}`.trim();
  const currentVehicle = `${body.currentYear} ${body.currentMake} ${body.currentModel}`.trim();

  const assignedRep = await nextSalesRep();

  await messageRepository.create({
    from: name,
    email: body.email,
    subject: `Trade-In Request: ${currentVehicle} → ${body.interestedModel}`,
    category: 'Trade-In',
    priority: 'medium',
    status: 'unread',
    reference,
    content: JSON.stringify({
      phone: body.phone,
      currentVehicle: {
        make: body.currentMake,
        model: body.currentModel,
        year: body.currentYear,
        mileage: body.currentMileage,
        condition: body.currentCondition,
        vin: body.vin || null,
        hasAccidents: body.hasAccidents,
        hasModifications: body.hasModifications,
        serviceHistory: body.serviceHistory,
      },
      interestedModel: body.interestedModel,
      purchaseTimeframe: body.purchaseTimeframe,
      financingNeeded: body.financingNeeded,
      additionalInfo: body.additionalInfo || null,
      assignedSalesConsultant: assignedRep?.name ?? null,
    }),
  });

  let notificationSent = false;
  try {
    notificationSent = await sendFormEmail({
      type: 'trade-in request',
      name,
      email: body.email,
      phone: body.phone,
      reference,
      subject: `New trade-in request — ${currentVehicle} for ${body.interestedModel}`,
      details: [
        `Current vehicle: ${currentVehicle} (${body.currentMileage} km, ${body.currentCondition})`,
        body.vin ? `VIN: ${body.vin}` : '',
        `Accidents: ${body.hasAccidents} · Modifications: ${body.hasModifications} · Service history: ${body.serviceHistory}`,
        `Interested in: ${body.interestedModel}`,
        `Timeframe: ${body.purchaseTimeframe} · Financing needed: ${body.financingNeeded}`,
        body.additionalInfo ? `Notes: ${body.additionalInfo}` : '',
        assignedRep ? `Assigned Sales Consultant: ${assignedRep.name}` : '',
      ].filter(Boolean).join('\n'),
    });
  } catch (error) {
    console.error('[trade-in:email]', error);
  }

  return { reference, notificationSent };
}
