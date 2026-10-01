-- Only the InvestorBase response cache. No DROPs: this database is shared with
-- a separate app.

CREATE TABLE "InvestorBaseCache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "monthlyRemaining" INTEGER,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestorBaseCache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InvestorBaseCache_cacheKey_key" ON "InvestorBaseCache"("cacheKey");

CREATE INDEX "InvestorBaseCache_endpoint_fetchedAt_idx" ON "InvestorBaseCache"("endpoint", "fetchedAt");
