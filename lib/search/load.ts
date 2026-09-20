import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DISTRESS_WORDS } from "@/lib/distress";
import { buildWhere } from "./build-query";
import type { ListingRecord, SearchFilters } from "./types";

function rawValue(raw: unknown, keys: string[]) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function rawNumber(raw: unknown, keys: string[]) {
  const value = rawValue(raw, keys);
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function rawBoolean(raw: unknown, keys: string[]) {
  const value = rawValue(raw, keys);
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["yes", "y", "true", "1", "private"].includes(normalized)) return true;
    if (["no", "n", "false", "0", "none"].includes(normalized)) return false;
  }
  return null;
}

function rawString(raw: unknown, keys: string[]) {
  const value = rawValue(raw, keys);
  return typeof value === "string" ? value : null;
}

function rawLevels(raw: unknown) {
  const numeric = rawNumber(raw, ["Stories", "StoriesTotal", "NumberOfStories", "InteriorLevels"]);
  if (numeric != null) return numeric;
  const value = rawString(raw, ["Levels"]);
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized.includes("three")) return 3;
  if (normalized.includes("two")) return 2;
  if (normalized.includes("one") || normalized.includes("single")) return 1;
  return null;
}

// The MLS rawJson blobs are ~10KB each; pulling them for thousands of rows
// just to read a handful of keys made the old client-side page take 15s+.
// Postgres extracts only the keys the mapping below reads (plus the
// distress-language flag from remarks), and rows are reshaped to what the
// mapping expects.
const RAW_KEYS = [
  "PropertySubType", "PropertyType", "DwellingType", "LivingArea", "LivingAreaSqFt", "ApproxSQFT",
  "LotSizeSquareFeet", "LotSqFt", "LotSize", "PoolPrivateYN", "PrivatePoolYN", "PrivatePool", "HasPool", "pool",
  "Stories", "StoriesTotal", "NumberOfStories", "InteriorLevels", "Levels",
  "OriginalListPrice", "OriginalPrice", "PreviousListPrice",
];
const liteOf = (col: string) => Prisma.raw(`jsonb_strip_nulls(jsonb_build_object(${RAW_KEYS.map((k) => `'${k}', ${col}->'${k}'`).join(", ")}))`);
const remarksOf = (col: string) => Prisma.raw(`${col}->>'PublicRemarks', ${col}->>'Remarks', ${col}->>'MarketingRemarks', ${col}->>'description'`);

function distressRegex() {
  return DISTRESS_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
}

type CandidateRow = {
  id: string;
  status: string;
  price: number | null;
  sqft: number | null;
  zip: string;
  dwelling: string;
  dom: number | null;
  estimatedEquityPct: number | null;
  ownerOccupied: boolean | null;
  estimatedArv: number | null;
  originalListPrice: number | null;
  distress: boolean;
  latitude: number | null;
  longitude: number | null;
  address: string;
};

/**
 * Light candidates for scoring, pin placement, and pagination. The CTE
 * computes everything `buildWhere` needs to filter on (status, price, beds,
 * baths, sqft, lot, pool, levels, zip, dwelling, closed, mls, address, city)
 * from the raw JSON so the WHERE clause can run in SQL instead of on the
 * client; the outer SELECT only projects the columns `scoreDeals` and pins
 * actually use. Everything else on `ListingRecord` is defaulted to a
 * type-safe empty value here — the full display record for the current
 * page is loaded separately via `loadRowsByIds`.
 */
