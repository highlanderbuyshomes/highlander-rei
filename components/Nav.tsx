"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef } from "react";
import LangToggle from "@/components/LangToggle";
import { useLanguage } from "@/lib/LanguageContext";

const cashIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.5" stroke="var(--blue)" strokeWidth="1.5" />
    <path d="M8 4.5v7M5.5 6.5C5.5 5.4 6.6 5 8 5s2.5.8 2.5 1.8c0 2.2-5 1.8-5 4 0 1.1 1.1 1.7 2.5 1.7s2.5-.6 2.5-1.7" stroke="var(--blue)" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);
const flexIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 13l4-4 3 2 5-7" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11 3h3v3" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const investIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 12L6 8l3 3 5-6" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const propertyIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="7" width="12" height="8" rx="1" stroke="var(--blue)" strokeWidth="1.5" />
    <path d="M1 7l7-5 7 5" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const findIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="7" cy="7" r="4.5" stroke="var(--blue)" strokeWidth="1.5" />
    <path d="M11 11l3 3" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

type NavItem = { href: string; label: string; desc: string; icon: React.ReactNode };

function getSellItems(lang: string): NavItem[] {
  return lang === "es"
    ? [
        { href: "/sell/cash", label: "Oferta en Efectivo", desc: "Cierra en tan solo 7 días — sin reparaciones ni comisiones", icon: cashIcon },
        { href: "/sell/flex", label: "Programa Flex Equity", desc: "Reparamos, amoblamos y listamos — tú te quedas con las ganancias", icon: flexIcon },
      ]
    : [
        { href: "/sell/cash", label: "Cash Offer", desc: "Close in as little as 7 days — no repairs, no fees", icon: cashIcon },
        { href: "/sell/flex", label: "Flex Equity Program", desc: "We repair, stage & list — you keep the upside", icon: flexIcon },
      ];
}

function getBuyItems(lang: string): NavItem[] {
  return lang === "es"
    ? [
        { href: "/invest", label: "Invertir Con Nosotros", desc: "Asóciate en un flip, gana parte de las ganancias al cierre", icon: investIcon },
        { href: "/buy/investment-property", label: "Propiedad de Inversión", desc: "Tratos fuera del mercado en Phoenix y Dallas", icon: propertyIcon },
        { href: "/buy/find-home", label: "Encontrar una Casa", desc: "Agentes de confianza y listados fuera del mercado en PHX + DFW", icon: findIcon },
      ]
    : [
        { href: "/invest", label: "Invest With Us", desc: "Partner on a flip, earn a profit split at closing", icon: investIcon },
        { href: "/buy/investment-property", label: "Investment Property", desc: "Off-market deals in Phoenix & Dallas", icon: propertyIcon },
        { href: "/buy/find-home", label: "Find a Home", desc: "Trusted agents & off-market listings in PHX + DFW", icon: findIcon },
      ];
}

function DropdownItems({ items, onClose }: { items: NavItem[]; onClose: () => void }) {
  return (
    <>
      {items.map((item, i) => (
        <div key={item.href}>
          <Link href={item.href} className="nav-dropdown-item" onClick={onClose}>
            <div className="nav-dropdown-icon">{item.icon}</div>
            <div>
              <span className="nav-dropdown-label">{item.label}</span>
              <span className="nav-dropdown-desc">{item.desc}</span>
            </div>
          </Link>
          {i < items.length - 1 && <div className="nav-dropdown-divider" />}
        </div>
      ))}
    </>
  );
}

function MobileSubItems({ items, pathname, onClose }: { items: NavItem[]; pathname: string; onClose: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px", paddingBottom: "12px" }}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClose}
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
  );
}

