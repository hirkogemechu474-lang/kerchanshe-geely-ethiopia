-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('NOT_APPLICABLE', 'PENDING', 'EARNED', 'PAID');

-- AlterTable
ALTER TABLE "SalesOrder" ADD COLUMN     "commissionAmount" DOUBLE PRECISION,
ADD COLUMN     "commissionRate" DOUBLE PRECISION,
ADD COLUMN     "commissionStatus" "CommissionStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
ADD COLUMN     "invoiceAmount" DOUBLE PRECISION,
ADD COLUMN     "invoiceNo" TEXT,
ADD COLUMN     "invoicedAt" TIMESTAMP(3),
ADD COLUMN     "invoicedById" TEXT,
ADD COLUMN     "registeredAt" TIMESTAMP(3),
ADD COLUMN     "registeredById" TEXT,
ADD COLUMN     "registrationNumber" TEXT,
ADD COLUMN     "salesAgentId" TEXT;
