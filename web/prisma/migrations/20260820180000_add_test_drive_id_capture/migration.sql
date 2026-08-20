-- AlterTable
ALTER TABLE "TestDrive" ADD COLUMN     "idDocumentNumber" TEXT,
ADD COLUMN     "idDocumentType" TEXT,
ADD COLUMN     "idPhotoUrl" TEXT,
ADD COLUMN     "idVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "idVerifiedById" TEXT;
