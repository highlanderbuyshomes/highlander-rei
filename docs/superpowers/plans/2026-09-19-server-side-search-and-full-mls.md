# Server-side Deal Search + Full-MLS Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deal Search filters/scores on the server so it can handle the entire ARMLS feed, then the live sync is widened from the buy-box area to every ARMLS listing.

**Architecture:** A shared pure-TS layer (`lib/search/*`) builds the SQL filter and scores deals. `POST /api/admin/search` runs it and returns compact map pins + one page of full rows; the page's first render calls the same function. The workspace fetches on filter change (debounced, abortable). After that ships, `reso.ts` drops its area filter.

**Tech Stack:** Next.js (App Router, see `AGENTS.md` — read `node_modules/next/dist/docs/` before route-handler work), Prisma 7 + Neon adapter (`$queryRaw`), vitest (new, dev-only), Google Maps JS.

**Spec:** `docs/superpowers/specs/2026-09-19-server-side-search-design.md`

## Global Constraints

- Scoring weights, priority thresholds and status normalisation are moved **verbatim** — behaviour must not change.
- "Active Under Contract" normalises to **Active** (existing `normalizeStatus` checks `active` before `contract`). The spec text saying otherwise is wrong; Task 1 fixes it.
- Only new dependency: `vitest` (dev). No other packages.
- Admin-only endpoints use `requireAdminApi()` from `@/lib/session`.
- Never load `rawJson` wholesale; extract keys in SQL (Vercel↔Neon RTT ≈65 ms, blobs ≈10 KB).
- ARMLS compliance: zero AI in the ARMLS data path (deterministic code only).
- Verify on the live deploy (production DB is not reachable from dev). Rollback = `git revert`.

## File Structure

| File | Responsibility |
|---|---|
| `lib/search/types.ts` | `ListingRecord`, `DealCandidate`, `SearchFilters`, `SearchRequest`, `SearchResponse`, `Pin` |
| `lib/search/score-deals.ts` | pure: `normalizeStatus`, `median`, `scoreDeals` (moved from workspace) |
| `lib/search/build-query.ts` | pure: `SearchFilters` → `Prisma.Sql` WHERE fragment over CTE alias `c` |
| `lib/search/load.ts` | DB: `loadCandidates(filters)` (light rows), `loadRowsByIds(ids)` (full `ListingRecord`s) |
| `lib/search/run-search.ts` | orchestration: load → shape filter → score → paginate → `SearchResponse` |
| `app/api/admin/search/route.ts` | `POST` search |
| `app/api/admin/search/listing/route.ts` | `GET ?id=` one full `ListingRecord` |
| `app/admin/(protected)/search/page.tsx` | initial `runSearch` with default filters |
| `app/admin/(protected)/search/MlsSearchWorkspace.tsx` | fetch-on-change client |
| `app/admin/(protected)/search/GoogleMapStage.tsx` | render pins, emit `DrawnShape` |
| `lib/integrations/reso.ts` | Task 6: optional area filter, higher page cap |
| `vitest.config.ts`, `package.json` | test runner |

---

### Task 1: Test runner + types + scoring module

**Files:**
- Create: `vitest.config.ts`, `lib/search/types.ts`, `lib/search/score-deals.ts`, `lib/search/score-deals.test.ts`
- Modify: `package.json` (script + devDependency), `docs/superpowers/specs/2026-09-19-server-side-search-design.md` (status-mapping sentence)

**Interfaces:**
- Produces: `ListingRecord`, `DealCandidate`, `scoreDeals(listings: ListingRecord[], threshold: number): DealCandidate[]`, `normalizeStatus(value: string): string`

- [ ] **Step 1: Install vitest and add config**

```bash
pnpm add -D vitest
```

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: { include: ["lib/**/*.test.ts"] },
});
```
Add to `package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 2: Create `lib/search/types.ts`**

Move the `ListingRecord` type (currently exported from `MlsSearchWorkspace.tsx` lines 8–41) and `DealCandidate` (lines ~93–106) here unchanged, then add:

