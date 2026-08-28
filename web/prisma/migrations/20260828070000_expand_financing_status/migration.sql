-- Expand FinancingStatus from a flat 4-value flag into the full bank
-- financing pipeline, preserving existing data by mapping old values onto
-- their nearest new equivalent:
--   NOT_APPLICABLE -> NOT_REQUESTED
--   PENDING         -> REQUESTED
--   APPROVED        -> APPROVED (unchanged)
--   DECLINED        -> REJECTED

ALTER TYPE "FinancingStatus" RENAME TO "FinancingStatus_old";

CREATE TYPE "FinancingStatus" AS ENUM (
  'NOT_REQUESTED',
  'REQUESTED',
  'DOCUMENTS_PENDING',
  'DOCUMENTS_SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'CONDITIONALLY_APPROVED',
  'REJECTED',
  'CUSTOMER_DECLINED',
  'DISBURSED',
  'COMPLETED',
  'CANCELLED'
);

ALTER TABLE "SalesOrder" ALTER COLUMN "financingStatus" DROP DEFAULT;

ALTER TABLE "SalesOrder"
  ALTER COLUMN "financingStatus" TYPE "FinancingStatus"
  USING (
    CASE "financingStatus"::text
      WHEN 'NOT_APPLICABLE' THEN 'NOT_REQUESTED'
      WHEN 'PENDING' THEN 'REQUESTED'
      WHEN 'APPROVED' THEN 'APPROVED'
      WHEN 'DECLINED' THEN 'REJECTED'
    END
  )::"FinancingStatus";

ALTER TABLE "SalesOrder" ALTER COLUMN "financingStatus" SET DEFAULT 'NOT_REQUESTED';

DROP TYPE "FinancingStatus_old";
