-- CreateTable
CREATE TABLE "CSISurveyResponse" (
    "id" TEXT NOT NULL,
    "jobCardId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CSISurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CSISurveyResponse_jobCardId_key" ON "CSISurveyResponse"("jobCardId");

-- CreateIndex
CREATE INDEX "CSISurveyResponse_jobCardId_idx" ON "CSISurveyResponse"("jobCardId");

-- AddForeignKey
ALTER TABLE "CSISurveyResponse" ADD CONSTRAINT "CSISurveyResponse_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
