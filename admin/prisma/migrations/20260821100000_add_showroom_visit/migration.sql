-- CreateTable
CREATE TABLE "ShowroomVisit" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'started',
    "fullName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "selectedAction" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "registeredAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShowroomVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShowroomVisit_status_idx" ON "ShowroomVisit"("status");

-- CreateIndex
CREATE INDEX "ShowroomVisit_createdAt_idx" ON "ShowroomVisit"("createdAt");
