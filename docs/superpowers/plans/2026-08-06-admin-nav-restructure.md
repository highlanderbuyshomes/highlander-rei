# Admin Nav Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the admin app's 3-item top nav (Acquisitions, Agreements, Templates) with a persistent 6-item left sidebar (Search, CRM, Dialer, Offers, Agreements, Settings), per `docs/superpowers/specs/2026-08-06-admin-nav-restructure-design.md`.

**Architecture:** Pure information-architecture move. Two existing sub-tabs (Buyer Search, Acquisition Machine) become their own top-level routes (`/admin/search`, `/admin/offers`). Templates merges into Agreements as an in-page sub-tab. Password moves into a new Settings page alongside two new placeholder sub-tabs (API Connections, Billing). CRM and Dialer are new placeholder routes. Old URLs (`/admin/acquisitions`, `/admin/templates`, `/admin/templates/[type]`, `/admin/password`) become server-side redirects to their new homes. No data model or business logic changes.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19 Server Components, Prisma 7 + Neon Postgres, TypeScript, inline-style React (no Tailwind/CSS modules in the admin app), pnpm.

## Global Constraints

- Package manager is **pnpm** (lockfile is `pnpm-lock.yaml`) — never use `npm`/`yarn` install commands in this repo.
- **No automated test framework is configured** (no jest/vitest/playwright). Verification per task uses: `npx tsc --noEmit` (type check), `pnpm lint` (ESLint), `curl` for redirect status checks, and manual browser checks against the dev server already running at `http://localhost:3000`.
- Every admin page and server action calls `await requireAdmin()` from `@/lib/session` before doing anything else — preserve this on every moved/new page and action.
- Component styling is inline `style={{}}` objects everywhere in the admin app — no Tailwind, no CSS modules. Only add a CSS classname when it's needed as a hook for a `@media` query override (matching the existing `.admin-header` / `.admin-nav` / `.admin-mobile-nav` pattern in `app/globals.css`).
- Color palette to reuse exactly: `#111110` (near-black text/buttons), `#8a8a84` (muted gray), `#5a5a54` (secondary text), `#e8e7e2` / `#d0cfc8` (borders), `#f5f4f0` / `#f8f7f4` (page backgrounds), `#ffffff` (card backgrounds). Headings use `fontFamily: "var(--font-display), serif"` with wide `letterSpacing`.
- Icon style: inline SVG, `viewBox="0 0 24 24"`, `fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"`.
- Server actions live in a sibling `actions.ts` file with `"use server"` at the top, following the existing per-route convention (e.g. `agreements/actions.ts`, current `acquisitions/actions.ts`).
- Dev server is already running in the background (`pnpm dev` at `http://localhost:3000`); Turbopack picks up file changes automatically — no restart needed between tasks.

---

## Task 1: Admin primary sidebar component + layout wiring

**Files:**
- Create: `app/admin/(protected)/AdminSidebar.tsx`
- Modify: `app/admin/(protected)/layout.tsx`

