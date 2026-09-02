export async function generateBrochurePdf(data: {
  vehicleName: string;
  model: string;
  specifications: Record<string, string>;
  images: string[];
}): Promise<Buffer> {
  console.log(`[PDF STUB] Brochure ${data.vehicleName} - real PDF generation stays in consuming apps`);
  return Buffer.from(`placeholder-pdf-${data.vehicleName}`);
}
