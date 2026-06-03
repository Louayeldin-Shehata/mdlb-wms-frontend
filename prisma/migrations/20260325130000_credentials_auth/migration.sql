-- Add password hash for Credentials-based authentication
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

