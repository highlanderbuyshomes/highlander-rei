-- Add map pin color to AcquisitionArea (Buyer Search) for the search-map UI
ALTER TABLE "AcquisitionArea" ADD COLUMN IF NOT EXISTS "mapColor" TEXT;
