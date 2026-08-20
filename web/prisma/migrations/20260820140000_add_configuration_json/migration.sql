-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "configurationJson" JSONB;

-- AlterTable
ALTER TABLE "SalesOrder" ADD COLUMN     "configurationJson" JSONB;
