import { NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { fetchMarkets, fetchSavedSearches } from "@/lib/integrations/ihomefinder";

export async function GET() {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [markets, savedSearches] = await Promise.all([
      fetchMarkets().catch((err) => ({ error: err instanceof Error ? err.message : String(err) })),
      fetchSavedSearches().catch((err) => ({ error: err instanceof Error ? err.message : String(err) })),
    ]);
    return NextResponse.json({ markets, savedSearches });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}
