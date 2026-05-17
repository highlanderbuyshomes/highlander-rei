"use client";
import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

const t = {
  en: {
    label: "How Do You Want to Sell?",
    h1a: "TWO PATHS.",
    h1b: "ZERO REPAIRS.",
    sub: "Need to close fast, or want to maximize what you walk away with? We've got a path for both.",
    cash: {
      tag: "Fast Close",
      title: ["Cash", "Offer"],
      body: "Get a competitive all-cash offer within 24 hours. No repairs, no showings, no agent fees. Close when you're ready.",
      points: [
        "Offer within 24 hours",
        "Close in as little as 7 days",
        "Typical transaction: 14–21 days",
        "No repairs, no cleaning, no staging",
        "No agent commissions",
        "Guaranteed close — no fall-through risk",
      ],
      best: "Best if you need speed, certainty, or are selling as-is.",
      cta: "Get My Cash Offer →",
    },
    flex: {
      tag: "Max Value",
      title: ["Flex Equity", "Program"],
      body: "We invest in your property — repairs done within 7 days, professional staging, then listed on the open market. You get significantly more at closing without touching a thing.",
      points: [
        "Repairs completed within 7 days",
        "First offer typically accepted in 7–10 days",
        "We fund all work — zero upfront cost to you",
        "Professional staging and photography",
        "Full MLS exposure and expert listing",
        "Walk away with more than a cash offer",
      ],
      best: "Best if you want top dollar and don't mind a 45–60 day total timeline.",
      cta: "Learn About Flex Equity →",
    },
    tableLabel: "Side by Side",
    tableH2: "Which Is Right for You?",
    tableHeaders: ["Cash Offer", "Flex Equity"],
    rows: [
      { label: "Timeline", cash: "7–21 days", flex: "45–60 days" },
      { label: "Sale price", cash: "Fair market value", flex: "Priced strategically" },
      { label: "Repairs", cash: "None", flex: "Done within 7 days" },
      { label: "First offer", cash: "N/A — direct to you", flex: "Typically 7–10 days" },
      { label: "Upfront cost to you", cash: "$0", flex: "$0" },
      { label: "Certainty", cash: "Guaranteed close", flex: "Market dependent" },
    ],
  },
  es: {
    label: "¿Cómo Quieres Vender?",
    h1a: "DOS CAMINOS.",
    h1b: "CERO REPARACIONES.",
    sub: "¿Necesitas cerrar rápido, o quieres maximizar lo que te llevas? Tenemos un camino para ambos.",
    cash: {
      tag: "Cierre Rápido",
      title: ["Oferta en", "Efectivo"],
      body: "Obtén una oferta competitiva en efectivo dentro de 24 horas. Sin reparaciones, sin visitas, sin comisiones de agente. Cierra cuando estés listo.",
      points: [
        "Oferta en 24 horas",
        "Cierre en tan solo 7 días",
        "Transacción típica: 14–21 días",
        "Sin reparaciones, sin limpieza, sin staging",
        "Sin comisiones de agente",
        "Cierre garantizado — sin riesgo de cancelación",
      ],
      best: "Ideal si necesitas rapidez, certeza, o estás vendiendo tal como está.",
      cta: "Obtener Mi Oferta en Efectivo →",
    },
    flex: {
      tag: "Máximo Valor",
      title: ["Programa", "Flex Equity"],
      body: "Invertimos en tu propiedad — reparaciones listas en 7 días, amoblado profesional, luego publicada en el mercado abierto. Obtienes significativamente más al cierre sin tocar nada.",
      points: [
        "Reparaciones completadas en 7 días",
        "Primera oferta típicamente aceptada en 7–10 días",
        "Financiamos todo el trabajo — costo inicial cero",
        "Amoblado y fotografía profesional",
        "Exposición completa en MLS y listado experto",
        "Llévate más que con una oferta en efectivo",
      ],
      best: "Ideal si quieres el precio máximo y no te importa un plazo total de 45–60 días.",
      cta: "Saber Sobre Flex Equity →",
    },
    tableLabel: "Lado a Lado",
    tableH2: "¿Cuál Es el Correcto Para Ti?",
    tableHeaders: ["Oferta Efectivo", "Flex Equity"],
    rows: [
      { label: "Plazo", cash: "7–21 días", flex: "45–60 días" },
      { label: "Precio de venta", cash: "Valor justo de mercado", flex: "Precio estratégico" },
      { label: "Reparaciones", cash: "Ninguna", flex: "Listas en 7 días" },
      { label: "Primera oferta", cash: "N/A — directo a ti", flex: "Típicamente 7–10 días" },
      { label: "Costo inicial", cash: "$0", flex: "$0" },
      { label: "Certeza", cash: "Cierre garantizado", flex: "Depende del mercado" },
    ],
  },
};

