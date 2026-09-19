# Server-side Deal Search filtering

Date: 2026-09-19 · Status: draft for review

## Problem

`/admin/search` loads every listing into the browser (up to 6,000 live + 1,000
other rows, ~4 MB) and filters, scores and pocket-matches them client-side in
`MlsSearchWorkspace.tsx`. Live inventory from the ARMLS live sync is growing
past that cap (5,223 at last count), so listings are silently dropped and the
page slows as data grows. Closed history is capped at 1,000 rows.

## Goal

The browser receives only what it displays. Filtering, deal scoring and
drawn-shape ("pocket") matching run on the server; nothing is capped by
"how much fits in the page".

Non-goals: changing the UI, the filter panel, the map drawing tools, or the
scoring rules/weights; marker clustering; saved searches.

## Design

### Endpoint

`POST /api/admin/search` — admin session required (`requireAdminApi`).

Request:

```ts
type SearchRequest = {
  filters: {
    keyword?: string;               // MLS #, address, city, zip substring
    statuses?: string[];            // normalised: Active, Coming Soon, Pending, Closed, Expired, Canceled
    closedWithinMonths?: number;
    priceMin?: number; priceMax?: number;
    dwellingTypes?: string[];
    bedsMin?: number; bathsMin?: number;
    sqftMin?: number; sqftMax?: number;
    lotMin?: number; lotMax?: number;
    pool?: boolean;                 // omitted = any
    levels?: number | "3+";
    zips?: string[];
  };
  arvThreshold: number;             // 1..99
  shape?: DrawnShape | null;        // existing type from lib/filter-listings.ts
  page?: number;                    // list page, 0-based, PAGE_SIZE = 100
};
```

Response:

```ts
type SearchResponse = {
  total: number;                    // matches after shape filter
  pins: Pin[];                      // ALL matches, score-ordered, compact
  rows: ListingRecord[];            // one page of full rows, score-ordered
  targetCount: number;              // "Target now" priority count
};
type Pin = { id: string; lat: number; lng: number; price: number | null; status: string; target: boolean };
```

`ListingRecord` keeps its current shape (plus deal fields the list already
shows via `DealCandidate`), so list/detail rendering is unchanged.

### Server modules

- `lib/search/build-query.ts` — pure: `SearchRequest["filters"]` → SQL
  `WHERE` fragments. Normalised statuses map to raw `mlsStatus` values the
  same way `normalizeStatus` does today (Pending = "Pending" or any status
  containing "contract"; Canceled = "Canceled"/"Withdrawn"; Coming Soon;
  Expired; Closed; Active = contains "active" but not "contract"). Column filters (status, price, beds, baths, sqft, lot,
  zip, dwelling type, keyword, closed window) are plain SQL. Pool and
  interior levels read the MLS JSON (`rawJson`) with the same key lists the
  page uses today (`PoolPrivateYN`, `PrivatePoolYN`, …; `Stories`,
  `StoriesTotal`, …).
- `lib/search/score-deals.ts` — pure: the existing `scoreDeals` /
  `normalizeStatus` / `median`, moved verbatim from the workspace. Same
  weights and priority thresholds; pocket $/sqft medians are computed over the
  server-filtered set, exactly as now.
- `lib/search/run-search.ts` — orchestrates: SQL filter → (if `shape`) filter
  candidates with the existing `isInsideShape` → score → sort → slice.
  Shared by the endpoint and by the initial page render.
- `app/admin/(protected)/search/page.tsx` — calls `runSearch` with the default
  filters (Active + Coming Soon, 70%) and passes the result as the workspace's
  initial state, so first paint needs no client fetch.

The SQL keeps the current approach of extracting only needed JSON keys in
Postgres rather than loading `rawJson`.

### Client

- `MlsSearchWorkspace` keeps its filter state. On any change (300 ms debounce)
  it POSTs to the endpoint, aborting any in-flight request; counts show a
  loading state until the response lands. Its `filtered/qualified/
  dealCandidates` memo chain is replaced by the response.
- `GoogleMapStage` renders `pins` instead of `listings`. It still draws up to
  250 markers (existing performance limit) but now takes the **top 250 by
  score** from all matches rather than the first 250 rows. On shape
  create/change/clear it converts the Google shape to a `DrawnShape` and calls
  `onShapeChange(shape)` instead of computing `pocketIds` locally.
- Selecting a pin or row not in the current page fetches that listing via
  `GET /api/admin/search/listing?id=…`. The existing `targetProperty` server
  action is unchanged.
- Preview data (`previewListings`) is used only when the database has no
  listings at all, as today.

### Error handling

- Endpoint failure: workspace keeps the previous results, shows an inline
  "Couldn't refresh results — retry" message.
- Invalid request body: 400 with the offending field; numeric inputs are
  clamped (`arvThreshold` 1..99, `page` ≥ 0).
- Listings without coordinates: excluded from `pins` but still in `rows`.

### Testing

The repo has no test runner. Add `vitest` (dev dependency only) and cover the
pure modules: `build-query` (each filter → expected fragment/params),
`score-deals` (golden cases mirroring today's behaviour, threshold edges,
missing data), and shape filtering. The SQL itself and the endpoint cannot be
exercised against the production DB from a dev machine, so they are verified
on the live deploy: default-filter counts must equal the current client-side
counts (Active/Pending/Under Contract), and load time is measured. Rollback is
reverting the change.

## Decisions to confirm

1. Add `vitest` as a dev dependency (only new dependency).
2. List page size 100 with "load more"; marker cap stays 250 (top-scored).
3. Pool/levels filter through JSON in SQL rather than new indexed columns —
   revisit only if it proves slow.