```ts
import type { DrawnShape } from "@/lib/filter-listings";
export type { DrawnShape };

export type SearchFilters = {
  keyword?: string;
  statuses?: string[];
  closedWithinMonths?: number;
  priceMin?: number; priceMax?: number;
  dwellingTypes?: string[];
  bedsMin?: number; bathsMin?: number;
  sqftMin?: number; sqftMax?: number;
  lotMin?: number; lotMax?: number;
  pool?: boolean;
  levels?: number | "3+";
  zips?: string[];
};

export type SearchRequest = { filters: SearchFilters; arvThreshold: number; shape?: DrawnShape | null; page?: number };

export type Pin = { id: string; lat: number; lng: number; price: number | null; status: string; target: boolean };

export type SearchResponse = { total: number; pins: Pin[]; rows: DealCandidate[]; targetCount: number };

export const PAGE_SIZE = 100;
```
In `MlsSearchWorkspace.tsx` replace the local type definitions with `import type { ListingRecord, DealCandidate } from "@/lib/search/types"; export type { ListingRecord };` (GoogleMapStage imports `ListingRecord` from the workspace).

- [ ] **Step 3: Write failing tests** — `lib/search/score-deals.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { normalizeStatus, scoreDeals } from "./score-deals";
import type { ListingRecord } from "./types";

const base: ListingRecord = {
  id: "x", mlsNumber: "1", status: "Active", listPrice: null, dom: null, listDate: null,
  address: "1 A St", city: "Phoenix", state: "AZ", zip: "85018", subdivision: null,
  dwellingType: "Single Family", beds: null, baths: null, sqft: null, lotSqft: null,
  pool: null, interiorLevels: null, yearBuilt: null, latitude: null, longitude: null,
  ownerName: null, estimatedEquityPct: null, source: "reso",
};
const L = (o: Partial<ListingRecord>): ListingRecord => ({ ...base, ...o });

describe("normalizeStatus", () => {
  it("keeps today's precedence", () => {
    expect(normalizeStatus("Active Under Contract")).toBe("Active");
    expect(normalizeStatus("Pending")).toBe("Pending");
    expect(normalizeStatus("Coming Soon")).toBe("Coming Soon");
    expect(normalizeStatus("Withdrawn")).toBe("Canceled");
    expect(normalizeStatus("Closed")).toBe("Closed");
    expect(normalizeStatus("")).toBe("Off Market");
  });
});

describe("scoreDeals", () => {
  it("flags a listing at 60% of a property-estimate ARV as Target now", () => {
    const [d] = scoreDeals([L({ listPrice: 300000, estimatedArv: 500000 })], 70);
    expect(d.listToArvPct).toBe(60);
    expect(d.dealScore).toBe(60);
    expect(d.priority).toBe("Target now");
    expect(d.arvSource).toBe("Property estimate");
    expect(d.reasons).toContain("60% of projected ARV");
  });

  it("returns Low / Insufficient data with no price or sqft", () => {
    const [d] = scoreDeals([L({})], 70);
    expect(d.arv).toBeNull();
    expect(d.arvSource).toBe("Insufficient data");
    expect(d.dealScore).toBe(0);
    expect(d.priority).toBe("Low");
  });

  it("scores 75% of ARV under a 70% threshold as +32 only", () => {
    const [d] = scoreDeals([L({ listPrice: 375000, estimatedArv: 500000 })], 70);
    expect(d.dealScore).toBe(32);
    expect(d.priority).toBe("Low");
  });

  it("adds 12 for distress language", () => {
    const [d] = scoreDeals([L({ distressSignal: true })], 70);
    expect(d.dealScore).toBe(12);
    expect(d.reasons).toContain("Fixer / condition language");
  });

  it("models ARV from the zip/type $/sqft median when no estimate", () => {
    const out = scoreDeals([
      L({ id: "a", listPrice: 200000, sqft: 1000 }),
      L({ id: "b", listPrice: 300000, sqft: 1000 }),
    ], 70);
    const a = out.find((x) => x.id === "a")!;
    expect(a.arvSource).toBe("Pocket $/sqft model");
    expect(a.arv).toBe(250000);
    expect(a.dealScore).toBe(42);
    expect(a.priority).toBe("Watch");
    expect(out[0].id).toBe("a"); // sorted by score desc
  });
});
```

- [ ] **Step 4: Run to confirm failure**

Run: `pnpm test` — Expected: FAIL, cannot resolve `./score-deals`.

- [ ] **Step 5: Create `lib/search/score-deals.ts`**

Copy verbatim from `MlsSearchWorkspace.tsx`: `normalizeStatus`, `median`, `scoreDeals` (starting at `function scoreDeals(`), and replace the two-line remarks block with `const conditionSignal = listing.distressSignal ?? hasDistressLanguage(listing.remarks);` (already the current code). Export `normalizeStatus`, `median`, `scoreDeals`. Imports:
```ts
import { hasDistressLanguage } from "@/lib/distress";
import type { DealCandidate, ListingRecord } from "./types";
```
Delete those three functions from the workspace and import `normalizeStatus`, `median`, `scoreDeals` from `@/lib/search/score-deals` (workspace still compiles; it still scores client-side until Task 5).

