-- Agreement: add signing fields
ALTER TABLE "Agreement" ADD COLUMN IF NOT EXISTS "signerName"  TEXT;
ALTER TABLE "Agreement" ADD COLUMN IF NOT EXISTS "signerEmail" TEXT;
ALTER TABLE "Agreement" ADD COLUMN IF NOT EXISTS "signerToken" TEXT;
ALTER TABLE "Agreement" ADD COLUMN IF NOT EXISTS "signedAt"    TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "Agreement_signerToken_key" ON "Agreement"("signerToken") WHERE "signerToken" IS NOT NULL;

-- Lead table (shared with InvestorPortal — idempotent)
CREATE TABLE IF NOT EXISTS "Lead" (
  "id"        TEXT         NOT NULL,
  "name"      TEXT         NOT NULL,
  "email"     TEXT         NOT NULL,
  "phone"     TEXT,
  "message"   TEXT,
  "type"      TEXT,
  "company"   TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Lead_createdAt_idx" ON "Lead"("createdAt");
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "source" TEXT;

-- AdminConfig for password storage
CREATE TABLE IF NOT EXISTS "AdminConfig" (
  "id"           TEXT NOT NULL DEFAULT 'singleton',
  "passwordHash" TEXT,
  CONSTRAINT "AdminConfig_pkey" PRIMARY KEY ("id")
);
