import "server-only";

import { prisma } from "@/lib/prisma";
import {
  conversationSentiment,
  isEligibleMessageType,
  replyText,
  type InboundReply,
} from "./ghl-sentiment";

const API = "https://services.leadconnectorhq.com";
const STATE_ID = "conversations";
// First run looks back this far; later runs pick up from the watermark.
const BACKFILL_DAYS = 30;
const MESSAGES_PER_CONVERSATION = 30;
// GHL allows 100 requests / 10s per location; stay well under it.
const PARALLEL = 4;
const MIN_BATCH_MS = 600;

type GhlConversationRow = {
  id: string;
  contactId: string;
  fullName?: string | null;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  tags?: string[] | null;
  unreadCount?: number | null;
  lastMessageDate?: number | null;
};

type GhlMessage = {
  direction?: string;
  messageType?: string;
  body?: string | null;
  dateAdded?: string;
};

export function ghlConfig() {
  const token = process.env.GHL_API_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  return token && locationId ? { token, locationId } : null;
}

export function ghlContactUrl(contactId: string): string {
  const base = process.env.GHL_APP_URL || "https://app.gohighlevel.com";
  return `${base}/v2/location/${process.env.GHL_LOCATION_ID}/contacts/detail/${contactId}`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ghl<T>(path: string, token: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Version: "2021-07-28", Accept: "application/json" },
      cache: "no-store",
    });
    if (res.status === 429 && attempt < 3) {
      await sleep(2000 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`GHL ${res.status} on ${path.split("?")[0]}`);
    return (await res.json()) as T;
  }
}

// Conversations whose last message is newer than `since`, newest first.
// Always listed in full (cheap: 100 per call) so the watermark never skips a gap.
async function changedConversations(token: string, locationId: string, since: Date) {
  const out: GhlConversationRow[] = [];
  let cursor: number | null = null;
  for (let pages = 0; pages < 100; pages++) {
    const qs = new URLSearchParams({ locationId, limit: "100", sort: "desc", sortBy: "last_message_date" });
    if (cursor) qs.set("startAfterDate", String(cursor));
    const page = await ghl<{ conversations?: GhlConversationRow[] }>(`/conversations/search?${qs}`, token);
    const rows = page.conversations ?? [];
    let reachedOld = false;
    for (const row of rows) {
      if (!row.lastMessageDate || row.lastMessageDate <= since.getTime()) {
        reachedOld = true;
        break;
      }
      out.push(row);
    }
    if (reachedOld || rows.length < 100) break;
    const next = rows[rows.length - 1].lastMessageDate ?? null;
    if (!next || next === cursor) break;
    cursor = next;
  }
  return out;
}

async function syncOne(row: GhlConversationRow, token: string) {
  const data = await ghl<{ messages?: { messages?: GhlMessage[] } }>(
    `/conversations/${row.id}/messages?limit=${MESSAGES_PER_CONVERSATION}`,
    token,
  );
  const replies: InboundReply[] = [];
  for (const m of data.messages?.messages ?? []) {
    if (m.direction !== "inbound" || !isEligibleMessageType(m.messageType) || !m.body || !m.dateAdded) continue;
    const body = replyText(m.body, m.messageType!);
    if (body) replies.push({ body, at: new Date(m.dateAdded), messageType: m.messageType! });
  }
  if (!replies.length) return;

  const { sentiment, positive } = conversationSentiment(replies);
  const last = replies.reduce((a, b) => (b.at > a.at ? b : a));
  const fields = {
    contactId: row.contactId,
    contactName: row.contactName || row.fullName || null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    tags: row.tags ?? [],
    channel: (positive ?? last).messageType.replace(/^TYPE_/, ""),
    sentiment,
    positiveBody: positive?.body ?? null,
    positiveAt: positive?.at ?? null,
    lastInboundBody: last.body,
    lastInboundAt: last.at,
    lastMessageAt: new Date(row.lastMessageDate ?? last.at.getTime()),
    unreadCount: row.unreadCount ?? 0,
  };
  await prisma.ghlConversation.upsert({ where: { id: row.id }, create: { id: row.id, ...fields }, update: fields });
}

export type SyncResult = { scanned: number; synced: number; done: boolean; error?: string };

// Incremental: walks conversations changed since the watermark, oldest first,
// and moves the watermark after each finished batch so a timed-out run
// resumes where it stopped.
export async function syncGhlConversations(budgetMs: number): Promise<SyncResult> {
  const cfg = ghlConfig();
  if (!cfg) return { scanned: 0, synced: 0, done: true, error: "GHL_API_TOKEN / GHL_LOCATION_ID not set" };
  const deadline = Date.now() + budgetMs;
  const state = await prisma.ghlSyncState.findUnique({ where: { id: STATE_ID } });
  const since = state?.watermark ?? new Date(Date.now() - BACKFILL_DAYS * 86_400_000);

  let synced = 0;
  let scanned = 0;
  try {
    const changed = (await changedConversations(cfg.token, cfg.locationId, since)).reverse();
    scanned = changed.length;
    for (let i = 0; i < changed.length; i += PARALLEL) {
      if (Date.now() > deadline) break;
      const started = Date.now();
      const batch = changed.slice(i, i + PARALLEL);
      await Promise.all(batch.map((row) => syncOne(row, cfg.token)));
      synced += batch.length;
      const watermark = new Date(Math.max(...batch.map((r) => r.lastMessageDate ?? 0)));
      await prisma.ghlSyncState.upsert({
        where: { id: STATE_ID },
        create: { id: STATE_ID, watermark, lastRunAt: new Date(), lastError: null },
        update: { watermark, lastRunAt: new Date(), lastError: null },
      });
      const wait = MIN_BATCH_MS - (Date.now() - started);
      if (wait > 0 && i + PARALLEL < changed.length) await sleep(wait);
    }
    await prisma.ghlSyncState.upsert({
      where: { id: STATE_ID },
      create: { id: STATE_ID, watermark: since, lastRunAt: new Date() },
      update: { lastRunAt: new Date(), lastError: null },
    });
    return { scanned, synced, done: synced === scanned };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.ghlSyncState
      .upsert({
        where: { id: STATE_ID },
        create: { id: STATE_ID, lastRunAt: new Date(), lastError: message },
        update: { lastRunAt: new Date(), lastError: message },
      })
      .catch(() => {});
    return { scanned, synced, done: false, error: message };
  }
}
