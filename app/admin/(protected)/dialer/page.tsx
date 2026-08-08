import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DialerPage() {
  await requireUser();
  redirect("/admin/dialer/launch");
}
