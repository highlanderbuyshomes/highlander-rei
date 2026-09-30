# Investor Comps (Flippers vs Landlords) — Design

Date: 2026-09-30 · Status: approved in chat, pending spec review

## Goal

When Steven opens one property in `/admin/search`, show what investors have
actually paid nearby — split into **what flippers buy at** and **what landlords
buy at** — plus the purchases most like the subject (**Smart Match**). Modeled
on InvestorBase's InvestorComps / RetailComps split. Nothing loads until he
asks for it.

InvestorBase has no data API (its key only drives the Zapier buyer/offer
integration), so this is rebuilt from ARMLS data already synced. Deterministic
rules only — no AI in the ARMLS data path.

## User flow

1. Search as today → click a property → listing detail.
2. Detail shows two buttons: **Retail comps · ARV $X** (today's ARV + sold
   comps, default) and **Investor comps**.
3. Clicking **Investor comps** fetches and shows:
   - Summary: `Flippers $X · 68% ARV · 14` and `Landlords $Y · 74% ARV · 9`.
   - Filters: Radius `0.5 / 1 / 2 mi` (default 2), Period `1 / 2 yrs`
     (default 2), Buyer type `Any / Flippers / Landlords` (default Any).
   - List sorted by Smart Match score. Row: address, city, buy price, buy date,
     bd/ba/sqft, `Flipper` or `Landlord` tag, `Smart Match` tag on top matches.
     Flipper rows add resale/relist price + date; landlord rows add monthly
     rent when a rental listing exists.

Terse labels, no subtitles (minimal UI copy rule).

## Data

### Existing (no change)
`MlsListing` closed sales with `rawJson.BuyerFinancing` (kept by reso-raw),
`soldDate`, `soldPrice`, `listDate`, joined to `Property` (lat/lng, sqft, beds,
yearBuilt, subdivision, dwelling class). The sync keeps 24 months of closed
sales plus all Active/Pending listings.

### New: `RentalListing`
ARMLS `Residential Lease` listings are skipped at the source today. Store a
minimal row per lease listing — no `Property`, no `rawJson`:

```prisma
model RentalListing {
  id                 String   @id @default(cuid())
  mlsNumber          String   @unique
  addressFingerprint String
  listDate           DateTime?
  rent               Float?   // ListPrice (monthly)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([addressFingerprint])
}
```

Fingerprint uses the same `normalizeAddressFingerprint(formatStreetAddress(l), zip)`
as the sales sync so rentals join to `Property.addressFingerprint`.
Estimated size: ~70k rows/yr × ~150 B ≈ 10 MB/yr.

### Sync changes
- `ResoScopeOpts` gains `leaseOnly?: boolean`; `buildFilter` then emits
  `PropertyType eq 'Residential Lease'` instead of the sales-only clause.
  Sales behavior is unchanged when the flag is absent.
- `syncRentalListings(opts)` in `lib/integrations/rental-sync.ts`: pages via
  `fetchResoListingPages({ ...opts, leaseOnly: true })`, upserts
  `RentalListing` by `mlsNumber`.
- Cron `app/api/cron/reso-sync` runs the rental pass after the sales pass,
  incremental by `ModificationTimestamp` with its own `ImportRun`
  (`source = "reso-lease"`) cursor.
- `scripts/backfill-rentals.ts`: loads 24 months of lease listings. Dry run by
  default; `--apply` writes. Steven runs `--apply`.

## Classification

Pure function `classifyInvestorBuy` in `lib/search/investor-comps.ts`.

An **investor buy** is a Closed ARMLS sale with `BuyerFinancing` containing
"cash", price/sqft sanity bounds as in `load-comps.ts`, not lease/leased land,
residential class.

For each buy, look up the first later events on the same address:
- `nextListDate`: earliest `listDate` of another MLS sale listing for the same
  property after the buy's `soldDate` (any status), with its price
  (`soldPrice` if closed, else `listPrice`) and status.
- `rentalListDate`: earliest `RentalListing.listDate` for the same
  fingerprint after `soldDate`, with its rent.

