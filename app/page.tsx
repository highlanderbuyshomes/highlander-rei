"use client";
import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

const OFFER_URL = "https://highlanderbuyshomes.com/get-my-cash-offer";

// ── SVG icons (no emojis) ──────────────────────────────────────
const iconProps = { width: "20", height: "20", viewBox: "0 0 20 20", fill: "none", stroke: "var(--blue)", strokeWidth: "1.5", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const BenefitIcons = [
  // Sell As-Is: house
  <svg key="house" {...iconProps}><path d="M2 9l8-6 8 6v9a1 1 0 01-1 1H3a1 1 0 01-1-1V9z" /><path d="M7 19V11h6v8" /></svg>,
  // Zero Fees: dollar circle
  <svg key="dollar" {...iconProps}><circle cx="10" cy="10" r="8" /><path d="M10 5.5v9M7.5 7.5C7.5 6.4 8.6 6 10 6s2.5.8 2.5 1.8c0 2.2-5 1.8-5 4 0 1.1 1.1 1.7 2.5 1.7s2.5-.6 2.5-1.7" /></svg>,
  // Close When Ready: calendar
  <svg key="cal" {...iconProps}><rect x="2" y="4" width="16" height="15" rx="2" /><path d="M2 9h16M6 2v4M14 2v4" /></svg>,
  // Paperwork: file
  <svg key="file" {...iconProps}><path d="M4 2h8l4 4v13a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" /><path d="M12 2v4h4M7 10h6M7 14h4" /></svg>,
  // Any Situation: shield check
  <svg key="shield" {...iconProps}><path d="M10 2L3 5v5c0 4.4 3 7.5 7 8.5 4-1 7-4.1 7-8.5V5L10 2z" /><path d="M7 10l2 2 4-4" /></svg>,
  // Local Team: pin
  <svg key="pin" {...iconProps}><path d="M10 2C7.2 2 5 4.2 5 7c0 4 5 11 5 11s5-7 5-11c0-2.8-2.2-5-5-5z" /><circle cx="10" cy="7" r="1.8" /></svg>,
];

const CredIcons = [
  // Licensed: badge/ribbon
  <svg key="badge" {...iconProps}><circle cx="10" cy="9" r="5" /><path d="M7 9l2 2 4-4" /><path d="M7 14.5l-2 4 5-1.5 5 1.5-2-4" /></svg>,
  // No Fees: lock
  <svg key="lock" {...iconProps}><rect x="4" y="9" width="12" height="9" rx="2" /><path d="M7 9V7a3 3 0 016 0v2" /><circle cx="10" cy="13.5" r="1.5" /></svg>,
  // Local: map
  <svg key="map" {...iconProps}><path d="M1 4l6 2 6-2 6 2v12l-6-2-6 2-6-2V4z" /><path d="M7 6v12M13 4v12" /></svg>,
];

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
        { title: "Licensed & Insured", body: "Highlander REI is a licensed real estate company operating in compliance with AZ and TX regulations. Every transaction is handled by experienced professionals." },
        { title: "No Hidden Fees — Ever", body: "The number on your offer is the number you walk away with. We cover all closing costs. No commissions, no inspection fees, no deductions at the table." },
        { title: "Deep Local Market Knowledge", body: "We actively invest in Phoenix and Dallas. We know the submarkets, the comps, and the neighborhoods — which means our offers are grounded in real data." },
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
        { title: "Sell As-Is", body: "Don't spend a dollar on repairs. We buy homes in any condition — from move-in ready to major fixer-upper." },
        { title: "Zero Agent Fees", body: "No commissions, no closing costs on your end. The offer we make is the amount you receive at closing." },
        { title: "Close When You're Ready", body: "Need to close in 7 days? We can do it. Need 60 days to find your next place? We'll wait." },
        { title: "We Handle the Paperwork", body: "Our team manages every document from contract to closing. No surprises, no confusion at the table." },
        { title: "Any Situation", body: "Foreclosure, divorce, inherited home, problem tenants — we've seen it all and know how to help." },
        { title: "Local Team, Not a Call Center", body: "You talk to us directly. We're Phoenix and Dallas locals who know your streets and your market." },
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
        { quote: "I needed to sell fast after a divorce. Highlander gave me a fair offer the next day and we closed in 10 days. No drama, no delays — exactly what I needed.", name: "Maria T.", location: "Phoenix, AZ", situation: "Divorce" },
        { quote: "I inherited my parents' house and had no idea what to do. They walked me through every step and made it completely painless. Fair price, zero hassle.", name: "James R.", location: "Dallas, TX", situation: "Inherited Home" },
        { quote: "Was facing foreclosure with 3 weeks left. They came through with a cash offer and saved my credit. Genuinely grateful for how fast and professional they were.", name: "Sandra K.", location: "Phoenix, AZ", situation: "Foreclosure" },
      ],
    },
    faq: {
      label: "Common Questions",
      h2: "ANSWERS BEFORE YOU ASK.",
      items: [
        { q: "Will I get a fair price?", a: "We base every offer on recent comparable sales in your area, adjusted for condition and renovation costs. You'll see our reasoning — no lowball surprises. You're never obligated to accept." },
        { q: "Are there any fees or hidden costs?", a: "None. We cover all closing costs. No agent commissions, no inspection fees, no deductions at closing. What we offer is what you receive." },
        { q: "Do I need to repair or clean anything?", a: "Not a thing. Leave it exactly as-is — furniture, appliances, junk, whatever. We handle all cleanup and repairs after closing." },
        { q: "How fast can we actually close?", a: "Once you accept, we typically close in 7–14 business days. Need more time? We can extend to 30, 60, or even 90 days — your call." },
        { q: "What if I have liens or back taxes?", a: "We've handled it before. Tax liens, HOA debt, and mortgage arrears are common. Tell us upfront and our team works through the title issues as part of closing." },
        { q: "What types of homes do you buy?", a: "Single-family, multi-family, condos, townhomes, vacant land, and rentals in Phoenix metro and Dallas–Fort Worth. Any age, any price range, any condition." },
      ],
    },
    paths: {
      label: "Two Ways We Can Help",
      sell: { badge: "Sell", h2: ["SELL YOUR", "HOME ON", "YOUR TERMS."], body: "Cash offer in as little as 7 days, or let us repair and list your home for more.", cta: "See Sell Options" },
      invest: { badge: "Invest", h2: ["EARN RETURNS", "ON REAL", "ESTATE FLIPS."], body: "Partner with us on fix-and-flip deals and earn a share of the profits.", cta: "Explore Investing" },
    },
    cta: { h2: ["READY TO GET", "YOUR OFFER?"], sub: "It takes 2 minutes. No commitment. No cost." },
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
        { title: "Con Licencia y Asegurados", body: "Highlander REI opera con licencia y cumple con las regulaciones de AZ y TX. Cada transacción es manejada por profesionales con experiencia." },
        { title: "Sin Cargos Ocultos — Nunca", body: "El número en tu oferta es el número que recibes. Cubrimos todos los costos de cierre. Sin comisiones, sin deducciones en la mesa." },
        { title: "Conocemos Tu Mercado Local", body: "Invertimos activamente en Phoenix y Dallas. Conocemos los submercados, los comparables y los vecindarios — nuestras ofertas se basan en datos reales." },
      ],
    },
    how: {
      label: "Cómo Funciona",
      h2: ["TRES PASOS.", "CERO ESTRÉS."],
      steps: [
        { n: "01", title: "Cuéntanos Sobre Tu Casa", body: "Llena un formulario rápido o llámanos. Sin compromiso, sin presión — solo una conversación sobre tu propiedad." },
        { n: "02", title: "Recibe Tu Oferta en Efectivo", body: "Evaluamos tu propiedad y te enviamos una oferta competitiva en 24 horas, basada en comparables reales." },
        { n: "03", title: "Cierra Cuando Quieras", body: "Elige la fecha de cierre. Manejamos todo el papeleo. Recibes el dinero en 7 días o hasta 90 si necesitas más tiempo." },
      ],
    },
    benefits: {
      label: "Por Qué Nos Eligen",
      h2: ["SIN COMISIONES.", "SIN REPARACIONES.", "SIN ESPERAS."],
      items: [
        { title: "Vende Como Está", body: "No gastes un centavo en reparaciones. Compramos casas en cualquier condición." },
        { title: "Sin Comisiones", body: "Sin cargos de agente, sin costos de cierre. La oferta que hacemos es lo que recibes." },
        { title: "Cierra Cuando Estés Listo", body: "¿Necesitas cerrar en 7 días? Podemos hacerlo. ¿Necesitas 60 días? Nos adaptamos." },
        { title: "Nosotros Manejamos el Papeleo", body: "Nuestro equipo gestiona cada documento. Sin sorpresas en la mesa de cierre." },
        { title: "Cualquier Situación", body: "Ejecución hipotecaria, divorcio, herencia, inquilinos — hemos visto todo y sabemos ayudar." },
        { title: "Equipo Local, No un Call Center", body: "Hablas directamente con nosotros. Somos locales de Phoenix y Dallas." },
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
        { title: "Inquilinos Problemáticos", body: "¿Cansado de ser arrendador? Compramos tal como está." },
      ],
    },
    testimonials: {
      label: "Lo Que Dicen Los Propietarios",
      h2: "HISTORIAS REALES DE VENDEDORES REALES.",
      items: [
        { quote: "Necesitaba vender rápido después de un divorcio. Me dieron una oferta justa al día siguiente y cerramos en 10 días. Sin drama, sin retrasos.", name: "Maria T.", location: "Phoenix, AZ", situation: "Divorcio" },
        { quote: "Heredé la casa de mis padres y no sabía qué hacer. Me guiaron en cada paso y fue completamente sin complicaciones. Precio justo, sin esfuerzo.", name: "James R.", location: "Dallas, TX", situation: "Casa Heredada" },
        { quote: "Estaba a punto de perder mi casa con 3 semanas de margen. Vinieron con una oferta y salvaron mi crédito. Eternamente agradecida.", name: "Sandra K.", location: "Phoenix, AZ", situation: "Ejecución Hipotecaria" },
      ],
    },
    faq: {
      label: "Preguntas Frecuentes",
      h2: "RESPUESTAS ANTES DE QUE PREGUNTES.",
      items: [
        { q: "¿Obtendré un precio justo?", a: "Basamos cada oferta en ventas comparables recientes, ajustadas por condición. Verás nuestro razonamiento — nunca estás obligado a aceptar." },
        { q: "¿Hay algún cargo oculto?", a: "Ninguno. Cubrimos todos los costos de cierre. Sin comisiones, sin tarifas, sin deducciones. Lo que ofrecemos es lo que recibes." },
        { q: "¿Necesito reparar o limpiar algo?", a: "Nada. Déjala tal como está. Nosotros manejamos limpieza y reparaciones después del cierre." },
        { q: "¿Qué tan rápido podemos cerrar?", a: "Una vez que aceptas, cerramos en 7–14 días hábiles. Si necesitas más tiempo, podemos extender hasta 90 días." },
        { q: "¿Qué pasa si tengo gravámenes o impuestos atrasados?", a: "Ya lo hemos manejado. Dínos desde el principio y nuestro equipo lo resuelve como parte del proceso de cierre." },
        { q: "¿Qué tipos de casas compran?", a: "Casas unifamiliares, multifamiliares, condominios, terrenos y rentals en Phoenix y Dallas-Fort Worth. Cualquier condición, cualquier precio." },
      ],
    },
    paths: {
      label: "Dos Formas en que Podemos Ayudar",
      sell: { badge: "Vender", h2: ["VENDE TU", "CASA EN TUS", "TÉRMINOS."], body: "Oferta en efectivo en 7 días, o déjanos reparar y listar tu casa para más.", cta: "Ver Opciones de Venta" },
      invest: { badge: "Invertir", h2: ["GANA RETORNOS", "EN FLIPS DE", "BIENES RAÍCES."], body: "Asóciate con nosotros y gana parte de las ganancias en cada proyecto.", cta: "Explorar Inversiones" },
    },
    cta: { h2: ["¿LISTO PARA", "TU OFERTA?"], sub: "Toma 2 minutos. Sin compromiso. Sin costo." },
  },
};

