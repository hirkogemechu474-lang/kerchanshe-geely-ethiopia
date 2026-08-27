-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING_REVIEW', 'PAID');

-- AlterTable
ALTER TABLE "SalesOrder" ADD COLUMN     "countersignedAt" TIMESTAMP(3),
ADD COLUMN     "countersignedById" TEXT,
ADD COLUMN     "paymentConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "paymentConfirmedById" TEXT,
ADD COLUMN     "paymentProofUrl" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "paymentSubmittedAt" TIMESTAMP(3);
