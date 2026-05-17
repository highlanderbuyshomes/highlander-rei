import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Invest With Highlander REI | Real Estate Flip Partnerships",
  description:
    "Partner with Highlander REI on real estate flips in Phoenix, AZ and Dallas, TX. We run the deal from contract to close — you invest capital and earn a profit split.",
};

const steps = [
  { n: "01", title: "You Bring the Capital", body: "Provide the funds needed to acquire and renovate the property. We handle every aspect of execution from day one." },
  { n: "02", title: "We Execute the Flip", body: "Our team manages acquisition, rehab, staging, and listing — keeping you updated at every milestone through your private investor portal." },
  { n: "03", title: "You Earn Your Share", body: "When the deal closes, you receive your agreed profit split directly. Transparent, documented, on time." },
];

export default function InvestPage() {
  return (
    <>
      {/* ── HEADER ───────────────────────────────────────────── */}
      <section style={{ background: "var(--near-black)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(255,255,255,0.012) 59px,rgba(255,255,255,0.012) 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(255,255,255,0.012) 59px,rgba(255,255,255,0.012) 60px)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "var(--blue)" }} />
        <div className="section" style={{ paddingBottom: "80px", position: "relative", zIndex: 1 }}>
          <span className="section-label" style={{ color: "rgba(100,150,255,0.7)" }}>Flip With Highlander</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(48px, 7vw, 80px)", color: "var(--white)", letterSpacing: "3px", lineHeight: 0.95, textTransform: "uppercase", marginBottom: "22px" }}>
            INVEST IN<br />REAL ESTATE<br /><span style={{ color: "var(--blue)" }}>WITHOUT THE<br />WORK.</span>
          </h1>
          <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.5)", maxWidth: "520px", lineHeight: 1.8, fontWeight: 300, marginBottom: "36px" }}>
            Partner with Highlander on property flips in Phoenix, AZ and Dallas, TX. We source the deal, run the rehab, and manage the sale — you put in the capital and earn a share of the profits.
          </p>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <a href="https://flipwithhighlander.com/contact" className="btn-blue" style={{ padding: "15px 32px", fontSize: "15px" }}>
              Become a Partner
            </a>
            <a href="https://flipwithhighlander.com" className="btn-outline-white" style={{ padding: "14px 28px", fontSize: "14px" }}>
              View Investor Portal
            </a>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ background: "var(--white)" }}>
        <div className="section">
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span className="section-label">The Model</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4vw, 56px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>
              How It Works
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
            {steps.map((s) => (
              <div key={s.n} style={{ background: "var(--blue-light)", border: "1px solid var(--blue-border)", borderRadius: "var(--radius)", padding: "32px 28px" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "13px", color: "var(--blue)", letterSpacing: "2px", marginBottom: "16px" }}>{s.n}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: "var(--black)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>{s.title}</h3>
                <p style={{ fontSize: "13.5px", color: "var(--mid)", lineHeight: 1.8 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT YOU GET ─────────────────────────────────────── */}
      <section style={{ background: "var(--off-white)", borderTop: "1px solid var(--border-light)" }}>
        <div className="section">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "start", maxWidth: "960px", margin: "0 auto" }}>
            <div>
              <span className="section-label">What You Get</span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3.5vw, 44px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1.05, marginBottom: "18px" }}>
                Full Transparency.<br />Real Returns.
              </h2>
              <p style={{ fontSize: "14.5px", color: "var(--mid)", lineHeight: 1.8 }}>
                Every investor gets access to a private portal where you can track milestones, view every expense, review documents, and follow the deal from acquisition through closing — in real time.
              </p>
              <div style={{ marginTop: "28px" }}>
                <a href="https://flipwithhighlander.com" style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--blue)", textDecoration: "none" }}>
                  See the Investor Portal →
                </a>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {[
                { title: "JV Partnership Structure", body: "No blind pools. Each deal is its own joint venture — you know exactly what you own and what you earn." },
                { title: "Strict Underwriting", body: "We pass on far more deals than we take. Properties only enter our pipeline when the numbers hold under conservative projections." },
                { title: "We Have Skin in the Game", body: "We co-invest in every deal. Your capital gets the same scrutiny we apply to our own money." },
                { title: "Live Expense Tracking", body: "Every dollar is logged, categorized, and visible in your dashboard in real time." },
              ].map((item, i) => (
                <div key={item.title} style={{ paddingTop: "22px", paddingBottom: "22px", borderBottom: i < 3 ? "1px solid var(--border-light)" : "none", display: "flex", gap: "14px" }}>
                  <div style={{ width: "3px", background: "var(--blue)", borderRadius: "2px", flexShrink: 0, alignSelf: "stretch", minHeight: "36px" }} />
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "16px", color: "var(--black)", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "6px" }}>{item.title}</div>
                    <p style={{ fontSize: "13px", color: "var(--mid)", lineHeight: 1.75 }}>{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MARKETS ──────────────────────────────────────────── */}
      <section style={{ background: "var(--white)", borderTop: "1px solid var(--border-light)" }}>
        <div className="section">
          <div style={{ textAlign: "center", marginBottom: "44px" }}>
            <span className="section-label">Where We Flip</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>
              Active Markets
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", maxWidth: "760px", margin: "0 auto" }}>
            {[
              { city: "Phoenix", state: "AZ", body: "Maricopa County and surrounding areas. One of the highest-velocity residential markets in the U.S. — strong appreciation and rehab demand." },
              { city: "Dallas", state: "TX", body: "DFW Metroplex. A deep, liquid market with consistent buyer demand, strong job growth, and favorable margins on value-add properties." },
            ].map((m) => (
              <div key={m.city} style={{ background: "var(--off-white)", border: "1px solid var(--border-light)", borderRadius: "var(--radius)", padding: "28px" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "12px" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "44px", color: "var(--black)", letterSpacing: "2px", lineHeight: 1 }}>{m.city}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: "var(--blue)", letterSpacing: "2px", lineHeight: 1.3 }}>{m.state}</span>
                </div>
                <p style={{ fontSize: "13.5px", color: "var(--mid)", lineHeight: 1.8 }}>{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section style={{ background: "var(--black)" }}>
        <div className="section" style={{ textAlign: "center" }}>
          <span className="section-label" style={{ color: "rgba(255,255,255,0.3)" }}>Ready to Partner?</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 5vw, 64px)", color: "var(--white)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1, marginBottom: "16px" }}>
            {"Let's"} Talk<br />About a Deal.
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)", maxWidth: "380px", margin: "0 auto 32px", lineHeight: 1.75 }}>
            We take on a limited number of partners per year. Reach out and {"let's"} talk about your first deal.
          </p>
          <a href="https://flipwithhighlander.com/contact" className="btn-blue" style={{ padding: "15px 36px", fontSize: "15px" }}>
            Start a Conversation →
          </a>
        </div>
      </section>
    </>
  );
}
