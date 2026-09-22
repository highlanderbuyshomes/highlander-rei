import { prisma } from "@/lib/prisma";
import { dwellingSql, RESIDENTIAL_CLASSES, statusSql } from "./classify";
import { buildCompIndex, subdivisionKey, type ClosedComp, type CompIndex } from "./comps";
import { sqftSql } from "./load";

const TTL_MS = 15 * 60_000;
const LOOKBACK_MONTHS = 12;
// Sanity bounds that drop data-entry errors and non-arm's-length transfers.
const MIN_PRICE = 30_000;
const MIN_PPSF = 40;
const MAX_PPSF = 2_000;

type Row = {
  id: string; lat: number; lng: number; sqft: number; beds: number | null; yearBuilt: number | null;
  dwelling: string; zip: string; subdivision: string | null; price: number; closed: Date; address: string; city: string;
};

// Fluid Compute reuses instances, so one load serves many searches.
let cache: { at: number; index: CompIndex } | null = null;
let inFlight: Promise<CompIndex> | null = null;

async function fetchComps(): Promise<ClosedComp[]> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - LOOKBACK_MONTHS);

  // Every Closed MLS listing (not just each property's latest one) is a sale.
  const rows = await prisma.$queryRaw<Row[]>`
    WITH s AS (
      SELECT l.id, p.latitude AS lat, p.longitude AS lng,
        ${sqftSql("p.sqft", ["LivingArea", "LivingAreaSqFt", "ApproxSQFT"])} AS sqft,
        p.beds, p."yearBuilt", p.zip, p.subdivision, p."streetAddress" AS address, p.city,
        ${dwellingSql(`COALESCE(p."propertyType", src->>'PropertySubType', src->>'PropertyType')`)} AS dwelling,
        ${statusSql(`l."mlsStatus"`)} AS status,
        COALESCE(l."soldPrice", (src->>'ClosePrice')::float8) AS price,
        l."soldDate" AS closed,
        lower(COALESCE(src->>'PropertyType', '')) LIKE '%lease%' AS lease
      FROM "MlsListing" l
      JOIN "Property" p ON p.id = l."propertyId"
      CROSS JOIN LATERAL (SELECT COALESCE(l."rawJson", p."rawJson") AS src) x
      WHERE l."soldDate" >= ${cutoff} AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
    )
    SELECT id, lat, lng, sqft, beds, "yearBuilt", dwelling, zip, subdivision, price, closed, address, city
    FROM s
    WHERE status = 'Closed' AND lease IS NOT TRUE AND price >= ${MIN_PRICE} AND sqft >= 300
      AND price / sqft BETWEEN ${MIN_PPSF} AND ${MAX_PPSF}`;

  return rows
    .filter((r) => RESIDENTIAL_CLASSES.includes(r.dwelling))
    .map((r) => ({
      id: r.id, lat: Number(r.lat), lng: Number(r.lng), sqft: Number(r.sqft),
      beds: r.beds == null ? null : Number(r.beds), yearBuilt: r.yearBuilt == null ? null : Number(r.yearBuilt),
      dwelling: r.dwelling, zip: r.zip, subdivision: subdivisionKey(r.subdivision), price: Number(r.price), closedAt: new Date(r.closed).getTime(),
      address: r.address, city: r.city,
    }));
}

/** Closed-sale comp index, cached per server instance for TTL_MS. */
export async function loadCompIndex(): Promise<CompIndex> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.index;
  inFlight ??= fetchComps()
    .then((comps) => {
      const index = buildCompIndex(comps);
      cache = { at: Date.now(), index };
      return index;
    })
    .finally(() => { inFlight = null; });
  return inFlight;
}
