"use server";

import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";

const TEMPLATE_NAMES: Record<string, string> = {
  cash_offer:  "Cash Offer",
  flex_equity: "Flex Equity Program",
  listing:     "Listing Agreement",
};

export async function upsertTemplate(type: string, formData: FormData) {
  await requireAdmin();

  const file = formData.get("pdfFile") as File | null;
  let pdfUrl: string | undefined;
  if (file && file.size > 0) {
    const blob = await put(`templates/${type}-${Date.now()}.pdf`, file, { access: "public" });
    pdfUrl = blob.url;
  }

  const description = formData.get("description") ? String(formData.get("description")) : undefined;

  await prisma.agreementTemplate.upsert({
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

  revalidatePath("/admin/templates");
}
