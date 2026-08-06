# Admin Nav Restructure — Design Spec

Date: 2026-08-06
Status: Approved, pending write-up as implementation plan
Scope: `highlander-rei` admin app (`/admin/*`) only

## Context

The admin app currently has a horizontal top nav with three tabs:

- **Acquisitions** — has two internal sub-tabs, "Buyer Search" and "Acquisition Machine" (selected via `?tab=` query param)
- **Agreements**
- **Templates**

Additional pages exist but are only reachable through the profile-avatar dropdown menu (`AdminProfileMenu.tsx`), not the main nav:

- **Contacts** (`/admin/contacts`) — buyer/seller contact records
- **Leads** (`/admin/leads`) — inbound leads from the public sites
- **Change Password** (`/admin/password`)

Mobile has its own bottom tab bar (`AdminMobileNav.tsx`) mirroring the three top-nav items, plus a floating "+" button that links to `/admin/agreements/new`.

This is a pure information-architecture restructure. It does not build any new feature logic — it moves existing pages into a new shell and creates placeholder destinations for sections that don't have working pages yet. Those sections' actual functionality (detailed below under "Deferred") get their own design sessions later, one at a time.

## Goal

Replace the horizontal top nav with a persistent left sidebar containing six items: **Search, Offers, CRM, Dialer, Agreements, Settings**.

## Sidebar items and routing

Sidebar order (top to bottom), per the order specified during design:

| # | Sidebar item | Route | Content in this pass |
|---|---|---|---|
| 1 | Search | `/admin/search` | Current "Buyer Search" sub-tab content, moved as-is from `/admin/acquisitions` |
| 2 | CRM | `/admin/crm` | New placeholder page — no existing content moves here |
| 3 | Dialer | `/admin/dialer` | New placeholder page — explicitly paused, see Deferred |
| 4 | Offers | `/admin/offers` | Current "Acquisition Machine" sub-tab content, moved as-is from `/admin/acquisitions` |
| 5 | Agreements | `/admin/agreements` | Existing Agreements content, plus Templates merged in as a second sub-tab (same sub-tab pattern Acquisitions currently uses for Buyer Search / Acquisition Machine) |
| 6 | Settings | `/admin/settings` | Password sub-tab (moved from `/admin/password`, functionality unchanged). API Connections and Billing sub-tabs are placeholders — no existing systems back them yet |

The `Acquisitions` top-level tab is fully absorbed (Buyer Search → Search, Acquisition Machine → Offers) and ceases to exist as its own nav item.

### Redirects

Old URLs must keep working (this is a daily-use internal tool, avoid dead links):

- `/admin/acquisitions` (no `tab` param, or `tab=searches`) → `/admin/search`
- `/admin/acquisitions?tab=machine` → `/admin/offers`
- `/admin/templates` → `/admin/agreements?tab=templates`
- `/admin/password` → `/admin/settings?tab=password`

## Layout mechanics

- **Desktop**: keep the existing top header (brand wordmark + `AdminProfileMenu`) unchanged. Remove the horizontal nav `<Link>` list currently rendered in `app/admin/(protected)/layout.tsx`. Add a persistent left sidebar below/beside the header containing the six items above, reusing the existing icon set style (stroke-based SVGs, `#8a8a84` inactive / `#111110` active, matching current nav link styling).
- **Mobile**: replace `AdminMobileNav`'s 3-item bottom tab bar with a hamburger-triggered slide-out drawer listing the same six items. Remove the floating "+" quick-add button — it only ever made sense as an Agreements-specific action, and doesn't generalize across six sections. Each section's own page is responsible for surfacing its own "create new" action if it needs one (Agreements already does this internally).
- **Profile dropdown** (`AdminProfileMenu.tsx`): remove the "Change Password" link (moves to Settings). Keep "Signed in as Admin", "Contacts", "Leads", "Sign Out".

## Section details for this pass

### Search (`/admin/search`)
Migrate current Buyer Search content unchanged.

**Deferred** (own future design session): model the page visually after MLS/Monsoon-style listing search — property list/detail views modeled closely on the reference screenshot reviewed 2026-08-06 (Monsoon: property info, home highlights, area highlights, listing agent block, listing history). Google Maps integration with drawing/area-selection controls equivalent to MLS map tools. List price and price-per-sqft surfaced per property. An automated ARV estimator with a percent-of-ARV calculator.