export default function HomePage() {
  const { lang } = useLanguage();
  const t = content[lang];
  const [address, setAddress] = useState("");

  function handleEstimate(e: React.FormEvent) {
    e.preventDefault();
    const dest = address.trim()
      ? `${OFFER_URL}?address=${encodeURIComponent(address.trim())}`
      : OFFER_URL;
    window.location.href = dest;
  }

  return (
    <>
      <style>{`
        /* ── HERO ───────────────────────── */
        .hero-section {
          background: var(--near-black);
          padding: 80px 48px 72px;
          text-align: center;
        }
        /* ── ESTIMATE BAND ──────────────── */
        .estimate-section {
          background: var(--blue);
          padding: 72px 48px;
          text-align: center;
        }
        .estimate-form {
          max-width: 640px;
          margin: 32px auto 0;
          display: flex;
          border-radius: var(--radius-sm);
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.25);
        }
        .estimate-input {
          flex: 1;
          min-width: 0;
          padding: 18px 20px;
          font-size: 15px;
          border: none;
          outline: none;
          background: var(--white);
          color: var(--near-black);
          font-family: var(--font-body), system-ui, sans-serif;
        }
        .estimate-input::placeholder { color: var(--muted); }
        .estimate-btn {
          padding: 18px 24px;
          background: var(--near-black);
          color: var(--white);
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          white-space: nowrap;
          font-family: var(--font-body), system-ui, sans-serif;
          transition: background 0.15s;
          flex-shrink: 0;
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
          color: rgba(255,255,255,0.75);
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          padding: 5px 12px;
          border-radius: 20px;
        }
        /* ── STATS BAR ──────────────────── */
        .trust-bar {
          background: var(--off-white);
          border-top: 1px solid var(--border-light);
          border-bottom: 1px solid var(--border-light);
        }
        .trust-bar-inner {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 48px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          text-align: center;
        }
        .stat-cell {
          padding: 28px 16px;
          border-right: 1px solid var(--border-light);
        }
        .stat-cell:last-child { border-right: none; }
        /* ── CREDIBILITY ────────────────── */
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
        /* ── HOW IT WORKS ───────────────── */
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
        /* ── BENEFITS ───────────────────── */
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
        /* ── SITUATIONS ─────────────────── */
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
        /* ── TESTIMONIALS ───────────────── */
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
        /* ── FAQ ────────────────────────── */
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
        /* ── PATH CARDS ─────────────────── */
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
        .path-card-light { background: var(--off-white); }
        .path-card-light:hover { background: #f0efea; }
        .path-card-dark { background: var(--near-black); }
        .path-card-dark:hover { background: var(--black); }
        /* ── BOTTOM CTA ─────────────────── */
        .bottom-cta {
          background: var(--near-black);
          padding: 88px 48px;
          text-align: center;
        }
        /* ── SECTION ICON BUBBLE ────────── */
        .icon-bubble {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: var(--blue-light);
          border: 1px solid var(--blue-border);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          flex-shrink: 0;
        }

        /* ══ RESPONSIVE ════════════════════════════════════════ */
        @media (max-width: 900px) {
          .hero-section { padding: 56px 24px 52px; }
          .estimate-section { padding: 52px 24px; }
          .estimate-form { flex-direction: column; }
          .estimate-btn { width: 100%; padding: 16px; font-size: 15px; }
          .trust-bar-inner { padding: 0 24px; grid-template-columns: repeat(2, 1fr); }
          .stat-cell { border-right: none; border-bottom: 1px solid var(--border-light); }
          .stat-cell:nth-child(odd) { border-right: 1px solid var(--border-light); }
          .stat-cell:last-child { border-bottom: none; }
          .stat-cell:nth-last-child(2):nth-child(odd) { border-bottom: none; }
          .credibility-section { padding: 60px 24px; }
          .credibility-pillars { grid-template-columns: 1fr; gap: 14px; }
          .how-section { padding: 60px 24px; }
          .how-steps { grid-template-columns: 1fr; gap: 24px; }
          .benefits-section { padding: 60px 24px; }
          .benefits-grid { grid-template-columns: 1fr 1fr; gap: 14px; }
          .situations-section { padding: 60px 24px; }
          .situations-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
          .testimonials-section { padding: 60px 24px; }
          .testimonials-grid { grid-template-columns: 1fr; gap: 16px; }
          .faq-section { padding: 60px 24px; }
          .faq-grid { grid-template-columns: 1fr; }
          .paths-section { grid-template-columns: 1fr; }
          .path-card { padding: 40px 24px; }
          .bottom-cta { padding: 60px 24px; }
        }
        @media (max-width: 600px) {
          .hero-section { padding: 44px 16px 44px; }
          .estimate-section { padding: 44px 16px; }
          .trust-bar-inner { padding: 0 16px; }
          .credibility-section { padding: 48px 16px; }
          .how-section { padding: 48px 16px; }
          .benefits-section { padding: 48px 16px; }
          .benefits-grid { grid-template-columns: 1fr; }
          .situations-section { padding: 48px 16px; }
          .situations-grid { grid-template-columns: 1fr; }
          .testimonials-section { padding: 48px 16px; }
          .faq-section { padding: 48px 16px; }
          .bottom-cta { padding: 48px 16px; }
          .path-card { padding: 36px 16px; }
        }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="hero-section">
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "20px", padding: "5px 14px", marginBottom: "28px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", flexShrink: 0, display: "inline-block" }} />
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)", letterSpacing: "0.8px", fontWeight: 500 }}>{t.hero.badge}</span>
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(44px, 9vw, 100px)", color: "var(--white)", letterSpacing: "2px", lineHeight: 0.92, textTransform: "uppercase", marginBottom: "24px" }}>
          {t.hero.h1[0]}<br />
          <span style={{ color: "var(--blue-mid)" }}>{t.hero.h1[1]}</span><br />
          {t.hero.h1[2]}
        </h1>

        <p style={{ fontSize: "clamp(14px, 2.5vw, 18px)", color: "rgba(255,255,255,0.65)", maxWidth: "520px", margin: "0 auto 36px", lineHeight: 1.75, fontWeight: 300 }}>
          {t.hero.sub}
        </p>

        <a href={OFFER_URL} className="btn-blue" style={{ fontSize: "15px", padding: "15px 36px", display: "inline-block" }}>
          {t.hero.cta}
        </a>

        <div style={{ marginTop: "28px", fontSize: "11.5px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.5px" }}>
          {t.hero.trust}
        </div>
      </section>

      {/* ── ESTIMATE (OPENDOOR-STYLE) ──────────────────────────── */}
      <section className="estimate-section">
        <span style={{ display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", color: "rgba(255,255,255,0.6)", marginBottom: "12px" }}>{t.estimate.label}</span>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 5vw, 60px)", color: "var(--white)", letterSpacing: "2px", lineHeight: 1, textTransform: "uppercase" }}>
          {t.estimate.h2}
        </h2>
        <p style={{ fontSize: "clamp(13px, 2vw, 16px)", color: "rgba(255,255,255,0.65)", maxWidth: "520px", margin: "14px auto 0", lineHeight: 1.75 }}>
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
          <button type="submit" className="estimate-btn">{t.estimate.cta}</button>
        </form>
        <div className="estimate-chips">
          {t.estimate.chips.map((chip) => (
            <span key={chip} className="estimate-chip">{chip}</span>
          ))}
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────── */}
      <div className="trust-bar">
        <div className="trust-bar-inner">
          {t.stats.map((s) => (
            <div key={s.label} className="stat-cell">
              <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 4vw, 36px)", color: "var(--black)", letterSpacing: "1px", lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px", marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CREDIBILITY / WHO WE ARE ──────────────────────────── */}
      <section className="credibility-section">
        <div style={{ maxWidth: "820px", margin: "0 auto", textAlign: "center" }}>
          <span style={{ display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", color: "var(--blue)", marginBottom: "12px" }}>{t.credibility.label}</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 5vw, 56px)", color: "var(--black)", letterSpacing: "2px", lineHeight: 1, textTransform: "uppercase", marginBottom: "20px" }}>
            {t.credibility.h2}
          </h2>
          <p style={{ fontSize: "15px", color: "var(--mid)", lineHeight: 1.8 }}>{t.credibility.sub}</p>
        </div>
        <div className="credibility-pillars">
          {t.credibility.pillars.map((p, i) => (
            <div key={i} className="credibility-card">
              <div className="icon-bubble">{CredIcons[i]}</div>
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
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 5vw, 60px)", color: "var(--black)", letterSpacing: "2px", lineHeight: 0.95, textTransform: "uppercase" }}>
            {t.how.h2[0]}<br />{t.how.h2[1]}
          </h2>
        </div>
        <div className="how-steps">
          {t.how.steps.map((step, i) => (
            <div key={i}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "64px", color: "rgba(0,0,0,0.04)", lineHeight: 1, marginBottom: "-10px" }}>{step.n}</div>
              <div style={{ width: "40px", height: "40px", background: "var(--blue)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "18px", color: "var(--white)" }}>{i + 1}</span>
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: "var(--black)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>{step.title}</h3>
              <p style={{ fontSize: "14px", color: "var(--mid)", lineHeight: 1.75 }}>{step.body}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <a href={OFFER_URL} className="btn-blue">{t.hero.cta}</a>
        </div>
      </section>

      {/* ── BENEFITS ──────────────────────────────────────────── */}
      <section className="benefits-section">
        <div style={{ textAlign: "center" }}>
          <span style={{ display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", color: "var(--blue)", marginBottom: "12px" }}>{t.benefits.label}</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 52px)", color: "var(--black)", letterSpacing: "2px", lineHeight: 0.95, textTransform: "uppercase" }}>
            {t.benefits.h2[0]}<br />{t.benefits.h2[1]}<br />{t.benefits.h2[2]}
          </h2>
        </div>
        <div className="benefits-grid">
          {t.benefits.items.map((item, i) => (
            <div key={i} className="benefit-card">
              <div className="icon-bubble">{BenefitIcons[i]}</div>
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
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 4vw, 48px)", color: "var(--white)", letterSpacing: "2px", lineHeight: 1, textTransform: "uppercase" }}>
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
          <a href={OFFER_URL} className="btn-blue">{t.hero.cta}</a>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────── */}
      <section className="testimonials-section">
        <div style={{ textAlign: "center" }}>
          <span style={{ display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", color: "var(--blue)", marginBottom: "12px" }}>{t.testimonials.label}</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 4vw, 48px)", color: "var(--black)", letterSpacing: "2px", lineHeight: 0.95, textTransform: "uppercase" }}>
            {t.testimonials.h2}
          </h2>
        </div>
        <div className="testimonials-grid">
          {t.testimonials.items.map((item, i) => (
            <div key={i} className="testimonial-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: "2px" }}>
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} width="13" height="13" viewBox="0 0 13 13" fill="#f59e0b"><path d="M6.5 1l1.6 3.3 3.6.5-2.6 2.6.6 3.6-3.2-1.7L3.3 11l.6-3.6L1.3 4.8l3.6-.5z" /></svg>
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
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 4vw, 52px)", color: "var(--black)", letterSpacing: "2px", lineHeight: 1, textTransform: "uppercase" }}>
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
        <Link href="/sell" className="path-card path-card-light" style={{ borderRight: "1px solid var(--border-light)" }}>
          <div style={{ position: "absolute", top: "32px", left: "32px", fontFamily: "var(--font-display)", fontSize: "110px", color: "rgba(0,0,0,0.04)", lineHeight: 1, userSelect: "none" }}>01</div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "16px", background: "var(--blue-light)", border: "1px solid var(--blue-border)", padding: "4px 10px", borderRadius: "4px" }}>
              {t.paths.sell.badge}
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3.5vw, 52px)", color: "var(--near-black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 0.95, marginBottom: "16px" }}>
              {t.paths.sell.h2[0]}<br />{t.paths.sell.h2[1]}<br />{t.paths.sell.h2[2]}
            </h2>
            <p style={{ fontSize: "14px", color: "var(--mid)", lineHeight: 1.75, marginBottom: "28px", maxWidth: "340px" }}>{t.paths.sell.body}</p>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, color: "var(--white)", background: "var(--blue)", borderRadius: "8px", padding: "11px 20px" }}>
              {t.paths.sell.cta}
            </span>
          </div>
        </Link>

        <Link href="/invest" className="path-card path-card-dark">
          <div style={{ position: "absolute", top: "32px", left: "32px", fontFamily: "var(--font-display)", fontSize: "110px", color: "rgba(255,255,255,0.04)", lineHeight: 1, userSelect: "none" }}>02</div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "16px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: "4px" }}>
              {t.paths.invest.badge}
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3.5vw, 52px)", color: "var(--white)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 0.95, marginBottom: "16px" }}>
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
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 7vw, 80px)", color: "var(--white)", letterSpacing: "2px", lineHeight: 0.92, textTransform: "uppercase", marginBottom: "20px" }}>
          {t.cta.h2[0]}<br />{t.cta.h2[1]}
        </h2>
        <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.45)", maxWidth: "400px", margin: "0 auto 32px", lineHeight: 1.65 }}>
          {t.cta.sub}
        </p>
        <form style={{ maxWidth: "560px", margin: "0 auto", display: "flex", borderRadius: "var(--radius-sm)", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.35)" }} onSubmit={handleEstimate}>
          <input
            className="estimate-input"
            type="text"
            placeholder={t.estimate.placeholder}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            autoComplete="street-address"
          />
          <button type="submit" className="estimate-btn" style={{ background: "var(--blue)", minWidth: "140px" }}>
            {t.estimate.cta}
          </button>
        </form>
        <div style={{ marginTop: "18px", fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>
          {t.hero.trust}
        </div>
      </section>
    </>
  );
}
