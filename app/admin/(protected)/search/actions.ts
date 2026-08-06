"use server";

import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function revalidate() {
  revalidatePath("/admin/search");
}

export async function createArea(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const slug = `${base}-${Date.now().toString(36)}`;

  await prisma.acquisitionArea.create({
    data: {
      name,
      slug,
      buyerContact: String(formData.get("buyerContact") ?? "") || null,
      description: String(formData.get("description") ?? "") || null,
    },
  });

  revalidate();
}

export async function toggleArea(id: string) {
  await requireAdmin();
  const area = await prisma.acquisitionArea.findUnique({ where: { id } });
  if (!area) return;
  await prisma.acquisitionArea.update({ where: { id }, data: { active: !area.active } });
  revalidate();
}

export async function deleteArea(id: string) {
  await requireAdmin();
  await prisma.buyBox.updateMany({ where: { areaId: id }, data: { areaId: null } });
  await prisma.acquisitionArea.delete({ where: { id } });
  revalidate();
}
