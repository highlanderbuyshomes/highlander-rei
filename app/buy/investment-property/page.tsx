"use client";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import InvestorForm from "./InvestorForm";

const t = {
  en: {
    back: "← Back to Buy",
    label: "Investment Properties",
    h1a: "OFF-MARKET",
    h1b: "DEALS IN",
    h1c: "PHX & DFW.",
    sub: "We source distressed, value-add, and off-market properties across Phoenix and Dallas. Tell us what you're looking for and we'll get to work.",
    cta: "Tell Us What You're Looking For →",
    typesLabel: "Deal Types",
    typesH2: "What We Source",
    types: [
      { title: "Fix & Flip", body: "Distressed single-family properties with clear upside. We know the numbers — ARV, rehab cost, and margin — before we bring you a deal." },
      { title: "Buy & Hold", body: "Cash-flowing rental properties in proven neighborhoods. We source deals that make sense on day one, not just in theory." },
      { title: "Value-Add", body: "Properties with below-market rents, deferred maintenance, or conversion potential. Significant upside for the right buyer." },
    ],
    whyLabel: "Why Highlander",
    whyH2a: "Deal Flow You Can't",
    whyH2b: "Find on the MLS",
    why: [
      { title: "Off-Market Access", body: "We source directly from motivated sellers — probate, divorce, delinquent taxes, and direct mail campaigns. These deals never hit Zillow." },
      { title: "Conservative Underwriting", body: "We run the numbers hard. We pass on far more deals than we take, and every deal we bring is underwritten under conservative assumptions." },
      { title: "Market Depth", body: "Six-plus years of deal flow in Phoenix and Dallas means we know which zip codes perform, which neighborhoods are turning, and where the margins are." },
      { title: "No Obligation", body: "Tell us what you're looking for and we'll send you deals as they come. No fees, no commitment — just first access to our pipeline." },
    ],
    ctaH2a: "Get on Our",
    ctaH2b: "Deal List.",
    ctaSub: "Tell us your buy box — market, price range, deal type — and we'll send you deals as they come through our pipeline.",
    ctaBtn: "Join the Deal List →",
  },
  es: {
    back: "← Volver a Comprar",
    label: "Propiedades de Inversión",
    h1a: "TRATOS FUERA",
    h1b: "DEL MERCADO EN",
    h1c: "PHX Y DFW.",
    sub: "Obtenemos propiedades en dificultades, de valor agregado y fuera del mercado en Phoenix y Dallas. Dinos lo que buscas y nos ponemos a trabajar.",
    cta: "Dinos Qué Estás Buscando →",
    typesLabel: "Tipos de Tratos",
    typesH2: "Qué Obtenemos",
    types: [
      { title: "Comprar y Revender", body: "Propiedades unifamiliares en dificultades con claro potencial de ganancia. Conocemos los números — ARV, costo de remodelación y margen — antes de traerte un trato." },
      { title: "Comprar y Mantener", body: "Propiedades de renta con flujo de caja en vecindarios comprobados. Obtenemos tratos que tienen sentido desde el primer día, no solo en teoría." },
      { title: "Valor Agregado", body: "Propiedades con rentas por debajo del mercado, mantenimiento diferido o potencial de conversión. Gran potencial de ganancia para el comprador correcto." },
    ],
    whyLabel: "Por Qué Highlander",
    whyH2a: "Flujo de Tratos que No",
    whyH2b: "Encontrarás en el MLS",
    why: [
      { title: "Acceso Fuera del Mercado", body: "Obtenemos directamente de vendedores motivados — sucesiones, divorcios, impuestos morosos y campañas de correo directo. Estos tratos nunca llegan a Zillow." },
      { title: "Análisis Conservador", body: "Analizamos los números a fondo. Rechazamos muchos más tratos de los que aceptamos, y cada trato que presentamos se analiza bajo supuestos conservadores." },
      { title: "Profundidad de Mercado", body: "Más de seis años de flujo de tratos en Phoenix y Dallas significa que sabemos qué códigos postales rinden, qué vecindarios están cambiando y dónde están los márgenes." },
      { title: "Sin Compromiso", body: "Dinos lo que buscas y te enviaremos tratos a medida que lleguen. Sin tarifas, sin compromiso — solo primer acceso a nuestra cartera." },
    ],
    ctaH2a: "Únete a Nuestra",
    ctaH2b: "Lista de Tratos.",
    ctaSub: "Cuéntanos tu criterio — mercado, rango de precio, tipo de trato — y te enviaremos tratos a medida que pasen por nuestra cartera.",
    ctaBtn: "Unirse a la Lista →",
  },
};

export default function InvestmentPropertyPage() {
  const { lang } = useLanguage();
  const c = t[lang];

  return (
    <>
      {/* ── HEADER ───────────────────────────────────────────── */}
      <section style={{ background: "var(--near-black)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(255,255,255,0.012) 59px,rgba(255,255,255,0.012) 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(255,255,255,0.012) 59px,rgba(255,255,255,0.012) 60px)" }} />
        <div className="section" style={{ paddingBottom: "80px", position: "relative", zIndex: 1 }}>
          <Link href="/buy" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "rgba(255,255,255,0.4)", textDecoration: "none", marginBottom: "28px" }}>
            {c.back}
          </Link>
          <span className="section-label" style={{ color: "rgba(100,150,255,0.7)" }}>{c.label}</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(48px, 7vw, 80px)", color: "var(--white)", letterSpacing: "3px", lineHeight: 0.95, textTransform: "uppercase", marginBottom: "22px" }}>
            {c.h1a}<br />{c.h1b}<br /><span style={{ color: "var(--blue)" }}>{c.h1c}</span>
          </h1>
          <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.5)", maxWidth: "520px", lineHeight: 1.8, fontWeight: 300, marginBottom: "36px" }}>{c.sub}</p>
          <a href="#investor-form" className="btn-blue" style={{ padding: "15px 32px", fontSize: "15px" }}>{c.cta}</a>
        </div>
      </section>

      {/* ── WHAT WE SOURCE ───────────────────────────────────── */}
      <section style={{ background: "var(--white)" }}>
        <div className="section">
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <span className="section-label">{c.typesLabel}</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4vw, 52px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>{c.typesH2}</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {c.types.map((s) => (
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
              <span className="section-label">{c.whyLabel}</span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>
                {c.whyH2a}<br />{c.whyH2b}
              </h2>
            </div>
            {c.why.map((item, i) => (
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

      {/* ── INVESTOR FORM ────────────────────────────────────── */}
      <section id="investor-form" style={{ background: "var(--off-white)", borderTop: "1px solid var(--border-light)" }}>
        <div className="section">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "64px", alignItems: "start", maxWidth: "1000px", margin: "0 auto" }}>
            <div style={{ paddingTop: "8px" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 4vw, 56px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1, marginBottom: "16px" }}>
                {c.ctaH2a}<br />{c.ctaH2b}
              </h2>
              <p style={{ fontSize: "15px", color: "var(--mid)", lineHeight: 1.8 }}>{c.ctaSub}</p>
            </div>
            <InvestorForm />
          </div>
        </div>
      </section>
    </>
  );
}
