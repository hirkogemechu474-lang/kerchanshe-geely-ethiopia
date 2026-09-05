export { loginService } from './auth/login.service';
export { registerService } from './auth/register.service';
export { passwordResetService } from './auth/passwordReset.service';

export { vehicleService } from './vehicles/vehicle.service';
export { brochureService } from './vehicles/brochure.service';
export { publicVehicleService } from './vehicles/publicVehicle.service';

export { orderService, orderStateMachine } from './sales/order.service';
export { orderAgreementService } from './sales/orderAgreement.service';
export { orderHandoverService } from './sales/orderHandover.service';
export { orderInvoiceService } from './sales/orderInvoice.service';
export { quotationService } from './sales/quotation.service';
export { quotationPdfService } from './sales/quotationPdf.service';
export { convertQuotationToOrderService } from './sales/convertQuotationToOrder.service';
export { vehicleAllocationService } from './sales/vehicleAllocation.service';
export { assignSalesRep } from './sales/assignSalesRep';
export { generateOrderNumber, parseOrderNumber, formatOrderNumber } from './sales/orderNumber';
export { getPdiChecklist, getPdiCategories, PDI_CHECKLIST_TEMPLATE } from './sales/pdiChecklist.template';

export { jobCardService } from './workshop/jobCard.service';
export { jobCardPartsService } from './workshop/jobCardParts.service';
export { jobCardStateMachineService } from './workshop/jobCardStateMachine';
export { bayService } from './workshop/bay.service';
export { technicianService } from './workshop/technician.service';
export { warrantyClaimService } from './workshop/warrantyClaim.service';
export { vehicleLookupService } from './workshop/vehicleLookup.service';
export { reorderAlertsService } from './workshop/reorderAlerts.service';
export { biSummaryService } from './workshop/biSummary.service';
export { dashboardSummaryService } from './workshop/dashboardSummary.service';

export { financingService } from './financing/financing.service';
export { FinancingApplicationService } from './financing/financingApplication.service';

export { sparePartService } from './parts/sparePart.service';
export { partsContentService } from './parts/partsContent.service';
export { partRequestService } from './parts/partRequest.service';
export { sparePartStockService } from './parts/sparePartStock.service';

export { customerService } from './customers/customer.service';
export { customerVehicleService } from './customers/customerVehicle.service';

export { dealerService } from './dealers/dealer.service';
export { publicDealerService } from './dealers/publicDealer.service';

export { settingService } from './settings/setting.service';
export { socialMediaService } from './settings/socialMedia.service';
export { policiesService } from './settings/policies.service';

export { homepageContentService } from './content/homepageContent.service';
export { publicContentService } from './content/publicContent.service';
export { contactInformationService } from './content/contactInformation.service';

export { mediaService } from './media/media.service';

export { uploadService } from './uploads/upload.service';

export { testDriveService } from './testDrives/testDrive.service';
export { publicTestDriveService } from './testDrives/publicTestDrive.service';

export { serviceBookingService } from './serviceBookings/serviceBooking.service';
export { convertToJobCardService } from './serviceBookings/convertToJobCard.service';

export { showroomVisitService } from './showroom/showroomVisit.service';

export { handoverService } from './handover/handover.service';

export { agreementService } from './agreements/agreement.service';

export { staffSignatureService } from './staffSignature/staffSignature.service';

export { csiSurveyService } from './csiSurvey/csiSurvey.service';

export { newsletterService } from './newsletter/newsletter.service';

export { searchService } from './search/search.service';

export { leadService } from './crm/lead.service';

export { getPaymentProvider, setPaymentProvider } from './payments/provider';
export { legacyPaymentService } from './payments/legacyPayment.service';
export { purchaseService } from './payments/purchase.service';

export { analyticsService } from './analytics/analytics.service';

export { reviewService } from './reviews/review.service';

export { messageService } from './messages/message.service';

export { promotionService } from './promotions/promotion.service';

export { getTransporter, sendEmail } from './email/smtp';
export {
  sendOrderStatusEmail,
  sendJobCardStatusEmail,
  sendTestDriveConfirmationEmail,
  sendServiceBookingConfirmationEmail,
  sendQuotationConfirmationEmail,
} from './email/statusEmail';
export { dispatchNotification } from './email/notifications.dispatch';
export {
  sendContactFormEmail,
  sendLeadFormEmail,
  sendPartsRequestEmail,
} from './email/formEmail';

export { generateSalesQuotationPdf } from './pdf/salesQuotation.pdf';
export { generateSalesAgreementPdf } from './pdf/salesAgreement.pdf';
export { generateSalesInvoicePdf } from './pdf/salesInvoice.pdf';
export { generateHandoverPdf } from './pdf/handover.pdf';
export { generateBrochurePdf } from './pdf/brochure.pdf';
