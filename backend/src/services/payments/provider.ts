export interface PaymentProvider {
  createPayment(data: {
    amount: number;
    currency: string;
    orderId: string;
    customerEmail: string;
    customerName: string;
    description: string;
  }): Promise<{ ok: boolean; paymentUrl?: string; transactionId?: string; error?: string }>;

  verifyPayment(transactionId: string): Promise<{ ok: boolean; status: string; error?: string }>;
}

class MockPaymentProvider implements PaymentProvider {
  async createPayment(data: {
    amount: number;
    currency: string;
    orderId: string;
    customerEmail: string;
    customerName: string;
    description: string;
  }): Promise<{ ok: boolean; paymentUrl?: string; transactionId?: string; error?: string }> {
    console.log(`[MOCK PAYMENT] Creating payment for order ${data.orderId}: ${data.amount} ${data.currency}`);
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    return {
      ok: true,
      paymentUrl: `https://mock-payment.example.com/pay/${transactionId}`,
      transactionId,
    };
  }

  async verifyPayment(transactionId: string): Promise<{ ok: boolean; status: string; error?: string }> {
    console.log(`[MOCK PAYMENT] Verifying payment ${transactionId}`);
    return { ok: true, status: 'COMPLETED' };
  }
}

let provider: PaymentProvider = new MockPaymentProvider();

export function getPaymentProvider(): PaymentProvider {
  return provider;
}

export function setPaymentProvider(customProvider: PaymentProvider): void {
  provider = customProvider;
}
