import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/session";
import { loadBuyers } from "@/lib/search/buyer-search-load";

// A buyer search can take a while on InvestorBase's side.
export const maxDuration = 120;

async function handle(req: NextRequest, spend: boolean) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id query parameter is required" }, { status: 400 });
  const result = await loadBuyers(id, spend);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result);
}

/** Saved buyers only; never spends a search. */
export const GET = (req: NextRequest) => handle(req, false);
/** Runs the buyer search (spends one of the monthly 25) if nothing is saved. */
export const POST = (req: NextRequest) => handle(req, true);
