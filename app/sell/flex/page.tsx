import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Flex Equity Program | Highlander REI",
  description:
    "We invest in your home — repairs, updates, staging — then list it on the market. You get more at closing without touching a thing. 45–60 day timeline.",
};

export default function FlexEquityPage() {
  return (
    <>
      {/* ── HEADER ───────────────────────────────────────────── */}
      <section style={{ background: "var(--near-black)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(255,255,255,0.012) 59px,rgba(255,255,255,0.012) 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(255,255,255,0.012) 59px,rgba(255,255,255,0.012) 60px)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "var(--blue)" }} />
        <div className="section" style={{ paddingBottom: "80px", position: "relative", zIndex: 1 }}>
          <Link href="/sell" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "rgba(255,255,255,0.4)", textDecoration: "none", marginBottom: "28px" }}>
            ← Back to Sell Options
          </Link>
          <span className="section-label" style={{ color: "rgba(100,150,255,0.7)" }}>Flex Equity Program</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(48px, 7vw, 80px)", color: "var(--white)", letterSpacing: "3px", lineHeight: 0.95, textTransform: "uppercase", marginBottom: "22px" }}>
            GET MORE FOR<br />YOUR HOME.<br /><span style={{ color: "var(--blue)" }}>WITHOUT THE<br />WORK.</span>
          </h1>
          <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.5)", maxWidth: "540px", lineHeight: 1.8, fontWeight: 300, marginBottom: "36px" }}>
            We fund the repairs, handle the updates, stage the home, and list it on the market — you collect the higher sale price at closing and never lift a finger.
          </p>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <a href="https://highlanderbuyshomes.com/sell" className="btn-blue" style={{ padding: "15px 32px", fontSize: "15px" }}>
              Get Started →
            </a>
            <Link href="/sell" className="btn-outline-white" style={{ padding: "14px 28px", fontSize: "14px" }}>
              Compare Options
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ background: "var(--white)" }}>
        <div className="section">
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span className="section-label">The Process</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4vw, 56px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>
              How It Works
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
            {[
              { n: "01", title: "We Evaluate", body: "We assess your property and scope the improvements that will generate the highest return — no guesswork, just data." },
              { n: "02", title: "We Invest", body: "We fund and manage every repair, update, and improvement. No out-of-pocket cost to you — ever." },
              { n: "03", title: "We List", body: "Professional staging, photography, and a full MLS listing. We position your home to sell at or above asking." },
              { n: "04", title: "You Close", body: "Your property sells on the open market. You collect the higher price at closing, minus our agreed-upon split." },
            ].map((s) => (
              <div key={s.n} style={{ background: "var(--off-white)", border: "1px solid var(--border-light)", borderRadius: "var(--radius)", padding: "28px 24px" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "13px", color: "var(--blue)", letterSpacing: "2px", marginBottom: "14px" }}>{s.n}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--black)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>{s.title}</h3>
                <p style={{ fontSize: "13px", color: "var(--mid)", lineHeight: 1.8 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT WE HANDLE ───────────────────────────────────── */}
      <section style={{ background: "var(--off-white)", borderTop: "1px solid var(--border-light)" }}>
        <div className="section">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "start", maxWidth: "960px", margin: "0 auto" }}>
            <div>
              <span className="section-label">What We Handle</span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3.5vw, 44px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1.05, marginBottom: "18px" }}>
                We Do the Work.<br />You Keep the Gains.
              </h2>
              <p style={{ fontSize: "14.5px", color: "var(--mid)", lineHeight: 1.8, marginBottom: "24px" }}>
                From day one to closing day, {"we're"} the ones coordinating contractors, managing timelines, and making sure the finished product is exactly what buyers want to see.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--blue-light)", border: "1px solid var(--blue-border)", borderRadius: "var(--radius-sm)", padding: "14px 18px" }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="8.5" fill="var(--blue)" />
                  <path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: "13px", color: "var(--blue)", fontWeight: 600 }}>Zero upfront cost to you. Everything is settled at closing.</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {[
                { title: "Repairs & Updates", body: "We assess and fund everything from fresh paint and flooring to kitchen and bath improvements that move the needle on price." },
                { title: "Staging & Design", body: "Professional staging that makes buyers fall in love. We know what sells in Phoenix and Dallas." },
                { title: "Photography & Marketing", body: "High-quality listing photos, virtual tours, and full MLS exposure through our agent network." },
                { title: "Timeline Management", body: "We coordinate every contractor and vendor so the project stays on track. Typical timeline: 45–60 days start to close." },
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

      {/* ── TIMELINE ─────────────────────────────────────────── */}
      <section style={{ background: "var(--white)", borderTop: "1px solid var(--border-light)" }}>
        <div className="section">
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span className="section-label">Timeline</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>
              45–60 Days Start to Close
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0", maxWidth: "860px", margin: "0 auto", position: "relative" }}>
            <div style={{ position: "absolute", top: "20px", left: "12.5%", right: "12.5%", height: "2px", background: "var(--border-light)", zIndex: 0 }} />
            {[
              { day: "Day 1–3", label: "Assessment & Scope" },
              { day: "Day 4–30", label: "Repairs & Updates" },
              { day: "Day 31–40", label: "Stage & List" },
              { day: "Day 45–60", label: "Under Contract & Close" },
            ].map((t, i) => (
              <div key={t.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative", zIndex: 1 }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: i === 3 ? "var(--blue)" : "var(--white)", border: `2px solid ${i === 3 ? "var(--blue)" : "var(--border-mid)"}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "14px", color: i === 3 ? "var(--white)" : "var(--muted)" }}>{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "11px", color: "var(--blue)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>{t.day}</div>
                <div style={{ fontSize: "13px", color: "var(--mid)", fontWeight: 500 }}>{t.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section style={{ background: "var(--black)" }}>
        <div className="section" style={{ textAlign: "center" }}>
          <span className="section-label" style={{ color: "rgba(255,255,255,0.3)" }}>Ready to Get Started?</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 5vw, 64px)", color: "var(--white)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1, marginBottom: "16px" }}>
            {"Let's"} See What<br />Your Home Can Earn.
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)", maxWidth: "400px", margin: "0 auto 32px", lineHeight: 1.75 }}>
            {"We'll"} evaluate your property and show you exactly what the Flex Equity Program would put in your pocket.
          </p>
          <a href="https://highlanderbuyshomes.com/sell" className="btn-blue" style={{ padding: "15px 36px", fontSize: "15px" }}>
            Get My Flex Equity Estimate →
          </a>
        </div>
      </section>
    </>
  );
}
