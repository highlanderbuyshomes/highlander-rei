"use server";

import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { matchPropertyToBuyBox } from "@/lib/buy-box-matcher";

// ─── Areas ─────────────────────────────────────────────────────────

export async function createArea(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required");

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  await prisma.acquisitionArea.create({
    data: { name, slug, description: String(formData.get("description") ?? "") || null },
  });

  revalidatePath("/admin/acquisitions");
}

export async function toggleArea(id: string) {
  await requireAdmin();
  const area = await prisma.acquisitionArea.findUniqueOrThrow({ where: { id } });
  await prisma.acquisitionArea.update({ where: { id }, data: { active: !area.active } });
  revalidatePath("/admin/acquisitions");
}

export async function deleteArea(id: string) {
  await requireAdmin();
  await prisma.acquisitionArea.delete({ where: { id } });
  revalidatePath("/admin/acquisitions");
}

// ─── Buy Boxes ─────────────────────────────────────────────────────

function parseJsonArray(val: FormDataEntryValue | null): string[] {
  const raw = String(val ?? "").trim();
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseOptionalFloat(val: FormDataEntryValue | null): number | null {
  const n = parseFloat(String(val ?? ""));
  return isNaN(n) ? null : n;
}

function parseOptionalInt(val: FormDataEntryValue | null): number | null {
  const n = parseInt(String(val ?? ""), 10);
  return isNaN(n) ? null : n;
}

function buyBoxDataFromForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    areaId: String(formData.get("areaId") ?? "") || null,
    active: formData.get("active") !== "false",
    zips: parseJsonArray(formData.get("zips")),
    mlsAreaIds: parseJsonArray(formData.get("mlsAreaIds")),
    subdivisions: parseJsonArray(formData.get("subdivisions")),
    propertyTypes: parseJsonArray(formData.get("propertyTypes")),
    priceMin: parseOptionalFloat(formData.get("priceMin")),
    priceMax: parseOptionalFloat(formData.get("priceMax")),
    bedsMin: parseOptionalInt(formData.get("bedsMin")),
    bedsMax: parseOptionalInt(formData.get("bedsMax")),
    bathsMin: parseOptionalFloat(formData.get("bathsMin")),
    bathsMax: parseOptionalFloat(formData.get("bathsMax")),
    sqftMin: parseOptionalInt(formData.get("sqftMin")),
    sqftMax: parseOptionalInt(formData.get("sqftMax")),
    lotSqftMin: parseOptionalInt(formData.get("lotSqftMin")),
    lotSqftMax: parseOptionalInt(formData.get("lotSqftMax")),
    yearBuiltMin: parseOptionalInt(formData.get("yearBuiltMin")),
    yearBuiltMax: parseOptionalInt(formData.get("yearBuiltMax")),
    ownershipDurationMin: parseOptionalInt(formData.get("ownershipDurationMin")),
    minEquityPct: parseOptionalFloat(formData.get("minEquityPct")),
    ownerOccupied: String(formData.get("ownerOccupied") ?? "any"),
    mlsStatuses: parseJsonArray(formData.get("mlsStatuses")),
    maxDom: parseOptionalInt(formData.get("maxDom")),
    buyerName: String(formData.get("buyerName") ?? "") || null,
    dispositionStrategy: String(formData.get("dispositionStrategy") ?? "") || null,
    priority: parseOptionalInt(formData.get("priority")) ?? 0,
  };
}

export async function createBuyBox(formData: FormData) {
  await requireAdmin();
  const data = buyBoxDataFromForm(formData);
  if (!data.name) throw new Error("Name is required");

  await prisma.buyBox.create({ data });
  revalidatePath("/admin/acquisitions");
}

export async function updateBuyBox(id: string, formData: FormData) {
  await requireAdmin();
  const data = buyBoxDataFromForm(formData);
  if (!data.name) throw new Error("Name is required");

  await prisma.buyBox.update({ where: { id }, data });
  revalidatePath("/admin/acquisitions");
}