export async function loadCandidates(filters: SearchFilters): Promise<ListingRecord[]> {
  const regex = distressRegex();

  const rows = await prisma.$queryRaw<CandidateRow[]>`
    WITH c AS (
      SELECT p.id,
        CASE WHEN lower(COALESCE(l."mlsStatus",'')) LIKE '%coming%' THEN 'Coming Soon'
             WHEN lower(COALESCE(l."mlsStatus",'')) LIKE '%active%' THEN 'Active'
             WHEN lower(COALESCE(l."mlsStatus",'')) LIKE '%pending%' OR lower(COALESCE(l."mlsStatus",'')) LIKE '%contract%' THEN 'Pending'
             WHEN lower(COALESCE(l."mlsStatus",'')) LIKE '%expire%' THEN 'Expired'
             WHEN lower(COALESCE(l."mlsStatus",'')) LIKE '%cancel%' OR lower(COALESCE(l."mlsStatus",'')) LIKE '%withdraw%' THEN 'Canceled'
             WHEN lower(COALESCE(l."mlsStatus",'')) LIKE '%closed%' OR lower(COALESCE(l."mlsStatus",'')) LIKE '%sold%' THEN 'Closed'
             ELSE COALESCE(NULLIF(l."mlsStatus",''), 'Off Market') END AS status,
        COALESCE(l."listPrice", p."estimatedValue") AS price,
        p.beds, p.baths,
        COALESCE(p.sqft,
          substring(src->>'LivingArea' from '^-?[0-9]+(\.[0-9]+)?')::numeric,
          substring(src->>'LivingAreaSqFt' from '^-?[0-9]+(\.[0-9]+)?')::numeric,
          substring(src->>'ApproxSQFT' from '^-?[0-9]+(\.[0-9]+)?')::numeric) AS sqft,
        COALESCE(p."lotSqft",
          substring(src->>'LotSizeSquareFeet' from '^-?[0-9]+(\.[0-9]+)?')::numeric,
          substring(src->>'LotSqFt' from '^-?[0-9]+(\.[0-9]+)?')::numeric,
          substring(src->>'LotSize' from '^-?[0-9]+(\.[0-9]+)?')::numeric) AS lot,
        p.zip,
        COALESCE(p."propertyType", src->>'PropertySubType', src->>'PropertyType', src->>'DwellingType', 'Single Family') AS dwelling,
        CASE WHEN lower(COALESCE(src->>'PoolPrivateYN', src->>'PrivatePoolYN', src->>'PrivatePool', src->>'HasPool', src->>'pool')) IN ('yes','y','true','1','private') THEN TRUE
             WHEN lower(COALESCE(src->>'PoolPrivateYN', src->>'PrivatePoolYN', src->>'PrivatePool', src->>'HasPool', src->>'pool')) IN ('no','n','false','0','none') THEN FALSE END AS pool,
        COALESCE(
          substring(COALESCE(src->>'Stories', src->>'StoriesTotal', src->>'NumberOfStories', src->>'InteriorLevels') from '^-?[0-9]+(\.[0-9]+)?')::numeric,
          CASE WHEN lower(src->>'Levels') LIKE '%three%' THEN 3
               WHEN lower(src->>'Levels') LIKE '%two%' THEN 2
               WHEN lower(src->>'Levels') LIKE '%one%' OR lower(src->>'Levels') LIKE '%single%' THEN 1 END
        ) AS levels,
        COALESCE(l."soldDate", p."lastSaleDate") AS closed,
        COALESCE(l."mlsNumber", 'PR-' || COALESCE(right(p.apn, 7), upper(right(p.id, 7)))) AS mls,
        p."streetAddress" AS address, p.city,
        l.dom,
        o."estimatedEquityPct", o."ownerOccupied",
        p."estimatedValue" AS "estimatedArv",
        substring(COALESCE(src->>'OriginalListPrice', src->>'OriginalPrice', src->>'PreviousListPrice') from '^-?[0-9]+(\.[0-9]+)?')::numeric AS "originalListPrice",
        COALESCE(COALESCE(l."rawJson"->>'PublicRemarks', l."rawJson"->>'Remarks', l."rawJson"->>'MarketingRemarks', l."rawJson"->>'description',
                           p."rawJson"->>'PublicRemarks', p."rawJson"->>'Remarks', p."rawJson"->>'MarketingRemarks', p."rawJson"->>'description') ~* ${regex}, false) AS distress,
        p.latitude, p.longitude
      FROM "Property" p
      LEFT JOIN LATERAL (SELECT * FROM "MlsListing" WHERE "propertyId" = p.id ORDER BY "updatedAt" DESC LIMIT 1) l ON true
      LEFT JOIN LATERAL (SELECT * FROM "PropertyOwner" WHERE "propertyId" = p.id ORDER BY "updatedAt" DESC LIMIT 1) o ON true
      CROSS JOIN LATERAL (SELECT COALESCE(l."rawJson", p."rawJson") AS src) s
    )
    SELECT id, status, price, sqft, zip, dwelling, dom, "estimatedEquityPct", "ownerOccupied", "estimatedArv", "originalListPrice", distress, latitude, longitude, address
    FROM c WHERE ${buildWhere(filters)}`;

  return rows.map((r) => ({
    id: r.id,
    mlsNumber: "",
    status: r.status,
    listPrice: r.price,
    dom: r.dom,
    listDate: null,
    address: r.address,
    city: "",
    state: "",
    zip: r.zip,
    subdivision: null,
    dwellingType: r.dwelling,
    beds: null,
    baths: null,
    sqft: r.sqft,
    lotSqft: null,
    pool: null,
    interiorLevels: null,
    yearBuilt: null,
    latitude: r.latitude,
    longitude: r.longitude,
    ownerName: null,
    estimatedEquityPct: r.estimatedEquityPct,
    ownerOccupied: r.ownerOccupied,
    estimatedArv: r.estimatedArv,
    originalListPrice: r.originalListPrice,
    remarks: null,
    distressSignal: r.distress,
    source: "",
  }));
}