**Interfaces:**
- Produces: `AdminSidebar` (default export, no props) — a client component rendering the 6 primary nav links. Later tasks (2–15) create the routes it links to; broken links until then are expected and fine (Next.js `<Link>` doesn't require the target to exist at compile time).

- [ ] **Step 1: Create the sidebar component**

Create `app/admin/(protected)/AdminSidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/admin/search",
    label: "Search",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    href: "/admin/crm",
    label: "CRM",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    href: "/admin/dialer",
    label: "Dialer",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
      </svg>
    ),
  },
  {
    href: "/admin/offers",
    label: "Offers",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: "/admin/agreements",
    label: "Agreements",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    ),
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar" style={{
      width: "196px",
      flexShrink: 0,
      background: "#ffffff",
      borderRight: "1px solid #e8e7e2",
      minHeight: "calc(100vh - 56px)",
      padding: "16px 10px",
      position: "sticky",
      top: "56px",
      alignSelf: "flex-start",
    }}>
      {NAV_ITEMS.map(({ href, label, icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link key={href} href={href} style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 12px",
            borderRadius: "8px",
            marginBottom: "2px",
            textDecoration: "none",
            color: active ? "#111110" : "#8a8a84",
            background: active ? "#f5f4f0" : "transparent",
            fontSize: "13px",
            fontWeight: active ? 600 : 500,
            letterSpacing: "0.2px",
          }}>
            <span style={{ display: "flex", opacity: active ? 1 : 0.7 }}>{icon}</span>
            {label}
          </Link>
        );
      })}
    </aside>
  );
}
```

- [ ] **Step 2: Rewrite the layout to remove the old top nav and wire in the sidebar**

Replace the full contents of `app/admin/(protected)/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";
import AdminProfileMenu from "./AdminProfileMenu";
import AdminMobileNav from "./AdminMobileNav";
import AdminSidebar from "./AdminSidebar";

export const metadata: Metadata = { title: "Highlander REI — Admin" };

async function logout() {
  "use server";
  await deleteSession();
  redirect("/admin/login");
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "var(--font-body), system-ui, sans-serif" }}>
      <header className="admin-header" style={{
        background: "#ffffff",
        borderBottom: "1px solid #e8e7e2",
        padding: "0 28px",
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <span className="admin-brand" style={{ fontFamily: "var(--font-display), serif", fontSize: "17px", letterSpacing: "3px", color: "#111110" }}>
          HIGHLANDER REI
        </span>
        <AdminProfileMenu logoutAction={logout} />
      </header>

      <div style={{ display: "flex" }}>
        <AdminSidebar />
        <div className="admin-content-wrap" style={{ background: "#f8f7f4", minHeight: "calc(100vh - 56px)", flex: 1, minWidth: 0 }}>
          {children}
        </div>
      </div>

      <AdminMobileNav />
    </div>
  );
}
```

Note this drops the unused `Link` import and the old `navLinks` array — both only existed for the removed horizontal nav.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `AdminSidebar.tsx` or `layout.tsx`. (Errors about routes that don't exist yet, like `/admin/search`, are expected — `<Link href>` isn't type-checked against real routes here since this project doesn't use `typedRoutes`.)

- [ ] **Step 4: Visual check**

Open `http://localhost:3000/admin/login`, log in, confirm a left sidebar with 6 items (Search, CRM, Dialer, Offers, Agreements, Settings) now renders next to the page content, and the old horizontal nav links are gone from the header.

- [ ] **Step 5: Commit**

```bash
git add "app/admin/(protected)/AdminSidebar.tsx" "app/admin/(protected)/layout.tsx"
git commit -m "Add persistent left sidebar, remove horizontal admin nav"
```

---

## Task 2: Remove Change Password from the profile dropdown

**Files:**
- Modify: `app/admin/(protected)/AdminProfileMenu.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new — Settings (Task 14) becomes the only place to change password.

- [ ] **Step 1: Remove the Change Password link**

In `app/admin/(protected)/AdminProfileMenu.tsx`, remove this block (it sits between the divider and the sign-out form):

```tsx
          <Link
            href="/admin/password"
            onClick={() => setOpen(false)}
            style={{ display: "block", padding: "8px 12px", fontSize: "13px", color: "#5a5a54", textDecoration: "none", borderRadius: "6px" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f7f4")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Change Password
          </Link>

```

Leave the divider above it and the `<form action={logoutAction}>` below it in place.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/admin/(protected)/AdminProfileMenu.tsx"
git commit -m "Remove Change Password from profile menu (moves to Settings)"
```

---

## Task 3: Replace mobile bottom tab bar with a hamburger drawer

**Files:**
- Modify: `app/admin/(protected)/AdminMobileNav.tsx`

**Interfaces:**
- Produces: same default export name (`AdminMobileNav`), same zero-props usage from `layout.tsx` — no changes needed elsewhere.

- [ ] **Step 1: Rewrite the component**

Replace the full contents of `app/admin/(protected)/AdminMobileNav.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/admin/search",
    label: "Search",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    href: "/admin/crm",
    label: "CRM",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    href: "/admin/dialer",
    label: "Dialer",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
      </svg>
    ),
  },
  {
    href: "/admin/offers",
    label: "Offers",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: "/admin/agreements",
    label: "Agreements",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    ),
  },
];

export default function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="admin-mobile-drawer-trigger"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>
        </svg>
      </button>

      {open && (
        <div className="admin-mobile-drawer-overlay" onClick={() => setOpen(false)}>
          <nav className="admin-mobile-drawer" onClick={(e) => e.stopPropagation()} aria-label="Admin navigation">
            <div className="admin-mobile-drawer-header">
              <span className="admin-brand" style={{ fontFamily: "var(--font-display), serif", fontSize: "15px", letterSpacing: "3px", color: "#111110" }}>
                HIGHLANDER REI
              </span>
              <button onClick={() => setOpen(false)} aria-label="Close navigation" style={{ background: "none", border: "none", color: "#8a8a84", cursor: "pointer", padding: "4px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {NAV_ITEMS.map(({ href, label, icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link key={href} href={href} onClick={() => setOpen(false)} className={active ? "active" : ""}>
                  {icon}
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/admin/(protected)/AdminMobileNav.tsx"
git commit -m "Replace mobile bottom tab bar with hamburger drawer"
```

(Visual verification of the drawer happens in Task 4, after its CSS exists — without the CSS the trigger button and drawer will render but look unstyled/wrong.)

---

## Task 4: Update globals.css for the new sidebar and mobile drawer

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Hide the new desktop sidebar on mobile (replaces the dead `.admin-nav` rule)**

In the `@media (max-width: 900px)` block that currently contains `.admin-header`, `.admin-nav`, `.admin-brand` (around line 492), replace:

```css
  .admin-nav {
    display: none !important;
  }
```

with:

```css
  .admin-sidebar {
    display: none !important;
  }
```

- [ ] **Step 2: Replace the bottom-tab-bar base rule with drawer base rules**

Replace:

```css
.admin-mobile-nav {
  display: none;
}
```

with:

```css
.admin-mobile-drawer-trigger {
  display: none;
}

.admin-mobile-drawer-overlay {
  display: none;
}
```

- [ ] **Step 3: Replace the tab-bar mobile styles with drawer mobile styles**

Inside the second `@media (max-width: 900px)` block (the one that also sets `.admin-header { display: none !important; }`), replace the five rules `.admin-mobile-nav`, `.admin-mobile-nav-tabs`, `.admin-mobile-nav-tabs a`, `.admin-mobile-nav-tabs a.active`, `.admin-mobile-add`:

```css
  .admin-mobile-nav {
    display: flex;
    position: fixed;
    bottom: max(18px, env(safe-area-inset-bottom));
    left: 20px;
    right: 20px;
    z-index: 100;
    align-items: center;
    justify-content: center;
    gap: 14px;
    pointer-events: none;
  }

  .admin-mobile-nav-tabs {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 5px;
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid #e8e8ed;
    border-radius: 28px;
    box-shadow: 0 12px 36px rgba(17, 17, 16, 0.14);
    pointer-events: auto;
  }

  .admin-mobile-nav-tabs a {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-width: 118px;
    padding: 12px 14px;
    border-radius: 23px;
    text-decoration: none;
    font-size: 12px;
    font-weight: 650;
    color: #777781;
    transition: color 0.15s, background 0.15s;
  }

  .admin-mobile-nav-tabs a.active {
    color: #111110;
    background: #f0f0f3;
  }

  .admin-mobile-add {
    width: 58px;
    height: 58px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #111110;
    color: #ffffff;
    box-shadow: 0 12px 30px rgba(17, 17, 16, 0.16);
    pointer-events: auto;
  }
```

with:

```css
  .admin-mobile-drawer-trigger {
    display: flex;
    position: fixed;
    bottom: max(18px, env(safe-area-inset-bottom));
    left: 20px;
    z-index: 100;
    width: 52px;
    height: 52px;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #111110;
    color: #ffffff;
    border: none;
    cursor: pointer;
    box-shadow: 0 12px 30px rgba(17, 17, 16, 0.16);
  }

  .admin-mobile-drawer-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(17, 17, 16, 0.4);
    z-index: 110;
  }

  .admin-mobile-drawer {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 78vw;
    max-width: 300px;
    background: #ffffff;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    padding: 8px;
    overflow-y: auto;
  }

  .admin-mobile-drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 12px 18px;
  }

  .admin-mobile-drawer a {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 12px;
    border-radius: 8px;
    text-decoration: none;
    font-size: 13.5px;
    font-weight: 500;
    color: #5a5a54;
  }

  .admin-mobile-drawer a.active {
    color: #111110;
    font-weight: 600;
    background: #f5f4f0;
  }
```

- [ ] **Step 4: Visual check at mobile width**

In the browser, open dev tools, switch to a mobile viewport (e.g. 390px wide) at `http://localhost:3000/admin/agreements` (logged in). Confirm: no top header, a black circular hamburger button floats bottom-left, tapping it slides in a white drawer from the left with the 6 nav items and a close (×) button, tapping an item navigates and closes the drawer, tapping the dark overlay also closes it.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "Restyle mobile nav as a hamburger drawer, hide sidebar on mobile"
```

---

## Task 5: Create the Search route (migrate Buyer Search)

**Files:**
- Create: `app/admin/(protected)/search/page.tsx`
- Create: `app/admin/(protected)/search/actions.ts`

**Interfaces:**
- Produces: `createArea`, `toggleArea`, `deleteArea` server actions in `search/actions.ts`, consumed only by `search/page.tsx`.

- [ ] **Step 1: Create the actions file**

Create `app/admin/(protected)/search/actions.ts`:

```tsx
"use server";

import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function revalidate() {
  revalidatePath("/admin/search");
}

export async function createArea(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const slug = `${base}-${Date.now().toString(36)}`;

  await prisma.acquisitionArea.create({
    data: {
      name,
      slug,
      buyerContact: String(formData.get("buyerContact") ?? "") || null,
      description: String(formData.get("description") ?? "") || null,
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
```

- [ ] **Step 2: Create the page**

Create `app/admin/(protected)/search/page.tsx`:

```tsx
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { createArea, toggleArea, deleteArea } from "./actions";

export const metadata: Metadata = { title: "Search | Highlander REI" };

function ToggleButton({ id, active, action }: { id: string; active: boolean; action: (id: string) => Promise<void> }) {
  const toggleWithId = action.bind(null, id);
  return (
    <form action={toggleWithId} style={{ display: "inline" }}>
      <button type="submit" style={{
        padding: "3px 10px", borderRadius: "20px", fontSize: "10.5px", fontWeight: 600,
        letterSpacing: "0.4px", border: "1px solid",
        background: active ? "#eaf6f0" : "#f0efeb",
        color: active ? "#3a7a50" : "#8a8a84",
        borderColor: active ? "#b8dfc8" : "#d0cfc8",
        cursor: "pointer", fontFamily: "inherit",
      }}>
        {active ? "Active" : "Inactive"}
      </button>
    </form>
  );
}

function DeleteButton({ id, action, label }: { id: string; action: (id: string) => Promise<void>; label: string }) {
  const deleteWithId = action.bind(null, id);
  return (
    <form action={deleteWithId} style={{ display: "inline" }}>
      <button type="submit" style={{
        padding: "3px 10px", borderRadius: "20px", fontSize: "10.5px", fontWeight: 600,
        background: "transparent", color: "#c0392b", border: "1px solid rgba(192,57,43,0.2)",
        cursor: "pointer", fontFamily: "inherit",
      }}>
        {label}
      </button>
    </form>
  );
}

export default async function SearchPage() {
  await requireAdmin();

  const searches = await prisma.acquisitionArea.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { buyBoxes: true } } },
  });

  return (
    <div style={{ maxWidth: "1100px", padding: "32px" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontFamily: "var(--font-display), serif", fontSize: "36px", color: "#111110", letterSpacing: "2px", lineHeight: 1 }}>SEARCH</div>
        <div style={{ fontSize: "12px", color: "#8a8a84", marginTop: "4px" }}>Buyer search criteria &amp; matching</div>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "24px", marginBottom: "20px" }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#111110", marginBottom: "16px" }}>New Buyer Search</div>
        <form action={createArea}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <span style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Search Name</span>
              <input name="name" required placeholder="e.g. Smith Family — Arcadia SFR" style={{ width: "100%", padding: "9px 12px", fontSize: "13px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", color: "#111110", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <span style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Buyer Contact</span>
              <input name="buyerContact" placeholder="e.g. John Smith" style={{ width: "100%", padding: "9px 12px", fontSize: "13px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", color: "#111110", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <span style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Description</span>
            <textarea name="description" rows={3} placeholder="What is this buyer looking for? e.g. First-time investor looking for a 3+ bed SFR in Arcadia under $700K, fixer-upper or tired landlord with high equity..." style={{ width: "100%", padding: "9px 12px", fontSize: "13px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", color: "#111110", fontFamily: "inherit", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" style={{ padding: "10px 24px", background: "#111110", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Create</button>
          </div>
        </form>
      </div>

      {searches.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "48px 40px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>NO BUYER SEARCHES</div>
          <div style={{ fontSize: "13px", color: "#8a8a84" }}>Create a search above — name the search, assign the buyer, and describe what they&apos;re looking for.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {searches.map((s) => (
            <div key={s.id} style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: s.description ? "8px" : "0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#111110" }}>{s.name}</span>
                  {s.buyerContact && (
                    <span style={{ fontSize: "10.5px", color: "#1a56db", background: "rgba(26,86,219,0.08)", padding: "2px 8px", borderRadius: "20px", fontWeight: 600 }}>{s.buyerContact}</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <ToggleButton id={s.id} active={s.active} action={toggleArea} />
                  <DeleteButton id={s.id} action={deleteArea} label="Delete" />
                </div>
              </div>
              {s.description && (
                <div style={{ fontSize: "12.5px", color: "#5a5a54", lineHeight: 1.6 }}>{s.description}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Verify in browser**

Log in and open `http://localhost:3000/admin/search`. Confirm the "New Buyer Search" form and existing search list render (should look identical to the old Buyer Search sub-tab), and that toggling active/inactive and deleting a search still works.

- [ ] **Step 5: Commit**

```bash
git add "app/admin/(protected)/search"
git commit -m "Add /admin/search route (migrated from Acquisitions > Buyer Search)"
```

---

## Task 6: Create the Offers route (migrate Acquisition Machine)

**Files:**
- Create: `app/admin/(protected)/offers/page.tsx`
- Create: `app/admin/(protected)/offers/actions.ts`
- Move: `app/admin/(protected)/acquisitions/ImportRunner.tsx` → `app/admin/(protected)/offers/ImportRunner.tsx`
- Move: `app/admin/(protected)/acquisitions/ImportActions.tsx` → `app/admin/(protected)/offers/ImportActions.tsx`
- Move: `app/admin/(protected)/acquisitions/BuyBoxForm.tsx` → `app/admin/(protected)/offers/BuyBoxForm.tsx`

**Interfaces:**
- Produces: `deleteImportRun`, `createBuyBox`, `toggleBuyBox`, `deleteBuyBox` server actions in `offers/actions.ts`.

- [ ] **Step 1: Move the client components (no content changes — neither references `/admin/acquisitions`)**

```bash
git mv "app/admin/(protected)/acquisitions/ImportRunner.tsx" "app/admin/(protected)/offers/ImportRunner.tsx"
git mv "app/admin/(protected)/acquisitions/ImportActions.tsx" "app/admin/(protected)/offers/ImportActions.tsx"
git mv "app/admin/(protected)/acquisitions/BuyBoxForm.tsx" "app/admin/(protected)/offers/BuyBoxForm.tsx"
```

- [ ] **Step 2: Create the actions file**

Create `app/admin/(protected)/offers/actions.ts`:

```tsx
"use server";

import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function revalidate() {
  revalidatePath("/admin/offers");
}

function parseList(val: FormDataEntryValue | null): string[] {
  const raw = String(val ?? "").trim();
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function optFloat(val: FormDataEntryValue | null): number | null {
  const n = parseFloat(String(val ?? ""));
  return isNaN(n) ? null : n;
}

function optInt(val: FormDataEntryValue | null): number | null {
  const n = parseInt(String(val ?? ""), 10);
  return isNaN(n) ? null : n;
}

function machineDataFromForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    areaId: String(formData.get("areaId") ?? "") || null,
    active: true,
    zips: parseList(formData.get("zips")),
    propertyTypes: parseList(formData.get("propertyTypes")),
    priceMin: optFloat(formData.get("priceMin")),
    priceMax: optFloat(formData.get("priceMax")),
    bedsMin: optInt(formData.get("bedsMin")),
    bedsMax: optInt(formData.get("bedsMax")),
    sqftMin: optInt(formData.get("sqftMin")),
    sqftMax: optInt(formData.get("sqftMax")),
  };
}

export async function createBuyBox(formData: FormData) {
  await requireAdmin();
  const data = machineDataFromForm(formData);
  if (!data.name) return;

  await prisma.buyBox.create({ data });
  revalidate();
}

export async function toggleBuyBox(id: string) {
  await requireAdmin();
  const bb = await prisma.buyBox.findUnique({ where: { id } });
  if (!bb) return;
  await prisma.buyBox.update({ where: { id }, data: { active: !bb.active } });
  revalidate();
}

export async function deleteBuyBox(id: string) {
  await requireAdmin();
  await prisma.buyerMatch.deleteMany({ where: { buyBoxId: id } });
  await prisma.buyBox.delete({ where: { id } });
  revalidate();
}

export async function deleteImportRun(id: string) {
  await requireAdmin();
  await prisma.importRun.delete({ where: { id } });
  revalidate();
}
```

- [ ] **Step 3: Create the page**

Create `app/admin/(protected)/offers/page.tsx`:

```tsx
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { deleteImportRun } from "./actions";
import ImportRunner from "./ImportRunner";
import ImportActions from "./ImportActions";

export const metadata: Metadata = { title: "Offers | Highlander REI" };

function DeleteButton({ id, action, label }: { id: string; action: (id: string) => Promise<void>; label: string }) {
  const deleteWithId = action.bind(null, id);
  return (
    <form action={deleteWithId} style={{ display: "inline" }}>
      <button type="submit" style={{
        padding: "3px 10px", borderRadius: "20px", fontSize: "10.5px", fontWeight: 600,
        background: "transparent", color: "#c0392b", border: "1px solid rgba(192,57,43,0.2)",
        cursor: "pointer", fontFamily: "inherit",
      }}>
        {label}
      </button>
    </form>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string; border: string }> = {
    completed: { bg: "#eaf6f0", color: "#3a7a50", border: "#b8dfc8" },
    running: { bg: "rgba(26,86,219,0.08)", color: "#1a56db", border: "rgba(26,86,219,0.25)" },
    pending: { bg: "#f0efeb", color: "#8a8a84", border: "#d0cfc8" },
    failed: { bg: "rgba(192,57,43,0.06)", color: "#c0392b", border: "rgba(192,57,43,0.2)" },
  };
  const c = colors[status] ?? colors.pending;
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "10.5px", fontWeight: 600, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {status}
    </span>
  );
}

function fmt(n: number): string { return n.toLocaleString("en-US"); }
function fmtPrice(n: number | null | undefined): string {
  if (n == null) return "—";
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; zip?: string; city?: string }>;
}) {
  await requireAdmin();
  const { page: pageParam, zip: filterZip, city: filterCity } = await searchParams;
  const currentPage = Math.max(1, Number(pageParam) || 1);
  const PAGE_SIZE = 50;

  const [propertyCount, importRunCount, imports] = await Promise.all([
    prisma.property.count(),
    prisma.importRun.count(),
    prisma.importRun.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  const propertyWhere: Record<string, unknown> = {};
  if (filterZip) propertyWhere.zip = filterZip;
  if (filterCity) propertyWhere.city = { contains: filterCity, mode: "insensitive" };
  const filteredPropertyCount = await prisma.property.count({ where: propertyWhere });
  const importedProperties = await prisma.property.findMany({
    where: propertyWhere, orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * PAGE_SIZE, take: PAGE_SIZE,
    include: { owners: { take: 1 } },
  });
  const distinctZips = await prisma.property.findMany({ select: { zip: true }, distinct: ["zip"], orderBy: { zip: "asc" } });

  return (
    <div style={{ maxWidth: "1100px", padding: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <div style={{ fontFamily: "var(--font-display), serif", fontSize: "36px", color: "#111110", letterSpacing: "2px", lineHeight: 1 }}>OFFERS</div>
          <div style={{ fontSize: "12px", color: "#8a8a84", marginTop: "4px" }}>Property pipeline &amp; deal matching</div>
        </div>
        <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "#8a8a84" }}>
          <span><strong style={{ color: "#111110" }}>{propertyCount}</strong> properties</span>
          <span><strong style={{ color: "#111110" }}>{importRunCount}</strong> imports</span>
        </div>
      </div>

      <ImportRunner />

      {imports.length > 0 && (
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", overflow: "hidden", marginBottom: "20px" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e8e7e2", fontSize: "13px", fontWeight: 600, color: "#111110" }}>Recent Imports</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 1fr 80px", padding: "10px 20px", background: "#f5f4f0", borderBottom: "1px solid #e8e7e2" }}>
            {["Source", "Status", "Records", "Date", ""].map((h) => (
              <div key={h} style={{ fontSize: "9.5px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>{h}</div>
            ))}
          </div>
          {imports.map((run, i) => {
            const meta = run.rawMeta as Record<string, unknown> | null;
            return (
              <div key={run.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 1fr 80px", padding: "13px 20px", borderBottom: i < imports.length - 1 ? "1px solid #f0efeb" : "none", alignItems: "center" }}>
                <div style={{ fontSize: "13px", color: "#111110", fontWeight: 500 }}>{run.source}</div>
                <div><StatusBadge status={run.status} /></div>
                <div style={{ fontSize: "12px", color: "#5a5a54" }}>{meta?.imported != null ? `${meta.imported} new` : run.itemCount ?? "—"}</div>
                <div style={{ fontSize: "11.5px", color: "#8a8a84" }}>{new Date(run.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
                <div><DeleteButton id={run.id} action={deleteImportRun} label="Delete" /></div>
              </div>
            );
          })}
        </div>
      )}

      {propertyCount > 0 && (
        <>
          <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "16px 20px", marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#111110" }}>Results</span>
              <form method="GET" action="/admin/offers" style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <select name="zip" defaultValue={filterZip ?? ""} style={{ padding: "7px 12px", fontSize: "12px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", color: "#111110", fontFamily: "inherit" }}>
                  <option value="">All ZIPs</option>
                  {distinctZips.map((z) => <option key={z.zip} value={z.zip}>{z.zip}</option>)}
                </select>
                <input name="city" defaultValue={filterCity ?? ""} placeholder="City..." style={{ padding: "7px 12px", fontSize: "12px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", color: "#111110", fontFamily: "inherit", width: "140px" }} />
                <button type="submit" style={{ padding: "7px 16px", background: "#111110", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Filter</button>
                {(filterZip || filterCity) && (
                  <Link href="/admin/offers" style={{ padding: "7px 12px", fontSize: "12px", color: "#8a8a84", textDecoration: "none", border: "1px solid #d0cfc8", borderRadius: "6px" }}>Clear</Link>
                )}
              </form>
              <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                <ImportActions exportUrl={`/api/acquisitions/export?${filterZip ? `zip=${filterZip}&` : ""}${filterCity ? `city=${filterCity}` : ""}`} propertyCount={filteredPropertyCount} />
              </div>
            </div>
            <div style={{ fontSize: "11px", color: "#8a8a84", marginTop: "8px" }}>
              {filteredPropertyCount} properties{filterZip ? ` in ${filterZip}` : ""}{filterCity ? ` in ${filterCity}` : ""}
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 0.8fr 0.5fr 0.6fr 0.8fr 0.7fr 0.6fr 1fr", padding: "10px 20px", background: "#f5f4f0", borderBottom: "1px solid #e8e7e2" }}>
              {["Address", "City / ZIP", "Beds", "Sqft", "Value", "Equity", "Owned", "Owner"].map((h) => (
                <div key={h} style={{ fontSize: "9.5px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>{h}</div>
              ))}
            </div>
            {importedProperties.map((p, i) => {
              const o = p.owners[0];
              const eqPct = o?.estimatedEquityPct;
              const ownedYears = p.lastSaleDate ? Math.round((Date.now() - new Date(p.lastSaleDate).getTime()) / (1000 * 60 * 60 * 24 * 365)) : null;
              return (
                <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1.8fr 0.8fr 0.5fr 0.6fr 0.8fr 0.7fr 0.6fr 1fr", padding: "13px 20px", borderBottom: i < importedProperties.length - 1 ? "1px solid #f0efeb" : "none", alignItems: "center" }}>
                  <div style={{ fontSize: "13px", color: "#111110", fontWeight: 500 }}>{p.streetAddress}</div>
                  <div style={{ fontSize: "12px", color: "#5a5a54" }}>{p.city}, {p.zip}</div>
                  <div style={{ fontSize: "12px", color: "#5a5a54" }}>{p.beds ?? "—"}</div>
                  <div style={{ fontSize: "12px", color: "#5a5a54" }}>{p.sqft ? fmt(p.sqft) : "—"}</div>
                  <div style={{ fontSize: "12px", color: "#5a5a54" }}>{fmtPrice(p.estimatedValue)}</div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: eqPct != null && eqPct >= 50 ? "#3a7a50" : eqPct != null && eqPct >= 20 ? "#b45309" : "#8a8a84" }}>
                    {eqPct != null ? `${Math.round(eqPct)}%` : "—"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#5a5a54" }}>{ownedYears != null ? `${ownedYears}yr` : "—"}</div>
                  <div style={{ fontSize: "11px", color: "#8a8a84" }}>{o?.fullName ?? [o?.firstName, o?.lastName].filter(Boolean).join(" ") ?? "—"}</div>
                </div>
              );
            })}
          </div>

          {filteredPropertyCount > PAGE_SIZE && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", fontSize: "12px", color: "#8a8a84" }}>
              <span>Page {currentPage} of {Math.ceil(filteredPropertyCount / PAGE_SIZE)}</span>
              <div style={{ display: "flex", gap: "8px" }}>
                {currentPage > 1 && <Link href={`/admin/offers?${filterZip ? `zip=${filterZip}&` : ""}${filterCity ? `city=${filterCity}&` : ""}page=${currentPage - 1}`} style={{ padding: "7px 14px", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "6px", color: "#111110", textDecoration: "none", fontSize: "12px" }}>Previous</Link>}
                {currentPage < Math.ceil(filteredPropertyCount / PAGE_SIZE) && <Link href={`/admin/offers?${filterZip ? `zip=${filterZip}&` : ""}${filterCity ? `city=${filterCity}&` : ""}page=${currentPage + 1}`} style={{ padding: "7px 14px", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "6px", color: "#111110", textDecoration: "none", fontSize: "12px" }}>Next</Link>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Verify in browser**

Log in and open `http://localhost:3000/admin/offers`. Confirm the import runner, recent imports table, and property results table all render and behave as they did on the old Acquisition Machine sub-tab (filtering by ZIP/city, CSV export, GHL push, pagination).

- [ ] **Step 6: Commit**

```bash
git add "app/admin/(protected)/offers"
git commit -m "Add /admin/offers route (migrated from Acquisitions > Acquisition Machine)"
```

---

## Task 7: Redirect /admin/acquisitions, delete old acquisitions files

**Files:**
- Modify: `app/admin/(protected)/acquisitions/page.tsx` (becomes a redirect stub)
- Delete: `app/admin/(protected)/acquisitions/actions.ts`

**Interfaces:**
- Consumes: nothing (Tasks 5 and 6 must be done first — this task deletes their old source).

- [ ] **Step 1: Replace the acquisitions page with a redirect**

Replace the full contents of `app/admin/(protected)/acquisitions/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default async function AcquisitionsRedirect({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  redirect(tab === "machine" ? "/admin/offers" : "/admin/search");
}
```

- [ ] **Step 2: Delete the now-migrated actions file**

```bash
git rm "app/admin/(protected)/acquisitions/actions.ts"
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors (nothing should still import from the deleted `acquisitions/actions.ts` — Tasks 5 and 6 already created independent copies under `search/` and `offers/`).

- [ ] **Step 4: Verify redirects**

```bash
curl -sI "http://localhost:3000/admin/acquisitions" | head -5
curl -sI "http://localhost:3000/admin/acquisitions?tab=machine" | head -5
```

Expected: both return a redirect status (307) — since you're not authenticated via curl, Next.js's `requireAdmin`-driven auth in the *target* pages may further redirect to `/admin/login`, but the first hop's `Location` header from `/admin/acquisitions` itself should point at `/admin/search` (no `tab`) and `/admin/offers` (`tab=machine`) respectively. Confirm this by checking the `location:` header value in the output.

- [ ] **Step 5: Commit**

```bash
git add "app/admin/(protected)/acquisitions/page.tsx"
git commit -m "Turn /admin/acquisitions into a redirect to /admin/search or /admin/offers"
```

---

## Task 8: CRM placeholder page

**Files:**
- Create: `app/admin/(protected)/crm/page.tsx`

- [ ] **Step 1: Create the page**

Create `app/admin/(protected)/crm/page.tsx`:

```tsx
import { requireAdmin } from "@/lib/session";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "CRM | Highlander REI" };

export default async function CrmPage() {
  await requireAdmin();

  return (
    <div style={{ maxWidth: "1100px", padding: "32px" }}>
      <div style={{ fontFamily: "var(--font-display), serif", fontSize: "36px", color: "#111110", letterSpacing: "2px", lineHeight: 1, marginBottom: "24px" }}>CRM</div>
      <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "48px 40px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>COMING SOON</div>
        <div style={{ fontSize: "13px", color: "#8a8a84", maxWidth: "360px", margin: "0 auto", lineHeight: 1.7 }}>
          On-market prospecting and offer follow-up will live here — deals you&apos;re hunting, and deals with offers out that need a follow-up.
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Verify in browser**

Log in and open `http://localhost:3000/admin/crm`. Confirm the placeholder renders and the CRM sidebar item is highlighted active.

- [ ] **Step 4: Commit**

```bash
git add "app/admin/(protected)/crm"
git commit -m "Add /admin/crm placeholder page"
```

---

## Task 9: Dialer placeholder page

**Files:**
- Create: `app/admin/(protected)/dialer/page.tsx`

- [ ] **Step 1: Create the page**

Create `app/admin/(protected)/dialer/page.tsx`:

```tsx
import { requireAdmin } from "@/lib/session";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dialer | Highlander REI" };

export default async function DialerPage() {
  await requireAdmin();

  return (
    <div style={{ maxWidth: "1100px", padding: "32px" }}>
      <div style={{ fontFamily: "var(--font-display), serif", fontSize: "36px", color: "#111110", letterSpacing: "2px", lineHeight: 1, marginBottom: "24px" }}>DIALER</div>
      <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "48px 40px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>COMING SOON</div>
        <div style={{ fontSize: "13px", color: "#8a8a84", maxWidth: "360px", margin: "0 auto", lineHeight: 1.7 }}>
          ColdCallDogs.io integration is paused pending a merger decision. This tab is a placeholder until that&apos;s revisited.
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Verify in browser**

Log in and open `http://localhost:3000/admin/dialer`. Confirm the placeholder renders and the Dialer sidebar item is highlighted active.

- [ ] **Step 4: Commit**

```bash
git add "app/admin/(protected)/dialer"
git commit -m "Add /admin/dialer placeholder page"
```

---

## Task 10: Agreements tab dispatcher + AgreementsView extraction

**Files:**
- Move: `app/admin/(protected)/agreements/page.tsx` → `app/admin/(protected)/agreements/AgreementsView.tsx`
- Create: `app/admin/(protected)/agreements/page.tsx` (new, small — tab dispatcher)

**Interfaces:**
- Produces: `AgreementsView` (default export) — a server component taking `searchParams` as a **plain resolved object** (not a Promise), since the new `page.tsx` awaits it once and passes it down to whichever view is active.

- [ ] **Step 1: Move the existing agreements page**

```bash
git mv "app/admin/(protected)/agreements/page.tsx" "app/admin/(protected)/agreements/AgreementsView.tsx"
```

- [ ] **Step 2: Adjust AgreementsView.tsx — drop page-level metadata (moves to the dispatcher)**

In `app/admin/(protected)/agreements/AgreementsView.tsx`, remove:

```tsx
import type { Metadata } from "next";
```

and remove:

```tsx
export const metadata: Metadata = { title: "Agreements | Highlander REI" };
```

- [ ] **Step 3: Adjust the function signature — searchParams is now a plain object, not a Promise**

Replace:

```tsx
export default async function AgreementsPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string; q?: string; type?: string; page?: string }>;
}) {
  await requireAdmin();
  const { folder: folderParam, q, type: typeFilter, page: pageParam } = await searchParams;
```

with:

```tsx
export default async function AgreementsView({
  searchParams,
}: {
  searchParams: { folder?: string; q?: string; type?: string; page?: string; tab?: string };
}) {
  await requireAdmin();
  const { folder: folderParam, q, type: typeFilter, page: pageParam } = searchParams;
```

- [ ] **Step 4: Let the outer shell fill the space the dispatcher gives it, instead of computing its own viewport height**

Replace:

```tsx
    <div className="agreements-shell" style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>
```

with:

```tsx
    <div className="agreements-shell" style={{ display: "flex", flex: 1, minHeight: 0 }}>
```

- [ ] **Step 5: Create the new tab-dispatcher page.tsx**

Create `app/admin/(protected)/agreements/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import AgreementsView from "./AgreementsView";
import TemplatesView from "./TemplatesView";

export const metadata: Metadata = { title: "Agreements | Highlander REI" };

type Params = { tab?: string; folder?: string; q?: string; type?: string; page?: string };

export default async function AgreementsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const activeTab = params.tab === "templates" ? "templates" : "agreements";

  const TABS: { key: "agreements" | "templates"; label: string; href: string }[] = [
    { key: "agreements", label: "Agreements", href: "/admin/agreements" },
    { key: "templates", label: "Templates", href: "/admin/agreements?tab=templates" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 56px)" }}>
      <div style={{ display: "flex", gap: "2px", padding: "16px 32px 0", borderBottom: "1px solid #e8e7e2", background: "#ffffff", flexShrink: 0 }}>
        {TABS.map(({ key, label, href }) => (
          <Link key={key} href={href} style={{
            fontSize: "12.5px", fontWeight: activeTab === key ? 600 : 400,
            color: activeTab === key ? "#111110" : "#8a8a84",
            textDecoration: "none", padding: "8px 16px 12px",
            borderBottom: activeTab === key ? "2px solid #111110" : "2px solid transparent",
            marginBottom: "-1px", letterSpacing: "0.3px",
          }}>
            {label}
          </Link>
        ))}
      </div>

      {activeTab === "agreements" ? (
        <AgreementsView searchParams={params} />
      ) : (
        <TemplatesView searchParams={params} />
      )}
    </div>
  );
}
```

(`TemplatesView` doesn't exist yet — that's Task 11. Type errors referencing it are expected until then; don't run the type-check step below until Task 11 is done. Steps 1–4 above can be type-checked and committed on their own if you want a smaller commit, but Step 5 will not compile stand-alone.)

- [ ] **Step 6: Commit AgreementsView extraction (page.tsx from Step 5 not yet committed — see Task 11)**

```bash
git add "app/admin/(protected)/agreements/AgreementsView.tsx"
git commit -m "Extract Agreements list into AgreementsView, prep for Templates tab merge"
```

---

## Task 11: TemplatesView extraction + TemplateRow relocation

**Files:**
- Move: `app/admin/(protected)/templates/page.tsx` → `app/admin/(protected)/agreements/TemplatesView.tsx`
- Move: `app/admin/(protected)/templates/TemplateRow.tsx` → `app/admin/(protected)/agreements/TemplateRow.tsx`
- Move: `app/admin/(protected)/templates/actions.ts` → `app/admin/(protected)/agreements/template-actions.ts`

**Interfaces:**
- Produces: `TemplatesView` (default export) — server component taking `searchParams` as a plain object, consumed by `agreements/page.tsx` (created in Task 10).
- Produces: `upsertTemplate` action, now in `template-actions.ts` (renamed from `actions.ts` to avoid colliding with the existing `agreements/actions.ts`).

- [ ] **Step 1: Move the three files**

```bash
git mv "app/admin/(protected)/templates/page.tsx" "app/admin/(protected)/agreements/TemplatesView.tsx"
git mv "app/admin/(protected)/templates/TemplateRow.tsx" "app/admin/(protected)/agreements/TemplateRow.tsx"
git mv "app/admin/(protected)/templates/actions.ts" "app/admin/(protected)/agreements/template-actions.ts"
```

- [ ] **Step 2: Update the import in TemplatesView.tsx to the renamed actions file**

In `app/admin/(protected)/agreements/TemplatesView.tsx`, replace:

```tsx
import { upsertTemplate } from "./actions";
```

with:

```tsx
import { upsertTemplate } from "./template-actions";
```

- [ ] **Step 3: Drop the page-level metadata (now centralized in agreements/page.tsx)**

In `app/admin/(protected)/agreements/TemplatesView.tsx`, remove:

```tsx
import type { Metadata } from "next";
```

and remove:

```tsx
export const metadata: Metadata = { title: "Templates | Highlander REI" };
```

- [ ] **Step 4: Adjust the function signature — searchParams is now a plain object**

Replace:

```tsx
export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  await requireAdmin();
  const { type: typeFilter, q } = await searchParams;
```

with:

```tsx
export default async function TemplatesView({
  searchParams,
}: {
  searchParams: { type?: string; q?: string; tab?: string };
}) {
  await requireAdmin();
  const { type: typeFilter, q } = searchParams;
```

- [ ] **Step 5: Let the outer shell fill the space the dispatcher gives it**

Replace:

```tsx
    <div className="admin-workspace-shell" style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>
```

with:

```tsx
    <div className="admin-workspace-shell" style={{ display: "flex", flex: 1, minHeight: 0 }}>
```

- [ ] **Step 6: Repoint the "All Templates" link at the merged route**

Replace:

```tsx
              <Link href="/admin/templates" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: "6px", marginBottom: "1px", background: active ? "#f8f7f4" : "transparent", textDecoration: "none", borderLeft: active ? "2px solid #111110" : "2px solid transparent", color: active ? "#111110" : "#8a8a84" }}>
```

with:

```tsx
              <Link href="/admin/agreements?tab=templates" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: "6px", marginBottom: "1px", background: active ? "#f8f7f4" : "transparent", textDecoration: "none", borderLeft: active ? "2px solid #111110" : "2px solid transparent", color: active ? "#111110" : "#8a8a84" }}>
```

- [ ] **Step 7: Repoint the per-type filter links**

Replace:

```tsx
            const href = active ? "/admin/templates" : `/admin/templates?type=${type}`;
```

with:

```tsx
            const href = active ? "/admin/agreements?tab=templates" : `/admin/agreements?tab=templates&type=${type}`;
```

- [ ] **Step 8: Repoint the search form to post to the merged route with the tab preserved**

Replace:

```tsx
          <form method="GET" action="/admin/templates" style={{ display: "flex", gap: "8px", paddingBottom: "20px" }}>
            {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
```

with:

```tsx
          <form method="GET" action="/admin/agreements" style={{ display: "flex", gap: "8px", paddingBottom: "20px" }}>
            <input type="hidden" name="tab" value="templates" />
            {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
```

- [ ] **Step 9: Repoint the "Clear" link**

Replace:

```tsx
              <Link href="/admin/templates" style={{ padding: "0 14px", background: "#ffffff", color: "#8a8a84", border: "1px solid #d0cfc8", borderRadius: "8px", fontSize: "12.5px", display: "flex", alignItems: "center", textDecoration: "none" }}>
```

with:

```tsx
              <Link href="/admin/agreements?tab=templates" style={{ padding: "0 14px", background: "#ffffff", color: "#8a8a84", border: "1px solid #d0cfc8", borderRadius: "8px", fontSize: "12.5px", display: "flex", alignItems: "center", textDecoration: "none" }}>
```

- [ ] **Step 10: Update template-actions.ts revalidation targets**

In `app/admin/(protected)/agreements/template-actions.ts`, replace:

```tsx
  revalidatePath("/admin/templates");
  revalidatePath(`/admin/templates/${type}`);
```

with:

```tsx
  revalidatePath("/admin/agreements");
  revalidatePath(`/admin/agreements/templates/${type}`);
```

- [ ] **Step 11: Repoint the "Edit"/"Map Fields" link in TemplateRow.tsx**

In `app/admin/(protected)/agreements/TemplateRow.tsx`, replace:

```tsx
          <Link href={`/admin/templates/${type}`} style={{ fontSize: "12px", color: "#5a5a54", textDecoration: "none", padding: "6px 12px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", whiteSpace: "nowrap" }}>
```

with:

```tsx
          <Link href={`/admin/agreements/templates/${type}`} style={{ fontSize: "12px", color: "#5a5a54", textDecoration: "none", padding: "6px 12px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", whiteSpace: "nowrap" }}>
```

- [ ] **Step 12: Type-check the whole agreements dispatcher now that both views exist**

Run: `npx tsc --noEmit`
Expected: no errors. This is the point where Task 10's `agreements/page.tsx` (which imports `TemplatesView`) finally compiles end-to-end.

- [ ] **Step 13: Verify in browser**

Log in and open `http://localhost:3000/admin/agreements`. Confirm an "Agreements | Templates" tab strip appears above the existing Agreements envelope sidebar. Click "Templates" — confirm the templates list renders with its own sidebar (template type filters), search works, and the type filter/clear links keep you on `/admin/agreements?tab=templates`.

- [ ] **Step 14: Commit**

```bash
git add "app/admin/(protected)/agreements/page.tsx" "app/admin/(protected)/agreements/TemplatesView.tsx" "app/admin/(protected)/agreements/TemplateRow.tsx" "app/admin/(protected)/agreements/template-actions.ts"
git commit -m "Merge Templates into Agreements as a sub-tab"
```

---

## Task 12: Relocate the template field-editor route under Agreements

**Files:**
- Move: `app/admin/(protected)/templates/[type]/page.tsx` → `app/admin/(protected)/agreements/templates/[type]/page.tsx`
- Move: `app/admin/(protected)/templates/[type]/PdfFieldEditor.tsx` → `app/admin/(protected)/agreements/templates/[type]/PdfFieldEditor.tsx`
- Move: `app/admin/(protected)/templates/[type]/actions.ts` → `app/admin/(protected)/agreements/templates/[type]/actions.ts`
- Modify: `app/admin/(protected)/agreements/new/NewAgreementForm.tsx`
- Modify: `app/admin/(protected)/agreements/[id]/page.tsx`

- [ ] **Step 1: Move the three files (PdfFieldEditor.tsx has no route references — pure relocation)**

```bash
git mv "app/admin/(protected)/templates/[type]/page.tsx" "app/admin/(protected)/agreements/templates/[type]/page.tsx"
git mv "app/admin/(protected)/templates/[type]/PdfFieldEditor.tsx" "app/admin/(protected)/agreements/templates/[type]/PdfFieldEditor.tsx"
git mv "app/admin/(protected)/templates/[type]/actions.ts" "app/admin/(protected)/agreements/templates/[type]/actions.ts"
```

- [ ] **Step 2: Update the invalid-type redirect in the moved page.tsx**

In `app/admin/(protected)/agreements/templates/[type]/page.tsx`, replace:

```tsx
  if (!VALID_TYPES.includes(type)) redirect("/admin/templates");
```

with:

```tsx
  if (!VALID_TYPES.includes(type)) redirect("/admin/agreements?tab=templates");
```

- [ ] **Step 3: Update the "back" link in the moved page.tsx**

Replace:

```tsx
        <Link href="/admin/templates" style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>← Templates</Link>
```

with:

```tsx
        <Link href="/admin/agreements?tab=templates" style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>← Templates</Link>
```

- [ ] **Step 4: Update revalidation targets in the moved actions.ts**

In `app/admin/(protected)/agreements/templates/[type]/actions.ts`, replace:

```tsx
  revalidatePath("/admin/templates");
  revalidatePath(`/admin/templates/${type}`);
```

with:

```tsx
  revalidatePath("/admin/agreements");
  revalidatePath(`/admin/agreements/templates/${type}`);
```

- [ ] **Step 5: Update the inbound link from NewAgreementForm.tsx**

In `app/admin/(protected)/agreements/new/NewAgreementForm.tsx`, replace:

```tsx
                  <Link href={`/admin/templates/${type}`} style={{ display: "inline-block", marginTop: "8px", color: "#8f2c21", fontWeight: 700 }}>
```

with:

```tsx
                  <Link href={`/admin/agreements/templates/${type}`} style={{ display: "inline-block", marginTop: "8px", color: "#8f2c21", fontWeight: 700 }}>
```

- [ ] **Step 6: Update the two inbound links from agreements/[id]/page.tsx**

In `app/admin/(protected)/agreements/[id]/page.tsx`, replace **all occurrences** (there are two, otherwise identical) of:

```tsx
href={`/admin/templates/${type}`}
```

with:

```tsx
href={`/admin/agreements/templates/${type}`}
```

Use `replace_all` — both occurrences need this exact same substring change and nothing else on those lines differs in a way that matters.

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Verify in browser**

Log in, open `http://localhost:3000/admin/agreements?tab=templates`, click "Edit" or "Map Fields" on a template row. Confirm you land on `http://localhost:3000/admin/agreements/templates/<type>`, the field editor renders, and "← Templates" takes you back to `/admin/agreements?tab=templates`. Also open `http://localhost:3000/admin/agreements/new` and confirm the "map fields first" link (if a template needs mapping) points at the new URL.

- [ ] **Step 9: Commit**

```bash
git add "app/admin/(protected)/agreements/templates" "app/admin/(protected)/agreements/new/NewAgreementForm.tsx" "app/admin/(protected)/agreements/[id]/page.tsx"
git commit -m "Relocate template field-editor route under /admin/agreements/templates"
```

---

## Task 13: Redirect old /admin/templates URLs

**Files:**
- Create: `app/admin/(protected)/templates/page.tsx` (redirect stub — the old file was moved away in Task 11)
- Create: `app/admin/(protected)/templates/[type]/page.tsx` (redirect stub — the old file was moved away in Task 12)

**Interfaces:**
- Consumes: Tasks 11 and 12 must be complete first (they emptied out the original `templates/` directory of everything except what this task re-adds as redirect stubs).

- [ ] **Step 1: Create the templates list redirect**

Create `app/admin/(protected)/templates/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function TemplatesRedirect() {
  redirect("/admin/agreements?tab=templates");
}
```

- [ ] **Step 2: Create the template-type redirect**

Create `app/admin/(protected)/templates/[type]/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default async function TemplateFieldsRedirect({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  redirect(`/admin/agreements/templates/${type}`);
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Verify redirects**

```bash
curl -sI "http://localhost:3000/admin/templates" | grep -i location
curl -sI "http://localhost:3000/admin/templates/cash_offer" | grep -i location
```

Expected: `location: /admin/agreements?tab=templates` and `location: /admin/agreements/templates/cash_offer` respectively (Next.js may report these via a `307` with the `location` header pointing at the redirect target, possibly chained further to `/admin/login` since curl has no session — confirm the *first* redirect target matches).

- [ ] **Step 5: Commit**

```bash
git add "app/admin/(protected)/templates"
git commit -m "Redirect old /admin/templates URLs to /admin/agreements"
```

---

## Task 14: Settings route (Password, API Connections, Billing)

**Files:**
- Create: `app/admin/(protected)/settings/page.tsx`
- Create: `app/admin/(protected)/settings/actions.ts`

**Interfaces:**
- Produces: `changePassword` server action in `settings/actions.ts`, consumed by `settings/page.tsx`.

- [ ] **Step 1: Create the actions file**

Create `app/admin/(protected)/settings/actions.ts`:

```tsx
"use server";

import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { redirect } from "next/navigation";

export async function changePassword(formData: FormData) {
  await requireAdmin();

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!current || !next || next !== confirm) redirect("/admin/settings?tab=password&error=mismatch");
  if (next.length < 8) redirect("/admin/settings?tab=password&error=short");

  const config = await prisma.adminConfig.findUnique({ where: { id: "singleton" } });
  const currentHash = config?.passwordHash;

  const validCurrent = currentHash
    ? hashPassword(current) === currentHash
    : !!process.env.ADMIN_PASSWORD && current === process.env.ADMIN_PASSWORD;

  if (!validCurrent) redirect("/admin/settings?tab=password&error=wrong");

  await prisma.adminConfig.upsert({
    where: { id: "singleton" },
    update: { passwordHash: hashPassword(next) },
    create: { id: "singleton", passwordHash: hashPassword(next) },
  });

  redirect("/admin/settings?tab=password&success=1");
}
```

- [ ] **Step 2: Create the page**

Create `app/admin/(protected)/settings/page.tsx`:

```tsx
import { requireAdmin } from "@/lib/session";
import type { Metadata } from "next";
import Link from "next/link";
import { changePassword } from "./actions";

export const metadata: Metadata = { title: "Settings | Highlander REI" };

type Tab = "password" | "connections" | "billing";

const TABS: { key: Tab; label: string }[] = [
  { key: "password", label: "Password" },
  { key: "connections", label: "API Connections" },
  { key: "billing", label: "Billing" },
];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; error?: string; success?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const activeTab = (["password", "connections", "billing"].includes(params.tab ?? "") ? params.tab : "password") as Tab;

  const errorMsg: Record<string, string> = {
    mismatch: "Passwords do not match.",
    short: "New password must be at least 8 characters.",
    wrong: "Current password is incorrect.",
  };

  return (
    <div style={{ maxWidth: "620px", padding: "32px" }}>
      <div style={{ fontFamily: "var(--font-display), serif", fontSize: "36px", color: "#111110", letterSpacing: "2px", lineHeight: 1, marginBottom: "24px" }}>SETTINGS</div>

      <div style={{ display: "flex", gap: "2px", marginBottom: "24px", borderBottom: "1px solid #e8e7e2" }}>
        {TABS.map(({ key, label }) => (
          <Link key={key} href={`/admin/settings?tab=${key}`} style={{
            fontSize: "12.5px", fontWeight: activeTab === key ? 600 : 400,
            color: activeTab === key ? "#111110" : "#8a8a84",
            textDecoration: "none", padding: "8px 16px 12px",
            borderBottom: activeTab === key ? "2px solid #111110" : "2px solid transparent",
            marginBottom: "-1px", letterSpacing: "0.3px",
          }}>
            {label}
          </Link>
        ))}
      </div>

      {activeTab === "password" && (
        <>
          {params.success && (
            <div style={{ background: "#eaf6f0", border: "1px solid #b8dfc8", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", color: "#3a7a50", marginBottom: "20px" }}>
              Password updated successfully.
            </div>
          )}
          {params.error && (
            <div style={{ background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.25)", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", color: "#c0392b", marginBottom: "20px" }}>
              {errorMsg[params.error] ?? "Something went wrong."}
            </div>
          )}
          <form action={changePassword}>
            <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "28px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                { name: "current", label: "Current Password" },
                { name: "next", label: "New Password" },
                { name: "confirm", label: "Confirm New Password" },
              ].map(({ name, label }) => (
                <div key={name}>
                  <label style={{ fontSize: "11px", color: "#5a5a54", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px", display: "block", fontWeight: 500 }}>{label}</label>
                  <input name={name} type="password" required style={{ width: "100%", padding: "10px 12px", fontSize: "13px", color: "#111110", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "6px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
              ))}
              <button type="submit" style={{ marginTop: "4px", padding: "11px", background: "#111110", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Update Password
              </button>
            </div>
          </form>
        </>
      )}

      {activeTab === "connections" && (
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "48px 40px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>API CONNECTIONS</div>
          <div style={{ fontSize: "13px", color: "#8a8a84" }}>Coming soon — manage GHL, Apify, and MLS/Monsoon connections here.</div>
        </div>
      )}

      {activeTab === "billing" && (
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "48px 40px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>BILLING</div>
          <div style={{ fontSize: "13px", color: "#8a8a84" }}>Coming soon.</div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Verify in browser**

Log in and open `http://localhost:3000/admin/settings`. Confirm the Password tab is selected by default and the form works (test with your real admin password — a correct current + matching new + confirm should redirect back with a success banner; a wrong current password should show the "incorrect" error). Click "API Connections" and "Billing" — confirm both show their placeholder text.

- [ ] **Step 5: Commit**

```bash
git add "app/admin/(protected)/settings"
git commit -m "Add /admin/settings route with Password, API Connections, Billing tabs"
```

---

## Task 15: Redirect old /admin/password

**Files:**
- Modify: `app/admin/(protected)/password/page.tsx` (becomes a redirect stub — its real content moved to Task 14)

- [ ] **Step 1: Replace the password page with a redirect**

Replace the full contents of `app/admin/(protected)/password/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function PasswordRedirect() {
  redirect("/admin/settings?tab=password");
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Verify redirect**

```bash
curl -sI "http://localhost:3000/admin/password" | grep -i location
```

Expected: `location: /admin/settings?tab=password`.

- [ ] **Step 4: Commit**

```bash
git add "app/admin/(protected)/password/page.tsx"
git commit -m "Redirect old /admin/password to /admin/settings"
```

---

## Task 16: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Full type check and lint**

```bash
npx tsc --noEmit
pnpm lint
```

Expected: both clean.

- [ ] **Step 2: Full production build**

```bash
pnpm build
```

Expected: build succeeds. This is the strongest single check available in this repo (Next.js type-checks every route and Prisma-generates the client as part of `build`).

- [ ] **Step 3: Manual checklist against the spec's rollout section**

Log into `http://localhost:3000/admin/login` and, in the browser, confirm every item from the spec's "Rollout / verification" section:

- [ ] All six sidebar links resolve and highlight correctly as active: Search, CRM, Dialer, Offers, Agreements, Settings.
- [ ] `/admin/acquisitions` redirects to `/admin/search`; `/admin/acquisitions?tab=machine` redirects to `/admin/offers`.
- [ ] `/admin/templates` redirects to `/admin/agreements?tab=templates`; `/admin/templates/cash_offer` redirects to `/admin/agreements/templates/cash_offer`.
- [ ] `/admin/password` redirects to `/admin/settings?tab=password`.
- [ ] Agreements/Templates sub-tabs render and switch correctly at `/admin/agreements`.
- [ ] Settings sub-tabs (Password, API Connections, Billing) render and switch correctly at `/admin/settings`.
- [ ] Mobile drawer (resize browser to ~390px wide) opens/closes and lists all six items; the old floating "+" quick-add button is gone.
- [ ] Profile dropdown (top-right avatar) no longer shows "Change Password"; still shows Contacts, Leads, Sign Out.

- [ ] **Step 4: Final commit (only if Step 3 turned up fixes)**

If everything in Step 3 passed with no code changes, there's nothing to commit here. If you had to fix anything, commit it with a message describing the specific fix.
