CREATE TABLE IF NOT EXISTS "AgreementTemplate" (
  "id"          TEXT        NOT NULL,
  "type"        TEXT        NOT NULL,
  "name"        TEXT        NOT NULL,
  "pdfUrl"      TEXT,
  "description" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgreementTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AgreementTemplate_type_key" ON "AgreementTemplate"("type");
