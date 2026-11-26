"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  hasPdf: boolean;
  fieldCount: number;
  pdfUrl: string | null;
  currentDescription: string;
  updatedAt: Date | null;
  upsertAction: (formData: FormData) => Promise<void>;
  isLast: boolean;
};

export default function TemplateRow({
  type, name, description, icon, hasPdf, fieldCount, pdfUrl, currentDescription, updatedAt, upsertAction, isLast,
}: Props) {
  const [open, setOpen] = useState(false);
  const ready = hasPdf && fieldCount > 0;

  return (
    <div style={{ borderBottom: isLast ? "none" : "1px solid #f0efeb" }}>
      {/* Main row */}
      <div className="admin-workspace-table-row template-main-row" style={{ display: "grid", gridTemplateColumns: "1.4fr 1.8fr 110px 1fr", padding: "16px 24px", alignItems: "center", background: "#ffffff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#6b6b66" }}>{icon}</span>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a1a" }}>{name}</div>
            {updatedAt && (
              <div style={{ fontSize: "10.5px", color: "#aaa", marginTop: "2px" }}>
                Updated {new Date(updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            )}
          </div>
        </div>

        <div style={{ fontSize: "12px", color: "#4a4a4a", paddingRight: "16px", lineHeight: 1.5 }}>{description}</div>

        <div>
          {ready ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, background: "#eaf6f0", color: "#3a7a50", border: "1px solid #b8dfc8" }}>
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#3a7a50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Ready
            </span>
          ) : hasPdf ? (
            <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, background: "#fff7e6", color: "#946200", border: "1px solid #ead18a" }}>
              Needs Fields
            </span>
          ) : (
            <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, background: "#f0efeb", color: "#6b6b66", border: "1px solid #d9d6cf" }}>
              No PDF
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "flex-end" }}>
          {ready ? (
            <Link href={`/admin/agreements/new?template=${type}`} style={{ fontSize: "12px", fontWeight: 600, color: "#ffffff", textDecoration: "none", padding: "6px 14px", borderRadius: "6px", background: "#1a1a1a", whiteSpace: "nowrap" }}>
              Use
            </Link>
          ) : null}
          <Link href={`/admin/agreements/templates/${type}`} style={{ fontSize: "12px", color: "#4a4a4a", textDecoration: "none", padding: "6px 12px", border: "1px solid #d9d6cf", borderRadius: "6px", background: "#ffffff", whiteSpace: "nowrap" }}>
            {hasPdf && fieldCount === 0 ? "Map Fields" : "Edit"}
          </Link>
          <button
            onClick={() => setOpen(o => !o)}
            title={hasPdf ? "View / Replace PDF" : "Upload PDF"}
            style={{ fontSize: "12px", color: open ? "#B8962E" : "#4a4a4a", background: open ? "rgba(184,150,46,0.08)" : "transparent", border: `1px solid ${open ? "rgba(184,150,46,0.35)" : "#d9d6cf"}`, borderRadius: "6px", padding: "6px 10px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "5px" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            PDF
          </button>
        </div>
      </div>

      {/* Collapsible upload form */}
      {open && (
        <form action={upsertAction} className="admin-workspace-table-row template-upload-row" style={{ padding: "12px 24px 16px", display: "flex", gap: "12px", alignItems: "flex-end", background: "#fafaf8", borderTop: "1px solid #f0efeb", flexWrap: "wrap" }}>
          {hasPdf && (
            <a href={pdfUrl!} target="_blank" rel="noopener noreferrer" style={{ width: "100%", marginBottom: "8px", fontSize: "11.5px", color: "#3a7a50", textDecoration: "underline" }}>
              View current PDF ↗
            </a>
          )}
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "10px", color: "#6b6b66", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px", display: "block", fontWeight: 600 }}>
              {hasPdf ? "Replace PDF" : "Upload PDF"}
            </label>
            <input name="pdfFile" type="file" accept="application/pdf" required style={{ width: "100%", padding: "7px 10px", fontSize: "12px", color: "#1a1a1a", background: "#ffffff", border: "1px solid #d9d6cf", borderRadius: "6px", outline: "none", fontFamily: "inherit" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "10px", color: "#6b6b66", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px", display: "block", fontWeight: 600 }}>
              Notes (optional)
            </label>
            <input name="description" defaultValue={currentDescription} placeholder="Internal notes…" style={{ width: "100%", padding: "7px 10px", fontSize: "12px", color: "#1a1a1a", background: "#ffffff", border: "1px solid #d9d6cf", borderRadius: "6px", outline: "none", fontFamily: "inherit" }} />
          </div>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button type="submit" style={{ padding: "8px 18px", background: "#B8962E", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              Save
            </button>
            <button type="button" onClick={() => setOpen(false)} style={{ padding: "8px 14px", background: "transparent", color: "#6b6b66", border: "1px solid #d9d6cf", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
