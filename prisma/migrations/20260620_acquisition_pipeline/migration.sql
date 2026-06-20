-- Acquisition pipeline tables
-- All CREATE TABLE IF NOT EXISTS — safe to re-run, no existing tables touched.

-- ─── Target markets ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "AcquisitionArea" (
  "id"          TEXT         NOT NULL,
  "name"        TEXT         NOT NULL,
  "slug"        TEXT         NOT NULL,
  "description" TEXT,
  "polygon"     JSONB,
  "active"      BOOLEAN      NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AcquisitionArea_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AcquisitionArea_slug_key" ON "AcquisitionArea"("slug");

-- ─── Buy boxes ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "BuyBox" (
  "id"                   TEXT         NOT NULL,
  "name"                 TEXT         NOT NULL,
  "areaId"               TEXT,
  "active"               BOOLEAN      NOT NULL DEFAULT true,
  "zips"                 JSONB        NOT NULL DEFAULT '[]',
  "mlsAreaIds"           JSONB        NOT NULL DEFAULT '[]',
  "subdivisions"         JSONB        NOT NULL DEFAULT '[]',
  "propertyTypes"        JSONB        NOT NULL DEFAULT '[]',
  "priceMin"             DOUBLE PRECISION,
  "priceMax"             DOUBLE PRECISION,
  "bedsMin"              INTEGER,
  "bedsMax"              INTEGER,
  "bathsMin"             DOUBLE PRECISION,
  "bathsMax"             DOUBLE PRECISION,
  "sqftMin"              INTEGER,
  "sqftMax"              INTEGER,
  "lotSqftMin"           INTEGER,
  "lotSqftMax"           INTEGER,
  "yearBuiltMin"         INTEGER,
  "yearBuiltMax"         INTEGER,
  "ownershipDurationMin" INTEGER,
  "minEquityPct"         DOUBLE PRECISION,
  "ownerOccupied"        TEXT         NOT NULL DEFAULT 'any',
  "mlsStatuses"          JSONB        NOT NULL DEFAULT '[]',
  "maxDom"               INTEGER,
  "buyerName"            TEXT,
  "dispositionStrategy"  TEXT,
  "priority"             INTEGER      NOT NULL DEFAULT 0,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BuyBox_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "BuyBox_areaId_idx" ON "BuyBox"("areaId");
CREATE INDEX IF NOT EXISTS "BuyBox_active_idx" ON "BuyBox"("active");

-- ─── Canonical properties ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Property" (
  "id"                 TEXT         NOT NULL,
  "apn"                TEXT,
  "addressFingerprint" TEXT,
  "streetAddress"      TEXT         NOT NULL,
  "city"               TEXT         NOT NULL,
  "state"              TEXT         NOT NULL DEFAULT 'AZ',
  "zip"                TEXT         NOT NULL,
  "county"             TEXT,
  "subdivision"        TEXT,
  "propertyType"       TEXT,
  "beds"               INTEGER,
  "baths"              DOUBLE PRECISION,
  "sqft"               INTEGER,
  "lotSqft"            INTEGER,
  "yearBuilt"          INTEGER,
  "estimatedValue"     DOUBLE PRECISION,
  "lastSaleDate"       TIMESTAMP(3),
  "lastSalePrice"      DOUBLE PRECISION,
  "latitude"           DOUBLE PRECISION,
  "longitude"          DOUBLE PRECISION,
  "source"             TEXT         NOT NULL,
  "sourceId"           TEXT,
  "rawJson"            JSONB,
  "importRunId"        TEXT,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastRefreshedAt"    TIMESTAMP(3),
  CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Property_apn_key" ON "Property"("apn") WHERE "apn" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Property_addressFingerprint_key" ON "Property"("addressFingerprint") WHERE "addressFingerprint" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Property_zip_idx" ON "Property"("zip");
CREATE INDEX IF NOT EXISTS "Property_city_state_idx" ON "Property"("city", "state");
CREATE INDEX IF NOT EXISTS "Property_source_idx" ON "Property"("source");
CREATE INDEX IF NOT EXISTS "Property_importRunId_idx" ON "Property"("importRunId");

-- ─── Property owners ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PropertyOwner" (
  "id"                  TEXT         NOT NULL,
  "propertyId"          TEXT         NOT NULL,
  "firstName"           TEXT,
  "lastName"            TEXT,
  "fullName"            TEXT,
  "mailingAddress"      TEXT,
  "mailingCity"         TEXT,
  "mailingState"        TEXT,
  "mailingZip"          TEXT,
  "ownerOccupied"       BOOLEAN,
  "ownershipStartDate"  TIMESTAMP(3),
  "estimatedEquity"     DOUBLE PRECISION,
  "estimatedEquityPct"  DOUBLE PRECISION,
  "phone"               TEXT,
  "email"               TEXT,
  "rawJson"             JSONB,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PropertyOwner_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PropertyOwner_propertyId_idx" ON "PropertyOwner"("propertyId");

-- ─── MLS agents (deduplicated by mlsId or licenseNumber) ──────────
CREATE TABLE IF NOT EXISTS "MlsAgent" (
  "id"            TEXT         NOT NULL,
  "mlsId"         TEXT,
  "licenseNumber" TEXT,
  "firstName"     TEXT,
  "lastName"      TEXT,
  "fullName"      TEXT,
  "email"         TEXT,
  "phone"         TEXT,
  "brokerageName" TEXT,
  "rawJson"       JSONB,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MlsAgent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MlsAgent_mlsId_key" ON "MlsAgent"("mlsId") WHERE "mlsId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "MlsAgent_licenseNumber_key" ON "MlsAgent"("licenseNumber") WHERE "licenseNumber" IS NOT NULL;

-- ─── MLS listings ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "MlsListing" (
  "id"          TEXT         NOT NULL,
  "propertyId"  TEXT         NOT NULL,
  "mlsNumber"   TEXT         NOT NULL,
  "mlsStatus"   TEXT,
  "listPrice"   DOUBLE PRECISION,
  "listDate"    TIMESTAMP(3),
  "pendingDate" TIMESTAMP(3),
  "soldDate"    TIMESTAMP(3),
  "soldPrice"   DOUBLE PRECISION,
  "dom"         INTEGER,
  "agentId"     TEXT,
  "source"      TEXT         NOT NULL,
  "sourceId"    TEXT,
  "rawJson"     JSONB,
  "importRunId" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MlsListing_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MlsListing_mlsNumber_key" ON "MlsListing"("mlsNumber");
CREATE INDEX IF NOT EXISTS "MlsListing_propertyId_idx" ON "MlsListing"("propertyId");
CREATE INDEX IF NOT EXISTS "MlsListing_agentId_idx" ON "MlsListing"("agentId");
CREATE INDEX IF NOT EXISTS "MlsListing_mlsStatus_idx" ON "MlsListing"("mlsStatus");
CREATE INDEX IF NOT EXISTS "MlsListing_importRunId_idx" ON "MlsListing"("importRunId");

-- ─── Property–agent junction ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PropertyAgentRelationship" (
  "id"           TEXT         NOT NULL,
  "propertyId"   TEXT         NOT NULL,
  "agentId"      TEXT         NOT NULL,
  "mlsListingId" TEXT,
  "role"         TEXT         NOT NULL DEFAULT 'listing',
  "startDate"    TIMESTAMP(3),
  "endDate"      TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PropertyAgentRelationship_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PropertyAgentRelationship_propertyId_idx" ON "PropertyAgentRelationship"("propertyId");
CREATE INDEX IF NOT EXISTS "PropertyAgentRelationship_agentId_idx" ON "PropertyAgentRelationship"("agentId");
CREATE UNIQUE INDEX IF NOT EXISTS "PropertyAgentRelationship_unique"
  ON "PropertyAgentRelationship"("propertyId", "agentId", "role")
  WHERE "mlsListingId" IS NULL;

-- ─── Buy-box match results ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "BuyerMatch" (
  "id"               TEXT         NOT NULL,
  "propertyId"       TEXT         NOT NULL,
  "buyBoxId"         TEXT         NOT NULL,
  "score"            DOUBLE PRECISION NOT NULL DEFAULT 0,
  "matchExplanation" JSONB,
  "status"           TEXT         NOT NULL DEFAULT 'new',
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BuyerMatch_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BuyerMatch_propertyId_buyBoxId_key" UNIQUE ("propertyId", "buyBoxId")
);
CREATE INDEX IF NOT EXISTS "BuyerMatch_buyBoxId_idx" ON "BuyerMatch"("buyBoxId");
CREATE INDEX IF NOT EXISTS "BuyerMatch_status_idx" ON "BuyerMatch"("status");
CREATE INDEX IF NOT EXISTS "BuyerMatch_score_idx" ON "BuyerMatch"("score" DESC);

-- ─── Import run tracking ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ImportRun" (
  "id"           TEXT         NOT NULL,
  "source"       TEXT         NOT NULL,
  "actorId"      TEXT,
  "runId"        TEXT,
  "status"       TEXT         NOT NULL DEFAULT 'pending',
  "itemCount"    INTEGER,
  "startedAt"    TIMESTAMP(3),
  "completedAt"  TIMESTAMP(3),
  "errorMessage" TEXT,
  "rawMeta"      JSONB,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImportRun_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ImportRun_source_idx" ON "ImportRun"("source");
CREATE INDEX IF NOT EXISTS "ImportRun_status_idx" ON "ImportRun"("status");

-- ─── Enrichment records ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "EnrichmentRecord" (
  "id"             TEXT         NOT NULL,
  "propertyId"     TEXT         NOT NULL,
  "source"         TEXT         NOT NULL,
  "enrichmentType" TEXT         NOT NULL,
  "payload"        JSONB        NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EnrichmentRecord_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "EnrichmentRecord_propertyId_idx" ON "EnrichmentRecord"("propertyId");

-- ─── Acquisition leads ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "AcquisitionLead" (
  "id"           TEXT         NOT NULL,
  "propertyId"   TEXT         NOT NULL,
  "buyerMatchId" TEXT,
  "status"       TEXT         NOT NULL DEFAULT 'new',
  "assignee"     TEXT,
  "notes"        TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AcquisitionLead_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AcquisitionLead_propertyId_idx" ON "AcquisitionLead"("propertyId");
CREATE INDEX IF NOT EXISTS "AcquisitionLead_status_idx" ON "AcquisitionLead"("status");

-- ─── Call assignments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "CallAssignment" (
  "id"                TEXT         NOT NULL,
  "acquisitionLeadId" TEXT         NOT NULL,
  "assignee"          TEXT         NOT NULL,
  "priority"          INTEGER      NOT NULL DEFAULT 0,
  "dueDate"           TIMESTAMP(3),
  "status"            TEXT         NOT NULL DEFAULT 'pending',
  "notes"             TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CallAssignment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CallAssignment_acquisitionLeadId_idx" ON "CallAssignment"("acquisitionLeadId");
CREATE INDEX IF NOT EXISTS "CallAssignment_assignee_idx" ON "CallAssignment"("assignee");
CREATE INDEX IF NOT EXISTS "CallAssignment_status_idx" ON "CallAssignment"("status");

-- ─── Contact attempts ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ContactAttempt" (
  "id"                TEXT         NOT NULL,
  "acquisitionLeadId" TEXT         NOT NULL,
  "callAssignmentId"  TEXT,
  "channel"           TEXT         NOT NULL,
  "outcome"           TEXT,
  "notes"             TEXT,
  "attemptedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContactAttempt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ContactAttempt_acquisitionLeadId_idx" ON "ContactAttempt"("acquisitionLeadId");
CREATE INDEX IF NOT EXISTS "ContactAttempt_callAssignmentId_idx" ON "ContactAttempt"("callAssignmentId");

-- ─── Suppression records ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "SuppressionRecord" (
  "id"        TEXT         NOT NULL,
  "type"      TEXT         NOT NULL,
  "value"     TEXT         NOT NULL,
  "reason"    TEXT,
  "source"    TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SuppressionRecord_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SuppressionRecord_type_value_key" ON "SuppressionRecord"("type", "value");

-- ─── Foreign keys (all optional-cascade safe) ─────────────────────
ALTER TABLE "BuyBox"
  ADD CONSTRAINT "BuyBox_areaId_fkey"
  FOREIGN KEY ("areaId") REFERENCES "AcquisitionArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PropertyOwner"
  ADD CONSTRAINT "PropertyOwner_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MlsListing"
  ADD CONSTRAINT "MlsListing_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MlsListing"
  ADD CONSTRAINT "MlsListing_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "MlsAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MlsListing"
  ADD CONSTRAINT "MlsListing_importRunId_fkey"
  FOREIGN KEY ("importRunId") REFERENCES "ImportRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PropertyAgentRelationship"
  ADD CONSTRAINT "PropertyAgentRelationship_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PropertyAgentRelationship"
  ADD CONSTRAINT "PropertyAgentRelationship_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "MlsAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PropertyAgentRelationship"
  ADD CONSTRAINT "PropertyAgentRelationship_mlsListingId_fkey"
  FOREIGN KEY ("mlsListingId") REFERENCES "MlsListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BuyerMatch"
  ADD CONSTRAINT "BuyerMatch_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BuyerMatch"
  ADD CONSTRAINT "BuyerMatch_buyBoxId_fkey"
  FOREIGN KEY ("buyBoxId") REFERENCES "BuyBox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Property"
  ADD CONSTRAINT "Property_importRunId_fkey"
  FOREIGN KEY ("importRunId") REFERENCES "ImportRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EnrichmentRecord"
  ADD CONSTRAINT "EnrichmentRecord_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AcquisitionLead"
  ADD CONSTRAINT "AcquisitionLead_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AcquisitionLead"
  ADD CONSTRAINT "AcquisitionLead_buyerMatchId_fkey"
  FOREIGN KEY ("buyerMatchId") REFERENCES "BuyerMatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CallAssignment"
  ADD CONSTRAINT "CallAssignment_acquisitionLeadId_fkey"
  FOREIGN KEY ("acquisitionLeadId") REFERENCES "AcquisitionLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContactAttempt"
  ADD CONSTRAINT "ContactAttempt_acquisitionLeadId_fkey"
  FOREIGN KEY ("acquisitionLeadId") REFERENCES "AcquisitionLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContactAttempt"
  ADD CONSTRAINT "ContactAttempt_callAssignmentId_fkey"
  FOREIGN KEY ("callAssignmentId") REFERENCES "CallAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
