import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { ghlConfig, ghlContactUrl } from "@/lib/integrations/ghl-conversations";
import ConversationsPanel from "./ConversationsPanel";
import PipelineBoard from "./PipelineBoard";
import { BUY_BOX_FIELDS, INVESTORS_PIPELINE_ID, getPipelineStages, listOpportunities, type PipelineCard, type PipelineStage } from "@/lib/integrations/ghl-api";
import styles from "./buyers.module.css";

export const metadata: Metadata = { title: "Buyers | Highlander REI" };

export default async function BuyersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const tab = params.tab === "conversations" ? "conversations" : "buyers";

  const tabs = <nav className={styles.tabs} aria-label="Buyers">
    <Link href="/admin/buyers" className={tab === "buyers" ? styles.tabActive : undefined}>Buyers</Link>
    <Link href="/admin/buyers?tab=conversations" className={tab === "conversations" ? styles.tabActive : undefined}>Conversations</Link>
  </nav>;

  if (tab === "conversations") {
    const [rows, state] = await Promise.all([
      prisma.ghlConversation.findMany({
        where: { sentiment: "positive" },
        orderBy: { positiveAt: "desc" },
        take: 300,
      }),
      prisma.ghlSyncState.findUnique({ where: { id: "conversations" } }),
    ]);
    return <ConversationsPanel
      tabs={tabs}
      configured={Boolean(ghlConfig())}
      lastRunAt={state?.lastRunAt?.toISOString() ?? null}
      lastError={state?.lastError ?? null}
      initialId={typeof params.c === "string" ? params.c : null}
      conversations={rows.map((row) => ({
        id: row.id,
        contactId: row.contactId,
        name: row.contactName,
        phone: row.phone,
        email: row.email,
        tags: Array.isArray(row.tags) ? row.tags.filter((t): t is string => typeof t === "string") : [],
        channel: row.channel,
        body: row.positiveBody ?? "",
        at: (row.positiveAt ?? row.lastMessageAt).toISOString(),
        lastInbound: row.lastInboundBody !== row.positiveBody ? row.lastInboundBody : null,
        unread: row.unreadCount,
        ghlUrl: ghlContactUrl(row.contactId),
      }))}
    />;
  }

  let stages: PipelineStage[] = [];
  let cards: PipelineCard[] = [];
  let error: string | null = null;
  if (!ghlConfig()) error = "GHL_API_TOKEN / GHL_LOCATION_ID not set";
  else {
    try {
      const [pipeline, opps] = await Promise.all([getPipelineStages(INVESTORS_PIPELINE_ID), listOpportunities(INVESTORS_PIPELINE_ID)]);
      stages = pipeline.stages;
        cards = opps;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
  }
  return <PipelineBoard
    key={cards.map((c) => `${c.id}:${c.stageId}:${c.updatedAt}`).join("|")}
    tabs={tabs}
    stages={stages}
    cards={cards}
    fields={BUY_BOX_FIELDS}
    contactUrl={ghlContactUrl("").replace(/\/$/, "")}
    error={error}
  />;
}