- [ ] **Step 6: Fix the spec sentence** — in the spec's `build-query` bullet replace the status-mapping parenthesis with: `(precedence as normalizeStatus: coming → Coming Soon; contains "active" → Active [so "Active Under Contract" is Active]; pending/contract → Pending; expire → Expired; cancel/withdraw → Canceled; closed/sold → Closed)`.

- [ ] **Step 7: Verify and commit**

Run: `pnpm test && npx tsc --noEmit -p . 2>&1 | grep -v '^.next'` — Expected: 6 tests pass, no type errors.
```bash
git add -A lib vitest.config.ts package.json pnpm-lock.yaml app docs
git commit -m "Extract deal scoring to lib/search with tests; add vitest"
```

---

### Task 2: SQL filter builder

**Files:** Create `lib/search/build-query.ts`, `lib/search/build-query.test.ts`

**Interfaces:**
- Consumes: `SearchFilters` (Task 1)
- Produces: `buildWhere(filters: SearchFilters): Prisma.Sql` — a boolean expression over CTE alias `c` with columns `c.status` (normalised), `c.price`, `c.beds`, `c.baths`, `c.sqft`, `c.lot`, `c.zip`, `c.dwelling`, `c.pool` (bool|null), `c.levels` (numeric|null), `c.closed` (timestamp|null), `c.mls`, `c.address`, `c.city`. Returns `Prisma.sql\`TRUE\`` when no filter applies.

- [ ] **Step 1: Write failing tests** — `lib/search/build-query.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { buildWhere } from "./build-query";

const text = (f: Parameters<typeof buildWhere>[0]) => buildWhere(f).sql.replace(/\s+/g, " ");

describe("buildWhere", () => {
  it("is TRUE with no filters", () => expect(text({})).toBe("TRUE"));

  it("filters status by normalised name", () => {
    const q = buildWhere({ statuses: ["Active", "Coming Soon"] });
    expect(q.sql).toContain("c.status IN");
    expect(q.values).toEqual(["Active", "Coming Soon"]);
  });

  it("parametrises numeric ranges", () => {
    const q = buildWhere({ priceMin: 100000, priceMax: 500000, bedsMin: 3 });
    expect(q.values).toEqual([100000, 500000, 3]);
    expect(q.sql).toContain("COALESCE(c.price, 0) >=");
    expect(q.sql).toContain("c.price <=");
    expect(q.sql).toContain("COALESCE(c.beds, 0) >=");
  });

  it("treats a missing value as failing a minimum, as the client did", () => {
    expect(text({ sqftMin: 1000 })).toContain("COALESCE(c.sqft, 0) >=");
  });

  it("pool yes/no and levels", () => {
    expect(text({ pool: true })).toContain("c.pool IS TRUE");
    expect(text({ pool: false })).toContain("c.pool IS FALSE");
    expect(text({ levels: 2 })).toContain("c.levels =");
    expect(text({ levels: "3+" })).toContain("COALESCE(c.levels, 0) >= 3");
  });

  it("keyword matches mls/address/city/zip case-insensitively with escaped wildcards", () => {
    const q = buildWhere({ keyword: "50%_off" });
    expect(q.sql).toContain("ILIKE");
    expect(q.values[0]).toBe("%50\\%\\_off%");
  });

  it("closed window only constrains Closed listings", () => {
    const q = buildWhere({ closedWithinMonths: 6 });
    expect(q.sql).toContain("c.status <> 'Closed'");
    expect(q.sql).toContain("c.closed >=");
  });

  it("joins conditions with AND", () => {
    expect(text({ zips: ["85018"], dwellingTypes: ["Condo"] })).toContain(" AND ");
  });
});
```

- [ ] **Step 2: Run** `pnpm test lib/search/build-query.test.ts` — Expected: FAIL (module missing).

- [ ] **Step 3: Implement `lib/search/build-query.ts`**

