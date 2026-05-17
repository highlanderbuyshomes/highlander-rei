import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Find an Investment Property | Highlander REI",
  description:
    "Access off-market investment properties in Phoenix, AZ and Dallas, TX. Single-family, multi-family, distressed, and value-add deals through Highlander REI's network.",
};

export default function InvestmentPropertyPage() {
  return (
    <>
      {/* ── HEADER ───────────────────────────────────────────── */}
      <section style={{ background: "var(--near-black)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(255,255,255,0.012) 59px,rgba(255,255,255,0.012) 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(255,255,255,0.012) 59px,rgba(255,255,255,0.012) 60px)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "var(--blue)" }} />
        <div className="section" style={{ paddingBottom: "80px", position: "relative", zIndex: 1 }}>
          <Link href="/buy" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "rgba(255,255,255,0.4)", textDecoration: "none", marginBottom: "28px" }}>
            ← Back to Buy
          </Link>
          <span className="section-label" style={{ color: "rgba(100,150,255,0.7)" }}>Investment Properties</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(48px, 7vw, 80px)", color: "var(--white)", letterSpacing: "3px", lineHeight: 0.95, textTransform: "uppercase", marginBottom: "22px" }}>
            OFF-MARKET<br />DEALS IN<br /><span style={{ color: "var(--blue)" }}>PHX & DFW.</span>
          </h1>
          <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.5)", maxWidth: "520px", lineHeight: 1.8, fontWeight: 300, marginBottom: "36px" }}>
            We source distressed, value-add, and off-market properties across Phoenix and Dallas. Tell us what {"you're"} looking for and we{"'ll"} get to work.
          </p>
          <a href="https://highlanderbuyshomes.com/contact" className="btn-blue" style={{ padding: "15px 32px", fontSize: "15px" }}>
            Tell Us What You{"'"}re Looking For →
          </a>
        </div>
      </section>

      {/* ── WHAT WE SOURCE ───────────────────────────────────── */}
      <section style={{ background: "var(--white)" }}>
        <div className="section">
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <span className="section-label">Deal Types</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4vw, 52px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>
              What We Source
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {[
              { title: "Fix & Flip", body: "Distressed single-family properties with clear upside. We know the numbers — ARV, rehab cost, and margin — before we bring you a deal." },
              { title: "Buy & Hold", body: "Cash-flowing rental properties in proven neighborhoods. We source deals that make sense on day one, not just in theory." },
              { title: "Value-Add", body: "Properties with below-market rents, deferred maintenance, or conversion potential. Significant upside for the right buyer." },
            ].map((s) => (
              <div key={s.title} style={{ background: "var(--off-white)", border: "1px solid var(--border-light)", borderRadius: "var(--radius)", padding: "28px 24px" }}>
                <div style={{ width: "3px", height: "28px", background: "var(--blue)", borderRadius: "2px", marginBottom: "16px" }} />
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: "var(--black)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>{s.title}</h3>
                <p style={{ fontSize: "13.5px", color: "var(--mid)", lineHeight: 1.8 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ───────────────────────────────────────────── */}
      <section style={{ background: "var(--off-white)", borderTop: "1px solid var(--border-light)" }}>
        <div className="section">
          <div style={{ maxWidth: "700px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "0" }}>
            <div style={{ textAlign: "center", marginBottom: "48px" }}>
              <span className="section-label">Why Highlander</span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>
                Deal Flow You {"Can't"}<br />Find on the MLS
              </h2>
            </div>
            {[
              { title: "Off-Market Access", body: "We source directly from motivated sellers — probate, divorce, delinquent taxes, and direct mail campaigns. These deals never hit Zillow." },
              { title: "Conservative Underwriting", body: "We run the numbers hard. We pass on far more deals than we take, and every deal we bring is underwritten under conservative assumptions." },
              { title: "Market Depth", body: "Six-plus years of deal flow in Phoenix and Dallas means we know which zip codes perform, which neighborhoods are turning, and where the margins are." },
              { title: "No Obligation", body: "Tell us what you're looking for and we'll send you deals as they come. No fees, no commitment — just first access to our pipeline." },
            ].map((item, i) => (
              <div key={item.title} style={{ padding: "24px 0", borderBottom: i < 3 ? "1px solid var(--border-light)" : "none", display: "flex", gap: "16px" }}>
                <div style={{ width: "3px", background: "var(--blue)", borderRadius: "2px", flexShrink: 0, alignSelf: "stretch", minHeight: "36px" }} />
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "16px", color: "var(--black)", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "6px" }}>{item.title}</div>
                  <p style={{ fontSize: "13px", color: "var(--mid)", lineHeight: 1.75 }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section style={{ background: "var(--black)" }}>
        <div className="section" style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 5vw, 64px)", color: "var(--white)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1, marginBottom: "16px" }}>
            Get on Our<br />Deal List.
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)", maxWidth: "380px", margin: "0 auto 32px", lineHeight: 1.75 }}>
            Tell us your buy box — market, price range, deal type — and {"we'll"} send you deals as they come through our pipeline.
          </p>
          <a href="https://highlanderbuyshomes.com/contact" className="btn-blue" style={{ padding: "15px 36px", fontSize: "15px" }}>
            Join the Deal List →
          </a>
        </div>
      </section>
    </>
  );
}
