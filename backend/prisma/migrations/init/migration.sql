-- CreateEnum
CREATE TYPE "QuotationApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PENDING_DISCOUNT');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('QUOTED', 'BOOKED', 'FINANCING_PENDING', 'READY_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FinancingStatus" AS ENUM ('NOT_REQUESTED', 'REQUESTED', 'DOCUMENTS_PENDING', 'DOCUMENTS_SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'CONDITIONALLY_APPROVED', 'REJECTED', 'CUSTOMER_DECLINED', 'DISBURSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('NOT_APPLICABLE', 'PENDING', 'EARNED', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING_REVIEW', 'PAID');

-- CreateEnum
CREATE TYPE "PdiItemResult" AS ENUM ('PENDING', 'PASS', 'FAIL', 'NA');

-- CreateEnum
CREATE TYPE "TechnicianSkillLevel" AS ENUM ('JUNIOR', 'INTERMEDIATE', 'SENIOR', 'MASTER');

-- CreateEnum
CREATE TYPE "BayType" AS ENUM ('GENERAL', 'DIAGNOSTIC', 'ALIGNMENT', 'QUICK_SERVICE', 'PDI');

-- CreateEnum
CREATE TYPE "BayStatus" AS ENUM ('FREE', 'OCCUPIED', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "JobCardStatus" AS ENUM ('DRAFT_CHECKIN', 'AWAITING_BAY', 'DIAGNOSIS_ESTIMATE', 'AWAITING_APPROVAL', 'IN_PROGRESS', 'PARTS_WAITING', 'QUALITY_CONTROL', 'INVOICED_CLOSED', 'RELEASED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "JobCardPartStatus" AS ENUM ('REQUESTED', 'ISSUED', 'BACKORDERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WarrantyClaimStatus" AS ENUM ('DRAFTED', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REIMBURSED');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "FinancingProgramStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SiteNavPlacement" AS ENUM ('TOP_NAV', 'MODELS_QUICK_ACTIONS');

-- CreateEnum
CREATE TYPE "VehicleAllocationStatus" AS ENUM ('RESERVED', 'ALLOCATED', 'RELEASED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "LoyaltyTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'VIP');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dealerId" TEXT,
    "avatarUrl" TEXT,
    "otpCode" TEXT,
    "otpExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "signatureUrl" TEXT,
    "signatureUpdatedAt" TIMESTAMP(3),
    "signatureSetupToken" TEXT,
    "signatureSetupTokenExpiresAt" TIMESTAMP(3),
    "isAvailableForLeads" BOOLEAN NOT NULL DEFAULT true,
    "leadHoursStart" INTEGER,
    "leadHoursEnd" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserVehicleBrand" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,

    CONSTRAINT "UserVehicleBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermissionOverride" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permissionKey" TEXT NOT NULL,
    "value" BOOLEAN NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "RolePermissionOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleBrand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "iconUrl" TEXT,
    "heroImageUrl" TEXT,
    "heroVideoUrl" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "brandId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "brandId" TEXT,
    "categoryId" TEXT,
    "description" TEXT,
    "images" JSONB NOT NULL,
    "specifications" JSONB NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "discountAmount" DOUBLE PRECISION,
    "discountType" TEXT,
    "badge" TEXT,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "finalPrice" DOUBLE PRECISION,
    "hidePrice" BOOLEAN NOT NULL DEFAULT false,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "reorderPoint" INTEGER,
    "warehouse" TEXT,
    "location" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "heroImageUrl" TEXT,
    "heroVideoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestDrive" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "nationalId" TEXT,
    "vehicleId" TEXT NOT NULL,
    "preferredDate" TIMESTAMP(3) NOT NULL,
    "preferredTime" TEXT NOT NULL,
    "alternativeDate" TIMESTAMP(3),
    "alternativeTime" TEXT,
    "location" TEXT NOT NULL,
    "salesRepId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "specialRequests" TEXT,
    "internalNotes" TEXT,
    "emailConfirm" BOOLEAN NOT NULL DEFAULT true,
    "smsReminder" BOOLEAN NOT NULL DEFAULT true,
    "salesOrderId" TEXT,
    "idDocumentType" TEXT,
    "idDocumentNumber" TEXT,
    "idPhotoUrl" TEXT,
    "idVerifiedAt" TIMESTAMP(3),
    "idVerifiedById" TEXT,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestDrive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShowroomVisit" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'started',
    "fullName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "selectedAction" TEXT,
    "quotationId" TEXT,
    "salesOrderId" TEXT,
    "testDriveId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "registeredAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShowroomVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "customerName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT,
    "nationalId" TEXT,
    "idDocumentType" TEXT,
    "idPhotoUrl" TEXT,
    "vehicleModel" TEXT,
    "preferredDealer" TEXT,
    "financingInterest" BOOLEAN NOT NULL DEFAULT false,
    "tradeInInterest" BOOLEAN NOT NULL DEFAULT false,
    "tradeInEvaluationId" TEXT,
    "message" TEXT,
    "source" TEXT NOT NULL DEFAULT 'website',
    "configurationJson" JSONB,
    "status" TEXT NOT NULL DEFAULT 'new',
    "internalNotes" TEXT,
    "assignedTo" TEXT,
    "reference" TEXT,
    "quotationNo" TEXT,
    "quotationValidUntil" TIMESTAMP(3),
    "unitPrice" DOUBLE PRECISION,
    "quantity" INTEGER DEFAULT 1,
    "discountAmount" DOUBLE PRECISION DEFAULT 0,
    "vatAmount" DOUBLE PRECISION,
    "vehicleYear" TEXT,
    "vehicleColor" TEXT,
    "paymentTerms" TEXT,
    "deliveryTerms" TEXT,
    "quotationGeneratedAt" TIMESTAMP(3),
    "managerApprovalStatus" "QuotationApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "managerApprovedById" TEXT,
    "managerApprovedAt" TIMESTAMP(3),
    "managerSignatureUrl" TEXT,
    "managerRejectedById" TEXT,
    "managerRejectedAt" TIMESTAMP(3),
    "managerRejectionReason" TEXT,
    "signedDocumentUrl" TEXT,
    "signedAt" TIMESTAMP(3),
    "salesType" TEXT,
    "salesExecutiveName" TEXT,
    "customerTin" TEXT,
    "customerAddress" TEXT,
    "vehicleVariant" TEXT,
    "vehicleVin" TEXT,
    "registrationCharge" DOUBLE PRECISION,
    "registrationResponsibility" TEXT,
    "insuranceResponsibility" TEXT,
    "chargingEquipmentDetails" TEXT,
    "depositAmount" DOUBLE PRECISION,
    "depositDueDate" TIMESTAMP(3),
    "balanceDueDate" TIMESTAMP(3),
    "deliveryLocation" TEXT,
    "expectedHandoverNote" TEXT,
    "pdfUrl" TEXT,
    "escalatedAt" TIMESTAMP(3),
    "escalatedById" TEXT,
    "escalationReason" TEXT,
    "escalatedFrom" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrder" (
    "id" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "quotationId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "vehicleModel" TEXT NOT NULL,
    "configurationJson" JSONB,
    "totalPrice" DOUBLE PRECISION,
    "financingStatus" "FinancingStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
    "status" "OrderStatus" NOT NULL DEFAULT 'QUOTED',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "handoverNotifiedAt" TIMESTAMP(3),
    "handoverSignedDocumentUrl" TEXT,
    "handoverSignedAt" TIMESTAMP(3),
    "handoverCountersignedAt" TIMESTAMP(3),
    "handoverCountersignedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "agreementSentAt" TIMESTAMP(3),
    "signedDocumentUrl" TEXT,
    "signedAt" TIMESTAMP(3),
    "countersignedAt" TIMESTAMP(3),
    "countersignedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectionReason" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "paymentProofUrl" TEXT,
    "paymentSubmittedAt" TIMESTAMP(3),
    "paymentConfirmedAt" TIMESTAMP(3),
    "paymentConfirmedById" TEXT,
    "paymentVerifiedAt" TIMESTAMP(3),
    "paymentVerifiedById" TEXT,
    "registrationNumber" TEXT,
    "registeredAt" TIMESTAMP(3),
    "registeredById" TEXT,
    "invoiceNo" TEXT,
    "invoiceAmount" DOUBLE PRECISION,
    "invoicedAt" TIMESTAMP(3),
    "invoicedById" TEXT,
    "salesAgentId" TEXT,
    "commissionRate" DOUBLE PRECISION,
    "commissionAmount" DOUBLE PRECISION,
    "commissionStatus" "CommissionStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "originalSalesAgentId" TEXT,
    "commissionSplitPercent" DOUBLE PRECISION DEFAULT 100,
    "commissionReassignedAt" TIMESTAMP(3),
    "commissionReassignedById" TEXT,
    "commissionReassignmentNote" TEXT,
    "commissionPaidAt" TIMESTAMP(3),
    "commissionPaidById" TEXT,
    "commissionPaymentRef" TEXT,
    "salesType" TEXT,
    "vehicleType" TEXT DEFAULT 'BEV',
    "motorBatterySerialNo" TEXT,
    "purchaserTin" TEXT,
    "purchaserAddress" TEXT,
    "purchaserAuthorizedRep" TEXT,
    "accessoriesDescription" TEXT,
    "proformaInvoiceNo" TEXT,
    "proformaInvoiceDate" TIMESTAMP(3),
    "vatAmount" DOUBLE PRECISION,
    "registrationCharge" DOUBLE PRECISION,
    "accessoriesAmount" DOUBLE PRECISION,
    "depositAmount" DOUBLE PRECISION,
    "depositDueDate" TIMESTAMP(3),
    "otherPaymentAmount" DOUBLE PRECISION,
    "otherPaymentNote" TEXT,
    "otherPaymentDueDate" TIMESTAMP(3),
    "estimatedDeliveryDate" TIMESTAMP(3),
    "deliveryLocation" TEXT,
    "exteriorColor" TEXT,
    "interiorColor" TEXT,
    "deliveryHold" BOOLEAN NOT NULL DEFAULT false,
    "deliveryHoldReason" TEXT,
    "deliveryScheduledAt" TIMESTAMP(3),
    "invoiceLineItems" JSONB,
    "amountPaid" DOUBLE PRECISION,
    "paymentMethod" TEXT,
    "paymentReferenceNo" TEXT,
    "deliveryNoteNo" TEXT,
    "odometerAtDelivery" INTEGER,
    "customerTitle" TEXT,
    "itemsHandedOver" JSONB,
    "inspectionChecklist" JSONB,
    "evGuidanceChecklist" JSONB,
    "handoverDamageNotes" TEXT,
    "handoverOutstandingItems" TEXT,
    "handoverResponsiblePerson" TEXT,
    "handoverExpectedCompletionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PdiChecklistItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isChecked" BOOLEAN NOT NULL DEFAULT false,
    "result" "PdiItemResult" NOT NULL DEFAULT 'PENDING',
    "photoUrls" JSONB,
    "notes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "checkedById" TEXT,
    "checkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PdiChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSignature" (
    "id" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "signedByUserId" TEXT,
    "signedByName" TEXT,
    "signatureUrl" TEXT,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "changedById" TEXT NOT NULL,
    "reasonCode" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesOrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromAgentId" TEXT,
    "toAgentId" TEXT,
    "fromSplitPercent" DOUBLE PRECISION,
    "toSplitPercent" DOUBLE PRECISION,
    "amount" DOUBLE PRECISION,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "CommissionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationAssignmentHistory" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "assignmentReason" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationAssignmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationEscalationHistory" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "escalatedById" TEXT NOT NULL,
    "escalatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "escalationReason" TEXT,
    "previousAssignee" TEXT,

    CONSTRAINT "QuotationEscalationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationHistory" (
    "id" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "data" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentStatus" TEXT NOT NULL DEFAULT 'sent',
    "error" TEXT,

    CONSTRAINT "NotificationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InAppNotification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "quotationId" TEXT,
    "orderId" TEXT,
    "relatedModel" TEXT,
    "relatedId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InAppNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dealer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Ethiopia',
    "address" JSONB NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "contact" JSONB NOT NULL,
    "website" TEXT,
    "services" JSONB NOT NULL,
    "workingHours" JSONB NOT NULL,
    "facilities" JSONB NOT NULL,
    "logo" TEXT,
    "gallery" JSONB NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "salesCount" INTEGER NOT NULL DEFAULT 0,
    "staffCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dealer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceBooking" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "nationalId" TEXT,
    "vehicleInfo" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "technician" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Technician" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "skillLevel" "TechnicianSkillLevel" NOT NULL DEFAULT 'JUNIOR',
    "certificationLevel" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Technician_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceBay" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bayType" "BayType" NOT NULL DEFAULT 'GENERAL',
    "status" "BayStatus" NOT NULL DEFAULT 'FREE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceBay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobCard" (
    "id" TEXT NOT NULL,
    "jobCardNo" TEXT NOT NULL,
    "plateNo" TEXT NOT NULL,
    "vin" TEXT,
    "vehicleModel" TEXT,
    "vehicleYear" INTEGER,
    "mileage" INTEGER,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "complaintText" TEXT,
    "diagnosisNotes" TEXT,
    "estimateAmount" DOUBLE PRECISION,
    "isWarrantyOrGoodwill" BOOLEAN NOT NULL DEFAULT false,
    "customerApprovedAt" TIMESTAMP(3),
    "warrantyStartDate" TIMESTAMP(3),
    "warrantyEndDate" TIMESTAMP(3),
    "customerVehicleId" TEXT,
    "technicianId" TEXT,
    "bayId" TEXT,
    "scheduledStart" TIMESTAMP(3),
    "scheduledEnd" TIMESTAMP(3),
    "status" "JobCardStatus" NOT NULL DEFAULT 'DRAFT_CHECKIN',
    "qcPassed" BOOLEAN,
    "qcNotes" TEXT,
    "qcById" TEXT,
    "laborAmount" DOUBLE PRECISION,
    "invoiceNo" TEXT,
    "invoiceAmount" DOUBLE PRECISION,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "paidAt" TIMESTAMP(3),
    "serviceBookingId" TEXT,
    "openTs" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closeTs" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobCardStatusHistory" (
    "id" TEXT NOT NULL,
    "jobCardId" TEXT NOT NULL,
    "fromStatus" "JobCardStatus",
    "toStatus" "JobCardStatus" NOT NULL,
    "changedById" TEXT NOT NULL,
    "reasonCode" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobCardStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Counter" (
    "name" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Counter_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "JobCardPart" (
    "id" TEXT NOT NULL,
    "jobCardId" TEXT NOT NULL,
    "sparePartId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "status" "JobCardPartStatus" NOT NULL DEFAULT 'REQUESTED',
    "isWarranty" BOOLEAN NOT NULL DEFAULT false,
    "requestedById" TEXT NOT NULL,
    "issuedById" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issuedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobCardPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarrantyClaim" (
    "id" TEXT NOT NULL,
    "claimNo" TEXT NOT NULL,
    "jobCardId" TEXT NOT NULL,
    "defectCode" TEXT NOT NULL,
    "component" TEXT,
    "diagnosticCodes" TEXT,
    "description" TEXT,
    "photoUrls" JSONB NOT NULL DEFAULT '[]',
    "status" "WarrantyClaimStatus" NOT NULL DEFAULT 'DRAFTED',
    "oemPortalRef" TEXT,
    "approvedAmount" DOUBLE PRECISION,
    "rejectionReason" TEXT,
    "submittedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarrantyClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarrantyClaimStatusHistory" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "fromStatus" "WarrantyClaimStatus",
    "toStatus" "WarrantyClaimStatus" NOT NULL,
    "changedById" TEXT NOT NULL,
    "reasonCode" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarrantyClaimStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerVehicle" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "vin" TEXT,
    "plateNo" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "trim" TEXT,
    "color" TEXT,
    "isNev" BOOLEAN NOT NULL DEFAULT false,
    "warrantyStartDate" TIMESTAMP(3),
    "warrantyEndDate" TIMESTAMP(3),
    "mileageLastKnown" INTEGER,
    "lastServiceDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CSISurveyResponse" (
    "id" TEXT NOT NULL,
    "jobCardId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CSISurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SparePart" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "partCategoryId" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "brand" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "reservedQty" INTEGER NOT NULL DEFAULT 0,
    "reorderPoint" INTEGER NOT NULL DEFAULT 10,
    "price" DOUBLE PRECISION NOT NULL,
    "supplier" TEXT NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SparePart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartRequestItem" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "partId" TEXT,
    "partName" TEXT NOT NULL,
    "partSku" TEXT,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartsPageContent" (
    "id" TEXT NOT NULL,
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "heroBannerImage" TEXT,
    "heroBackgroundImage" TEXT,
    "introHeading" TEXT,
    "introDescription" TEXT,
    "ctaTitle" TEXT,
    "ctaDescription" TEXT,
    "ctaButtonText" TEXT,
    "ctaButtonLink" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartsPageContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartBrand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartBenefit" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartBenefit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bannerImage" TEXT,
    "ctaButtonText" TEXT,
    "ctaButtonLink" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "vehicleModel" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "reviewTitle" TEXT NOT NULL,
    "reviewMessage" TEXT NOT NULL,
    "profileImage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "reference" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT NOT NULL,
    "customerAddress" TEXT,
    "nationalId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'website',
    "vehicleModel" TEXT,
    "vehicleId" TEXT,
    "budgetMin" DOUBLE PRECISION,
    "budgetMax" DOUBLE PRECISION,
    "financingInterest" BOOLEAN NOT NULL DEFAULT false,
    "tradeInInterest" BOOLEAN NOT NULL DEFAULT false,
    "testDriveRequired" BOOLEAN NOT NULL DEFAULT false,
    "purchaseTimeline" TEXT,
    "preferredContact" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "internalNotes" TEXT,
    "assignedTo" TEXT,
    "commissionOwner" TEXT,
    "commissionSince" TIMESTAMP(3),
    "assignmentHistory" JSONB,
    "qualifiedAt" TIMESTAMP(3),
    "contactedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeInEvaluation" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "vin" TEXT,
    "plateNo" TEXT,
    "year" INTEGER NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "color" TEXT,
    "mileage" INTEGER NOT NULL,
    "condition" TEXT NOT NULL,
    "interiorCondition" TEXT,
    "exteriorCondition" TEXT,
    "mechanicalCondition" TEXT,
    "hasAccidents" BOOLEAN,
    "hasModifications" BOOLEAN,
    "serviceHistoryNotes" TEXT,
    "photoUrls" JSONB NOT NULL,
    "estimatedValue" DOUBLE PRECISION,
    "estimatedBy" TEXT,
    "evaluatedValue" DOUBLE PRECISION,
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeInEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancingApplication" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "vehicleId" TEXT,
    "vehicleModel" TEXT NOT NULL,
    "vehiclePrice" DOUBLE PRECISION NOT NULL,
    "requestedAmount" DOUBLE PRECISION NOT NULL,
    "downPayment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tenureMonths" INTEGER NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "documentsSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "paymentProofUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancingApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "excerpt" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishDate" TIMESTAMP(3),
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'unread',
    "content" TEXT NOT NULL,
    "response" TEXT,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CRMSyncLog" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CRMSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'subscribed',
    "source" TEXT NOT NULL DEFAULT 'website',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatbotKnowledge" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "keywords" TEXT[],
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatbotKnowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatbotConversation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "leadId" TEXT,
    "lastVehicleId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatbotConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatbotMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "intent" TEXT,
    "matchedKnowledgeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatbotMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeroSection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "mediaType" TEXT NOT NULL,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "posterUrl" TEXT,
    "buttonText" TEXT,
    "buttonLink" TEXT,
    "legacy_status" TEXT NOT NULL DEFAULT 'draft',
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "scheduledAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "altText" TEXT,
    "category" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleShowcase" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "vehicleName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "views" JSONB NOT NULL,
    "videoUrl" TEXT,
    "modelUrl" TEXT,
    "brochureUrl" TEXT,
    "brochureFileName" TEXT,
    "brochureFileSize" INTEGER,
    "ctaText" TEXT,
    "ctaLink" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleShowcase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleColor" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "colorCode" TEXT NOT NULL,
    "imageUrl" TEXT,
    "images" JSONB,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleColor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleAccessory" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "images" JSONB,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleAccessory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectricPage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "pageType" TEXT NOT NULL,
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "heroImage" TEXT,
    "content" TEXT,
    "sections" JSONB,
    "metadata" JSONB,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectricPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChargingStation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "stationType" TEXT NOT NULL,
    "chargerCount" INTEGER NOT NULL DEFAULT 1,
    "maxPower" TEXT NOT NULL,
    "connector" JSONB NOT NULL,
    "availability" TEXT NOT NULL DEFAULT 'operational',
    "pricing" TEXT,
    "hours" TEXT,
    "amenities" JSONB,
    "images" JSONB,
    "electricPageId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChargingStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehiclePackage" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "features" JSONB NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehiclePackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleInterior" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "materialType" TEXT NOT NULL,
    "imageUrl" TEXT,
    "images" JSONB,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleInterior_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleWheel" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT,
    "name" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "imageUrl" TEXT,
    "images" JSONB,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleWheel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceSection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceItem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "image" TEXT,
    "url" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT,
    "heroImage" TEXT,
    "heroVideo" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectricSection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectricSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectricItem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "image" TEXT,
    "url" TEXT,
    "pageId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectricItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectricMenuPage" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT,
    "heroImage" TEXT,
    "heroVideo" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectricMenuPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Redirect" (
    "id" TEXT NOT NULL,
    "fromPath" TEXT NOT NULL,
    "toPath" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL DEFAULT 301,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Redirect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancingBank" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "branchAddress" TEXT,
    "shortDescription" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancingBank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancingProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "interestRate" DECIMAL(6,3) NOT NULL,
    "downPaymentPercent" DECIMAL(5,2) NOT NULL,
    "minDownPaymentPercent" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "maxDownPaymentPercent" DECIMAL(5,2) NOT NULL DEFAULT 70,
    "tenureMonths" INTEGER NOT NULL,
    "minTenureMonths" INTEGER NOT NULL DEFAULT 12,
    "maxTenureMonths" INTEGER NOT NULL DEFAULT 84,
    "processingFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 2.5,
    "processingFeeMin" DECIMAL(12,2),
    "processingFeeMax" DECIMAL(12,2),
    "insurancePercent" DECIMAL(5,2) NOT NULL DEFAULT 5,
    "vehicleId" TEXT,
    "vehicleCategoryId" TEXT,
    "appliesToAllVehicles" BOOLEAN NOT NULL DEFAULT true,
    "applyEnabled" BOOLEAN NOT NULL DEFAULT true,
    "applyUrl" TEXT,
    "applyLabel" TEXT,
    "directPayEnabled" BOOLEAN NOT NULL DEFAULT false,
    "directPayUrl" TEXT,
    "directPayLabel" TEXT,
    "visitShowroomEnabled" BOOLEAN NOT NULL DEFAULT true,
    "visitShowroomUrl" TEXT,
    "visitShowroomLabel" TEXT,
    "scheduleEnabled" BOOLEAN NOT NULL DEFAULT true,
    "scheduleUrl" TEXT,
    "badgeText" TEXT,
    "highlightBadge" BOOLEAN NOT NULL DEFAULT false,
    "finePrint" TEXT,
    "eligibilityNote" TEXT,
    "status" "FinancingProgramStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancingProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteNavItem" (
    "id" TEXT NOT NULL,
    "placement" "SiteNavPlacement" NOT NULL,
    "label" TEXT NOT NULL,
    "subtitle" TEXT,
    "icon" TEXT,
    "href" TEXT NOT NULL,
    "openInNewTab" BOOLEAN NOT NULL DEFAULT false,
    "isHighlighted" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "scheduledAt" TIMESTAMP(3),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteNavItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleAllocation" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "vin" TEXT,
    "status" "VehicleAllocationStatus" NOT NULL DEFAULT 'RESERVED',
    "erpSystem" TEXT,
    "erpReference" TEXT,
    "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "allocatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warranty" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "vin" TEXT,
    "vehicleModel" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "warrantyStartDate" TIMESTAMP(3) NOT NULL,
    "warrantyEndDate" TIMESTAMP(3) NOT NULL,
    "warrantyYears" INTEGER NOT NULL DEFAULT 3,
    "warrantyKm" INTEGER NOT NULL DEFAULT 100000,
    "currentKm" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastServiceDate" TIMESTAMP(3),
    "nextServiceDate" TIMESTAMP(3),
    "nextServiceKm" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warranty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRecord" (
    "id" TEXT NOT NULL,
    "warrantyId" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "serviceType" TEXT NOT NULL,
    "description" TEXT,
    "kmAtService" INTEGER,
    "cost" DOUBLE PRECISION,
    "performedBy" TEXT,
    "nextServiceDate" TIMESTAMP(3),
    "nextServiceKm" INTEGER,
    "documents" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerFollowUp" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "followUpType" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "assignedTo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "npsScore" INTEGER,
    "satisfactionScore" INTEGER,
    "wouldRecommend" BOOLEAN,
    "callbackDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerNPS" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "npsScore" INTEGER NOT NULL,
    "satisfactionScore" INTEGER,
    "wouldRecommend" BOOLEAN,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerNPS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "performedByName" TEXT,
    "fromValue" JSONB,
    "toValue" JSONB,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintCase" (
    "id" TEXT NOT NULL,
    "caseNo" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "orderId" TEXT,
    "vehicleModel" TEXT,
    "vin" TEXT,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assignedTo" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplaintCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintNote" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "noteType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpgradeOpportunity" (
    "id" TEXT NOT NULL,
    "opportunityNo" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "opportunityType" TEXT NOT NULL,
    "targetModel" TEXT,
    "estimatedBudget" DOUBLE PRECISION,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IDENTIFIED',
    "assignedTo" TEXT,
    "notes" TEXT,
    "promotionId" TEXT,
    "wonAt" TIMESTAMP(3),
    "wonById" TEXT,
    "lostAt" TIMESTAMP(3),
    "lostReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpgradeOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SLATimer" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline" TIMESTAMP(3) NOT NULL,
    "escalateAt" TIMESTAMP(3),
    "assignedTo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "completedAt" TIMESTAMP(3),
    "minutesTaken" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SLATimer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyAccount" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "tier" "LoyaltyTier" NOT NULL DEFAULT 'BRONZE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyTransaction" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_signatureSetupToken_key" ON "User"("signatureSetupToken");

-- CreateIndex
CREATE UNIQUE INDEX "UserVehicleBrand_userId_brandId_key" ON "UserVehicleBrand"("userId", "brandId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermissionOverride_role_permissionKey_key" ON "RolePermissionOverride"("role", "permissionKey");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleBrand_name_key" ON "VehicleBrand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleBrand_slug_key" ON "VehicleBrand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleCategory_slug_key" ON "VehicleCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_slug_key" ON "Vehicle"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_sku_key" ON "Vehicle"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "TestDrive_reference_key" ON "TestDrive"("reference");

-- CreateIndex
CREATE INDEX "ShowroomVisit_status_idx" ON "ShowroomVisit"("status");

-- CreateIndex
CREATE INDEX "ShowroomVisit_createdAt_idx" ON "ShowroomVisit"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_tradeInEvaluationId_key" ON "Quotation"("tradeInEvaluationId");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_reference_key" ON "Quotation"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_quotationNo_key" ON "Quotation"("quotationNo");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_orderNo_key" ON "SalesOrder"("orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_quotationId_key" ON "SalesOrder"("quotationId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_deliveryNoteNo_key" ON "SalesOrder"("deliveryNoteNo");

-- CreateIndex
CREATE INDEX "SalesOrder_status_idx" ON "SalesOrder"("status");

-- CreateIndex
CREATE INDEX "PdiChecklistItem_orderId_idx" ON "PdiChecklistItem"("orderId");

-- CreateIndex
CREATE INDEX "DocumentSignature_documentType_entityId_idx" ON "DocumentSignature"("documentType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSignature_documentType_entityId_role_key" ON "DocumentSignature"("documentType", "entityId", "role");

-- CreateIndex
CREATE INDEX "SalesOrderStatusHistory_orderId_idx" ON "SalesOrderStatusHistory"("orderId");

-- CreateIndex
CREATE INDEX "CommissionHistory_orderId_idx" ON "CommissionHistory"("orderId");

-- CreateIndex
CREATE INDEX "CommissionHistory_changedAt_idx" ON "CommissionHistory"("changedAt");

-- CreateIndex
CREATE INDEX "QuotationAssignmentHistory_quotationId_idx" ON "QuotationAssignmentHistory"("quotationId");

-- CreateIndex
CREATE INDEX "QuotationEscalationHistory_quotationId_idx" ON "QuotationEscalationHistory"("quotationId");

-- CreateIndex
CREATE INDEX "NotificationHistory_sentAt_idx" ON "NotificationHistory"("sentAt");

-- CreateIndex
CREATE INDEX "InAppNotification_recipientId_idx" ON "InAppNotification"("recipientId");

-- CreateIndex
CREATE INDEX "InAppNotification_recipientId_readAt_idx" ON "InAppNotification"("recipientId", "readAt");

-- CreateIndex
CREATE INDEX "InAppNotification_createdAt_idx" ON "InAppNotification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceBooking_reference_key" ON "ServiceBooking"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceBay_name_key" ON "ServiceBay"("name");

-- CreateIndex
CREATE UNIQUE INDEX "JobCard_jobCardNo_key" ON "JobCard"("jobCardNo");

-- CreateIndex
CREATE UNIQUE INDEX "JobCard_serviceBookingId_key" ON "JobCard"("serviceBookingId");

-- CreateIndex
CREATE INDEX "JobCard_status_idx" ON "JobCard"("status");

-- CreateIndex
CREATE INDEX "JobCard_technicianId_idx" ON "JobCard"("technicianId");

-- CreateIndex
CREATE INDEX "JobCard_bayId_idx" ON "JobCard"("bayId");

-- CreateIndex
CREATE INDEX "JobCard_customerVehicleId_idx" ON "JobCard"("customerVehicleId");

-- CreateIndex
CREATE INDEX "JobCardStatusHistory_jobCardId_idx" ON "JobCardStatusHistory"("jobCardId");

-- CreateIndex
CREATE INDEX "JobCardPart_jobCardId_idx" ON "JobCardPart"("jobCardId");

-- CreateIndex
CREATE INDEX "JobCardPart_sparePartId_idx" ON "JobCardPart"("sparePartId");

-- CreateIndex
CREATE UNIQUE INDEX "WarrantyClaim_claimNo_key" ON "WarrantyClaim"("claimNo");

-- CreateIndex
CREATE INDEX "WarrantyClaim_jobCardId_idx" ON "WarrantyClaim"("jobCardId");

-- CreateIndex
CREATE INDEX "WarrantyClaim_status_idx" ON "WarrantyClaim"("status");

-- CreateIndex
CREATE INDEX "WarrantyClaimStatusHistory_claimId_idx" ON "WarrantyClaimStatusHistory"("claimId");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerVehicle_vin_key" ON "CustomerVehicle"("vin");

-- CreateIndex
CREATE INDEX "CustomerVehicle_customerId_idx" ON "CustomerVehicle"("customerId");

-- CreateIndex
CREATE INDEX "CustomerVehicle_plateNo_idx" ON "CustomerVehicle"("plateNo");

-- CreateIndex
CREATE UNIQUE INDEX "CSISurveyResponse_jobCardId_key" ON "CSISurveyResponse"("jobCardId");

-- CreateIndex
CREATE INDEX "CSISurveyResponse_jobCardId_idx" ON "CSISurveyResponse"("jobCardId");

-- CreateIndex
CREATE UNIQUE INDEX "SparePart_sku_key" ON "SparePart"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "PartRequest_reference_key" ON "PartRequest"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "PartCategory_slug_key" ON "PartCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_reference_key" ON "Lead"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Message_reference_key" ON "Message"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- CreateIndex
CREATE INDEX "ChatbotKnowledge_isActive_idx" ON "ChatbotKnowledge"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ChatbotConversation_sessionId_key" ON "ChatbotConversation"("sessionId");

-- CreateIndex
CREATE INDEX "ChatbotMessage_conversationId_idx" ON "ChatbotMessage"("conversationId");

-- CreateIndex
CREATE INDEX "VehicleColor_vehicleId_idx" ON "VehicleColor"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleAccessory_vehicleId_idx" ON "VehicleAccessory"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "ElectricPage_slug_key" ON "ElectricPage"("slug");

-- CreateIndex
CREATE INDEX "VehiclePackage_vehicleId_idx" ON "VehiclePackage"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleInterior_vehicleId_idx" ON "VehicleInterior"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleWheel_vehicleId_idx" ON "VehicleWheel"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceSection_slug_key" ON "ServiceSection"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePage_slug_key" ON "ServicePage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ElectricSection_slug_key" ON "ElectricSection"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ElectricItem_pageId_key" ON "ElectricItem"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "ElectricMenuPage_itemId_key" ON "ElectricMenuPage"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ElectricMenuPage_slug_key" ON "ElectricMenuPage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Redirect_fromPath_key" ON "Redirect"("fromPath");

-- CreateIndex
CREATE INDEX "Redirect_fromPath_isActive_idx" ON "Redirect"("fromPath", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "FinancingBank_slug_key" ON "FinancingBank"("slug");

-- CreateIndex
CREATE INDEX "FinancingBank_isActive_displayOrder_idx" ON "FinancingBank"("isActive", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "FinancingProgram_slug_key" ON "FinancingProgram"("slug");

-- CreateIndex
CREATE INDEX "FinancingProgram_status_displayOrder_idx" ON "FinancingProgram"("status", "displayOrder");

-- CreateIndex
CREATE INDEX "FinancingProgram_bankId_status_idx" ON "FinancingProgram"("bankId", "status");

-- CreateIndex
CREATE INDEX "FinancingProgram_vehicleId_status_idx" ON "FinancingProgram"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "SiteNavItem_placement_isActive_displayOrder_idx" ON "SiteNavItem"("placement", "isActive", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleAllocation_orderId_key" ON "VehicleAllocation"("orderId");

-- CreateIndex
CREATE INDEX "VehicleAllocation_vehicleId_status_idx" ON "VehicleAllocation"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "VehicleAllocation_vin_idx" ON "VehicleAllocation"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "Warranty_orderId_key" ON "Warranty"("orderId");

-- CreateIndex
CREATE INDEX "Warranty_orderId_idx" ON "Warranty"("orderId");

-- CreateIndex
CREATE INDEX "Warranty_vin_idx" ON "Warranty"("vin");

-- CreateIndex
CREATE INDEX "Warranty_status_idx" ON "Warranty"("status");

-- CreateIndex
CREATE INDEX "ServiceRecord_warrantyId_idx" ON "ServiceRecord"("warrantyId");

-- CreateIndex
CREATE INDEX "ServiceRecord_serviceDate_idx" ON "ServiceRecord"("serviceDate");

-- CreateIndex
CREATE INDEX "CustomerFollowUp_orderId_idx" ON "CustomerFollowUp"("orderId");

-- CreateIndex
CREATE INDEX "CustomerFollowUp_assignedTo_status_idx" ON "CustomerFollowUp"("assignedTo", "status");

-- CreateIndex
CREATE INDEX "CustomerFollowUp_scheduledDate_status_idx" ON "CustomerFollowUp"("scheduledDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerNPS_orderId_key" ON "CustomerNPS"("orderId");

-- CreateIndex
CREATE INDEX "CustomerNPS_npsScore_idx" ON "CustomerNPS"("npsScore");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_performedById_idx" ON "AuditLog"("performedById");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE UNIQUE INDEX "ComplaintCase_caseNo_key" ON "ComplaintCase"("caseNo");

-- CreateIndex
CREATE INDEX "ComplaintCase_status_idx" ON "ComplaintCase"("status");

-- CreateIndex
CREATE INDEX "ComplaintCase_priority_idx" ON "ComplaintCase"("priority");

-- CreateIndex
CREATE INDEX "ComplaintCase_category_idx" ON "ComplaintCase"("category");

-- CreateIndex
CREATE INDEX "ComplaintCase_assignedTo_idx" ON "ComplaintCase"("assignedTo");

-- CreateIndex
CREATE INDEX "ComplaintNote_caseId_idx" ON "ComplaintNote"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "UpgradeOpportunity_opportunityNo_key" ON "UpgradeOpportunity"("opportunityNo");

-- CreateIndex
CREATE INDEX "UpgradeOpportunity_customerId_idx" ON "UpgradeOpportunity"("customerId");

-- CreateIndex
CREATE INDEX "UpgradeOpportunity_status_idx" ON "UpgradeOpportunity"("status");

-- CreateIndex
CREATE INDEX "UpgradeOpportunity_assignedTo_idx" ON "UpgradeOpportunity"("assignedTo");

-- CreateIndex
CREATE INDEX "UpgradeOpportunity_opportunityType_idx" ON "UpgradeOpportunity"("opportunityType");

-- CreateIndex
CREATE INDEX "UpgradeOpportunity_promotionId_idx" ON "UpgradeOpportunity"("promotionId");

-- CreateIndex
CREATE INDEX "SLATimer_entityType_entityId_idx" ON "SLATimer"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "SLATimer_status_deadline_idx" ON "SLATimer"("status", "deadline");

-- CreateIndex
CREATE INDEX "SLATimer_assignedTo_status_idx" ON "SLATimer"("assignedTo", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyAccount_customerId_key" ON "LoyaltyAccount"("customerId");

-- CreateIndex
CREATE INDEX "LoyaltyAccount_tier_idx" ON "LoyaltyAccount"("tier");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_accountId_idx" ON "LoyaltyTransaction"("accountId");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_createdAt_idx" ON "LoyaltyTransaction"("createdAt");

-- AddForeignKey
ALTER TABLE "UserVehicleBrand" ADD CONSTRAINT "UserVehicleBrand_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVehicleBrand" ADD CONSTRAINT "UserVehicleBrand_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "VehicleBrand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleCategory" ADD CONSTRAINT "VehicleCategory_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "VehicleBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "VehicleBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "VehicleCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestDrive" ADD CONSTRAINT "TestDrive_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestDrive" ADD CONSTRAINT "TestDrive_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_tradeInEvaluationId_fkey" FOREIGN KEY ("tradeInEvaluationId") REFERENCES "TradeInEvaluation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PdiChecklistItem" ADD CONSTRAINT "PdiChecklistItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderStatusHistory" ADD CONSTRAINT "SalesOrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionHistory" ADD CONSTRAINT "CommissionHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationAssignmentHistory" ADD CONSTRAINT "QuotationAssignmentHistory_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationEscalationHistory" ADD CONSTRAINT "QuotationEscalationHistory_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_customerVehicleId_fkey" FOREIGN KEY ("customerVehicleId") REFERENCES "CustomerVehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_bayId_fkey" FOREIGN KEY ("bayId") REFERENCES "ServiceBay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_serviceBookingId_fkey" FOREIGN KEY ("serviceBookingId") REFERENCES "ServiceBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCardStatusHistory" ADD CONSTRAINT "JobCardStatusHistory_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCardPart" ADD CONSTRAINT "JobCardPart_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCardPart" ADD CONSTRAINT "JobCardPart_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyClaim" ADD CONSTRAINT "WarrantyClaim_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyClaimStatusHistory" ADD CONSTRAINT "WarrantyClaimStatusHistory_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "WarrantyClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerVehicle" ADD CONSTRAINT "CustomerVehicle_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CSISurveyResponse" ADD CONSTRAINT "CSISurveyResponse_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SparePart" ADD CONSTRAINT "SparePart_partCategoryId_fkey" FOREIGN KEY ("partCategoryId") REFERENCES "PartCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartRequestItem" ADD CONSTRAINT "PartRequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "PartRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeInEvaluation" ADD CONSTRAINT "TradeInEvaluation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancingApplication" ADD CONSTRAINT "FinancingApplication_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatbotMessage" ADD CONSTRAINT "ChatbotMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatbotConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleColor" ADD CONSTRAINT "VehicleColor_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleAccessory" ADD CONSTRAINT "VehicleAccessory_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargingStation" ADD CONSTRAINT "ChargingStation_electricPageId_fkey" FOREIGN KEY ("electricPageId") REFERENCES "ElectricPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePackage" ADD CONSTRAINT "VehiclePackage_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleInterior" ADD CONSTRAINT "VehicleInterior_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleWheel" ADD CONSTRAINT "VehicleWheel_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceItem" ADD CONSTRAINT "ServiceItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ServiceSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectricItem" ADD CONSTRAINT "ElectricItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ElectricSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectricMenuPage" ADD CONSTRAINT "ElectricMenuPage_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ElectricItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancingProgram" ADD CONSTRAINT "FinancingProgram_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "FinancingBank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancingProgram" ADD CONSTRAINT "FinancingProgram_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancingProgram" ADD CONSTRAINT "FinancingProgram_vehicleCategoryId_fkey" FOREIGN KEY ("vehicleCategoryId") REFERENCES "VehicleCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleAllocation" ADD CONSTRAINT "VehicleAllocation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleAllocation" ADD CONSTRAINT "VehicleAllocation_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warranty" ADD CONSTRAINT "Warranty_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRecord" ADD CONSTRAINT "ServiceRecord_warrantyId_fkey" FOREIGN KEY ("warrantyId") REFERENCES "Warranty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerFollowUp" ADD CONSTRAINT "CustomerFollowUp_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerNPS" ADD CONSTRAINT "CustomerNPS_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintNote" ADD CONSTRAINT "ComplaintNote_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ComplaintCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpgradeOpportunity" ADD CONSTRAINT "UpgradeOpportunity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpgradeOpportunity" ADD CONSTRAINT "UpgradeOpportunity_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "CustomerVehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpgradeOpportunity" ADD CONSTRAINT "UpgradeOpportunity_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyAccount" ADD CONSTRAINT "LoyaltyAccount_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LoyaltyAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

