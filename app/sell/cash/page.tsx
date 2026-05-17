import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cash Offer | Highlander REI",
  description:
    "Get a competitive all-cash offer on your home within 24 hours. Close in as little as 7 days. No repairs, no showings, no fees.",
};

export default function CashOfferPage() {
  return (
    <>
      {/* ── HEADER ───────────────────────────────────────────── */}
      <section style={{ background: "var(--blue)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(255,255,255,0.03) 59px,rgba(255,255,255,0.03) 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(255,255,255,0.03) 59px,rgba(255,255,255,0.03) 60px)" }} />
        <div className="section" style={{ paddingBottom: "80px", position: "relative", zIndex: 1 }}>
          <Link href="/sell" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "rgba(255,255,255,0.5)", textDecoration: "none", marginBottom: "28px" }}>
            ← Back to Sell Options
          </Link>
          <span className="section-label" style={{ color: "rgba(255,255,255,0.4)" }}>Cash Offer</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(48px, 7vw, 80px)", color: "var(--white)", letterSpacing: "3px", lineHeight: 0.95, textTransform: "uppercase", marginBottom: "22px" }}>
            GET A CASH<br />OFFER IN<br />24 HOURS.
          </h1>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "36px" }}>
            {[
              { val: "7 days", label: "Fastest close" },
              { val: "14–21", label: "Typical timeline" },
              { val: "$0", label: "Repairs or fees" },
            ].map((s) => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "var(--radius-sm)", padding: "14px 20px", minWidth: "120px" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "26px", color: "var(--white)", letterSpacing: "1px" }}>{s.val}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "1px", marginTop: "2px" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <a href="https://highlanderbuyshomes.com/sell" className="btn-outline-white" style={{ padding: "15px 32px", fontSize: "15px" }}>
            Get My Cash Offer →
          </a>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ background: "var(--white)" }}>
        <div className="section">
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <span className="section-label">The Process</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4vw, 56px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>
              Three Steps to Sold
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
            {[
              { n: "01", title: "Tell Us About Your Home", body: "Enter your address and answer a few quick questions. Takes less than 3 minutes — no commitment required." },
              { n: "02", title: "Receive Your Offer", body: "Our team reviews your property and sends a competitive, all-cash, no-obligation offer within 24 hours." },
              { n: "03", title: "Close on Your Timeline", body: "You pick the date. As fast as 7 days, or give yourself more time — entirely on your schedule." },
            ].map((s) => (
              <div key={s.n} style={{ background: "var(--blue-light)", border: "1px solid var(--blue-border)", borderRadius: "var(--radius)", padding: "32px 28px" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "13px", color: "var(--blue)", letterSpacing: "2px", marginBottom: "16px" }}>{s.n}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: "var(--black)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>{s.title}</h3>
                <p style={{ fontSize: "13.5px", color: "var(--mid)", lineHeight: 1.8 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CASH ─────────────────────────────────────────── */}
      <section style={{ background: "var(--off-white)", borderTop: "1px solid var(--border-light)" }}>
        <div className="section">
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "44px" }}>
              <span className="section-label">Why Cash?</span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>
                Traditional vs. Cash Offer
              </h2>
            </div>

            <div style={{ background: "var(--white)", border: "1px solid var(--border-light)", borderRadius: "var(--radius)", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", background: "var(--off-white)", borderBottom: "1px solid var(--border-light)" }}>
                <div style={{ padding: "12px 22px" }} />
                <div style={{ padding: "12px 22px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--muted)", textAlign: "center" }}>Traditional</div>
                <div style={{ padding: "12px 22px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--blue)", textAlign: "center", background: "var(--blue-light)" }}>Highlander</div>
              </div>
              {[
                { label: "Offer timeline", trad: "Weeks to months", ours: "24 hours" },
                { label: "Repairs needed", trad: "Usually required", ours: "Never" },
                { label: "Showings", trad: "Many", ours: "None" },
                { label: "Closing time", trad: "30–60 days", ours: "As fast as 7 days" },
                { label: "Agent commission", trad: "5–6%", ours: "$0" },
                { label: "Deal certainty", trad: "May fall through", ours: "Guaranteed cash" },
              ].map((row, i) => (
                <div key={row.label} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", borderBottom: i < 5 ? "1px solid var(--border-light)" : "none", background: i % 2 === 0 ? "var(--white)" : "var(--warm-white)" }}>
                  <div style={{ padding: "15px 22px", fontSize: "13px", color: "var(--mid)", fontWeight: 500 }}>{row.label}</div>
                  <div style={{ padding: "15px 22px", fontSize: "13px", color: "var(--muted)", textAlign: "center" }}>{row.trad}</div>
                  <div style={{ padding: "15px 22px", fontSize: "13px", color: "var(--blue)", textAlign: "center", fontWeight: 600, background: "rgba(26,86,219,0.025)" }}>{row.ours}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section style={{ background: "var(--black)" }}>
        <div className="section" style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 5vw, 64px)", color: "var(--white)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1, marginBottom: "16px" }}>
            Ready to See<br />Your Number?
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)", maxWidth: "360px", margin: "0 auto 32px", lineHeight: 1.75 }}>
            Free, no-obligation cash offer within 24 hours.
          </p>
          <a href="https://highlanderbuyshomes.com/sell" className="btn-blue" style={{ padding: "15px 36px", fontSize: "15px" }}>
            Get My Cash Offer →
          </a>
        </div>
      </section>
    </>
  );
}
