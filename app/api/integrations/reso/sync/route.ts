import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/session";
import { syncResoListings } from "@/lib/integrations/reso-sync";
import { isResoConfigured, type ResoScopeOpts } from "@/lib/integrations/reso";

export async function POST(req: NextRequest) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isResoConfigured()) {
    return NextResponse.json(
      { error: "RESO_ACCESS_TOKEN must be set" },
      { status: 400 },
    );
  }

  let body: ResoScopeOpts = {};
  try {
    body = await req.json();
  } catch {
    // no body provided — sync the default service area
  }

  console.log("[reso/sync] scope requested:", JSON.stringify(body));

  try {
    const result = await syncResoListings(body);
    console.log("[reso/sync] result:", JSON.stringify(result));
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}
