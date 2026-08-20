-- CreateEnum
CREATE TYPE "SiteNavPlacement" AS ENUM ('TOP_NAV', 'MODELS_QUICK_ACTIONS');

-- CreateTable
CREATE TABLE "SiteNavItem" (
    "id" TEXT NOT NULL,
    "placement" "SiteNavPlacement" NOT NULL,
    "label" TEXT NOT NULL,
    "subtitle" TEXT,
    "icon" TEXT,
    "href" TEXT NOT NULL,
    "openInNewTab" BOOLEAN NOT NULL DEFAULT false,
    "isHighlighted" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteNavItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteNavItem_placement_isActive_displayOrder_idx" ON "SiteNavItem"("placement", "isActive", "displayOrder");
