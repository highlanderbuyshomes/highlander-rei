import "server-only";

import { unstable_cache } from "next/cache";
import { runSearch } from "./run-search";
import type { SearchRequest, SearchResponse } from "./types";

export const DEAL_SEARCH_TAG = "deal-search";

// A search scans every property's latest MLS listing (~5-7s in Postgres), but
// the data only changes when the hourly RESO sync runs. Results (~180KB) are
// shared across server instances for 10 minutes and served stale while they
// refresh, so repeat searches — the default view on every login — are instant.
// The RESO sync marks them stale with revalidateTag(DEAL_SEARCH_TAG, "max").
const cached = unstable_cache(
  async (key: string) => runSearch(JSON.parse(key) as SearchRequest),
  ["deal-search-v1"],
  { revalidate: 600, tags: [DEAL_SEARCH_TAG] },
);

export function cachedRunSearch(req: SearchRequest): Promise<SearchResponse> {
  return cached(JSON.stringify(req));
}
