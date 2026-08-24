-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "reference" TEXT;

-- AlterTable
ALTER TABLE "TestDrive" ADD COLUMN     "reference" TEXT;

-- AlterTable
ALTER TABLE "ServiceBooking" ADD COLUMN     "reference" TEXT;

-- AlterTable
ALTER TABLE "PartRequest" ADD COLUMN     "reference" TEXT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "reference" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_reference_key" ON "Quotation"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "TestDrive_reference_key" ON "TestDrive"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceBooking_reference_key" ON "ServiceBooking"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "PartRequest_reference_key" ON "PartRequest"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Message_reference_key" ON "Message"("reference");
