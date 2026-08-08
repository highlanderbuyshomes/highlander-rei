"use client";

import { useEffect, useState } from "react";
import type { ListingFilters } from "@/lib/filter-listings";
import type { MlsListingStatus } from "@/lib/mock-listings";

type FieldKey = "status" | "price" | "propertyType" | "bedsBaths" | "location" | "sqft" | "lotSize" | "yearBuilt" | "daysOnMarket";

const DEFAULT_FIELDS: FieldKey[] = ["status", "price", "propertyType", "bedsBaths", "location"];
const EXTRA_FIELDS: { key: FieldKey; label: string }[] = [
  { key: "sqft", label: "Sqft" },
  { key: "lotSize", label: "Lot Size" },
  { key: "yearBuilt", label: "Year Built" },
  { key: "daysOnMarket", label: "Days on Market" },
];
const FIELD_LABELS: Record<FieldKey, string> = {
  status: "Status", price: "List Price", propertyType: "Property Type", bedsBaths: "Beds & Baths",
  location: "Location", sqft: "Sqft", lotSize: "Lot Size", yearBuilt: "Year Built", daysOnMarket: "Days on Market",
};
const STATUS_OPTIONS: MlsListingStatus[] = ["Active", "Coming Soon", "Pending", "Closed", "Expired", "Canceled"];
const PROPERTY_TYPE_OPTIONS = ["Single Family", "Condo", "Townhouse"];

const inputStyle: React.CSSProperties = { padding: "6px 8px", fontSize: "12px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", color: "#111110", fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" };

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: "4px 10px", fontSize: "11px", fontWeight: 500, borderRadius: "20px", cursor: "pointer", fontFamily: "inherit",
    background: active ? "#111110" : "#f5f4f0", color: active ? "#ffffff" : "#5a5a54", border: active ? "1px solid #111110" : "1px solid #e8e7e2",
  };
}

