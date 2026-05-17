"use client";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

const t = {
  en: {
    back: "← Back to Buy",
    label: "Find a Home",
    h1a: "FIND YOUR",
    h1b: "NEXT HOME",
    h1c: "IN PHX OR DFW.",
    sub: "We know Phoenix and Dallas inside and out. We'll connect you with trusted agents and off-market inventory so you find the right home at the right price.",
    cta: "Start Your Search →",
    marketsLabel: "Where We Operate",
    marketsH2a: "Two Markets.",
    marketsH2b: "Deep Expertise.",
    markets: [
      { city: "Phoenix", state: "AZ", highlights: ["Maricopa County and East Valley", "Scottsdale, Chandler, Gilbert, Tempe", "New construction and resale options", "Strong appreciation, growing job market"] },
      { city: "Dallas", state: "TX", highlights: ["DFW Metroplex — Plano, Frisco, McKinney", "No state income tax", "Strong job market and employer base", "Consistent buyer demand and liquidity"] },
    ],
    howLabel: "How We Help",
    howH2: "More Than a Referral",
    how: [
      { n: "01", title: "Market Briefing", body: "We walk you through current conditions, neighborhoods, price ranges, and what to expect — before you talk to a single agent." },
      { n: "02", title: "Agent Connection", body: "We connect you with agents we actually trust. People who know the market, won't waste your time, and work hard for buyers." },
      { n: "03", title: "Off-Market Access", body: "Our deal sourcing pipeline occasionally surfaces homes before they hit the MLS. First access goes to buyers in our network." },
    ],
    ctaH2a: "Tell Us Where",
    ctaH2b: "You're Looking.",
    ctaSub: "Share your search criteria and we'll point you in the right direction — no strings attached.",
  },
  es: {
    back: "← Volver a Comprar",
    label: "Encontrar una Casa",
    h1a: "ENCUENTRA TU",
    h1b: "PRÓXIMA CASA",
    h1c: "EN PHX O DFW.",
    sub: "Conocemos Phoenix y Dallas por dentro y por fuera. Te conectaremos con agentes de confianza e inventario fuera del mercado para que encuentres la casa correcta al precio correcto.",
    cta: "Comenzar Tu Búsqueda →",
    marketsLabel: "Dónde Operamos",
    marketsH2a: "Dos Mercados.",
    marketsH2b: "Experiencia Profunda.",
    markets: [
      { city: "Phoenix", state: "AZ", highlights: ["Condado de Maricopa y East Valley", "Scottsdale, Chandler, Gilbert, Tempe", "Opciones de construcción nueva y reventa", "Fuerte apreciación, mercado laboral en crecimiento"] },
      { city: "Dallas", state: "TX", highlights: ["Área Metropolitana DFW — Plano, Frisco, McKinney", "Sin impuesto estatal sobre la renta", "Fuerte mercado laboral y base empresarial", "Demanda constante de compradores y liquidez"] },
    ],
    howLabel: "Cómo Ayudamos",
    howH2: "Más Que una Referencia",
    how: [
      { n: "01", title: "Información del Mercado", body: "Te explicamos las condiciones actuales, vecindarios, rangos de precios y qué esperar — antes de que hables con un solo agente." },
      { n: "02", title: "Conexión con Agentes", body: "Te conectamos con agentes en los que realmente confiamos. Personas que conocen el mercado, no desperdiciarán tu tiempo y trabajan duro para los compradores." },
      { n: "03", title: "Acceso Fuera del Mercado", body: "Nuestra cartera de búsqueda de tratos a veces encuentra casas antes de que lleguen al MLS. El primer acceso va a los compradores en nuestra red." },
    ],
    ctaH2a: "Dinos Dónde",
    ctaH2b: "Estás Buscando.",
    ctaSub: "Comparte tus criterios de búsqueda y te orientaremos en la dirección correcta — sin compromiso.",
  },
};

export default function FindHomePage() {
  const { lang } = useLanguage();
  const c = t[lang];

  return (
    <>
      {/* ── HEADER ───────────────────────────────────────────── */}
      <section style={{ background: "var(--blue)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(255,255,255,0.03) 59px,rgba(255,255,255,0.03) 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(255,255,255,0.03) 59px,rgba(255,255,255,0.03) 60px)" }} />
        <div className="section" style={{ paddingBottom: "80px", position: "relative", zIndex: 1 }}>
          <Link href="/buy" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "rgba(255,255,255,0.5)", textDecoration: "none", marginBottom: "28px" }}>
            {c.back}
          </Link>
          <span className="section-label" style={{ color: "rgba(255,255,255,0.4)" }}>{c.label}</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(48px, 7vw, 80px)", color: "var(--white)", letterSpacing: "3px", lineHeight: 0.95, textTransform: "uppercase", marginBottom: "22px" }}>
            {c.h1a}<br />{c.h1b}<br />{c.h1c}
          </h1>
          <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.65)", maxWidth: "500px", lineHeight: 1.8, fontWeight: 300, marginBottom: "36px" }}>{c.sub}</p>
          <a href="https://highlanderbuyshomes.com/contact" className="btn-outline-white" style={{ padding: "15px 32px", fontSize: "15px" }}>{c.cta}</a>
        </div>
      </section>

      {/* ── MARKETS ──────────────────────────────────────────── */}
      <section style={{ background: "var(--white)" }}>
        <div className="section">
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <span className="section-label">{c.marketsLabel}</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4vw, 52px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>
              {c.marketsH2a}<br />{c.marketsH2b}
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", maxWidth: "860px", margin: "0 auto" }}>
            {c.markets.map((m) => (
              <div key={m.city} style={{ background: "var(--off-white)", border: "1px solid var(--border-light)", borderRadius: "var(--radius)", padding: "32px 28px" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "20px" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "44px", color: "var(--black)", letterSpacing: "2px", lineHeight: 1 }}>{m.city}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: "var(--blue)", letterSpacing: "2px", lineHeight: 1.3 }}>{m.state}</span>
                </div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {m.highlights.map((h) => (
                    <li key={h} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13.5px", color: "var(--mid)" }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: "1px" }}>
                        <circle cx="8" cy="8" r="7.5" fill="var(--blue-light)" />
                        <path d="M5 8l2.2 2.2 3.8-3.8" stroke="var(--blue)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW WE HELP ──────────────────────────────────────── */}
      <section style={{ background: "var(--off-white)", borderTop: "1px solid var(--border-light)" }}>
        <div className="section">
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <span className="section-label">{c.howLabel}</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>{c.howH2}</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {c.how.map((s) => (
              <div key={s.n} style={{ background: "var(--white)", border: "1px solid var(--border-light)", borderRadius: "var(--radius)", padding: "28px 24px" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "13px", color: "var(--blue)", letterSpacing: "2px", marginBottom: "14px" }}>{s.n}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--black)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>{s.title}</h3>
                <p style={{ fontSize: "13px", color: "var(--mid)", lineHeight: 1.8 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section style={{ background: "var(--black)" }}>
        <div className="section" style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 5vw, 64px)", color: "var(--white)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1, marginBottom: "16px" }}>
            {c.ctaH2a}<br />{c.ctaH2b}
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)", maxWidth: "380px", margin: "0 auto 32px", lineHeight: 1.75 }}>{c.ctaSub}</p>
          <a href="https://highlanderbuyshomes.com/contact" className="btn-blue" style={{ padding: "15px 36px", fontSize: "15px" }}>{c.cta}</a>
        </div>
      </section>
    </>
  );
}