### Offers (`/admin/offers`)
Migrate current Acquisition Machine content unchanged (property import/scoring, listing status tracking — canceled/expired/active/pending — feeding from Apify/MLS).

**Deferred** (own future design session): full offer lifecycle on top of this data — track offers submitted, e-signature capture, and a Gmail integration that sends a pre-built offer email directly to the listing agent (deal numbers, embedded signature). Also: an integration surfaced within Offers that jumps to Monsoon, lets the user copy an MLS #, and autofills the property details on the offer from it. Monsoon has no publicly known API (see Reference section below) — the technical approach (browser-side paste/parse vs. direct ARMLS/RESO Web API lookup) is an open question for that session, not resolved here.

### CRM (`/admin/crm`)
New placeholder page. No existing content moves here — **Contacts and Leads stay in the profile dropdown, unchanged.** They're buyer/seller contact records and inbound site leads, not on-market prospecting, so they don't fit the CRM definition below.

**Deferred** (own future design session): an on-market prospecting and follow-up view — deals being hunted, and deals with offers out that need follow-up. Per explicit decision, this is "the same list, two views" with Offers: one shared deal/offer dataset, with Offers presenting the document/signing/sending mechanics and CRM presenting the prospecting/relationship-follow-up lens on the same records. No hard ownership split between the two tabs.

### Dialer (`/admin/dialer`)
Placeholder only ("coming soon" or equivalent). Explicitly paused — the dialer (ColdCallDogs.io) is a separate app/repo, currently only reverse-proxied at `/coldcalldogs` outside this app's nav. A merger of that app into this admin shell is planned but not scheduled; do not build Dialer functionality until that's revisited.

### Agreements (`/admin/agreements`)
Two sub-tabs: **Agreements** (existing content, default) and **Templates** (existing `/admin/templates` content, moved in unchanged). Same sub-tab UI pattern as Acquisitions currently uses. No functional changes to either underlying feature.

### Settings (`/admin/settings`)
Three sub-tabs:
- **Password** — migrated from `/admin/password`, functionality unchanged.
- **API Connections** — placeholder. No existing system to migrate; scope (which integrations get managed here — GHL, Apify, MLS/Monsoon, etc.) is undefined and deferred.
- **Billing** — placeholder. No existing billing system exists in this app; scope deferred.

## Reference: Monsoon

Monsoon is a property-records portal tied to ARMLS (Arizona Regional MLS) data, reviewed via screenshot 2026-08-06. For a given MLS #, it surfaces: property details (beds/baths/sqft/lot size/year built/parking/pool), area highlights (subdivision, builder, school districts), full cross-MLS# listing history (status/dates/prices), and a Listing Agent block (name, license #, phone, brokerage). No public API is known to exist for it. This is the data source the future "copy MLS # → autofill offer" and "email the listing agent" features are expected to draw from; how to access it programmatically (vs. manual copy/paste) is unresolved and belongs to the Offers design session.

## Out of scope / explicitly deferred to future design sessions

1. **Search** — MLS/Monsoon-style UI, Google Maps draw tools, ARV estimator + % calculator, per-property detail panel.
2. **Offers** — full offer lifecycle: submission tracking, e-signature, Gmail-to-agent send, Monsoon MLS# autofill integration.
3. **CRM** — deal-hunting/follow-up pipeline UI and its shared data model with Offers.
4. **Dialer** — ColdCallDogs.io merger.
5. **Settings** — API Connections and Billing content.

Each of the above gets its own brainstorming → spec → plan cycle when picked up.

## Rollout / verification

Internal admin tool, no feature flag needed. Before considering this done, manually verify:

- All six sidebar links resolve and highlight correctly as active
- Old bookmarked URLs (`/admin/acquisitions`, `/admin/acquisitions?tab=machine`, `/admin/templates`, `/admin/password`) redirect to their new homes
- Agreements/Templates sub-tabs and Settings sub-tabs render and switch correctly
- Mobile drawer opens/closes and lists all six items; floating "+" button is gone
- Profile dropdown no longer shows "Change Password"; still shows Contacts, Leads, Sign Out
