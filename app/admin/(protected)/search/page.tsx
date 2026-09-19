import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { DISTRESS_WORDS } from "@/lib/distress";
import MlsSearchWorkspace, { type ListingRecord } from "./MlsSearchWorkspace";

export const metadata: Metadata = { title: "Deal Search | Highlander REI" };

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

const LIVE_STATUSES = ["Active", "Active Under Contract", "Pending", "Coming Soon"];

// The MLS rawJson blobs are ~10KB each; pulling them for thousands of rows
// just to read a handful of keys made this page take 15s+. Postgres extracts
// only the keys the mapping below reads (plus the distress-language flag
// from remarks), and the rows are reshaped to what the mapping expects.
const RAW_KEYS = [
  "PropertySubType", "PropertyType", "DwellingType", "LivingArea", "LivingAreaSqFt", "ApproxSQFT",
  "LotSizeSquareFeet", "LotSqFt", "LotSize", "PoolPrivateYN", "PrivatePoolYN", "PrivatePool", "HasPool", "pool",
  "Stories", "StoriesTotal", "NumberOfStories", "InteriorLevels", "Levels",
  "OriginalListPrice", "OriginalPrice", "PreviousListPrice",
];
const liteOf = (col: string) => Prisma.raw(`jsonb_strip_nulls(jsonb_build_object(${RAW_KEYS.map((k) => `'${k}', ${col}->'${k}'`).join(", ")}))`);
const remarksOf = (col: string) => Prisma.raw(`${col}->>'PublicRemarks', ${col}->>'Remarks', ${col}->>'MarketingRemarks', ${col}->>'description'`);

type Row = Record<string, unknown> & {
  id: string; apn: string | null; streetAddress: string; city: string; state: string; zip: string;
  subdivision: string | null; propertyType: string | null; beds: number | null; baths: number | null;
  sqft: number | null; lotSqft: number | null; yearBuilt: number | null; latitude: number | null; longitude: number | null;
  estimatedValue: number | null; lastSaleDate: Date | string | null; source: string; propLite: unknown; distress: boolean;
  mlsNumber: string | null; mlsStatus: string | null; listPrice: number | null; dom: number | null;
  listDate: Date | string | null; soldDate: Date | string | null; listSource: string | null; listLite: unknown;
  ownerFullName: string | null; ownerFirstName: string | null; ownerLastName: string | null;
  estimatedEquityPct: number | null; ownerOccupied: boolean | null; hasOwner: boolean;
};

async function loadProperties(kind: "live" | "other", limit: number) {
  const liveExists = Prisma.sql`EXISTS (SELECT 1 FROM "MlsListing" x WHERE x."propertyId" = p.id AND x."mlsStatus" IN (${Prisma.join(LIVE_STATUSES)}))`;
  const where = kind === "live" ? liveExists : Prisma.sql`NOT ${liveExists}`;
  const distressRegex = DISTRESS_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");

  const rows = await prisma.$queryRaw<Row[]>`
    SELECT p.id, p.apn, p."streetAddress", p.city, p.state, p.zip, p.subdivision, p."propertyType",
           p.beds, p.baths, p.sqft, p."lotSqft", p."yearBuilt", p.latitude, p.longitude,
           p."estimatedValue", p."lastSaleDate", p.source,
           ${liteOf('p."rawJson"')} AS "propLite",
           COALESCE(COALESCE(${remarksOf('l."rawJson"')}, ${remarksOf('p."rawJson"')}) ~* ${distressRegex}, false) AS distress,
           l."mlsNumber", l."mlsStatus", l."listPrice", l.dom, l."listDate", l."soldDate", l.source AS "listSource",
           ${liteOf('COALESCE(l."rawJson", p."rawJson")')} AS "listLite",
           o."fullName" AS "ownerFullName", o."firstName" AS "ownerFirstName", o."lastName" AS "ownerLastName",
           o."estimatedEquityPct", o."ownerOccupied", (o.id IS NOT NULL) AS "hasOwner"
    FROM "Property" p
    LEFT JOIN LATERAL (SELECT * FROM "MlsListing" WHERE "propertyId" = p.id ORDER BY "updatedAt" DESC LIMIT 1) l ON true
    LEFT JOIN LATERAL (SELECT * FROM "PropertyOwner" WHERE "propertyId" = p.id ORDER BY "updatedAt" DESC LIMIT 1) o ON true
    WHERE ${where}
    ORDER BY p."updatedAt" DESC
    LIMIT ${limit}`;

  // Reshape to the nested form the mapping below reads.
  // Dates are normalised in case the driver hands back ISO strings.
  const toDate = (v: Date | string | null) => (v ? new Date(v) : null);
  return rows.map((r) => ({
    ...r,
    lastSaleDate: toDate(r.lastSaleDate),
    rawJson: r.propLite,
    mlsListings: r.mlsNumber
      ? [{ mlsNumber: r.mlsNumber, mlsStatus: r.mlsStatus, listPrice: r.listPrice, dom: r.dom, listDate: toDate(r.listDate), soldDate: toDate(r.soldDate), source: r.listSource, rawJson: r.listLite }]
      : [],
    owners: r.hasOwner
      ? [{ fullName: r.ownerFullName, firstName: r.ownerFirstName, lastName: r.ownerLastName, estimatedEquityPct: r.estimatedEquityPct, ownerOccupied: r.ownerOccupied }]
      : [],
  }));
}

