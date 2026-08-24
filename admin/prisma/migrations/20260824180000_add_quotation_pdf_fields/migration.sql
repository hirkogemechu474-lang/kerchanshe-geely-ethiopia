-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "quotationNo" TEXT,
ADD COLUMN     "quotationValidUntil" TIMESTAMP(3),
ADD COLUMN     "unitPrice" DOUBLE PRECISION,
ADD COLUMN     "quantity" INTEGER DEFAULT 1,
ADD COLUMN     "discountAmount" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "vatAmount" DOUBLE PRECISION,
ADD COLUMN     "vehicleYear" TEXT,
ADD COLUMN     "vehicleColor" TEXT,
ADD COLUMN     "paymentTerms" TEXT,
ADD COLUMN     "deliveryTerms" TEXT,
ADD COLUMN     "quotationGeneratedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_quotationNo_key" ON "Quotation"("quotationNo");
