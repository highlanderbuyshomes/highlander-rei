"use server";

import { requireAdmin } from "@/lib/session";
import {
  addNote, addTags, getBuyBox, getNotes, moveOpportunity, removeTags, saveBuyBox, updateContact,
  type BuyBoxValues, type GhlContact, type GhlNote,
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

export type CardData = { contact: GhlContact; buyBox: BuyBoxValues; notes: GhlNote[] };

export async function openBuyer(contactId: string): Promise<Result<CardData>> {
  return run(async () => {
    const [{ contact, buyBox }, notes] = await Promise.all([getBuyBox(contactId), getNotes(contactId)]);
    return { contact, buyBox, notes };
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
