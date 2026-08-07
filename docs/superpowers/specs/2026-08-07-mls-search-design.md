# Search (MLS-style quick search + map) — Design Spec

Date: 2026-08-07
Status: Approved, pending write-up as implementation plan
Scope: `highlander-rei` admin app, `/admin/search` route only

## Context

The 2026-08-06 admin nav restructure spec deferred Search's real functionality to its own future session, listing: "MLS/Monsoon-style UI, Google Maps draw tools, ARV estimator + % calculator, per-property detail panel." This spec covers part of that: the quick-search filter panel, a results display, and map drawing tools to demarcate buyer-search hunting areas. The ARV estimator, per-property detail panel, and live MLS API integration remain deferred further (see "Explicitly out of scope" below).

MLS API access for Highlander is expected soon but is not live yet. Per explicit decision, this round builds the full UI against mock data shaped like a real API response, so wiring in the live API later is a data-source swap, not a redesign.

To ground the UI structure, the user's live ARMLS Flexmls "Quick Search" page was reviewed on 2026-08-07 (with the user logged in, session observed live — not copied wholesale). Two things carry over structurally, not literally:
1. **Filter panel pattern**: a checkbox list of fields (Status, List Price, Dwelling Type, Dwelling Styles, City/Town Code) where checking a box reveals an inline control (e.g. min/max range) directly below it, plus "Add a Field" to reveal more fields and "Reset Filters."
2. **Map drawing toolbar**: pan/hand tool, rectangle, circle, polygon, marker/pin, and a color picker, docked to the map's right edge.

Per explicit user direction: copy the *structure and interaction pattern* of these two pieces, not ARMLS's specific field set or branding.

## Current state

`/admin/search` (built in the 2026-08-06 nav restructure) currently shows a "New Buyer Search" form (name, buyer contact, description) and a flat list of existing `AcquisitionArea` records with active/inactive toggle and delete. This becomes the "Buyer Searches" section of the new left panel — not the whole page.

## Goal

Replace `/admin/search`'s single-list UI with a two-panel layout: a left panel (Buyer Searches list + quick-search filters) and a right panel (interactive map with drawing tools, or a results list).

## Decisions already made (don't re-litigate)

- **Drawn map areas attach to existing Buyer Searches** (not a standalone concept). Drawing a shape on the map sets that Buyer Search's boundary and color.
- **Mock data now, real API later.** Listings are fixture data shaped like a plausible MLS API response. Filters, map, and list views all consume the same `MlsListing` type so swapping the data source later doesn't touch the UI/filter code.
- **Google Maps**, using a key the user already has (to be added as an env var during implementation — never pasted in chat). Library: `@react-google-maps/api`, which ships a `DrawingManager` matching the rectangle/circle/polygon/marker toolbar directly, minimizing custom map-drawing code.
- **Out of scope for this round**: ARV estimator, per-property detail page, real MLS API wiring. See closing section.

## Data model changes

Add two fields to the `AcquisitionArea` Prisma model (this is the "Buyer Search" model — real, persisted data, not mock):

- `mapAreaGeoJson Json?` — the drawn shape's geometry. Shape data varies by type: rectangle (bounds: north/south/east/west), circle (center lat/lng + radius), polygon (array of lat/lng vertices). Store as `{ type: "rectangle" | "circle" | "polygon", ...shapeFields }`.
- `mapColor String?` — hex color (e.g. `"#1a56db"`), assigned from a fixed palette when the search is created, editable later.

Requires a Prisma migration.

## Mock listing data

New file `lib/mock-listings.ts` exporting:
- A `MlsListing` TypeScript type
- A fixture array of ~40 sample properties

Fields (shaped like a plausible future MLS/RESO API response):

| Field | Type |
|---|---|
| mlsNumber | string |
| streetAddress, city, zip | string |
| lat, lng | number |
| listPrice | number |
| beds, baths | number |
| sqft, lotSizeSqft | number |
| yearBuilt | number |
| propertyType | string ("Single Family", "Condo", "Townhouse") |
| status | "Active" \| "Coming Soon" \| "Pending" \| "Closed" \| "Expired" \| "Canceled" |
| listingAgentName, listingAgentPhone | string |
| photoUrl | string (placeholder image URL) |
| daysOnMarket | number |

