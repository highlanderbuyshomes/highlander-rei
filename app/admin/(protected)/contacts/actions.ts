"use server";

import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createContact(formData: FormData) {
  await requireAdmin();
  const name    = String(formData.get("name")    ?? "").trim();
  const email   = String(formData.get("email")   ?? "").trim();
  const phone   = String(formData.get("phone")   ?? "").trim() || null;
  const company = String(formData.get("company") ?? "").trim() || null;
  const notes   = String(formData.get("notes")   ?? "").trim() || null;
  if (!name || !email) throw new Error("Name and email required");

  await prisma.contact.upsert({
    where: { email },
    create: { name, email, phone, company, notes },
    update: { name, phone, company, notes },
  });

  revalidatePath("/admin/contacts");
  redirect("/admin/contacts");
}

export async function updateContact(id: string, formData: FormData) {
  await requireAdmin();
  await prisma.contact.update({
    where: { id },
    data: {
      name:    String(formData.get("name")    ?? "").trim(),
      phone:   String(formData.get("phone")   ?? "").trim() || null,
      company: String(formData.get("company") ?? "").trim() || null,
      notes:   String(formData.get("notes")   ?? "").trim() || null,
    },
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
