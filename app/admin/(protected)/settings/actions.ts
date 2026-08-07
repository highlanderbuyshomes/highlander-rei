"use server";

import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { redirect } from "next/navigation";

export async function changePassword(formData: FormData) {
  await requireAdmin();

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!current || !next || next !== confirm) redirect("/admin/settings?tab=password&error=mismatch");
  if (next.length < 8) redirect("/admin/settings?tab=password&error=short");

  const config = await prisma.adminConfig.findUnique({ where: { id: "singleton" } });
  const currentHash = config?.passwordHash;

  const validCurrent = currentHash
    ? hashPassword(current) === currentHash
    : !!process.env.ADMIN_PASSWORD && current === process.env.ADMIN_PASSWORD;

  if (!validCurrent) redirect("/admin/settings?tab=password&error=wrong");

  await prisma.adminConfig.upsert({
    where: { id: "singleton" },
    update: { passwordHash: hashPassword(next) },
    create: { id: "singleton", passwordHash: hashPassword(next) },
  });

  redirect("/admin/settings?tab=password&success=1");
}
