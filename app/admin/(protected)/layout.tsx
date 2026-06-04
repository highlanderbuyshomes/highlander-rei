import type { Metadata } from "next";
import Link from "next/link";
import { deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Highlander REI — Admin" };

async function logout() {
  "use server";
  await deleteSession();
  redirect("/admin/login");
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#111110", fontFamily: "var(--font-body), system-ui, sans-serif" }}>
      {/* Top bar */}
      <header style={{
        background: "#111110",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "0 32px",
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <span style={{ fontFamily: "var(--font-display), serif", fontSize: "17px", letterSpacing: "3px", color: "#f5f4f0" }}>
            HIGHLANDER REI
          </span>
          <nav style={{ display: "flex", gap: "2px" }}>
            <Link href="/admin/agreements" style={{
              fontSize: "12.5px",
              color: "rgba(255,255,255,0.55)",
              textDecoration: "none",
              padding: "6px 14px",
              borderRadius: "5px",
              letterSpacing: "0.3px",
            }}>
              Agreements
            </Link>
          </nav>
        </div>
        <form action={logout}>
          <button type="submit" style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.45)",
            padding: "5px 14px",
            borderRadius: "6px",
            fontSize: "12px",
            cursor: "pointer",
            letterSpacing: "0.3px",
            fontFamily: "inherit",
          }}>
            Log out
          </button>
        </form>
      </header>

      {/* Content area — light so white cards render correctly */}
      <div style={{ background: "#f5f4f0", minHeight: "calc(100vh - 56px)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
