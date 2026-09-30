-- Only the ARV accuracy tables. No DROPs: this database is shared with a
-- separate app.

CREATE TABLE "ArvSample" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "priceHigh" DOUBLE PRECISION,
    "date" TIMESTAMP(3),
    "condition" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArvSample_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ArvAccuracyRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMs" INTEGER NOT NULL,
    "summary" JSONB NOT NULL,

    CONSTRAINT "ArvAccuracyRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ArvAccuracyRun_createdAt_idx" ON "ArvAccuracyRun"("createdAt");