```ts
import { Prisma } from "@prisma/client";
import type { SearchFilters } from "./types";

const like = (s: string) => `%${s.replace(/[\\%_]/g, "\\$&")}%`;

export function buildWhere(f: SearchFilters): Prisma.Sql {
  const parts: Prisma.Sql[] = [];

  if (f.keyword?.trim()) {
    const k = like(f.keyword.trim());
    parts.push(Prisma.sql`(c.mls ILIKE ${k} OR c.address ILIKE ${k} OR c.city ILIKE ${k} OR c.zip ILIKE ${k})`);
  }
  if (f.statuses?.length) parts.push(Prisma.sql`c.status IN (${Prisma.join(f.statuses)})`);
  if (f.closedWithinMonths) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - f.closedWithinMonths);
    parts.push(Prisma.sql`(c.status <> 'Closed' OR c.closed >= ${cutoff})`);
  }
  if (f.priceMin != null) parts.push(Prisma.sql`COALESCE(c.price, 0) >= ${f.priceMin}`);
  if (f.priceMax != null) parts.push(Prisma.sql`(c.price IS NULL OR c.price <= ${f.priceMax})`);
  if (f.dwellingTypes?.length) parts.push(Prisma.sql`c.dwelling IN (${Prisma.join(f.dwellingTypes)})`);
  if (f.bedsMin != null) parts.push(Prisma.sql`COALESCE(c.beds, 0) >= ${f.bedsMin}`);
  if (f.bathsMin != null) parts.push(Prisma.sql`COALESCE(c.baths, 0) >= ${f.bathsMin}`);
  if (f.sqftMin != null) parts.push(Prisma.sql`COALESCE(c.sqft, 0) >= ${f.sqftMin}`);
  if (f.sqftMax != null) parts.push(Prisma.sql`(c.sqft IS NULL OR c.sqft <= ${f.sqftMax})`);
  if (f.lotMin != null) parts.push(Prisma.sql`COALESCE(c.lot, 0) >= ${f.lotMin}`);
  if (f.lotMax != null) parts.push(Prisma.sql`(c.lot IS NULL OR c.lot <= ${f.lotMax})`);
  if (f.pool === true) parts.push(Prisma.sql`c.pool IS TRUE`);
  if (f.pool === false) parts.push(Prisma.sql`c.pool IS FALSE`);
  if (f.levels === "3+") parts.push(Prisma.sql`COALESCE(c.levels, 0) >= 3`);
  else if (typeof f.levels === "number") parts.push(Prisma.sql`c.levels = ${f.levels}`);
  if (f.zips?.length) parts.push(Prisma.sql`c.zip IN (${Prisma.join(f.zips)})`);

  return parts.length ? Prisma.join(parts, " AND ") : Prisma.sql`TRUE`;
}
```
- [ ] **Step 4: Run tests** — Expected: PASS.

- [ ] **Step 5: Commit** — `git add lib/search && git commit -m "Add SQL filter builder for server-side search"`

---

### Task 3: Data loading + `runSearch`

**Files:** Create `lib/search/load.ts`, `lib/search/run-search.ts`, `lib/search/run-search.test.ts`

**Interfaces:**
- Consumes: `buildWhere`, `scoreDeals`, `normalizeStatus`, types, `isInsideShape` (`lib/filter-listings.ts` — takes `{lat,lng}`-shaped listing; see Step 1), `hasDistressLanguage` not needed (SQL flag).
- Produces: `loadCandidates(filters): Promise<ListingRecord[]>` (light rows: everything scoring/pins need; `distressSignal` from SQL), `loadRowsByIds(ids: string[]): Promise<ListingRecord[]>`, `runSearch(req: SearchRequest): Promise<SearchResponse>`, and pure `applyShape(rows, shape)`.

- [ ] **Step 1: Pure shape helper + test first**

`isInsideShape` currently takes an `MlsListing` (`lat`/`lng`). Add to `lib/filter-listings.ts` an exported `isPointInsideShape(lat: number, lng: number, shape: DrawnShape | null): boolean` containing the existing branch logic, and make `isInsideShape` call it. In `run-search.test.ts` test `applyShape`:
```ts
import { describe, expect, it } from "vitest";
import { applyShape } from "./run-search";
const r = (id: string, lat: number | null, lng: number | null) => ({ id, latitude: lat, longitude: lng }) as never;
describe("applyShape", () => {
  const rect = { type: "rectangle" as const, bounds: { north: 34, south: 33, east: -111, west: -112 } };
  it("keeps only rows inside; drops rows without coordinates when a shape is set", () => {
    const rows = [r("in", 33.5, -111.5), r("out", 35, -111.5), r("none", null, null)];
    expect(applyShape(rows, rect).map((x) => x.id)).toEqual(["in"]);
  });
  it("returns everything when no shape", () => {
    expect(applyShape([r("a", null, null)], null)).toHaveLength(1);
  });
});
```
Run → FAIL; then implement `applyShape` in `run-search.ts`; run → PASS.

