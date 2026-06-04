"use client";
import { useLanguage } from "@/lib/LanguageContext";

const t = {
  en: {
    label: "Flip With Highlander",
    h1a: "INVEST IN",
    h1b: "REAL ESTATE",
    h1c: "WITHOUT THE",
    h1d: "WORK.",
    sub: "Partner with Highlander on property flips in Phoenix, AZ and Dallas, TX. We source the deal, run the rehab, and manage the sale — you put in the capital and earn a share of the profits.",
    cta: "Become a Partner",
    portal: "View Investor Portal",
    modelLabel: "The Model",
    modelH2: "How It Works",
    steps: [
      { n: "01", title: "You Bring the Capital", body: "Provide the funds needed to acquire and renovate the property. We handle every aspect of execution from day one." },
      { n: "02", title: "We Execute the Flip", body: "Our team manages acquisition, rehab, staging, and listing — keeping you updated at every milestone through your private investor portal." },
      { n: "03", title: "You Earn Your Share", body: "When the deal closes, you receive your agreed profit split directly. Transparent, documented, on time." },
    ],
    getLabel: "What You Get",
    getH2a: "Full Transparency.",
    getH2b: "Real Returns.",
    getSub: "Every investor gets access to a private portal where you can track milestones, view every expense, review documents, and follow the deal from acquisition through closing — in real time.",
    portalLink: "See the Investor Portal →",
    features: [
      { title: "JV Partnership Structure", body: "No blind pools. Each deal is its own joint venture — you know exactly what you own and what you earn." },
      { title: "Strict Underwriting", body: "We pass on far more deals than we take. Properties only enter our pipeline when the numbers hold under conservative projections." },
      { title: "We Have Skin in the Game", body: "We co-invest in every deal. Your capital gets the same scrutiny we apply to our own money." },
      { title: "Live Expense Tracking", body: "Every dollar is logged, categorized, and visible in your dashboard in real time." },
    ],
    marketsLabel: "Where We Flip",
    marketsH2: "Active Markets",
    markets: [
      { city: "Phoenix", state: "AZ", body: "Maricopa County and surrounding areas. One of the highest-velocity residential markets in the U.S. — strong appreciation and rehab demand." },
      { city: "Dallas", state: "TX", body: "DFW Metroplex. A deep, liquid market with consistent buyer demand, strong job growth, and favorable margins on value-add properties." },
    ],
    ctaLabel: "Ready to Partner?",
    ctaH2a: "Let's Talk",
    ctaH2b: "About a Deal.",
    ctaSub: "We take on a limited number of partners per year. Reach out and let's talk about your first deal.",
    ctaBtn: "Start a Conversation →",
  },
  es: {
    label: "Invierte Con Highlander",
    h1a: "INVIERTE EN",
    h1b: "BIENES RAÍCES",
    h1c: "SIN EL",
    h1d: "TRABAJO.",
    sub: "Asóciate con Highlander en proyectos de remodelación y venta en Phoenix, AZ y Dallas, TX. Nosotros encontramos el trato, ejecutamos la remodelación y gestionamos la venta — tú pones el capital y ganas una parte de las ganancias.",
    cta: "Convertirse en Socio",
    portal: "Ver Portal de Inversores",
    modelLabel: "El Modelo",
    modelH2: "Cómo Funciona",
    steps: [
      { n: "01", title: "Tú Aportas el Capital", body: "Provees los fondos necesarios para adquirir y renovar la propiedad. Nosotros manejamos cada aspecto de la ejecución desde el primer día." },
      { n: "02", title: "Nosotros Ejecutamos el Proyecto", body: "Nuestro equipo gestiona la adquisición, remodelación, amoblado y listado — manteniéndote actualizado en cada hito a través de tu portal privado de inversores." },
      { n: "03", title: "Tú Ganas Tu Parte", body: "Cuando el trato cierra, recibes tu división de ganancias acordada directamente. Transparente, documentado, a tiempo." },
    ],
    getLabel: "Qué Obtienes",
    getH2a: "Transparencia Total.",
    getH2b: "Retornos Reales.",
    getSub: "Cada inversor tiene acceso a un portal privado donde puedes rastrear hitos, ver cada gasto, revisar documentos y seguir el trato desde la adquisición hasta el cierre — en tiempo real.",
    portalLink: "Ver el Portal de Inversores →",
    features: [
      { title: "Estructura de JV (Joint Venture)", body: "Sin fondos ciegos. Cada trato es su propio joint venture — sabes exactamente qué posees y qué ganas." },
      { title: "Análisis Estricto", body: "Rechazamos muchos más tratos de los que aceptamos. Las propiedades solo entran en nuestra cartera cuando los números se sostienen bajo proyecciones conservadoras." },
      { title: "También Invertimos", body: "Co-invertimos en cada trato. Tu capital recibe el mismo escrutinio que aplicamos a nuestro propio dinero." },
      { title: "Seguimiento de Gastos en Vivo", body: "Cada dólar está registrado, categorizado y visible en tu panel de control en tiempo real." },
    ],
    marketsLabel: "Dónde Operamos",
    marketsH2: "Mercados Activos",
    markets: [
      { city: "Phoenix", state: "AZ", body: "Condado de Maricopa y áreas circundantes. Uno de los mercados residenciales de mayor velocidad en EE. UU. — fuerte apreciación y demanda de remodelación." },
      { city: "Dallas", state: "TX", body: "Área Metropolitana DFW. Un mercado profundo y líquido con demanda constante de compradores, fuerte crecimiento laboral y márgenes favorables en propiedades de valor agregado." },
    ],
    ctaLabel: "¿Listo Para Asociarte?",
    ctaH2a: "Hablemos",
    ctaH2b: "de un Trato.",
    ctaSub: "Aceptamos un número limitado de socios por año. Contáctanos y hablemos de tu primer trato.",
    ctaBtn: "Iniciar una Conversación →",
  },
};

