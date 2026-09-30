import { prisma } from "@/lib/prisma";
import { dwellingSql, RESIDENTIAL_CLASSES, statusSql } from "./classify";
import { subdivisionKey } from "./comps";
import { buildInvestorIndex, classifyInvestorBuy, type InvestorBuyRecord, type InvestorIndex } from "./investor-comps";
import { leasedLandSql, sqftSql } from "./load";
import { normalizeStatus } from "./score-deals";

const TTL_MS = 15 * 60_000;
// The sync keeps 24 months of closed sales, the longest Investor comps period.
const LOOKBACK_MONTHS = 24;
// Same sanity bounds as the retail comps (load-comps.ts).
const MIN_PRICE = 30_000;
const MIN_PPSF = 40;
const MAX_PPSF = 2_000;

type Row = {
  id: string; propertyId: string; lat: number; lng: number; sqft: number; beds: number | null; baths: number | null; yearBuilt: number | null;
  dwelling: string; subdivision: string | null; price: number; closed: Date; address: string; city: string;
  relistAt: Date | null; exitPrice: number | null; exitStatus: string | null; rentalAt: Date | null; rent: number | null;
};

let cache: { at: number; index: InvestorIndex } | null = null;
let inFlight: Promise<InvestorIndex> | null = null;

async function fetchBuys(): Promise<InvestorBuyRecord[]> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - LOOKBACK_MONTHS);

  // Cash/hard-money closed sales, then what the same house did next: its first later MLS
  // listing (a flip's relist) and its first later rental listing.
  const rows = await prisma.$queryRaw<Row[]>`
    WITH s AS (
      SELECT l.id, l."propertyId", p."addressFingerprint" AS fp, p.latitude AS lat, p.longitude AS lng,
        ${sqftSql("p.sqft", ["LivingArea", "LivingAreaSqFt", "ApproxSQFT"])} AS sqft,
        p.beds, p.baths, p."yearBuilt", p.subdivision, p."streetAddress" AS address, p.city,
        ${dwellingSql(`COALESCE(p."propertyType", src->>'PropertySubType', src->>'PropertyType')`)} AS dwelling,
        ${statusSql(`l."mlsStatus"`)} AS status,
        COALESCE(l."soldPrice", (src->>'ClosePrice')::float8) AS price,
        l."soldDate" AS closed,
        -- Cash, or "Other" (in ARMLS usually hard money): how investors buy.
        -- Conventional/FHA/VA buyers are almost always owner-occupants.
        lower(COALESCE(src->>'BuyerFinancing', '')) ~ '(cash|other)' AS investor,
        lower(COALESCE(src->>'PropertyType', '')) LIKE '%lease%' AS lease,
        ${leasedLandSql("src", 'p."rawJson"')} AS "leasedLand"
      FROM "MlsListing" l
      JOIN "Property" p ON p.id = l."propertyId"
      CROSS JOIN LATERAL (SELECT COALESCE(l."rawJson", p."rawJson") AS src) x
      WHERE l."soldDate" >= ${cutoff} AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
    ), buys AS (
      SELECT * FROM s
      WHERE status = 'Closed' AND investor AND lease IS NOT TRUE AND "leasedLand" IS NOT TRUE
        AND price >= ${MIN_PRICE} AND sqft >= 300 AND price / sqft BETWEEN ${MIN_PPSF} AND ${MAX_PPSF}
    )
    SELECT b.id, b."propertyId", b.lat, b.lng, b.sqft, b.beds, b.baths, b."yearBuilt", b.dwelling, b.subdivision, b.price, b.closed,
      b.address, b.city, nx."listDate" AS "relistAt", nx.price AS "exitPrice", nx."mlsStatus" AS "exitStatus",
      r."listDate" AS "rentalAt", r.rent
    FROM buys b
    LEFT JOIN LATERAL (
      SELECT e."listDate", COALESCE(l2."soldPrice", l2."listPrice") AS price, l2."mlsStatus"
      FROM "MlsListing" l2
      -- ARMLS doesn't send a list date, so back it out of days on market:
      -- from the close for a sale, else from ARMLS's last modification (not
      -- our row's updatedAt, which is just when the sync last wrote it).
      CROSS JOIN LATERAL (SELECT COALESCE(l2."listDate",
        COALESCE(l2."soldDate", (l2."rawJson"->>'ModificationTimestamp')::timestamptz AT TIME ZONE 'UTC', l2."updatedAt")
          - make_interval(days => COALESCE(l2.dom, 0))) AS "listDate") e
      WHERE l2."propertyId" = b."propertyId" AND l2.id <> b.id AND e."listDate" > b.closed
      ORDER BY e."listDate" LIMIT 1
    ) nx ON true
    LEFT JOIN LATERAL (
      SELECT rl."listDate", rl.rent
      FROM "RentalListing" rl
      WHERE b.fp IS NOT NULL AND rl."addressFingerprint" = b.fp AND rl."listDate" > b.closed
      ORDER BY rl."listDate" LIMIT 1
    ) r ON true`;

  const buys: InvestorBuyRecord[] = [];
  for (const r of rows) {
    if (!RESIDENTIAL_CLASSES.includes(r.dwelling)) continue;
    const soldAt = new Date(r.closed).getTime();
    const relistAt = r.relistAt ? new Date(r.relistAt).getTime() : null;
    const rentalAt = r.rentalAt ? new Date(r.rentalAt).getTime() : null;
    const kind = classifyInvestorBuy({ soldAt, relistAt, rentalAt });
    if (!kind) continue;
    buys.push({
      id: r.id, propertyId: r.propertyId, lat: Number(r.lat), lng: Number(r.lng), sqft: Number(r.sqft),
      beds: r.beds == null ? null : Number(r.beds), baths: r.baths == null ? null : Number(r.baths),
      yearBuilt: r.yearBuilt == null ? null : Number(r.yearBuilt),
      dwelling: r.dwelling, subdivision: subdivisionKey(r.subdivision), price: Number(r.price), soldAt,
      address: r.address, city: r.city, kind,
      exit: kind === "Flipper" && relistAt != null
        ? { price: r.exitPrice == null ? null : Number(r.exitPrice), at: relistAt, status: normalizeStatus(r.exitStatus ?? "") }
        : null,
      rent: kind === "Landlord" && r.rent != null ? Number(r.rent) : null,
    });
  }
  return buys;
}

/** Classified investor buys, cached per server instance for TTL_MS. */
export async function loadInvestorIndex(): Promise<InvestorIndex> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.index;
  inFlight ??= fetchBuys()
    .then((buys) => {
      const index = buildInvestorIndex(buys);
      cache = { at: Date.now(), index };
      return index;
    })
    .finally(() => { inFlight = null; });
  return inFlight;
}
