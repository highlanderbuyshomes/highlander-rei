"use server";

import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";

const TEMPLATE_NAMES: Record<string, string> = {
  cash_offer:   "Cash Offer",
  flex_equity:  "Flex Equity Program",
  listing:      "Listing Agreement",
  aif_novation: "AIF / Novation Agreement",
};
const MAX_PDF_SIZE = 20 * 1024 * 1024;

export async function upsertTemplate(type: string, formData: FormData) {
  await requireAdmin();
  if (!TEMPLATE_NAMES[type]) throw new Error("Invalid agreement template type.");

  const file = formData.get("pdfFile") as File | null;
  let pdfUrl: string | undefined;
  if (file && file.size > 0 && process.env.BLOB_READ_WRITE_TOKEN) {
    if (file.type !== "application/pdf") throw new Error("Template documents must be PDF files.");
    if (file.size > MAX_PDF_SIZE) throw new Error("Template PDFs must be 20 MB or smaller.");
    const blob = await put(`templates/${type}-${Date.now()}.pdf`, file, { access: "public" });
    pdfUrl = blob.url;
  }

  const description = formData.has("description") ? String(formData.get("description") ?? "").trim() : undefined;

  const template = await prisma.agreementTemplate.upsert({
    where: { type },
    create: {
      type,
      name: TEMPLATE_NAMES[type] ?? type,
      ...(pdfUrl ? { pdfUrl } : {}),
      ...(description !== undefined ? { description } : {}),
    },
    update: {
      ...(pdfUrl ? { pdfUrl } : {}),
      ...(description !== undefined ? { description } : {}),
    },
  });

  // Coordinates belong to a specific PDF version and must be reviewed again.
  if (pdfUrl) {
    await prisma.templateField.deleteMany({ where: { templateId: template.id } });
  }

  revalidatePath("/admin/templates");
  revalidatePath(`/admin/templates/${type}`);
}
