import { NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { fetchMarkets, fetchSavedSearches, fetchListingCount, type IHomeFinderMarket, type IHomeFinderSavedSearch } from "@/lib/integrations/ihomefinder";

async function withCounts<T extends { id: string | number }>(
  items: T[],
  toParams: (item: T) => { marketId?: string; savedSearchId?: string },
): Promise<(T & { total: number | null })[]> {
  return Promise.all(
    items.map(async (item) => {
      const total = await fetchListingCount(toParams(item)).catch(() => null);
      return { ...item, total };
    }),
  );
}

export async function GET() {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [marketsResult, savedSearchesResult] = await Promise.all([
      fetchMarkets().catch((err) => ({ error: err instanceof Error ? err.message : String(err) })),
      fetchSavedSearches().catch((err) => ({ error: err instanceof Error ? err.message : String(err) })),
    ]);

    const markets = Array.isArray(marketsResult)
      ? await withCounts(marketsResult as IHomeFinderMarket[], (m) => ({ marketId: String(m.id) }))
      : marketsResult;
    const savedSearches = Array.isArray(savedSearchesResult)
      ? await withCounts(savedSearchesResult as IHomeFinderSavedSearch[], (s) => ({ savedSearchId: String(s.id) }))
      : savedSearchesResult;

    console.log("[ihomefinder/markets] markets:", JSON.stringify(markets));
    console.log("[ihomefinder/markets] savedSearches:", JSON.stringify(savedSearches));

    return NextResponse.json({ markets, savedSearches });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}
