"use server";

import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { DrawnShape } from "@/lib/filter-listings";

function revalidate() {
  revalidatePath("/admin/search");
  revalidatePath("/admin/buyers");
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

export async function updateArea(id: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await prisma.acquisitionArea.update({
    where: { id },
    data: {
      name,
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

export type DealVerdict = "good" | "bad";
export type DealFeedbackEntry = { verdict: DealVerdict; note: string | null };

/** The scanner's numbers at the moment of the call, kept for tuning later. */
export type DealFeedbackSnapshot = {
  dealScore: number;
  priority: string;
  listPrice: number | null;
  arv: number | null;
  arvConfidence: string | null;
  listToArvPct: number | null;
  pctOfAsIs: number | null;
  threshold: number;
  reasons: string[];
};

export async function loadDealFeedback(listingIds: string[]): Promise<Record<string, DealFeedbackEntry>> {
  await requireAdmin();
  if (!listingIds.length) return {};
  const rows = await prisma.dealFeedback.findMany({
    where: { listingId: { in: listingIds.slice(0, 500) } },
    select: { listingId: true, verdict: true, note: true },
  });
  return Object.fromEntries(rows.map((row) => [row.listingId, { verdict: row.verdict as DealVerdict, note: row.note }]));
}

/** verdict null clears the call. */
export async function saveDealFeedback(listingId: string, mlsNumber: string, verdict: DealVerdict | null, note: string | null, snapshot: DealFeedbackSnapshot) {
  await requireAdmin();
  if (verdict === null) {
    await prisma.dealFeedback.deleteMany({ where: { listingId } });
    return;
  }
  if (verdict !== "good" && verdict !== "bad") throw new Error("Invalid verdict");
  const cleanNote = note?.trim().slice(0, 500) || null;
  await prisma.dealFeedback.upsert({
    where: { listingId },
    create: { listingId, mlsNumber, verdict, note: cleanNote, snapshot },
    update: { verdict, note: cleanNote, snapshot },
  });
}
