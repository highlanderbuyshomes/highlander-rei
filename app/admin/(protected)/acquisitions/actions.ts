"use server";

import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
