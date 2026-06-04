import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Agreements | Highlander REI" };

const TYPE_LABELS: Record<string, string> = {
  cash_offer:  "Cash Offer",
  flex_equity: "Flex Equity",
  listing:     "Listing Agreement",
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  draft:     { label: "Draft",     bg: "#f0efeb",                color: "#5a5a54",       border: "#d0cfc8" },
  sent:      { label: "Sent",      bg: "rgba(26,86,219,0.08)",   color: "#1a56db",       border: "rgba(26,86,219,0.25)" },
  signed:    { label: "Signed",    bg: "rgba(107,70,193,0.08)",  color: "#6b46c1",       border: "rgba(107,70,193,0.25)" },
  completed: { label: "Completed", bg: "#eaf6f0",                color: "#3a7a50",       border: "#b8dfc8" },
  void:      { label: "Void",      bg: "rgba(192,57,43,0.06)",   color: "#c0392b",       border: "rgba(192,57,43,0.2)" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "11px",
      fontWeight: 600, letterSpacing: "0.5px", background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const icon = type === "cash_offer" ? "🏠" : type === "flex_equity" ? "📊" : "📋";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#111110", fontWeight: 500 }}>
      {icon} {TYPE_LABELS[type] ?? type}
    </span>
  );
}

export default async function AgreementsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdmin();
  const { status: filterStatus, q } = await searchParams;

  const agreements = await prisma.agreement.findMany({
    where: {
      ...(filterStatus && filterStatus !== "all" ? { status: filterStatus } : {}),
      ...(q ? {
        OR: [
          { address: { contains: q, mode: "insensitive" } },
          { sellers: { contains: q, mode: "insensitive" } },
        ],
      } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const counts = await prisma.agreement.groupBy({
    by: ["status"],
    _count: true,
  });
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count]));
  const total = counts.reduce((s, c) => s + c._count, 0);

  const inp: React.CSSProperties = {
    padding: "8px 14px", fontSize: "13px", border: "1px solid #d0cfc8",
    borderRadius: "6px", background: "#ffffff", color: "#111110",
    fontFamily: "inherit", outline: "none",
  };

  const TAB_FILTERS = [
    { key: "all",       label: "All",       count: total },
    { key: "draft",     label: "Draft",     count: byStatus.draft ?? 0 },
    { key: "sent",      label: "Sent",      count: byStatus.sent ?? 0 },
    { key: "signed",    label: "Signed",    count: byStatus.signed ?? 0 },
    { key: "completed", label: "Completed", count: byStatus.completed ?? 0 },
  ];

  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ fontFamily: "var(--font-display), serif", fontSize: "36px", color: "#111110", letterSpacing: "2px", lineHeight: 1 }}>AGREEMENTS</div>
          <div style={{ fontSize: "12px", color: "#8a8a84", marginTop: "4px" }}>Cash Offers · Flex Equity · Listing Agreements</div>
        </div>
        <Link href="/admin/agreements/new" style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          background: "#111110", color: "#ffffff",
          padding: "10px 20px", borderRadius: "6px", fontSize: "13px",
          fontWeight: 600, textDecoration: "none", letterSpacing: "0.3px",
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          New Agreement
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "4px", background: "#eceae5", borderRadius: "6px", padding: "3px", border: "1px solid #d0cfc8" }}>
          {TAB_FILTERS.map(({ key, label, count }) => {
            const active = (filterStatus ?? "all") === key;
            return (
              <Link key={key} href={`/admin/agreements?status=${key}${q ? `&q=${q}` : ""}`} style={{
                padding: "6px 14px", borderRadius: "4px", fontSize: "12px", fontWeight: active ? 600 : 400,
                color: active ? "#111110" : "#5a5a54", textDecoration: "none",
                background: active ? "#ffffff" : "transparent",
                boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                display: "flex", alignItems: "center", gap: "5px",
              }}>
                {label}
                {count > 0 && (
                  <span style={{ fontSize: "10px", background: active ? "#111110" : "#d0cfc8", color: active ? "#ffffff" : "#5a5a54", borderRadius: "20px", padding: "1px 6px", fontWeight: 600 }}>
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <form method="GET" action="/admin/agreements" style={{ display: "flex", gap: "8px" }}>
          {filterStatus && <input type="hidden" name="status" value={filterStatus} />}
          <input name="q" defaultValue={q ?? ""} placeholder="Search address or seller…" style={{ ...inp, width: "240px" }} />
          <button type="submit" style={{ ...inp, cursor: "pointer", background: "#111110", color: "#ffffff", border: "1px solid #111110" }}>
            Search
          </button>
          {q && (
            <Link href={`/admin/agreements${filterStatus ? `?status=${filterStatus}` : ""}`} style={{ ...inp, color: "#8a8a84", display: "flex", alignItems: "center", textDecoration: "none" }}>
              ✕ Clear
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      {agreements.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "60px 40px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>📄</div>
          <div style={{ fontFamily: "var(--font-display), serif", fontSize: "22px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>NO AGREEMENTS YET</div>
          <div style={{ fontSize: "13px", color: "#8a8a84", marginBottom: "24px" }}>Create your first cash offer, flex equity, or listing agreement.</div>
          <Link href="/admin/agreements/new" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#111110", color: "#ffffff", padding: "10px 20px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
            + New Agreement
          </Link>
        </div>
      ) : (
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr 100px 120px 80px", gap: "0", borderBottom: "1px solid #e8e7e2", padding: "10px 20px", background: "#f5f4f0" }}>
            {["Agreement", "Address", "Sellers", "Status", "Created", ""].map((h) => (
              <div key={h} style={{ fontSize: "10px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{h}</div>
            ))}
          </div>
          {agreements.map((a, i) => (
            <div key={a.id} style={{
              display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr 100px 120px 80px",
              gap: "0", padding: "14px 20px", borderBottom: i < agreements.length - 1 ? "1px solid #e8e7e2" : "none",
              alignItems: "center",
            }}>
              <div><TypeBadge type={a.type} /></div>
              <div style={{ fontSize: "12.5px", color: "#111110", lineHeight: 1.4 }}>{a.address}</div>
              <div style={{ fontSize: "12px", color: "#5a5a54" }}>{a.sellers}</div>
              <div><StatusBadge status={a.status} /></div>
              <div style={{ fontSize: "11.5px", color: "#8a8a84" }}>
                {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
              <div>
                <Link href={`/admin/agreements/${a.id}`} style={{ fontSize: "12px", color: "#111110", fontWeight: 500, textDecoration: "none", padding: "5px 12px", border: "1px solid #d0cfc8", borderRadius: "6px", display: "inline-block" }}>
                  Open →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
