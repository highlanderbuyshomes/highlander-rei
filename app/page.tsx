"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";

const content = {
  en: {
    hero: {
      badge: "Phoenix, AZ · Dallas, TX",
      h1: ["GET A FAIR", "CASH OFFER", "IN 24 HOURS."],
      sub: "We buy houses in any condition — no repairs, no agent fees, no stress. Close in as little as 7 days.",
      cta: "Get My Cash Offer",
      trust: "No obligation · Free offer · Close on your timeline",
    },
    estimate: {
      label: "Free Home Estimate",
      h2: "WHAT'S YOUR HOME WORTH?",
      sub: "Enter your address and we'll send you a free, no-obligation cash offer within 24 hours. No repairs, no fees, no pressure.",
      placeholder: "Enter your home address...",
      cta: "Get My Free Estimate",
      chips: ["100% Free", "No Obligation", "Within 24 Hours", "Any Condition"],
    },
    stats: [
      { val: "50+", label: "Homes Purchased" },
      { val: "6+", label: "Years Active" },
      { val: "7", label: "Day Close Available" },
      { val: "$0", label: "In Commissions or Fees" },
    ],
    credibility: {
      label: "Who We Are",
      h2: "LOCAL INVESTORS. REAL RESULTS.",
      sub: "We're not a national call center or an algorithm. Highlander REI is a local real estate investment company operating in Phoenix and Dallas since 2018. Every offer is reviewed by our team — people who know your neighborhood.",
      pillars: [
        {
          icon: "🏛",
          title: "Licensed & Insured",
          body: "Highlander REI is a licensed real estate company operating in compliance with AZ and TX regulations. Every transaction is handled by experienced professionals.",
        },
        {
          icon: "🔒",
          title: "No Hidden Fees — Ever",
          body: "The number on your offer is the number you walk away with. We cover all closing costs. No agent commissions, no inspection fees, no deductions at the table.",
        },
        {
          icon: "📍",
          title: "Deep Local Market Knowledge",
          body: "We actively invest in Phoenix and Dallas. We know the submarkets, the comps, and the neighborhoods — which means our offers are grounded in real data.",
        },
      ],
    },
    how: {
      label: "How It Works",
      h2: ["THREE STEPS.", "ZERO HASSLE."],
      steps: [
        { n: "01", title: "Tell Us About Your Home", body: "Fill out a quick form or give us a call. No commitment, no pressure — just a conversation about your property and timeline." },
        { n: "02", title: "Get Your Cash Offer", body: "We review your property and send a competitive, all-cash, no-obligation offer within 24 hours — based on real market comps." },
        { n: "03", title: "Close On Your Terms", body: "You pick the closing date. We handle all the paperwork. Walk away with cash in as little as 7 days, or take up to 90 if you need more time." },
      ],
    },
    benefits: {
      label: "Why Homeowners Choose Us",
      h2: ["NO FEES.", "NO REPAIRS.", "NO WAITING."],
      items: [
        { icon: "🔨", title: "Sell As-Is", body: "Don't spend a dollar on repairs. We buy homes in any condition — from move-in ready to major fixer-upper." },
        { icon: "💰", title: "Zero Agent Fees", body: "No commissions, no closing costs on your end. The offer we make is the amount you receive at closing." },
        { icon: "📅", title: "Close When You're Ready", body: "Need to close in 7 days? We can do it. Need 60 days to find your next place? We'll wait." },
        { icon: "📋", title: "We Handle the Paperwork", body: "Our team manages every document from contract to closing. No surprises, no confusion at the table." },
        { icon: "🏘️", title: "Any Situation", body: "Foreclosure, divorce, inherited home, problem tenants — we've seen it all and know how to help." },
        { icon: "🤝", title: "Local Team, Not a Call Center", body: "You talk to us directly. We're Phoenix and Dallas locals who know your streets and your market." },
      ],
    },
    situations: {
      label: "We Help Homeowners In Every Situation",
      h2: "WE BUY HOMES FROM OWNERS FACING:",
      items: [
        { title: "Foreclosure", body: "Stop the process before it damages your credit. We move fast — sometimes closing in under 2 weeks." },
        { title: "Divorce", body: "A quick, clean sale removes the stress of a shared asset so both parties can move on." },
        { title: "Inherited Property", body: "Don't pay taxes and maintenance on a home you didn't plan for. We simplify the process." },
        { title: "Relocation", body: "Moving for work or life? Sell without the waiting game of a traditional listing." },
        { title: "Behind on Payments", body: "Get out from under a mortgage that no longer works before it becomes a larger problem." },
        { title: "Problem Tenants", body: "Done being a landlord? We buy rental properties as-is — tenants and all." },
      ],
    },
    testimonials: {
      label: "What Homeowners Say",
      h2: "REAL STORIES FROM REAL SELLERS.",
      items: [
        {
          quote: "I needed to sell fast after a divorce. Highlander gave me a fair offer the next day and we closed in 10 days. No drama, no delays — exactly what I needed.",
          name: "Maria T.",
          location: "Phoenix, AZ",
          situation: "Divorce",
        },
        {
          quote: "I inherited my parents' house and had no idea what to do with it. They walked me through every step and made it completely painless. Fair price, zero hassle.",
          name: "James R.",
          location: "Dallas, TX",
          situation: "Inherited Home",
        },
        {
          quote: "Was facing foreclosure with 3 weeks left. They came through with a cash offer and saved my credit. I'm genuinely grateful for how fast and professional they were.",
          name: "Sandra K.",
          location: "Phoenix, AZ",
          situation: "Foreclosure",
        },
      ],
    },
    faq: {
      label: "Common Questions",
      h2: "ANSWERS BEFORE YOU ASK.",
      items: [
        { q: "Will I get a fair price?", a: "We base every offer on recent comparable sales in your area, adjusted for condition and what it takes to renovate. You'll see our reasoning — no mysterious lowball numbers. You're never obligated to accept." },
        { q: "Are there any fees or hidden costs?", a: "None. We cover all closing costs. No agent commissions, no inspection fees, no deductions at closing. What we offer is what you receive." },
        { q: "Do I need to repair or clean anything?", a: "Not a thing. Leave it exactly as-is — old furniture, appliances, junk, whatever. We handle all cleanup and repairs after you close." },
        { q: "How fast can we actually close?", a: "Once you accept, we typically close in 7–14 business days. If you need more time to plan your move, we can extend to 30, 60, or even 90 days — your call." },
        { q: "What if I have liens or back taxes?", a: "We've navigated it before. Tax liens, HOA debt, mortgage arrears — tell us upfront and our team works through the title issues as part of closing." },
        { q: "What types of homes do you buy?", a: "Single-family homes, multi-family, condos, townhomes, vacant land, and rental properties in Phoenix metro and Dallas–Fort Worth. Any age, any price range, any condition." },
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
    },
  },
  es: {
    hero: {
      badge: "Phoenix, AZ · Dallas, TX · Hablamos Español",
      h1: ["RECIBE UNA OFERTA", "EN EFECTIVO", "EN 24 HORAS."],
      sub: "Compramos casas en cualquier condición — sin reparaciones, sin comisiones, sin estrés. Cierre en tan solo 7 días.",
      cta: "Obtener Mi Oferta",
      trust: "Sin obligación · Oferta gratuita · Cierre a tu ritmo",
    },
    estimate: {
      label: "Estimado Gratuito",
      h2: "¿CUÁNTO VALE TU CASA?",
      sub: "Ingresa tu dirección y te enviaremos una oferta gratuita sin obligación en 24 horas. Sin reparaciones, sin comisiones, sin presión.",
      placeholder: "Ingresa la dirección de tu casa...",
      cta: "Obtener Mi Estimado Gratis",
      chips: ["100% Gratis", "Sin Obligación", "En 24 Horas", "Cualquier Condición"],
    },
    stats: [
      { val: "50+", label: "Casas Compradas" },
      { val: "6+", label: "Años Activos" },
      { val: "7", label: "Días Para Cerrar" },
      { val: "$0", label: "Comisiones o Cargos" },
    ],
    credibility: {
      label: "Quiénes Somos",
      h2: "INVERSORES LOCALES. RESULTADOS REALES.",
      sub: "No somos un centro de llamadas ni un algoritmo. Highlander REI es una empresa local de inversión inmobiliaria que opera en Phoenix y Dallas desde 2018. Cada oferta es revisada por nuestro equipo.",
      pillars: [
        {
          icon: "🏛",
          title: "Con Licencia y Asegurados",
          body: "Highlander REI opera con licencia y cumple con las regulaciones de AZ y TX. Cada transacción es manejada por profesionales experimentados.",
        },
        {
          icon: "🔒",
          title: "Sin Cargos Ocultos — Nunca",
          body: "El número en tu oferta es el número que recibes. Cubrimos todos los costos de cierre. Sin comisiones, sin deducciones en la mesa de cierre.",
        },
        {
          icon: "📍",
          title: "Conocemos Tu Mercado Local",
          body: "Invertimos activamente en Phoenix y Dallas. Conocemos los submercados, los comparables y los vecindarios — lo que significa que nuestras ofertas se basan en datos reales.",
        },
      ],
    },
    how: {
      label: "Cómo Funciona",
      h2: ["TRES PASOS.", "CERO ESTRÉS."],
      steps: [
        { n: "01", title: "Cuéntanos Sobre Tu Casa", body: "Llena un formulario rápido o llámanos. Sin compromiso, sin presión — solo una conversación sobre tu propiedad." },
        { n: "02", title: "Recibe Tu Oferta en Efectivo", body: "Evaluamos tu propiedad y te enviamos una oferta competitiva en 24 horas, basada en comparables reales del mercado." },
        { n: "03", title: "Cierra Cuando Quieras", body: "Elige la fecha de cierre. Manejamos todo el papeleo. Recibes el dinero en tan solo 7 días, o hasta 90 si necesitas más tiempo." },
      ],
    },
    benefits: {
      label: "Por Qué Nos Eligen",
      h2: ["SIN COMISIONES.", "SIN REPARACIONES.", "SIN ESPERAS."],
      items: [
        { icon: "🔨", title: "Vende Como Está", body: "No gastes un centavo en reparaciones. Compramos casas en cualquier condición." },
        { icon: "💰", title: "Sin Comisiones", body: "Sin cargos de agente, sin costos de cierre a tu cargo. La oferta que hacemos es lo que recibes." },
        { icon: "📅", title: "Cierra Cuando Estés Listo", body: "¿Necesitas cerrar en 7 días? Podemos hacerlo. ¿Necesitas 60 días? Nos adaptamos a ti." },
        { icon: "📋", title: "Nosotros Manejamos el Papeleo", body: "Nuestro equipo gestiona cada documento desde el contrato hasta el cierre. Sin sorpresas." },
        { icon: "🏘️", title: "Cualquier Situación", body: "Ejecución hipotecaria, divorcio, herencia, inquilinos — hemos visto todo y sabemos cómo ayudar." },
        { icon: "🤝", title: "Equipo Local, No un Call Center", body: "Hablas directamente con nosotros. Somos locales de Phoenix y Dallas que conocen tu mercado." },
      ],
    },
    situations: {
      label: "Ayudamos a Propietarios en Toda Situación",
      h2: "COMPRAMOS CASAS A PROPIETARIOS EN:",
      items: [
        { title: "Ejecución Hipotecaria", body: "Detén el proceso antes de que dañe tu crédito. Actuamos rápido." },
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
        {
          quote: "Necesitaba vender rápido después de un divorcio. Highlander me dio una oferta justa al día siguiente y cerramos en 10 días. Sin drama, sin retrasos.",
          name: "Maria T.",
          location: "Phoenix, AZ",
          situation: "Divorcio",
        },
        {
          quote: "Heredé la casa de mis padres y no sabía qué hacer. Me guiaron en cada paso y fue completamente sin complicaciones. Obtuve un precio justo.",
          name: "James R.",
          location: "Dallas, TX",
          situation: "Casa Heredada",
        },
        {
          quote: "Estaba a punto de perder mi casa con 3 semanas de margen. Vinieron con una oferta en efectivo y salvaron mi crédito. Eternamente agradecida.",
          name: "Sandra K.",
          location: "Phoenix, AZ",
          situation: "Ejecución Hipotecaria",
        },
      ],
    },
    faq: {
      label: "Preguntas Frecuentes",
      h2: "RESPUESTAS ANTES DE QUE PREGUNTES.",
      items: [
        { q: "¿Obtendré un precio justo?", a: "Basamos cada oferta en ventas comparables recientes en tu área, ajustadas por condición. Nunca estás obligado a aceptar y no hay presión." },
        { q: "¿Hay algún cargo oculto?", a: "Ninguno. Cubrimos todos los costos de cierre. Sin comisiones de agente, sin tarifas de inspección, sin deducciones. Lo que ofrecemos es lo que recibes." },
        { q: "¿Necesito reparar o limpiar algo?", a: "Nada. Déjala exactamente como está — muebles viejos, electrodomésticos, basura, lo que sea. Nosotros manejamos todo después del cierre." },
        { q: "¿Qué tan rápido podemos cerrar?", a: "Una vez que aceptas, generalmente cerramos en 7–14 días hábiles. Si necesitas más tiempo, podemos extender hasta 30, 60 o 90 días — tú decides." },
        { q: "¿Qué pasa si tengo gravámenes o impuestos atrasados?", a: "Ya lo hemos manejado. Los gravámenes fiscales y las deudas de HOA son comunes. Dínos desde el principio y nuestro equipo lo resuelve como parte del cierre." },
        { q: "¿Qué tipos de casas compran?", a: "Casas unifamiliares, multifamiliares, condominios, terrenos y propiedades de alquiler en Phoenix y Dallas-Fort Worth. Cualquier edad, cualquier precio, cualquier condición." },
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
    },
  },
};

export default function HomePage() {
  const { lang } = useLanguage();
  const t = content[lang];
  const router = useRouter();
  const [address, setAddress] = useState("");

  function handleEstimate(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;
    router.push(`/sell?address=${encodeURIComponent(address.trim())}`);
  }

  return (
    <>
      <style>{`
        .hero-section {
          background: var(--near-black);
          padding: 80px 48px 72px;
          text-align: center;
        }
        .estimate-section {
          background: var(--blue);
          padding: 72px 48px;
          text-align: center;
        }
        .estimate-form {
          max-width: 620px;
          margin: 32px auto 0;
          display: flex;
          gap: 0;
          border-radius: var(--radius-sm);
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.25);
        }
        .estimate-input {
          flex: 1;
          padding: 18px 22px;
          font-size: 15px;
          border: none;
          outline: none;
          background: var(--white);
          color: var(--near-black);
          font-family: var(--font-body), system-ui, sans-serif;
        }
        .estimate-input::placeholder { color: var(--muted); }
        .estimate-btn {
          padding: 18px 28px;
          background: var(--near-black);
          color: var(--white);
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.3px;
          white-space: nowrap;
          font-family: var(--font-body), system-ui, sans-serif;
          transition: background 0.15s;
        }
        .estimate-btn:hover { background: var(--black); }
        .estimate-chips {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 20px;
          flex-wrap: wrap;
        }
        .estimate-chip {
          font-size: 11px;
          color: rgba(255,255,255,0.7);
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          padding: 4px 12px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 5px;
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
        .credibility-section {
          background: var(--white);
          padding: 88px 48px;
        }
        .credibility-pillars {
          max-width: 960px;
          margin: 48px auto 0;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .credibility-card {
          background: var(--off-white);
          border: 1px solid var(--border-light);
          border-radius: var(--radius);
          padding: 28px 24px;
        }
        .how-section {
          background: var(--off-white);
          padding: 88px 48px;
          border-top: 1px solid var(--border-light);
        }
        .how-steps {
          max-width: 900px;
          margin: 48px auto 0;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px;
        }
        .benefits-section {
          background: var(--white);
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
          background: var(--off-white);
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
          background: var(--off-white);
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
          background: var(--white);
          border: 1px solid var(--border-light);
          border-radius: var(--radius);
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .faq-section {
          background: var(--white);
          padding: 88px 48px;
          border-top: 1px solid var(--border-light);
        }
        .faq-grid {
          max-width: 960px;
          margin: 48px auto 0;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .faq-card {
          background: var(--off-white);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-sm);
          padding: 24px 22px;
        }
        .paths-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-top: 1px solid var(--border-light);
        }
        .path-card {
          position: relative;
          padding: 52px 44px;
          display: flex;
          flex-direction: column;
          text-decoration: none;
          overflow: hidden;
          transition: background 0.2s;
        }
        .path-card-light:hover { background: var(--off-white); }
        .path-card-dark { background: var(--near-black); }
        .path-card-dark:hover { background: var(--black); }
        .bottom-cta {
          background: var(--near-black);
          padding: 88px 48px;
          text-align: center;
        }
        @media (max-width: 900px) {
          .hero-section { padding: 56px 20px 52px; }
          .estimate-section { padding: 52px 20px; }
          .estimate-form { flex-direction: column; border-radius: var(--radius-sm); }
          .estimate-input { border-radius: 0; }
          .estimate-btn { border-radius: 0; width: 100%; padding: 16px; }
          .trust-bar { padding: 20px; }
          .trust-bar-inner { grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .credibility-section { padding: 60px 20px; }
          .credibility-pillars { grid-template-columns: 1fr; gap: 14px; }
          .how-section { padding: 60px 20px; }
          .how-steps { grid-template-columns: 1fr; gap: 28px; }
          .benefits-section { padding: 60px 20px; }
          .benefits-grid { grid-template-columns: 1fr 1fr; gap: 14px; }
          .situations-section { padding: 60px 20px; }
          .situations-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
          .testimonials-section { padding: 60px 20px; }
          .testimonials-grid { grid-template-columns: 1fr; gap: 16px; }
          .faq-section { padding: 60px 20px; }
          .faq-grid { grid-template-columns: 1fr; }
          .paths-section { grid-template-columns: 1fr; }
          .path-card { padding: 40px 24px; }
          .bottom-cta { padding: 60px 20px; }
        }
        @media (max-width: 600px) {
          .hero-section { padding: 44px 16px 40px; }
          .estimate-section { padding: 40px 16px; }
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

        <Link href="/sell" className="btn-blue" style={{ fontSize: "15px", padding: "15px 36px" }}>
          {t.hero.cta}
        </Link>

        <div style={{ marginTop: "28px", fontSize: "11.5px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.5px" }}>
          {t.hero.trust}
        </div>
      </section>

      {/* ── ESTIMATE (OPENDOOR-STYLE) ──────────────────────────── */}
      <section className="estimate-section">
        <span style={{ display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", color: "rgba(255,255,255,0.55)", marginBottom: "12px" }}>{t.estimate.label}</span>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 5vw, 62px)", color: "var(--white)", letterSpacing: "2px", lineHeight: 1, textTransform: "uppercase" }}>
          {t.estimate.h2}
        </h2>
        <p style={{ fontSize: "clamp(14px, 2vw, 16px)", color: "rgba(255,255,255,0.65)", maxWidth: "520px", margin: "16px auto 0", lineHeight: 1.75 }}>
          {t.estimate.sub}
        </p>
        <form className="estimate-form" onSubmit={handleEstimate}>
          <input
            className="estimate-input"
            type="text"
            placeholder={t.estimate.placeholder}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            autoComplete="street-address"
          />
          <button type="submit" className="estimate-btn">
            {t.estimate.cta}
          </button>
        </form>
        <div className="estimate-chips">
          {t.estimate.chips.map((chip) => (
            <div key={chip} className="estimate-chip">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="5" cy="5" r="4.5" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" />
                <path d="M3 5l1.4 1.4L7 3.5" stroke="rgba(255,255,255,0.8)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {chip}
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────── */}
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

      {/* ── CREDIBILITY / WHO WE ARE ──────────────────────────── */}
      <section className="credibility-section">
        <div style={{ maxWidth: "820px", margin: "0 auto", textAlign: "center" }}>
          <span style={{ display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", color: "var(--blue)", marginBottom: "12px" }}>{t.credibility.label}</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 5vw, 56px)", color: "var(--black)", letterSpacing: "2px", lineHeight: 1, textTransform: "uppercase", marginBottom: "20px" }}>
            {t.credibility.h2}
          </h2>
          <p style={{ fontSize: "15px", color: "var(--mid)", lineHeight: 1.8 }}>
            {t.credibility.sub}
          </p>
        </div>
        <div className="credibility-pillars">
          {t.credibility.pillars.map((p, i) => (
            <div key={i} className="credibility-card">
              <div style={{ fontSize: "28px", marginBottom: "14px" }}>{p.icon}</div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--black)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "10px" }}>{p.title}</h3>
              <p style={{ fontSize: "13.5px", color: "var(--mid)", lineHeight: 1.75 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

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
              <div style={{ fontFamily: "var(--font-display)", fontSize: "72px", color: "rgba(0,0,0,0.04)", lineHeight: 1, marginBottom: "-12px" }}>{step.n}</div>
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
          {t.testimonials.items.map((item, i) => (
            <div key={i} className="testimonial-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: "2px" }}>
                  {[...Array(5)].map((_, j) => (
                    <span key={j} style={{ color: "#f59e0b", fontSize: "14px" }}>★</span>
                  ))}
                </div>
                <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.8px", background: "var(--blue-light)", border: "1px solid var(--blue-border)", padding: "3px 8px", borderRadius: "20px" }}>{item.situation}</span>
              </div>
              <p style={{ fontSize: "14px", color: "var(--near-black)", lineHeight: 1.75, fontStyle: "italic", flex: 1 }}>
                &ldquo;{item.quote}&rdquo;
              </p>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--black)" }}>{item.name}</div>
                <div style={{ fontSize: "11.5px", color: "var(--muted)", marginTop: "2px" }}>{item.location}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section className="faq-section">
        <div style={{ textAlign: "center" }}>
          <span style={{ display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", color: "var(--blue)", marginBottom: "12px" }}>{t.faq.label}</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 52px)", color: "var(--black)", letterSpacing: "2px", lineHeight: 1, textTransform: "uppercase" }}>
            {t.faq.h2}
          </h2>
        </div>
        <div className="faq-grid">
          {t.faq.items.map((item, i) => (
            <div key={i} className="faq-card">
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "10px" }}>
                <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--blue-light)", border: "1px solid var(--blue-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "10px", color: "var(--blue)" }}>Q</span>
                </span>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--near-black)", lineHeight: 1.4 }}>{item.q}</h3>
              </div>
              <p style={{ fontSize: "13.5px", color: "var(--mid)", lineHeight: 1.75, paddingLeft: "34px" }}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PATH CARDS ────────────────────────────────────────── */}
      <div className="paths-section">
        <Link href="/sell" className="path-card path-card-light" style={{ background: "var(--off-white)", borderRight: "1px solid var(--border-light)" }}>
          <div style={{ position: "absolute", top: "32px", left: "32px", fontFamily: "var(--font-display)", fontSize: "110px", color: "rgba(0,0,0,0.04)", lineHeight: 1, userSelect: "none" }}>01</div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "16px", background: "var(--blue-light)", border: "1px solid var(--blue-border)", padding: "4px 10px", borderRadius: "4px" }}>
              {t.paths.sell.badge}
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 3.5vw, 52px)", color: "var(--near-black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 0.95, marginBottom: "16px" }}>
              {t.paths.sell.h2[0]}<br />{t.paths.sell.h2[1]}<br />{t.paths.sell.h2[2]}
            </h2>
            <p style={{ fontSize: "14px", color: "var(--mid)", lineHeight: 1.75, marginBottom: "28px", maxWidth: "340px" }}>{t.paths.sell.body}</p>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, color: "var(--white)", background: "var(--blue)", borderRadius: "8px", padding: "11px 20px" }}>
              {t.paths.sell.cta}
            </span>
          </div>
        </Link>

        <Link href="/buy" className="path-card path-card-dark">
          <div style={{ position: "absolute", top: "32px", left: "32px", fontFamily: "var(--font-display)", fontSize: "110px", color: "rgba(255,255,255,0.04)", lineHeight: 1, userSelect: "none" }}>02</div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "16px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: "4px" }}>
              {t.paths.invest.badge}
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 3.5vw, 52px)", color: "var(--white)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 0.95, marginBottom: "16px" }}>
              {t.paths.invest.h2[0]}<br />{t.paths.invest.h2[1]}<br />{t.paths.invest.h2[2]}
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.55)", lineHeight: 1.75, marginBottom: "28px", maxWidth: "340px" }}>{t.paths.invest.body}</p>
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
        <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.55)", maxWidth: "400px", margin: "0 auto 36px", lineHeight: 1.65 }}>
          {t.cta.sub}
        </p>

        <form style={{ maxWidth: "560px", margin: "0 auto", display: "flex", gap: "0", borderRadius: "var(--radius-sm)", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }} onSubmit={handleEstimate}>
          <input
            className="estimate-input"
            type="text"
            placeholder={t.estimate.placeholder}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            autoComplete="street-address"
          />
          <button type="submit" className="estimate-btn" style={{ background: "var(--blue)", minWidth: "160px" }}>
            {t.estimate.cta}
          </button>
        </form>

        <div style={{ marginTop: "20px", fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>
          {t.hero.trust}
        </div>
      </section>
    </>
  );
}
