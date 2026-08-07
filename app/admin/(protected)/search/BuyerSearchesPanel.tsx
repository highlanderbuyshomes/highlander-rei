"use client";

import { useState } from "react";
import { createArea, toggleArea, deleteArea } from "./actions";

export type SearchArea = {
  id: string;
  name: string;
  buyerContact: string | null;
  description: string | null;
  active: boolean;
  mapColor: string | null;
  polygon: unknown;
};

function ActiveDot({ id, active, action }: { id: string; active: boolean; action: (id: string) => Promise<void> }) {
  const bound = action.bind(null, id);
  return (
    <form action={bound} onClick={(e) => e.stopPropagation()} style={{ display: "inline" }}>
      <button type="submit" title={active ? "Active" : "Inactive"} style={{ width: "8px", height: "8px", borderRadius: "50%", border: "none", cursor: "pointer", background: active ? "#3a7a50" : "#d0cfc8", padding: 0 }} />
    </form>
  );
}

function DeleteX({ id, action }: { id: string; action: (id: string) => Promise<void> }) {
  const bound = action.bind(null, id);
  return (
    <form action={bound} onClick={(e) => e.stopPropagation()} style={{ display: "inline" }}>
      <button type="submit" title="Delete" style={{ fontSize: "13px", color: "#c0392b", background: "transparent", border: "none", cursor: "pointer", padding: "0 2px", fontFamily: "inherit" }}>×</button>
    </form>
  );
}

export default function BuyerSearchesPanel({
  searches,
  selectedId,
  onSelect,
}: {
  searches: SearchArea[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "12px", padding: "14px", marginBottom: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#111110" }}>Buyer Searches</span>
        <button type="button" onClick={() => setShowForm((v) => !v)} style={{ fontSize: "11px", fontWeight: 600, color: "#1a56db", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          {showForm ? "Cancel" : "+ New"}
        </button>
      </div>

      {showForm && (
        <form action={createArea} style={{ marginBottom: "12px", padding: "10px", background: "#f8f7f4", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <input name="name" required placeholder="Search name" style={{ padding: "7px 9px", fontSize: "12px", border: "1px solid #d0cfc8", borderRadius: "6px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          <input name="buyerContact" placeholder="Buyer contact (optional)" style={{ padding: "7px 9px", fontSize: "12px", border: "1px solid #d0cfc8", borderRadius: "6px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          <textarea name="description" rows={2} placeholder="Description (optional)" style={{ padding: "7px 9px", fontSize: "12px", border: "1px solid #d0cfc8", borderRadius: "6px", fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          <button type="submit" style={{ padding: "7px", background: "#111110", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Create</button>
        </form>
      )}

      {searches.length === 0 ? (
        <div style={{ fontSize: "12px", color: "#8a8a84", padding: "8px 0" }}>No buyer searches yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {searches.map((s) => {
            const active = s.id === selectedId;
            return (
              <div
                key={s.id}
                onClick={() => onSelect(s.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "8px", cursor: "pointer",
                  background: active ? "#f5f4f0" : "transparent", border: active ? "1px solid #d0cfc8" : "1px solid transparent",
                }}
              >
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: s.mapColor ?? "#8a8a84", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#111110", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                  {s.buyerContact && <div style={{ fontSize: "10.5px", color: "#8a8a84" }}>{s.buyerContact}</div>}
                </div>
                <ActiveDot id={s.id} active={s.active} action={toggleArea} />
                <DeleteX id={s.id} action={deleteArea} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
