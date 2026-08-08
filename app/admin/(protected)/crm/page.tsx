import { requireAdmin } from "@/lib/session";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "CRM | Highlander REI" };

export default async function CrmPage() {
  await requireAdmin();
  redirect("/admin/offers");
}
