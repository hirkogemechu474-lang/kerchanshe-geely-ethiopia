-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dealerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleBrand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "iconUrl" TEXT,
    "heroImageUrl" TEXT,
    "heroVideoUrl" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "brandId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "brandId" TEXT,
    "categoryId" TEXT,
    "description" TEXT,
    "images" JSONB NOT NULL,
    "specifications" JSONB NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "discountAmount" DOUBLE PRECISION,
    "discountType" TEXT,
    "badge" TEXT,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "finalPrice" DOUBLE PRECISION,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "reorderPoint" INTEGER,
    "warehouse" TEXT,
    "location" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "heroImageUrl" TEXT,
    "heroVideoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestDrive" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "preferredDate" TIMESTAMP(3) NOT NULL,
    "preferredTime" TEXT NOT NULL,
    "alternativeDate" TIMESTAMP(3),
    "alternativeTime" TEXT,
    "location" TEXT NOT NULL,
    "salesRepId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "specialRequests" TEXT,
    "internalNotes" TEXT,
    "emailConfirm" BOOLEAN NOT NULL DEFAULT true,
    "smsReminder" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestDrive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "vehicleModel" TEXT NOT NULL,
    "preferredDealer" TEXT,
    "financingInterest" BOOLEAN NOT NULL DEFAULT false,
    "tradeInInterest" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "internalNotes" TEXT,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dealer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "address" JSONB NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "contact" JSONB NOT NULL,
    "services" JSONB NOT NULL,
    "workingHours" JSONB NOT NULL,
    "facilities" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "salesCount" INTEGER NOT NULL DEFAULT 0,
    "staffCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dealer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceBooking" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "vehicleInfo" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "technician" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SparePart" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "reorderPoint" INTEGER NOT NULL DEFAULT 10,
    "price" DOUBLE PRECISION NOT NULL,
    "supplier" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SparePart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bannerImage" TEXT,
    "ctaButtonText" TEXT,
    "ctaButtonLink" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "vehicleModel" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "reviewTitle" TEXT NOT NULL,
    "reviewMessage" TEXT NOT NULL,
    "profileImage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "excerpt" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishDate" TIMESTAMP(3),
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'unread',
    "content" TEXT NOT NULL,
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CRMSyncLog" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CRMSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeroSection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "mediaType" TEXT NOT NULL,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "posterUrl" TEXT,
    "buttonText" TEXT,
    "buttonLink" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "altText" TEXT,
    "category" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleShowcase" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "vehicleName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "views" JSONB NOT NULL,
    "ctaText" TEXT,
    "ctaLink" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleShowcase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleColor" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "colorCode" TEXT NOT NULL,
    "imageUrl" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleColor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleAccessory" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleAccessory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectricPage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "pageType" TEXT NOT NULL,
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "heroImage" TEXT,
    "content" TEXT,
    "sections" JSONB,
    "metadata" JSONB,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectricPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChargingStation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "stationType" TEXT NOT NULL,
    "chargerCount" INTEGER NOT NULL DEFAULT 1,
    "maxPower" TEXT NOT NULL,
    "connector" JSONB NOT NULL,
    "availability" TEXT NOT NULL DEFAULT 'operational',
    "pricing" TEXT,
    "hours" TEXT,
    "amenities" JSONB,
    "images" JSONB,
    "electricPageId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChargingStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehiclePackage" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "features" JSONB NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehiclePackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleInterior" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "materialType" TEXT NOT NULL,
    "imageUrl" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleInterior_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleBrand_name_key" ON "VehicleBrand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleBrand_slug_key" ON "VehicleBrand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleCategory_slug_key" ON "VehicleCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_slug_key" ON "Vehicle"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_sku_key" ON "Vehicle"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "SparePart_sku_key" ON "SparePart"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ElectricPage_slug_key" ON "ElectricPage"("slug");

-- AddForeignKey
ALTER TABLE "VehicleCategory" ADD CONSTRAINT "VehicleCategory_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "VehicleBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "VehicleBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "VehicleCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestDrive" ADD CONSTRAINT "TestDrive_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargingStation" ADD CONSTRAINT "ChargingStation_electricPageId_fkey" FOREIGN KEY ("electricPageId") REFERENCES "ElectricPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
