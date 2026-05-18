"use client";
import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

const t = {
  en: {
    firstName: "First Name *",
    lastName: "Last Name *",
    email: "Email *",
    phone: "Phone *",
    market: "Target Market *",
    marketOptions: [
      { value: "", label: "Select one" },
      { value: "phoenix-az", label: "Phoenix, AZ" },
      { value: "dallas-tx", label: "Dallas, TX" },
      { value: "both", label: "Both markets" },
    ],
    dealType: "Deal Type",
    dealTypeOptions: [
      { value: "fix-flip", label: "Fix & Flip" },
      { value: "buy-hold", label: "Buy & Hold" },
      { value: "value-add", label: "Value-Add" },
    ],
    priceRange: "Purchase Price Range *",
    priceOptions: [
      { value: "", label: "Select one" },
      { value: "under-100k", label: "Under $100,000" },
      { value: "100k-200k", label: "$100,000 – $200,000" },
      { value: "200k-300k", label: "$200,000 – $300,000" },
      { value: "300k-500k", label: "$300,000 – $500,000" },
      { value: "500k-plus", label: "$500,000+" },
    ],
    financing: "Financing Type *",
    financingOptions: [
      { value: "cash", label: "Cash" },
      { value: "hard-money", label: "Hard Money / Private Money" },
      { value: "dscr", label: "DSCR Loan" },
    ],
    timeline: "Timeline *",
    timelineOptions: [
      { value: "", label: "Select one" },
      { value: "asap", label: "Ready to buy now" },
      { value: "1-3months", label: "1–3 months" },
      { value: "3-6months", label: "3–6 months" },
      { value: "6plus", label: "6+ months" },
    ],
    notes: "Anything else we should know?",
    notesOptional: "(optional)",
    notesPlaceholder: "Specific neighborhoods, min ROI targets, rehab experience, number of deals per year…",
    submit: "Join the Deal List →",
    submitting: "Submitting…",
    footer: "No fees · No commitment · We respond within 24 hours",
    successTitle: "You're on the List",
    successBody: "We'll reach out within 24 hours and start sending you deals that match your buy box as they come through our pipeline.",
  },
  es: {
    firstName: "Nombre *",
    lastName: "Apellido *",
    email: "Correo Electrónico *",
    phone: "Teléfono *",
    market: "Mercado Objetivo *",
    marketOptions: [
      { value: "", label: "Selecciona uno" },
      { value: "phoenix-az", label: "Phoenix, AZ" },
      { value: "dallas-tx", label: "Dallas, TX" },
      { value: "both", label: "Ambos mercados" },
    ],
    dealType: "Tipo de Trato",
    dealTypeOptions: [
      { value: "fix-flip", label: "Comprar y Revender" },
      { value: "buy-hold", label: "Comprar y Mantener" },
      { value: "value-add", label: "Valor Agregado" },
    ],
    priceRange: "Rango de Precio de Compra *",
    priceOptions: [
      { value: "", label: "Selecciona uno" },
      { value: "under-100k", label: "Menos de $100,000" },
      { value: "100k-200k", label: "$100,000 – $200,000" },
      { value: "200k-300k", label: "$200,000 – $300,000" },
      { value: "300k-500k", label: "$300,000 – $500,000" },
      { value: "500k-plus", label: "$500,000+" },
    ],
    financing: "Tipo de Financiamiento *",
    financingOptions: [
      { value: "cash", label: "Efectivo" },
      { value: "hard-money", label: "Dinero Duro / Privado" },
      { value: "dscr", label: "Préstamo DSCR" },
    ],
    timeline: "Plazo *",
    timelineOptions: [
      { value: "", label: "Selecciona uno" },
      { value: "asap", label: "Listo para comprar ahora" },
      { value: "1-3months", label: "1–3 meses" },
      { value: "3-6months", label: "3–6 meses" },
      { value: "6plus", label: "6+ meses" },
    ],
    notes: "¿Algo más que debamos saber?",
    notesOptional: "(opcional)",
    notesPlaceholder: "Vecindarios específicos, retorno mínimo esperado, experiencia en remodelación, número de tratos por año…",
    submit: "Unirse a la Lista de Tratos →",
    submitting: "Enviando…",
    footer: "Sin tarifas · Sin compromiso · Respondemos dentro de 24 horas",
    successTitle: "Estás en la Lista",
    successBody: "Nos comunicaremos dentro de 24 horas y comenzaremos a enviarte tratos que coincidan con tus criterios a medida que lleguen a nuestra cartera.",
  },
};

