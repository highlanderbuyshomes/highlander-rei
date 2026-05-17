import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Highlander REI — Real Estate Solutions in Phoenix & Dallas",
  description:
    "Sell your home for cash or top dollar, find your next home, or invest in real estate flips with Highlander REI in Phoenix, AZ and Dallas, TX.",
};

export default function HomePage() {
  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section style={{ background: "var(--black)", textAlign: "center", padding: "72px 48px 56px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "5px 14px", marginBottom: "24px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--blue)", flexShrink: 0, display: "inline-block" }} />
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", letterSpacing: "0.8px", fontWeight: 500 }}>Phoenix, AZ · Dallas, TX</span>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(48px, 8vw, 96px)", color: "var(--white)", letterSpacing: "2px", lineHeight: 0.95, textTransform: "uppercase", marginBottom: "20px" }}>
          REAL ESTATE,<br />YOUR WAY.
        </h1>
        <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.5)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.75, fontWeight: 300 }}>
          Tell us what you{"'"}re trying to do. {"We'll"} show you the path.
        </p>
      </section>

      {/* ── TWO PATH CARDS ────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "560px" }}>

        {/* SELL — white */}
        <Link href="/sell" className="path-card" style={{ background: "var(--white)", borderRight: "1px solid var(--border-light)" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "var(--blue)" }} />
          <div style={{ position: "absolute", top: "36px", left: "36px", fontFamily: "var(--font-display)", fontSize: "120px", color: "rgba(0,0,0,0.04)", lineHeight: 1, userSelect: "none" }}>01</div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "14px", background: "var(--blue-light)", border: "1px solid var(--blue-border)", padding: "4px 10px", borderRadius: "4px" }}>
              Sell
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 4vw, 56px)", color: "var(--near-black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 0.95, marginBottom: "16px" }}>
              SELL YOUR<br />HOME ON<br />YOUR TERMS.
            </h2>
            <p style={{ fontSize: "14px", color: "var(--mid)", lineHeight: 1.75, marginBottom: "28px", maxWidth: "340px" }}>
              Cash offer in as little as 7 days, or let us invest in your property and list it — getting you more without the repairs or stress.
            </p>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, color: "var(--white)", background: "var(--blue)", borderRadius: "8px", padding: "11px 20px" }}>
              See My Options →
            </span>
          </div>
        </Link>

        {/* BUY — near-black */}
        <Link href="/buy" className="path-card" style={{ background: "var(--near-black)" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "var(--blue)" }} />
          <div style={{ position: "absolute", top: "36px", left: "36px", fontFamily: "var(--font-display)", fontSize: "120px", color: "rgba(255,255,255,0.04)", lineHeight: 1, userSelect: "none" }}>02</div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, color: "rgba(100,150,255,0.8)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "14px", background: "rgba(26,86,219,0.15)", border: "1px solid rgba(26,86,219,0.3)", padding: "4px 10px", borderRadius: "4px" }}>
              Buy
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 4vw, 56px)", color: "var(--white)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 0.95, marginBottom: "16px" }}>
              FIND A HOME,<br />INVEST, OR<br />BUILD WEALTH.
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: 1.75, marginBottom: "28px", maxWidth: "340px" }}>
              Find your next home, source an investment property, or partner with us on a flip and earn a share of the returns.
            </p>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, color: "var(--white)", background: "var(--blue)", borderRadius: "8px", padding: "11px 20px" }}>
              Explore Options →
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
              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "10px" }}>{s.label}</div>
              <p style={{ fontSize: "13.5px", color: "var(--mid)", lineHeight: 1.75 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
