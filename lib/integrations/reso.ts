// RESO Web API client (OAuth2 client_credentials + OData), built against the
// RESO Data Dictionary standard so it works against any RESO-compliant MLS
// platform (ARMLS/Spark, Trestle, Bridge Interactive, ...) — only the four
// RESO_* env vars change between platforms, not this code.

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

type TokenCache = { accessToken: string; expiresAt: number };
let tokenCache: TokenCache | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set (RESO API credentials are not configured)`);
  return value;
}

export function isResoConfigured(): boolean {
  return Boolean(
    process.env.RESO_API_URL &&
    process.env.RESO_TOKEN_URL &&
    process.env.RESO_CLIENT_ID &&
    process.env.RESO_CLIENT_SECRET,
  );
}

async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.accessToken;
  }

  const tokenUrl = requireEnv("RESO_TOKEN_URL");
  const clientId = requireEnv("RESO_CLIENT_ID");
  const clientSecret = requireEnv("RESO_CLIENT_SECRET");

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "api",
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`RESO token request failed: ${res.status} ${res.statusText} — ${body.slice(0, 500)}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in?: number };
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return tokenCache.accessToken;
}

async function resoFetch(url: string): Promise<{ value: ResoListing[]; nextLink: string | null }> {
  const token = await getAccessToken();
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

// Default service area — the same ZIPs/cities used as location presets
// elsewhere in the app (see ImportRunner.tsx PRESETS). Keeps the initial
// pull scoped to Highlander's actual buy-box area instead of all of ARMLS.
export const DEFAULT_SERVICE_AREA_ZIPS = [
  "85018", "85008", "85254", "85016", "85251", "85255", "85258", "85253",
];
export const DEFAULT_SERVICE_AREA_CITIES = ["Scottsdale", "Paradise Valley"];

export const DEFAULT_STATUSES = ["Active", "Active Under Contract", "Pending", "Closed"];

function buildFilter(opts: { zips?: string[]; cities?: string[]; statuses?: string[] }): string {
  const zips = opts.zips ?? DEFAULT_SERVICE_AREA_ZIPS;
  const cities = opts.cities ?? DEFAULT_SERVICE_AREA_CITIES;
  const statuses = opts.statuses ?? DEFAULT_STATUSES;

  const zipList = zips.map((z) => `'${z}'`).join(",");
  const cityList = cities.map((c) => `'${c.replace(/'/g, "''")}'`).join(",");
  const statusList = statuses.map((s) => `'${s.replace(/'/g, "''")}'`).join(",");

  const areaFilter = `(PostalCode in (${zipList}) or City in (${cityList}))`;
  const statusFilter = `StandardStatus in (${statusList})`;
  return `${areaFilter} and ${statusFilter}`;
}

const PAGE_SIZE = 200;
const MAX_PAGES = 100; // safety cap: 20,000 listings per sync run

/**
 * Pulls every Property-resource listing matching the default (or given)
 * service area + status scope, following RESO's server-driven
 * `@odata.nextLink` pagination until exhausted or the safety cap is hit.
 */
export async function fetchAllResoListings(opts: { zips?: string[]; cities?: string[]; statuses?: string[] } = {}): Promise<ResoListing[]> {
  const apiUrl = requireEnv("RESO_API_URL");
  const filter = buildFilter(opts);

  let url = `${apiUrl.replace(/\/$/, "")}/Property?$filter=${encodeURIComponent(filter)}&$top=${PAGE_SIZE}`;
  const all: ResoListing[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const { value, nextLink } = await resoFetch(url);
    all.push(...value);
    if (!nextLink) break;
    url = nextLink;
  }

  return all;
}
