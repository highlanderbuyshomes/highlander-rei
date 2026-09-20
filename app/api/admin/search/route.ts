import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/session";
import { runSearch } from "@/lib/search/run-search";
import type { SearchRequest } from "@/lib/search/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: SearchRequest;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body || typeof body.filters !== "object" || typeof body.arvThreshold !== "number") {
    return NextResponse.json({ error: "filters and arvThreshold are required" }, { status: 400 });
  }
  try {
    return NextResponse.json(await runSearch(body));
  } catch (err) {
    console.error("[admin/search] failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
