-- Only the RentalListing table for Investor comps. No DROPs: this database is
-- shared with a separate app.

CREATE TABLE "RentalListing" (
    "id" TEXT NOT NULL,
    "mlsNumber" TEXT NOT NULL,
    "addressFingerprint" TEXT NOT NULL,
    "listDate" TIMESTAMP(3),
    "rent" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalListing_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RentalListing_mlsNumber_key" ON "RentalListing"("mlsNumber");

CREATE INDEX "RentalListing_addressFingerprint_idx" ON "RentalListing"("addressFingerprint");
