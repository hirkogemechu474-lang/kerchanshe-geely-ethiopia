-- AlterTable
ALTER TABLE "User" ADD COLUMN     "signatureSetupToken" TEXT,
ADD COLUMN     "signatureSetupTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "signatureUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "signatureUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_signatureSetupToken_key" ON "User"("signatureSetupToken");
