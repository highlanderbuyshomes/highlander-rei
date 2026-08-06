"use server";

import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function revalidate() {
  revalidatePath("/admin/offers");
}

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

export async function deleteImportRun(id: string) {
  await requireAdmin();
  await prisma.importRun.delete({ where: { id } });
  revalidate();
}
