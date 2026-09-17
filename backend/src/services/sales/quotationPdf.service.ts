import { generateSalesQuotationPdf } from '../pdf/salesQuotation.pdf';
import { quotationRepository, userRepository } from '../../repositories';
import { getCompanyInfo } from '../pdf/companyInfo';
import { roleLabel, isManagerRole } from '../../utils/roleLabels';

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
      const company = await getCompanyInfo();
      // Prefer the signature URL stored on the Quotation at approval time,
      // falling back to the manager's staff profile signature.
      const manager = quotation.managerApprovedById ? await userRepository.findByIdSlim(quotation.managerApprovedById) : null;
      console.log('[QUOTATION PDF] managerApprovedById:', quotation.managerApprovedById, 'managerSignatureUrl:', (quotation as any).managerSignatureUrl, 'profileSignatureUrl:', manager?.signatureUrl);

      // The printed "Sales Executive" line must be a manager, never a plain
      // sales agent (QuotationPdfPanel.tsx enforces the same rule for the
      // admin form's default) — but this quotation may have been generated
      // before that rule existed, leaving a stale agent name saved directly
      // on the record. Re-derive it here too so an old, un-regenerated PDF
      // doesn't keep printing it. A saved value is trusted unless it exactly
      // matches the current assignee's own name while that assignee is a
      // plain agent (a clear sign it's leftover auto-fill, not a deliberate
      // manual entry).
      const assignedUser = quotation.assignedTo ? await userRepository.findById(quotation.assignedTo) : null;
      const assignedIsManager = isManagerRole(assignedUser?.role);
      const assignedManagerName = assignedIsManager ? assignedUser?.name ?? null : null;
      const assignedAgentName = assignedUser && !assignedIsManager ? assignedUser.name : null;
      // Prefers the quotation's approving manager (managerApprovedById —
      // only ever a manager, set by the actual approval action) over the
      // assignee, since an approved quotation's real signatory is whoever
      // approved it, not necessarily whoever it happens to be assigned to.
      const salesExecutiveName =
        (quotation.salesExecutiveName && quotation.salesExecutiveName !== assignedAgentName ? quotation.salesExecutiveName : null) ||
        manager?.name ||
        assignedManagerName ||
        null;

      const pdfBuffer = await generateSalesQuotationPdf({
        quotationNo: quotation.quotationNo,
        reference: quotation.reference,
        purchaserTitle: quotation.title,
        customerName: quotation.customerName,
        customerEmail: quotation.email,
        customerPhone: quotation.phoneNumber,
        customerTin: quotation.customerTin,
        customerAddress: quotation.customerAddress,
        vehicleModel,
        vehicleYear: quotation.vehicleYear,
        vehicleColor: quotation.vehicleColor,
        vehicleVariant: quotation.vehicleVariant,
        vehicleVin: quotation.vehicleVin,
        unitPrice: quotation.unitPrice,
        quantity: quotation.quantity,
        discountAmount: quotation.discountAmount,
        vatAmount: quotation.vatAmount,
        registrationCharge: quotation.registrationCharge,
        registrationResponsibility: quotation.registrationResponsibility,
        insuranceResponsibility: quotation.insuranceResponsibility,
        chargingEquipmentDetails: quotation.chargingEquipmentDetails,
        salesType: quotation.salesType,
        salesExecutiveName,
        depositAmount: quotation.depositAmount,
        depositDueDate: quotation.depositDueDate,
        balanceDueDate: quotation.balanceDueDate,
        deliveryLocation: quotation.deliveryLocation,
        expectedHandoverNote: quotation.expectedHandoverNote,
        paymentTerms: quotation.paymentTerms,
        deliveryTerms: quotation.deliveryTerms,
        validUntil: quotation.quotationValidUntil,
        issuedAt: quotation.quotationGeneratedAt,
        totalPrice,
        customerSignatureUrl: quotation.signedDocumentUrl,
        customerSignedAt: quotation.signedAt,
        managerSignatureUrl: (quotation as any).managerSignatureUrl || manager?.signatureUrl,
        managerStampUrl: manager?.stampUrl,
        managerSignerName: manager?.name,
        // Falls back to a role-derived label (e.g. "Sales Manager") when
        // this signer's own User.title hasn't been filled in, so the
        // printed Title line is never blank on a document a customer signs.
        managerSignerTitle: manager?.title || roleLabel(manager?.role),
        managerSignedAt: quotation.managerApprovedAt,
      }, company);

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
