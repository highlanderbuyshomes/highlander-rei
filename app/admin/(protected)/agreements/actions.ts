"use server";

import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";

export async function createAgreement(formData: FormData) {
  await requireAdmin();

  const type    = String(formData.get("type")    ?? "");
  const address = String(formData.get("address") ?? "").trim();
  const sellers = String(formData.get("sellers") ?? "").trim();
  if (!type || !address || !sellers) throw new Error("Missing required fields");

  // Upload PDF if provided
  let pdfUrl: string | null = null;
  const file = formData.get("pdfFile") as File | null;
  if (file && file.size > 0) {
    const blob = await put(`agreements/${Date.now()}-${file.name.replace(/\s+/g, "-")}`, file, { access: "public" });
    pdfUrl = blob.url;
  }

  const signerToken = randomUUID();

  const agreement = await prisma.agreement.create({
    data: {
      type,
      address,
      sellers,
      signerName:  formData.get("signerName")  ? String(formData.get("signerName"))  : null,
      signerEmail: formData.get("signerEmail") ? String(formData.get("signerEmail")) : null,
      notes:       formData.get("notes")       ? String(formData.get("notes"))       : null,
      pdfUrl,
      signerToken,
      status: "draft",
    },
  });

  revalidatePath("/admin/agreements");
  redirect(`/admin/agreements/${agreement.id}`);
}

export async function updateAgreementStatus(id: string, formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status") ?? "");
  if (!status) return;
  await prisma.agreement.update({ where: { id }, data: { status } });
  revalidatePath("/admin/agreements");
  revalidatePath(`/admin/agreements/${id}`);
}

export async function updateAgreement(id: string, formData: FormData) {
  await requireAdmin();

  // Handle optional new PDF upload
  const file = formData.get("pdfFile") as File | null;
  let pdfUrl: string | undefined;
  if (file && file.size > 0) {
    const blob = await put(`agreements/${Date.now()}-${file.name.replace(/\s+/g, "-")}`, file, { access: "public" });
    pdfUrl = blob.url;
  }

  await prisma.agreement.update({
    where: { id },
    data: {
      address:     String(formData.get("address") ?? "").trim(),
      sellers:     String(formData.get("sellers") ?? "").trim(),
      signerName:  formData.get("signerName")  ? String(formData.get("signerName"))  : null,
      signerEmail: formData.get("signerEmail") ? String(formData.get("signerEmail")) : null,
      notes:       formData.get("notes")       ? String(formData.get("notes"))       : null,
      ...(pdfUrl ? { pdfUrl } : {}),
    },
  });

  revalidatePath("/admin/agreements");
  revalidatePath(`/admin/agreements/${id}`);
  redirect(`/admin/agreements/${id}`);
}

export async function deleteAgreement(id: string) {
  await requireAdmin();
  await prisma.agreement.delete({ where: { id } });
  revalidatePath("/admin/agreements");
  redirect("/admin/agreements");
}
