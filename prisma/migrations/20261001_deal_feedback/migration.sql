-- Scanner feedback only. No DROPs: this database is shared with a separate app.

CREATE TABLE "DealFeedback" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "mlsNumber" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "note" TEXT,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DealFeedback_listingId_key" ON "DealFeedback"("listingId");
