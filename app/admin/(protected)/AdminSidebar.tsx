"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

export default function AdminSidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  const navItems = role === "caller" ? NAV_ITEMS.filter((item) => item.href === "/admin/dialer") : NAV_ITEMS;

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
      {navItems.map(({ href, label, icon }) => {
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
            <span style={{ display: "flex", opacity: active ? 1 : 0.7 }}>{icon(18)}</span>
            {label}
          </Link>
        );
      })}
    </aside>
  );
}
