import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Flex Equity Program — Sell for More Without the Repairs | Highlander REI",
  description:
    "The Flex Equity Program lets you sell your Phoenix or Dallas home at full market value without handling a single repair. We invest in your property, stage it, list it — repairs done in 7 days, first offer typically 7–10 days after listing. You keep the upside.",
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
            SELL FOR MORE.<br />DO LESS.<br /><span style={{ color: "var(--blue)" }}>WE HANDLE<br />EVERYTHING.</span>
          </h1>
          <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.5)", maxWidth: "560px", lineHeight: 1.8, fontWeight: 300, marginBottom: "32px" }}>
            We fund and manage repairs — done in 7 days — stage your home, list it on the open market, and get it under contract. You walk away with more than any cash offer would put in your pocket.
          </p>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "36px" }}>
            {[
              { val: "7 days", label: "Repairs complete" },
              { val: "7–10 days", label: "First offer accepted" },
              { val: "45–60", label: "Total days to close" },
              { val: "$0", label: "Upfront cost" },
            ].map((s) => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "var(--radius-sm)", padding: "14px 20px", minWidth: "120px" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "24px", color: "var(--white)", letterSpacing: "1px" }}>{s.val}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "1px", marginTop: "2px" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <a href="https://highlanderbuyshomes.com/sell" className="btn-blue" style={{ padding: "15px 32px", fontSize: "15px" }}>
              Get My Flex Equity Estimate →
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
              How Flex Equity Works
            </h2>
          </div>
          <div className="grid-4">
            {[
              { n: "01", title: "We Evaluate", body: "We assess your property and scope the improvements that generate the highest return per dollar spent — data-driven, not guesswork." },
              { n: "02", title: "Repairs in 7 Days", body: "We fund and manage every repair, update, and improvement. Our vetted contractors execute fast — repairs are completed within 7 days of kickoff." },
              { n: "03", title: "Stage & List", body: "Professional staging, high-quality photography, and a full MLS listing. We price strategically to maximize your net at closing." },
              { n: "04", title: "Offer in 7–10 Days", body: "Priced right, staged well, marketed aggressively — our listings typically receive and accept their first qualified offer within 7–10 days of hitting the market." },
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
          <div className="grid-2-content">
            <div>
              <span className="section-label">What We Handle</span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3.5vw, 44px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1.05, marginBottom: "18px" }}>
                We Do the Work.<br />You Keep the Gains.
              </h2>
              <p style={{ fontSize: "14.5px", color: "var(--mid)", lineHeight: 1.8, marginBottom: "24px" }}>
                From contractor coordination to listing strategy, we handle every detail. You never deal with a single vendor, invoice, or showing request.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--blue-light)", border: "1px solid var(--blue-border)", borderRadius: "var(--radius-sm)", padding: "14px 18px" }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="9" cy="9" r="8.5" fill="var(--blue)" />
                  <path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: "13px", color: "var(--blue)", fontWeight: 600 }}>Zero upfront cost. Everything is deducted from proceeds at closing.</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                { title: "Repairs & Updates", body: "From fresh paint and flooring to kitchen and bath updates — we scope what moves the needle and execute it fast. Completed within 7 days." },
                { title: "Staging & Design", body: "Professional staging that makes buyers fall in love. We know what sells in Phoenix and Dallas — and we present your home accordingly." },
                { title: "Photography & Listing", body: "High-quality photography, walkthrough video, and a strategic MLS listing written to attract motivated buyers — not just browsers." },
                { title: "Offer Management", body: "We manage showings, review offers, and negotiate on your behalf. Our goal is a clean contract at the best possible price — typically within 7–10 days of listing." },
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
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <span className="section-label">Timeline</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>
              From Evaluation to Close
            </h2>
          </div>
          <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "0" }}>
            {[
              { range: "Days 1–3", title: "Property Assessment", detail: "We walk the property, scope improvements, and confirm the plan. No cost to you." },
              { range: "Days 4–10", title: "Repairs Complete", detail: "Our contractors execute fast. Repairs, updates, and paint — finished within 7 days of kickoff." },
              { range: "Days 11–17", title: "Stage, Photo & List", detail: "Professional staging, photography, and your home goes live on the MLS." },
              { range: "Days 18–27", title: "First Offer Accepted", detail: "Priced right and marketed well — our listings typically go under contract 7–10 days after listing." },
              { range: "Days 28–60", title: "Inspection, Appraisal & Close", detail: "Buyer's financing, inspection, and appraisal proceed. Most deals close 30–45 days after contract." },
            ].map((t, i) => (
              <div key={t.title} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "24px", padding: "24px 0", borderBottom: i < 4 ? "1px solid var(--border-light)" : "none", alignItems: "start" }}>
                <div>
                  <div style={{ display: "inline-block", background: i === 4 ? "var(--blue)" : "var(--blue-light)", color: i === 4 ? "var(--white)" : "var(--blue)", fontSize: "11px", fontWeight: 700, padding: "5px 10px", borderRadius: "6px", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                    {t.range}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "18px", color: "var(--black)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "6px" }}>{t.title}</div>
                  <p style={{ fontSize: "13.5px", color: "var(--mid)", lineHeight: 1.75 }}>{t.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ─────────────────────────────────────── */}
      <section style={{ background: "var(--off-white)", borderTop: "1px solid var(--border-light)" }}>
        <div className="section">
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <span className="section-label">Is This Right for You?</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>
              Flex Equity Is Built for Sellers Who Want More
            </h2>
          </div>
          <div className="grid-3">
            {[
              { title: "Your Home Needs Work", body: "You know your home would sell for more with updates, but you don't have the time, cash, or energy to manage a renovation. We do it for you." },
              { title: "You Want Market Value", body: "A cash offer makes sense for speed, but you're willing to wait 45–60 days for the premium that comes with a fully-prepped, market-listed home." },
              { title: "You Don't Want the Hassle", body: "Even traditional listing means repairs, showings, negotiations, and uncertainty. Flex Equity gives you full-market results without any of that headache." },
            ].map((item) => (
              <div key={item.title} style={{ background: "var(--white)", border: "1px solid var(--border-light)", borderRadius: "var(--radius)", padding: "28px 24px" }}>
                <div style={{ width: "3px", height: "24px", background: "var(--blue)", borderRadius: "2px", marginBottom: "14px" }} />
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--black)", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "8px" }}>{item.title}</h3>
                <p style={{ fontSize: "13px", color: "var(--mid)", lineHeight: 1.8 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section style={{ background: "var(--white)", borderTop: "1px solid var(--border-light)" }}>
        <div className="section">
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "48px" }}>
              <span className="section-label">Common Questions</span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>
                FAQ
              </h2>
            </div>
            {[
              { q: "How do you make money on this?", a: "We earn our return by managing the improvement process efficiently and sharing in the upside at closing. The exact split is agreed upon before any work begins — full transparency, no surprises." },
              { q: "Really done in 7 days?", a: "Yes. We work with vetted contractors who know how to move fast. We scope the project tightly — high-impact improvements only — and our crews execute. We don't over-improve, and we don't waste time." },
              { q: "What if my home doesn't sell quickly?", a: "Our pricing strategy is based on real comparable data, not wishful thinking. If market conditions shift, we'll discuss adjustments — but our goal is always a fast, clean contract at the best possible price." },
              { q: "What improvements do you make?", a: "We focus on high-ROI work: paint, flooring, fixtures, landscaping, kitchen and bath cosmetics. We avoid structural changes or over-builds. Every dollar we spend is intended to return multiple dollars at closing." },
              { q: "Do I have to move out during repairs?", a: "Not necessarily. We work around your situation. If the scope is light and you're still in the home, we can coordinate accordingly. We'll be upfront about what works best for a fast, quality result." },
              { q: "How does this compare to just listing with an agent?", a: "With a traditional listing, you front the repairs, manage the vendors, and hope buyers overlook the flaws. With Flex Equity, we fund everything, manage the process, and you collect a higher net — without touching anything." },
            ].map((item, i) => (
              <div key={item.q} style={{ padding: "24px 0", borderBottom: i < 5 ? "1px solid var(--border-light)" : "none" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "18px", color: "var(--black)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "10px" }}>{item.q}</div>
                <p style={{ fontSize: "14px", color: "var(--mid)", lineHeight: 1.8 }}>{item.a}</p>
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
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)", maxWidth: "420px", margin: "0 auto 32px", lineHeight: 1.75 }}>
            {"We'll"} evaluate your property and show you exactly what the Flex Equity Program would put in your pocket — compared to a straight cash offer.
          </p>
          <a href="https://highlanderbuyshomes.com/sell" className="btn-blue" style={{ padding: "15px 36px", fontSize: "15px" }}>
            Get My Flex Equity Estimate →
          </a>
        </div>
      </section>
    </>
  );
}