- [ ] **Step 2: Implement `lib/search/load.ts`**

Move the SQL/mapping currently in `app/admin/(protected)/search/page.tsx` (`RAW_KEYS`, `liteOf`, `remarksOf`, `loadProperties`, and the `rawValue/rawNumber/rawBoolean/rawString/rawLevels` helpers plus the `properties.map(...)` body) into this file. Two exported functions:

`loadCandidates(filters)` — the same SELECT as today's `loadProperties`, wrapped so it can be filtered by `buildWhere`:
```ts
const rows = await prisma.$queryRaw<Row[]>`
  WITH c AS (
    SELECT p.id, ..., <current columns>,
      CASE WHEN lower(COALESCE(l."mlsStatus",'')) LIKE '%coming%' THEN 'Coming Soon'
           WHEN lower(COALESCE(l."mlsStatus",'')) LIKE '%active%' THEN 'Active'
           WHEN lower(COALESCE(l."mlsStatus",'')) LIKE '%pending%' OR lower(COALESCE(l."mlsStatus",'')) LIKE '%contract%' THEN 'Pending'
           WHEN lower(COALESCE(l."mlsStatus",'')) LIKE '%expire%' THEN 'Expired'
           WHEN lower(COALESCE(l."mlsStatus",'')) LIKE '%cancel%' OR lower(COALESCE(l."mlsStatus",'')) LIKE '%withdraw%' THEN 'Canceled'
           WHEN lower(COALESCE(l."mlsStatus",'')) LIKE '%closed%' OR lower(COALESCE(l."mlsStatus",'')) LIKE '%sold%' THEN 'Closed'
           ELSE COALESCE(NULLIF(l."mlsStatus",''), 'Off Market') END AS status,
      COALESCE(l."listPrice", p."estimatedValue") AS price,
      p.beds, p.baths, p.sqft, p."lotSqft" AS lot, p.zip,
      COALESCE(p."propertyType", src->>'PropertySubType', src->>'PropertyType', src->>'DwellingType', 'Single Family') AS dwelling,
      <pool CASE>, <levels expression>,
      COALESCE(l."soldDate", p."lastSaleDate") AS closed,
      COALESCE(l."mlsNumber", 'PR-' || ...) AS mls, p."streetAddress" AS address, p.city
    FROM "Property" p
    LEFT JOIN LATERAL (...latest listing...) l ON true
    LEFT JOIN LATERAL (...latest owner...) o ON true
    CROSS JOIN LATERAL (SELECT COALESCE(l."rawJson", p."rawJson") AS src) s
  )
  SELECT * FROM c WHERE ${buildWhere(filters)}`;
```
- pool: `CASE WHEN lower(COALESCE(src->>'PoolPrivateYN', src->>'PrivatePoolYN', src->>'PrivatePool', src->>'HasPool', src->>'pool')) IN ('yes','y','true','1','private') THEN TRUE WHEN ... IN ('no','n','false','0','none') THEN FALSE END`
- levels: `COALESCE(substring(COALESCE(src->>'Stories', src->>'StoriesTotal', src->>'NumberOfStories', src->>'InteriorLevels') from '^-?[0-9]+(\.[0-9]+)?')::numeric, CASE WHEN lower(src->>'Levels') LIKE '%three%' THEN 3 WHEN lower(src->>'Levels') LIKE '%two%' THEN 2 WHEN lower(src->>'Levels') LIKE '%one%' OR lower(src->>'Levels') LIKE '%single%' THEN 1 END)`
- The light query returns ONLY what scoring/pins need (`id, status, price→listPrice, sqft, zip, dwelling→dwellingType, dom, estimatedEquityPct, ownerOccupied, estimatedArv (=p."estimatedValue"), originalListPrice (SQL COALESCE of the three keys, numeric-safe via the same `substring` regex), distress, latitude, longitude, address`) mapped to `ListingRecord` with the remaining fields defaulted (`null`). Reuse `distressRegex` from today's page.

`loadRowsByIds(ids)` — today's full mapping (all fields the list/detail views show) `WHERE p.id = ANY(${ids})`, preserving the order of `ids`.

- [ ] **Step 3: Implement `run-search.ts`**

