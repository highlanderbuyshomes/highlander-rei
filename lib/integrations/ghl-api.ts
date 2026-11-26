import "server-only";

import { ghlConfig } from "./ghl-conversations";
import { isEligibleMessageType, replyText } from "./ghl-sentiment";

const API = "https://services.leadconnectorhq.com";

export class GhlError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function call<T>(method: string, path: string, body?: unknown, version = "2021-07-28"): Promise<T> {
  const cfg = ghlConfig();
  if (!cfg) throw new GhlError(500, "GHL_API_TOKEN / GHL_LOCATION_ID not set");
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Version: version,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    let detail = text.slice(0, 200);
    try {
      const j = JSON.parse(text);
      detail = Array.isArray(j.message) ? j.message.join(", ") : j.message ?? j.error ?? detail;
    } catch {}
    if (res.status === 401 || res.status === 403) detail = `GHL token isn't allowed to do this (${res.status}): ${detail}`;
    throw new GhlError(res.status, detail);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

export type GhlContact = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  tags: string[];
  dnd: boolean;
  source: string | null;
  dateAdded: string | null;
};

export type GhlNote = { id: string; body: string; dateAdded: string };

export type GhlThreadMessage = {
  id: string;
  direction: "inbound" | "outbound";
  channel: string;
  body: string;
  at: string;
  status: string | null;
};

type RawContact = {
  id: string; firstName?: string; lastName?: string; email?: string; phone?: string;
  tags?: string[]; dnd?: boolean; source?: string; dateAdded?: string;
};

function toContact(c: RawContact): GhlContact {
  return {
    id: c.id,
    firstName: c.firstName ?? null,
    lastName: c.lastName ?? null,
    email: c.email ?? null,
    phone: c.phone ?? null,
    tags: c.tags ?? [],
    dnd: Boolean(c.dnd),
    source: c.source ?? null,
    dateAdded: c.dateAdded ?? null,
  };
}

export async function getContact(contactId: string): Promise<GhlContact> {
  const d = await call<{ contact: RawContact }>("GET", `/contacts/${contactId}`);
  return toContact(d.contact);
}

export async function getNotes(contactId: string): Promise<GhlNote[]> {
  const d = await call<{ notes?: { id: string; body?: string; dateAdded?: string }[] }>("GET", `/contacts/${contactId}/notes`);
  return (d.notes ?? [])
    .map((n) => ({ id: n.id, body: n.body ?? "", dateAdded: n.dateAdded ?? "" }))
    .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
}

export async function getThread(conversationId: string): Promise<GhlThreadMessage[]> {
  const d = await call<{ messages?: { messages?: { id: string; direction?: string; messageType?: string; body?: string | null; dateAdded?: string; status?: string }[] } }>(
    "GET",
    `/conversations/${conversationId}/messages?limit=60`,
  );
  return (d.messages?.messages ?? [])
    .filter((m) => m.body && isEligibleMessageType(m.messageType))
    .map((m) => ({
      id: m.id,
      direction: m.direction === "inbound" ? ("inbound" as const) : ("outbound" as const),
      channel: (m.messageType ?? "").replace(/^TYPE_/, ""),
      body: replyText(m.body!, m.messageType ?? ""),
      at: m.dateAdded ?? "",
      status: m.status ?? null,
    }))
    .filter((m) => m.body)
    .sort((a, b) => a.at.localeCompare(b.at));
}

export async function sendSms(contactId: string, message: string): Promise<void> {
  await call("POST", "/conversations/messages", { type: "SMS", contactId, message }, "2021-04-15");
}

export async function addTags(contactId: string, tags: string[]): Promise<string[]> {
  const d = await call<{ tags?: string[] }>("POST", `/contacts/${contactId}/tags`, { tags });
  return d.tags ?? [];
}

export async function removeTags(contactId: string, tags: string[]): Promise<string[]> {
  const d = await call<{ tags?: string[] }>("DELETE", `/contacts/${contactId}/tags`, { tags });
  return d.tags ?? [];
}

