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

  const templates = await prisma.agreementTemplate.findMany();
  const byType = Object.fromEntries(templates.map((t) => [t.type, t]));

  const filtered = TEMPLATE_TYPES.filter((t) => {
    if (typeFilter && t.type !== typeFilter) return false;
    if (q && !t.name.toLowerCase().includes(q.toLowerCase()) && !t.description.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const hasFilter = !!(typeFilter || q);

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: "236px", background: "#1C1C1B", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", flexShrink: 0, paddingBottom: "24px" }}>

        {/* New Agreement CTA */}
        <div style={{ padding: "16px 14px 12px" }}>
          <Link href="/admin/agreements/new" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#B8962E", color: "#ffffff", padding: "11px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none", letterSpacing: "0.3px" }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            New Agreement
          </Link>
        </div>

        {/* Template types */}
        <div style={{ padding: "8px 10px 0" }}>
          <div style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "1.8px", textTransform: "uppercase", padding: "0 8px", marginBottom: "4px" }}>TEMPLATES</div>

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
        <div style={{ margin: "20px 14px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }} />
        <div style={{ padding: "12px 10px 0" }}>
          <Link href="/admin/agreements" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "6px", textDecoration: "none", color: "rgba(255,255,255,0.35)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>
            <span style={{ fontSize: "12.5px" }}>Agreements</span>
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, background: "#f5f4f0", display: "flex", flexDirection: "column" }}>

        {/* Header + search */}
        <div style={{ padding: "28px 32px 0", borderBottom: "1px solid #e8e7e2", background: "#ffffff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div style={{ fontFamily: "var(--font-display), serif", fontSize: "28px", color: "#111110", letterSpacing: "2px" }}>
              MY TEMPLATES
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
        <div style={{ flex: 1, padding: "24px 32px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "12px", overflow: "hidden" }}>

            {/* Column headers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr 110px 150px 180px", padding: "10px 24px", background: "#f5f4f0", borderBottom: "1px solid #e8e7e2" }}>
              {["Name", "Description", "Status", "Last Updated", ""].map((h) => (
                <div key={h} style={{ fontSize: "9.5px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>{h}</div>
              ))}
            </div>

            {filtered.map(({ type, name, description, icon }, i) => {
              const existing = byType[type];
              const hasPdf = !!existing?.pdfUrl;
              const updatedAt = existing?.updatedAt;
              const upsertWithType = upsertTemplate.bind(null, type);

              return (
                <div key={type} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f0efeb" : "none" }}>
                  {/* Main row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr 110px 150px 180px", padding: "18px 24px", alignItems: "center", background: "#ffffff" }}>
                    {/* Name */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ color: "#8a8a84" }}>{icon}</span>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#111110" }}>{name}</span>
                    </div>

                    {/* Description */}
                    <div style={{ fontSize: "12px", color: "#5a5a54", paddingRight: "16px", lineHeight: 1.5 }}>{description}</div>

                    {/* Status */}
                    <div>
                      {hasPdf ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, background: "#eaf6f0", color: "#3a7a50", border: "1px solid #b8dfc8" }}>
                          <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#3a7a50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          Ready
                        </span>
                      ) : (
                        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, background: "#f0efeb", color: "#8a8a84", border: "1px solid #d0cfc8" }}>
                          No PDF
                        </span>
                      )}
                    </div>

                    {/* Last updated */}
                    <div style={{ fontSize: "11.5px", color: "#8a8a84" }}>
                      {updatedAt
                        ? new Date(updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "—"}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "flex-end" }}>
                      {hasPdf && (
                        <a href={existing!.pdfUrl!} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#5a5a54", textDecoration: "none", padding: "6px 12px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", whiteSpace: "nowrap" }}>
                          View PDF
                        </a>
                      )}
                      <Link href={`/admin/agreements/new?template=${type}`} style={{ fontSize: "12px", fontWeight: 600, color: "#ffffff", textDecoration: "none", padding: "6px 16px", borderRadius: "6px", background: "#111110", whiteSpace: "nowrap" }}>
                        Use
                      </Link>
                      <Link href={`/admin/templates/${type}`} style={{ fontSize: "12px", color: "#5a5a54", textDecoration: "none", padding: "6px 12px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", whiteSpace: "nowrap" }}>
                        Edit
                      </Link>
                    </div>
                  </div>

                  {/* Upload form — collapsed under each row */}
                  <form action={upsertWithType} style={{ padding: "0 24px 16px", display: "flex", gap: "12px", alignItems: "flex-end", background: "#fafaf8", borderTop: "1px solid #f0efeb" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "10px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px", display: "block", fontWeight: 600, paddingTop: "12px" }}>
                        {hasPdf ? "Replace PDF" : "Upload PDF"}
                      </label>
                      <input name="pdfFile" type="file" accept="application/pdf" style={{ width: "100%", padding: "7px 10px", fontSize: "12px", color: "#111110", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "6px", outline: "none", fontFamily: "inherit" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "10px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px", display: "block", fontWeight: 600, paddingTop: "12px" }}>
                        Notes (optional)
                      </label>
                      <input name="description" defaultValue={existing?.description ?? ""} placeholder="Internal notes…" style={{ width: "100%", padding: "7px 10px", fontSize: "12px", color: "#111110", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "6px", outline: "none", fontFamily: "inherit" }} />
                    </div>
                    <button type="submit" style={{ padding: "8px 18px", background: "#B8962E", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>
                      Save
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
