"use client";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

const content = {
  en: {
    badge: "Phoenix, AZ · Dallas, TX",
    h1: ["REAL ESTATE,", "YOUR WAY."],
    sub: "Tell us what you're trying to do. We'll show you the path.",
    sell: {
      badge: "Sell",
      h2: ["SELL YOUR", "HOME ON", "YOUR TERMS."],
      body: "Cash offer in as little as 7 days, or let us invest in your property and list it — getting you more without the repairs or stress.",
      cta: "See My Options →",
    },
    buy: {
      badge: "Buy",
      h2: ["FIND A HOME,", "INVEST, OR", "BUILD WEALTH."],
      body: "Find your next home, source an investment property, or partner with us on a flip and earn a share of the returns.",
      cta: "Explore Options →",
    },
    stats: [
      { val: "6+", label: "Years in the market", body: "Building deal flow and investor relationships across Phoenix and Dallas since 2019." },
      { val: "PHX + DFW", label: "Where we operate", body: "Two of the strongest residential real estate markets in the country — and we know both intimately." },
      { val: "JV", label: "Partnership model", body: "Every deal is its own joint venture. You know exactly what you own and what you earn — no blind pools." },
    ],
  },
  es: {
    badge: "Phoenix, AZ · Dallas, TX · Hablamos Español",
    h1: ["BIENES RAÍCES,", "A TU MANERA."],
    sub: "Dinos qué quieres lograr. Te mostramos el camino.",
    sell: {
      badge: "Vender",
      h2: ["VENDE TU", "CASA EN TUS", "TÉRMINOS."],
      body: "Oferta en efectivo en tan solo 7 días, o déjanos invertir en tu propiedad y listarla — más dinero para ti sin reparaciones ni estrés.",
      cta: "Ver Mis Opciones →",
    },
    buy: {
      badge: "Comprar",
      h2: ["ENCUENTRA UNA", "CASA O INVIERTE", "CON NOSOTROS."],
      body: "Encuentra tu próxima casa, busca una propiedad de inversión, o asóciate con nosotros en un flip y gana parte de las ganancias.",
      cta: "Explorar Opciones →",
    },
    stats: [
      { val: "6+", label: "Años en el mercado", body: "Construyendo relaciones de inversión en Phoenix y Dallas desde 2019." },
      { val: "PHX + DFW", label: "Donde operamos", body: "Dos de los mercados inmobiliarios más fuertes del país — y los conocemos a fondo." },
      { val: "JV", label: "Modelo de asociación", body: "Cada proyecto es su propia empresa conjunta. Sabes exactamente qué posees y qué ganas." },
    ],
  },
};

export default function HomePage() {
  const { lang } = useLanguage();
  const t = content[lang];

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section style={{ background: "var(--off-white)", textAlign: "center", padding: "72px 48px 56px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--off-white)", border: "1px solid var(--border-light)", borderRadius: "20px", padding: "5px 14px", marginBottom: "24px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--blue)", flexShrink: 0, display: "inline-block" }} />
          <span style={{ fontSize: "11px", color: "var(--mid)", letterSpacing: "0.8px", fontWeight: 500 }}>{t.badge}</span>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(48px, 8vw, 96px)", color: "var(--black)", letterSpacing: "2px", lineHeight: 0.95, textTransform: "uppercase", marginBottom: "20px" }}>
          {t.h1[0]}<br />{t.h1[1]}
        </h1>
        <p style={{ fontSize: "17px", color: "var(--mid)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.75, fontWeight: 300 }}>
          {t.sub}
        </p>
      </section>

      {/* ── TWO PATH CARDS ────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "560px" }}>

        {/* SELL — white */}
        <Link href="/sell" className="path-card" style={{ background: "var(--off-white)", borderRight: "1px solid var(--border-light)" }}>
          <div style={{ position: "absolute", top: "36px", left: "36px", fontFamily: "var(--font-display)", fontSize: "120px", color: "rgba(0,0,0,0.04)", lineHeight: 1, userSelect: "none" }}>01</div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "14px", background: "var(--blue-light)", border: "1px solid var(--blue-border)", padding: "4px 10px", borderRadius: "4px" }}>
              {t.sell.badge}
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 4vw, 56px)", color: "var(--near-black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 0.95, marginBottom: "16px" }}>
              {t.sell.h2[0]}<br />{t.sell.h2[1]}<br />{t.sell.h2[2]}
            </h2>
            <p style={{ fontSize: "14px", color: "var(--mid)", lineHeight: 1.75, marginBottom: "28px", maxWidth: "340px" }}>
              {t.sell.body}
            </p>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, color: "var(--white)", background: "var(--blue)", borderRadius: "8px", padding: "11px 20px" }}>
              {t.sell.cta}
            </span>
          </div>
        </Link>

        {/* BUY — white with blue accent */}
        <Link href="/buy" className="path-card" style={{ background: "var(--white)", borderLeft: "1px solid var(--border-light)" }}>
          <div style={{ position: "absolute", top: "36px", left: "36px", fontFamily: "var(--font-display)", fontSize: "120px", color: "rgba(26,86,219,0.05)", lineHeight: 1, userSelect: "none" }}>02</div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "14px", background: "var(--blue-light)", border: "1px solid var(--blue-border)", padding: "4px 10px", borderRadius: "4px" }}>
              {t.buy.badge}
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 4vw, 56px)", color: "var(--near-black)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 0.95, marginBottom: "16px" }}>
              {t.buy.h2[0]}<br />{t.buy.h2[1]}<br />{t.buy.h2[2]}
            </h2>
            <p style={{ fontSize: "14px", color: "var(--mid)", lineHeight: 1.75, marginBottom: "28px", maxWidth: "340px" }}>
              {t.buy.body}
            </p>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, color: "var(--white)", background: "var(--blue)", borderRadius: "8px", padding: "11px 20px" }}>
              {t.buy.cta}
            </span>
          </div>
        </Link>

      </div>

      {/* ── ABOUT BAR ─────────────────────────────────────────── */}
      <section style={{ background: "var(--off-white)", borderTop: "1px solid var(--border-light)" }}>
        <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "56px 48px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "48px" }}>
          {t.stats.map((s) => (
            <div key={s.label}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "40px", color: "var(--black)", letterSpacing: "1.5px", lineHeight: 1, marginBottom: "6px" }}>{s.val}</div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "10px" }}>{s.label}</div>
              <p style={{ fontSize: "13.5px", color: "var(--mid)", lineHeight: 1.75 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