```ts
import type { DrawnShape, SearchRequest, SearchResponse, ListingRecord, Pin } from "./types";
import { PAGE_SIZE } from "./types";
import { isPointInsideShape } from "@/lib/filter-listings";
import { loadCandidates, loadRowsByIds } from "./load";
import { scoreDeals } from "./score-deals";

export function applyShape<T extends { latitude: number | null; longitude: number | null }>(rows: T[], shape: DrawnShape | null | undefined): T[] {
  if (!shape) return rows;
  return rows.filter((r) => r.latitude != null && r.longitude != null && isPointInsideShape(r.latitude, r.longitude, shape));
}

export async function runSearch(req: SearchRequest): Promise<SearchResponse> {
  const threshold = Math.min(99, Math.max(1, Math.round(req.arvThreshold)));
  const page = Math.max(0, Math.floor(req.page ?? 0));

  const candidates = applyShape(await loadCandidates(req.filters), req.shape);
  const scored = scoreDeals(candidates, threshold); // already sorted by score desc

  const pins: Pin[] = scored
    .filter((d) => d.latitude != null && d.longitude != null)
    .map((d) => ({ id: d.id, lat: d.latitude!, lng: d.longitude!, price: d.listPrice, status: d.status, target: d.priority === "Target now" }));

  const pageIds = scored.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((d) => d.id);
  const full = await loadRowsByIds(pageIds);
  const byId = new Map(scored.map((d) => [d.id, d]));
  const rows = full.map((r) => ({ ...r, ...byId.get(r.id)! }));  // full fields + score fields

  return { total: scored.length, pins, rows, targetCount: scored.filter((d) => d.priority === "Target now").length };
}
```
Note `{ ...r, ...byId.get(r.id)! }` lets the light row's score fields win but keeps the full row's display fields — ensure `scoreDeals`' spread of the light `ListingRecord` does not overwrite full fields with `null` defaults: spread order must be `{ ...byId.get(r.id)!, ...r, arv/… score fields }`. Implement by picking the score fields explicitly (`arv, arvSource, listToArvPct, rule70Price, rule70Spread, pricePerSqft, pocketPricePerSqft, ppsfDiscountPct, dealScore, priority, reasons`) from the scored row.

- [ ] **Step 4: Commit** — `pnpm test && npx tsc --noEmit -p . | grep -v '^.next'` then `git add -A lib && git commit -m "Add runSearch: SQL filter, shape match, scoring, pagination"`

---

### Task 4: API routes

**Files:** Create `app/api/admin/search/route.ts`, `app/api/admin/search/listing/route.ts`

**Interfaces:** Consumes `runSearch`, `loadRowsByIds`, `requireAdminApi`. Produces `POST /api/admin/search` (body `SearchRequest` → `SearchResponse`), `GET /api/admin/search/listing?id=` (→ `ListingRecord | 404`).

- [ ] **Step 1: `route.ts`**
```ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/session";
import { runSearch } from "@/lib/search/run-search";
import type { SearchRequest } from "@/lib/search/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: SearchRequest;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body || typeof body.filters !== "object" || typeof body.arvThreshold !== "number") {
    return NextResponse.json({ error: "filters and arvThreshold are required" }, { status: 400 });
  }
  try {
    return NextResponse.json(await runSearch(body));
  } catch (err) {
    console.error("[admin/search] failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
```
- [ ] **Step 2: `listing/route.ts`** — `GET`, admin check, `id` query param, `const [row] = await loadRowsByIds([id]); return row ? NextResponse.json(row) : NextResponse.json({ error: "Not found" }, { status: 404 });`
- [ ] **Step 3: Verify + commit** — `npx tsc --noEmit -p . | grep -v '^.next'`; `git add -A app && git commit -m "Add admin search API routes"`

---

### Task 5: Page + client rewrite

**Files:** Modify `page.tsx`, `MlsSearchWorkspace.tsx`, `GoogleMapStage.tsx` (all under `app/admin/(protected)/search/`)

**Interfaces:** Consumes `runSearch`, `SearchResponse`, `DrawnShape`. Produces workspace prop `{ initial: SearchResponse }`; map props `{ pins: Pin[]; selected: ListingRecord | null; onSelect(id: string): void; onShapeChange(shape: DrawnShape | null): void; total: number }`.

