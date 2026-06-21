-- Add buyer contact name to AcquisitionArea (now "Buyer Search")
ALTER TABLE "AcquisitionArea" ADD COLUMN IF NOT EXISTS "buyerContact" TEXT;