export default function InvestorForm() {
  const { lang } = useLanguage();
  const c = t[lang];
  const [dealTypes, setDealTypes] = useState<string[]>([]);
  const [financing, setFinancing] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = (list: string[], setList: (v: string[]) => void, val: string) => {
    setList(list.includes(val) ? list.filter((v) => v !== val) : [...list, val]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const data = {
      ...Object.fromEntries(new FormData(form)),
      dealType: dealTypes.join(", "),
      financing: financing.join(", "),
    };
    try {
      await fetch("/api/investor-inquiry", { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } });
    } catch {
      // still show success
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div style={{ background: "var(--white)", border: "1px solid var(--border-light)", borderRadius: "var(--radius)", padding: "52px 40px", textAlign: "center" }}>
        <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "var(--blue-light)", border: "2px solid var(--blue-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l4.5 4.5L19 7" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "34px", color: "var(--black)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "12px" }}>{c.successTitle}</h2>
        <p style={{ fontSize: "14px", color: "var(--mid)", lineHeight: 1.8, maxWidth: "380px", margin: "0 auto" }}>{c.successBody}</p>
      </div>
    );
  }

  const chipStyle = (active: boolean) => ({
    padding: "8px 18px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: 500 as const,
    cursor: "pointer" as const,
    border: active ? "1.5px solid var(--blue)" : "1.5px solid var(--border-light)",
    background: active ? "var(--blue-light)" : "var(--white)",
    color: active ? "var(--blue)" : "var(--mid)",
    transition: "all 0.12s",
  });

  return (
    <form onSubmit={handleSubmit} style={{ background: "var(--white)", border: "1px solid var(--border-light)", borderRadius: "var(--radius)", padding: "40px" }}>

      {/* Name */}
      <div className="form-row-2">
        <div className="form-field">
          <label className="form-label" htmlFor="firstName">{c.firstName}</label>
          <input id="firstName" name="firstName" type="text" required className="form-input" placeholder="John" />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="lastName">{c.lastName}</label>
          <input id="lastName" name="lastName" type="text" required className="form-input" placeholder="Smith" />
        </div>
      </div>

      {/* Contact */}
      <div className="form-row-2">
        <div className="form-field">
          <label className="form-label" htmlFor="email">{c.email}</label>
          <input id="email" name="email" type="email" required className="form-input" placeholder="john@email.com" />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="phone">{c.phone}</label>
          <input id="phone" name="phone" type="tel" required className="form-input" placeholder="(602) 555-0100" />
        </div>
      </div>

      {/* Market */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
        <label className="form-label" htmlFor="market">{c.market}</label>
        <select id="market" name="market" required className="form-input">
          {c.marketOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Deal Type chips */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
        <label className="form-label">{c.dealType}</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {c.dealTypeOptions.map((o) => (
            <button key={o.value} type="button" onClick={() => toggle(dealTypes, setDealTypes, o.value)} style={chipStyle(dealTypes.includes(o.value))}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
        <label className="form-label" htmlFor="priceRange">{c.priceRange}</label>
        <select id="priceRange" name="priceRange" required className="form-input">
          {c.priceOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Financing chips */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
        <label className="form-label">{c.financing}</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {c.financingOptions.map((o) => (
            <button key={o.value} type="button" onClick={() => toggle(financing, setFinancing, o.value)} style={chipStyle(financing.includes(o.value))}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
        <label className="form-label" htmlFor="timeline">{c.timeline}</label>
        <select id="timeline" name="timeline" required className="form-input">
          {c.timelineOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Notes */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "28px" }}>
        <label className="form-label" htmlFor="notes">
          {c.notes}{" "}
          <span style={{ color: "var(--muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: "11px" }}>{c.notesOptional}</span>
        </label>
        <textarea id="notes" name="notes" rows={3} className="form-input" placeholder={c.notesPlaceholder} style={{ resize: "vertical" }} />
      </div>

      <button type="submit" disabled={loading} className="btn-blue btn-blue-lg" style={{ width: "100%", justifyContent: "center" }}>
        {loading ? c.submitting : c.submit}
      </button>

      <p style={{ fontSize: "12px", color: "var(--muted)", textAlign: "center", marginTop: "14px" }}>{c.footer}</p>
    </form>
  );
}
