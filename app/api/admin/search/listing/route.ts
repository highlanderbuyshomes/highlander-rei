import { after, NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/session";
import { loadListingDetail } from "@/lib/search/run-search";
import { loadInvestorIndex } from "@/lib/search/load-investor-buys";

export async function GET(req: NextRequest) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id query parameter is required" }, { status: 400 });

  // Opening a listing is the cue that Investor comps may be next: warm its
  // cache after responding so that tab doesn't wait on the cold load.
  after(() => loadInvestorIndex().then(() => undefined, (err) => console.error("[admin/search/listing] investor warm-up failed:", err)));

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
