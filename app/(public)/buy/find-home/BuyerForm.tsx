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
    beds: "Bedrooms",
    bedsOptions: [
      { value: "", label: "Any" },
      { value: "1", label: "1+" },
      { value: "2", label: "2+" },
      { value: "3", label: "3+" },
      { value: "4", label: "4+" },
      { value: "5", label: "5+" },
    ],
    baths: "Bathrooms",
    bathsOptions: [
      { value: "", label: "Any" },
      { value: "1", label: "1+" },
      { value: "1.5", label: "1.5+" },
      { value: "2", label: "2+" },
      { value: "2.5", label: "2.5+" },
      { value: "3", label: "3+" },
      { value: "4", label: "4+" },
    ],
    sqft: "Square Footage",
    sqftOptions: [
      { value: "", label: "Any" },
      { value: "under-1000", label: "Under 1,000 sq ft" },
      { value: "1000-1500", label: "1,000 – 1,500 sq ft" },
      { value: "1500-2000", label: "1,500 – 2,000 sq ft" },
      { value: "2000-2500", label: "2,000 – 2,500 sq ft" },
      { value: "2500-3000", label: "2,500 – 3,000 sq ft" },
      { value: "3000-plus", label: "3,000+ sq ft" },
    ],
    price: "Price Point *",
    priceOptions: [
      { value: "", label: "Select one" },
      { value: "under-200k", label: "Under $200,000" },
      { value: "200k-300k", label: "$200,000 – $300,000" },
      { value: "300k-400k", label: "$300,000 – $400,000" },
      { value: "400k-500k", label: "$400,000 – $500,000" },
      { value: "500k-700k", label: "$500,000 – $700,000" },
      { value: "700k-plus", label: "$700,000+" },
    ],
    timeline: "Timeline *",
    timelineOptions: [
      { value: "", label: "Select one" },
      { value: "asap", label: "As soon as possible" },
      { value: "1-3months", label: "1–3 months" },
      { value: "3-6months", label: "3–6 months" },
      { value: "6plus", label: "6+ months" },
    ],
    financing: "Financing Type *",
    financingOptions: [
      { value: "cash", label: "Cash" },
      { value: "conventional", label: "Conventional" },
      { value: "fha", label: "FHA" },
      { value: "va", label: "VA" },
    ],
    notes: "Anything else we should know?",
    notesOptional: "(optional)",
    notesPlaceholder: "Specific neighborhoods, must-haves, deal-breakers, investment vs. primary residence…",
    submit: "Submit Search Criteria →",
    submitting: "Submitting…",
    footer: "No obligation · We respond within 24 hours",
    successTitle: "Got It",
    successBody: "We'll review your search criteria and reach out within 24 hours to discuss next steps and current inventory.",
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
    beds: "Habitaciones",
    bedsOptions: [
      { value: "", label: "Cualquier" },
      { value: "1", label: "1+" },
      { value: "2", label: "2+" },
      { value: "3", label: "3+" },
      { value: "4", label: "4+" },
      { value: "5", label: "5+" },
    ],
    baths: "Baños",
    bathsOptions: [
      { value: "", label: "Cualquier" },
      { value: "1", label: "1+" },
      { value: "1.5", label: "1.5+" },
      { value: "2", label: "2+" },
      { value: "2.5", label: "2.5+" },
      { value: "3", label: "3+" },
      { value: "4", label: "4+" },
    ],
    sqft: "Pies Cuadrados",
    sqftOptions: [
      { value: "", label: "Cualquier" },
      { value: "under-1000", label: "Menos de 1,000 pies²" },
      { value: "1000-1500", label: "1,000 – 1,500 pies²" },
      { value: "1500-2000", label: "1,500 – 2,000 pies²" },
      { value: "2000-2500", label: "2,000 – 2,500 pies²" },
      { value: "2500-3000", label: "2,500 – 3,000 pies²" },
      { value: "3000-plus", label: "3,000+ pies²" },
    ],
    price: "Precio *",
    priceOptions: [
      { value: "", label: "Selecciona uno" },
      { value: "under-200k", label: "Menos de $200,000" },
      { value: "200k-300k", label: "$200,000 – $300,000" },
      { value: "300k-400k", label: "$300,000 – $400,000" },
      { value: "400k-500k", label: "$400,000 – $500,000" },
      { value: "500k-700k", label: "$500,000 – $700,000" },
      { value: "700k-plus", label: "$700,000+" },
    ],
    timeline: "Plazo *",
    timelineOptions: [
      { value: "", label: "Selecciona uno" },
      { value: "asap", label: "Lo antes posible" },
      { value: "1-3months", label: "1–3 meses" },
      { value: "3-6months", label: "3–6 meses" },
      { value: "6plus", label: "6+ meses" },
    ],
    financing: "Tipo de Financiamiento *",
    financingOptions: [
      { value: "cash", label: "Efectivo" },
      { value: "conventional", label: "Convencional" },
      { value: "fha", label: "FHA" },
      { value: "va", label: "VA" },
    ],
    notes: "¿Algo más que debamos saber?",
    notesOptional: "(opcional)",
    notesPlaceholder: "Vecindarios específicos, requisitos, exclusiones, inversión vs. residencia principal…",
    submit: "Enviar Criterios de Búsqueda →",
    submitting: "Enviando…",
    footer: "Sin compromiso · Respondemos dentro de 24 horas",
    successTitle: "Recibido",
    successBody: "Revisaremos tus criterios de búsqueda y nos comunicaremos dentro de 24 horas para hablar sobre los próximos pasos e inventario actual.",
  },
};

