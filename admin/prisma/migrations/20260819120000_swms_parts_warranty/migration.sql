-- CreateEnum
CREATE TYPE "JobCardPartStatus" AS ENUM ('REQUESTED', 'ISSUED', 'BACKORDERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WarrantyClaimStatus" AS ENUM ('DRAFTED', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REIMBURSED');

-- AlterTable
ALTER TABLE "JobCard" ADD COLUMN "warrantyStartDate" TIMESTAMP(3),
ADD COLUMN "warrantyEndDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SparePart" ADD COLUMN "reservedQty" INTEGER NOT NULL DEFAULT 0;

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

-- AddForeignKey
ALTER TABLE "JobCardPart" ADD CONSTRAINT "JobCardPart_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCardPart" ADD CONSTRAINT "JobCardPart_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyClaim" ADD CONSTRAINT "WarrantyClaim_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyClaimStatusHistory" ADD CONSTRAINT "WarrantyClaimStatusHistory_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "WarrantyClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
