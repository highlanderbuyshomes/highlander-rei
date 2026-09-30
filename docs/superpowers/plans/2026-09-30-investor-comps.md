# Investor Comps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On a Deal Search listing's detail view, an on-demand **Investor comps** panel showing what flippers and landlords paid nearby, with Smart Match ranking.

**Architecture:** Pure scoring/classification in `lib/search/investor-comps.ts`; one cached SQL load of classified ARMLS cash purchases in `lib/search/load-investor-buys.ts`; a minimal `RentalListing` table fed by a lease-only pass of the existing RESO sync; a new admin API route; a client component fetched only on click.

**Tech Stack:** Next.js App Router (read `node_modules/next/dist/docs/` before touching routes), Prisma 7 + Neon Postgres (raw SQL), Vitest.

**Spec:** `docs/superpowers/specs/2026-09-30-investor-comps-design.md`

## Global Constraints

- Deterministic rules only; no AI/LLM touches ARMLS data.
- Nothing investor-related loads until the user clicks **Investor comps** on a listing.
- Defaults: radius 2 mi (options 0.5 / 1 / 2), period 24 months (options 12 / 24), buyer type Any.
- Minimal UI copy: terse labels, no subtitles.
- Migrations are hand-written SQL containing only this feature's statements (the DB is shared with another app — never include DROPs).
- Stage explicit paths only; never `git commit -a`.
- `RentalListing` rows hold only mlsNumber, addressFingerprint, listDate, rent.

## Review Focus

1. Subject with no coordinates or no sqft → panel says `No location` / `No sqft`, no crash. (Task 1 test)
2. Relist within 30 days of purchase → buy excluded, not called a flip. (Task 1 test)
3. Rental listed before a sale relist → Landlord, not Flipper. (Task 1 test)
4. Fewer than 3 buys of a type → that price is `—`, count still shown. (Task 1 test)
5. Subject listing appearing among its own investor buys (same listing id) → excluded. (Task 1 test)

---

### Task 1: Pure investor-comps logic

**Files:**
- Create: `lib/search/investor-comps.ts`
- Test: `lib/search/investor-comps.test.ts`

**Interfaces:**
- Consumes: `milesBetween`, `percentile`, `subdivisionKey`, `ATTACHED_CLASSES`, `ATTACHED_MAX_MILES`, `ArvSubject` from `./comps`.
- Produces:
  - `type InvestorKind = "Flipper" | "Landlord"`
  - `classifyInvestorBuy(e: { soldAt: number; relistAt: number | null; rentalAt: number | null }, now: number): InvestorKind | null`
  - `type InvestorBuyRecord` (see code)
  - `buildInvestorIndex(buys: InvestorBuyRecord[]): InvestorIndex`
  - `smartMatchScore(subject, buy, miles, opts: { radiusMiles; months }, now): number`
  - `findInvestorComps(subject: ArvSubject, index: InvestorIndex, opts: { radiusMiles: number; months: number; arv: number | null }, now?): InvestorCompsResponse`
  - `type InvestorBuy`, `type InvestorCompsResponse`, `INVESTOR_RADII = [0.5, 1, 2]`, `INVESTOR_PERIODS = [12, 24]`

- [ ] **Step 1: Write failing tests** — `lib/search/investor-comps.test.ts` covering: each classification rule and 30/365 boundaries; rental-before-relist; score endpoints; top-5 median price; <3 → null; smart match tags; missing location/sqft; self-exclusion; dwelling class; attached distance cap; radius/period filters.
- [ ] **Step 2:** `pnpm vitest run lib/search/investor-comps.test.ts` → FAIL (module missing).
- [ ] **Step 3:** Implement `lib/search/investor-comps.ts` (code as committed in this task).
- [ ] **Step 4:** Re-run → PASS.
- [ ] **Step 5:** Commit `lib/search/investor-comps.ts lib/search/investor-comps.test.ts`.

