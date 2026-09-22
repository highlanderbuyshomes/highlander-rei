import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/session";
import { loadListingDetail } from "@/lib/search/run-search";

export async function GET(req: NextRequest) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id query parameter is required" }, { status: 400 });

  try {
    const threshold = Number(req.nextUrl.searchParams.get("threshold") ?? 70);
    const row = await loadListingDetail(id, Number.isFinite(threshold) ? threshold : 70);

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(row);
  } catch (err) {
    console.error("[admin/search/listing] failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
