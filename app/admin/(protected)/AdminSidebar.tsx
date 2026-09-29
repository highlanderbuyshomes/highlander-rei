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
        width: "64px",
        flexShrink: 0,
        background: "#2478c5",
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
            <Link key={href} href={href} title={label} aria-label={label} aria-current={active ? "page" : undefined} className="group flex w-full flex-col items-center gap-1 py-1">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-md transition-all duration-150 ${
                  active
                    ? "bg-white text-black shadow-sm"
                    : "text-white group-hover:bg-white/15 group-hover:text-white"
                }`}
              >
                {icon(18)}
              </span>

            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
