import type { ReactNode } from "react";

export type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

// 24px stroke icons, drawn for Icon() below (stroke 1.8, round caps).
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: (
      <>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </>
    ),
  },
  {
    href: "/admin/search",
    label: "Deal Search",
    icon: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m20 20-4.6-4.6" />
        <path d="M7.5 11 10.5 8.3 13.5 11M8.7 10v2.8h3.6V10" />
      </>
    ),
  },
  {
    href: "/admin/dialer",
    label: "Dialer",
    icon: (
      <path d="M21 16.4v2.9a1.9 1.9 0 0 1-2.1 1.9 18.8 18.8 0 0 1-8.2-2.9 18.5 18.5 0 0 1-5.7-5.7A18.8 18.8 0 0 1 2.1 4.4 1.9 1.9 0 0 1 4 2.3h2.9a1.9 1.9 0 0 1 1.9 1.6c.1.9.4 1.8.7 2.7a1.9 1.9 0 0 1-.4 2L7.8 9.8a15.2 15.2 0 0 0 5.7 5.7l1.2-1.2a1.9 1.9 0 0 1 2-.4c.9.3 1.8.6 2.7.7a1.9 1.9 0 0 1 1.6 1.8Z" />
    ),
  },
  {
    href: "/admin/offers",
    label: "Offers",
    icon: (
      <>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9v11h14V9" />
        <circle cx="12" cy="13.5" r="2" />
        <path d="M12 15.5V18" />
      </>
    ),
  },
  {
    href: "/admin/buyers",
    label: "Our Buyers",
    icon: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
        <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.3a6.5 6.5 0 0 1 3.5 5.7" />
      </>
    ),
  },
  {
    href: "/admin/agreements",
    label: "Agreements",
    icon: (
      <>
        <path d="M15.5 4.5 19.5 8.5 9 19H5v-4Z" />
        <path d="M13 7l4 4" />
        <path d="M3 21h18" />
      </>
    ),
  },
  {
    href: "/admin/contacts",
    label: "Contacts",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10.5" r="2.3" />
        <path d="M5.5 16.5a3.6 3.6 0 0 1 7 0M15 9.5h3M15 13h3" />
      </>
    ),
  },
  {
    href: "/admin/leads",
    label: "Leads",
    icon: (
      <>
        <path d="M3 5h18l-7 8.5V19l-4 2v-7.5Z" />
      </>
    ),
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: (
      <>
        <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
        <circle cx="16" cy="7" r="2.2" />
        <circle cx="10" cy="17" r="2.2" />
      </>
    ),
  },
];

export function navItemsFor(role?: string) {
  return role === "caller" ? NAV_ITEMS.filter((item) => item.href === "/admin/dialer") : NAV_ITEMS;
}

export function activeNavItem(pathname: string) {
  return NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
}

export function Icon({ children, size = 18 }: { children: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
