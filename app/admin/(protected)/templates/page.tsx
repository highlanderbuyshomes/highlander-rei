import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";
import { upsertTemplate } from "./actions";

export const metadata: Metadata = { title: "Templates | Highlander REI" };

const TEMPLATE_TYPES = [
  {
    type: "cash_offer",
    name: "Cash Offer",
    icon: "🏠",
    description: "Standard purchase agreement for cash offer transactions.",
  },
  {
    type: "flex_equity",
    name: "Flex Equity Program",
    icon: "📊",
    description: "Flexible equity agreement for seller finance and creative deals.",
  },
  {
    type: "listing",
    name: "Listing Agreement",
    icon: "📋",
    description: "Listing agreement for working with real estate agents and brokers.",
  },
];

const inp: React.CSSProperties = {
  width: "100%", padding: "9px 12px", fontSize: "13px", color: "#111110",
  background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "6px",
  outline: "none", fontFamily: "inherit",
};
const lbl: React.CSSProperties = {
  fontSize: "11px", color: "#5a5a54", textTransform: "uppercase",
  letterSpacing: "0.8px", marginBottom: "5px", display: "block", fontWeight: 500,
};

export default async function TemplatesPage() {
  await requireAdmin();

  const templates = await prisma.agreementTemplate.findMany();
  const byType = Object.fromEntries(templates.map((t) => [t.type, t]));

  return (
    <div style={{ maxWidth: "1100px" }}>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontFamily: "var(--font-display), serif", fontSize: "36px", color: "#111110", letterSpacing: "2px", lineHeight: 1 }}>TEMPLATES</div>
        <div style={{ fontSize: "12px", color: "#8a8a84", marginTop: "4px" }}>Upload a master PDF for each agreement type. Use it as the base when creating new agreements.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
        {TEMPLATE_TYPES.map(({ type, name, icon, description }) => {
          const existing = byType[type];
          const upsertWithType = upsertTemplate.bind(null, type);

          return (
            <div key={type} style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", overflow: "hidden" }}>
              {/* Card header */}
              <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #e8e7e2" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "22px" }}>{icon}</span>
                  <span style={{ fontFamily: "var(--font-display), serif", fontSize: "16px", letterSpacing: "1.5px", color: "#111110" }}>
                    {name.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#8a8a84", lineHeight: 1.5 }}>{description}</div>
              </div>

              {/* Current template PDF */}
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #e8e7e2", background: "#fafaf8" }}>
                <div style={{ fontSize: "10px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", fontWeight: 600 }}>Current Template</div>
                {existing?.pdfUrl ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3a7a50" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <span style={{ fontSize: "12px", color: "#3a7a50", fontWeight: 500 }}>PDF uploaded</span>
                    </div>
                    <a href={existing.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11.5px", color: "#5a5a54", textDecoration: "none", padding: "4px 10px", border: "1px solid #d0cfc8", borderRadius: "5px", background: "#ffffff" }}>
                      View →
                    </a>
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: "#8a8a84" }}>No template uploaded yet</div>
                )}
              </div>

              {/* Upload form */}
              <form action={upsertWithType} style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={lbl}>{existing?.pdfUrl ? "Replace PDF" : "Upload PDF"}</label>
                  <input name="pdfFile" type="file" accept="application/pdf" style={{ ...inp, padding: "7px 10px" }} />
                </div>
                <div>
                  <label style={lbl}>Description (optional)</label>
                  <input name="description" defaultValue={existing?.description ?? ""} placeholder="Internal notes about this template…" style={inp} />
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", paddingTop: "4px" }}>
                  <button type="submit" style={{ padding: "8px 18px", background: "#111110", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    Save
                  </button>
                  <Link href={`/admin/agreements/new?template=${type}`} style={{ padding: "8px 16px", border: "1px solid #d0cfc8", borderRadius: "6px", fontSize: "12.5px", color: "#111110", textDecoration: "none", fontWeight: 500 }}>
                    + New Agreement
                  </Link>
                </div>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
