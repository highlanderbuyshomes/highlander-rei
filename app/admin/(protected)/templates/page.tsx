import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";
import { upsertTemplate } from "./actions";
import TemplateRow from "./TemplateRow";

export const metadata: Metadata = { title: "Templates | Highlander REI" };

const TEMPLATE_TYPES = [
  {
    type: "cash_offer",
    name: "Cash Offer",
    description: "Standard purchase agreement for cash offer transactions.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    type: "flex_equity",
    name: "Flex Equity Program",
    description: "Flexible equity agreement for seller finance and creative deals.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    type: "aif_novation",
    name: "AIF / Novation Agreement",
    description: "Novation agreement granting the limited Attorney-in-Fact authority used in Flex Equity transactions.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 3h5v5"/>
        <path d="M8 21H3v-5"/>
        <path d="M21 3l-7 7"/>
        <path d="M3 21l7-7"/>
        <path d="M14 3h-4a7 7 0 00-7 7v1"/>
        <path d="M10 21h4a7 7 0 007-7v-1"/>
      </svg>
    ),
  },
  {
    type: "listing",
    name: "Listing Agreement",
    description: "Listing agreement for working with real estate agents and brokers.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
];

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  await requireAdmin();
  const { type: typeFilter, q } = await searchParams;

  const templates = await prisma.agreementTemplate.findMany({
    include: { _count: { select: { fields: true } } },
  });
  const byType = Object.fromEntries(templates.map((t) => [t.type, t]));

  const filtered = TEMPLATE_TYPES.filter((t) => {
    if (typeFilter && t.type !== typeFilter) return false;
    if (q && !t.name.toLowerCase().includes(q.toLowerCase()) && !t.description.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const hasFilter = !!(typeFilter || q);

  return (
    <div className="admin-workspace-shell" style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>

      {/* ── Sidebar ── */}
      <aside className="admin-workspace-sidebar" style={{ width: "236px", background: "#1C1C1B", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", flexShrink: 0, paddingBottom: "24px" }}>

        {/* New Agreement CTA */}
        <div className="admin-workspace-sidebar-section" style={{ padding: "16px 14px 12px" }}>
          <Link href="/admin/agreements/new" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#B8962E", color: "#ffffff", padding: "11px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none", letterSpacing: "0.3px" }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            New Agreement
          </Link>
        </div>

        {/* Template types */}
        <div className="admin-workspace-sidebar-section" style={{ padding: "8px 10px 0" }}>
          <div className="admin-workspace-sidebar-label" style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "1.8px", textTransform: "uppercase", padding: "0 8px", marginBottom: "4px" }}>TEMPLATES</div>

          {/* All */}
          {(() => {
            const active = !typeFilter;
            return (
              <Link href="/admin/templates" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: "6px", marginBottom: "1px", background: active ? "rgba(184,150,46,0.12)" : "transparent", textDecoration: "none", borderLeft: active ? "2px solid #B8962E" : "2px solid transparent", color: active ? "#E8D9A0" : "rgba(255,255,255,0.5)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                  <span style={{ fontSize: "13px", fontWeight: active ? 600 : 400 }}>All Templates</span>
                </div>
                <span style={{ fontSize: "10px", background: active ? "#B8962E" : "rgba(255,255,255,0.08)", color: active ? "#fff" : "rgba(255,255,255,0.4)", borderRadius: "20px", padding: "1px 7px", fontWeight: 600 }}>
                  {TEMPLATE_TYPES.length}
                </span>
              </Link>
            );
          })()}

          {TEMPLATE_TYPES.map(({ type, name, icon }) => {
            const active = typeFilter === type;
            const href = active ? "/admin/templates" : `/admin/templates?type=${type}`;
            return (
              <Link key={type} href={href} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "6px", marginBottom: "1px", background: active ? "rgba(184,150,46,0.12)" : "transparent", textDecoration: "none", borderLeft: active ? "2px solid #B8962E" : "2px solid transparent", color: active ? "#E8D9A0" : "rgba(255,255,255,0.4)" }}>
                <span style={{ opacity: active ? 1 : 0.7 }}>{icon}</span>
                <span style={{ fontSize: "12.5px", fontWeight: active ? 500 : 400 }}>{name}</span>
              </Link>
            );
          })}
        </div>

        {/* Divider + Agreements link */}
        <div className="admin-workspace-sidebar-divider" style={{ margin: "20px 14px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }} />
        <div className="admin-workspace-sidebar-section" style={{ padding: "12px 10px 0" }}>
          <Link href="/admin/agreements" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "6px", textDecoration: "none", color: "rgba(255,255,255,0.35)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>
            <span style={{ fontSize: "12.5px" }}>Agreements</span>
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="admin-workspace-main" style={{ flex: 1, background: "#f5f4f0", display: "flex", flexDirection: "column" }}>

        {/* Header + search */}
        <div className="admin-workspace-header" style={{ padding: "28px 32px 0", borderBottom: "1px solid #e8e7e2", background: "#ffffff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div style={{ fontFamily: "var(--font-display), serif", fontSize: "28px", color: "#111110", letterSpacing: "2px" }}>
              TEMPLATES
            </div>
            <span style={{ fontSize: "12px", color: "#8a8a84" }}>{filtered.length} template{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          <form method="GET" action="/admin/templates" style={{ display: "flex", gap: "8px", paddingBottom: "20px" }}>
            {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
            <div style={{ display: "flex", flex: 1, alignItems: "center", background: "#f5f4f0", border: "1px solid #d0cfc8", borderRadius: "8px", padding: "0 14px", gap: "8px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a8a84" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input name="q" defaultValue={q ?? ""} placeholder="Search templates…" style={{ flex: 1, border: "none", background: "transparent", fontSize: "13px", color: "#111110", outline: "none", padding: "10px 0", fontFamily: "inherit" }} />
            </div>
            <button type="submit" style={{ padding: "0 20px", background: "#111110", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Search</button>
            {hasFilter && (
              <Link href="/admin/templates" style={{ padding: "0 14px", background: "#ffffff", color: "#8a8a84", border: "1px solid #d0cfc8", borderRadius: "8px", fontSize: "12.5px", display: "flex", alignItems: "center", textDecoration: "none" }}>
                ✕ Clear
              </Link>
            )}
          </form>
        </div>

        {/* Template list */}
        <div className="admin-workspace-content" style={{ flex: 1, padding: "24px 32px" }}>
          <div className="admin-workspace-table" style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "12px", overflow: "hidden" }}>

            {/* Column headers */}
            <div className="admin-workspace-table-row" style={{ display: "grid", gridTemplateColumns: "1.4fr 1.8fr 110px 1fr", padding: "10px 24px", background: "#f5f4f0", borderBottom: "1px solid #e8e7e2" }}>
              {["Name", "Description", "Status", ""].map((h) => (
                <div key={h} style={{ fontSize: "9.5px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>{h}</div>
              ))}
            </div>

            {filtered.map(({ type, name, description, icon }, i) => {
              const existing = byType[type];
              const upsertWithType = upsertTemplate.bind(null, type);
              return (
                <TemplateRow
                  key={type}
                  type={type}
                  name={name}
                  description={description}
                  icon={icon}
                  hasPdf={!!existing?.pdfUrl}
                  fieldCount={existing?._count.fields ?? 0}
                  pdfUrl={existing?.pdfUrl ?? null}
                  currentDescription={existing?.description ?? ""}
                  updatedAt={existing?.updatedAt ?? null}
                  upsertAction={upsertWithType}
                  isLast={i === filtered.length - 1}
                />
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
