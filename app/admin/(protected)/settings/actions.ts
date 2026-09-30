"use server";

import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { redirect } from "next/navigation";
import { recordArvAccuracyRun } from "@/lib/search/backtest";

export async function changePassword(formData: FormData) {
  const session = await requireAdmin();

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!current || !next || next !== confirm) redirect("/admin/settings?tab=password&error=mismatch");
  if (next.length < 8) redirect("/admin/settings?tab=password&error=short");

  const user = await prisma.adminUser.findUnique({ where: { id: session.userId } });
  if (!user || !verifyPassword(current, user.passwordHash).ok) {
    redirect("/admin/settings?tab=password&error=wrong");
  }

  await prisma.adminUser.update({
    where: { id: session.userId },
    data: { passwordHash: hashPassword(next) },
  });

  redirect("/admin/settings?tab=password&success=1");
}

export async function addTeamMember(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") === "admin" ? "admin" : "caller";

  if (!name || !email || password.length < 8) {
    redirect("/admin/settings?tab=team&error=invalid");
  }

  // Submitting an email that already has an account resets that account's
  // password/name/role instead of erroring — this is the only place that
  // can reset a teammate's password (there's no separate "forgot password"
  // flow), and running it here means it always hashes with this server's
  // own SESSION_SECRET, not a value someone had to guess or copy in from
  // outside.
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    await prisma.adminUser.update({
      where: { email },
      data: { name, role, passwordHash: hashPassword(password) },
    });
    redirect("/admin/settings?tab=team&success=reset");
  }

  await prisma.adminUser.create({
    data: { name, email, role, passwordHash: hashPassword(password) },
  });

  redirect("/admin/settings?tab=team&success=1");
}

export async function runArvAccuracy() {
  await requireAdmin();
  await recordArvAccuracyRun();
  redirect("/admin/settings?tab=arv&success=run");
}

export async function addArvSample(formData: FormData) {
  await requireAdmin();
  const text = (k: string) => String(formData.get(k) ?? "").trim();
  const money = (k: string) => { const n = Number(text(k).replace(/[$,\s]/g, "")); return Number.isFinite(n) && n > 0 ? n : null; };
  const address = text("address"), zip = text("zip"), price = money("price");
  const status = text("status") === "pending" ? "pending" : "sold";
  const condition = text("condition") === "clean" ? "clean" : "remodeled";
  if (!address || !/^\d{5}$/.test(zip) || price == null) redirect("/admin/settings?tab=arv&error=sample");
  const date = text("date") ? new Date(text("date")) : null;
  await prisma.arvSample.create({
    data: { address, zip, status, condition, price, priceHigh: money("priceHigh"), date: date && !Number.isNaN(date.getTime()) ? date : null, note: text("note") || null },
  });
  redirect("/admin/settings?tab=arv&success=sample");
}

export async function deleteArvSample(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.arvSample.delete({ where: { id } }).catch(() => undefined);
  redirect("/admin/settings?tab=arv");
}