export default function SellPage() {
  const [hovered, setHovered] = useState<"cash" | "flex" | null>(null);
  const { lang } = useLanguage();
  const c = t[lang];

  return (
    <>
      {/* ── HEADER ───────────────────────────────────────────── */}
      <section style={{ background: "var(--off-white)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="section" style={{ paddingBottom: "64px", textAlign: "center" }}>
          <span className="section-label">{c.label}</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(44px, 7vw, 80px)", color: "var(--black)", letterSpacing: "3px", lineHeight: 0.95, textTransform: "uppercase", marginBottom: "22px" }}>
            {c.h1a}<br />{c.h1b}
          </h1>
          <p style={{ fontSize: "17px", color: "var(--mid)", maxWidth: "520px", margin: "0 auto", lineHeight: 1.8, fontWeight: 300 }}>{c.sub}</p>
        </div>
      </section>

      {/* ── TWO OPTIONS ──────────────────────────────────────── */}
      <section style={{ background: "var(--white)" }}>
        <div className="section">
          <div className={`sell-chooser-grid${hovered === "cash" ? " hover-cash" : hovered === "flex" ? " hover-flex" : ""}`}>
            {/* Cash Offer */}
            <Link
              href="/sell/cash"
              className="sell-option-card"
              style={{ background: "var(--blue-light)", border: "1px solid var(--blue-border)", textDecoration: "none" }}
              onMouseEnter={() => setHovered("cash")}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{ height: "4px", background: "var(--blue)" }} />
              <div style={{ padding: "36px 32px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "16px" }}>{c.cash.tag}</div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3vw, 40px)", color: "var(--black)", letterSpacing: "1.5px", textTransform: "uppercase", lineHeight: 0.95, marginBottom: "18px" }}>
                  {c.cash.title[0]}<br />{c.cash.title[1]}
                </h2>
                <p style={{ fontSize: "14px", color: "var(--mid)", lineHeight: 1.8, marginBottom: "24px" }}>{c.cash.body}</p>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px", flex: 1 }}>
                  {c.cash.points.map((p) => (
                    <li key={p} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13.5px", color: "var(--mid)" }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: "1px" }}>
                        <circle cx="8" cy="8" r="7.5" fill="white" />
                        <path d="M5 8l2.2 2.2 3.8-3.8" stroke="var(--blue)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
                <div style={{ fontSize: "12px", color: "var(--muted)", fontStyle: "italic", marginBottom: "24px", lineHeight: 1.6 }}>{c.cash.best}</div>
                <span className="btn-blue" style={{ justifyContent: "center", padding: "14px 24px" }}>{c.cash.cta}</span>
              </div>
            </Link>

            {/* Flex Equity */}
            <Link
              href="/sell/flex"
              className="sell-option-card"
              style={{ background: "var(--off-white)", border: "1px solid var(--border-light)", textDecoration: "none" }}
              onMouseEnter={() => setHovered("flex")}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{ height: "4px", background: "var(--black)" }} />
              <div style={{ padding: "36px 32px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, color: "var(--black)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "16px" }}>{c.flex.tag}</div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3vw, 40px)", color: "var(--black)", letterSpacing: "1.5px", textTransform: "uppercase", lineHeight: 0.95, marginBottom: "18px" }}>
                  {c.flex.title[0]}<br />{c.flex.title[1]}
                </h2>
                <p style={{ fontSize: "14px", color: "var(--mid)", lineHeight: 1.8, marginBottom: "24px" }}>{c.flex.body}</p>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px", flex: 1 }}>
                  {c.flex.points.map((p) => (
                    <li key={p} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13.5px", color: "var(--mid)" }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: "1px" }}>
                        <circle cx="8" cy="8" r="7.5" fill="white" />
                        <path d="M5 8l2.2 2.2 3.8-3.8" stroke="var(--black)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
                <div style={{ fontSize: "12px", color: "var(--muted)", fontStyle: "italic", marginBottom: "24px", lineHeight: 1.6 }}>{c.flex.best}</div>
                <span className="btn-black" style={{ justifyContent: "center", padding: "14px 24px" }}>{c.flex.cta}</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── COMPARE TABLE ────────────────────────────────────── */}
      <section style={{ background: "var(--near-black)" }}>
        <div className="section">
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span className="section-label" style={{ color: "rgba(255,255,255,0.35)" }}>{c.tableLabel}</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", color: "var(--white)", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>{c.tableH2}</h2>
          </div>
          <div style={{ maxWidth: "760px", margin: "0 auto", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", background: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ padding: "12px 22px" }} />
              <div style={{ padding: "12px 22px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--blue)", textAlign: "center" }}>{c.tableHeaders[0]}</div>
              <div style={{ padding: "12px 22px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "rgba(255,255,255,0.6)", textAlign: "center" }}>{c.tableHeaders[1]}</div>
            </div>
            {c.rows.map((row, i) => (
              <div key={row.label} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <div style={{ padding: "15px 22px", fontSize: "13px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{row.label}</div>
                <div style={{ padding: "15px 22px", fontSize: "13px", color: "var(--blue)", textAlign: "center", fontWeight: 600 }}>{row.cash}</div>
                <div style={{ padding: "15px 22px", fontSize: "13px", color: "rgba(255,255,255,0.55)", textAlign: "center" }}>{row.flex}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
