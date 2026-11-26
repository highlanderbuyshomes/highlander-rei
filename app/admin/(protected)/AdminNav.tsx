"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import AdminBrand from "./AdminBrand";
import { Icon, activeNavItem, navItemsFor } from "./nav-items";

/** Open state for a popover that closes on outside click, Escape, or navigation. */
function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  return { open, setOpen, ref };
}

/** Menu button, wordmark and current page — the left side of every admin header. */
export function AdminMenu({ role }: { role?: string }) {
  const pathname = usePathname();
  const { open, setOpen, ref } = usePopover();
  const items = navItemsFor(role);
  const current = activeNavItem(pathname);

  return (
    <div ref={ref} className="hl-nav">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open} className={`hl-icon-btn${open ? " is-on" : ""}`}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path className={`hl-burger-top${open ? " is-open" : ""}`} d="M4 7h16" />
          <path className={`hl-burger-mid${open ? " is-open" : ""}`} d="M4 12h16" />
          <path className={`hl-burger-bot${open ? " is-open" : ""}`} d="M4 17h16" />
        </svg>
      </button>
      <Link href={role === "caller" ? "/admin/dialer" : "/admin/dashboard"} className="admin-brand" aria-label="Highlander REI home">
        <AdminBrand />
      </Link>
      {current && <span className="hl-page-name">{current.label}</span>}

      {open && (
        <nav className="hl-panel hl-panel-left" aria-label="Admin navigation">
          {items.map((item) => {
            const on = item === current;
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={on ? "page" : undefined} className={`hl-item${on ? " is-on" : ""}`}>
                <span className="hl-tile"><Icon>{item.icon}</Icon></span>
                <span>{item.label}</span>
                {on && <span className="hl-dot" />}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}

/** Re-renders the current page with fresh server data. */
export function RefreshButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button type="button" onClick={() => start(() => router.refresh())} disabled={pending} title="Refresh" aria-label="Refresh" className="hl-icon-btn">
      <svg viewBox="0 0 24 24" width="19" height="19" className={pending ? "hl-spin" : undefined} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <path d="M21 3v6h-6" />
      </svg>
    </button>
  );
}

export function ProfileMenu({ logoutAction, role }: { logoutAction: () => Promise<void>; role?: string }) {
  const { open, setOpen, ref } = usePopover();
  return (
    <div ref={ref} className="hl-nav">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Account" className={`hl-avatar-btn${open ? " is-on" : ""}`}>
        <span className="hl-avatar">HL</span>
      </button>
      {open && (
        <div className="hl-panel hl-panel-right">
          <div className="hl-panel-head">
            <span>Signed in as</span>
            <strong>{role === "caller" ? "Caller" : "Admin"}</strong>
          </div>
          <div className="hl-sep" />
          <form action={logoutAction}>
            <button type="submit" className="hl-item">
              <span className="hl-tile">
                <Icon>
                  <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
                  <path d="M10 17l-5-5 5-5M5 12h11" />
                </Icon>
              </span>
              <span>Sign out</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
