import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Buy | Highlander REI",
  description:
    "Find your next home, source an investment property, or partner with Highlander REI on a real estate flip in Phoenix, AZ or Dallas, TX.",
};

const paths = [
  {
    tag: "Partner with us",
    title: "Invest With Us",
    body: "Partner with Highlander on real estate flips in Phoenix and Dallas. We source the deal, run the rehab, manage the sale — you put in the capital and earn a share of the profits.",
    points: [
      "We handle every step of execution",
      "Active markets: Phoenix & Dallas",
      "Earn a profit split at closing",
      "Full transparency via investor portal",
      "Joint venture structure — you know what you own",
    ],
    cta: "Learn About Investing",
    href: "/invest",
    color: "var(--blue)",
    colorLight: "var(--blue-light)",
    colorBorder: "var(--blue-border)",
  },
  {
    tag: "Source a deal",
    title: "Investment Property",
    body: "Looking to buy and hold, BRRRR, or flip on your own? We source off-market deals in Phoenix and Dallas and can connect you with the right property.",
    points: [
      "Off-market deal access",
      "Phoenix and Dallas markets",
      "Single-family and multi-family",
      "Distressed, value-add, and turnkey",
      "Our network, your strategy",
    ],
    cta: "Find Investment Properties",
    href: "/buy/investment-property",
    color: "var(--charcoal)",
    colorLight: "var(--off-white)",
    colorBorder: "var(--border-mid)",
  },
  {
    tag: "Primary residence",
    title: "Find a Home",
    body: "Relocating to Phoenix or Dallas? We know these markets inside and out. We can connect you with trusted agents and off-market inventory to find your next home.",
    points: [
      "Phoenix and Dallas market expertise",
      "Access to off-market listings",
      "Connections to trusted buyer's agents",
      "No pressure — just good information",
      "New construction and resale options",
    ],
    cta: "Start Your Home Search",
    href: "/buy/find-home",
    color: "var(--charcoal)",
    colorLight: "var(--off-white)",
    colorBorder: "var(--border-mid)",
  },
];

export default function BuyPage() {
  return (
    <>
      {/* ── HEADER ───────────────────────────────────────────── */}
      <section style={{ background: "var(--off-white)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="section" style={{ paddingBottom: "64px", textAlign: "center" }}>
          <span className="section-label">What Are You Looking For?</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(44px, 7vw, 80px)", color: "var(--black)", letterSpacing: "3px", lineHeight: 0.95, textTransform: "uppercase", marginBottom: "22px" }}>
            BUY. INVEST.<br />BUILD WEALTH.
          </h1>
          <p style={{ fontSize: "17px", color: "var(--mid)", maxWidth: "520px", margin: "0 auto", lineHeight: 1.8, fontWeight: 300 }}>
            Whether {"you're"} finding your next home, sourcing a deal, or looking for a passive partner — {"we've"} got a path for you.
          </p>
        </div>
      </section>

      {/* ── THREE OPTIONS ─────────────────────────────────────── */}
      <section style={{ background: "var(--white)" }}>
        <div className="section">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {paths.map((p) => (
              <div key={p.title} style={{ background: p.colorLight, border: `1px solid ${p.colorBorder}`, borderRadius: "var(--radius)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ height: "4px", background: p.color }} />
                <div style={{ padding: "28px 26px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, color: p.color, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "14px" }}>{p.tag}</div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "28px", color: "var(--black)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "14px" }}>{p.title}</h2>
                  <p style={{ fontSize: "13.5px", color: "var(--mid)", lineHeight: 1.8, marginBottom: "20px" }}>{p.body}</p>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px", flex: 1 }}>
                    {p.points.map((pt) => (
                      <li key={pt} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: "var(--mid)" }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: "1px" }}>
                          <circle cx="8" cy="8" r="7.5" fill="white" />
                          <path d="M5 8l2.2 2.2 3.8-3.8" stroke={p.color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {pt}
                      </li>
                    ))}
                  </ul>
                  <Link href={p.href} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13.5px", fontWeight: 600, color: p.color, textDecoration: "none" }}>
                    {p.cta} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARKETS ──────────────────────────────────────────── */}
      <section style={{ background: "var(--near-black)" }}>
        <div className="section">
          <div style={{ textAlign: "center", marginBottom: "44px" }}>
            <span className="section-label" style={{ color: "rgba(255,255,255,0.35)" }}>Where We Operate</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", color: "var(--white)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>
              Active Markets
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", maxWidth: "760px", margin: "0 auto" }}>
            {[
              { city: "Phoenix", state: "AZ", body: "Maricopa County and surrounding areas. One of the highest-velocity residential markets in the U.S. — strong appreciation and consistent buyer demand." },
              { city: "Dallas", state: "TX", body: "DFW Metroplex. A deep, liquid market with strong job growth, favorable margins on value-add properties, and a steady pipeline of buyers." },
            ].map((m) => (
              <div key={m.city} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "var(--radius)", padding: "28px" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "12px" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "44px", color: "var(--white)", letterSpacing: "2px", lineHeight: 1 }}>{m.city}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: "var(--blue)", letterSpacing: "2px", lineHeight: 1.3 }}>{m.state}</span>
                </div>
                <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.45)", lineHeight: 1.8 }}>{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
