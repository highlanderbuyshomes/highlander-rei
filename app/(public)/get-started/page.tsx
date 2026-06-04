import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Get Started | Highlander REI",
  description:
    "Not sure which direction is right for you? Start with a free discovery call. We'll help you explore every option — sell, buy, or invest in real estate in Phoenix & Dallas.",
};

const paths = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="9" stroke="var(--blue)" strokeWidth="1.6" />
        <path d="M11 6v10M7.5 8.5C7.5 7 9 6.5 11 6.5s3.5 1.1 3.5 2.5c0 3-7 2.5-7 5.5 0 1.5 1.5 2.5 3.5 2.5s3.5-.8 3.5-2.5" stroke="var(--blue)" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    label: "Sell Your Home",
    desc: "Cash offer in 24 hours, close in as little as 7 days — or use our Flex Equity Program to repair, stage, and list for more.",
    href: "/sell",
    cta: "Explore Sell Options",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 18l5.5-5.5 4 3.5 7-9" stroke="var(--blue)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 4h4v4" stroke="var(--blue)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: "Invest With Us",
    desc: "Partner on a flip in Phoenix or Dallas. We handle acquisitions, rehab, and disposition — you bring capital, we split the profit.",
    href: "/invest",
    cta: "Learn About Investing",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="10" width="16" height="10" rx="1.5" stroke="var(--blue)" strokeWidth="1.6" />
        <path d="M1 10L11 3l10 7" stroke="var(--blue)" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    label: "Find a Property",
    desc: "Off-market investment deals and primary homes in Phoenix and Dallas. Trusted agents who know what investors actually need.",
    href: "/buy",
    cta: "Browse Options",
  },
];

const callItems = [
  {
    num: "01",
    title: "Tell us where you're at",
    body: "Selling under pressure, inherited a property, looking to invest, or just exploring — no situation is too complicated. We listen first.",
  },
  {
    num: "02",
    title: "We map out your options",
    body: "Depending on your goals, timeline, and property, we'll walk through what each path looks like — numbers, timelines, and what to expect.",
  },
  {
    num: "03",
    title: "You decide what's right",
    body: "No pressure, no obligation. If we're a fit, great. If another path makes more sense for you, we'll tell you that too.",
  },
];

