// RESO Web API client for ARMLS's Spark (FBS) platform.
//
// Spark's auth model (confirmed via sparkplatform.com/docs/authentication/access_token,
// 2026-09-18) is a static, non-expiring Access Token sent as a Bearer header —
// there is no OAuth2 client_credentials token exchange, unlike some other RESO
// platforms (Trestle, Bridge). The separately-issued "OAuth key" is Spark's
// feed identifier, not a request credential; it isn't sent on requests.

export type ResoListing = {
  ListingKey: string;
  ListingId?: string;
  StandardStatus?: string;
  ListPrice?: number;
  OriginalListPrice?: number;
  ListDate?: string;
  PendingTimestamp?: string;
  CloseDate?: string;
  ClosePrice?: number;
  DaysOnMarket?: number;
  UnparsedAddress?: string;
  StreetNumber?: string;
  StreetDirPrefix?: string;
  StreetName?: string;
  StreetSuffix?: string;
  UnitNumber?: string;
  City?: string;
  StateOrProvince?: string;
  PostalCode?: string;
  CountyOrParish?: string;
  SubdivisionName?: string;
  PropertyType?: string;
  PropertySubType?: string;
  BedroomsTotal?: number;
  BathroomsTotalInteger?: number;
  BathroomsFull?: number;
  BathroomsHalf?: number;
  LivingArea?: number;
  LotSizeSquareFeet?: number;
  YearBuilt?: number;
  StoriesTotal?: number;
  PoolPrivateYN?: boolean;
  PublicRemarks?: string;
  Latitude?: number;
  Longitude?: number;
  ListAgentKey?: string;
  ListAgentFullName?: string;
  ListAgentEmail?: string;
  ListAgentDirectPhone?: string;
  ListOfficeName?: string;
  ModificationTimestamp?: string;
  [key: string]: unknown;
};

