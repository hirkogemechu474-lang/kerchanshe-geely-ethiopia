export async function generateSalesQuotationPdf(data: {
  quotationNo: string;
  customerName: string;
  vehicleModel: string;
  totalPrice: number;
  items: Array<{ description: string; amount: number }>;
}): Promise<Buffer> {
  console.log(`[PDF STUB] Sales Quotation ${data.quotationNo} - real PDF generation stays in consuming apps`);
  return Buffer.from(`placeholder-pdf-${data.quotationNo}`);
}