export default function GetStartedPage() {
  return (
    <>
      {/* Hero */}
      <section style={{ background: "var(--near-black)", padding: "88px 48px 80px", textAlign: "center" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <span style={{ display: "inline-block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2.5px", color: "rgba(100,150,255,0.75)", marginBottom: "20px" }}>
            Discovery Call — It&apos;s Free
          </span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(48px, 7vw, 80px)", color: "var(--white)", letterSpacing: "2px", lineHeight: 1, marginBottom: "24px" }}>
            NOT SURE WHERE<br />TO START?
          </h1>
          <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: "36px", maxWidth: "520px", margin: "0 auto 36px" }}>
            Real estate decisions aren&apos;t one-size-fits-all. Whether you&apos;re selling, buying, or investing — let&apos;s talk through your situation and find the right path forward.
          </p>
          <a
            href="mailto:invest@highlanderrei.com?subject=Discovery Call Request"
            className="btn-blue"
            style={{ padding: "14px 32px", fontSize: "15px" }}
          >
            Book a Free Discovery Call
          </a>
          <p style={{ marginTop: "14px", fontSize: "12px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.3px" }}>
            Typically responds within 2 hours · No obligation
          </p>
        </div>
      </section>

      {/* What happens on the call */}
      <section className="section" style={{ paddingBottom: "72px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <span className="section-label">What to Expect</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 40px)", color: "var(--black)", letterSpacing: "1.5px", lineHeight: 1.1, marginBottom: "48px" }}>
            A STRAIGHT-FORWARD<br />CONVERSATION
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {callItems.map((item, i) => (
              <div
                key={item.num}
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 1fr",
                  gap: "24px",
                  padding: "28px 0",
                  borderBottom: i < callItems.length - 1 ? "1px solid var(--border-light)" : "none",
                }}
              >
                <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", color: "var(--border-mid)", letterSpacing: "1px", lineHeight: 1, paddingTop: "2px" }}>
                  {item.num}
                </div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--near-black)", marginBottom: "6px" }}>
                    {item.title}
                  </div>
                  <p style={{ fontSize: "14px", color: "var(--mid)", lineHeight: 1.7 }}>
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Three paths */}
      <section style={{ background: "var(--off-white)", padding: "80px 48px" }}>
        <div style={{ maxWidth: "1060px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span className="section-label">Your Options</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 40px)", color: "var(--black)", letterSpacing: "1.5px", lineHeight: 1.1 }}>
              EVERY PATH, ONE TEAM
            </h2>
          </div>
          <div className="grid-3">
            {paths.map((path) => (
              <div
                key={path.href}
                style={{ background: "var(--white)", borderRadius: "var(--radius)", border: "1px solid var(--border-light)", padding: "32px 28px", display: "flex", flexDirection: "column", gap: "16px" }}
              >
                <div style={{ width: "44px", height: "44px", borderRadius: "11px", background: "var(--blue-light)", border: "1px solid var(--blue-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {path.icon}
                </div>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--near-black)", marginBottom: "8px" }}>
                    {path.label}
                  </div>
                  <p style={{ fontSize: "13.5px", color: "var(--mid)", lineHeight: 1.65 }}>
                    {path.desc}
                  </p>
                </div>
                <Link
                  href={path.href}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "var(--blue)", textDecoration: "none", marginTop: "auto" }}
                >
                  {path.cta}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8M8 4l3 3-3 3" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Markets */}
      <section className="section" style={{ paddingTop: "72px", paddingBottom: "72px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", textAlign: "center" }}>
          <span className="section-label">Markets We Serve</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.5vw, 38px)", color: "var(--black)", letterSpacing: "1.5px", lineHeight: 1.1, marginBottom: "16px" }}>
            PHOENIX, AZ &amp; DALLAS, TX
          </h2>
          <p style={{ fontSize: "14.5px", color: "var(--mid)", lineHeight: 1.7, marginBottom: "36px" }}>
            We actively buy, sell, and invest in both markets — and we know the neighborhoods, pricing, and timelines that matter.
          </p>
          <a
            href="mailto:invest@highlanderrei.com?subject=Discovery Call Request"
            className="btn-blue"
            style={{ padding: "13px 30px", fontSize: "14px" }}
          >
            Start with a Call
          </a>
        </div>
      </section>

      {/* FAQ strip */}
      <section style={{ background: "var(--near-black)", padding: "72px 48px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <span style={{ display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", color: "rgba(100,150,255,0.7)", marginBottom: "36px" }}>
            Common Questions
          </span>
          {[
            {
              q: "Is the discovery call really free?",
              a: "Yes — no cost, no obligation. We spend 20–30 minutes understanding your situation and walking through options that make sense for you.",
            },
            {
              q: "What if I don't know what I want yet?",
              a: "That's exactly what the call is for. Most people come in unsure — we help you get clarity before making any decisions.",
            },
            {
              q: "Do you work with people outside Phoenix and Dallas?",
              a: "Our active buying and investing is currently in PHX and DFW. If you're outside those markets, reach out anyway — we may still be able to help or refer you.",
            },
            {
              q: "How fast can things move once I decide?",
              a: "As fast as you need. Cash offers go out within 24 hours. If you want to close in a week, we can make that happen. If you need more time, no problem.",
            },
          ].map((faq, i, arr) => (
            <div
              key={i}
              style={{ paddingBottom: "24px", marginBottom: "24px", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none" }}
            >
              <div style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--white)", marginBottom: "8px" }}>
                {faq.q}
              </div>
              <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
