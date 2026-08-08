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

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) redirect("/admin/settings?tab=team&error=exists");

  await prisma.adminUser.create({
    data: { name, email, role, passwordHash: hashPassword(password) },
  });

  redirect("/admin/settings?tab=team&success=1");
}