// Spark's documented RESO OData base URL (sparkplatform.com/docs/reso/overview) —
// a fixed public endpoint, not account-specific, so this needs no override
// unless ARMLS says otherwise. Version/2 also exists; this uses the newer Version/3.
const DEFAULT_API_URL = "https://replication.sparkapi.com/Version/3/Reso/OData";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set (RESO API credentials are not configured)`);
  return value;
}

export function isResoConfigured(): boolean {
  return Boolean(process.env.RESO_ACCESS_TOKEN);
}

async function resoFetch(url: string): Promise<{ value: ResoListing[]; nextLink: string | null }> {
  const token = requireEnv("RESO_ACCESS_TOKEN");
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`RESO API request failed: ${res.status} ${res.statusText} — ${body.slice(0, 500)}`);
  }

  const payload = (await res.json()) as { value: ResoListing[]; "@odata.nextLink"?: string };
  return { value: payload.value ?? [], nextLink: payload["@odata.nextLink"] ?? null };
}

export const DEFAULT_STATUSES = ["Active", "Active Under Contract", "Pending", "Closed"];

export type ResoScopeOpts = {
  zips?: string[];
  cities?: string[];
  statuses?: string[];
  /** ISO date-time strings bounding the Closed clause (inclusive/exclusive).
   *  Defaults to the last CLOSED_LOOKBACK_MONTHS when omitted. Callers chunk
   *  a large Closed pull into windows (e.g. one calendar month each) to keep
   *  each request well under the serverless function's time limit. */
  closedAfter?: string;
  closedBefore?: string;
  /** ISO date-time. Incremental mode: returns every listing in the service
   *  area modified after this instant, in any status (so cancellations,
   *  expirations and price/status changes all flow through) — statuses and
   *  the closed window are ignored. */
  modifiedSince?: string;
};

function buildFilter(opts: ResoScopeOpts): string {
  const statuses = opts.statuses ?? DEFAULT_STATUSES;

  // zips/cities are optional restrictions; with neither set there is no area
  // clause and the scope is all of ARMLS.
  const zips = opts.zips, cities = opts.cities;
  const areaParts: string[] = [];
  if (zips?.length) areaParts.push(`PostalCode in (${zips.map((z) => `'${z.replace(/'/g, "''")}'`).join(",")})`);
  if (cities?.length) areaParts.push(`City in (${cities.map((c) => `'${c.replace(/'/g, "''")}'`).join(",")})`);
  const areaFilter = areaParts.length ? `(${areaParts.join(" or ")})` : null;
  // Deal Search is for sales; skip lease/rental listings at the source.
  const salesOnly = `PropertyType ne 'Residential Lease' and PropertyType ne 'Commercial Lease'`;
  const withArea = (f: string) => (areaFilter ? `${areaFilter} and ${f} and ${salesOnly}` : `${f} and ${salesOnly}`);

  if (opts.modifiedSince) return withArea(`ModificationTimestamp gt ${opts.modifiedSince}`);

  // Active/Pending/Under-Contract listings are inherently bounded (can't
  // accumulate forever), but Closed has no natural ceiling — without a date
  // bound this pulls every historical sale ever recorded for the area. A
  // full year of Closed sales across whole cities is itself too much for
  // one request, so callers chunk it into windows via closedAfter/Before.
  const liveStatuses = statuses.filter((s) => s !== "Closed");
  const includesClosed = statuses.includes("Closed");

  const clauses: string[] = [];
  if (liveStatuses.length) {
    const list = liveStatuses.map((s) => `'${s.replace(/'/g, "''")}'`).join(",");
    clauses.push(`StandardStatus in (${list})`);
  }
  if (includesClosed) {
    let after = opts.closedAfter;
    let before = opts.closedBefore;
    if (!after) {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - CLOSED_LOOKBACK_MONTHS);
      after = cutoff.toISOString();
    }
    const closedRange = [`CloseDate ge ${after}`, before ? `CloseDate lt ${before}` : null].filter(Boolean).join(" and ");
    clauses.push(`(StandardStatus eq 'Closed' and ${closedRange})`);
  }
  const statusFilter = clauses.length > 1 ? `(${clauses.join(" or ")})` : clauses[0];

  return withArea(statusFilter);
}

const CLOSED_LOOKBACK_MONTHS = 12;
const PAGE_SIZE = 200;
const MAX_PAGES = 1000; // safety cap: 200,000 listings per sync run

/**
 * Pulls Property-resource listings matching the given (or all-of-ARMLS) area
 * + status scope, following RESO's server-driven `@odata.nextLink`
 * pagination, yielding one page at a time instead of buffering the whole
 * result set. A broad scope (e.g. full cities) can run to thousands of
 * listings; yielding per page lets the caller persist progressively, so a
 * long run shows real progress instead of writing nothing until the very
 * end, and a run that's interrupted still keeps whatever it already wrote.
 */
export async function* fetchResoListingPages(
  opts: ResoScopeOpts = {},
  resumeUrl?: string,
): AsyncGenerator<{ listings: ResoListing[]; nextLink: string | null }> {
  const apiUrl = process.env.RESO_API_URL || DEFAULT_API_URL;

  // A resume URL comes back out of our own DB, but it carries the bearer
  // token on the next request — never send that to a different host.
  if (resumeUrl && new URL(resumeUrl).origin !== new URL(apiUrl).origin) {
    throw new Error("Refusing to resume from a URL on a different host than the RESO API");
  }

  let url = resumeUrl ?? `${apiUrl.replace(/\/$/, "")}/Property?$filter=${encodeURIComponent(buildFilter(opts))}&$top=${PAGE_SIZE}`;

  for (let page = 0; page < MAX_PAGES; page++) {
    const { value, nextLink } = await resoFetch(url);
    yield { listings: value, nextLink };
    if (!nextLink) break;
    url = nextLink;
    if (page === MAX_PAGES - 1) console.warn(`[reso] MAX_PAGES (${MAX_PAGES}) reached; feed truncated for this run`);
  }
}
