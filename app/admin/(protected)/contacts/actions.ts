"use server";

import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function buildName(firstName: string | null, lastName: string | null, fallback: string) {
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName) return firstName;
  if (lastName) return lastName;
  return fallback;
}

export async function createContact(formData: FormData) {
  await requireAdmin();
  const firstName   = String(formData.get("firstName")   ?? "").trim() || null;
  const lastName    = String(formData.get("lastName")    ?? "").trim() || null;
  const email       = String(formData.get("email")       ?? "").trim();
  const phone       = String(formData.get("phone")       ?? "").trim() || null;
  const company     = String(formData.get("company")     ?? "").trim() || null;
  const contactType = String(formData.get("contactType") ?? "").trim() || null;
  const notes       = String(formData.get("notes")       ?? "").trim() || null;

  if (!email) throw new Error("Email required");
  const name = buildName(firstName, lastName, email);

  await prisma.contact.upsert({
    where: { email },
    create: { name, firstName, lastName, email, phone, company, contactType, notes },
    update: { name, firstName, lastName, phone, company, contactType, notes },
  });

  revalidatePath("/admin/contacts");
  redirect("/admin/contacts");
}

export async function updateContact(id: string, formData: FormData) {
  await requireAdmin();
  const firstName   = String(formData.get("firstName")   ?? "").trim() || null;
  const lastName    = String(formData.get("lastName")    ?? "").trim() || null;
  const phone       = String(formData.get("phone")       ?? "").trim() || null;
  const company     = String(formData.get("company")     ?? "").trim() || null;
  const contactType = String(formData.get("contactType") ?? "").trim() || null;
  const notes       = String(formData.get("notes")       ?? "").trim() || null;
  const name = buildName(firstName, lastName, "");

  await prisma.contact.update({
    where: { id },
    data: { name, firstName, lastName, phone, company, contactType, notes },
  });
  revalidatePath("/admin/contacts");
  redirect("/admin/contacts");
}

export async function deleteContact(id: string) {
  await requireAdmin();
  await prisma.contact.delete({ where: { id } });
  revalidatePath("/admin/contacts");
  redirect("/admin/contacts");
}
