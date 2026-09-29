import type { Metadata } from "next";
import Link from "next/link";
import { deleteSession, getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import AdminProfileMenu from "./AdminProfileMenu";
import AdminMobileNav from "./AdminMobileNav";
import AdminSidebar from "./AdminSidebar";
import AdminBrand from "./AdminBrand";

export const metadata: Metadata = { title: "Highlander REI — Admin" };

async function logout() {
  "use server";
  await deleteSession();
  redirect("/admin/login");
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  // Callers (VAs) only get the Dialer link — everything else here is
  // admin-only and would just bounce them back to login if they clicked it.
  const role = session?.role;

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "var(--font-body), system-ui, sans-serif" }}>
      <header className="admin-header" style={{
        background: "#2478c5",
        padding: "0 28px 0 0",
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <Link href={role === "caller" ? "/admin/dialer" : "/admin/dashboard"} className="admin-brand" aria-label="Highlander REI home">
          <AdminBrand />
        </Link>
        <AdminProfileMenu logoutAction={logout} />
      </header>

      <div style={{ display: "flex" }}>
        <AdminSidebar role={role} />
        <div className="admin-content-wrap" style={{ background: "#f2f5f8", minHeight: "calc(100vh - 56px)", flex: 1, minWidth: 0 }}>
          {children}
        </div>
      </div>

      <AdminMobileNav logoutAction={logout} role={role} />
    </div>
  );
}
