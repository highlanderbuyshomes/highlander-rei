import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sell Your House for Cash in Phoenix & Dallas | Highlander REI",
  description:
    "Get a fair all-cash offer on your home in Phoenix, AZ or Dallas, TX within 24 hours. Close in as little as 7 days. No repairs, no showings, no agent fees. We buy houses as-is — any condition, any situation.",
};

export default function CashOfferPage() {
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
          <span className="section-label" style={{ color: "rgba(100,150,255,0.7)" }}>Cash Offer</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(48px, 7vw, 80px)", color: "var(--white)", letterSpacing: "3px", lineHeight: 0.95, textTransform: "uppercase", marginBottom: "22px" }}>
            SELL YOUR<br />HOUSE FOR<br />CASH. FAST.
          </h1>
          <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.7)", maxWidth: "520px", lineHeight: 1.8, fontWeight: 300, marginBottom: "32px" }}>
            We buy houses in Phoenix, AZ and Dallas, TX in any condition — no repairs, no cleanout, no agent fees. Get a fair cash offer within 24 hours and close on your timeline.
          </p>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "36px" }}>
            {[
              { val: "24 hrs", label: "Offer timeline" },
              { val: "7 days", label: "Fastest close" },
              { val: "14–21", label: "Typical close" },
              { val: "$0", label: "Fees or repairs" },
            ].map((s) => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "var(--radius-sm)", padding: "14px 20px", minWidth: "110px" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "26px", color: "var(--white)", letterSpacing: "1px" }}>{s.val}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "1px", marginTop: "2px" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <a href="https://highlanderbuyshomes.com/sell" className="btn-blue" style={{ padding: "15px 32px", fontSize: "15px" }}>
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
          <div className="grid-3">
            {[
              { n: "01", title: "Tell Us About Your Home", body: "Enter your address and answer a few quick questions about your property. No commitment required — takes less than 3 minutes." },
              { n: "02", title: "Receive Your Offer", body: "We review your property and send a fair, all-cash, no-obligation offer within 24 hours. No lowball tactics — a real number based on real data." },
              { n: "03", title: "Close on Your Timeline", body: "You pick the date. Close in as little as 7 days. Most transactions close in 14–21 days. We work around your schedule." },
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

      {/* ── WHO WE BUY FROM ──────────────────────────────────── */}
      <section style={{ background: "var(--off-white)", borderTop: "1px solid var(--border-light)" }}>
        <div className="section">
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <span className="section-label">Any Situation</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 52px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>
              We Buy in Every Situation
            </h2>
            <p style={{ fontSize: "15px", color: "var(--mid)", maxWidth: "560px", margin: "16px auto 0", lineHeight: 1.8 }}>
              No matter {"what's"} going on — we{"'ve"} seen it. We buy houses as-is, in any condition, from homeowners in every situation.
            </p>
          </div>
          <div className="grid-3">
            {[
              { title: "Inherited Property", body: "Inherited a home you don't want to manage, repair, or list? We close fast with minimal paperwork and handle the details so you don't have to." },
              { title: "Facing Foreclosure", body: "Behind on payments or facing foreclosure? A cash sale can close before the bank acts — protecting your credit and putting cash in your pocket." },
              { title: "Divorce or Separation", body: "Need to liquidate a jointly-owned property quickly and cleanly? We make the process straightforward, fast, and conflict-free." },
              { title: "Relocation", body: "Moving for a job or life change and need to sell without the dragged-out listing process? We close on your schedule — not the market's." },
              { title: "Major Repairs Needed", body: "Foundation issues, roof damage, outdated systems — we buy as-is. No repairs, no inspections from buyers, no re-negotiations after inspections." },
              { title: "Vacant or Rental Property", body: "Tired of managing a vacant property or dealing with tenants? We buy occupied and vacant homes alike — hassle-free." },
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

      {/* ── COMPARE ──────────────────────────────────────────── */}
      <section style={{ background: "var(--white)", borderTop: "1px solid var(--border-light)" }}>
        <div className="section">
          <div style={{ maxWidth: "760px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "44px" }}>
              <span className="section-label">Why Cash?</span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>
                Cash Offer vs. Traditional Listing
              </h2>
            </div>
            <div style={{ background: "var(--white)", border: "1px solid var(--border-light)", borderRadius: "var(--radius)", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", background: "var(--off-white)", borderBottom: "1px solid var(--border-light)" }}>
                <div style={{ padding: "12px 22px" }} />
                <div style={{ padding: "12px 22px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--muted)", textAlign: "center" }}>Traditional</div>
                <div style={{ padding: "12px 22px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--blue)", textAlign: "center", background: "var(--blue-light)" }}>Highlander Cash</div>
              </div>
              {[
                { label: "Offer timeline", trad: "Weeks to months", ours: "24 hours" },
                { label: "Repairs required", trad: "Usually yes", ours: "Never" },
                { label: "Showings", trad: "Many, over weeks", ours: "None" },
                { label: "Closing time", trad: "30–60 days", ours: "As fast as 7 days" },
                { label: "Agent commission", trad: "5–6%", ours: "$0" },
                { label: "Deal certainty", trad: "Can fall through", ours: "Guaranteed cash" },
                { label: "Sale price", trad: "Market — if it sells", ours: "Fair market value" },
              ].map((row, i) => (
                <div key={row.label} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", borderBottom: i < 6 ? "1px solid var(--border-light)" : "none", background: i % 2 === 0 ? "var(--white)" : "var(--warm-white)" }}>
                  <div style={{ padding: "15px 22px", fontSize: "13px", color: "var(--mid)", fontWeight: 500 }}>{row.label}</div>
                  <div style={{ padding: "15px 22px", fontSize: "13px", color: "var(--muted)", textAlign: "center" }}>{row.trad}</div>
                  <div style={{ padding: "15px 22px", fontSize: "13px", color: "var(--blue)", textAlign: "center", fontWeight: 600, background: "rgba(26,86,219,0.025)" }}>{row.ours}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section style={{ background: "var(--off-white)", borderTop: "1px solid var(--border-light)" }}>
        <div className="section">
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "48px" }}>
              <span className="section-label">Common Questions</span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>
                FAQ
              </h2>
            </div>
            {[
              { q: "How do you determine your cash offer?", a: "We look at recent comparable sales in your area, current market conditions, and the property's condition. Our goal is to give you a fair offer — one that reflects the real value of your home without the cost and time of repairs and listing." },
              { q: "Is the offer really with no fees?", a: "Yes. There are no agent commissions, no closing costs charged to you, and no surprise deductions. The number we offer is the number you get. We handle our own costs separately." },
              { q: "What if my house needs major repairs?", a: "That's exactly what we're built for. We buy houses as-is — including homes with foundation issues, roof damage, outdated electrical, fire or water damage, and more. The condition of your home doesn't affect our ability to close." },
              { q: "How fast can you actually close?", a: "In some cases we can close in 7 days. Most transactions close in 14–21 days. The timeline depends on clear title and your schedule — we'll work around what works for you." },
              { q: "Do I need to clean out the house?", a: "No. Leave whatever you can't take. Furniture, personal items, old belongings — we handle the cleanout after closing. You take what you want and leave the rest." },
              { q: "What markets do you buy in?", a: "We buy homes in the Phoenix, AZ metro (Maricopa County and surrounding areas) and the Dallas-Fort Worth, TX metro (DFW Metroplex)." },
            ].map((item, i) => (
              <div key={item.q} style={{ padding: "24px 0", borderBottom: i < 5 ? "1px solid var(--border-light)" : "none" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "18px", color: "var(--black)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "10px" }}>{item.q}</div>
                <p style={{ fontSize: "14px", color: "var(--mid)", lineHeight: 1.8 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARKETS ──────────────────────────────────────────── */}
      <section style={{ background: "var(--white)", borderTop: "1px solid var(--border-light)" }}>
        <div className="section">
          <div style={{ textAlign: "center", marginBottom: "44px" }}>
            <span className="section-label">Where We Buy</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>
              Phoenix & Dallas
            </h2>
          </div>
          <div className="grid-2" style={{ maxWidth: "760px", margin: "0 auto" }}>
            {[
              { city: "Phoenix", state: "AZ", areas: ["Maricopa County", "Scottsdale, Chandler, Gilbert", "Tempe, Mesa, Glendale", "Peoria, Surprise, Avondale"], body: "One of the most active residential markets in the country. We know the neighborhoods, the comps, and how to close fast." },
              { city: "Dallas", state: "TX", areas: ["DFW Metroplex", "Plano, Frisco, McKinney", "Arlington, Irving, Garland", "Fort Worth and surrounding cities"], body: "A deep, liquid market with consistent buyer demand. We've been buying in DFW for years and know every sub-market." },
            ].map((m) => (
              <div key={m.city} style={{ background: "var(--off-white)", border: "1px solid var(--border-light)", borderRadius: "var(--radius)", padding: "28px" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "14px" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "44px", color: "var(--black)", letterSpacing: "2px", lineHeight: 1 }}>{m.city}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: "var(--blue)", letterSpacing: "2px", lineHeight: 1.3 }}>{m.state}</span>
                </div>
                <p style={{ fontSize: "13.5px", color: "var(--mid)", lineHeight: 1.8, marginBottom: "14px" }}>{m.body}</p>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {m.areas.map((a) => (
                    <li key={a} style={{ fontSize: "12.5px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--blue)", display: "inline-block", flexShrink: 0 }} />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section style={{ background: "var(--black)" }}>
        <div className="section" style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 5vw, 64px)", color: "var(--white)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1, marginBottom: "16px" }}>
            Ready to See<br />Your Number?
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)", maxWidth: "380px", margin: "0 auto 32px", lineHeight: 1.75 }}>
            Fair cash offer within 24 hours. No obligation, no pressure.
          </p>
          <a href="https://highlanderbuyshomes.com/sell" className="btn-blue" style={{ padding: "15px 36px", fontSize: "15px" }}>
            Get My Cash Offer →
          </a>
        </div>
      </section>
    </>
  );
}
