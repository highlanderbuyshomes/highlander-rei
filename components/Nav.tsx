"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const buyItems = [
  {
    href: "/invest",
    label: "Invest With Us",
    desc: "Partner on a flip, earn a profit split at closing",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 12L6 8l3 3 5-6" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/buy/investment-property",
    label: "Investment Property",
    desc: "Off-market deals in Phoenix & Dallas",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="7" width="12" height="8" rx="1" stroke="var(--blue)" strokeWidth="1.5" />
        <path d="M1 7l7-5 7 5" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/buy/find-home",
    label: "Find a Home",
    desc: "Trusted agents & off-market listings in PHX + DFW",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="7" cy="7" r="4.5" stroke="var(--blue)" strokeWidth="1.5" />
        <path d="M11 11l3 3" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);

  const sellActive = pathname.startsWith("/sell");
  const buyActive = pathname.startsWith("/buy") || pathname.startsWith("/invest");

  return (
    <>
      <nav className="site-nav">
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "24px", color: "var(--black)", letterSpacing: "3px", lineHeight: 1 }}>
            HIGHLANDER REI
          </span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "28px", color: "var(--blue)", lineHeight: "0.65", marginLeft: "2px" }}>.</span>
        </Link>

        <div className="nav-links">
          <Link
            href="/sell"
            className="nav-link"
            data-active={sellActive ? "true" : undefined}
          >
            Sell
          </Link>

          {/* Buy with dropdown */}
          <div
            className="nav-dropdown-wrapper"
            onMouseEnter={() => setBuyOpen(true)}
            onMouseLeave={() => setBuyOpen(false)}
          >
            <Link
              href="/buy"
              className="nav-link"
              data-active={buyActive ? "true" : undefined}
              style={{ display: "flex", alignItems: "center", gap: "4px" }}
            >
              Buy
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                style={{ marginTop: "1px", transition: "transform 0.15s", transform: buyOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            <div className="nav-dropdown" style={{ opacity: buyOpen ? 1 : 0, pointerEvents: buyOpen ? "auto" : "none", transform: buyOpen ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(-6px)" }}>
              {buyItems.map((item, i) => (
                <div key={item.href}>
                  <Link href={item.href} className="nav-dropdown-item" onClick={() => setBuyOpen(false)}>
                    <div className="nav-dropdown-icon">{item.icon}</div>
                    <div>
                      <span className="nav-dropdown-label">{item.label}</span>
                      <span className="nav-dropdown-desc">{item.desc}</span>
                    </div>
                  </Link>
                  {i < buyItems.length - 1 && <div className="nav-dropdown-divider" />}
                </div>
              ))}
            </div>
          </div>

          <div style={{ width: "1px", height: "18px", background: "var(--border-mid)" }} />
          <Link href="/sell" className="btn-blue" style={{ padding: "8px 18px", fontSize: "13px" }}>
            Get Started
          </Link>
        </div>

        <button className="mobile-menu-btn" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <>
                <line x1="4" y1="4" x2="18" y2="18" />
                <line x1="18" y1="4" x2="4" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="19" y2="6" />
                <line x1="3" y1="11" x2="19" y2="11" />
                <line x1="3" y1="16" x2="19" y2="16" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div style={{ background: "var(--white)", borderBottom: "1px solid var(--border-light)", padding: "8px 20px 20px", display: "flex", flexDirection: "column", position: "sticky", top: "68px", zIndex: 99 }}>
          <Link
            href="/sell"
            onClick={() => setOpen(false)}
            style={{ fontSize: "15px", fontWeight: sellActive ? 600 : 400, color: sellActive ? "var(--black)" : "var(--mid)", padding: "13px 0", textDecoration: "none", borderBottom: "1px solid var(--border-light)" }}
          >
            Sell
          </Link>

          {/* Buy section with sub-items */}
          <div style={{ borderBottom: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "15px", fontWeight: buyActive ? 600 : 400, color: buyActive ? "var(--black)" : "var(--mid)", padding: "13px 0 8px" }}>
              Buy
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", paddingBottom: "12px" }}>
              {buyItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "8px", textDecoration: "none", background: pathname === item.href ? "var(--blue-light)" : "transparent" }}
                >
                  <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "var(--blue-light)", border: "1px solid var(--blue-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--near-black)" }}>{item.label}</div>
                    <div style={{ fontSize: "11.5px", color: "var(--muted)" }}>{item.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <Link href="/sell" onClick={() => setOpen(false)} className="btn-blue" style={{ marginTop: "12px", justifyContent: "center" }}>
            Get Started
          </Link>
        </div>
      )}
    </>
  );
}
