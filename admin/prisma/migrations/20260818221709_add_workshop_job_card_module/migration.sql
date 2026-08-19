-- CreateEnum
CREATE TYPE "TechnicianSkillLevel" AS ENUM ('JUNIOR', 'INTERMEDIATE', 'SENIOR', 'MASTER');

-- CreateEnum
CREATE TYPE "BayType" AS ENUM ('GENERAL', 'DIAGNOSTIC', 'ALIGNMENT', 'QUICK_SERVICE', 'PDI');

-- CreateEnum
CREATE TYPE "BayStatus" AS ENUM ('FREE', 'OCCUPIED', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "JobCardStatus" AS ENUM ('DRAFT_CHECKIN', 'AWAITING_BAY', 'DIAGNOSIS_ESTIMATE', 'AWAITING_APPROVAL', 'IN_PROGRESS', 'PARTS_WAITING', 'QUALITY_CONTROL', 'INVOICED_CLOSED', 'CANCELLED');

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
    "complaintText" TEXT NOT NULL,
    "diagnosisNotes" TEXT,
    "estimateAmount" DOUBLE PRECISION,
    "isWarrantyOrGoodwill" BOOLEAN NOT NULL DEFAULT false,
    "customerApprovedAt" TIMESTAMP(3),
    "technicianId" TEXT,
    "bayId" TEXT,
    "scheduledStart" TIMESTAMP(3),
    "scheduledEnd" TIMESTAMP(3),
    "status" "JobCardStatus" NOT NULL DEFAULT 'DRAFT_CHECKIN',
    "qcPassed" BOOLEAN,
    "qcNotes" TEXT,
    "qcById" TEXT,
    "invoiceAmount" DOUBLE PRECISION,
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
CREATE INDEX "JobCardStatusHistory_jobCardId_idx" ON "JobCardStatusHistory"("jobCardId");

-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_bayId_fkey" FOREIGN KEY ("bayId") REFERENCES "ServiceBay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_serviceBookingId_fkey" FOREIGN KEY ("serviceBookingId") REFERENCES "ServiceBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCardStatusHistory" ADD CONSTRAINT "JobCardStatusHistory_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
