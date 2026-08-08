"use server";

import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { DrawnShape } from "@/lib/filter-listings";

function revalidate() {
  revalidatePath("/admin/search");
}

const AREA_COLOR_PALETTE = ["#1a56db", "#3a7a50", "#b45309", "#8f2c21", "#6b46c1", "#0f766e", "#be185d", "#a16207"];

export async function createArea(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const slug = `${base}-${Date.now().toString(36)}`;

  const existingCount = await prisma.acquisitionArea.count();
  const mapColor = AREA_COLOR_PALETTE[existingCount % AREA_COLOR_PALETTE.length];

  await prisma.acquisitionArea.create({
    data: {
      name,
      slug,
      buyerContact: String(formData.get("buyerContact") ?? "") || null,
      description: String(formData.get("description") ?? "") || null,
      mapColor,
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

export async function saveAreaShape(id: string, shape: DrawnShape) {
  await requireAdmin();
  await prisma.acquisitionArea.update({
    where: { id },
    data: { polygon: shape },
  });
  revalidate();
}

export async function targetProperty(propertyId: string, dealScore: number, summary: string) {
  await requireAdmin();
  const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true } });
  if (!property) return;

  const notes = `Deal Intelligence score: ${Math.round(dealScore)}/100. ${summary}`.slice(0, 1800);
  const existing = await prisma.acquisitionLead.findFirst({
    where: { propertyId, status: { notIn: ["closed", "dead", "lost"] } },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    await prisma.acquisitionLead.update({ where: { id: existing.id }, data: { notes, status: "new" } });
  } else {
    await prisma.acquisitionLead.create({ data: { propertyId, status: "new", notes } });
  }

  revalidatePath("/admin/search");
  revalidatePath("/admin/offers");
}