Sample coordinates should cluster around the same Phoenix-metro neighborhoods already used as location presets elsewhere in this app (`app/admin/(protected)/offers/ImportRunner.tsx`'s `PRESETS` list: Arcadia, Scottsdale, Paradise Valley, Cactus Corridor, Biltmore, Old Town, N Scottsdale, McCormick, DC Ranch, PV) so the mock listings plot plausibly relative to drawn buyer-search areas.

## Left panel

### Buyer Searches section

- Lists existing `AcquisitionArea` rows as colored pills/rows (color = `mapColor`, default gray if unset)
- Clicking a row selects it: highlights it, and if it has a drawn shape, fits/centers the map to that shape
- "+ New Search" opens the existing create form (name, buyer contact, description) inline or in a small popover; on creation, auto-assign the next unused color from a fixed palette
- Existing active/inactive toggle and delete actions move into this list's row actions

### Filters section

- Checkbox list: Status, List Price, Property Type, Beds & Baths, Location (ZIP/City)
- Checking a box reveals an inline control directly below it: min/max number inputs for Price/Beds/Baths, multi-select chips for Status/Property Type, a text input for Location
- "Add a Field" reveals additional less-common fields not shown by default: Sqft, Lot Size, Year Built, Days on Market
- "Reset Filters" clears all active filters
- Unchecking a field's box removes it from the active filter set and clears its value
- Filtering runs entirely client-side against the mock listings array, via a pure function in `lib/filter-listings.ts`
- A live result count updates at the top of the panel as filters change — no page reload, client component

## Right panel

### View toggle

Two tabs: **Map** (default) and **List**. Switching tabs preserves active filters and the selected Buyer Search.

### Map view

- Google Map via `@react-google-maps/api`, centered on the Phoenix metro area by default
- Renders every Buyer Search's saved shape (where `mapAreaGeoJson` is set) in its `mapColor`, with a subtle fill
- Renders filtered mock listings as pins, colored by status (e.g. green = Active, gray = Closed)
- A `DrawingManager` toolbar (rectangle, circle, polygon, marker only — omitting Flexmls's ruler/info tools, not needed here) is active when a Buyer Search is selected in the left panel; completing a shape saves it via a server action to that Buyer Search's `mapAreaGeoJson` and `mapColor`
- A color swatch near the toolbar sets the color for the shape about to be drawn, defaulting to the selected search's assigned color

### List view

- Results table styled consistently with the existing Offers properties table (`app/admin/(protected)/offers/page.tsx`'s table treatment): Address, City/ZIP, Price, Beds, Baths, Sqft, Status, Days on Market
- Shows only listings passing the active filters, and — if the selected Buyer Search has a drawn shape — only listings whose lat/lng fall inside that shape (point-in-rectangle / point-in-circle / point-in-polygon check, pure function alongside the filter logic)

## Explicitly out of scope for this round (deferred further)

1. **ARV estimator + percent-of-ARV calculator**
2. **Per-property detail page/panel** — clicking a listing does nothing beyond maybe a simple inline tooltip; no dedicated detail route yet
3. **Real MLS API integration** — listings stay mocked until API access arrives; when it does, only `lib/mock-listings.ts`'s data-fetching should need to change, since filters/map/list all consume the same `MlsListing` type

Each gets its own brainstorming → spec → plan cycle when picked up.

## Rollout / verification

No automated test framework in this repo (consistent with the rest of the codebase); verify via `npx tsc --noEmit`, `pnpm build`, and manual browser checks:

- Creating a new Buyer Search assigns it a color
- Drawing a shape on the map persists after a page reload
- Filters narrow both the map pins and the list view identically
- Switching Map/List preserves active filters and the selected search
- Selecting a different Buyer Search re-centers the map and re-scopes the List view to that search's drawn shape (if any)

**Dependency**: requires a Google Maps JavaScript API key as an env var (the user already has one — add it to `.env.local` and Vercel project env before implementation testing; never paste the key in chat).