export default function BuyerForm() {
  const { lang } = useLanguage();
  const c = t[lang];
  const [financing, setFinancing] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleFinancing = (val: string) => {
    setFinancing((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const data = { ...Object.fromEntries(new FormData(form)), financing: financing.join(", ") };
    try {
      await fetch("/api/buyer-inquiry", { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } });
    } catch {
      // still show success
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="form-success-card" style={{ background: "var(--white)", border: "1px solid var(--border-light)", borderRadius: "var(--radius)", textAlign: "center" }}>
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

  return (
    <form onSubmit={handleSubmit} style={{ background: "var(--white)", border: "1px solid var(--border-light)", borderRadius: "var(--radius)", padding: "40px" }}>

      {/* Name */}
      <div className="form-row-2">
        <div className="form-field">
          <label className="form-label" htmlFor="firstName">{c.firstName}</label>
          <input id="firstName" name="firstName" type="text" required className="form-input" placeholder="Jane" />
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
          <input id="email" name="email" type="email" required className="form-input" placeholder="jane@email.com" />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="phone">{c.phone}</label>
          <input id="phone" name="phone" type="tel" required className="form-input" placeholder="(602) 555-0100" />
        </div>
      </div>

      {/* Market */}
      <div className="form-field" style={{ marginBottom: "14px" }}>
        <label className="form-label" htmlFor="market">{c.market}</label>
        <select id="market" name="market" required className="form-input">
          {c.marketOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Beds / Baths */}
      <div className="form-row-2">
        <div className="form-field">
          <label className="form-label" htmlFor="beds">{c.beds}</label>
          <select id="beds" name="beds" className="form-input">
            {c.bedsOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="baths">{c.baths}</label>
          <select id="baths" name="baths" className="form-input">
            {c.bathsOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Sqft / Price */}
      <div className="form-row-2">
        <div className="form-field">
          <label className="form-label" htmlFor="sqft">{c.sqft}</label>
          <select id="sqft" name="sqft" className="form-input">
            {c.sqftOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="price">{c.price}</label>
          <select id="price" name="price" required className="form-input">
            {c.priceOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="form-field" style={{ marginBottom: "14px" }}>
        <label className="form-label" htmlFor="timeline">{c.timeline}</label>
        <select id="timeline" name="timeline" required className="form-input">
          {c.timelineOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Financing */}
      <div className="form-field" style={{ marginBottom: "14px" }}>
        <label className="form-label">{c.financing}</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "2px" }}>
          {c.financingOptions.map((o) => (
            <button key={o.value} type="button" onClick={() => toggleFinancing(o.value)} style={{ padding: "8px 18px", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer", border: financing.includes(o.value) ? "1.5px solid var(--blue)" : "1.5px solid var(--border-light)", background: financing.includes(o.value) ? "var(--blue-light)" : "var(--white)", color: financing.includes(o.value) ? "var(--blue)" : "var(--mid)", transition: "all 0.12s" }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="form-field" style={{ marginBottom: "28px" }}>
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
