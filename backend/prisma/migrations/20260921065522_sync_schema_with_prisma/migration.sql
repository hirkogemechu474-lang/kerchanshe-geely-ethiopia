-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "campaign" TEXT,
ADD COLUMN     "referralSource" TEXT;

-- AlterTable
ALTER TABLE "SalesOrder" ADD COLUMN     "purchaserTitle" TEXT;

-- AlterTable
ALTER TABLE "ServiceBooking" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "mileage" TEXT,
ADD COLUMN     "timeSlot" TEXT,
ADD COLUMN     "vehicleYear" TEXT,
ADD COLUMN     "vin" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "stampUrl" TEXT,
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "featureTags" JSONB,
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaTitle" TEXT,
ADD COLUMN     "relatedVehicleIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Warranty" ADD COLUMN     "firstServiceCompletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SalesTarget" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "dealerId" TEXT,
    "revenueTarget" DOUBLE PRECISION NOT NULL,
    "unitsTarget" INTEGER NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingActivity" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activity" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadsideAssistanceRequest" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "alternatePhone" TEXT,
    "currentLocation" TEXT NOT NULL,
    "landmark" TEXT,
    "city" TEXT NOT NULL,
    "vehicleModel" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "issueDescription" TEXT NOT NULL,
    "isVehicleSafe" BOOLEAN NOT NULL,
    "passengersCount" TEXT NOT NULL,
    "hasMembership" BOOLEAN NOT NULL DEFAULT false,
    "membershipNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "assignedTo" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadsideAssistanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSegment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "criteria" JSONB NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalkInRegistration" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "vehicleInterest" TEXT,
    "notes" TEXT,
    "registeredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalkInRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesTarget_month_idx" ON "SalesTarget"("month");

-- CreateIndex
CREATE UNIQUE INDEX "SalesTarget_month_dealerId_key" ON "SalesTarget"("month", "dealerId");

-- CreateIndex
CREATE INDEX "MarketingActivity_date_idx" ON "MarketingActivity"("date");

-- CreateIndex
CREATE UNIQUE INDEX "RoadsideAssistanceRequest_reference_key" ON "RoadsideAssistanceRequest"("reference");

-- CreateIndex
CREATE INDEX "RoadsideAssistanceRequest_status_idx" ON "RoadsideAssistanceRequest"("status");

-- CreateIndex
CREATE INDEX "WalkInRegistration_registeredById_idx" ON "WalkInRegistration"("registeredById");

-- CreateIndex
CREATE INDEX "WalkInRegistration_createdAt_idx" ON "WalkInRegistration"("createdAt");

-- AddForeignKey
ALTER TABLE "SalesTarget" ADD CONSTRAINT "SalesTarget_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkInRegistration" ADD CONSTRAINT "WalkInRegistration_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

