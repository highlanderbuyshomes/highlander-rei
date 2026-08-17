"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

export default function AdminMobileNav({
  logoutAction,
  role,
}: {
  logoutAction: () => Promise<void>;
  role?: string;
}) {
  const navItems = role === "caller" ? NAV_ITEMS.filter((item) => item.href === "/admin/dialer") : NAV_ITEMS;
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
              <Link href={role === "caller" ? "/admin/dialer" : "/admin/dashboard"} onClick={() => setOpen(false)} className="admin-brand" style={{ fontFamily: "var(--font-display), serif", fontSize: "15px", letterSpacing: "3px", color: "#111110", textDecoration: "none" }}>
                HIGHLANDER REI
              </Link>
              <button onClick={() => setOpen(false)} aria-label="Close navigation" style={{ background: "none", border: "none", color: "#8a8a84", cursor: "pointer", padding: "4px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {navItems.map(({ href, label, icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link key={href} href={href} onClick={() => setOpen(false)} className={active ? "active" : ""}>
                  {icon(20)}
                  <span>{label}</span>
                </Link>
              );
            })}

            {role !== "caller" && (
              <>
                <div className="admin-mobile-drawer-divider" />

                <Link href="/admin/contacts" onClick={() => setOpen(false)}>
                  <span>Contacts</span>
                </Link>
                <Link href="/admin/leads" onClick={() => setOpen(false)}>
                  <span>Leads</span>
                </Link>
              </>
            )}

            <form action={logoutAction}>
              <button type="submit" className="admin-mobile-drawer-signout">
                Sign Out
              </button>
            </form>
          </nav>
        </div>
      )}
    </>
  );
}
