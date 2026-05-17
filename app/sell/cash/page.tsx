"use client";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

const t = {
  en: {
    back: "← Back to Sell Options",
    label: "Cash Offer",
    h1: ["SELL YOUR", "HOUSE FOR", "CASH. FAST."],
    sub: "We buy houses in Phoenix, AZ and Dallas, TX in any condition — no repairs, no cleanout, no agent fees. Get a fair cash offer within 24 hours and close on your timeline.",
    stats: [
      { val: "24 hrs", label: "Offer timeline" },
      { val: "7 days", label: "Fastest close" },
      { val: "14–21", label: "Typical close" },
      { val: "$0", label: "Fees or repairs" },
    ],
    cta: "Get My Cash Offer →",
    processLabel: "The Process",
    processH2: "Three Steps to Sold",
    steps: [
      { n: "01", title: "Tell Us About Your Home", body: "Enter your address and answer a few quick questions about your property. No commitment required — takes less than 3 minutes." },
      { n: "02", title: "Receive Your Offer", body: "We review your property and send a fair, all-cash, no-obligation offer within 24 hours. No lowball tactics — a real number based on real data." },
      { n: "03", title: "Close on Your Timeline", body: "You pick the date. Close in as little as 7 days. Most transactions close in 14–21 days. We work around your schedule." },
    ],
    sitLabel: "Any Situation",
    sitH2: "We Buy in Every Situation",
    sitSub: "No matter what's going on — we've seen it. We buy houses as-is, in any condition, from homeowners in every situation.",
    situations: [
      { title: "Inherited Property", body: "Inherited a home you don't want to manage, repair, or list? We close fast with minimal paperwork and handle the details so you don't have to." },
      { title: "Facing Foreclosure", body: "Behind on payments or facing foreclosure? A cash sale can close before the bank acts — protecting your credit and putting cash in your pocket." },
      { title: "Divorce or Separation", body: "Need to liquidate a jointly-owned property quickly and cleanly? We make the process straightforward, fast, and conflict-free." },
      { title: "Relocation", body: "Moving for a job or life change and need to sell without the dragged-out listing process? We close on your schedule — not the market's." },
      { title: "Major Repairs Needed", body: "Foundation issues, roof damage, outdated systems — we buy as-is. No repairs, no inspections from buyers, no re-negotiations after inspections." },
      { title: "Vacant or Rental Property", body: "Tired of managing a vacant property or dealing with tenants? We buy occupied and vacant homes alike — hassle-free." },
    ],
    compareLabel: "Why Cash?",
    compareH2: "Cash Offer vs. Traditional Listing",
    compareHeaders: ["Traditional", "Highlander Cash"],
    rows: [
      { label: "Offer timeline", trad: "Weeks to months", ours: "24 hours" },
      { label: "Repairs required", trad: "Usually yes", ours: "Never" },
      { label: "Showings", trad: "Many, over weeks", ours: "None" },
      { label: "Closing time", trad: "30–60 days", ours: "As fast as 7 days" },
      { label: "Agent commission", trad: "5–6%", ours: "$0" },
      { label: "Deal certainty", trad: "Can fall through", ours: "Guaranteed cash" },
      { label: "Sale price", trad: "Market — if it sells", ours: "Fair market value" },
    ],
    faqLabel: "Common Questions",
    faqH2: "FAQ",
    faqs: [
      { q: "How do you determine your cash offer?", a: "We look at recent comparable sales in your area, current market conditions, and the property's condition. Our goal is to give you a fair offer — one that reflects the real value of your home without the cost and time of repairs and listing." },
      { q: "Is the offer really with no fees?", a: "Yes. There are no agent commissions, no closing costs charged to you, and no surprise deductions. The number we offer is the number you get. We handle our own costs separately." },
      { q: "What if my house needs major repairs?", a: "That's exactly what we're built for. We buy houses as-is — including homes with foundation issues, roof damage, outdated electrical, fire or water damage, and more. The condition of your home doesn't affect our ability to close." },
      { q: "How fast can you actually close?", a: "In some cases we can close in 7 days. Most transactions close in 14–21 days. The timeline depends on clear title and your schedule — we'll work around what works for you." },
      { q: "Do I need to clean out the house?", a: "No. Leave whatever you can't take. Furniture, personal items, old belongings — we handle the cleanout after closing. You take what you want and leave the rest." },
      { q: "What markets do you buy in?", a: "We buy homes in the Phoenix, AZ metro (Maricopa County and surrounding areas) and the Dallas-Fort Worth, TX metro (DFW Metroplex)." },
    ],
    marketsLabel: "Where We Buy",
    marketsH2: "Phoenix & Dallas",
    markets: [
      { city: "Phoenix", state: "AZ", areas: ["Maricopa County", "Scottsdale, Chandler, Gilbert", "Tempe, Mesa, Glendale", "Peoria, Surprise, Avondale"], body: "One of the most active residential markets in the country. We know the neighborhoods, the comps, and how to close fast." },
      { city: "Dallas", state: "TX", areas: ["DFW Metroplex", "Plano, Frisco, McKinney", "Arlington, Irving, Garland", "Fort Worth and surrounding cities"], body: "A deep, liquid market with consistent buyer demand. We've been buying in DFW for years and know every sub-market." },
    ],
    ctaH2: ["Ready to See", "Your Number?"],
    ctaSub: "Fair cash offer within 24 hours. No obligation, no pressure.",
  },
  es: {
    back: "← Volver a Opciones de Venta",
    label: "Oferta en Efectivo",
    h1: ["VENDE TU", "CASA POR", "EFECTIVO. YA."],
    sub: "Compramos casas en Phoenix, AZ y Dallas, TX en cualquier condición — sin reparaciones, sin limpiezas, sin comisiones de agente. Recibe una oferta justa en efectivo en 24 horas y cierra cuando quieras.",
    stats: [
      { val: "24 hrs", label: "Tiempo de oferta" },
      { val: "7 días", label: "Cierre más rápido" },
      { val: "14–21", label: "Cierre típico" },
      { val: "$0", label: "Comisiones o reparaciones" },
    ],
    cta: "Obtener Mi Oferta →",
    processLabel: "El Proceso",
    processH2: "Tres Pasos Para Vender",
    steps: [
      { n: "01", title: "Cuéntanos Sobre Tu Casa", body: "Ingresa tu dirección y responde algunas preguntas rápidas sobre tu propiedad. Sin compromiso — toma menos de 3 minutos." },
      { n: "02", title: "Recibe Tu Oferta", body: "Revisamos tu propiedad y te enviamos una oferta justa en efectivo, sin obligación, en 24 horas. Sin tácticas de baja — un número real basado en datos reales." },
      { n: "03", title: "Cierra Cuando Quieras", body: "Tú eliges la fecha. Cierra en tan solo 7 días. La mayoría de las transacciones cierran en 14–21 días. Nos adaptamos a tu agenda." },
    ],
    sitLabel: "Cualquier Situación",
    sitH2: "Compramos en Cualquier Situación",
    sitSub: "No importa lo que esté pasando — lo hemos visto todo. Compramos casas tal como están, en cualquier condición, en cualquier situación.",
    situations: [
      { title: "Propiedad Heredada", body: "¿Heredaste una casa que no quieres administrar, reparar o listar? Cerramos rápido con mínimo papeleo y nos encargamos de los detalles." },
      { title: "Enfrentando Ejecución Hipotecaria", body: "¿Atrasado en pagos o enfrentando ejecución hipotecaria? Una venta en efectivo puede cerrar antes de que actúe el banco — protegiendo tu crédito." },
      { title: "Divorcio o Separación", body: "¿Necesitas liquidar una propiedad compartida de forma rápida y limpia? Hacemos el proceso sencillo, rápido y sin conflictos." },
      { title: "Reubicación", body: "¿Te mudas por trabajo o un cambio de vida? Cerramos según tu agenda — no la del mercado." },
      { title: "Reparaciones Mayores Necesarias", body: "Problemas de cimentación, daños en el techo, sistemas desactualizados — compramos tal como está. Sin reparaciones, sin inspecciones de compradores." },
      { title: "Propiedad Vacante o de Renta", body: "¿Cansado de administrar una propiedad vacante o lidiar con inquilinos? Compramos casas ocupadas y vacantes por igual — sin complicaciones." },
    ],
    compareLabel: "¿Por Qué Efectivo?",
    compareH2: "Oferta en Efectivo vs. Listado Tradicional",
    compareHeaders: ["Tradicional", "Highlander Efectivo"],
    rows: [
      { label: "Tiempo de oferta", trad: "Semanas o meses", ours: "24 horas" },
      { label: "Reparaciones", trad: "Generalmente sí", ours: "Nunca" },
      { label: "Visitas", trad: "Muchas, por semanas", ours: "Ninguna" },
      { label: "Tiempo de cierre", trad: "30–60 días", ours: "Desde 7 días" },
      { label: "Comisión de agente", trad: "5–6%", ours: "$0" },
      { label: "Certeza de venta", trad: "Puede caerse", ours: "Efectivo garantizado" },
      { label: "Precio de venta", trad: "Mercado — si se vende", ours: "Valor justo de mercado" },
    ],
    faqLabel: "Preguntas Frecuentes",
    faqH2: "FAQ",
    faqs: [
      { q: "¿Cómo determinan su oferta en efectivo?", a: "Analizamos ventas comparables recientes en tu área, las condiciones actuales del mercado y el estado de la propiedad. Nuestro objetivo es darte una oferta justa que refleje el valor real de tu casa sin el costo y tiempo de reparaciones y listado." },
      { q: "¿La oferta realmente no tiene comisiones?", a: "Sí. No hay comisiones de agentes, sin costos de cierre para ti y sin deducciones sorpresa. El número que ofrecemos es el número que recibes. Nosotros manejamos nuestros propios costos." },
      { q: "¿Qué pasa si mi casa necesita reparaciones mayores?", a: "Para eso estamos. Compramos casas tal como están — incluyendo casas con problemas de cimentación, daños en el techo, electricidad desactualizada, daño por fuego o agua, y más." },
      { q: "¿Qué tan rápido pueden cerrar realmente?", a: "En algunos casos podemos cerrar en 7 días. La mayoría de las transacciones cierran en 14–21 días. El plazo depende del título claro y tu agenda — nos adaptamos." },
      { q: "¿Necesito limpiar la casa?", a: "No. Deja lo que no puedas llevarte. Muebles, artículos personales, pertenencias viejas — nosotros nos encargamos de la limpieza después del cierre." },
      { q: "¿En qué mercados compran?", a: "Compramos casas en el área metropolitana de Phoenix, AZ (Condado de Maricopa y áreas circundantes) y en el área metropolitana de Dallas-Fort Worth, TX." },
    ],
    marketsLabel: "Dónde Compramos",
    marketsH2: "Phoenix y Dallas",
    markets: [
      { city: "Phoenix", state: "AZ", areas: ["Condado de Maricopa", "Scottsdale, Chandler, Gilbert", "Tempe, Mesa, Glendale", "Peoria, Surprise, Avondale"], body: "Uno de los mercados residenciales más activos del país. Conocemos los vecindarios, los comparables y cómo cerrar rápido." },
      { city: "Dallas", state: "TX", areas: ["Área Metropolitana DFW", "Plano, Frisco, McKinney", "Arlington, Irving, Garland", "Fort Worth y ciudades cercanas"], body: "Un mercado profundo y líquido con demanda constante de compradores. Llevamos años comprando en DFW y conocemos cada submercado." },
    ],
    ctaH2: ["¿Listo Para Ver", "Tu Número?"],
    ctaSub: "Oferta justa en efectivo en 24 horas. Sin obligación, sin presión.",
  },
};

