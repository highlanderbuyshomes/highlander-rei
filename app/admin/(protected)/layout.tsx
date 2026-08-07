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

      <AdminMobileNav logoutAction={logout} />
    </div>
  );
}
