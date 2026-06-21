"use server";

import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function revalidate() {
  revalidatePath("/admin/acquisitions");
}

// ─── Buyer Searches ────────────────────────────────────────────────

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

// ─── Acquisition Machines ──────────────────────────────────────────

function parseList(val: FormDataEntryValue | null): string[] {
  const raw = String(val ?? "").trim();
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function optFloat(val: FormDataEntryValue | null): number | null {
  const n = parseFloat(String(val ?? ""));
  return isNaN(n) ? null : n;
}

function optInt(val: FormDataEntryValue | null): number | null {
  const n = parseInt(String(val ?? ""), 10);
  return isNaN(n) ? null : n;
}

function machineDataFromForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    areaId: String(formData.get("areaId") ?? "") || null,
    active: true,
    zips: parseList(formData.get("zips")),
    propertyTypes: parseList(formData.get("propertyTypes")),
    priceMin: optFloat(formData.get("priceMin")),
    priceMax: optFloat(formData.get("priceMax")),
    bedsMin: optInt(formData.get("bedsMin")),
    bedsMax: optInt(formData.get("bedsMax")),
    sqftMin: optInt(formData.get("sqftMin")),
    sqftMax: optInt(formData.get("sqftMax")),
  };
}

export async function createBuyBox(formData: FormData) {
  await requireAdmin();
  const data = machineDataFromForm(formData);
  if (!data.name) return;

  await prisma.buyBox.create({ data });
  revalidate();
}

export async function toggleBuyBox(id: string) {
  await requireAdmin();
  const bb = await prisma.buyBox.findUnique({ where: { id } });
  if (!bb) return;
  await prisma.buyBox.update({ where: { id }, data: { active: !bb.active } });
  revalidate();
}

export async function deleteBuyBox(id: string) {
  await requireAdmin();
  await prisma.buyerMatch.deleteMany({ where: { buyBoxId: id } });
  await prisma.buyBox.delete({ where: { id } });
  revalidate();
}

// ─── Delete Import Run ─────────────────────────────────────────────

export async function deleteImportRun(id: string) {
  await requireAdmin();
  await prisma.importRun.delete({ where: { id } });
  revalidate();
}
