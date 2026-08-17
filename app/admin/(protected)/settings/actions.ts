"use server";

import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { redirect } from "next/navigation";

export async function changePassword(formData: FormData) {
  const session = await requireAdmin();

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!current || !next || next !== confirm) redirect("/admin/settings?tab=password&error=mismatch");
  if (next.length < 8) redirect("/admin/settings?tab=password&error=short");

  const user = await prisma.adminUser.findUnique({ where: { id: session.userId } });
  if (!user || hashPassword(current) !== user.passwordHash) {
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