export async function toggleBuyBox(id: string) {
  await requireAdmin();
  const bb = await prisma.buyBox.findUniqueOrThrow({ where: { id } });
  await prisma.buyBox.update({ where: { id }, data: { active: !bb.active } });
  revalidatePath("/admin/acquisitions");
}

export async function deleteBuyBox(id: string) {
  await requireAdmin();
  await prisma.buyBox.delete({ where: { id } });
  revalidatePath("/admin/acquisitions");
}

// ─── Match Runner ──────────────────────────────────────────────────

export async function runMatchesForBuyBox(buyBoxId: string) {
  await requireAdmin();

  const buyBox = await prisma.buyBox.findUniqueOrThrow({ where: { id: buyBoxId } });
  const zips = Array.isArray(buyBox.zips) ? buyBox.zips as string[] : [];

  const properties = await prisma.property.findMany({
    where: zips.length > 0 ? { zip: { in: zips } } : {},
    include: { owners: { take: 1 } },
  });

  let created = 0;
  let updated = 0;

  for (const prop of properties) {
    const owner = prop.owners[0];
    const result = matchPropertyToBuyBox(
      {
        zip: prop.zip,
        subdivision: prop.subdivision,
        propertyType: prop.propertyType,
        beds: prop.beds,
        baths: prop.baths,
        sqft: prop.sqft,
        lotSqft: prop.lotSqft,
        yearBuilt: prop.yearBuilt,
        estimatedValue: prop.estimatedValue,
        lastSalePrice: prop.lastSalePrice,
        lastSaleDate: prop.lastSaleDate,
        listPrice: null,
        mlsStatus: null,
        dom: null,
        ownerOccupied: owner?.ownerOccupied ?? null,
        ownershipStartDate: owner?.ownershipStartDate ?? null,
        estimatedEquityPct: owner?.estimatedEquityPct ?? null,
      },
      {
        zips: Array.isArray(buyBox.zips) ? buyBox.zips as string[] : [],
        subdivisions: Array.isArray(buyBox.subdivisions) ? buyBox.subdivisions as string[] : [],
        propertyTypes: Array.isArray(buyBox.propertyTypes) ? buyBox.propertyTypes as string[] : [],
        priceMin: buyBox.priceMin,
        priceMax: buyBox.priceMax,
        bedsMin: buyBox.bedsMin,
        bedsMax: buyBox.bedsMax,
        bathsMin: buyBox.bathsMin,
        bathsMax: buyBox.bathsMax,
        sqftMin: buyBox.sqftMin,
        sqftMax: buyBox.sqftMax,
        lotSqftMin: buyBox.lotSqftMin,
        lotSqftMax: buyBox.lotSqftMax,
        yearBuiltMin: buyBox.yearBuiltMin,
        yearBuiltMax: buyBox.yearBuiltMax,
        ownershipDurationMin: buyBox.ownershipDurationMin,
        minEquityPct: buyBox.minEquityPct,
        ownerOccupied: buyBox.ownerOccupied,
        mlsStatuses: Array.isArray(buyBox.mlsStatuses) ? buyBox.mlsStatuses as string[] : [],
        maxDom: buyBox.maxDom,
      },
    );

    if (!result.matched) continue;

    const existing = await prisma.buyerMatch.findUnique({
      where: { propertyId_buyBoxId: { propertyId: prop.id, buyBoxId } },
    });

    if (existing) {
      await prisma.buyerMatch.update({
        where: { id: existing.id },
        data: { score: result.score, matchExplanation: JSON.parse(JSON.stringify(result.reasons)) },
      });
      updated++;
    } else {
      await prisma.buyerMatch.create({
        data: {
          propertyId: prop.id,
          buyBoxId,
          score: result.score,
          matchExplanation: JSON.parse(JSON.stringify(result.reasons)),
        },
      });
      created++;
    }
  }

  revalidatePath("/admin/acquisitions");
}

// ─── Delete Import Run ─────────────────────────────────────────────

export async function deleteImportRun(id: string) {
  await requireAdmin();
  await prisma.importRun.delete({ where: { id } });
  revalidatePath("/admin/acquisitions");
}
