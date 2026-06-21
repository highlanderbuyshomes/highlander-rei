"use client";

import { useRef, useState } from "react";

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

const AREA_SHORTCUTS: { label: string; value: string }[] = [
  { label: "Arcadia", value: "85018, 85008" },
  { label: "Biltmore", value: "85016" },
  { label: "Scottsdale", value: "Scottsdale, AZ" },
  { label: "Old Town Scottsdale", value: "85251" },
  { label: "N Scottsdale", value: "85255, 85262" },
  { label: "McCormick Ranch", value: "85258" },
  { label: "Cactus Corridor", value: "85254" },
  { label: "Paradise Valley", value: "Paradise Valley, AZ" },
  { label: "PV (85253)", value: "85253" },
  { label: "Tempe", value: "Tempe, AZ" },
  { label: "Mesa", value: "Mesa, AZ" },
  { label: "Chandler", value: "Chandler, AZ" },
];

interface Props {
  buyerSearches: { id: string; name: string; buyerContact: string | null }[];
  action: (formData: FormData) => Promise<void>;
  defaults?: Record<string, unknown>;
  submitLabel?: string;
}

export default function BuyBoxForm({ buyerSearches, action, defaults = {}, submitLabel = "Create" }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [locations, setLocations] = useState(() => {
    const v = defaults.zips;
    if (Array.isArray(v)) return v.join(", ");
    return v != null ? String(v) : "";
  });

  const d = (key: string, fallback = "") => {
    const v = defaults[key];
    if (Array.isArray(v)) return v.join(", ");
    return v != null ? String(v) : fallback;
  };

  function addLocation(value: string) {
    const current = locations.split(",").map((s) => s.trim()).filter(Boolean);
    const adding = value.split(",").map((s) => s.trim()).filter(Boolean);
    const merged = [...new Set([...current, ...adding])];
    setLocations(merged.join(", "));
  }

  async function handleSubmit(formData: FormData) {
    await action(formData);
    formRef.current?.reset();
    setLocations("");
  }

  return (
    <form ref={formRef} action={handleSubmit}>
      {/* Name + Buyer Search link */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
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

      {/* Locations — areas + ZIPs */}
      <div style={{ marginBottom: "12px" }}>
        <span style={label}>Target Locations</span>
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "8px" }}>
          {AREA_SHORTCUTS.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => addLocation(a.value)}
              style={{
                padding: "3px 10px", fontSize: "10.5px", fontWeight: 500,
                borderRadius: "20px", cursor: "pointer", fontFamily: "inherit",
                background: locations.includes(a.value) ? "#111110" : "#f5f4f0",
                color: locations.includes(a.value) ? "#ffffff" : "#5a5a54",
                border: locations.includes(a.value) ? "1px solid #111110" : "1px solid #e8e7e2",
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
        <input
          name="zips"
          value={locations}
          onChange={(e) => setLocations(e.target.value)}
          placeholder="ZIP codes, cities, or areas — e.g. 85018, Scottsdale, AZ, 85253"
          style={inp}
        />
        <div style={{ fontSize: "10px", color: "#b0b0a8", marginTop: "3px" }}>Click areas above to add them, or type ZIPs and city names directly. Comma-separated.</div>
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

      {/* Beds / Sqft */}
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
