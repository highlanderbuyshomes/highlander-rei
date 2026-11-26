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
