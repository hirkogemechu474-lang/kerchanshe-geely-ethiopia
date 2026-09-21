-- HELD BACK for explicit user approval (2026-09-21) — not applied, and this
-- folder is named with a leading underscore so `prisma migrate deploy` skips
-- it entirely. These 3 tables are unused leftovers per schema.prisma (no
-- model references them anymore); on THIS fresh/empty database they hold
-- zero rows, but rename this folder (drop the underscore) and re-run
-- `db:migrate:deploy` only after confirming that's still true wherever else
-- this migration might run.

-- DropForeignKey
ALTER TABLE "ServiceItem" DROP CONSTRAINT "ServiceItem_sectionId_fkey";

-- DropTable
DROP TABLE "ServiceItem";

-- DropTable
DROP TABLE "ServicePage";

-- DropTable
DROP TABLE "ServiceSection";
