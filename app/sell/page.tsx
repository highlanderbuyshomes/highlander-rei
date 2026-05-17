import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sell Your Home | Highlander REI",
  description:
    "Choose how you sell. Get a fast cash offer in as little as 7 days, or let us invest in your property and get more when it sells — without handling a single repair.",
};

export default function SellPage() {
  return (
    <>
      {/* ── HEADER ───────────────────────────────────────────── */}
      <section style={{ background: "var(--off-white)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="section" style={{ paddingBottom: "64px", textAlign: "center" }}>
          <span className="section-label">How Do You Want to Sell?</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(44px, 7vw, 80px)", color: "var(--black)", letterSpacing: "3px", lineHeight: 0.95, textTransform: "uppercase", marginBottom: "22px" }}>
            TWO PATHS.<br />ZERO REPAIRS.
          </h1>
          <p style={{ fontSize: "17px", color: "var(--mid)", maxWidth: "520px", margin: "0 auto", lineHeight: 1.8, fontWeight: 300 }}>
            Need to close fast, or want to maximize what you walk away with? {"We've"} got a path for both.
          </p>
        </div>
      </section>

      {/* ── TWO OPTIONS ──────────────────────────────────────── */}
      <section style={{ background: "var(--white)" }}>
        <div className="section">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", maxWidth: "960px", margin: "0 auto" }}>

            {/* Cash Offer */}
            <div style={{ background: "var(--blue-light)", border: "1px solid var(--blue-border)", borderRadius: "var(--radius)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ height: "4px", background: "var(--blue)" }} />
              <div style={{ padding: "36px 32px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "16px" }}>Fast Close</div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3vw, 40px)", color: "var(--black)", letterSpacing: "1.5px", textTransform: "uppercase", lineHeight: 0.95, marginBottom: "18px" }}>
                  Cash<br />Offer
                </h2>
                <p style={{ fontSize: "14px", color: "var(--mid)", lineHeight: 1.8, marginBottom: "24px" }}>
                  Get a competitive all-cash offer within 24 hours. No repairs, no showings, no agent fees. Close when {"you're"} ready.
                </p>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px", flex: 1 }}>
                  {[
                    "Offer within 24 hours",
                    "Close in as little as 7 days",
                    "Typical transaction: 14–21 days",
                    "No repairs, no cleaning, no staging",
                    "No agent commissions",
                    "Guaranteed close — no fall-through risk",
                  ].map((p) => (
                    <li key={p} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13.5px", color: "var(--mid)" }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: "1px" }}>
                        <circle cx="8" cy="8" r="7.5" fill="white" />
                        <path d="M5 8l2.2 2.2 3.8-3.8" stroke="var(--blue)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
                <div style={{ fontSize: "12px", color: "var(--muted)", fontStyle: "italic", marginBottom: "24px", lineHeight: 1.6 }}>
                  Best if you need speed, certainty, or are selling as-is.
                </div>
                <Link href="/sell/cash" className="btn-blue" style={{ justifyContent: "center", padding: "14px 24px" }}>
                  Get My Cash Offer →
                </Link>
              </div>
            </div>

            {/* Flex Equity Program */}
            <div style={{ background: "var(--off-white)", border: "1px solid var(--border-light)", borderRadius: "var(--radius)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ height: "4px", background: "var(--black)" }} />
              <div style={{ padding: "36px 32px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, color: "var(--black)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "16px" }}>Max Value</div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3vw, 40px)", color: "var(--black)", letterSpacing: "1.5px", textTransform: "uppercase", lineHeight: 0.95, marginBottom: "18px" }}>
                  Flex Equity<br />Program
                </h2>
                <p style={{ fontSize: "14px", color: "var(--mid)", lineHeight: 1.8, marginBottom: "24px" }}>
                  We invest in your property — repairs, updates, staging — then list it on the open market. You get significantly more at closing. You never touch a thing.
                </p>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px", flex: 1 }}>
                  {[
                    "We fund all repairs and updates upfront",
                    "Professional staging and photography",
                    "Full MLS exposure and expert listing",
                    "You pay nothing until closing",
                    "Walk away with more than a cash offer",
                    "Timeline: 45–60 days",
                  ].map((p) => (
                    <li key={p} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13.5px", color: "var(--mid)" }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: "1px" }}>
                        <circle cx="8" cy="8" r="7.5" fill="white" />
                        <path d="M5 8l2.2 2.2 3.8-3.8" stroke="var(--black)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
                <div style={{ fontSize: "12px", color: "var(--muted)", fontStyle: "italic", marginBottom: "24px", lineHeight: 1.6 }}>
                  Best if you want top dollar and {"don't"} mind a 45–60 day timeline.
                </div>
                <Link href="/sell/flex" className="btn-black" style={{ justifyContent: "center", padding: "14px 24px" }}>
                  Learn About Flex Equity →
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── COMPARE BAR ──────────────────────────────────────── */}
      <section style={{ background: "var(--near-black)" }}>
        <div className="section">
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span className="section-label" style={{ color: "rgba(255,255,255,0.35)" }}>Side by Side</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", color: "var(--white)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>
              Which Is Right for You?
            </h2>
          </div>

          <div style={{ maxWidth: "760px", margin: "0 auto", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", background: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ padding: "12px 22px" }} />
              <div style={{ padding: "12px 22px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--blue)", textAlign: "center" }}>Cash Offer</div>
              <div style={{ padding: "12px 22px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "rgba(255,255,255,0.6)", textAlign: "center" }}>Flex Equity</div>
            </div>
            {[
              { label: "Timeline", cash: "7–21 days", flex: "45–60 days" },
              { label: "Sale price", cash: "Below market", flex: "Full market value" },
              { label: "Repairs", cash: "None", flex: "We handle everything" },
              { label: "Showings", cash: "None", flex: "Managed by us" },
              { label: "Upfront cost to you", cash: "$0", flex: "$0" },
              { label: "Certainty", cash: "Guaranteed close", flex: "Market dependent" },
            ].map((row, i) => (
              <div key={row.label} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <div style={{ padding: "15px 22px", fontSize: "13px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{row.label}</div>
                <div style={{ padding: "15px 22px", fontSize: "13px", color: "var(--blue)", textAlign: "center", fontWeight: 600 }}>{row.cash}</div>
                <div style={{ padding: "15px 22px", fontSize: "13px", color: "rgba(255,255,255,0.55)", textAlign: "center" }}>{row.flex}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
