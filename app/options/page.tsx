import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Explore Your Options | Highlander REI",
  description:
    "Not sure whether to sell for cash, list traditionally, or invest your real estate equity? Compare all your options side by side.",
};

const scenarios = [
  {
    tag: "I need to sell fast",
    title: "Cash Offer",
    color: "var(--blue)",
    colorLight: "var(--blue-light)",
    colorBorder: "var(--blue-border)",
    points: [
      "Offer within 24 hours",
      "Close in as little as 14 days",
      "No repairs, no showings",
      "No agent commissions",
      "Guaranteed closing — no fall-through risk",
    ],
    cta: "Get My Cash Offer",
    href: "/sell",
    best: "Best if you need speed, certainty, or are selling as-is.",
  },
  {
    tag: "I want top dollar",
    title: "Traditional Listing",
    color: "var(--charcoal)",
    colorLight: "var(--off-white)",
    colorBorder: "var(--border-mid)",
    points: [
      "Potentially higher sale price",
      "Full market exposure via MLS",
      "Repairs and staging typically required",
      "30–90 day closing timeline",
      "5–6% agent commission",
    ],
    cta: "Learn the Tradeoffs",
    href: "/options#compare",
    best: "Best if your home is market-ready and you have time to wait.",
  },
  {
    tag: "I want my money working",
    title: "Invest with Highlander",
    color: "var(--blue)",
    colorLight: "var(--blue-light)",
    colorBorder: "var(--blue-border)",
    points: [
      "Deploy capital into real estate flips",
      "We source, manage, and close every deal",
      "Earn a share of the profit at closing",
      "Active markets in Phoenix and Dallas",
      "Full transparency via investor portal",
    ],
    cta: "Learn About Investing",
    href: "/invest",
    best: "Best if you want passive returns and are comfortable with real estate risk.",
  },
];

export default function OptionsPage() {
  return (
    <>
      {/* ── HEADER ───────────────────────────────────────────── */}
      <section style={{ background: "var(--off-white)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="section" style={{ paddingBottom: "64px", textAlign: "center" }}>
          <span className="section-label">Find Your Path</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(44px, 7vw, 80px)", color: "var(--black)", letterSpacing: "3px", lineHeight: 0.95, textTransform: "uppercase", marginBottom: "22px" }}>
            EXPLORE YOUR<br />OPTIONS.
          </h1>
          <p style={{ fontSize: "17px", color: "var(--mid)", maxWidth: "520px", margin: "0 auto", lineHeight: 1.8, fontWeight: 300 }}>
            Every situation is different. {"Here's"} an honest look at your three paths — so you can make the decision {"that's"} right for you.
          </p>
        </div>
      </section>

      {/* ── SCENARIOS ────────────────────────────────────────── */}
      <section style={{ background: "var(--white)" }}>
        <div className="section">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {scenarios.map((s) => (
              <div key={s.title} style={{ background: s.colorLight, border: `1px solid ${s.colorBorder}`, borderRadius: "var(--radius)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ height: "4px", background: s.color }} />
                <div style={{ padding: "28px 26px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "14px" }}>{s.tag}</div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "28px", color: "var(--black)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "20px" }}>{s.title}</h2>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px", flex: 1 }}>
                    {s.points.map((p) => (
                      <li key={p} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13.5px", color: "var(--mid)" }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: "1px" }}>
                          <circle cx="8" cy="8" r="7.5" fill="white" />
                          <path d="M5 8l2.2 2.2 3.8-3.8" stroke={s.color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {p}
                      </li>
                    ))}
                  </ul>
                  <div style={{ fontSize: "12px", color: "var(--muted)", fontStyle: "italic", marginBottom: "20px", lineHeight: 1.6 }}>{s.best}</div>
                  <Link href={s.href} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13.5px", fontWeight: 600, color: s.color, textDecoration: "none" }}>
                    {s.cta} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DECISION GUIDE ───────────────────────────────────── */}
      <section id="compare" style={{ background: "var(--near-black)" }}>
        <div className="section">
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <span className="section-label" style={{ color: "rgba(255,255,255,0.35)" }}>Still Deciding?</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4vw, 52px)", color: "var(--white)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>
              Ask Yourself This
            </h2>
          </div>

          <div style={{ maxWidth: "700px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "0" }}>
            {[
              { q: "Do you need to close in the next 30–60 days?", a: "Cash offer is likely your best path.", path: "/sell", label: "Get a Cash Offer" },
              { q: "Is your home in need of major repairs or updates?", a: "We buy as-is. No repairs, no cleaning, no staging required.", path: "/sell", label: "Get a Cash Offer" },
              { q: "Do you have capital you want to put to work?", a: "Partner with us on a flip and earn a share of the returns.", path: "/invest", label: "Learn About Investing" },
              { q: "Are you weighing several options and not sure?", a: "Start with a free cash offer — it costs nothing and gives you a real number to compare against.", path: "/sell", label: "Get a Free Offer" },
            ].map((item, i) => (
              <div key={item.q} style={{ padding: "28px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.08)" : "none", display: "grid", gridTemplateColumns: "1fr auto", gap: "32px", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--white)", marginBottom: "6px" }}>{item.q}</div>
                  <div style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>{item.a}</div>
                </div>
                <Link href={item.path} style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--blue)", textDecoration: "none", whiteSpace: "nowrap" }}>
                  {item.label} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
