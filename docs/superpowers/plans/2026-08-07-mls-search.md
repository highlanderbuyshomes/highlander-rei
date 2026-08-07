# MLS-Style Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/admin/search` into a two-panel MLS-style quick search: a left panel with a Buyer Searches list and a checkbox-reveal filter panel, and a right panel with a Google Map (drawing tools to attach a boundary shape to the selected Buyer Search) or a results list — per `docs/superpowers/specs/2026-08-07-mls-search-design.md`.

**Architecture:** Server Component `page.tsx` fetches `AcquisitionArea` rows (the existing "Buyer Search" model) and hands them to a client orchestrator (`SearchWorkspace`) that owns selection/filter/view state. Listings are static mock fixture data (`lib/mock-listings.ts`) filtered entirely client-side by pure functions (`lib/filter-listings.ts`), so swapping in a real MLS API later only touches the data source, not the UI. The map uses the Google Maps JavaScript API's Drawing Library, loaded via a small script-injector (matching the pattern already used on the public site), not a new npm map-wrapper dependency.

**Tech Stack:** Next.js 16 (App Router), React 19 Server + Client Components, Prisma 7 + Neon Postgres, TypeScript, Google Maps JavaScript API (Drawing Library) loaded via `<script>` tag, inline-style React (no Tailwind/CSS modules), pnpm.

## Global Constraints

- Package manager is **pnpm** — never use `npm`/`yarn`.
- **No automated test framework is configured** in this repo. Verification uses `npx tsc --noEmit`, `pnpm lint`, `pnpm build`, and manual browser checks against the dev server.
- Every admin page and server action calls `await requireAdmin()` from `@/lib/session` before doing anything else.
- Component styling is inline `style={{}}` objects — no Tailwind, no CSS modules. Reuse the exact color palette used elsewhere in this app: `#111110` (near-black), `#8a8a84` (muted gray), `#5a5a54` (secondary text), `#e8e7e2` / `#d0cfc8` (borders), `#f5f4f0` / `#f8f7f4` (backgrounds), `#ffffff` (cards). Headings use `fontFamily: "var(--font-display), serif"`.
- Server actions live in a sibling `actions.ts` file with `"use server"` at the top, following the existing per-route convention.
- **Deviation from the spec, disclosed here**: the spec suggested `@react-google-maps/api` as the map library. This plan instead extends the codebase's existing hand-rolled Google Maps script-loading pattern (see `app/(public)/page.tsx`'s `loadPlaces` function) using the raw `google.maps.drawing.DrawingManager` API directly. This avoids adding a new runtime dependency in a codebase that currently has zero map-wrapper libraries, and the Drawing Library's four overlay types (rectangle/circle/polygon/marker) are simple enough to drive directly. Only `@types/google.maps` (a type-only devDependency, zero runtime cost) is added.
- **The Google Maps API key already exists** as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local` (confirmed present, already used by the public site's address-autocomplete). No new env var setup needed.
- The `AcquisitionArea` Prisma model already has a `polygon Json?` field (added in an earlier migration, currently unused by any code) — this plan reuses it for the drawn shape's geometry instead of adding a new field. Only `mapColor String?` is genuinely new.
- Migrations in this repo are hand-written SQL files under `prisma/migrations/<date>_<name>/migration.sql` (no `migration_lock.toml` — not run through `prisma migrate dev`). Apply schema changes with `npx prisma db push`, then `npx prisma generate`.
- Dev server: start one with `pnpm dev` before manual verification steps; Turbopack hot-reloads on save.

---

## Task 1: Add `mapColor` to AcquisitionArea and apply the schema change

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260807_acquisition_area_map_color/migration.sql`

**Interfaces:**
- Produces: `AcquisitionArea.mapColor: string | null` and `AcquisitionArea.polygon: JsonValue | null` (already existed) — both consumed by every later task in this plan.

- [ ] **Step 1: Add the field to the schema**

In `prisma/schema.prisma`, inside the `AcquisitionArea` model, add `mapColor` directly after the existing `polygon` line:

```prisma
model AcquisitionArea {
  id           String   @id @default(cuid())
  name         String
  slug         String   @unique
  description  String?
  buyerContact String?
  polygon      Json?
  mapColor     String?
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  buyBoxes     BuyBox[]
}
```

- [ ] **Step 2: Write the migration file (for history/documentation — this repo doesn't use Prisma's migration engine)**

Create `prisma/migrations/20260807_acquisition_area_map_color/migration.sql`:

```sql
-- Add map pin color to AcquisitionArea (Buyer Search) for the search-map UI
ALTER TABLE "AcquisitionArea" ADD COLUMN IF NOT EXISTS "mapColor" TEXT;
```

- [ ] **Step 3: Apply the schema change to the database**

Run: `npx prisma db push`
Expected: reports the new column was added (or already in sync if run twice), no errors.

- [ ] **Step 4: Regenerate the Prisma client**

Run: `npx prisma generate`
Expected: "Generated Prisma Client" success message.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260807_acquisition_area_map_color
git commit -m "Add mapColor field to AcquisitionArea for search-map UI"
```

---

## Task 2: Mock listing data

**Files:**
- Create: `lib/mock-listings.ts`

**Interfaces:**
- Produces: `MlsListing` type, `MlsListingStatus` type, `MOCK_LISTINGS: MlsListing[]` — consumed by Task 3 (filters) and Task 10 (SearchWorkspace).

- [ ] **Step 1: Create the mock data file**

Create `lib/mock-listings.ts`:

```tsx
export type MlsListingStatus = "Active" | "Coming Soon" | "Pending" | "Closed" | "Expired" | "Canceled";

export type MlsListing = {
  mlsNumber: string;
  streetAddress: string;
  city: string;
  zip: string;
  lat: number;
  lng: number;
  listPrice: number;
  beds: number;
  baths: number;
  sqft: number;
  lotSizeSqft: number;
  yearBuilt: number;
  propertyType: string;
  status: MlsListingStatus;
  listingAgentName: string;
  listingAgentPhone: string;
  photoUrl: string;
  daysOnMarket: number;
};

type Neighborhood = { city: string; zip: string; lat: number; lng: number };

