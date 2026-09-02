export async function generateSalesAgreementPdf(data: {
  orderNo: string;
  customerName: string;
  vehicleModel: string;
  totalPrice: number;
}): Promise<Buffer> {
  console.log(`[PDF STUB] Sales Agreement ${data.orderNo} - real PDF generation stays in consuming apps`);
  return Buffer.from(`placeholder-pdf-${data.orderNo}`);
}
