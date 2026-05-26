"use client";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

const content = {
  en: {
    hero: {
      badge: "Phoenix, AZ · Dallas, TX",
      h1: ["GET A FAIR", "CASH OFFER", "IN 24 HOURS."],
      sub: "We buy houses in any condition — no repairs, no agent fees, no stress. Close in as little as 7 days.",
      cta: "Get My Cash Offer",
      ctaSub: "See All Options →",
      trust: "No obligation · Free offer · Close on your timeline",
    },
    stats: [
      { val: "50+", label: "Homes Purchased" },
      { val: "6+", label: "Years Active" },
      { val: "7", label: "Day Close Available" },
      { val: "2", label: "Markets: PHX + DFW" },
    ],
    how: {
      label: "How It Works",
      h2: ["THREE STEPS.", "ZERO HASSLE."],
      steps: [
        { n: "01", title: "Tell Us About Your Home", body: "Fill out a quick form or give us a call. No commitment, no pressure — just a conversation." },
        { n: "02", title: "Get Your Cash Offer", body: "We'll review your property and deliver a fair, no-obligation cash offer within 24 hours." },
        { n: "03", title: "Close On Your Terms", body: "Pick your closing date. We handle the paperwork. You walk away with cash — sometimes in as little as 7 days." },
      ],
    },
    benefits: {
      label: "Why Homeowners Choose Us",
      h2: ["NO FEES.", "NO REPAIRS.", "NO WAITING."],
      items: [
        { icon: "🔨", title: "Sell As-Is", body: "Don't spend a dollar on repairs. We buy homes in any condition — from move-in ready to major fixer." },
        { icon: "💰", title: "Zero Agent Fees", body: "No commissions, no closing costs on your end. The offer we make is the amount you receive." },
        { icon: "📅", title: "Close When You're Ready", body: "Need to close fast? We can do 7 days. Need more time? We work around your schedule." },
        { icon: "📋", title: "Simple Paperwork", body: "We handle everything. Our team guides you through each step — no surprises at the closing table." },
        { icon: "🏘️", title: "Any Situation", body: "Foreclosure, divorce, inherited home, problem tenants — we've seen it all and we can help." },
        { icon: "🤝", title: "Local Team", body: "We're Phoenix and Dallas locals, not a national call center. You'll work with someone who knows your market." },
      ],
    },
    situations: {
      label: "We Help Homeowners In Every Situation",
      h2: "WE BUY HOMES FROM OWNERS FACING:",
      items: [
        { title: "Foreclosure", body: "Stop the process before it damages your credit. We move fast." },
        { title: "Divorce", body: "A quick, clean sale removes the stress of a shared asset." },
        { title: "Inherited Property", body: "Don't pay to maintain a home you didn't plan for." },
        { title: "Relocation", body: "Moving for work or life? Sell without the waiting game." },
        { title: "Behind on Payments", body: "Get out from under a mortgage that no longer works." },
        { title: "Problem Tenants", body: "Done being a landlord? We'll take the property as-is." },
      ],
    },
    testimonials: {
      label: "What Homeowners Say",
      h2: "REAL STORIES FROM REAL SELLERS.",
      items: [
        { quote: "I needed to sell fast after a divorce. Highlander gave me a fair offer the next day and we closed in 10 days. No drama, no delays.", name: "Maria T.", location: "Phoenix, AZ" },
        { quote: "I inherited my parents' house and had no idea what to do with it. They walked me through every step and made it completely painless.", name: "James R.", location: "Dallas, TX" },
        { quote: "Was facing foreclosure and had 3 weeks. They came through with a cash offer and saved my credit. I'm genuinely grateful.", name: "Sandra K.", location: "Phoenix, AZ" },
      ],
    },
    paths: {
      label: "Two Ways We Can Help",
      sell: {
        badge: "Sell",
        h2: ["SELL YOUR", "HOME ON", "YOUR TERMS."],
        body: "Cash offer in as little as 7 days, or let us invest in your property and list it — more money, less hassle.",
        cta: "See My Options →",
      },
      invest: {
        badge: "Invest",
        h2: ["EARN RETURNS", "ON REAL", "ESTATE FLIPS."],
        body: "Partner with us on fix-and-flip deals and earn a share of the profits. Each deal is its own joint venture.",
        cta: "Explore Investing →",
      },
    },
    cta: {
      h2: ["READY TO GET", "YOUR OFFER?"],
      sub: "It takes 2 minutes. No commitment. No cost.",
      btn: "Get My Free Cash Offer",
      sub2: "Or call us directly",
    },
  },
  es: {
    hero: {
      badge: "Phoenix, AZ · Dallas, TX · Hablamos Español",
      h1: ["RECIBE UNA OFERTA", "EN EFECTIVO", "EN 24 HORAS."],
      sub: "Compramos casas en cualquier condición — sin reparaciones, sin comisiones, sin estrés. Cierre en tan solo 7 días.",
      cta: "Obtener Mi Oferta",
      ctaSub: "Ver Todas las Opciones →",
      trust: "Sin obligación · Oferta gratuita · Cierre a tu ritmo",
    },
    stats: [
      { val: "50+", label: "Casas Compradas" },
      { val: "6+", label: "Años Activos" },
      { val: "7", label: "Días Para Cerrar" },
      { val: "2", label: "Mercados: PHX + DFW" },
    ],
    how: {
      label: "Cómo Funciona",
      h2: ["TRES PASOS.", "CERO ESTRÉS."],
      steps: [
        { n: "01", title: "Cuéntanos Sobre Tu Casa", body: "Llena un formulario rápido o llámanos. Sin compromiso, sin presión — solo una conversación." },
        { n: "02", title: "Recibe Tu Oferta en Efectivo", body: "Evaluamos tu propiedad y te entregamos una oferta justa en 24 horas." },
        { n: "03", title: "Cierra Cuando Quieras", body: "Elige la fecha de cierre. Nosotros manejamos el papeleo. Tú recibes el dinero." },
      ],
    },
    benefits: {
      label: "Por Qué Nos Eligen",
      h2: ["SIN COMISIONES.", "SIN REPARACIONES.", "SIN ESPERAS."],
      items: [
        { icon: "🔨", title: "Vende Como Está", body: "No gastes un centavo en reparaciones. Compramos casas en cualquier condición." },
        { icon: "💰", title: "Sin Comisiones", body: "Sin cargos de agente, sin costos de cierre. La oferta que hacemos es lo que recibes." },
        { icon: "📅", title: "Cierra Cuando Estés Listo", body: "¿Necesitas cerrar rápido? Podemos hacerlo en 7 días. ¿Necesitas más tiempo? Nos adaptamos." },
        { icon: "📋", title: "Trámites Sencillos", body: "Nosotros manejamos todo. Te guiamos en cada paso — sin sorpresas." },
        { icon: "🏘️", title: "Cualquier Situación", body: "Ejecución hipotecaria, divorcio, herencia — hemos visto todo y podemos ayudarte." },
        { icon: "🤝", title: "Equipo Local", body: "Somos locales de Phoenix y Dallas, no un centro de llamadas nacional." },
      ],
    },
    situations: {
      label: "Ayudamos a Propietarios en Toda Situación",
      h2: "COMPRAMOS CASAS A PROPIETARIOS EN:",
      items: [
        { title: "Ejecución Hipotecaria", body: "Detén el proceso antes de que dañe tu crédito." },
        { title: "Divorcio", body: "Una venta rápida elimina el estrés de un activo compartido." },
        { title: "Propiedad Heredada", body: "No pagues por mantener una casa que no planeabas tener." },
        { title: "Reubicación", body: "¿Mudándote? Vende sin esperar meses en el mercado." },
        { title: "Pagos Atrasados", body: "Libérate de una hipoteca que ya no funciona para ti." },
        { title: "Inquilinos Problemáticos", body: "¿Cansado de ser arrendador? Te compramos la propiedad tal como está." },
      ],
    },
    testimonials: {
      label: "Lo Que Dicen Los Propietarios",
      h2: "HISTORIAS REALES DE VENDEDORES REALES.",
      items: [
        { quote: "Necesitaba vender rápido después de un divorcio. Highlander me dio una oferta justa al día siguiente y cerramos en 10 días.", name: "Maria T.", location: "Phoenix, AZ" },
        { quote: "Heredé la casa de mis padres y no sabía qué hacer. Me guiaron en cada paso y fue completamente sin complicaciones.", name: "James R.", location: "Dallas, TX" },
        { quote: "Estaba a punto de perder mi casa y tenían 3 semanas. Vinieron con una oferta en efectivo y salvaron mi crédito.", name: "Sandra K.", location: "Phoenix, AZ" },
      ],
    },
    paths: {
      label: "Dos Formas en que Podemos Ayudar",
      sell: {
        badge: "Vender",
        h2: ["VENDE TU", "CASA EN TUS", "TÉRMINOS."],
        body: "Oferta en efectivo en tan solo 7 días, o déjanos invertir en tu propiedad y listarla.",
        cta: "Ver Mis Opciones →",
      },
      invest: {
        badge: "Invertir",
        h2: ["GANA RETORNOS", "EN FLIPS DE", "BIENES RAÍCES."],
        body: "Asóciate con nosotros en proyectos de compra y venta y gana parte de las ganancias.",
        cta: "Explorar Inversiones →",
      },
    },
    cta: {
      h2: ["¿LISTO PARA", "TU OFERTA?"],
      sub: "Toma 2 minutos. Sin compromiso. Sin costo.",
      btn: "Obtener Mi Oferta Gratuita",
      sub2: "O llámanos directamente",
    },
  },
};

