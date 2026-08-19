-- DropTable
-- IF EXISTS: PendingLead was created via `db push` outside migration history, so a
-- from-scratch shadow-database replay (used by `prisma migrate dev`) never creates it.
DROP TABLE IF EXISTS "PendingLead";
