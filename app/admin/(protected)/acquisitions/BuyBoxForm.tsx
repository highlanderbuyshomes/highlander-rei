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
  areas: { id: string; name: string }[];
  contacts: { id: string; name: string }[];
  action: (formData: FormData) => Promise<void>;
  defaults?: Record<string, unknown>;
  submitLabel?: string;
}

export default function BuyBoxForm({ areas, contacts, action, defaults = {}, submitLabel = "Create Buy Box" }: Props) {
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
      {/* Name + Area + Buyer Contact */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <div>
          <span style={label}>Name</span>
          <input name="name" required placeholder="e.g. Arcadia SFR under 800K" defaultValue={d("name")} style={inp} />
        </div>
        <div>
          <span style={label}>Area</span>
          <select name="areaId" defaultValue={d("areaId")} style={inp}>
            <option value="">No area</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <span style={label}>Buyer Contact</span>
          <select name="buyerName" defaultValue={d("buyerName")} style={inp}>
            <option value="">No buyer assigned</option>
            {contacts.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Location */}
      <div style={row2}>
        <div>
          <span style={label}>ZIP Codes (comma-separated)</span>
          <input name="zips" placeholder="85251, 85253, 85018" defaultValue={d("zips")} style={inp} />
        </div>
        <div>
          <span style={label}>Subdivisions</span>
          <input name="subdivisions" placeholder="Arcadia, McCormick Ranch" defaultValue={d("subdivisions")} style={inp} />
        </div>
      </div>

      {/* Property type + price */}
      <div style={row2}>
        <div>
          <span style={label}>Property Types</span>
          <input name="propertyTypes" placeholder="SFR, Townhouse" defaultValue={d("propertyTypes")} style={inp} />
        </div>
        <div>
          <span style={label}>MLS Area IDs</span>
          <input name="mlsAreaIds" placeholder="ARC, SCT" defaultValue={d("mlsAreaIds")} style={inp} />
        </div>
      </div>

      <div style={row2}>
        <div>
          <span style={label}>Price Min</span>
          <input name="priceMin" type="number" placeholder="400000" defaultValue={d("priceMin")} style={inp} />
        </div>
        <div>
          <span style={label}>Price Max</span>
          <input name="priceMax" type="number" placeholder="800000" defaultValue={d("priceMax")} style={inp} />
        </div>
      </div>

      {/* Beds / Baths */}
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
          <span style={label}>Baths Min</span>
          <input name="bathsMin" type="number" step="0.5" defaultValue={d("bathsMin")} style={inp} />
        </div>
        <div>
          <span style={label}>Baths Max</span>
          <input name="bathsMax" type="number" step="0.5" defaultValue={d("bathsMax")} style={inp} />
        </div>
      </div>

      {/* Sqft / Lot */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <div>
          <span style={label}>Sqft Min</span>
          <input name="sqftMin" type="number" defaultValue={d("sqftMin")} style={inp} />
        </div>
        <div>
          <span style={label}>Sqft Max</span>
          <input name="sqftMax" type="number" defaultValue={d("sqftMax")} style={inp} />
        </div>
        <div>
          <span style={label}>Lot Sqft Min</span>
          <input name="lotSqftMin" type="number" defaultValue={d("lotSqftMin")} style={inp} />
        </div>
        <div>
          <span style={label}>Lot Sqft Max</span>
          <input name="lotSqftMax" type="number" defaultValue={d("lotSqftMax")} style={inp} />
        </div>
      </div>

      {/* Year / Ownership / Equity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <div>
          <span style={label}>Year Built Min</span>
          <input name="yearBuiltMin" type="number" placeholder="1960" defaultValue={d("yearBuiltMin")} style={inp} />
        </div>
        <div>
          <span style={label}>Year Built Max</span>
          <input name="yearBuiltMax" type="number" placeholder="2020" defaultValue={d("yearBuiltMax")} style={inp} />
        </div>
        <div>
          <span style={label}>Ownership Min (mo)</span>
          <input name="ownershipDurationMin" type="number" placeholder="24" defaultValue={d("ownershipDurationMin")} style={inp} />
        </div>
        <div>
          <span style={label}>Min Equity %</span>
          <input name="minEquityPct" type="number" step="0.1" placeholder="30" defaultValue={d("minEquityPct")} style={inp} />
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
