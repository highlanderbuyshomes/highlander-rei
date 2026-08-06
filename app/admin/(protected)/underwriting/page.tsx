import { requireAdmin } from "@/lib/session";
import type { Metadata } from "next";
import UnderwritingClient from "./UnderwritingClient";

export const metadata: Metadata = { title: "Underwriting | Highlander REI" };

export default async function UnderwritingPage() {
  await requireAdmin();
  return <UnderwritingClient />;
}