export default function Nav() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const [agentsOpen, setAgentsOpen] = useState(false);
  const sellTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const buyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const agentsTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const sellItems = getSellItems(lang);
  const buyItems = getBuyItems(lang);

  const sellActive = pathname.startsWith("/sell");
  const buyActive = pathname.startsWith("/buy") || pathname.startsWith("/invest");

  const openSell = () => { clearTimeout(sellTimer.current); setSellOpen(true); };
  const closeSell = () => { sellTimer.current = setTimeout(() => setSellOpen(false), 200); };
  const openBuy = () => { clearTimeout(buyTimer.current); setBuyOpen(true); };
  const closeBuy = () => { buyTimer.current = setTimeout(() => setBuyOpen(false), 200); };
  const openAgents = () => { clearTimeout(agentsTimer.current); setAgentsOpen(true); };
  const closeAgents = () => { agentsTimer.current = setTimeout(() => setAgentsOpen(false), 200); };

  const chevron = (isOpen: boolean) => (
    <svg
      width="12" height="12" viewBox="0 0 12 12" fill="none"
      style={{ marginTop: "1px", transition: "transform 0.15s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <>
      <nav className="site-nav">
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "24px", color: "var(--black)", letterSpacing: "3px", lineHeight: 1 }}>
            HIGHLANDER REI
          </span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "28px", color: "var(--blue)", lineHeight: "0.65", marginLeft: "2px" }}>.</span>
        </Link>

        {/* Centered nav links */}
        <div className="nav-center">
          {/* Sell dropdown */}
          <div className="nav-dropdown-wrapper" onMouseEnter={openSell} onMouseLeave={closeSell}>
            <Link
              href="/sell"
              className="nav-link"
              data-active={sellActive ? "true" : undefined}
              style={{ display: "flex", alignItems: "center", gap: "4px" }}
            >
              {lang === "es" ? "Vender" : "Sell"} {chevron(sellOpen)}
            </Link>
            <div className="nav-dropdown" style={{ opacity: sellOpen ? 1 : 0, pointerEvents: sellOpen ? "auto" : "none", transform: sellOpen ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(-6px)" }}>
              <DropdownItems items={sellItems} onClose={() => setSellOpen(false)} />
            </div>
          </div>

          {/* Buy dropdown */}
          <div className="nav-dropdown-wrapper" onMouseEnter={openBuy} onMouseLeave={closeBuy}>
            <Link
              href="/buy"
              className="nav-link"
              data-active={buyActive ? "true" : undefined}
              style={{ display: "flex", alignItems: "center", gap: "4px" }}
            >
              {lang === "es" ? "Comprar" : "Buy"} {chevron(buyOpen)}
            </Link>
            <div className="nav-dropdown" style={{ opacity: buyOpen ? 1 : 0, pointerEvents: buyOpen ? "auto" : "none", transform: buyOpen ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(-6px)" }}>
              <DropdownItems items={buyItems} onClose={() => setBuyOpen(false)} />
            </div>
          </div>
          {/* Agents dropdown */}
          <div className="nav-dropdown-wrapper" onMouseEnter={openAgents} onMouseLeave={closeAgents}>
            <button
              className="nav-link"
              style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
            >
              {lang === "es" ? "Agentes" : "Agents"} {chevron(agentsOpen)}
            </button>
            <div className="nav-dropdown" style={{ opacity: agentsOpen ? 1 : 0, pointerEvents: agentsOpen ? "auto" : "none", transform: agentsOpen ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(-6px)" }}>
              <a
                href="https://highlanderbuyshomes.com/for-agents-and-wholesalers"
                target="_blank"
                rel="noreferrer"
                className="nav-dropdown-item"
                onClick={() => setAgentsOpen(false)}
              >
                <div className="nav-dropdown-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 13h12M8 3v7M5 6l3-3 3 3" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <span className="nav-dropdown-label">{lang === "es" ? "Enviar un Trato" : "Submit a Deal"}</span>
                  <span className="nav-dropdown-desc">{lang === "es" ? "Agentes y mayoristas — obtengan una oferta en efectivo" : "Agents & wholesalers — get a cash offer fast"}</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Right-side language toggle */}
        <div className="nav-right">
          <LangToggle />
        </div>

        <button className="mobile-menu-btn" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <><line x1="4" y1="4" x2="18" y2="18" /><line x1="18" y1="4" x2="4" y2="18" /></>
            ) : (
              <><line x1="3" y1="6" x2="19" y2="6" /><line x1="3" y1="11" x2="19" y2="11" /><line x1="3" y1="16" x2="19" y2="16" /></>
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div style={{ background: "var(--white)", borderBottom: "1px solid var(--border-light)", padding: "8px 20px 20px", display: "flex", flexDirection: "column", position: "sticky", top: "68px", zIndex: 99 }}>
          <div style={{ borderBottom: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "15px", fontWeight: sellActive ? 600 : 400, color: sellActive ? "var(--black)" : "var(--mid)", padding: "13px 0 8px" }}>
              {lang === "es" ? "Vender" : "Sell"}
            </div>
            <MobileSubItems items={sellItems} pathname={pathname} onClose={() => setOpen(false)} />
          </div>
          <div style={{ borderBottom: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "15px", fontWeight: buyActive ? 600 : 400, color: buyActive ? "var(--black)" : "var(--mid)", padding: "13px 0 8px" }}>
              {lang === "es" ? "Comprar" : "Buy"}
            </div>
            <MobileSubItems items={buyItems} pathname={pathname} onClose={() => setOpen(false)} />
          </div>
          <div style={{ borderBottom: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "15px", fontWeight: 400, color: "var(--mid)", padding: "13px 0 8px" }}>
              {lang === "es" ? "Agentes" : "Agents"}
            </div>
            <div style={{ paddingBottom: "12px" }}>
              <a
                href="https://highlanderbuyshomes.com/for-agents-and-wholesalers"
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "8px", textDecoration: "none" }}
              >
                <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "var(--blue-light)", border: "1px solid var(--blue-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 13h12M8 3v7M5 6l3-3 3 3" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--near-black)" }}>{lang === "es" ? "Enviar un Trato" : "Submit a Deal"}</div>
                  <div style={{ fontSize: "11.5px", color: "var(--muted)" }}>{lang === "es" ? "Agentes y mayoristas — oferta rápida" : "Agents & wholesalers — get a cash offer fast"}</div>
                </div>
              </a>
            </div>
          </div>
          <div style={{ marginTop: "16px", display: "flex", justifyContent: "center" }}>
            <LangToggle />
          </div>
        </div>
      )}
    </>
  );
}
