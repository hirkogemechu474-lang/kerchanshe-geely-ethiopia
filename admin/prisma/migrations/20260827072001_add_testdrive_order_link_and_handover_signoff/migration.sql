-- AlterTable
ALTER TABLE "SalesOrder" ADD COLUMN     "handoverCountersignedAt" TIMESTAMP(3),
ADD COLUMN     "handoverCountersignedById" TEXT,
ADD COLUMN     "handoverSignedAt" TIMESTAMP(3),
ADD COLUMN     "handoverSignedDocumentUrl" TEXT;

-- AlterTable
ALTER TABLE "TestDrive" ADD COLUMN     "salesOrderId" TEXT;

-- AddForeignKey
ALTER TABLE "TestDrive" ADD CONSTRAINT "TestDrive_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