export default function CashOfferPage() {
  const { lang } = useLanguage();
  const c = t[lang];

  return (
    <>
      {/* ── HEADER ───────────────────────────────────────────── */}
      <section style={{ background: "var(--near-black)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(255,255,255,0.012) 59px,rgba(255,255,255,0.012) 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(255,255,255,0.012) 59px,rgba(255,255,255,0.012) 60px)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "var(--blue)" }} />
        <div className="section" style={{ paddingBottom: "80px", position: "relative", zIndex: 1 }}>
          <Link href="/sell" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "rgba(255,255,255,0.4)", textDecoration: "none", marginBottom: "28px" }}>
            {c.back}
          </Link>
          <span className="section-label" style={{ color: "rgba(100,150,255,0.7)" }}>{c.label}</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(48px, 7vw, 80px)", color: "var(--white)", letterSpacing: "3px", lineHeight: 0.95, textTransform: "uppercase", marginBottom: "22px" }}>
            {c.h1[0]}<br />{c.h1[1]}<br />{c.h1[2]}
          </h1>
          <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.7)", maxWidth: "520px", lineHeight: 1.8, fontWeight: 300, marginBottom: "32px" }}>
            {c.sub}
          </p>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "36px" }}>
            {c.stats.map((s) => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "var(--radius-sm)", padding: "14px 20px", minWidth: "110px" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "26px", color: "var(--white)", letterSpacing: "1px" }}>{s.val}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "1px", marginTop: "2px" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <a href="https://highlanderbuyshomes.com/sell" className="btn-blue" style={{ padding: "15px 32px", fontSize: "15px" }}>
            {c.cta}
          </a>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ background: "var(--white)" }}>
        <div className="section">
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <span className="section-label">{c.processLabel}</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4vw, 56px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>
              {c.processH2}
            </h2>
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

      {/* ── WHO WE BUY FROM ──────────────────────────────────── */}
      <section style={{ background: "var(--off-white)", borderTop: "1px solid var(--border-light)" }}>
        <div className="section">
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <span className="section-label">{c.sitLabel}</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 52px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>
              {c.sitH2}
            </h2>
            <p style={{ fontSize: "15px", color: "var(--mid)", maxWidth: "560px", margin: "16px auto 0", lineHeight: 1.8 }}>
              {c.sitSub}
            </p>
          </div>
          <div className="grid-3">
            {c.situations.map((item) => (
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
              <span className="section-label">{c.compareLabel}</span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>
                {c.compareH2}
              </h2>
            </div>
            <div style={{ background: "var(--white)", border: "1px solid var(--border-light)", borderRadius: "var(--radius)", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", background: "var(--off-white)", borderBottom: "1px solid var(--border-light)" }}>
                <div style={{ padding: "12px 22px" }} />
                <div style={{ padding: "12px 22px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--muted)", textAlign: "center" }}>{c.compareHeaders[0]}</div>
                <div style={{ padding: "12px 22px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--blue)", textAlign: "center", background: "var(--blue-light)" }}>{c.compareHeaders[1]}</div>
              </div>
              {c.rows.map((row, i) => (
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
              <span className="section-label">{c.faqLabel}</span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>
                {c.faqH2}
              </h2>
            </div>
            {c.faqs.map((item, i) => (
              <div key={item.q} style={{ padding: "24px 0", borderBottom: i < c.faqs.length - 1 ? "1px solid var(--border-light)" : "none" }}>
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
            <span className="section-label">{c.marketsLabel}</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", color: "var(--black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>
              {c.marketsH2}
            </h2>
          </div>
          <div className="grid-2" style={{ maxWidth: "760px", margin: "0 auto" }}>
            {c.markets.map((m) => (
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
            {c.ctaH2[0]}<br />{c.ctaH2[1]}
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)", maxWidth: "380px", margin: "0 auto 32px", lineHeight: 1.75 }}>
            {c.ctaSub}
          </p>
          <a href="https://highlanderbuyshomes.com/sell" className="btn-blue" style={{ padding: "15px 36px", fontSize: "15px" }}>
            {c.cta}
          </a>
        </div>
      </section>
    </>
  );
}
