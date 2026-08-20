-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'website',
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "vehicleModel" DROP NOT NULL;
