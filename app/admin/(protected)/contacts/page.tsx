import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";
import { deleteContact } from "./actions";
import DeleteContactForm from "./DeleteContactForm";

export const metadata: Metadata = { title: "Contacts | Highlander REI" };

const TYPE_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  seller: { label: "Seller", bg: "#fdf3e3", color: "#b45309", border: "#fcd9a0" },
  buyer:  { label: "Buyer",  bg: "rgba(26,86,219,0.08)", color: "#1a56db", border: "rgba(26,86,219,0.25)" },
};

function TypeBadge({ type }: { type: string | null }) {
  if (!type) return <span style={{ fontSize: "11px", color: "#8a8a84" }}>—</span>;
  const cfg = TYPE_CONFIG[type] ?? { label: type, bg: "#f0efeb", color: "#5a5a54", border: "#d0cfc8" };
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.4px", background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {cfg.label}
    </span>
  );
}

type ContactFilter = "all" | "seller" | "buyer";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  await requireAdmin();
  const { q, type: typeFilter } = await searchParams;
  const filter = (["all", "seller", "buyer"].includes(typeFilter ?? "") ? typeFilter : "all") as ContactFilter;

  const contacts = await prisma.contact.findMany({
    where: {
      ...(filter !== "all" ? { contactType: filter } : {}),
      ...(q ? {
        OR: [
          { name:      { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName:  { contains: q, mode: "insensitive" } },
          { email:     { contains: q, mode: "insensitive" } },
          { company:   { contains: q, mode: "insensitive" } },
        ],
      } : {}),
    },
    orderBy: { name: "asc" },
    include: { _count: { select: { signers: true } } },
  });

  const [allCount, sellerCount, buyerCount] = await Promise.all([
    prisma.contact.count(),
    prisma.contact.count({ where: { contactType: "seller" } }),
    prisma.contact.count({ where: { contactType: "buyer" } }),
  ]);

  const hasSearch = !!(q || (filter !== "all"));
  const filterHref = (f: string) => `/admin/contacts?type=${f}${q ? `&q=${q}` : ""}`;

  const FILTERS = [
    { key: "all",    label: "All Contacts", count: allCount,    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
    { key: "seller", label: "Sellers",      count: sellerCount, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { key: "buyer",  label: "Buyers",       count: buyerCount,  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/></svg> },
  ];

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: "236px", background: "#1C1C1B", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", flexShrink: 0, paddingBottom: "24px" }}>

        <div style={{ padding: "16px 14px 12px" }}>
          <Link href="/admin/contacts/new" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#B8962E", color: "#ffffff", padding: "11px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none", letterSpacing: "0.3px" }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Add Contact
          </Link>
        </div>

        <div style={{ padding: "8px 10px 0" }}>
          <div style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "1.8px", textTransform: "uppercase", padding: "0 8px", marginBottom: "4px" }}>CONTACTS</div>
          {FILTERS.map(({ key, label, count, icon }) => {
            const active = filter === key;
            return (
              <Link key={key} href={filterHref(key)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: "6px", marginBottom: "1px", background: active ? "rgba(184,150,46,0.12)" : "transparent", textDecoration: "none", borderLeft: active ? "2px solid #B8962E" : "2px solid transparent", color: active ? "#E8D9A0" : "rgba(255,255,255,0.5)" }}>
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

        <div style={{ padding: "28px 32px 0", borderBottom: "1px solid #e8e7e2", background: "#ffffff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div style={{ fontFamily: "var(--font-display), serif", fontSize: "28px", color: "#111110", letterSpacing: "2px" }}>
              {filter === "all" ? "ALL CONTACTS" : filter === "seller" ? "SELLERS" : "BUYERS"}
            </div>
            <span style={{ fontSize: "12px", color: "#8a8a84" }}>{contacts.length} contact{contacts.length !== 1 ? "s" : ""}</span>
          </div>

          <form method="GET" action="/admin/contacts" style={{ display: "flex", gap: "8px", paddingBottom: "20px" }}>
            <input type="hidden" name="type" value={filter} />
            <div style={{ display: "flex", flex: 1, alignItems: "center", background: "#f5f4f0", border: "1px solid #d0cfc8", borderRadius: "8px", padding: "0 14px", gap: "8px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a8a84" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input name="q" defaultValue={q ?? ""} placeholder="Search name, email, company…" style={{ flex: 1, border: "none", background: "transparent", fontSize: "13px", color: "#111110", outline: "none", padding: "10px 0", fontFamily: "inherit" }} />
            </div>
            <button type="submit" style={{ padding: "0 20px", background: "#111110", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Search</button>
            {hasSearch && (
              <Link href="/admin/contacts?type=all" style={{ padding: "0 14px", background: "#ffffff", color: "#8a8a84", border: "1px solid #d0cfc8", borderRadius: "8px", fontSize: "12.5px", display: "flex", alignItems: "center", textDecoration: "none" }}>✕ Clear</Link>
            )}
          </form>
        </div>

        <div style={{ flex: 1, padding: "24px 32px" }}>
          {contacts.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 40px", textAlign: "center" }}>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ marginBottom: "20px", opacity: 0.3 }}>
                <circle cx="32" cy="24" r="12" stroke="#111110" strokeWidth="2"/>
                <path d="M8 56c0-13.255 10.745-24 24-24s24 10.745 24 24" stroke="#111110" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#111110", letterSpacing: "2px", marginBottom: "8px" }}>NO CONTACTS FOUND</div>
              <div style={{ fontSize: "13px", color: "#8a8a84", marginBottom: "24px" }}>
                {q ? "Try adjusting your search." : "Add contacts to quickly attach signers to agreements."}
              </div>
              <Link href="/admin/contacts/new" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#B8962E", color: "#ffffff", padding: "11px 24px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                Add Contact
              </Link>
            </div>
          ) : (
            <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.4fr 1.2fr 1fr 80px 60px 120px", padding: "10px 20px", background: "#f5f4f0", borderBottom: "1px solid #e8e7e2" }}>
                {["Name", "Email", "Phone", "Company", "Type", "Deals", ""].map((h) => (
                  <div key={h} style={{ fontSize: "9.5px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>{h}</div>
                ))}
              </div>

              {contacts.map((c, i) => {
                const deleteWithId = deleteContact.bind(null, c.id);
                const displayName = (c.firstName || c.lastName)
                  ? [c.firstName, c.lastName].filter(Boolean).join(" ")
                  : c.name;
                return (
                  <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.4fr 1.2fr 1fr 80px 60px 120px", padding: "14px 20px", borderBottom: i < contacts.length - 1 ? "1px solid #f0efeb" : "none", alignItems: "center", background: "#ffffff" }}>
                    <div>
                      <div style={{ fontSize: "13px", color: "#111110", fontWeight: 500 }}>{displayName}</div>
                      {c.firstName && c.lastName && c.name !== displayName && (
                        <div style={{ fontSize: "11px", color: "#8a8a84" }}>{c.name}</div>
                      )}
                    </div>
                    <div><a href={`mailto:${c.email}`} style={{ fontSize: "12.5px", color: "#1a56db", textDecoration: "none" }}>{c.email}</a></div>
                    <div style={{ fontSize: "12px", color: "#5a5a54" }}>{c.phone ?? "—"}</div>
                    <div style={{ fontSize: "12px", color: "#5a5a54" }}>{c.company ?? "—"}</div>
                    <div><TypeBadge type={c.contactType ?? null} /></div>
                    <div style={{ fontSize: "12px", color: "#8a8a84", textAlign: "center" }}>{c._count.signers}</div>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <Link href={`/admin/contacts/new?edit=${c.id}`} style={{ fontSize: "12px", color: "#111110", textDecoration: "none", padding: "5px 12px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff" }}>
                        Edit
                      </Link>
                      <DeleteContactForm action={deleteWithId} contactName={displayName} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
