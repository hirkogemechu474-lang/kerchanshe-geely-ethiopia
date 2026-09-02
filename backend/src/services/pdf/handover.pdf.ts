export async function generateHandoverPdf(data: {
  orderNo: string;
  customerName: string;
  vehicleModel: string;
  handoverDate: string;
}): Promise<Buffer> {
  console.log(`[PDF STUB] Handover ${data.orderNo} - real PDF generation stays in consuming apps`);
  return Buffer.from(`placeholder-pdf-${data.orderNo}`);
}
