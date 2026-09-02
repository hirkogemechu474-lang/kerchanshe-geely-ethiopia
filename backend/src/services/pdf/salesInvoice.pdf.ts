export async function generateSalesInvoicePdf(data: {
  orderNo: string;
  customerName: string;
  vehicleModel: string;
  totalPrice: number;
  items: Array<{ description: string; amount: number }>;
}): Promise<Buffer> {
  console.log(`[PDF STUB] Sales Invoice ${data.orderNo} - real PDF generation stays in consuming apps`);
  return Buffer.from(`placeholder-pdf-${data.orderNo}`);
}
