-- Additive integration metadata for the acquisition-to-dialer handoff.
ALTER TABLE "CallAssignment" ADD COLUMN "externalId" TEXT,
ADD COLUMN "externalSystem" TEXT,
ADD COLUMN "syncedAt" TIMESTAMP(3);

ALTER TABLE "ContactAttempt" ADD COLUMN "externalId" TEXT,
ADD COLUMN "externalSystem" TEXT;

CREATE TABLE "OwnerContactPoint" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "normalizedValue" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "dncStatus" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OwnerContactPoint_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ListingStatusEvent" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceEventId" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL,
    "rawJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListingStatusEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExternalIdentity" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "metadata" JSONB,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExternalIdentity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OwnerContactPoint_normalizedValue_idx" ON "OwnerContactPoint"("normalizedValue");
CREATE INDEX "OwnerContactPoint_dncStatus_idx" ON "OwnerContactPoint"("dncStatus");
CREATE UNIQUE INDEX "OwnerContactPoint_ownerId_kind_normalizedValue_key" ON "OwnerContactPoint"("ownerId", "kind", "normalizedValue");
CREATE UNIQUE INDEX "ListingStatusEvent_sourceEventId_key" ON "ListingStatusEvent"("sourceEventId");
CREATE INDEX "ListingStatusEvent_listingId_changedAt_idx" ON "ListingStatusEvent"("listingId", "changedAt");
CREATE INDEX "ListingStatusEvent_toStatus_changedAt_idx" ON "ListingStatusEvent"("toStatus", "changedAt");
CREATE INDEX "ExternalIdentity_entityType_entityId_idx" ON "ExternalIdentity"("entityType", "entityId");
CREATE UNIQUE INDEX "ExternalIdentity_provider_externalId_key" ON "ExternalIdentity"("provider", "externalId");
CREATE UNIQUE INDEX "ExternalIdentity_entityType_entityId_provider_key" ON "ExternalIdentity"("entityType", "entityId", "provider");
CREATE INDEX "OutboxEvent_status_availableAt_idx" ON "OutboxEvent"("status", "availableAt");
CREATE INDEX "OutboxEvent_aggregateType_aggregateId_idx" ON "OutboxEvent"("aggregateType", "aggregateId");
CREATE UNIQUE INDEX "CallAssignment_externalId_key" ON "CallAssignment"("externalId");
CREATE UNIQUE INDEX "ContactAttempt_externalId_key" ON "ContactAttempt"("externalId");

ALTER TABLE "OwnerContactPoint" ADD CONSTRAINT "OwnerContactPoint_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "PropertyOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListingStatusEvent" ADD CONSTRAINT "ListingStatusEvent_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MlsListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
