import { generateSalesQuotationPdf } from '../pdf/salesQuotation.pdf';
import { quotationRepository } from '../../repositories';
import { formatCurrency } from '../../utils/formatting';

export const quotationPdfService = {
  async generatePdf(quotationId: string): Promise<{ ok: boolean; data?: Buffer; error?: string }> {
    try {
      const quotation = await quotationRepository.findById(quotationId);
      if (!quotation) return { ok: false, error: 'Quotation not found.' };

      const pdfBuffer = await generateSalesQuotationPdf({
        quotationNo: quotation.quotationNo,
        customerName: quotation.customerName,
        vehicleModel: quotation.vehicleModel,
        totalPrice: quotation.totalPrice || 0,
        items: [
          { description: quotation.vehicleModel, amount: quotation.totalPrice || 0 },
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
