import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = { title: "Agreements | Highlander REI" };

const PAGE_SIZE = 50;

const TYPE_LABELS: Record<string, string> = {
  cash_offer:   "Cash Offer",
  flex_equity:  "Flex Equity",
  listing:      "Listing Agreement",
  aif_novation: "AIF / Novation Agreement",
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  draft:     { label: "Draft",     bg: "#f0efeb",              color: "#5a5a54", border: "#d0cfc8" },
  sent:      { label: "Pending",   bg: "rgba(26,86,219,0.08)", color: "#1a56db", border: "rgba(26,86,219,0.25)" },
  signed:    { label: "Completed", bg: "#eaf6f0",              color: "#3a7a50", border: "#b8dfc8" },
  completed: { label: "Completed", bg: "#eaf6f0",              color: "#3a7a50", border: "#b8dfc8" },
  void:      { label: "Void",      bg: "rgba(192,57,43,0.06)", color: "#c0392b", border: "rgba(192,57,43,0.2)" },
};

type Folder = "all" | "inbox" | "sent" | "completed" | "void";

function folderToWhere(folder: Folder): Prisma.AgreementWhereInput {
  switch (folder) {
    case "inbox":     return { status: "draft" };
    case "sent":      return { status: "sent" };
    case "completed": return { status: { in: ["completed", "signed"] } };
    case "void":      return { status: "void" };
    default:          return {};
  }
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.4px", background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {cfg.label}
    </span>
  );
}

function EmptyState({ folder, hasSearch }: { folder: Folder; hasSearch: boolean }) {
  const messages: Record<Folder, { title: string; sub: string }> = {
    inbox:     { title: "Inbox is empty",          sub: "New agreements you create will appear here before they're sent." },
    sent:      { title: "Nothing pending",          sub: "Agreements sent for signatures will appear here." },
    completed: { title: "No completed agreements",  sub: "Signed and fully executed agreements will appear here." },
    void:      { title: "No voided agreements",     sub: "Voided agreements will appear here." },
    all:       { title: "No agreements yet",        sub: "Create your first agreement from an uploaded and mapped template." },
  };
  const { title, sub } = messages[folder];
  return (
    <div className="agreements-empty-state" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 40px", textAlign: "center", flex: 1 }}>
      <svg width="130" height="155" viewBox="0 0 130 155" fill="none" style={{ marginBottom: "28px" }}>
        <rect x="18" y="8" width="76" height="102" rx="4" fill="#E8D9A0" opacity="0.2"/>
        <rect x="22" y="12" width="76" height="102" rx="4" fill="#fefefe" stroke="#E8D9A0" strokeWidth="1.5"/>
        <path d="M78 12 L98 32 L78 32 Z" fill="#FAF6EC"/>
        <path d="M78 12 L98 32" stroke="#E8D9A0" strokeWidth="1.5"/>
        <path d="M78 12 L78 32 L98 32" stroke="#E8D9A0" strokeWidth="1.5" fill="none"/>
        <rect x="32" y="44" width="38" height="3" rx="1.5" fill="#d0cfc8"/>
        <rect x="32" y="54" width="50" height="2.5" rx="1.25" fill="#e8e7e2"/>
        <rect x="32" y="61" width="44" height="2.5" rx="1.25" fill="#e8e7e2"/>
        <rect x="32" y="68" width="48" height="2.5" rx="1.25" fill="#e8e7e2"/>
        <rect x="32" y="75" width="36" height="2.5" rx="1.25" fill="#e8e7e2"/>
        <rect x="32" y="92" width="50" height="1" rx="0.5" fill="#d0cfc8"/>
        <path d="M34 88 C36 85, 40 91, 44 88 C48 85, 51 90, 55 88" stroke="#B8962E" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        <g transform="translate(82, 70) rotate(-35)">
          <rect x="-4" y="0" width="8" height="28" rx="2" fill="#B8962E"/>
          <polygon points="-4,28 4,28 0,40" fill="#8a6f22"/>
          <rect x="-4" y="0" width="8" height="5" rx="1" fill="#8a6f22"/>
          <rect x="-4" y="5" width="8" height="2" fill="#FAF6EC" opacity="0.4"/>
        </g>
      </svg>
      <div style={{ fontFamily: "var(--font-display), serif", fontSize: "22px", color: "#111110", letterSpacing: "2px", marginBottom: "8px" }}>
        {hasSearch ? "NO RESULTS FOUND" : title.toUpperCase()}
      </div>
      <div style={{ fontSize: "13px", color: "#8a8a84", marginBottom: "28px", maxWidth: "280px", lineHeight: 1.7 }}>
        {hasSearch ? "Try adjusting your search or filters." : sub}
      </div>
      {!hasSearch && (
        <Link className="agreements-empty-new" href="/admin/agreements/new" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#B8962E", color: "#ffffff", padding: "11px 24px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none", letterSpacing: "0.3px" }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          New Agreement
        </Link>
      )}
    </div>
  );
}

