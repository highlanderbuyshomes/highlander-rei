import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { syncIHomeFinderListings } from "@/lib/integrations/ihomefinder-sync";

export async function POST(req: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { marketId?: string; savedSearchId?: string } = {};
  try {
    body = await req.json();
  } catch {
    // no body provided — sync the account's default listing set
  }

  console.log("[ihomefinder/sync] scope requested:", JSON.stringify(body));

  try {
    const result = await syncIHomeFinderListings(body);
    console.log("[ihomefinder/sync] result:", JSON.stringify(result));
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}