- [ ] **Step 1: `page.tsx`** — reduce to:
```tsx
export default async function SearchPage() {
  await requireAdmin();
  const initial = await runSearch({ filters: { statuses: ["Active", "Coming Soon"] }, arvThreshold: 70 });
  return <MlsSearchWorkspace initial={initial} />;
}
```
Delete everything else from the file (helpers/loader moved to `lib/search/load.ts` in Task 3). Keep `metadata` and `requireAdmin`.

- [ ] **Step 2: Workspace state → request.** Add `buildFilters()` (the inverse of the current `filtered` logic): honour `activeCriteria` exactly as `filtered` does — a criterion contributes only when active; empty strings → `undefined`; `pool` "Yes"/"No" → `true`/`false`, "Any" → `undefined`; `levels` "3+" stays, numeric strings → number; `zips` split as today; `keyword` always applies (as today). Replace `filtered/qualified/dealCandidates/targetIds` and `pocketIds` with:
```tsx
const [result, setResult] = useState<SearchResponse>(initial);
const [rows, setRows] = useState<DealCandidate[]>(initial.rows);
const [shape, setShape] = useState<DrawnShape | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
const [page, setPage] = useState(0);
const filters = buildFilters(/* state */);
const requestKey = JSON.stringify({ filters, arvThreshold, shape });
const firstRun = useRef(true);

useEffect(() => {
  if (firstRun.current) { firstRun.current = false; return; }
  const ctrl = new AbortController();
  const t = setTimeout(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filters, arvThreshold, shape, page: 0 }), signal: ctrl.signal });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `Search failed (${res.status})`);
      const data: SearchResponse = await res.json();
      setResult(data); setRows(data.rows); setPage(0);
    } catch (e) { if ((e as Error).name !== "AbortError") setError("Couldn't refresh results — retry"); }
    finally { if (!ctrl.signal.aborted) setLoading(false); }
  }, 300);
  return () => { clearTimeout(t); ctrl.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [requestKey]);
```
`loadMore()` fetches `page + 1` with the same body and appends `data.rows` to `rows`.
`targetIds = useMemo(() => new Set(result.pins.filter(p => p.target).map(p => p.id)), [result])`.
`selected`: `rows.find(id)`; if not found, fetch `/api/admin/search/listing?id=` into `selectedExtra` state when `selectedId` changes.
UI substitutions: `qualified.length` → `result.total` (both places); `{pocketIds && <span>in pocket</span>}` → `{shape && ...}`; `ResultsList listings={rows}` plus a "Load more" button when `rows.length < result.total`; `DealIntelligence candidates={rows}`; map gets `pins={result.pins}`; show `loading` as reduced opacity on the count; render `error` under the header. Remove `previewListings`, `isPreview`, the `filtered` memo, `scoreDeals` import, `updatePocket`, and the preview note (the feed is connected).

- [ ] **Step 3: Map** — in `GoogleMapStage.tsx`: props per Interfaces; delete `listingsRef`, `listingsInside`, the `validCoordinates` filter; markers effect iterates `pins.slice(0, 250)` (pins arrive score-ordered) using `pin.lat/lng/price/id/target/status` (title `money(pin.price)`); replace both `onPocketChangeRef.current(listingsInside(...))` calls with `onShapeChangeRef.current(toDrawnShape(activeShape.current))`, and `onPocketChangeRef.current(null)` with `onShapeChangeRef.current(null)`; the pocket prompt text uses the `total` prop. Add:
```ts
function toDrawnShape(shape: MapShape): DrawnShape {
  if (shape instanceof google.maps.Rectangle) {
    const b = shape.getBounds()!;
    return { type: "rectangle", bounds: { north: b.getNorthEast().lat(), east: b.getNorthEast().lng(), south: b.getSouthWest().lat(), west: b.getSouthWest().lng() } };
  }
  if (shape instanceof google.maps.Circle) {
    const c = shape.getCenter()!;
    return { type: "circle", center: { lat: c.lat(), lng: c.lng() }, radiusMeters: shape.getRadius() };
  }
  return { type: "polygon", path: shape.getPath().getArray().map((p) => ({ lat: p.lat(), lng: p.lng() })) };
}
```
The selected marker must still render if `selected` is outside the top 250: add it explicitly to the marker list.

