import type { Metadata } from "next";
import Link from "next/link";
import { deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";
import AdminProfileMenu from "./AdminProfileMenu";
import AdminMobileNav from "./AdminMobileNav";

export const metadata: Metadata = { title: "Highlander REI — Admin" };

async function logout() {
  "use server";
  await deleteSession();
  redirect("/admin/login");
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navLinks = [
    { href: "/admin/acquisitions", label: "Acquisitions", icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    )},
    { href: "/admin/agreements", label: "Agreements", icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    )},
    { href: "/admin/templates", label: "Templates", icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    )},
    { href: "/admin/contacts", label: "Contacts", icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    )},
    { href: "/admin/leads", label: "Leads", icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    )},
  ];

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
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          <span className="admin-brand" style={{ fontFamily: "var(--font-display), serif", fontSize: "17px", letterSpacing: "3px", color: "#111110" }}>
            HIGHLANDER REI
          </span>
          <nav className="admin-nav" style={{ display: "flex", gap: "2px" }}>
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href} style={{
                fontSize: "12.5px", color: "#8a8a84",
                textDecoration: "none", padding: "6px 14px",
                borderRadius: "5px", letterSpacing: "0.3px",
              }}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <AdminProfileMenu logoutAction={logout} />
      </header>

      <div className="admin-content-wrap" style={{ background: "#f8f7f4", minHeight: "calc(100vh - 56px)" }}>
        {children}
      </div>

      <AdminMobileNav />
    </div>
  );
}