Rules (`d` = days after the buy; first matching rule wins):
1. **Flipper** — `nextListDate` at 30 ≤ d ≤ 365, and it precedes any
   rental listing.
2. **Landlord** — `rentalListDate` at d ≤ 365.
3. **Landlord (held)** — buy ≥ 365 days ago and no sale relist within 365 days.
4. Otherwise **unclassified** — excluded (too early to tell). A sale relist
   under 30 days (duplicate entry or quick resale) is also unclassified.

## Smart Match

`smartMatchScore(subject, buy, { radiusMiles, months })` → 0–100:

| Factor | Points | Full points when | Zero when |
|---|---|---|---|
| Distance | 30 | 0 mi | ≥ radius |
| Sqft | 25 | equal | ≥ 25% apart |
| Beds | 15 | equal (±1 = 7) | ±2 or more / unknown |
| Year built | 10 | equal | ≥ 20 yrs apart / unknown |
| Same subdivision | 10 | same key (`subdivisionKey`) | different / unknown |
| Recency | 10 | today | at period start |

Linear between the endpoints. Buys must share the subject's dwelling class;
attached classes (`ATTACHED_CLASSES`) also respect `ATTACHED_MAX_MILES`
outside their own subdivision, same as retail comps.

`Smart Match` tag: top 5 by score among the returned buys with score ≥ 60.

## Investor price

Per type (flipper, landlord): take up to 5 highest-scoring buys of that type,
median buy $/sqft × subject sqft. `pctArv = price / subject ARV`.
Fewer than 3 buys of a type → price `null` (UI shows `—` with the count).

## API

`GET /api/admin/search/investor-comps?id=<listingId>&radius=2&months=24`
(admin session required, same as `listing`). Returns:

```ts
type InvestorBuy = {
  id: string; address: string; city: string;
  buyPrice: number; buyDate: string; sqft: number; beds: number | null; baths: number | null;
  distanceMiles: number; kind: "Flipper" | "Landlord"; score: number; smartMatch: boolean;
  exit: { price: number | null; date: string; status: string } | null; // flipper
  rent: number | null;                                                  // landlord
};
type InvestorCompsResponse = {
  flipper: { price: number | null; pctArv: number | null; count: number };
  landlord: { price: number | null; pctArv: number | null; count: number };
  buys: InvestorBuy[]; // sorted by score desc, max 100
};
```

Buyer-type filtering is client-side on `buys`. Radius capped at 2, months at 24.

## Loading & performance

`lib/search/load-investor-buys.ts` loads all classified investor buys in one
SQL query (window/lateral lookups for next listing and first rental), cached
per instance for 15 min with the same in-flight dedupe as `loadCompIndex`,
indexed in the same lat/lng grid cells. Per-request work is a cell scan +
scoring — no DB hit after warm-up.

## UI

`MlsSearchWorkspace.tsx` → `ListingDetail`: add the Retail / Investor toggle;
extract the investor panel to `InvestorComps.tsx` in the same folder. Fetch
only on first open of the Investor tab; refetch on radius/period change;
abort on listing change.

## Errors

- No subject coords/sqft → panel shows `No location` / `No sqft`.
- ARV missing → prices shown without `% ARV`.
- Fetch failure → `Couldn't load investor comps` with retry.
- Rental sync failure does not fail the sales sync (separate try/catch, logged).

## Testing (vitest)

- `classifyInvestorBuy`: each rule, boundaries at 30/365 days, rental-before-
  relist ordering, unclassified recent buy.
- `smartMatchScore`: each factor's endpoints and missing values.
- Investor price: median of top 5, <3 → null, pctArv.
- `buildFilter` with `leaseOnly` and unchanged sales filter.
- Rental row mapping from a RESO lease listing.

## Out of scope (later)

- Buyer entity names and portfolio counts (needs Maricopa County sales data).
- Off-market cash purchases (same — county phase).
- Investor-buy pins on the map.
- Rent-based yield metrics.
