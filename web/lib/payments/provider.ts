/**
 * Payment provider boundary.
 *
 * The current provider intentionally remains mock-only. Keeping the
 * contract separate means Chapa, Telebirr, or another provider can be added
 * later without changing checkout validation or customer-facing flows.
 */
export type PaymentRequest = {
  amount: number;
  currency: string;
  customerEmail?: string;
  vehicleId?: string;
  vehicleName?: string;
  programId?: string;
  programName?: string;
};

export type PaymentResult = {
  status: 'succeeded' | 'declined';
  transactionId: string;
  processedAt?: string;
  error?: string;
};

export interface PaymentProvider {
  createPayment(request: PaymentRequest, signal?: string | null): Promise<PaymentResult>;
}

const transactionId = () => `txn_${crypto.randomUUID().replaceAll('-', '').slice(0, 16)}`;

export const mockPaymentProvider: PaymentProvider = {
  async createPayment(_request, signal) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    if (signal === 'declined') {
      return {
        status: 'declined',
        transactionId: transactionId(),
        error: 'The payment provider declined this transaction.',
      };
    }
    return {
      status: 'succeeded',
      transactionId: transactionId(),
      processedAt: new Date().toISOString(),
    };
  },
};

export function getPaymentProvider(): PaymentProvider {
  // Keep the switch explicit. Unknown providers must never silently fall
  // back to a live-looking payment implementation.
  return (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase() === 'mock'
    ? mockPaymentProvider
    : mockPaymentProvider;
}
