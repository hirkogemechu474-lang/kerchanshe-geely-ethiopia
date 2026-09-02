import { generateSalesQuotationPdf } from '../pdf/salesQuotation.pdf';
import { quotationRepository } from '../../repositories';

// Quotation has no `totalPrice` column — the structured price lives across
// unitPrice/quantity/discountAmount/vatAmount (see QuotationPdfPanel.tsx,
// which computes and displays the same total client-side, and
// convertQuotationToOrder.service.ts which mirrors this formula).
function computeQuotationTotal(quotation: { unitPrice: number | null; quantity: number | null; discountAmount: number | null; vatAmount: number | null }): number {
  if (quotation.unitPrice == null) return 0;
  return quotation.unitPrice * (quotation.quantity ?? 1) - (quotation.discountAmount ?? 0) + (quotation.vatAmount ?? 0);
}

export const quotationPdfService = {
  async generatePdf(quotationId: string): Promise<{ ok: boolean; data?: Buffer; error?: string }> {
    try {
      const quotation = await quotationRepository.findById(quotationId);
      if (!quotation) return { ok: false, error: 'Quotation not found.' };
      if (!quotation.quotationNo) return { ok: false, error: 'This quotation has not been generated yet.' };

      const totalPrice = computeQuotationTotal(quotation);
      const vehicleModel = quotation.vehicleModel || 'General enquiry';

      const pdfBuffer = await generateSalesQuotationPdf({
        quotationNo: quotation.quotationNo,
        customerName: quotation.customerName,
        vehicleModel,
        totalPrice,
        items: [
          { description: vehicleModel, amount: totalPrice },
        ],
      });

      return { ok: true, data: pdfBuffer };
    } catch (error: any) {
      console.error('[QUOTATION PDF ERROR]', error.message);
      return { ok: false, error: 'Failed to generate PDF.' };
    }
  },

  async generatePdfByReference(reference: string): Promise<{ ok: boolean; data?: Buffer; error?: string }> {
    try {
      const quotation = await quotationRepository.findByReference(reference);
      if (!quotation) return { ok: false, error: 'Quotation not found.' };

      return this.generatePdf(quotation.id);
    } catch (error: any) {
      return { ok: false, error: 'Failed to generate PDF.' };
    }
  },
};
