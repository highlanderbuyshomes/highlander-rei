-- Contact table
CREATE TABLE IF NOT EXISTS "Contact" (
  "id"        TEXT         NOT NULL,
  "name"      TEXT         NOT NULL,
  "email"     TEXT         NOT NULL,
  "phone"     TEXT,
  "company"   TEXT,
  "notes"     TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Contact_email_key" ON "Contact"("email");

-- AgreementSigner table
CREATE TABLE IF NOT EXISTS "AgreementSigner" (
  "id"          TEXT         NOT NULL,
  "agreementId" TEXT         NOT NULL,
  "contactId"   TEXT,
  "name"        TEXT         NOT NULL,
  "email"       TEXT         NOT NULL,
  "token"       TEXT         NOT NULL,
  "order"       INTEGER      NOT NULL DEFAULT 0,
  "fieldData"   JSONB,
  "emailedAt"   TIMESTAMP(3),
  "signedAt"    TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgreementSigner_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AgreementSigner_token_key"        ON "AgreementSigner"("token");
CREATE INDEX       IF NOT EXISTS "AgreementSigner_agreementId_idx"   ON "AgreementSigner"("agreementId");

DO $$ BEGIN
  ALTER TABLE "AgreementSigner" ADD CONSTRAINT "AgreementSigner_agreementId_fkey"
    FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AgreementSigner" ADD CONSTRAINT "AgreementSigner_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- TemplateField table
CREATE TABLE IF NOT EXISTS "TemplateField" (
  "id"          TEXT             NOT NULL,
  "templateId"  TEXT             NOT NULL,
  "type"        TEXT             NOT NULL,
  "label"       TEXT,
  "page"        INTEGER          NOT NULL DEFAULT 1,
  "x"           DOUBLE PRECISION NOT NULL,
  "y"           DOUBLE PRECISION NOT NULL,
  "width"       DOUBLE PRECISION NOT NULL,
  "height"      DOUBLE PRECISION NOT NULL,
  "signerIndex" INTEGER          NOT NULL DEFAULT 0,
  "required"    BOOLEAN          NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TemplateField_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TemplateField_templateId_idx" ON "TemplateField"("templateId");

DO $$ BEGIN
  ALTER TABLE "TemplateField" ADD CONSTRAINT "TemplateField_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "AgreementTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AgreementTemplate: add signerCount if not present
ALTER TABLE "AgreementTemplate" ADD COLUMN IF NOT EXISTS "signerCount" INTEGER NOT NULL DEFAULT 1;
