const BASE_URL = "https://www.idxhome.com/api/v1/client";

export type IHomeFinderListing = {
  id: string | number;
  boardId?: number;
  listingNumber: string;
  address?: {
    streetNumber?: string;
    streetName?: string;
    unitNumber?: string;
    city?: string;
    state?: string;
    zip?: string;
    county?: string;
  };
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  fullBathrooms?: number;
  partialBathrooms?: number;
  squareFeet?: number;
  lotSize?: number;
  yearBuilt?: number;
  propertyType?: { name?: string } | string;
  description?: string;
  listPrice?: number;
  soldPrice?: number;
  listDate?: string;
  pendingDate?: string;
  soldDate?: string;
  daysOnMarket?: number;
  status: string;
  listingStatusDisplay?: string;
  dateImported?: string;
  listingAgent?: string;
  listingOffice?: string;
  _links?: {
    agent?: { href: string };
    office?: { href: string };
    self?: { href: string };
  };
  [key: string]: unknown;
};

type ListingsPage = {
  listings: IHomeFinderListing[];
  total: number | null;
};

function authHeader(): string {
  const username = process.env.IHOMEFINDER_USERNAME;
  const password = process.env.IHOMEFINDER_PASSWORD;
  if (!username || !password) {
    throw new Error("IHOMEFINDER_USERNAME and IHOMEFINDER_PASSWORD must both be set");
  }
  const token = Buffer.from(`${username}:${password}`).toString("base64");
  return `Basic ${token}`;
}

async function ihomefinderFetch(path: string, params: Record<string, string | number> = {}): Promise<unknown> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: authHeader(),
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`iHomefinder request failed: ${res.status} ${res.statusText} — ${body.slice(0, 500)}`);
  }

  return res.json();
}

// The Client API is a HAL-style REST API. Collection endpoints typically embed
// their items under `_embedded`, but the exact key can vary by resource — this
// unwraps defensively rather than assuming one fixed shape, so a future field
// rename doesn't silently return zero listings.
function extractListings(payload: unknown): ListingsPage {
  if (Array.isArray(payload)) {
    return { listings: payload as IHomeFinderListing[], total: payload.length };
  }
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const embedded = obj._embedded as Record<string, unknown> | undefined;
    const embeddedListings = embedded?.listing ?? embedded?.listings;
    if (Array.isArray(embeddedListings)) {
      return { listings: embeddedListings as IHomeFinderListing[], total: typeof obj.total === "number" ? obj.total : null };
    }
    if (Array.isArray(obj.listings)) {
      return { listings: obj.listings as IHomeFinderListing[], total: typeof obj.total === "number" ? obj.total : null };
    }
    // A HAL response with `total: 0` and no listings array at all is a
    // legitimate "zero results for this query" response, not a malformed
    // one — only unrecognized *non-empty* shapes should be treated as errors.
    if (obj.total === 0) {
      return { listings: [], total: 0 };
    }
  }
  throw new Error(`Unrecognized iHomefinder listings response shape: ${JSON.stringify(payload).slice(0, 300)}`);
}

export type IHomeFinderMarket = {
  id: string | number;
  name?: string;
  [key: string]: unknown;
};

export type IHomeFinderSavedSearch = {
  id: string | number;
  name?: string;
  [key: string]: unknown;
};

function extractCollection<T>(payload: unknown, embeddedKeys: string[]): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const embedded = obj._embedded as Record<string, unknown> | undefined;
    for (const key of embeddedKeys) {
      const value = embedded?.[key];
      if (Array.isArray(value)) return value as T[];
    }
    for (const key of embeddedKeys) {
      const value = obj[key];
      if (Array.isArray(value)) return value as T[];
    }
    if (obj.total === 0) return [];
  }
  throw new Error(`Unrecognized iHomefinder collection response shape: ${JSON.stringify(payload).slice(0, 300)}`);
}

/** Lists the markets (geographic search areas) configured on this account — pass one's `id` as `marketId` to fetchAllIHomeFinderListings. */
export async function fetchMarkets(): Promise<IHomeFinderMarket[]> {
  const payload = await ihomefinderFetch("/markets.json");
  return extractCollection<IHomeFinderMarket>(payload, ["market", "markets"]);
}

/** Lists saved searches configured on this account — pass one's `id` as `savedSearchId` to fetchAllIHomeFinderListings. */
export async function fetchSavedSearches(): Promise<IHomeFinderSavedSearch[]> {
  const payload = await ihomefinderFetch("/subscriber/savedsearches.json").catch(() => ihomefinderFetch("/savedsearches.json"));
  return extractCollection<IHomeFinderSavedSearch>(payload, ["savedSearch", "savedSearches", "savedsearch", "savedsearches"]);
}

/** Cheap `total` lookup for a scope (limit=1) — used to preview how many listings a market/saved search actually has before running a full sync. */
export async function fetchListingCount(opts: { marketId?: string; savedSearchId?: string } = {}): Promise<number> {
  const params: Record<string, string | number> = { limit: 1 };
  if (opts.marketId) params.marketId = opts.marketId;
  if (opts.savedSearchId) params.savedSearchId = opts.savedSearchId;
  const payload = await ihomefinderFetch("/listings.json", params);
  const { listings, total } = extractListings(payload);
  return total ?? listings.length;
}

const PAGE_SIZE = 100;
const MAX_PAGES = 200; // safety cap: 20,000 listings

/**
 * Fetches every listing available to this client account, paginating until
 * a short page is returned. `marketId`/`savedSearchId` scope which listings
 * are returned — omit both to get the account's default active/featured set
 * per the API's documented "no filter" behavior.
 */
export async function fetchAllIHomeFinderListings(opts: { marketId?: string; savedSearchId?: string } = {}): Promise<IHomeFinderListing[]> {
  const all: IHomeFinderListing[] = [];
  let offset = 0;

  for (let page = 0; page < MAX_PAGES; page++) {
    const params: Record<string, string | number> = { limit: PAGE_SIZE, offset };
    if (opts.marketId) params.marketId = opts.marketId;
    if (opts.savedSearchId) params.savedSearchId = opts.savedSearchId;

    const payload = await ihomefinderFetch("/listings.json", params);
    const { listings } = extractListings(payload);
    all.push(...listings);

    if (listings.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return all;
}