export default function FiltersPanel({ resultCount, onChange }: { resultCount: number; onChange: (filters: ListingFilters) => void }) {
  const [activeFields, setActiveFields] = useState<Set<FieldKey>>(new Set(["status"]));
  const [statuses, setStatuses] = useState<MlsListingStatus[]>(["Active", "Coming Soon"]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [bedsMin, setBedsMin] = useState("");
  const [bathsMin, setBathsMin] = useState("");
  const [location, setLocation] = useState("");
  const [sqftMin, setSqftMin] = useState("");
  const [sqftMax, setSqftMax] = useState("");
  const [lotSizeMin, setLotSizeMin] = useState("");
  const [yearBuiltMin, setYearBuiltMin] = useState("");
  const [daysOnMarketMax, setDaysOnMarketMax] = useState("");
  const [showAddField, setShowAddField] = useState(false);

  useEffect(() => {
    const filters: ListingFilters = {};
    if (activeFields.has("status") && statuses.length > 0) filters.statuses = statuses;
    if (activeFields.has("price")) {
      if (priceMin) filters.priceMin = Number(priceMin);
      if (priceMax) filters.priceMax = Number(priceMax);
    }
    if (activeFields.has("propertyType") && propertyTypes.length > 0) filters.propertyTypes = propertyTypes;
    if (activeFields.has("bedsBaths")) {
      if (bedsMin) filters.bedsMin = Number(bedsMin);
      if (bathsMin) filters.bathsMin = Number(bathsMin);
    }
    if (activeFields.has("location") && location) filters.location = location;
    if (activeFields.has("sqft")) {
      if (sqftMin) filters.sqftMin = Number(sqftMin);
      if (sqftMax) filters.sqftMax = Number(sqftMax);
    }
    if (activeFields.has("lotSize") && lotSizeMin) filters.lotSizeMin = Number(lotSizeMin);
    if (activeFields.has("yearBuilt") && yearBuiltMin) filters.yearBuiltMin = Number(yearBuiltMin);
    if (activeFields.has("daysOnMarket") && daysOnMarketMax) filters.daysOnMarketMax = Number(daysOnMarketMax);
    onChange(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFields, statuses, priceMin, priceMax, propertyTypes, bedsMin, bathsMin, location, sqftMin, sqftMax, lotSizeMin, yearBuiltMin, daysOnMarketMax]);

  function toggleField(key: FieldKey) {
    setActiveFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function toggleChip(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function resetAll() {
    setActiveFields(new Set(["status"]));
    setStatuses(["Active", "Coming Soon"]);
    setPriceMin(""); setPriceMax("");
    setPropertyTypes([]);
    setBedsMin(""); setBathsMin("");
    setLocation("");
    setSqftMin(""); setSqftMax("");
    setLotSizeMin(""); setYearBuiltMin(""); setDaysOnMarketMax("");
  }

  const shownFields: FieldKey[] = [...DEFAULT_FIELDS, ...EXTRA_FIELDS.map((f) => f.key).filter((k) => activeFields.has(k))];

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "12px", padding: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#111110" }}>Filters</span>
        <span style={{ fontSize: "11px", color: "#8a8a84" }}>{resultCount} results</span>
      </div>

      {shownFields.map((key) => {
        const active = activeFields.has(key);
        return (
          <div key={key} style={{ borderBottom: "1px solid #f0efeb", padding: "8px 0" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", fontWeight: 600, color: "#111110", cursor: "pointer" }}>
              <input type="checkbox" checked={active} onChange={() => toggleField(key)} />
              {FIELD_LABELS[key]}
            </label>
            {active && key === "status" && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                {STATUS_OPTIONS.map((s) => (
                  <button key={s} type="button" style={chipStyle(statuses.includes(s))} onClick={() => toggleChip(statuses, (v) => setStatuses(v as MlsListingStatus[]), s)}>{s}</button>
                ))}
              </div>
            )}
            {active && key === "price" && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                <input style={inputStyle} placeholder="Min" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} inputMode="numeric" />
                <span style={{ fontSize: "11px", color: "#8a8a84" }}>to</span>
                <input style={inputStyle} placeholder="Max" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} inputMode="numeric" />
              </div>
            )}
            {active && key === "propertyType" && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                {PROPERTY_TYPE_OPTIONS.map((t) => (
                  <button key={t} type="button" style={chipStyle(propertyTypes.includes(t))} onClick={() => toggleChip(propertyTypes, setPropertyTypes, t)}>{t}</button>
                ))}
              </div>
            )}
            {active && key === "bedsBaths" && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                <input style={inputStyle} placeholder="Min beds" value={bedsMin} onChange={(e) => setBedsMin(e.target.value)} inputMode="numeric" />
                <input style={inputStyle} placeholder="Min baths" value={bathsMin} onChange={(e) => setBathsMin(e.target.value)} inputMode="numeric" />
              </div>
            )}
            {active && key === "location" && (
              <input style={{ ...inputStyle, marginTop: "8px" }} placeholder="City or ZIP" value={location} onChange={(e) => setLocation(e.target.value)} />
            )}
            {active && key === "sqft" && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                <input style={inputStyle} placeholder="Min" value={sqftMin} onChange={(e) => setSqftMin(e.target.value)} inputMode="numeric" />
                <span style={{ fontSize: "11px", color: "#8a8a84" }}>to</span>
                <input style={inputStyle} placeholder="Max" value={sqftMax} onChange={(e) => setSqftMax(e.target.value)} inputMode="numeric" />
              </div>
            )}
            {active && key === "lotSize" && (
              <input style={{ ...inputStyle, marginTop: "8px" }} placeholder="Min lot sqft" value={lotSizeMin} onChange={(e) => setLotSizeMin(e.target.value)} inputMode="numeric" />
            )}
            {active && key === "yearBuilt" && (
              <input style={{ ...inputStyle, marginTop: "8px" }} placeholder="Min year" value={yearBuiltMin} onChange={(e) => setYearBuiltMin(e.target.value)} inputMode="numeric" />
            )}
            {active && key === "daysOnMarket" && (
              <input style={{ ...inputStyle, marginTop: "8px" }} placeholder="Max days" value={daysOnMarketMax} onChange={(e) => setDaysOnMarketMax(e.target.value)} inputMode="numeric" />
            )}
          </div>
        );
      })}

      <div style={{ display: "flex", gap: "8px", marginTop: "12px", position: "relative" }}>
        <button type="button" onClick={() => setShowAddField((v) => !v)} style={{ flex: 1, padding: "8px", background: "#111110", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Add a Field</button>
        <button type="button" onClick={resetAll} style={{ flex: 1, padding: "8px", background: "#ffffff", color: "#111110", border: "1px solid #d0cfc8", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Reset Filters</button>
        {showAddField && (
          <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 10, padding: "6px" }}>
            {EXTRA_FIELDS.filter((f) => !activeFields.has(f.key)).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => { toggleField(f.key); setShowAddField(false); }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 10px", fontSize: "12.5px", color: "#111110", background: "transparent", border: "none", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" }}
              >
                {f.label}
              </button>
            ))}
            {EXTRA_FIELDS.every((f) => activeFields.has(f.key)) && (
              <div style={{ padding: "8px 10px", fontSize: "12px", color: "#8a8a84" }}>All fields added</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