export default function InvestPage() {
  const { lang } = useLanguage();
  const c = t[lang];

  return (
    <>
      {/* ── HEADER ───────────────────────────────────────────── */}
      <section style={{ background: "var(--near-black)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(255,255,255,0.012) 59px,rgba(255,255,255,0.012) 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(255,255,255,0.012) 59px,rgba(255,255,255,0.012) 60px)" }} />
        <div className="section" style={{ paddingBottom: "80px", position: "relative", zIndex: 1 }}>
          <span className="section-label" style={{ color: "rgba(100,150,255,0.7)" }}>{c.label}</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(48px, 7vw, 80px)", color: "var(--white)", letterSpacing: "3px", lineHeight: 0.95, textTransform: "uppercase", marginBottom: "22px" }}>
            {c.h1a}<br />{c.h1b}<br /><span style={{ color: "var(--blue)" }}>{c.h1c}<br />{c.h1d}</span>
          </h1>
          <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.5)", maxWidth: "520px", lineHeight: 1.8, fontWeight: 300, marginBottom: "36px" }}>{c.sub}</p>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <a href="https://flipwithhighlander.com/contact" className="btn-blue" style={{ padding: "15px 32px", fontSize: "15px" }}>{c.cta}</a>
            <a href="https://flipwithhighlander.com" className="btn-outline-white" style={{ padding: "14px 28px", fontSize: "14px" }}>{c.portal}</a>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ background: "var(--white)" }}>
        <div className="section">
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span className="section-label">{c.modelLabel}</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4vw, 56px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>{c.modelH2}</h2>
          </div>
          <div className="grid-3">
            {c.steps.map((s) => (
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
          <div className="grid-2-content">
            <div>
              <span className="section-label">{c.getLabel}</span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3.5vw, 44px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1.05, marginBottom: "18px" }}>
                {c.getH2a}<br />{c.getH2b}
              </h2>
              <p style={{ fontSize: "14.5px", color: "var(--mid)", lineHeight: 1.8 }}>{c.getSub}</p>
              <div style={{ marginTop: "28px" }}>
                <a href="https://flipwithhighlander.com" style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--blue)", textDecoration: "none" }}>{c.portalLink}</a>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {c.features.map((item, i) => (
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
            <span className="section-label">{c.marketsLabel}</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>{c.marketsH2}</h2>
          </div>
          <div className="grid-2" style={{ maxWidth: "760px", margin: "0 auto" }}>
            {c.markets.map((m) => (
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
          <span className="section-label" style={{ color: "rgba(255,255,255,0.3)" }}>{c.ctaLabel}</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 5vw, 64px)", color: "var(--white)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1, marginBottom: "16px" }}>
            {c.ctaH2a}<br />{c.ctaH2b}
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)", maxWidth: "380px", margin: "0 auto 32px", lineHeight: 1.75 }}>{c.ctaSub}</p>
          <a href="https://flipwithhighlander.com/contact" className="btn-blue" style={{ padding: "15px 36px", fontSize: "15px" }}>{c.ctaBtn}</a>
        </div>
      </section>
    </>
  );
}
