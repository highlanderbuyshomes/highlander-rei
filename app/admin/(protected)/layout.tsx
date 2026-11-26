import type { Metadata } from "next";
import { deleteSession, getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { AdminMenu, ProfileMenu, RefreshButton } from "./AdminNav";

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
    <>
      <header className="hl-header">
        <AdminMenu role={role} />
        <div className="hl-header-actions">
          <RefreshButton />
          <ProfileMenu logoutAction={logout} role={role} />
        </div>
      </header>
      <div className="admin-content-wrap">{children}</div>
    </>
  );
}
