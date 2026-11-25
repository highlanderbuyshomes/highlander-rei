-- GHL conversation sync for Our Buyers > Conversations. Additive only: this
-- database is shared with a separate app.

CREATE TABLE "GhlConversation" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "channel" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "positiveBody" TEXT,
    "positiveAt" TIMESTAMP(3),
    "lastInboundBody" TEXT,
    "lastInboundAt" TIMESTAMP(3),
    "lastMessageAt" TIMESTAMP(3) NOT NULL,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GhlConversation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GhlConversation_sentiment_positiveAt_idx" ON "GhlConversation"("sentiment", "positiveAt");

CREATE TABLE "GhlSyncState" (
    "id" TEXT NOT NULL,
    "watermark" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "lastError" TEXT,

    CONSTRAINT "GhlSyncState_pkey" PRIMARY KEY ("id")
);
