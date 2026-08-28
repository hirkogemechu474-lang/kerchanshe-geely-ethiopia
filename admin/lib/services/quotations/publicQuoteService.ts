import { quotationRepository } from '@/repositories/quotationRepository';

export type SubmitQuoteResult =
  | { ok: true; quote: any }
  | { ok: false; httpStatus: 400; error: string };

// POST /api/public/quote — submit quote request from the web frontend.
export async function submitPublicQuoteRequest(body: any): Promise<SubmitQuoteResult> {
  const {
    firstName,
    lastName,
    email,
    phone,
    vehicleInterest,
    dealerPreference,
    financingType,
    tradeInVehicle,
    tradeInYear,
    tradeInMake,
    tradeInModel,
    message,
  } = body;

  if (!firstName || !lastName || !email || !phone || !vehicleInterest) {
    return { ok: false, httpStatus: 400, error: 'Missing required fields' };
  }

  const quote = await quotationRepository.create({
    customerName: `${firstName} ${lastName}`.trim(),
    email,
    phoneNumber: phone,
    vehicleModel: vehicleInterest,
    preferredDealer: dealerPreference || null,
    financingInterest: Boolean(financingType),
    tradeInInterest: Boolean(tradeInVehicle),
    message: [message, financingType, tradeInYear, tradeInMake, tradeInModel].filter(Boolean).join(' | ') || null,
    status: 'new',
  });

  return { ok: true, quote };
}