export default async function SearchPage() {
  await requireAdmin();

  // The workspace filters client-side and defaults to live statuses, so live
  // listings are always loaded in full; everything else (Closed history,
  // off-market records) is capped to the most recently updated.
  const [live, other] = await Promise.all([loadProperties("live", 6000), loadProperties("other", 1000)]);
  const properties = [...live, ...other];

  const listings: ListingRecord[] = properties.map((property) => {
    const listing = property.mlsListings[0];
    const owner = property.owners[0];
    const source = listing?.rawJson ?? property.rawJson;
    const listPrice = listing?.listPrice ?? property.estimatedValue;

    return {
      id: property.id,
      mlsNumber: listing?.mlsNumber ?? `PR-${property.apn?.slice(-7) ?? property.id.slice(-7).toUpperCase()}`,
      status: listing?.mlsStatus ?? "Off Market",
      closedDate: (listing?.soldDate ?? property.lastSaleDate)?.toISOString() ?? null,
      listPrice,
      dom: listing?.dom ?? null,
      listDate: listing?.listDate?.toISOString() ?? null,
      address: property.streetAddress,
      city: property.city,
      state: property.state,
      zip: property.zip,
      subdivision: property.subdivision,
      dwellingType: property.propertyType ?? rawString(source, ["PropertySubType", "PropertyType", "DwellingType"]) ?? rawString(property.rawJson, ["PropertySubType", "PropertyType", "DwellingType"]) ?? "Single Family",
      beds: property.beds,
      baths: property.baths,
      sqft: property.sqft ?? rawNumber(source, ["LivingArea", "LivingAreaSqFt", "ApproxSQFT"]),
      lotSqft: property.lotSqft ?? rawNumber(source, ["LotSizeSquareFeet", "LotSqFt", "LotSize"]),
      pool: rawBoolean(source, ["PoolPrivateYN", "PrivatePoolYN", "PrivatePool", "HasPool", "pool"]) ?? rawBoolean(property.rawJson, ["PoolPrivateYN", "PrivatePoolYN", "PrivatePool", "HasPool", "pool"]),
      interiorLevels: rawLevels(source) ?? rawLevels(property.rawJson),
      yearBuilt: property.yearBuilt,
      latitude: property.latitude,
      longitude: property.longitude,
      ownerName: owner?.fullName ?? ([owner?.firstName, owner?.lastName].filter(Boolean).join(" ") || null),
      estimatedEquityPct: owner?.estimatedEquityPct ?? null,
      ownerOccupied: owner?.ownerOccupied ?? null,
      estimatedArv: property.estimatedValue,
      originalListPrice: rawNumber(source, ["OriginalListPrice", "OriginalPrice", "PreviousListPrice"]),
      distressSignal: property.distress,
      source: listing?.source ?? property.source,
    };
  });

  return <MlsSearchWorkspace listings={listings} />;
}