export async function addNote(contactId: string, body: string): Promise<GhlNote> {
  const d = await call<{ note?: { id: string; body?: string; dateAdded?: string } }>("POST", `/contacts/${contactId}/notes`, { body });
  return { id: d.note?.id ?? crypto.randomUUID(), body: d.note?.body ?? body, dateAdded: d.note?.dateAdded ?? new Date().toISOString() };
}

export async function updateContact(
  contactId: string,
  fields: Partial<Pick<GhlContact, "firstName" | "lastName" | "email" | "phone">>,
): Promise<GhlContact> {
  const d = await call<{ contact: RawContact }>("PUT", `/contacts/${contactId}`, fields);
  return toContact(d.contact);
}

export async function markRead(conversationId: string): Promise<void> {
  await call("PUT", `/conversations/${conversationId}`, { locationId: ghlConfig()?.locationId, unreadCount: 0 }, "2021-04-15");
}

export async function locationTags(): Promise<string[]> {
  const cfg = ghlConfig();
  if (!cfg) return [];
  const d = await call<{ tags?: { name: string }[] }>("GET", `/locations/${cfg.locationId}/tags`);
  return (d.tags ?? []).map((t) => t.name).sort((a, b) => a.localeCompare(b));
}

// ── Investors pipeline ───────────────────────────────────────────────

export const INVESTORS_PIPELINE_ID = "beW9rFDD9pfnSh0JnwyU";

/** Contact custom fields that make up a buyer's buy box in GHL. */
export const BUY_BOX_FIELDS = [
  { id: "jlCKOhBUnsa8rPGhudPq", label: "Buying areas" },
  { id: "k8ezQbdLl5Rt9CQqb2TE", label: "Price range" },
  { id: "y5WNK2L59BWms3ZwDnKx", label: "Cash or hard money" },
  { id: "Hve46adMbXU2elf8a2k5", label: "How soon can close" },
  { id: "leDLYD1D8knO3opyJc61", label: "Buyer area" },
  { id: "Cp4LGHTw0V5ImnDeuJXV", label: "Buyer timeline" },
] as const;

export type PipelineStage = { id: string; name: string };
export type PipelineCard = {
  id: string;
  stageId: string;
  contactId: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  tags: string[];
  value: number;
  status: string;
  updatedAt: string;
};

export async function getPipelineStages(pipelineId: string): Promise<{ name: string; stages: PipelineStage[] }> {
  const cfg = ghlConfig();
  const d = await call<{ pipelines?: { id: string; name: string; stages: { id: string; name: string }[] }[] }>("GET", `/opportunities/pipelines?locationId=${cfg?.locationId}`);
  const p = d.pipelines?.find((x) => x.id === pipelineId);
  if (!p) throw new GhlError(404, "Investors pipeline not found in GHL");
  return { name: p.name, stages: p.stages.map((s) => ({ id: s.id, name: s.name })) };
}

type RawOpp = {
  id: string; name?: string; pipelineId?: string; pipelineStageId: string; contactId: string; monetaryValue?: number; status?: string; updatedAt?: string;
  contact?: { name?: string; companyName?: string; phone?: string; email?: string; tags?: string[] };
};

export async function listOpportunities(pipelineId: string): Promise<PipelineCard[]> {
  const cfg = ghlConfig();
  const out: PipelineCard[] = [];
  let cursor = "";
  for (let page = 0; page < 20; page++) {
    const d = await call<{ opportunities?: RawOpp[]; meta?: { startAfter?: number; startAfterId?: string; total?: number } }>(
      "GET",
      `/opportunities/search?location_id=${cfg?.locationId}&pipeline_id=${pipelineId}&limit=100${cursor}`,
    );
    for (const o of d.opportunities ?? []) {
      if (o.status && o.status !== "open" && o.status !== "won") continue;
      out.push({
        id: o.id,
        stageId: o.pipelineStageId,
        contactId: o.contactId,
        name: o.contact?.name || o.name || "Unknown",
        company: o.contact?.companyName || null,
        phone: o.contact?.phone || null,
        email: o.contact?.email || null,
        tags: o.contact?.tags ?? [],
        value: o.monetaryValue ?? 0,
        status: o.status ?? "open",
        updatedAt: o.updatedAt ?? "",
      });
    }
    const m = d.meta;
    if (!m?.startAfterId || (d.opportunities?.length ?? 0) < 100 || out.length >= (m.total ?? 0)) break;
    cursor = `&startAfter=${m.startAfter}&startAfterId=${m.startAfterId}`;
  }
  return out;
}

