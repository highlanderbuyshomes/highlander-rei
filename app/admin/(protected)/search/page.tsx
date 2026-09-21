import { requireAdmin } from "@/lib/session";
import type { Metadata } from "next";
import { runSearch } from "@/lib/search/run-search";
import MlsSearchWorkspace from "./MlsSearchWorkspace";

export const metadata: Metadata = { title: "Deal Search | Highlander REI" };

export default async function SearchPage() {
  await requireAdmin();

  // Mirrors the workspace's initial state: the "Status" criterion active with
  // Active + Coming Soon selected, nothing else applied, 70% ARV threshold.
  // Every later change re-queries through POST /api/admin/search.
  const initial = await runSearch({ filters: { statuses: ["Active", "Coming Soon"] }, arvThreshold: 70 });

  return <MlsSearchWorkspace initial={initial} />;
}
