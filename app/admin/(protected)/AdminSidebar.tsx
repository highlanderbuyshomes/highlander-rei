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
        background: "#ffffff",
        minHeight: "calc(100vh - 56px)",
        position: "sticky",
        top: "56px",
        alignSelf: "flex-start",
        borderRight: "1px solid #e2e8f0",
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
                    ? "bg-blue-50 text-blue-600 ring-1 ring-blue-100"
                    : "text-blue-500 group-hover:bg-blue-50 group-hover:text-blue-700"
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