export default function HomePage() {
  const { lang } = useLanguage();
  const t = content[lang];

  return (
    <>
      <style>{`
        .hero-section {
          background: var(--near-black);
          padding: 80px 48px 72px;
          text-align: center;
        }
        .trust-bar {
          background: var(--off-white);
          border-top: 1px solid var(--border-light);
          border-bottom: 1px solid var(--border-light);
          padding: 28px 48px;
        }
        .trust-bar-inner {
          max-width: 900px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          text-align: center;
        }
        .how-section {
          background: var(--white);
          padding: 88px 48px;
        }
        .how-steps {
          max-width: 900px;
          margin: 48px auto 0;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px;
        }
        .benefits-section {
          background: var(--off-white);
          padding: 88px 48px;
          border-top: 1px solid var(--border-light);
        }
        .benefits-grid {
          max-width: 960px;
          margin: 48px auto 0;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .benefit-card {
          background: var(--white);
          border: 1px solid var(--border-light);
          border-radius: var(--radius);
          padding: 24px 22px;
        }
        .situations-section {
          background: var(--black);
          padding: 88px 48px;
        }
        .situations-grid {
          max-width: 960px;
          margin: 48px auto 0;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .situation-card {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: var(--radius-sm);
          padding: 20px 22px;
        }
        .testimonials-section {
          background: var(--white);
          padding: 88px 48px;
          border-top: 1px solid var(--border-light);
        }
        .testimonials-grid {
          max-width: 960px;
          margin: 48px auto 0;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .testimonial-card {
          background: var(--off-white);
          border: 1px solid var(--border-light);
          border-radius: var(--radius);
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .paths-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-top: 1px solid var(--border-light);
        }
        .path-card-new {
          position: relative;
          padding: 52px 44px;
          display: flex;
          flex-direction: column;
          gap: 0;
          text-decoration: none;
          overflow: hidden;
          transition: background 0.2s;
        }
        .path-card-new:hover { background: var(--off-white); }
        .path-card-new-dark {
          background: var(--near-black);
        }
        .path-card-new-dark:hover { background: var(--black); }
        .bottom-cta {
          background: var(--blue);
          padding: 88px 48px;
          text-align: center;
        }
        @media (max-width: 900px) {
          .hero-section { padding: 56px 20px 52px; }
          .trust-bar { padding: 20px; }
          .trust-bar-inner { grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .how-section { padding: 60px 20px; }
          .how-steps { grid-template-columns: 1fr; gap: 28px; }
          .benefits-section { padding: 60px 20px; }
          .benefits-grid { grid-template-columns: 1fr 1fr; gap: 14px; }
          .situations-section { padding: 60px 20px; }
          .situations-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
          .testimonials-section { padding: 60px 20px; }
          .testimonials-grid { grid-template-columns: 1fr; gap: 16px; }
          .paths-section { grid-template-columns: 1fr; }
          .path-card-new { padding: 40px 24px; }
          .bottom-cta { padding: 60px 20px; }
        }
        @media (max-width: 600px) {
          .hero-section { padding: 44px 16px 40px; }
          .trust-bar { padding: 16px; }
          .trust-bar-inner { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .benefits-grid { grid-template-columns: 1fr; }
          .situations-grid { grid-template-columns: 1fr; }
          .bottom-cta { padding: 48px 16px; }
        }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="hero-section">
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "20px", padding: "5px 14px", marginBottom: "28px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", flexShrink: 0, display: "inline-block" }} />
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)", letterSpacing: "0.8px", fontWeight: 500 }}>{t.hero.badge}</span>
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(48px, 9vw, 100px)", color: "var(--white)", letterSpacing: "2px", lineHeight: 0.92, textTransform: "uppercase", marginBottom: "24px" }}>
          {t.hero.h1[0]}<br />
          <span style={{ color: "var(--blue-mid)" }}>{t.hero.h1[1]}</span><br />
          {t.hero.h1[2]}
        </h1>

        <p style={{ fontSize: "clamp(15px, 2.5vw, 18px)", color: "rgba(255,255,255,0.65)", maxWidth: "520px", margin: "0 auto 36px", lineHeight: 1.7, fontWeight: 300 }}>
          {t.hero.sub}
        </p>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
          <Link href="/sell" className="btn-blue" style={{ fontSize: "15px", padding: "15px 36px", borderRadius: "var(--radius-sm)" }}>
            {t.hero.cta}
          </Link>
          <Link href="/sell" style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.5)", textDecoration: "none", letterSpacing: "0.2px" }}>
            {t.hero.ctaSub}
          </Link>
        </div>

        <div style={{ marginTop: "36px", fontSize: "11.5px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.5px" }}>
          {t.hero.trust}
        </div>
      </section>

      {/* ── TRUST BAR ─────────────────────────────────────────── */}
      <div className="trust-bar">
        <div className="trust-bar-inner">
          {t.stats.map((s) => (
            <div key={s.label}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 36px)", color: "var(--black)", letterSpacing: "1px", lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px", marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="how-section">
        <div style={{ textAlign: "center" }}>
          <span style={{ display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", color: "var(--blue)", marginBottom: "12px" }}>{t.how.label}</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 5vw, 60px)", color: "var(--black)", letterSpacing: "2px", lineHeight: 0.95, textTransform: "uppercase" }}>
            {t.how.h2[0]}<br />{t.how.h2[1]}
          </h2>
        </div>
        <div className="how-steps">
          {t.how.steps.map((step, i) => (
            <div key={i} style={{ position: "relative" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "72px", color: "rgba(0,0,0,0.05)", lineHeight: 1, marginBottom: "-12px" }}>{step.n}</div>
              <div style={{ width: "40px", height: "40px", background: "var(--blue)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "18px", color: "var(--white)", letterSpacing: "0.5px" }}>{i + 1}</span>
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: "var(--black)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>{step.title}</h3>
              <p style={{ fontSize: "14px", color: "var(--mid)", lineHeight: 1.75 }}>{step.body}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <Link href="/sell" className="btn-blue">{t.hero.cta}</Link>
        </div>
      </section>

      {/* ── BENEFITS ──────────────────────────────────────────── */}
      <section className="benefits-section">
        <div style={{ textAlign: "center" }}>
          <span style={{ display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", color: "var(--blue)", marginBottom: "12px" }}>{t.benefits.label}</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4vw, 52px)", color: "var(--black)", letterSpacing: "2px", lineHeight: 0.95, textTransform: "uppercase" }}>
            {t.benefits.h2[0]}<br />{t.benefits.h2[1]}<br />{t.benefits.h2[2]}
          </h2>
        </div>
        <div className="benefits-grid">
          {t.benefits.items.map((item, i) => (
            <div key={i} className="benefit-card">
              <div style={{ fontSize: "28px", marginBottom: "12px" }}>{item.icon}</div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--black)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "8px" }}>{item.title}</h3>
              <p style={{ fontSize: "13.5px", color: "var(--mid)", lineHeight: 1.7 }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SITUATIONS ────────────────────────────────────────── */}
      <section className="situations-section">
        <div style={{ textAlign: "center" }}>
          <span style={{ display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", color: "rgba(255,255,255,0.4)", marginBottom: "12px" }}>{t.situations.label}</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", color: "var(--white)", letterSpacing: "2px", lineHeight: 1, textTransform: "uppercase" }}>
            {t.situations.h2}
          </h2>
        </div>
        <div className="situations-grid">
          {t.situations.items.map((item, i) => (
            <div key={i} className="situation-card">
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "18px", color: "var(--white)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "8px" }}>{item.title}</h3>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", lineHeight: 1.65 }}>{item.body}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <Link href="/sell" className="btn-blue">{t.hero.cta}</Link>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────── */}
      <section className="testimonials-section">
        <div style={{ textAlign: "center" }}>
          <span style={{ display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", color: "var(--blue)", marginBottom: "12px" }}>{t.testimonials.label}</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", color: "var(--black)", letterSpacing: "2px", lineHeight: 0.95, textTransform: "uppercase" }}>
            {t.testimonials.h2}
          </h2>
        </div>
        <div className="testimonials-grid">
          {t.testimonials.items.map((t2, i) => (
            <div key={i} className="testimonial-card">
              <div style={{ display: "flex", gap: "2px", marginBottom: "4px" }}>
                {[...Array(5)].map((_, j) => (
                  <span key={j} style={{ color: "#f59e0b", fontSize: "14px" }}>★</span>
                ))}
              </div>
              <p style={{ fontSize: "14px", color: "var(--near-black)", lineHeight: 1.75, fontStyle: "italic", flex: 1 }}>
                &ldquo;{t2.quote}&rdquo;
              </p>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--black)" }}>{t2.name}</div>
                <div style={{ fontSize: "11.5px", color: "var(--muted)", marginTop: "2px" }}>{t2.location}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PATH CARDS ────────────────────────────────────────── */}
      <div className="paths-section">
        {/* SELL */}
        <Link href="/sell" className="path-card-new" style={{ background: "var(--off-white)", borderRight: "1px solid var(--border-light)" }}>
          <div style={{ position: "absolute", top: "32px", left: "32px", fontFamily: "var(--font-display)", fontSize: "110px", color: "rgba(0,0,0,0.04)", lineHeight: 1, userSelect: "none" }}>01</div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "16px", background: "var(--blue-light)", border: "1px solid var(--blue-border)", padding: "4px 10px", borderRadius: "4px" }}>
              {t.paths.sell.badge}
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 3.5vw, 52px)", color: "var(--near-black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 0.95, marginBottom: "16px" }}>
              {t.paths.sell.h2[0]}<br />{t.paths.sell.h2[1]}<br />{t.paths.sell.h2[2]}
            </h2>
            <p style={{ fontSize: "14px", color: "var(--mid)", lineHeight: 1.75, marginBottom: "28px", maxWidth: "340px" }}>
              {t.paths.sell.body}
            </p>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, color: "var(--white)", background: "var(--blue)", borderRadius: "8px", padding: "11px 20px" }}>
              {t.paths.sell.cta}
            </span>
          </div>
        </Link>

        {/* INVEST */}
        <Link href="/buy" className="path-card-new path-card-new-dark">
          <div style={{ position: "absolute", top: "32px", left: "32px", fontFamily: "var(--font-display)", fontSize: "110px", color: "rgba(255,255,255,0.04)", lineHeight: 1, userSelect: "none" }}>02</div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "16px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: "4px" }}>
              {t.paths.invest.badge}
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 3.5vw, 52px)", color: "var(--white)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 0.95, marginBottom: "16px" }}>
              {t.paths.invest.h2[0]}<br />{t.paths.invest.h2[1]}<br />{t.paths.invest.h2[2]}
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.55)", lineHeight: 1.75, marginBottom: "28px", maxWidth: "340px" }}>
              {t.paths.invest.body}
            </p>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, color: "var(--white)", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "11px 20px" }}>
              {t.paths.invest.cta}
            </span>
          </div>
        </Link>
      </div>

      {/* ── BOTTOM CTA ────────────────────────────────────────── */}
      <section className="bottom-cta">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(40px, 7vw, 80px)", color: "var(--white)", letterSpacing: "2px", lineHeight: 0.92, textTransform: "uppercase", marginBottom: "20px" }}>
          {t.cta.h2[0]}<br />{t.cta.h2[1]}
        </h2>
        <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.75)", marginBottom: "36px", maxWidth: "400px", margin: "0 auto 36px", lineHeight: 1.65 }}>
          {t.cta.sub}
        </p>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
          <Link href="/sell" className="btn-outline-white" style={{ fontSize: "15px", padding: "15px 40px" }}>
            {t.cta.btn}
          </Link>
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)" }}>{t.cta.sub2}</span>
        </div>
      </section>
    </>
  );
}
