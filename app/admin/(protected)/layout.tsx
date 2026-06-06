import type { Metadata } from "next";
import Link from "next/link";
import { deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";
import AdminProfileMenu from "./AdminProfileMenu";

export const metadata: Metadata = { title: "Highlander REI — Admin" };

async function logout() {
  "use server";
  await deleteSession();
  redirect("/admin/login");
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#111110", fontFamily: "var(--font-body), system-ui, sans-serif" }}>
      <header className="admin-header" style={{
        background: "#111110",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
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
          <span className="admin-brand" style={{ fontFamily: "var(--font-display), serif", fontSize: "17px", letterSpacing: "3px", color: "#f5f4f0" }}>
            HIGHLANDER REI
          </span>
          <nav className="admin-nav" style={{ display: "flex", gap: "2px" }}>
            {[
              { href: "/admin/agreements", label: "Agreements" },
              { href: "/admin/templates", label: "Templates" },
              { href: "/admin/contacts", label: "Contacts" },
              { href: "/admin/leads", label: "Leads" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} style={{
                fontSize: "12.5px", color: "rgba(255,255,255,0.55)",
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

      <div style={{ background: "#f5f4f0", minHeight: "calc(100vh - 56px)" }}>
        {children}
      </div>
    </div>
  );
}
