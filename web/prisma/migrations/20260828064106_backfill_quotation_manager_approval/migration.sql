-- Grandfather quotations that were already generated/sent under the old
-- (pre-manager-approval) flow so they aren't retroactively blocked.
UPDATE "Quotation"
SET "managerApprovalStatus" = 'APPROVED'
WHERE "quotationGeneratedAt" IS NOT NULL
  AND "managerApprovalStatus" = 'PENDING';
