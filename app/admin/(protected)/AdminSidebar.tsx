"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

export default function AdminSidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  const navItems = role === "caller" ? NAV_ITEMS.filter((item) => item.href === "/admin/dialer") : NAV_ITEMS;

  return (
    <aside
      className="admin-sidebar"
      style={{
        width: "88px",
        flexShrink: 0,
        background: "#111110",
        minHeight: "calc(100vh - 56px)",
        position: "sticky",
        top: "56px",
        alignSelf: "flex-start",
      }}
    >
      <nav className="flex flex-col items-center gap-2 py-4">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} title={label} className="group flex w-full flex-col items-center gap-1 py-1">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-md transition-all duration-150 ${
                  active
                    ? "bg-white text-black shadow-[0_2px_10px_rgba(0,0,0,0.35)]"
                    : "text-white/50 group-hover:bg-white/10 group-hover:text-white"
                }`}
              >
                {icon(18)}
              </span>
              <span
                className={`text-[9px] font-semibold uppercase tracking-wide ${
                  active ? "text-white" : "text-white/40 group-hover:text-white/70"
                }`}
              >
                {label === "Our Buyers" ? "Buyers" : label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
