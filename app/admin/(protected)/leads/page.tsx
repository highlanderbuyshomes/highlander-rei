import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Leads | Highlander REI" };

const SOURCE_LABEL: Record<string, string> = {
  "highlander-rei":        "highlanderrei.com",
  "highlander-buys-homes": "highlanderbuyshomes.com",
};

const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  cash_offer: { bg: "rgba(26,86,219,0.08)",  color: "#1a56db", border: "rgba(26,86,219,0.25)" },
  investor:   { bg: "rgba(184,150,46,0.1)",  color: "#8a6a10", border: "rgba(184,150,46,0.3)" },
  buyer:      { bg: "#eaf6f0",               color: "#3a7a50", border: "#b8dfc8" },
  agent:      { bg: "rgba(107,70,193,0.08)", color: "#6b46c1", border: "rgba(107,70,193,0.25)" },
  sell:       { bg: "#f0efeb",               color: "#5a5a54", border: "#d0cfc8" },
};

function TypeBadge({ type }: { type: string | null }) {
  if (!type) return null;
  const c = TYPE_COLORS[type] ?? TYPE_COLORS.sell;
  return (
    <span style={{ display: "inline-block", padding: "2px 9px", borderRadius: "20px", fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.4px", background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {type.replace("_", " ")}
    </span>
  );
}

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ q?: string; source?: string }> }) {
  await requireAdmin();
  const { q, source } = await searchParams;

  const leads = await prisma.lead.findMany({
    where: {
      ...(source ? { source } : {}),
      ...(q ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { message: { contains: q, mode: "insensitive" } },
        ],
      } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const inp: React.CSSProperties = { padding: "8px 14px", fontSize: "13px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", color: "#111110", fontFamily: "inherit", outline: "none" };

  return (
    <div style={{ maxWidth: "1100px", padding: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ fontFamily: "var(--font-display), serif", fontSize: "36px", color: "#111110", letterSpacing: "2px", lineHeight: 1 }}>LEADS</div>
          <div style={{ fontSize: "12px", color: "#8a8a84", marginTop: "4px" }}>From highlanderrei.com &amp; highlanderbuyshomes.com</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#8a8a84" }}>
          <span style={{ fontWeight: 600, color: "#111110" }}>{leads.length}</span> leads
        </div>
      </div>

      {/* Filters */}
      <form method="GET" style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        <select name="source" defaultValue={source ?? ""} style={{ ...inp, minWidth: "200px" }}>
          <option value="">All sources</option>
          <option value="highlander-rei">highlanderrei.com</option>
          <option value="highlander-buys-homes">highlanderbuyshomes.com</option>
        </select>
        <input name="q" defaultValue={q ?? ""} placeholder="Search name, email…" style={{ ...inp, width: "240px" }} />
        <button type="submit" style={{ ...inp, cursor: "pointer", background: "#111110", color: "#ffffff", border: "1px solid #111110" }}>Search</button>
        {(q || source) && (
          <a href="/admin/leads" style={{ ...inp, color: "#8a8a84", textDecoration: "none", display: "flex", alignItems: "center" }}>✕ Clear</a>
        )}
      </form>

      {leads.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "60px 40px", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>📬</div>
          <div style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>NO LEADS YET</div>
          <div style={{ fontSize: "13px", color: "#8a8a84" }}>Leads from your forms will appear here.</div>
        </div>
      ) : (
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.6fr 1fr 100px 100px 120px", padding: "10px 20px", background: "#f5f4f0", borderBottom: "1px solid #e8e7e2" }}>
            {["Name", "Email", "Phone", "Type", "Source", "Submitted"].map((h) => (
              <div key={h} style={{ fontSize: "10px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{h}</div>
            ))}
          </div>
          {leads.map((lead, i) => (
            <div key={lead.id} style={{ display: "grid", gridTemplateColumns: "1.8fr 1.6fr 1fr 100px 100px 120px", padding: "13px 20px", borderBottom: i < leads.length - 1 ? "1px solid #e8e7e2" : "none", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "13px", color: "#111110", fontWeight: 500 }}>{lead.name}</div>
                {lead.message && <div style={{ fontSize: "11px", color: "#8a8a84", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "240px" }}>{lead.message}</div>}
              </div>
              <div>
                <a href={`mailto:${lead.email}`} style={{ fontSize: "12.5px", color: "#1a56db", textDecoration: "none" }}>{lead.email}</a>
              </div>
              <div style={{ fontSize: "12.5px", color: "#5a5a54" }}>{lead.phone ?? "—"}</div>
              <div><TypeBadge type={lead.type} /></div>
              <div style={{ fontSize: "11px", color: "#8a8a84" }}>{SOURCE_LABEL[lead.source ?? ""] ?? (lead.source ?? "—")}</div>
              <div style={{ fontSize: "11.5px", color: "#8a8a84" }}>
                {new Date(lead.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