Rules implemented (from spec):
- `relistDays < 30` → null. Rental within 365 days and before any relist → Landlord. Relist 30–365 days → Flipper. Otherwise purchase ≥ 365 days old → Landlord (held). Else null.
- Score (0–100, rounded): distance 30 (0 → radius), sqft 25 (0 → 25% diff), beds 15 (equal) / 7 (±1) / 0, year 10 (0 → 20 yrs), same subdivision 10, recency 10 (now → period start).
- Candidate filter: same dwelling class, `id !== subject.id`, within radius and period; attached classes beyond `ATTACHED_MAX_MILES` only when same subdivision.
- Price per kind: `count >= 3` → median $/sqft of top 5 by score × subject sqft, rounded; `pctArv = round(price / arv * 100)` when ARV known.
- Smart Match: top 5 overall with score ≥ 60. Response `buys` sorted by score desc, max 100.

### Task 2: RentalListing table + lease-only RESO pass

**Files:**
- Modify: `prisma/schema.prisma` (add `RentalListing`)
- Create: `prisma/migrations/20260930_rental_listing/migration.sql`
- Modify: `lib/integrations/reso.ts` (export `buildFilter`; `leaseOnly` option)
- Modify: `lib/integrations/reso-sync.ts` (export `formatStreetAddress`, `normalizeAddressFingerprint`)
- Create: `lib/integrations/rental-sync.ts`
- Test: `lib/integrations/rental-sync.test.ts`, extend with `buildFilter` cases

**Interfaces:**
- Produces: `ResoScopeOpts.leaseOnly?: boolean`; `buildFilter(opts)`; `toRentalRow(l: ResoListing): RentalRow | null`; `syncRentalListings(opts: ResoScopeOpts, control?: { deadline?: number; meta?: Record<string, unknown> }): Promise<RentalSyncResult>`; `RENTAL_SOURCE = "reso-lease"`.

- [ ] **Step 1: Failing tests:** `buildFilter({ leaseOnly: true, modifiedSince })` contains `PropertyType eq 'Residential Lease'` and not the sales-only clause; default filter unchanged (still contains `PropertyType ne 'Residential Lease'`); `toRentalRow` maps ListingId/ListingKey, fingerprint, ListDate, ListPrice; returns null without zip.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Schema + migration:

```sql
CREATE TABLE "RentalListing" (
    "id" TEXT NOT NULL,
    "mlsNumber" TEXT NOT NULL,
    "addressFingerprint" TEXT NOT NULL,
    "listDate" TIMESTAMP(3),
    "rent" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RentalListing_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RentalListing_mlsNumber_key" ON "RentalListing"("mlsNumber");
CREATE INDEX "RentalListing_addressFingerprint_idx" ON "RentalListing"("addressFingerprint");
```

  `buildFilter` with `leaseOnly`: area clause + `PropertyType eq 'Residential Lease'` + `ModificationTimestamp gt X` when `modifiedSince` set. `syncRentalListings` pages `fetchResoListingPages`, maps with `toRentalRow`, dedupes by mlsNumber per page, upserts with one `INSERT ... SELECT FROM unnest(...) ON CONFLICT ("mlsNumber") DO UPDATE`, records an `ImportRun` (`source: "reso-lease"`, `rawMeta.watermark`), stops at `deadline` as `partial`.
- [ ] **Step 4:** Run → PASS; `pnpm prisma generate`; `pnpm tsc --noEmit`.
- [ ] **Step 5:** Commit schema, migration, reso.ts, reso-sync.ts, rental-sync.ts and tests.

### Task 3: Cron rental pass + backfill script

**Files:**
- Modify: `app/api/cron/reso-sync/route.ts`
- Create: `scripts/backfill-rentals.ts`