type FullRow = {
  id: string; apn: string | null; streetAddress: string; city: string; state: string; zip: string;
  subdivision: string | null; propertyType: string | null; beds: number | null; baths: number | null;
  sqft: number | null; lotSqft: number | null; yearBuilt: number | null; latitude: number | null; longitude: number | null;
  estimatedValue: number | null; lastSaleDate: Date | string | null; source: string; propLite: unknown; distress: boolean;
  mlsNumber: string | null; mlsStatus: string | null; listPrice: number | null; dom: number | null;
  listDate: Date | string | null; soldDate: Date | string | null; listSource: string | null; listLite: unknown;
  ownerFullName: string | null; ownerFirstName: string | null; ownerLastName: string | null;
  estimatedEquityPct: number | null; ownerOccupied: boolean | null;
};

const toDate = (v: Date | string | null) => (v ? new Date(v) : null);

/**
 * Full display record for a specific page of ids (the same mapping the old
 * client-side page applied to every row, now scoped to just the page being
 * rendered). Order follows `ids`, matching the caller's already-sorted list.
 */
export async function loadRowsByIds(ids: string[]): Promise<ListingRecord[]> {
  if (ids.length === 0) return [];
  const regex = distressRegex();

  const rows = await prisma.$queryRaw<FullRow[]>`
    SELECT p.id, p.apn, p."streetAddress", p.city, p.state, p.zip, p.subdivision, p."propertyType",
           p.beds, p.baths, p.sqft, p."lotSqft", p."yearBuilt", p.latitude, p.longitude,
           p."estimatedValue", p."lastSaleDate", p.source,
           ${liteOf('p."rawJson"')} AS "propLite",
           COALESCE(COALESCE(${remarksOf('l."rawJson"')}, ${remarksOf('p."rawJson"')}) ~* ${regex}, false) AS distress,
           l."mlsNumber", l."mlsStatus", l."listPrice", l.dom, l."listDate", l."soldDate", l.source AS "listSource",
           ${liteOf('COALESCE(l."rawJson", p."rawJson")')} AS "listLite",
           o."fullName" AS "ownerFullName", o."firstName" AS "ownerFirstName", o."lastName" AS "ownerLastName",
           o."estimatedEquityPct", o."ownerOccupied"
    FROM "Property" p
    LEFT JOIN LATERAL (SELECT * FROM "MlsListing" WHERE "propertyId" = p.id ORDER BY "updatedAt" DESC LIMIT 1) l ON true
    LEFT JOIN LATERAL (SELECT * FROM "PropertyOwner" WHERE "propertyId" = p.id ORDER BY "updatedAt" DESC LIMIT 1) o ON true
    WHERE p.id IN (${Prisma.join(ids)})`;

  const byId = new Map(rows.map((r) => [r.id, r]));
  const ordered = ids.map((id) => byId.get(id)).filter((r): r is FullRow => r != null);

  return ordered.map((r) => {
    const source = r.mlsNumber ? r.listLite : r.propLite;
    const closedDate = toDate(r.soldDate) ?? toDate(r.lastSaleDate);

    return {
      id: r.id,
      mlsNumber: r.mlsNumber ?? `PR-${r.apn?.slice(-7) ?? r.id.slice(-7).toUpperCase()}`,
      status: r.mlsStatus ?? "Off Market",
      closedDate: closedDate?.toISOString() ?? null,
      listPrice: r.listPrice ?? r.estimatedValue,
      dom: r.dom ?? null,
      listDate: toDate(r.listDate)?.toISOString() ?? null,
      address: r.streetAddress,
      city: r.city,
      state: r.state,
      zip: r.zip,
      subdivision: r.subdivision,
      dwellingType: r.propertyType ?? rawString(source, ["PropertySubType", "PropertyType", "DwellingType"]) ?? rawString(r.propLite, ["PropertySubType", "PropertyType", "DwellingType"]) ?? "Single Family",
      beds: r.beds,
      baths: r.baths,
      sqft: r.sqft ?? rawNumber(source, ["LivingArea", "LivingAreaSqFt", "ApproxSQFT"]),
      lotSqft: r.lotSqft ?? rawNumber(source, ["LotSizeSquareFeet", "LotSqFt", "LotSize"]),
      pool: rawBoolean(source, ["PoolPrivateYN", "PrivatePoolYN", "PrivatePool", "HasPool", "pool"]) ?? rawBoolean(r.propLite, ["PoolPrivateYN", "PrivatePoolYN", "PrivatePool", "HasPool", "pool"]),
      interiorLevels: rawLevels(source) ?? rawLevels(r.propLite),
      yearBuilt: r.yearBuilt,
      latitude: r.latitude,
      longitude: r.longitude,
      ownerName: r.ownerFullName ?? ([r.ownerFirstName, r.ownerLastName].filter(Boolean).join(" ") || null),
      estimatedEquityPct: r.estimatedEquityPct ?? null,
      ownerOccupied: r.ownerOccupied ?? null,
      estimatedArv: r.estimatedValue,
      originalListPrice: rawNumber(source, ["OriginalListPrice", "OriginalPrice", "PreviousListPrice"]),
      distressSignal: r.distress,
      source: r.listSource ?? r.source,
    };
  });
}
