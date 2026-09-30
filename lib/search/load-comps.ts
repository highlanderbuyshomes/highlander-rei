import { prisma } from "@/lib/prisma";
import { dwellingSql, RESIDENTIAL_CLASSES, statusSql } from "./classify";
import { buildCompIndex, subdivisionKey, type ClosedComp, type CompIndex } from "./comps";
import { leasedLandSql, sqftSql } from "./load";
import { pgPhraseRegex, RENOVATED_PHRASES } from "@/lib/distress";
import { plausibleLotSqft } from "./plausible";

const TTL_MS = 15 * 60_000;
const LOOKBACK_MONTHS = 12;
// A flip resale is a sale whose property was bought (cash) between these
// many days before: long enough to be a separate deal, short enough to be a flip.
const FLIP_MIN_DAYS = 30;
const FLIP_MAX_DAYS = 365;
const RENOVATED_REGEX = pgPhraseRegex(RENOVATED_PHRASES);
// Sanity bounds that drop data-entry errors and non-arm's-length transfers.
const MIN_PRICE = 30_000;
const MIN_PPSF = 40;
const MAX_PPSF = 2_000;

type Row = {
  id: string; propertyId: string; lat: number; lng: number; sqft: number; beds: number | null; yearBuilt: number | null;
  dwelling: string; zip: string; subdivision: string | null; price: number; closed: Date; address: string; city: string;
  flip: boolean; renovated: boolean; lot: number | null;
};

// Fluid Compute reuses instances, so one load serves many searches.
let cache: { at: number; index: CompIndex } | null = null;
let inFlight: Promise<CompIndex> | null = null;

/** Closed-sale comps closed in the last `lookbackMonths` (the backtest loads 24). */
export async function fetchComps(lookbackMonths: number = LOOKBACK_MONTHS): Promise<ClosedComp[]> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - lookbackMonths);

  // Every Closed MLS listing (not just each property's latest one) is a sale.
  // `prior` is the same property's previous closed sale (the sync keeps 24
  // months), which is how a flip resale is recognised.
  const rows = await prisma.$queryRaw<Row[]>`
    WITH s AS (
      SELECT l.id, l."propertyId", p.latitude AS lat, p.longitude AS lng,
        ${sqftSql("p.sqft", ["LivingArea", "LivingAreaSqFt", "ApproxSQFT"])} AS sqft,
        p.beds, p."yearBuilt", ${sqftSql('p."lotSqft"', ["LotSizeSquareFeet", "LotSqFt", "LotSize"])} AS lot, p.zip, p.subdivision, p."streetAddress" AS address, p.city,
        ${dwellingSql(`COALESCE(p."propertyType", src->>'PropertySubType', src->>'PropertyType')`)} AS dwelling,
        ${statusSql(`l."mlsStatus"`)} AS status,
        COALESCE(l."soldPrice", (src->>'ClosePrice')::float8) AS price,
        l."soldDate" AS closed,
        lower(COALESCE(src->>'BuyerFinancing', '')) LIKE '%cash%' AS cash,
        COALESCE(COALESCE(src->>'PublicRemarks', src->>'Remarks', src->>'MarketingRemarks') ~* ${RENOVATED_REGEX}, false) AS renovated,
        lower(COALESCE(src->>'PropertyType', '')) LIKE '%lease%' AS lease,
        ${leasedLandSql("src", 'p."rawJson"')} AS "leasedLand",
        p.latitude IS NOT NULL AND p.longitude IS NOT NULL AS located
      FROM "MlsListing" l
      JOIN "Property" p ON p.id = l."propertyId"
      CROSS JOIN LATERAL (SELECT COALESCE(l."rawJson", p."rawJson") AS src) x
      WHERE l."soldDate" IS NOT NULL
    ), sales AS (
      SELECT s.*,
        LAG(closed) OVER (PARTITION BY "propertyId" ORDER BY closed) AS "priorClosed",
        LAG(cash) OVER (PARTITION BY "propertyId" ORDER BY closed) AS "priorCash"
      FROM s WHERE status = 'Closed'
    )
    SELECT id, "propertyId", lat, lng, sqft, beds, "yearBuilt", lot, dwelling, zip, subdivision, price, closed, address, city, renovated,
      COALESCE("priorCash" AND closed - "priorClosed" BETWEEN make_interval(days => ${FLIP_MIN_DAYS}) AND make_interval(days => ${FLIP_MAX_DAYS}), false) AS flip
    FROM sales
    WHERE closed >= ${cutoff} AND located AND lease IS NOT TRUE AND "leasedLand" IS NOT TRUE
      AND price >= ${MIN_PRICE} AND sqft >= 300 AND price / sqft BETWEEN ${MIN_PPSF} AND ${MAX_PPSF}`;

  return rows
    .filter((r) => RESIDENTIAL_CLASSES.includes(r.dwelling))
    .map((r) => ({
      id: r.id, propertyId: r.propertyId, lat: Number(r.lat), lng: Number(r.lng), sqft: Number(r.sqft),
      beds: r.beds == null ? null : Number(r.beds), yearBuilt: r.yearBuilt == null ? null : Number(r.yearBuilt),
      dwelling: r.dwelling, zip: r.zip, subdivision: subdivisionKey(r.subdivision), price: Number(r.price), closedAt: new Date(r.closed).getTime(),
      address: r.address, city: r.city, flipResale: r.flip, renovated: r.renovated,
      lotSqft: plausibleLotSqft(r.lot == null ? null : Number(r.lot)),
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