- [ ] **Step 1:** Cron: after the sales pass succeeds, if `Date.now() < started + 230s`, find latest `reso-lease` run with status `completed`/`completed_with_errors`; if found, run `syncRentalListings({ counties: VALLEY_COUNTIES, leaseOnly: true, modifiedSince: watermark }, { deadline: started + 260s, meta: { watermark: now } })` in its own try/catch (logged; never fails the response). No completed lease run → skip (backfill not yet run). Response gains `rentals`.
- [ ] **Step 2:** Backfill: `npx tsx --env-file=.env.local scripts/backfill-rentals.ts [--apply]`. Dry run fetches only the first page of the lease scope and prints how many rows it maps and a sample, writing nothing; `--apply` runs `syncRentalListings` with `modifiedSince` = 24 months ago and no deadline, which records the completed run the cron watermark starts from.
- [ ] **Step 3:** `pnpm tsc --noEmit` and `pnpm lint` on touched files.
- [ ] **Step 4:** Commit both files.

### Task 4: Load classified buys + API route

**Files:**
- Create: `lib/search/load-investor-buys.ts`
- Modify: `lib/search/run-search.ts` (add `loadInvestorComps`)
- Modify: `lib/search/types.ts` (re-export response types)
- Create: `app/api/admin/search/investor-comps/route.ts`

**Interfaces:**
- Consumes: Task 1 types/functions; `dwellingSql`, `statusSql`, `RESIDENTIAL_CLASSES`; `sqftSql`, `leasedLandSql`; `normalizeStatus`.
- Produces: `loadInvestorIndex(): Promise<InvestorIndex>` (15-min cache, in-flight dedupe); `loadInvestorComps(id: string, radiusMiles: number, months: number): Promise<InvestorCompsResponse | null>`; `GET /api/admin/search/investor-comps?id&radius&months`.

- [ ] **Step 1:** SQL: closed MLS sales in last 24 months with cash financing, located, non-lease, not leased land, sane price/ppsf; `LEFT JOIN LATERAL` first later MLS listing of the same property (`listDate > soldDate`, id differs) and first later `RentalListing` by fingerprint. Classify in TS, drop nulls and non-residential classes.
- [ ] **Step 2:** `loadInvestorComps`: `loadRowsByIds([id])`, `loadCompIndex()` → `estimateArv` for ARV, `loadInvestorIndex()` → `findInvestorComps`. Radius clamped to [0.25, 2], months to [1, 24].
- [ ] **Step 3:** Route mirrors `listing/route.ts` (admin check, 400 without id, 404, 500 JSON).
- [ ] **Step 4:** `pnpm tsc --noEmit`, `pnpm test`.
- [ ] **Step 5:** Commit.

### Task 5: Investor comps UI

**Files:**
- Create: `app/admin/(protected)/search/InvestorComps.tsx`
- Modify: `app/admin/(protected)/search/MlsSearchWorkspace.tsx` (`ListingDetail` tabs)
- Modify: `app/admin/(protected)/search/search.module.css`

- [ ] **Step 1:** `ListingDetail` gets a two-button toggle `Retail comps` / `Investor comps` above the sold-comps table (reuse `.dealModeActive` look via new `.compTabs`). Retail shows today's table. Investor renders `<InvestorComps listingId=... />`, mounted only after first click; toggle resets when the listing changes (key on listing id).
- [ ] **Step 2:** `InvestorComps`: state radius=2, months=24, type="Any"; fetch on mount and on radius/months change with AbortController; summary tiles `Flippers` / `Landlords` (`$X · 68% ARV · 14`, `—` when null); filter row of button groups; table: Buyer (tag), Address, Bought, Price, Bd/Ba, Sq Ft, Exit / Rent, Distance, Match (score + `Smart Match` tag). Errors: `Couldn't load investor comps` + Retry; `No location` / `No sqft`; empty → `No investor buys`.
- [ ] **Step 3:** `pnpm tsc --noEmit`, `pnpm lint`, `pnpm test`.
- [ ] **Step 4:** Commit.

### Task 6: Verify end-to-end

- [ ] Apply migration only after Steven confirms (shared production DB).
- [ ] `pnpm dev`, open `/admin/search`, open a listing, click Investor comps, check numbers look plausible; flip buys show exits.
- [ ] Open PR.