const FOLDER_TITLES: Record<Folder, string> = {
  all: "All Agreements", inbox: "Inbox", sent: "Sent", completed: "Completed", void: "Voided",
};

export default async function AgreementsPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string; q?: string; type?: string; page?: string }>;
}) {
  await requireAdmin();
  const { folder: folderParam, q, type: typeFilter, page: pageParam } = await searchParams;
  const folder = (["all", "inbox", "sent", "completed", "void"].includes(folderParam ?? "") ? folderParam : "all") as Folder;
  const currentPage = Math.max(1, Number(pageParam) || 1);

  const baseWhere = folderToWhere(folder);
  const where: Prisma.AgreementWhereInput = {
    ...baseWhere,
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(q ? { OR: [{ address: { contains: q, mode: "insensitive" } }, { sellers: { contains: q, mode: "insensitive" } }] } : {}),
  };

  const [agreements, filteredTotal, counts] = await Promise.all([
    prisma.agreement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, type: true, address: true, sellers: true, status: true, createdAt: true,
        signers: { select: { id: true, signedAt: true, name: true } },
      },
    }),
    prisma.agreement.count({ where }),
    prisma.agreement.groupBy({ by: ["status"], _count: true }),
  ]);

  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count]));
  const total = counts.reduce((s, c) => s + c._count, 0);
  const completedCount = (byStatus.completed ?? 0) + (byStatus.signed ?? 0);
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  const hasSearch = !!(q || typeFilter);

  const folderHref = (f: string) => {
    const p = new URLSearchParams({ folder: f });
    if (q) p.set("q", q);
    if (typeFilter && f === folder) p.set("type", typeFilter);
    return `/admin/agreements?${p.toString()}`;
  };

  const pageHref = (page: number) => {
    const p = new URLSearchParams({ folder });
    if (q) p.set("q", q);
    if (typeFilter) p.set("type", typeFilter);
    if (page > 1) p.set("page", String(page));
    return `/admin/agreements?${p.toString()}`;
  };

  const FOLDERS: { key: string; label: string; count: number; icon: React.ReactNode }[] = [
    {
      key: "all", label: "All", count: total,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    },
    {
      key: "inbox", label: "Inbox", count: byStatus.draft ?? 0,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>,
    },
    {
      key: "sent", label: "Sent", count: byStatus.sent ?? 0,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    },
    {
      key: "completed", label: "Completed", count: completedCount,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    },
    {
      key: "void", label: "Voided", count: byStatus.void ?? 0,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    },
  ];

  const TYPES = [
    { key: "cash_offer",  label: "Cash Offer",       icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { key: "flex_equity", label: "Flex Equity",      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    { key: "aif_novation", label: "AIF / Novation", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5"/><path d="M8 21H3v-5"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg> },
    { key: "listing",     label: "Listing Agreement", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  ];

  return (
    <div className="agreements-shell" style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>

      {/* ── Sidebar ── */}
      <aside className="agreements-sidebar" style={{ width: "236px", background: "#1C1C1B", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", flexShrink: 0, paddingBottom: "24px" }}>

        {/* New Agreement CTA */}
        <div className="agreements-sidebar-section agreements-new-section" style={{ padding: "16px 14px 12px" }}>
          <Link href="/admin/agreements/new" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#B8962E", color: "#ffffff", padding: "11px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none", letterSpacing: "0.3px" }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            New Agreement
          </Link>
        </div>

        {/* Envelopes */}
        <div className="agreements-sidebar-section" style={{ padding: "8px 10px 0" }}>
          <div className="agreements-sidebar-label" style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "1.8px", textTransform: "uppercase", padding: "0 8px", marginBottom: "4px" }}>ENVELOPES</div>
          {FOLDERS.map(({ key, label, count, icon }) => {
            const active = folder === key;
            return (
              <Link key={key} href={folderHref(key)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: "6px", marginBottom: "1px", background: active ? "rgba(184,150,46,0.12)" : "transparent", textDecoration: "none", borderLeft: active ? "2px solid #B8962E" : "2px solid transparent", color: active ? "#E8D9A0" : "rgba(255,255,255,0.5)", transition: "all 0.1s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ opacity: active ? 1 : 0.7 }}>{icon}</span>
                  <span style={{ fontSize: "13px", fontWeight: active ? 600 : 400 }}>{label}</span>
                </div>
                {count > 0 && (
                  <span style={{ fontSize: "10px", background: active ? "#B8962E" : "rgba(255,255,255,0.08)", color: active ? "#fff" : "rgba(255,255,255,0.4)", borderRadius: "20px", padding: "1px 7px", fontWeight: 600 }}>
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Agreement Types */}
        <div className="agreements-sidebar-section" style={{ padding: "20px 10px 0" }}>
          <div className="agreements-sidebar-label" style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "1.8px", textTransform: "uppercase", padding: "0 8px", marginBottom: "4px" }}>AGREEMENT TYPES</div>
          {TYPES.map(({ key, label, icon }) => {
            const active = typeFilter === key;
            const href = active
              ? `/admin/agreements?folder=${folder}${q ? `&q=${q}` : ""}`
              : `/admin/agreements?folder=${folder}&type=${key}${q ? `&q=${q}` : ""}`;
            return (
              <Link key={key} href={href} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "6px", marginBottom: "1px", background: active ? "rgba(184,150,46,0.12)" : "transparent", textDecoration: "none", borderLeft: active ? "2px solid #B8962E" : "2px solid transparent", color: active ? "#E8D9A0" : "rgba(255,255,255,0.4)", transition: "all 0.1s" }}>
                <span style={{ opacity: active ? 1 : 0.7 }}>{icon}</span>
                <span style={{ fontSize: "12.5px", fontWeight: active ? 500 : 400 }}>{label}</span>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="agreements-main" style={{ flex: 1, background: "#f5f4f0", display: "flex", flexDirection: "column" }}>

        {/* Main header + search */}
        <div className="agreements-main-header" style={{ padding: "28px 32px 0", borderBottom: "1px solid #e8e7e2", background: "#ffffff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div style={{ fontFamily: "var(--font-display), serif", fontSize: "28px", color: "#111110", letterSpacing: "2px" }}>
              {FOLDER_TITLES[folder].toUpperCase()}
            </div>
            {filteredTotal > 0 && (
              <span style={{ fontSize: "12px", color: "#8a8a84" }}>
                {filteredTotal} agreement{filteredTotal !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Search bar */}
          <form method="GET" action="/admin/agreements" style={{ display: "flex", gap: "8px", paddingBottom: "20px" }}>
            <input type="hidden" name="folder" value={folder} />
            {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
            <div style={{ display: "flex", flex: 1, alignItems: "center", background: "#f5f4f0", border: "1px solid #d0cfc8", borderRadius: "8px", padding: "0 14px", gap: "8px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a8a84" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input name="q" defaultValue={q ?? ""} placeholder="Search address or seller…" style={{ flex: 1, border: "none", background: "transparent", fontSize: "13px", color: "#111110", outline: "none", padding: "10px 0", fontFamily: "inherit" }} />
            </div>
            <button type="submit" style={{ padding: "0 20px", background: "#111110", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.3px" }}>
              Search
            </button>
            {hasSearch && (
              <Link href={folderHref(folder)} style={{ padding: "0 14px", background: "#ffffff", color: "#8a8a84", border: "1px solid #d0cfc8", borderRadius: "8px", fontSize: "12.5px", display: "flex", alignItems: "center", textDecoration: "none" }}>
                ✕ Clear
              </Link>
            )}
          </form>
        </div>

        {/* Agreement list */}
        <div className="agreements-list-area" style={{ flex: 1, padding: "24px 32px", display: "flex", flexDirection: "column" }}>
          {agreements.length === 0 ? (
            <EmptyState folder={folder} hasSearch={hasSearch} />
          ) : (
            <>
              <div className="agreements-table" style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "12px", overflow: "hidden" }}>
                {/* Column headers */}
                <div className="agreements-table-row" style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr 110px 120px 80px", padding: "10px 20px", background: "#f5f4f0", borderBottom: "1px solid #e8e7e2" }}>
                  {["Type", "Address", "Sellers / Signers", "Status", "Created", ""].map((h) => (
                    <div key={h} style={{ fontSize: "9.5px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>{h}</div>
                  ))}
                </div>

                {agreements.map((a, i) => {
                  const signerCount = a.signers.length;
                  const signedCount = a.signers.filter((s) => s.signedAt).length;
                  const signerText = signerCount > 0
                    ? `${a.signers[0].name}${signerCount > 1 ? ` +${signerCount - 1}` : ""}`
                    : a.sellers;

                  return (
                    <Link key={a.id} href={`/admin/agreements/${a.id}`} className="hover-row agreements-table-row" style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr 110px 120px 80px", padding: "15px 20px", borderBottom: i < agreements.length - 1 ? "1px solid #f0efeb" : "none", alignItems: "center", textDecoration: "none", background: "#ffffff", transition: "background 0.1s" }}>
                      {/* Type */}
                      <div>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#111110", letterSpacing: "0.3px" }}>
                          {TYPE_LABELS[a.type] ?? a.type}
                        </span>
                      </div>

                      {/* Address */}
                      <div style={{ fontSize: "12.5px", color: "#111110", lineHeight: 1.4, paddingRight: "12px" }}>
                        {a.address}
                      </div>

                      {/* Sellers / Signers */}
                      <div style={{ paddingRight: "12px" }}>
                        <div style={{ fontSize: "12px", color: "#5a5a54" }}>{signerText}</div>
                        {signerCount > 0 && (
                          <div style={{ fontSize: "10.5px", color: "#8a8a84", marginTop: "2px" }}>
                            {signedCount}/{signerCount} signed
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      <div><StatusBadge status={a.status} /></div>

                      {/* Date */}
                      <div style={{ fontSize: "11.5px", color: "#8a8a84" }}>
                        {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>

                      {/* Arrow */}
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a8a84" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {filteredTotal > PAGE_SIZE && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", fontSize: "12px", color: "#8a8a84" }}>
                  <span>Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredTotal)} of {filteredTotal}</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {currentPage > 1 && (
                      <Link href={pageHref(currentPage - 1)} style={{ padding: "7px 14px", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "6px", color: "#111110", textDecoration: "none", fontSize: "12px" }}>← Previous</Link>
                    )}
                    {currentPage < totalPages && (
                      <Link href={pageHref(currentPage + 1)} style={{ padding: "7px 14px", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "6px", color: "#111110", textDecoration: "none", fontSize: "12px" }}>Next →</Link>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