const NEIGHBORHOODS: Neighborhood[] = [
  { city: "Phoenix", zip: "85018", lat: 33.5031, lng: -111.9853 },
  { city: "Phoenix", zip: "85008", lat: 33.4676, lng: -111.9903 },
  { city: "Scottsdale", zip: "85251", lat: 33.4942, lng: -111.9261 },
  { city: "Paradise Valley", zip: "85253", lat: 33.5312, lng: -111.9410 },
  { city: "Phoenix", zip: "85254", lat: 33.6142, lng: -112.0198 },
  { city: "Phoenix", zip: "85016", lat: 33.5122, lng: -112.0326 },
  { city: "Scottsdale", zip: "85255", lat: 33.6890, lng: -111.8873 },
  { city: "Scottsdale", zip: "85258", lat: 33.5631, lng: -111.9109 },
  { city: "Scottsdale", zip: "85255", lat: 33.6540, lng: -111.8990 },
];

const PROPERTY_TYPES = ["Single Family", "Condo", "Townhouse"];
const STATUSES: MlsListingStatus[] = ["Active", "Coming Soon", "Pending", "Closed", "Expired", "Canceled"];
const STREET_NAMES = ["E Camelback Rd", "N 44th St", "E Indian School Rd", "N Scottsdale Rd", "E Cactus Rd", "N 68th St", "E Thomas Rd", "N Hayden Rd", "E McDonald Dr", "N 56th St"];
const AGENTS = [
  { name: "Lynda Rahi", phone: "(623) 221-3402" },
  { name: "Marcus Ellery", phone: "(480) 555-0142" },
  { name: "Priya Nathan", phone: "(602) 555-0198" },
  { name: "Todd Weisz", phone: "(480) 555-0107" },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function buildListings(): MlsListing[] {
  const rand = seededRandom(42);
  const listings: MlsListing[] = [];
  let mlsCounter = 6400000;

  NEIGHBORHOODS.forEach((hood, hoodIndex) => {
    for (let i = 0; i < 4; i++) {
      const jitterLat = (rand() - 0.5) * 0.016;
      const jitterLng = (rand() - 0.5) * 0.016;
      const beds = 2 + Math.floor(rand() * 4);
      const baths = 1 + Math.floor(rand() * 3);
      const sqft = 1100 + Math.floor(rand() * 3200);
      const pricePerSqft = 260 + Math.floor(rand() * 220);
      listings.push({
        mlsNumber: String(mlsCounter++),
        streetAddress: `${1000 + Math.floor(rand() * 8000)} ${STREET_NAMES[(hoodIndex + i) % STREET_NAMES.length]}`,
        city: hood.city,
        zip: hood.zip,
        lat: hood.lat + jitterLat,
        lng: hood.lng + jitterLng,
        listPrice: sqft * pricePerSqft,
        beds,
        baths,
        sqft,
        lotSizeSqft: 4500 + Math.floor(rand() * 8000),
        yearBuilt: 1962 + Math.floor(rand() * 60),
        propertyType: PROPERTY_TYPES[Math.floor(rand() * PROPERTY_TYPES.length)],
        status: STATUSES[Math.floor(rand() * STATUSES.length)],
        listingAgentName: AGENTS[Math.floor(rand() * AGENTS.length)].name,
        listingAgentPhone: AGENTS[Math.floor(rand() * AGENTS.length)].phone,
        photoUrl: `https://placehold.co/400x300/e8e7e2/8a8a84?text=${encodeURIComponent(hood.zip)}`,
        daysOnMarket: Math.floor(rand() * 120),
      });
    }
  });

  return listings;
}

export const MOCK_LISTINGS: MlsListing[] = buildListings();
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/mock-listings.ts
git commit -m "Add mock MLS listing fixture data shaped like a future API response"
```

---

## Task 3: Filter and geometry logic

**Files:**
- Create: `lib/filter-listings.ts`

**Interfaces:**
- Consumes: `MlsListing`, `MlsListingStatus` from `lib/mock-listings.ts` (Task 2).
- Produces: `DrawnShape` type, `ListingFilters` type, `filterListings(listings, filters, shape): MlsListing[]` — consumed by Task 5 (`saveAreaShape`'s parameter type), Task 8 (`SearchMap`), Task 10 (`SearchWorkspace`).

- [ ] **Step 1: Create the filter/geometry module**

Create `lib/filter-listings.ts`:

```tsx
import type { MlsListing, MlsListingStatus } from "./mock-listings";

export type DrawnShape =
  | { type: "rectangle"; bounds: { north: number; south: number; east: number; west: number } }
  | { type: "circle"; center: { lat: number; lng: number }; radiusMeters: number }
  | { type: "polygon"; path: { lat: number; lng: number }[] }
  | { type: "marker"; position: { lat: number; lng: number }; radiusMeters: number };

export type ListingFilters = {
  statuses?: MlsListingStatus[];
  priceMin?: number;
  priceMax?: number;
  bedsMin?: number;
  bathsMin?: number;
  propertyTypes?: string[];
  location?: string;
  sqftMin?: number;
  sqftMax?: number;
  lotSizeMin?: number;
  yearBuiltMin?: number;
  daysOnMarketMax?: number;
};

export function matchesFilters(listing: MlsListing, filters: ListingFilters): boolean {
  if (filters.statuses && filters.statuses.length > 0 && !filters.statuses.includes(listing.status)) return false;
  if (filters.priceMin != null && listing.listPrice < filters.priceMin) return false;
  if (filters.priceMax != null && listing.listPrice > filters.priceMax) return false;
  if (filters.bedsMin != null && listing.beds < filters.bedsMin) return false;
  if (filters.bathsMin != null && listing.baths < filters.bathsMin) return false;
  if (filters.propertyTypes && filters.propertyTypes.length > 0 && !filters.propertyTypes.includes(listing.propertyType)) return false;
  if (filters.location) {
    const needle = filters.location.trim().toLowerCase();
    if (needle && !listing.city.toLowerCase().includes(needle) && !listing.zip.includes(needle)) return false;
  }
  if (filters.sqftMin != null && listing.sqft < filters.sqftMin) return false;
  if (filters.sqftMax != null && listing.sqft > filters.sqftMax) return false;
  if (filters.lotSizeMin != null && listing.lotSizeSqft < filters.lotSizeMin) return false;
  if (filters.yearBuiltMin != null && listing.yearBuilt < filters.yearBuiltMin) return false;
  if (filters.daysOnMarketMax != null && listing.daysOnMarket > filters.daysOnMarketMax) return false;
  return true;
}

function pointInRectangle(lat: number, lng: number, bounds: { north: number; south: number; east: number; west: number }): boolean {
  return lat <= bounds.north && lat >= bounds.south && lng <= bounds.east && lng >= bounds.west;
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function pointInCircle(lat: number, lng: number, center: { lat: number; lng: number }, radiusMeters: number): boolean {
  return haversineMeters(lat, lng, center.lat, center.lng) <= radiusMeters;
}

function pointInPolygon(lat: number, lng: number, path: { lat: number; lng: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = path.length - 1; i < path.length; j = i++) {
    const xi = path[i].lng, yi = path[i].lat;
    const xj = path[j].lng, yj = path[j].lat;
    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isInsideShape(listing: MlsListing, shape: DrawnShape | null): boolean {
  if (!shape) return true;
  if (shape.type === "rectangle") return pointInRectangle(listing.lat, listing.lng, shape.bounds);
  if (shape.type === "circle") return pointInCircle(listing.lat, listing.lng, shape.center, shape.radiusMeters);
  if (shape.type === "marker") return pointInCircle(listing.lat, listing.lng, shape.position, shape.radiusMeters);
  return pointInPolygon(listing.lat, listing.lng, shape.path);
}

export function filterListings(listings: MlsListing[], filters: ListingFilters, shape: DrawnShape | null): MlsListing[] {
  return listings.filter((l) => matchesFilters(l, filters) && isInsideShape(l, shape));
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/filter-listings.ts
git commit -m "Add pure filter and point-in-shape geometry functions for listing search"
```

---

## Task 4: Google Maps Drawing Library loader

**Files:**
- Create: `app/admin/(protected)/search/load-google-maps.ts`
- Modify: `package.json` (devDependency)

**Interfaces:**
- Produces: `loadGoogleMapsDrawing(): Promise<void>` — consumed by Task 8 (`SearchMap`).

- [ ] **Step 1: Add the types-only devDependency**

```bash
pnpm add -D @types/google.maps
```

- [ ] **Step 2: Create the loader**

Create `app/admin/(protected)/search/load-google-maps.ts`:

```tsx
const GMAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

let loadPromise: Promise<void> | null = null;

export function loadGoogleMapsDrawing(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("loadGoogleMapsDrawing called on the server"));
  if (window.google?.maps?.drawing) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (!GMAPS_KEY) {
      reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set"));
      return;
    }
    const existing = document.getElementById("gmaps-drawing-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps")));
      return;
    }
    const script = document.createElement("script");
    script.id = "gmaps-drawing-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&libraries=drawing`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return loadPromise;
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (`window.google` should resolve via the newly installed `@types/google.maps` global types — if you see an error about `google` being undefined, confirm `@types/google.maps` landed in `node_modules` and re-run.)

- [ ] **Step 4: Commit**

```bash
git add "app/admin/(protected)/search/load-google-maps.ts" package.json pnpm-lock.yaml
git commit -m "Add Google Maps Drawing Library script loader for the search map"
```

---

## Task 5: Update search actions — color assignment + shape persistence

**Files:**
- Modify: `app/admin/(protected)/search/actions.ts`

**Interfaces:**
- Consumes: `DrawnShape` from `lib/filter-listings.ts` (Task 3).
- Produces: `saveAreaShape(id: string, shape: DrawnShape): Promise<void>` — consumed by Task 10 (`SearchWorkspace`). `createArea` now also sets `mapColor` on every new `AcquisitionArea`.

- [ ] **Step 1: Replace the file**

Replace the full contents of `app/admin/(protected)/search/actions.ts`:

```tsx
"use server";

import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { DrawnShape } from "@/lib/filter-listings";

function revalidate() {
  revalidatePath("/admin/search");
}

const AREA_COLOR_PALETTE = ["#1a56db", "#3a7a50", "#b45309", "#8f2c21", "#6b46c1", "#0f766e", "#be185d", "#a16207"];

export async function createArea(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const slug = `${base}-${Date.now().toString(36)}`;

  const existingCount = await prisma.acquisitionArea.count();
  const mapColor = AREA_COLOR_PALETTE[existingCount % AREA_COLOR_PALETTE.length];

  await prisma.acquisitionArea.create({
    data: {
      name,
      slug,
      buyerContact: String(formData.get("buyerContact") ?? "") || null,
      description: String(formData.get("description") ?? "") || null,
      mapColor,
    },
  });

  revalidate();
}

export async function toggleArea(id: string) {
  await requireAdmin();
  const area = await prisma.acquisitionArea.findUnique({ where: { id } });
  if (!area) return;
  await prisma.acquisitionArea.update({ where: { id }, data: { active: !area.active } });
  revalidate();
}

export async function deleteArea(id: string) {
  await requireAdmin();
  await prisma.buyBox.updateMany({ where: { areaId: id }, data: { areaId: null } });
  await prisma.acquisitionArea.delete({ where: { id } });
  revalidate();
}

export async function saveAreaShape(id: string, shape: DrawnShape) {
  await requireAdmin();
  await prisma.acquisitionArea.update({
    where: { id },
    data: { polygon: shape },
  });
  revalidate();
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. If TypeScript complains that `shape` doesn't satisfy Prisma's `Json` input type, change the `data` line to `data: { polygon: shape as unknown as Prisma.InputJsonValue }` and add `import type { Prisma } from "@prisma/client";` at the top — but try without the cast first, since the existing `zips: string[]` Json field elsewhere in this codebase (`app/admin/(protected)/offers/actions.ts`) is assigned without one.

- [ ] **Step 3: Commit**

```bash
git add "app/admin/(protected)/search/actions.ts"
git commit -m "Assign map colors to new Buyer Searches, add saveAreaShape action"
```

---

## Task 6: Buyer Searches panel component

**Files:**
- Create: `app/admin/(protected)/search/BuyerSearchesPanel.tsx`

**Interfaces:**
- Consumes: `createArea`, `toggleArea`, `deleteArea` from `./actions` (Task 5).
- Produces: `BuyerSearchesPanel` default export, props `{ searches: SearchArea[]; selectedId: string | null; onSelect: (id: string) => void }` — consumed by Task 10 (`SearchWorkspace`). Also exports the `SearchArea` type for reuse.

- [ ] **Step 1: Create the component**

Create `app/admin/(protected)/search/BuyerSearchesPanel.tsx`:

```tsx
"use client";

import { useState } from "react";
import { createArea, toggleArea, deleteArea } from "./actions";

export type SearchArea = {
  id: string;
  name: string;
  buyerContact: string | null;
  description: string | null;
  active: boolean;
  mapColor: string | null;
  polygon: unknown;
};

function ActiveDot({ id, active, action }: { id: string; active: boolean; action: (id: string) => Promise<void> }) {
  const bound = action.bind(null, id);
  return (
    <form action={bound} onClick={(e) => e.stopPropagation()} style={{ display: "inline" }}>
      <button type="submit" title={active ? "Active" : "Inactive"} style={{ width: "8px", height: "8px", borderRadius: "50%", border: "none", cursor: "pointer", background: active ? "#3a7a50" : "#d0cfc8", padding: 0 }} />
    </form>
  );
}

function DeleteX({ id, action }: { id: string; action: (id: string) => Promise<void> }) {
  const bound = action.bind(null, id);
  return (
    <form action={bound} onClick={(e) => e.stopPropagation()} style={{ display: "inline" }}>
      <button type="submit" title="Delete" style={{ fontSize: "13px", color: "#c0392b", background: "transparent", border: "none", cursor: "pointer", padding: "0 2px", fontFamily: "inherit" }}>×</button>
    </form>
  );
}

export default function BuyerSearchesPanel({
  searches,
  selectedId,
  onSelect,
}: {
  searches: SearchArea[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "12px", padding: "14px", marginBottom: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#111110" }}>Buyer Searches</span>
        <button type="button" onClick={() => setShowForm((v) => !v)} style={{ fontSize: "11px", fontWeight: 600, color: "#1a56db", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          {showForm ? "Cancel" : "+ New"}
        </button>
      </div>

      {showForm && (
        <form action={createArea} style={{ marginBottom: "12px", padding: "10px", background: "#f8f7f4", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <input name="name" required placeholder="Search name" style={{ padding: "7px 9px", fontSize: "12px", border: "1px solid #d0cfc8", borderRadius: "6px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          <input name="buyerContact" placeholder="Buyer contact (optional)" style={{ padding: "7px 9px", fontSize: "12px", border: "1px solid #d0cfc8", borderRadius: "6px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          <textarea name="description" rows={2} placeholder="Description (optional)" style={{ padding: "7px 9px", fontSize: "12px", border: "1px solid #d0cfc8", borderRadius: "6px", fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          <button type="submit" style={{ padding: "7px", background: "#111110", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Create</button>
        </form>
      )}

      {searches.length === 0 ? (
        <div style={{ fontSize: "12px", color: "#8a8a84", padding: "8px 0" }}>No buyer searches yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {searches.map((s) => {
            const active = s.id === selectedId;
            return (
              <div
                key={s.id}
                onClick={() => onSelect(s.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "8px", cursor: "pointer",
                  background: active ? "#f5f4f0" : "transparent", border: active ? "1px solid #d0cfc8" : "1px solid transparent",
                }}
              >
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: s.mapColor ?? "#8a8a84", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#111110", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                  {s.buyerContact && <div style={{ fontSize: "10.5px", color: "#8a8a84" }}>{s.buyerContact}</div>}
                </div>
                <ActiveDot id={s.id} active={s.active} action={toggleArea} />
                <DeleteX id={s.id} action={deleteArea} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/admin/(protected)/search/BuyerSearchesPanel.tsx"
git commit -m "Add Buyer Searches panel component"
```

---

## Task 7: Filters panel component

**Files:**
- Create: `app/admin/(protected)/search/FiltersPanel.tsx`

**Interfaces:**
- Consumes: `ListingFilters` from `lib/filter-listings.ts` (Task 3), `MlsListingStatus` from `lib/mock-listings.ts` (Task 2).
- Produces: `FiltersPanel` default export, props `{ resultCount: number; onChange: (filters: ListingFilters) => void }` — consumed by Task 10 (`SearchWorkspace`).

- [ ] **Step 1: Create the component**

Create `app/admin/(protected)/search/FiltersPanel.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import type { ListingFilters } from "@/lib/filter-listings";
import type { MlsListingStatus } from "@/lib/mock-listings";

type FieldKey = "status" | "price" | "propertyType" | "bedsBaths" | "location" | "sqft" | "lotSize" | "yearBuilt" | "daysOnMarket";

const DEFAULT_FIELDS: FieldKey[] = ["status", "price", "propertyType", "bedsBaths", "location"];
const EXTRA_FIELDS: { key: FieldKey; label: string }[] = [
  { key: "sqft", label: "Sqft" },
  { key: "lotSize", label: "Lot Size" },
  { key: "yearBuilt", label: "Year Built" },
  { key: "daysOnMarket", label: "Days on Market" },
];
const FIELD_LABELS: Record<FieldKey, string> = {
  status: "Status", price: "List Price", propertyType: "Property Type", bedsBaths: "Beds & Baths",
  location: "Location", sqft: "Sqft", lotSize: "Lot Size", yearBuilt: "Year Built", daysOnMarket: "Days on Market",
};
const STATUS_OPTIONS: MlsListingStatus[] = ["Active", "Coming Soon", "Pending", "Closed", "Expired", "Canceled"];
const PROPERTY_TYPE_OPTIONS = ["Single Family", "Condo", "Townhouse"];

const inputStyle: React.CSSProperties = { padding: "6px 8px", fontSize: "12px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", color: "#111110", fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" };

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: "4px 10px", fontSize: "11px", fontWeight: 500, borderRadius: "20px", cursor: "pointer", fontFamily: "inherit",
    background: active ? "#111110" : "#f5f4f0", color: active ? "#ffffff" : "#5a5a54", border: active ? "1px solid #111110" : "1px solid #e8e7e2",
  };
}

export default function FiltersPanel({ resultCount, onChange }: { resultCount: number; onChange: (filters: ListingFilters) => void }) {
  const [activeFields, setActiveFields] = useState<Set<FieldKey>>(new Set(["status"]));
  const [statuses, setStatuses] = useState<MlsListingStatus[]>(["Active", "Coming Soon"]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [bedsMin, setBedsMin] = useState("");
  const [bathsMin, setBathsMin] = useState("");
  const [location, setLocation] = useState("");
  const [sqftMin, setSqftMin] = useState("");
  const [sqftMax, setSqftMax] = useState("");
  const [lotSizeMin, setLotSizeMin] = useState("");
  const [yearBuiltMin, setYearBuiltMin] = useState("");
  const [daysOnMarketMax, setDaysOnMarketMax] = useState("");
  const [showAddField, setShowAddField] = useState(false);

  useEffect(() => {
    const filters: ListingFilters = {};
    if (activeFields.has("status") && statuses.length > 0) filters.statuses = statuses;
    if (activeFields.has("price")) {
      if (priceMin) filters.priceMin = Number(priceMin);
      if (priceMax) filters.priceMax = Number(priceMax);
    }
    if (activeFields.has("propertyType") && propertyTypes.length > 0) filters.propertyTypes = propertyTypes;
    if (activeFields.has("bedsBaths")) {
      if (bedsMin) filters.bedsMin = Number(bedsMin);
      if (bathsMin) filters.bathsMin = Number(bathsMin);
    }
    if (activeFields.has("location") && location) filters.location = location;
    if (activeFields.has("sqft")) {
      if (sqftMin) filters.sqftMin = Number(sqftMin);
      if (sqftMax) filters.sqftMax = Number(sqftMax);
    }
    if (activeFields.has("lotSize") && lotSizeMin) filters.lotSizeMin = Number(lotSizeMin);
    if (activeFields.has("yearBuilt") && yearBuiltMin) filters.yearBuiltMin = Number(yearBuiltMin);
    if (activeFields.has("daysOnMarket") && daysOnMarketMax) filters.daysOnMarketMax = Number(daysOnMarketMax);
    onChange(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFields, statuses, priceMin, priceMax, propertyTypes, bedsMin, bathsMin, location, sqftMin, sqftMax, lotSizeMin, yearBuiltMin, daysOnMarketMax]);

  function toggleField(key: FieldKey) {
    setActiveFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function toggleChip(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function resetAll() {
    setActiveFields(new Set(["status"]));
    setStatuses(["Active", "Coming Soon"]);
    setPriceMin(""); setPriceMax("");
    setPropertyTypes([]);
    setBedsMin(""); setBathsMin("");
    setLocation("");
    setSqftMin(""); setSqftMax("");
    setLotSizeMin(""); setYearBuiltMin(""); setDaysOnMarketMax("");
  }

  const shownFields: FieldKey[] = [...DEFAULT_FIELDS, ...EXTRA_FIELDS.map((f) => f.key).filter((k) => activeFields.has(k))];

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "12px", padding: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#111110" }}>Filters</span>
        <span style={{ fontSize: "11px", color: "#8a8a84" }}>{resultCount} results</span>
      </div>

      {shownFields.map((key) => {
        const active = activeFields.has(key);
        return (
          <div key={key} style={{ borderBottom: "1px solid #f0efeb", padding: "8px 0" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", fontWeight: 600, color: "#111110", cursor: "pointer" }}>
              <input type="checkbox" checked={active} onChange={() => toggleField(key)} />
              {FIELD_LABELS[key]}
            </label>
            {active && key === "status" && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                {STATUS_OPTIONS.map((s) => (
                  <button key={s} type="button" style={chipStyle(statuses.includes(s))} onClick={() => toggleChip(statuses, (v) => setStatuses(v as MlsListingStatus[]), s)}>{s}</button>
                ))}
              </div>
            )}
            {active && key === "price" && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                <input style={inputStyle} placeholder="Min" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} inputMode="numeric" />
                <span style={{ fontSize: "11px", color: "#8a8a84" }}>to</span>
                <input style={inputStyle} placeholder="Max" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} inputMode="numeric" />
              </div>
            )}
            {active && key === "propertyType" && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                {PROPERTY_TYPE_OPTIONS.map((t) => (
                  <button key={t} type="button" style={chipStyle(propertyTypes.includes(t))} onClick={() => toggleChip(propertyTypes, setPropertyTypes, t)}>{t}</button>
                ))}
              </div>
            )}
            {active && key === "bedsBaths" && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                <input style={inputStyle} placeholder="Min beds" value={bedsMin} onChange={(e) => setBedsMin(e.target.value)} inputMode="numeric" />
                <input style={inputStyle} placeholder="Min baths" value={bathsMin} onChange={(e) => setBathsMin(e.target.value)} inputMode="numeric" />
              </div>
            )}
            {active && key === "location" && (
              <input style={{ ...inputStyle, marginTop: "8px" }} placeholder="City or ZIP" value={location} onChange={(e) => setLocation(e.target.value)} />
            )}
            {active && key === "sqft" && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                <input style={inputStyle} placeholder="Min" value={sqftMin} onChange={(e) => setSqftMin(e.target.value)} inputMode="numeric" />
                <span style={{ fontSize: "11px", color: "#8a8a84" }}>to</span>
                <input style={inputStyle} placeholder="Max" value={sqftMax} onChange={(e) => setSqftMax(e.target.value)} inputMode="numeric" />
              </div>
            )}
            {active && key === "lotSize" && (
              <input style={{ ...inputStyle, marginTop: "8px" }} placeholder="Min lot sqft" value={lotSizeMin} onChange={(e) => setLotSizeMin(e.target.value)} inputMode="numeric" />
            )}
            {active && key === "yearBuilt" && (
              <input style={{ ...inputStyle, marginTop: "8px" }} placeholder="Min year" value={yearBuiltMin} onChange={(e) => setYearBuiltMin(e.target.value)} inputMode="numeric" />
            )}
            {active && key === "daysOnMarket" && (
              <input style={{ ...inputStyle, marginTop: "8px" }} placeholder="Max days" value={daysOnMarketMax} onChange={(e) => setDaysOnMarketMax(e.target.value)} inputMode="numeric" />
            )}
          </div>
        );
      })}

      <div style={{ display: "flex", gap: "8px", marginTop: "12px", position: "relative" }}>
        <button type="button" onClick={() => setShowAddField((v) => !v)} style={{ flex: 1, padding: "8px", background: "#111110", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Add a Field</button>
        <button type="button" onClick={resetAll} style={{ flex: 1, padding: "8px", background: "#ffffff", color: "#111110", border: "1px solid #d0cfc8", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Reset Filters</button>
        {showAddField && (
          <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 10, padding: "6px" }}>
            {EXTRA_FIELDS.filter((f) => !activeFields.has(f.key)).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => { toggleField(f.key); setShowAddField(false); }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 10px", fontSize: "12.5px", color: "#111110", background: "transparent", border: "none", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" }}
              >
                {f.label}
              </button>
            ))}
            {EXTRA_FIELDS.every((f) => activeFields.has(f.key)) && (
              <div style={{ padding: "8px 10px", fontSize: "12px", color: "#8a8a84" }}>All fields added</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/admin/(protected)/search/FiltersPanel.tsx"
git commit -m "Add quick-search filters panel with checkbox-reveal fields"
```

---

## Task 8: Search map component (Google Maps + drawing tools)

**Files:**
- Create: `app/admin/(protected)/search/SearchMap.tsx`

**Interfaces:**
- Consumes: `loadGoogleMapsDrawing` from `./load-google-maps` (Task 4), `DrawnShape` from `lib/filter-listings.ts` (Task 3), `MlsListing` from `lib/mock-listings.ts` (Task 2), `SearchArea` from `./BuyerSearchesPanel` (Task 6).
- Produces: `SearchMap` default export, props `{ searches: SearchArea[]; selectedSearchId: string | null; listings: MlsListing[]; drawColor: string; onShapeComplete: (searchId: string, shape: DrawnShape) => void }` — consumed by Task 10 (`SearchWorkspace`).

- [ ] **Step 1: Create the component**

Create `app/admin/(protected)/search/SearchMap.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMapsDrawing } from "./load-google-maps";
import type { DrawnShape } from "@/lib/filter-listings";
import type { MlsListing } from "@/lib/mock-listings";
import type { SearchArea } from "./BuyerSearchesPanel";

type MapOverlay = google.maps.Rectangle | google.maps.Circle | google.maps.Polygon | google.maps.Marker;

const STATUS_COLORS: Record<string, string> = {
  Active: "#3a7a50",
  "Coming Soon": "#1a56db",
  Pending: "#b45309",
  Closed: "#8a8a84",
  Expired: "#c0392b",
  Canceled: "#8a8a84",
};

const DEFAULT_CENTER = { lat: 33.5722, lng: -111.9575 };

export default function SearchMap({
  searches,
  selectedSearchId,
  listings,
  drawColor,
  onShapeComplete,
}: {
  searches: SearchArea[];
  selectedSearchId: string | null;
  listings: MlsListing[];
  drawColor: string;
  onShapeComplete: (searchId: string, shape: DrawnShape) => void;
}) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const areaOverlaysRef = useRef<Map<string, MapOverlay>>(new Map());
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMapsDrawing()
      .then(() => {
        if (cancelled || !mapDivRef.current) return;
        mapRef.current = new google.maps.Map(mapDivRef.current, {
          center: DEFAULT_CENTER,
          zoom: 10,
          mapTypeControl: true,
          streetViewControl: false,
        });
        drawingManagerRef.current = new google.maps.drawing.DrawingManager({
          drawingMode: null,
          drawingControl: false,
          rectangleOptions: { editable: true },
          circleOptions: { editable: true },
          polygonOptions: { editable: true },
        });
        drawingManagerRef.current.setMap(mapRef.current);
        setReady(true);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : String(err)));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const dm = drawingManagerRef.current;
    if (!dm || !ready) return;
    const listener = google.maps.event.addListener(dm, "overlaycomplete", (e: google.maps.drawing.OverlayCompleteEvent) => {
      if (!selectedSearchId) { e.overlay?.setMap(null); return; }
      let shape: DrawnShape | null = null;
      if (e.type === google.maps.drawing.OverlayType.RECTANGLE) {
        const b = (e.overlay as google.maps.Rectangle).getBounds();
        if (b) shape = { type: "rectangle", bounds: { north: b.getNorthEast().lat(), east: b.getNorthEast().lng(), south: b.getSouthWest().lat(), west: b.getSouthWest().lng() } };
      } else if (e.type === google.maps.drawing.OverlayType.CIRCLE) {
        const c = e.overlay as google.maps.Circle;
        const center = c.getCenter();
        if (center) shape = { type: "circle", center: { lat: center.lat(), lng: center.lng() }, radiusMeters: c.getRadius() };
      } else if (e.type === google.maps.drawing.OverlayType.POLYGON) {
        const p = e.overlay as google.maps.Polygon;
        const path = p.getPath().getArray().map((pt) => ({ lat: pt.lat(), lng: pt.lng() }));
        shape = { type: "polygon", path };
      } else if (e.type === google.maps.drawing.OverlayType.MARKER) {
        const pos = (e.overlay as google.maps.Marker).getPosition();
        if (pos) shape = { type: "marker", position: { lat: pos.lat(), lng: pos.lng() }, radiusMeters: 1609 };
      }
      e.overlay?.setMap(null);
      dm.setDrawingMode(null);
      if (shape) onShapeComplete(selectedSearchId, shape);
    });
    return () => { google.maps.event.removeListener(listener); };
  }, [ready, selectedSearchId, onShapeComplete]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    areaOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
    areaOverlaysRef.current.clear();

    searches.forEach((s) => {
      const shape = s.polygon as DrawnShape | null;
      if (!shape) return;
      const color = s.mapColor ?? "#1a56db";
      const fillOpacity = s.id === selectedSearchId ? 0.25 : 0.12;
      let overlay: MapOverlay | null = null;
      if (shape.type === "rectangle") {
        overlay = new google.maps.Rectangle({ map: mapRef.current!, bounds: shape.bounds, strokeColor: color, strokeWeight: 2, fillColor: color, fillOpacity });
      } else if (shape.type === "circle") {
        overlay = new google.maps.Circle({ map: mapRef.current!, center: shape.center, radius: shape.radiusMeters, strokeColor: color, strokeWeight: 2, fillColor: color, fillOpacity });
      } else if (shape.type === "polygon") {
        overlay = new google.maps.Polygon({ map: mapRef.current!, paths: shape.path, strokeColor: color, strokeWeight: 2, fillColor: color, fillOpacity });
      } else if (shape.type === "marker") {
        overlay = new google.maps.Marker({
          map: mapRef.current!,
          position: shape.position,
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: color, fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 2 },
        });
      }
      if (overlay) areaOverlaysRef.current.set(s.id, overlay);
    });
  }, [ready, searches, selectedSearchId]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = listings.map((l) => new google.maps.Marker({
      position: { lat: l.lat, lng: l.lng },
      map: mapRef.current!,
      title: `${l.streetAddress} — $${l.listPrice.toLocaleString()}`,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 6,
        fillColor: STATUS_COLORS[l.status] ?? "#8a8a84",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 1,
      },
    }));
  }, [ready, listings]);

  function startDrawing(mode: "rectangle" | "circle" | "polygon" | "marker") {
    const dm = drawingManagerRef.current;
    if (!dm) return;
    const modeMap: Record<string, google.maps.drawing.OverlayType> = {
      rectangle: google.maps.drawing.OverlayType.RECTANGLE,
      circle: google.maps.drawing.OverlayType.CIRCLE,
      polygon: google.maps.drawing.OverlayType.POLYGON,
      marker: google.maps.drawing.OverlayType.MARKER,
    };
    dm.setDrawingMode(modeMap[mode]);
  }

  return (
    <div style={{ position: "relative", height: "100%", minHeight: "520px" }}>
      <div ref={mapDivRef} style={{ width: "100%", height: "100%", borderRadius: "12px", overflow: "hidden" }} />
      {loadError && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f4f0", borderRadius: "12px" }}>
          <div style={{ fontSize: "13px", color: "#c0392b", textAlign: "center", padding: "24px" }}>Couldn&apos;t load Google Maps: {loadError}</div>
        </div>
      )}
      {ready && (
        <div style={{ position: "absolute", top: "12px", right: "12px", display: "flex", flexDirection: "column", gap: "6px", background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "10px", padding: "6px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
          {(["rectangle", "circle", "polygon", "marker"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              disabled={!selectedSearchId}
              onClick={() => startDrawing(mode)}
              title={selectedSearchId ? `Draw ${mode}` : "Select a Buyer Search first"}
              style={{
                width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: "8px", border: "1px solid #d0cfc8", background: selectedSearchId ? "#ffffff" : "#f5f4f0",
                cursor: selectedSearchId ? "pointer" : "not-allowed", opacity: selectedSearchId ? 1 : 0.5, fontFamily: "inherit", fontSize: "15px",
              }}
            >
              {mode === "rectangle" && "▭"}
              {mode === "circle" && "◯"}
              {mode === "polygon" && "⬠"}
              {mode === "marker" && "📍"}
            </button>
          ))}
          <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: drawColor, border: "2px solid #ffffff", boxShadow: "0 0 0 1px #d0cfc8", margin: "4px auto 0" }} title="Drawing color (matches selected search)" />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/admin/(protected)/search/SearchMap.tsx"
git commit -m "Add Google Maps view with drawing tools for Buyer Search boundaries"
```

---

## Task 9: Listings table component (List view)

**Files:**
- Create: `app/admin/(protected)/search/ListingsTable.tsx`

**Interfaces:**
- Consumes: `MlsListing` from `lib/mock-listings.ts` (Task 2).
- Produces: `ListingsTable` default export, props `{ listings: MlsListing[] }` — consumed by Task 10 (`SearchWorkspace`).

- [ ] **Step 1: Create the component**

Create `app/admin/(protected)/search/ListingsTable.tsx`:

```tsx
import type { MlsListing } from "@/lib/mock-listings";

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  Active: { bg: "#eaf6f0", color: "#3a7a50", border: "#b8dfc8" },
  "Coming Soon": { bg: "rgba(26,86,219,0.08)", color: "#1a56db", border: "rgba(26,86,219,0.25)" },
  Pending: { bg: "#fff7e6", color: "#946200", border: "#ead18a" },
  Closed: { bg: "#f0efeb", color: "#8a8a84", border: "#d0cfc8" },
  Expired: { bg: "rgba(192,57,43,0.06)", color: "#c0392b", border: "rgba(192,57,43,0.2)" },
  Canceled: { bg: "rgba(192,57,43,0.06)", color: "#c0392b", border: "rgba(192,57,43,0.2)" },
};

function fmtPrice(n: number): string { return "$" + n.toLocaleString("en-US"); }
function fmt(n: number): string { return n.toLocaleString("en-US"); }

export default function ListingsTable({ listings }: { listings: MlsListing[] }) {
  if (listings.length === 0) {
    return (
      <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "48px 40px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display), serif", fontSize: "18px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>NO MATCHES</div>
        <div style={{ fontSize: "13px", color: "#8a8a84" }}>Try widening your filters or drawing a larger search area.</div>
      </div>
    );
  }

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 0.9fr 0.8fr 0.5fr 0.5fr 0.6fr 0.8fr 0.6fr", padding: "10px 20px", background: "#f5f4f0", borderBottom: "1px solid #e8e7e2" }}>
        {["Address", "City / ZIP", "Price", "Beds", "Baths", "Sqft", "Status", "DOM"].map((h) => (
          <div key={h} style={{ fontSize: "9.5px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>{h}</div>
        ))}
      </div>
      {listings.map((l, i) => {
        const s = STATUS_STYLES[l.status] ?? STATUS_STYLES.Closed;
        return (
          <div key={l.mlsNumber} style={{ display: "grid", gridTemplateColumns: "1.8fr 0.9fr 0.8fr 0.5fr 0.5fr 0.6fr 0.8fr 0.6fr", padding: "13px 20px", borderBottom: i < listings.length - 1 ? "1px solid #f0efeb" : "none", alignItems: "center" }}>
            <div style={{ fontSize: "13px", color: "#111110", fontWeight: 500 }}>{l.streetAddress}</div>
            <div style={{ fontSize: "12px", color: "#5a5a54" }}>{l.city}, {l.zip}</div>
            <div style={{ fontSize: "12px", color: "#5a5a54" }}>{fmtPrice(l.listPrice)}</div>
            <div style={{ fontSize: "12px", color: "#5a5a54" }}>{l.beds}</div>
            <div style={{ fontSize: "12px", color: "#5a5a54" }}>{l.baths}</div>
            <div style={{ fontSize: "12px", color: "#5a5a54" }}>{fmt(l.sqft)}</div>
            <div>
              <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "10.5px", fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{l.status}</span>
            </div>
            <div style={{ fontSize: "12px", color: "#5a5a54" }}>{l.daysOnMarket}</div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/admin/(protected)/search/ListingsTable.tsx"
git commit -m "Add listings results table for Search List view"
```

---

## Task 10: SearchWorkspace orchestrator + rewritten page.tsx

**Files:**
- Create: `app/admin/(protected)/search/SearchWorkspace.tsx`
- Modify: `app/admin/(protected)/search/page.tsx`

**Interfaces:**
- Consumes: `BuyerSearchesPanel`/`SearchArea` (Task 6), `FiltersPanel` (Task 7), `SearchMap` (Task 8), `ListingsTable` (Task 9), `saveAreaShape` (Task 5), `MOCK_LISTINGS` (Task 2), `filterListings`/`ListingFilters`/`DrawnShape` (Task 3).
- Produces: `SearchWorkspace` default export, props `{ searches: SearchArea[] }`.

- [ ] **Step 1: Create the orchestrator**

Create `app/admin/(protected)/search/SearchWorkspace.tsx`:

```tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import BuyerSearchesPanel, { type SearchArea } from "./BuyerSearchesPanel";
import FiltersPanel from "./FiltersPanel";
import SearchMap from "./SearchMap";
import ListingsTable from "./ListingsTable";
import { saveAreaShape } from "./actions";
import { MOCK_LISTINGS } from "@/lib/mock-listings";
import { filterListings, type ListingFilters, type DrawnShape } from "@/lib/filter-listings";

export default function SearchWorkspace({ searches }: { searches: SearchArea[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(searches[0]?.id ?? null);
  const [view, setView] = useState<"map" | "list">("map");
  const [filters, setFilters] = useState<ListingFilters>({});

  const selectedSearch = searches.find((s) => s.id === selectedId) ?? null;
  const selectedShape = (selectedSearch?.polygon as DrawnShape | null) ?? null;

  const filteredListings = useMemo(
    () => filterListings(MOCK_LISTINGS, filters, selectedShape),
    [filters, selectedShape],
  );

  const handleShapeComplete = useCallback((searchId: string, shape: DrawnShape) => {
    void saveAreaShape(searchId, shape);
  }, []);

  return (
    <div style={{ display: "flex", gap: "16px", padding: "24px", height: "calc(100vh - 56px)", boxSizing: "border-box" }}>
      <div style={{ width: "300px", flexShrink: 0, overflowY: "auto" }}>
        <BuyerSearchesPanel searches={searches} selectedId={selectedId} onSelect={setSelectedId} />
        <FiltersPanel resultCount={filteredListings.length} onChange={setFilters} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ display: "flex", gap: "2px", marginBottom: "12px" }}>
          {(["map", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              style={{
                padding: "8px 20px", fontSize: "12.5px", fontWeight: view === v ? 600 : 400,
                color: view === v ? "#ffffff" : "#5a5a54", background: view === v ? "#111110" : "#f5f4f0",
                border: "none", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize",
              }}
            >
              {v}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, minHeight: 0 }}>
          {view === "map" ? (
            <SearchMap
              searches={searches}
              selectedSearchId={selectedId}
              listings={filteredListings}
              drawColor={selectedSearch?.mapColor ?? "#1a56db"}
              onShapeComplete={handleShapeComplete}
            />
          ) : (
            <div style={{ height: "100%", overflowY: "auto" }}>
              <ListingsTable listings={filteredListings} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace page.tsx**

Replace the full contents of `app/admin/(protected)/search/page.tsx`:

```tsx
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import SearchWorkspace from "./SearchWorkspace";

export const metadata: Metadata = { title: "Search | Highlander REI" };

export default async function SearchPage() {
  await requireAdmin();

  const searches = await prisma.acquisitionArea.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <SearchWorkspace searches={searches} />;
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/admin/(protected)/search/SearchWorkspace.tsx" "app/admin/(protected)/search/page.tsx"
git commit -m "Wire up the two-panel MLS-style Search workspace"
```

---

## Task 11: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Full type check, lint, build**

```bash
npx tsc --noEmit
pnpm lint
pnpm build
```

Expected: `tsc` clean; `lint` shows only the pre-existing, already-accepted `Date.now()` warning in `offers/page.tsx` (see the nav-restructure plan's Global Constraints) plus any pre-existing warnings — nothing new; `build` succeeds and lists `/admin/search` as a route.

- [ ] **Step 2: Manual browser checklist**

Start the dev server (`pnpm dev`) if not already running, log into `/admin/login`, and open `/admin/search`:

- [ ] The page loads with a left panel (Buyer Searches + Filters) and a right panel defaulting to Map view.
- [ ] Creating a new Buyer Search via "+ New" assigns it a colored dot (visibly different from existing searches' colors).
- [ ] Selecting a Buyer Search highlights it in the list and enables the drawing toolbar buttons on the map (they're disabled/grayed out with no search selected).
- [ ] Drawing a rectangle (or circle/polygon) on the map with a search selected: the temporary drawn overlay disappears and is replaced by a persistent colored shape in that search's color.
- [ ] Reloading the page: the drawn shape is still there (confirms `polygon` persisted to the database).
- [ ] Switching to a different Buyer Search re-centers/highlights appropriately and the drawing tools remain usable for the newly selected search.
- [ ] Checking a filter (e.g. Price) reveals its inline min/max inputs; entering values narrows the result count shown in the Filters panel header.
- [ ] Switching to List view shows the same filtered set of listings in a table; switching back to Map view keeps the filters applied (pins update accordingly).
- [ ] "Add a Field" reveals Sqft/Lot Size/Year Built/Days on Market as addable; adding one shows its input; "Reset Filters" clears everything back to the Active/Coming Soon default.
- [ ] If a Buyer Search with a drawn shape is selected, the List view only shows listings whose location falls inside that shape (fewer rows than with no search selected, assuming the drawn area doesn't cover all mock listings).

- [ ] **Step 3: Final commit (only if Step 2 turned up fixes)**

If everything in Step 2 passed with no code changes, there's nothing to commit here. If you had to fix anything, commit it with a message describing the specific fix.
