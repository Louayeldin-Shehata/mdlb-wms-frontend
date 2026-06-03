-- CreateEnum
CREATE TYPE "SkuSource" AS ENUM ('AUTO', 'CUSTOM');

-- CreateEnum
CREATE TYPE "InventoryTxnType" AS ENUM ('RECEIVE', 'ADJUST', 'RESERVE', 'RELEASE', 'FULFILL');

-- CreateEnum
CREATE TYPE "CrewRequestStatus" AS ENUM ('SUBMITTED', 'ACKNOWLEDGED', 'REJECTED', 'FULFILLED', 'CANCELLED');

-- CreateTable
CREATE TABLE "SizeOption" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SizeOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "skuPrefix" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sizeOptionId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "skuSource" "SkuSource" NOT NULL DEFAULT 'AUTO',
    "autoSku" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantImage" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VariantImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewRequest" (
    "id" TEXT NOT NULL,
    "status" "CrewRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "note" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrewRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewRequestLine" (
    "id" TEXT NOT NULL,
    "crewRequestId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "qtyRequested" INTEGER NOT NULL,
    "qtyReserved" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrewRequestLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLedgerEntry" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "type" "InventoryTxnType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdByUserId" TEXT,
    "note" TEXT,
    "crewRequestLineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SizeOption_code_key" ON "SizeOption"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- Unique constraints matching Prisma @@unique
CREATE UNIQUE INDEX "ProductVariant_productId_sizeOptionId_key" ON "ProductVariant"("productId", "sizeOptionId");
CREATE UNIQUE INDEX "ProductVariant_productId_sku_key" ON "ProductVariant"("productId", "sku");

CREATE UNIQUE INDEX "CrewRequestLine_crewRequestId_variantId_key" ON "CrewRequestLine"("crewRequestId", "variantId");

-- Ledger indexes
CREATE INDEX "InventoryLedgerEntry_variantId_createdAt_idx" ON "InventoryLedgerEntry"("variantId", "createdAt");
CREATE INDEX "InventoryLedgerEntry_type_createdAt_idx" ON "InventoryLedgerEntry"("type", "createdAt");

-- Request indexes
CREATE INDEX "CrewRequest_status_createdAt_idx" ON "CrewRequest"("status", "createdAt");
CREATE INDEX "CrewRequest_createdByUserId_createdAt_idx" ON "CrewRequest"("createdByUserId", "createdAt");

-- Foreign keys
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_sizeOptionId_fkey"
  FOREIGN KEY ("sizeOptionId") REFERENCES "SizeOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VariantImage" ADD CONSTRAINT "VariantImage_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CrewRequest" ADD CONSTRAINT "CrewRequest_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CrewRequestLine" ADD CONSTRAINT "CrewRequestLine_crewRequestId_fkey"
  FOREIGN KEY ("crewRequestId") REFERENCES "CrewRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CrewRequestLine" ADD CONSTRAINT "CrewRequestLine_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InventoryLedgerEntry" ADD CONSTRAINT "InventoryLedgerEntry_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InventoryLedgerEntry" ADD CONSTRAINT "InventoryLedgerEntry_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InventoryLedgerEntry" ADD CONSTRAINT "InventoryLedgerEntry_crewRequestLineId_fkey"
  FOREIGN KEY ("crewRequestLineId") REFERENCES "CrewRequestLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

