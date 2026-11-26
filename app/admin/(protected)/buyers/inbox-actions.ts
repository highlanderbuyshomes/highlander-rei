"use server";

import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  addNote, addTags, getContact, getNotes, getThread, locationTags, markRead, removeTags, sendSms, updateContact,
  type GhlContact, type GhlNote, type GhlThreadMessage,
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

export type ThreadData = { contact: GhlContact; notes: GhlNote[]; messages: GhlThreadMessage[] };

/** Live thread, contact and notes from GHL; also clears the unread count there. */
export async function loadThread(conversationId: string, contactId: string, unread: number): Promise<Result<ThreadData>> {
  return run(async () => {
    const [contact, notes, messages] = await Promise.all([getContact(contactId), getNotes(contactId), getThread(conversationId)]);
    if (unread > 0) {
      await markRead(conversationId).catch(() => {});
      await prisma.ghlConversation.update({ where: { id: conversationId }, data: { unreadCount: 0 } }).catch(() => {});
    }
    await prisma.ghlConversation
      .update({
        where: { id: conversationId },
        data: {
          tags: contact.tags,
          contactName: [contact.firstName, contact.lastName].filter(Boolean).join(" ") || undefined,
          phone: contact.phone,
          email: contact.email,
        },
      })
      .catch(() => {});
    return { contact, notes, messages };
  });
}

export async function sendReply(contactId: string, message: string): Promise<Result<null>> {
  return run(async () => {
    const text = message.trim();
    if (!text) throw new Error("Message is empty");
    if (text.length > 1600) throw new Error("Message is too long for SMS");
    await sendSms(contactId, text);
    return null;
  });
}

export async function changeTags(conversationId: string, contactId: string, add: string[], remove: string[]): Promise<Result<string[]>> {
  return run(async () => {
    const clean = (l: string[]) => [...new Set(l.map((t) => t.trim().toLowerCase()).filter(Boolean))];
    if (clean(add).length) await addTags(contactId, clean(add));
    if (clean(remove).length) await removeTags(contactId, clean(remove));
    const { tags } = await getContact(contactId);
    await prisma.ghlConversation.update({ where: { id: conversationId }, data: { tags } }).catch(() => {});
    return tags;
  });
}

export async function createNote(contactId: string, body: string): Promise<Result<GhlNote>> {
  return run(async () => {
    const text = body.trim();
    if (!text) throw new Error("Note is empty");
    return addNote(contactId, text);
  });
}

export async function saveContact(
  conversationId: string,
  contactId: string,
  fields: { firstName: string; lastName: string; email: string; phone: string },
): Promise<Result<GhlContact>> {
  return run(async () => {
    const contact = await updateContact(contactId, {
      firstName: fields.firstName.trim(),
      lastName: fields.lastName.trim(),
      email: fields.email.trim() || null,
      phone: fields.phone.trim() || null,
    });
    await prisma.ghlConversation
      .update({
        where: { id: conversationId },
        data: { contactName: [contact.firstName, contact.lastName].filter(Boolean).join(" ") || null, phone: contact.phone, email: contact.email },
      })
      .catch(() => {});
    return contact;
  });
}

export async function allTags(): Promise<Result<string[]>> {
  return run(locationTags);
}
