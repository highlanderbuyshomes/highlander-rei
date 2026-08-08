-- Only the statements for AdminUser + CallAssignment.assigneeUserId.
-- Deliberately excludes every DROP TABLE/CONSTRAINT/TYPE from the diff —
-- those belong to a separate, unrelated app sharing this database.

CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'caller',
    "forwardingPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

ALTER TABLE "CallAssignment" ADD COLUMN "assigneeUserId" TEXT;

CREATE INDEX "CallAssignment_assigneeUserId_idx" ON "CallAssignment"("assigneeUserId");

ALTER TABLE "CallAssignment" ADD CONSTRAINT "CallAssignment_assigneeUserId_fkey" FOREIGN KEY ("assigneeUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