export async function moveOpportunity(opportunityId: string, stageId: string): Promise<void> {
  await call("PUT", `/opportunities/${opportunityId}`, { pipelineId: INVESTORS_PIPELINE_ID, pipelineStageId: stageId });
}

export type BuyBoxValues = Record<string, string>;

export async function getBuyBox(contactId: string): Promise<{ contact: GhlContact; buyBox: BuyBoxValues }> {
  const d = await call<{ contact: RawContact & { customFields?: { id: string; value?: unknown }[] } }>("GET", `/contacts/${contactId}`);
  const values: BuyBoxValues = {};
  for (const f of d.contact.customFields ?? []) {
    if (BUY_BOX_FIELDS.some((b) => b.id === f.id) && f.value != null) values[f.id] = Array.isArray(f.value) ? f.value.join(", ") : String(f.value);
  }
  return { contact: toContact(d.contact), buyBox: values };
}

export async function saveBuyBox(contactId: string, values: BuyBoxValues): Promise<void> {
  const customFields = BUY_BOX_FIELDS.map((f) => ({ id: f.id, field_value: (values[f.id] ?? "").trim() }));
  await call("PUT", `/contacts/${contactId}`, { customFields });
}

// ── Any pipeline (Conversations → "Add to pipeline") ─────────────────

export type Pipeline = { id: string; name: string; stages: PipelineStage[] };
export type ContactDeal = { id: string; pipelineId: string; stageId: string; status: string };

export async function listPipelines(): Promise<Pipeline[]> {
  const cfg = ghlConfig();
  const d = await call<{ pipelines?: { id: string; name: string; stages: { id: string; name: string }[] }[] }>("GET", `/opportunities/pipelines?locationId=${cfg?.locationId}`);
  return (d.pipelines ?? []).map((p) => ({ id: p.id, name: p.name, stages: p.stages.map((s) => ({ id: s.id, name: s.name })) }));
}

export async function contactDeals(contactId: string): Promise<ContactDeal[]> {
  const cfg = ghlConfig();
  const d = await call<{ opportunities?: RawOpp[] }>("GET", `/opportunities/search?location_id=${cfg?.locationId}&contact_id=${contactId}&limit=50`);
  return (d.opportunities ?? []).map((o) => ({ id: o.id, pipelineId: o.pipelineId ?? "", stageId: o.pipelineStageId, status: o.status ?? "open" }));
}

/**
 * Puts the contact in a pipeline stage: moves their existing opportunity in
 * that pipeline, or creates one (named after the contact) if they have none.
 */
export async function placeInPipeline(contactId: string, name: string, pipelineId: string, stageId: string): Promise<ContactDeal[]> {
  const existing = (await contactDeals(contactId)).find((d) => d.pipelineId === pipelineId);
  if (existing) {
    await call("PUT", `/opportunities/${existing.id}`, { pipelineId, pipelineStageId: stageId, status: "open" });
  } else {
    await call("POST", "/opportunities/", {
      locationId: ghlConfig()?.locationId,
      contactId,
      pipelineId,
      pipelineStageId: stageId,
      name: name || "New opportunity",
      status: "open",
    });
  }
  return contactDeals(contactId);
}

/** The contact's GHL conversation (most recent), if they have one. */
export async function findConversationId(contactId: string): Promise<string | null> {
  const cfg = ghlConfig();
  const d = await call<{ conversations?: { id: string }[] }>("GET", `/conversations/search?locationId=${cfg?.locationId}&contactId=${contactId}&limit=1&sort=desc&sortBy=last_message_date`);
  return d.conversations?.[0]?.id ?? null;
}