- [ ] **Step 4: Verify locally** — `pnpm test`, `npx tsc --noEmit -p . | grep -v '^.next'`, `npx eslint app/admin/\(protected\)/search lib/search`.
- [ ] **Step 5: Commit + deploy** — `git add -A app lib && git commit -m "Deal Search: server-side filtering, scoring and pockets" && git push`; wait for the Production deployment to be Ready.
- [ ] **Step 6: Verify live (browser, logged in)** — load `/admin/search`: default counts match the previous client-side numbers for Active (≈4.3k at time of writing) within live-sync drift; toggling Pending/pool/beds updates counts within ~1 s; drawing a rectangle updates the count and the list; clicking a pin outside the top 100 shows details; `/admin/search` HTML payload is well under 1 MB. If anything is wrong: `git revert` the Task 5 commit and push.

---

### Task 6: Full-MLS sync scope

**Files:** Modify `lib/integrations/reso.ts`, `app/api/cron/reso-sync/route.ts`, `app/admin/(protected)/settings/ResoSyncPanel.tsx` (copy only)

**Interfaces:** `ResoScopeOpts.zips/cities` become optional *restrictions* (undefined = no area filter).

- [ ] **Step 1:** In `buildFilter`, replace the unconditional area filter with:
```ts
const zips = opts.zips, cities = opts.cities;
const areaParts: string[] = [];
if (zips?.length) areaParts.push(`PostalCode in (${zips.map((z) => `'${z}'`).join(",")})`);
if (cities?.length) areaParts.push(`City in (${cities.map((c) => `'${c.replace(/'/g, "''")}'`).join(",")})`);
const areaFilter = areaParts.length ? `(${areaParts.join(" or ")})` : null;
```
and join with `and` only when `areaFilter` exists (both the `modifiedSince` branch and the status branch; if both empty, the modifiedSince filter is just `ModificationTimestamp gt X`). Delete `DEFAULT_SERVICE_AREA_*` exports if nothing else imports them (`grep -rn DEFAULT_SERVICE_AREA app lib`). Raise `MAX_PAGES` to 1000 (200,000 listings).
- [ ] **Step 2:** Bootstrap statuses in the cron route become `["Active", "Active Under Contract", "Pending", "Coming Soon"]`? — **No:** keep the three verified values; incremental (`modifiedSince`, no status filter) picks up Coming Soon and every status change afterwards. Update the route comment to say the bootstrap is statewide.
- [ ] **Step 3:** Panel copy: "Pulls Active, Under Contract, Pending, and Closed listings for the default service area…" → "…for all of ARMLS…". The manual Closed month-by-month backfill now covers the whole MLS (large); add one sentence saying so.
- [ ] **Step 4: Reset the watermark so the wider bootstrap runs** — the existing "completed" incremental watermark would only fetch *changes*. Force a fresh bootstrap once: mark the current watermark stale by adding a `scopeVersion: 2` field to `control.meta` in the cron route, and in the route treat a `completed` run whose `rawMeta.scopeVersion !== 2` as "no watermark" (falls to the bootstrap branch). Comment why.
- [ ] **Step 5: Verify** — `npx tsc`, `pnpm test`, commit, push, wait for Ready, then trigger `gh workflow run reso-sync.yml` repeatedly (or wait for the 10-min schedule) until the Connections panel shows the sync caught up; check Search totals rise toward the MLS-reported count (25,907 Active + Coming Soon in the screenshot). Watch per-page timings in Vercel logs (`[reso/sync reso-incremental] page N`) — write time should stay ≈2–3 s/page.
- [ ] **Step 6: Storage check** — after the first full bootstrap, ask the user to confirm the Neon storage size/plan (each listing stores ≈10 KB `rawJson` ×2 tables). If nearing the limit, propose trimming `rawJson` to the keys the app reads as a follow-up; do not do it unprompted.

---

## Self-Review

- **Spec coverage:** endpoint + request/response (Tasks 3–4); build-query with status mapping (Task 2, corrected in Task 1); score module (Task 1); run-search + shape (Task 3); initial page render, debounced abortable client, pins-not-rows map, DrawnShape emission, listing fetch, error message (Task 5); vitest (Task 1); default-count verification + rollback (Task 5 Step 6). Widening the sync (Task 6) is the user's added requirement.
- **Placeholder scan:** Task 3 Step 2 and Task 5 Step 2 point at existing code to move/invert rather than reprinting ~200 lines; each names the exact source and the exact rules.
- **Type consistency:** `SearchResponse.rows` is `DealCandidate[]` throughout; `Pin` fields (`lat`,`lng`,`price`,`status`,`target`) match Task 3's producer and Task 5's consumer; `DrawnShape` comes from `lib/filter-listings.ts` everywhere; `PAGE_SIZE = 100` defined once in `types.ts`.
