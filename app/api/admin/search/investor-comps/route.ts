import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/session";
import { loadInvestorComps } from "@/lib/search/run-search";

export async function GET(req: NextRequest) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = req.nextUrl.searchParams;
  const id = params.get("id");
  if (!id) return NextResponse.json({ error: "id query parameter is required" }, { status: 400 });

  try {
    const result = await loadInvestorComps(id, Number(params.get("radius") ?? 2), Number(params.get("months") ?? 24));
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[admin/search/investor-comps] failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
