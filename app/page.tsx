import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Highlander REI — Sell, Explore, or Invest in Real Estate",
  description:
    "Sell your home for cash, explore your real estate options, or invest in property flips with Highlander REI in Phoenix, AZ and Dallas, TX.",
};

export default function HomePage() {
  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section style={{ background: "var(--white)", textAlign: "center", padding: "72px 48px 56px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--off-white)", border: "1px solid var(--border-light)", borderRadius: "20px", padding: "5px 14px", marginBottom: "24px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--gold)", flexShrink: 0, display: "inline-block" }} />
          <span style={{ fontSize: "11px", color: "var(--mid)", letterSpacing: "0.8px", fontWeight: 500 }}>Phoenix, AZ · Dallas, TX</span>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(48px, 8vw, 96px)", color: "var(--black)", letterSpacing: "2px", lineHeight: 0.95, textTransform: "uppercase", marginBottom: "20px" }}>
          REAL ESTATE,<br />YOUR WAY.
        </h1>
        <p style={{ fontSize: "17px", color: "var(--mid)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.75, fontWeight: 300 }}>
          Tell us what you{"'"}re trying to do. {"We'll"} show you the path.
        </p>
      </section>

      {/* ── THREE PATH CARDS ──────────────────────────────────── */}
      <div className="path-grid">

        {/* SELL — blue */}
        <Link href="/sell" className="path-card" style={{ background: "var(--blue)", borderRight: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "rgba(255,255,255,0.3)" }} />
          <div style={{ position: "absolute", top: "36px", left: "36px", fontFamily: "var(--font-display)", fontSize: "120px", color: "rgba(255,255,255,0.06)", lineHeight: 1, userSelect: "none" }}>01</div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "14px", background: "rgba(255,255,255,0.1)", padding: "4px 10px", borderRadius: "4px" }}>
              Sell
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 4vw, 56px)", color: "var(--white)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 0.95, marginBottom: "16px" }}>
              GET A CASH<br />OFFER ON<br />YOUR HOME.
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", lineHeight: 1.75, marginBottom: "28px", maxWidth: "320px" }}>
              No repairs, no showings, no agent fees. Get a competitive all-cash offer within 24 hours and close on your timeline.
            </p>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, color: "var(--white)", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "11px 20px", transition: "background 0.15s" }}>
              Get My Offer →
            </span>
          </div>
        </Link>

        {/* EXPLORE — off-white/charcoal */}
        <Link href="/options" className="path-card" style={{ background: "var(--off-white)", borderRight: "1px solid var(--border-light)" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "var(--border-mid)" }} />
          <div style={{ position: "absolute", top: "36px", left: "36px", fontFamily: "var(--font-display)", fontSize: "120px", color: "rgba(0,0,0,0.04)", lineHeight: 1, userSelect: "none" }}>02</div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "14px", background: "rgba(0,0,0,0.06)", padding: "4px 10px", borderRadius: "4px" }}>
              Explore
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 4vw, 56px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 0.95, marginBottom: "16px" }}>
              NOT SURE<br />WHAT{"'"}S<br />RIGHT?
            </h2>
            <p style={{ fontSize: "14px", color: "var(--mid)", lineHeight: 1.75, marginBottom: "28px", maxWidth: "320px" }}>
              Compare your options side by side — cash offer, traditional listing, or putting your real estate equity to work as an investor.
            </p>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, color: "var(--black)", background: "var(--white)", border: "1px solid var(--border-mid)", borderRadius: "8px", padding: "11px 20px", transition: "border-color 0.15s" }}>
              See My Options →
            </span>
          </div>
        </Link>

        {/* INVEST — near-black/gold */}
        <Link href="/invest" className="path-card" style={{ background: "var(--near-black)" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "var(--gold)" }} />
          <div style={{ position: "absolute", top: "36px", left: "36px", fontFamily: "var(--font-display)", fontSize: "120px", color: "rgba(255,255,255,0.04)", lineHeight: 1, userSelect: "none" }}>03</div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, color: "rgba(184,150,46,0.7)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "14px", background: "rgba(184,150,46,0.12)", border: "1px solid rgba(184,150,46,0.2)", padding: "4px 10px", borderRadius: "4px" }}>
              Invest
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 4vw, 56px)", color: "var(--white)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 0.95, marginBottom: "16px" }}>
              FLIP WITH<br />US. EARN<br />RETURNS.
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: 1.75, marginBottom: "28px", maxWidth: "320px" }}>
              Partner with Highlander on real estate flips in Phoenix and Dallas. We run the deal from contract to close — you invest capital and earn a share of the profits.
            </p>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, color: "var(--black)", background: "var(--gold)", borderRadius: "8px", padding: "11px 20px", transition: "background 0.15s" }}>
              Learn More →
            </span>
          </div>
        </Link>

      </div>

      {/* ── ABOUT BAR ─────────────────────────────────────────── */}
      <section style={{ background: "var(--white)", borderTop: "1px solid var(--border-light)" }}>
        <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "56px 48px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "48px" }}>
          {[
            { val: "6+", label: "Years in the market", body: "Building deal flow and investor relationships across Phoenix and Dallas since 2019." },
            { val: "PHX + DFW", label: "Where we operate", body: "Two of the strongest residential real estate markets in the country — and we know both intimately." },
            { val: "JV", label: "Partnership model", body: "Every deal is its own joint venture. You know exactly what you own and what you earn — no blind pools." },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "40px", color: "var(--black)", letterSpacing: "1.5px", lineHeight: 1, marginBottom: "6px" }}>{s.val}</div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "10px" }}>{s.label}</div>
              <p style={{ fontSize: "13.5px", color: "var(--mid)", lineHeight: 1.75 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
