-- CreateEnum
CREATE TYPE "QuotationApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "managerApprovalStatus" "QuotationApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "managerApprovedAt" TIMESTAMP(3),
ADD COLUMN     "managerApprovedById" TEXT,
ADD COLUMN     "managerRejectedAt" TIMESTAMP(3),
ADD COLUMN     "managerRejectedById" TEXT,
ADD COLUMN     "managerRejectionReason" TEXT;

-- AlterTable
ALTER TABLE "SalesOrder" ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedById" TEXT,
ADD COLUMN     "rejectionReason" TEXT;
