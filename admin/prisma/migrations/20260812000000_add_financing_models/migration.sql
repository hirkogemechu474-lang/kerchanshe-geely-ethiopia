-- CreateEnum
CREATE TYPE "FinancingProgramStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

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

-- AddForeignKey
ALTER TABLE "FinancingProgram" ADD CONSTRAINT "FinancingProgram_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "FinancingBank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancingProgram" ADD CONSTRAINT "FinancingProgram_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancingProgram" ADD CONSTRAINT "FinancingProgram_vehicleCategoryId_fkey" FOREIGN KEY ("vehicleCategoryId") REFERENCES "VehicleCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
