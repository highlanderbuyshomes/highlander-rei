"use client";

import { useRef } from "react";

const inp: React.CSSProperties = {
  width: "100%", padding: "9px 12px", fontSize: "13px",
  border: "1px solid #d0cfc8", borderRadius: "6px",
  background: "#ffffff", color: "#111110", fontFamily: "inherit", outline: "none",
  boxSizing: "border-box",
};

const label: React.CSSProperties = {
  display: "block", fontSize: "10px", fontWeight: 700, color: "#8a8a84",
  textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px",
};

const row2: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px",
};

interface Props {
  buyerSearches: { id: string; name: string; buyerContact: string | null }[];
  action: (formData: FormData) => Promise<void>;
  defaults?: Record<string, unknown>;
  submitLabel?: string;
}

export default function BuyBoxForm({ buyerSearches, action, defaults = {}, submitLabel = "Create" }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  const d = (key: string, fallback = "") => {
    const v = defaults[key];
    if (Array.isArray(v)) return v.join(", ");
    return v != null ? String(v) : fallback;
  };

  async function handleSubmit(formData: FormData) {
    await action(formData);
    formRef.current?.reset();
  }

  return (
    <form ref={formRef} action={handleSubmit}>
      {/* Name + Buyer Search link */}
      <div style={row2}>
        <div>
          <span style={label}>Name</span>
          <input name="name" required placeholder="e.g. Arcadia SFR under 800K" defaultValue={d("name")} style={inp} />
        </div>
        <div>
          <span style={label}>Buyer Search</span>
          <select name="areaId" defaultValue={d("areaId")} style={inp}>
            <option value="">Not linked</option>
            {buyerSearches.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.buyerContact ? ` — ${s.buyerContact}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ZIP codes — the primary targeting field */}
      <div style={{ marginBottom: "12px" }}>
        <span style={label}>Target ZIP Codes (comma-separated)</span>
        <input name="zips" placeholder="85018, 85253, 85251, 85254" defaultValue={d("zips")} style={inp} />
        <div style={{ fontSize: "10px", color: "#b0b0a8", marginTop: "3px" }}>This is what drives the Propwire search. Use ZIPs for neighborhoods (Arcadia = 85018, 85008).</div>
      </div>

      {/* Property type + price */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <div>
          <span style={label}>Property Types</span>
          <input name="propertyTypes" placeholder="SFR, Condo, Multi" defaultValue={d("propertyTypes")} style={inp} />
        </div>
        <div>
          <span style={label}>Price Min</span>
          <input name="priceMin" type="number" placeholder="400000" defaultValue={d("priceMin")} style={inp} />
        </div>
        <div>
          <span style={label}>Price Max</span>
          <input name="priceMax" type="number" placeholder="800000" defaultValue={d("priceMax")} style={inp} />
        </div>
      </div>

      {/* Beds / Baths / Sqft */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <div>
          <span style={label}>Beds Min</span>
          <input name="bedsMin" type="number" defaultValue={d("bedsMin")} style={inp} />
        </div>
        <div>
          <span style={label}>Beds Max</span>
          <input name="bedsMax" type="number" defaultValue={d("bedsMax")} style={inp} />
        </div>
        <div>
          <span style={label}>Sqft Min</span>
          <input name="sqftMin" type="number" defaultValue={d("sqftMin")} style={inp} />
        </div>
        <div>
          <span style={label}>Sqft Max</span>
          <input name="sqftMax" type="number" defaultValue={d("sqftMax")} style={inp} />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "8px" }}>
        <button type="submit" style={{
          padding: "10px 24px", background: "#111110", color: "#ffffff",
          border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.3px",
        }}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
