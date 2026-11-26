"use server";

import { requireAdmin } from "@/lib/session";
import {
  addNote, addTags, findConversationId, getBuyBox, getNotes, getThread, moveOpportunity, removeTags, saveBuyBox, sendSms, updateContact,
  type BuyBoxValues, type GhlContact, type GhlNote, type GhlThreadMessage,
} from "@/lib/integrations/ghl-api";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function run<T>(fn: () => Promise<T>): Promise<Result<T>> {
  await requireAdmin();
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export type CardData = { contact: GhlContact; buyBox: BuyBoxValues; notes: GhlNote[]; messages: GhlThreadMessage[] };

export async function openBuyer(contactId: string): Promise<Result<CardData>> {
  return run(async () => {
    const [{ contact, buyBox }, notes, conversationId] = await Promise.all([getBuyBox(contactId), getNotes(contactId), findConversationId(contactId)]);
    const messages = conversationId ? await getThread(conversationId) : [];
    return { contact, buyBox, notes, messages };
  });
}

export async function textBuyer(contactId: string, message: string): Promise<Result<null>> {
  return run(async () => {
    const text = message.trim();
    if (!text) throw new Error("Message is empty");
    await sendSms(contactId, text);
    return null;
  });
}

export async function moveBuyer(opportunityId: string, stageId: string): Promise<Result<null>> {
  return run(async () => {
    await moveOpportunity(opportunityId, stageId);
    return null;
  });
}

export async function saveBuyerBox(contactId: string, values: BuyBoxValues): Promise<Result<BuyBoxValues>> {
  return run(async () => {
    await saveBuyBox(contactId, values);
    return (await getBuyBox(contactId)).buyBox;
  });
}

export async function saveBuyerContact(
  contactId: string,
  fields: { firstName: string; lastName: string; email: string; phone: string },
): Promise<Result<GhlContact>> {
  return run(() =>
    updateContact(contactId, {
      firstName: fields.firstName.trim(),
      lastName: fields.lastName.trim(),
      email: fields.email.trim() || null,
      phone: fields.phone.trim() || null,
    }),
  );
}

export async function tagBuyer(contactId: string, add: string[], remove: string[]): Promise<Result<string[]>> {
  return run(async () => {
    const clean = (l: string[]) => [...new Set(l.map((t) => t.trim().toLowerCase()).filter(Boolean))];
    if (clean(add).length) await addTags(contactId, clean(add));
    if (clean(remove).length) await removeTags(contactId, clean(remove));
    return (await getBuyBox(contactId)).contact.tags;
  });
}

export async function noteBuyer(contactId: string, body: string): Promise<Result<GhlNote>> {
  return run(async () => {
    if (!body.trim()) throw new Error("Note is empty");
    return addNote(contactId, body.trim());
  });
}
