import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { deleteImportRun } from "../actions";
import ImportRunner from "../ImportRunner";
import ImportActions from "../ImportActions";

export const metadata: Metadata = { title: "Offer Inventory | Highlander REI" };

function DeleteButton({ id, action, label }: { id: string; action: (id: string) => Promise<void>; label: string }) {
  const deleteWithId = action.bind(null, id);
  return (
    <form action={deleteWithId} style={{ display: "inline" }}>
      <button type="submit" style={{
        padding: "3px 10px", borderRadius: "20px", fontSize: "10.5px", fontWeight: 600,
        background: "transparent", color: "#c0392b", border: "1px solid rgba(192,57,43,0.2)",
        cursor: "pointer", fontFamily: "inherit",
      }}>
        {label}
      </button>
    </form>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string; border: string }> = {
    completed: { bg: "#eaf6f0", color: "#3a7a50", border: "#b8dfc8" },
    running: { bg: "rgba(26,86,219,0.08)", color: "#1a56db", border: "rgba(26,86,219,0.25)" },
    pending: { bg: "#f0efeb", color: "#8a8a84", border: "#d0cfc8" },
    failed: { bg: "rgba(192,57,43,0.06)", color: "#c0392b", border: "rgba(192,57,43,0.2)" },
  };
  const c = colors[status] ?? colors.pending;
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "10.5px", fontWeight: 600, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {status}
    </span>
  );
}

function fmt(n: number): string { return n.toLocaleString("en-US"); }
function fmtPrice(n: number | null | undefined): string {
  if (n == null) return "—";
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; zip?: string; city?: string }>;
}) {
  await requireAdmin();
  const { page: pageParam, zip: filterZip, city: filterCity } = await searchParams;
  const currentPage = Math.max(1, Number(pageParam) || 1);
  const PAGE_SIZE = 50;

  const [propertyCount, importRunCount, imports] = await Promise.all([
    prisma.property.count(),
    prisma.importRun.count(),
    prisma.importRun.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  const propertyWhere: Record<string, unknown> = {};
  if (filterZip) propertyWhere.zip = filterZip;
  if (filterCity) propertyWhere.city = { contains: filterCity, mode: "insensitive" };
  const filteredPropertyCount = await prisma.property.count({ where: propertyWhere });
  const importedProperties = await prisma.property.findMany({
    where: propertyWhere, orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * PAGE_SIZE, take: PAGE_SIZE,
    include: { owners: { take: 1 } },
  });
  const distinctZips = await prisma.property.findMany({ select: { zip: true }, distinct: ["zip"], orderBy: { zip: "asc" } });

  return (
    <div style={{ maxWidth: "1100px", padding: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <div style={{ fontFamily: "var(--font-display), serif", fontSize: "36px", color: "#111110", letterSpacing: "2px", lineHeight: 1 }}>INVENTORY &amp; IMPORTS</div>
          <div style={{ fontSize: "12px", color: "#8a8a84", marginTop: "4px" }}><Link href="/admin/offers" style={{ color: "#1a56db", textDecoration: "none" }}>Offers pipeline</Link> · Property imports &amp; deal matching</div>
        </div>
        <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "#8a8a84" }}>
          <span><strong style={{ color: "#111110" }}>{propertyCount}</strong> properties</span>
          <span><strong style={{ color: "#111110" }}>{importRunCount}</strong> imports</span>
        </div>
      </div>

      <ImportRunner />

      {imports.length > 0 && (
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", overflow: "hidden", marginBottom: "20px" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e8e7e2", fontSize: "13px", fontWeight: 600, color: "#111110" }}>Recent Imports</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 1fr 80px", padding: "10px 20px", background: "#f5f4f0", borderBottom: "1px solid #e8e7e2" }}>
            {["Source", "Status", "Records", "Date", ""].map((h) => (
              <div key={h} style={{ fontSize: "9.5px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>{h}</div>
            ))}
          </div>
          {imports.map((run, i) => {
            const meta = run.rawMeta as Record<string, unknown> | null;
            return (
              <div key={run.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 1fr 80px", padding: "13px 20px", borderBottom: i < imports.length - 1 ? "1px solid #f0efeb" : "none", alignItems: "center" }}>
                <div style={{ fontSize: "13px", color: "#111110", fontWeight: 500 }}>{run.source}</div>
                <div><StatusBadge status={run.status} /></div>
                <div style={{ fontSize: "12px", color: "#5a5a54" }}>{meta?.imported != null ? `${meta.imported} new` : run.itemCount ?? "—"}</div>
                <div style={{ fontSize: "11.5px", color: "#8a8a84" }}>{new Date(run.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
                <div><DeleteButton id={run.id} action={deleteImportRun} label="Delete" /></div>
              </div>
            );
          })}
        </div>
      )}

      {propertyCount > 0 && (
        <>
          <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "16px 20px", marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#111110" }}>Results</span>
              <form method="GET" action="/admin/offers/inventory" style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <select name="zip" defaultValue={filterZip ?? ""} style={{ padding: "7px 12px", fontSize: "12px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", color: "#111110", fontFamily: "inherit" }}>
                  <option value="">All ZIPs</option>
                  {distinctZips.map((z) => <option key={z.zip} value={z.zip}>{z.zip}</option>)}
                </select>
                <input name="city" defaultValue={filterCity ?? ""} placeholder="City..." style={{ padding: "7px 12px", fontSize: "12px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", color: "#111110", fontFamily: "inherit", width: "140px" }} />
                <button type="submit" style={{ padding: "7px 16px", background: "#111110", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Filter</button>
                {(filterZip || filterCity) && (
                  <Link href="/admin/offers/inventory" style={{ padding: "7px 12px", fontSize: "12px", color: "#8a8a84", textDecoration: "none", border: "1px solid #d0cfc8", borderRadius: "6px" }}>Clear</Link>
                )}
              </form>
              <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                <ImportActions exportUrl={`/api/acquisitions/export?${filterZip ? `zip=${filterZip}&` : ""}${filterCity ? `city=${filterCity}` : ""}`} propertyCount={filteredPropertyCount} />
              </div>
            </div>
            <div style={{ fontSize: "11px", color: "#8a8a84", marginTop: "8px" }}>
              {filteredPropertyCount} properties{filterZip ? ` in ${filterZip}` : ""}{filterCity ? ` in ${filterCity}` : ""}
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 0.8fr 0.5fr 0.6fr 0.8fr 0.7fr 0.6fr 1fr", padding: "10px 20px", background: "#f5f4f0", borderBottom: "1px solid #e8e7e2" }}>
              {["Address", "City / ZIP", "Beds", "Sqft", "Value", "Equity", "Owned", "Owner"].map((h) => (
                <div key={h} style={{ fontSize: "9.5px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>{h}</div>
              ))}
            </div>
            {importedProperties.map((p, i) => {
              const o = p.owners[0];
              const eqPct = o?.estimatedEquityPct;
              const ownedYears = p.lastSaleDate ? Math.round((Date.now() - new Date(p.lastSaleDate).getTime()) / (1000 * 60 * 60 * 24 * 365)) : null;
              return (
                <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1.8fr 0.8fr 0.5fr 0.6fr 0.8fr 0.7fr 0.6fr 1fr", padding: "13px 20px", borderBottom: i < importedProperties.length - 1 ? "1px solid #f0efeb" : "none", alignItems: "center" }}>
                  <div style={{ fontSize: "13px", color: "#111110", fontWeight: 500 }}>{p.streetAddress}</div>
                  <div style={{ fontSize: "12px", color: "#5a5a54" }}>{p.city}, {p.zip}</div>
                  <div style={{ fontSize: "12px", color: "#5a5a54" }}>{p.beds ?? "—"}</div>
                  <div style={{ fontSize: "12px", color: "#5a5a54" }}>{p.sqft ? fmt(p.sqft) : "—"}</div>
                  <div style={{ fontSize: "12px", color: "#5a5a54" }}>{fmtPrice(p.estimatedValue)}</div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: eqPct != null && eqPct >= 50 ? "#3a7a50" : eqPct != null && eqPct >= 20 ? "#b45309" : "#8a8a84" }}>
                    {eqPct != null ? `${Math.round(eqPct)}%` : "—"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#5a5a54" }}>{ownedYears != null ? `${ownedYears}yr` : "—"}</div>
                  <div style={{ fontSize: "11px", color: "#8a8a84" }}>{o?.fullName ?? [o?.firstName, o?.lastName].filter(Boolean).join(" ") ?? "—"}</div>
                </div>
              );
            })}
          </div>

          {filteredPropertyCount > PAGE_SIZE && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", fontSize: "12px", color: "#8a8a84" }}>
              <span>Page {currentPage} of {Math.ceil(filteredPropertyCount / PAGE_SIZE)}</span>
              <div style={{ display: "flex", gap: "8px" }}>
                {currentPage > 1 && <Link href={`/admin/offers/inventory?${filterZip ? `zip=${filterZip}&` : ""}${filterCity ? `city=${filterCity}&` : ""}page=${currentPage - 1}`} style={{ padding: "7px 14px", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "6px", color: "#111110", textDecoration: "none", fontSize: "12px" }}>Previous</Link>}
                {currentPage < Math.ceil(filteredPropertyCount / PAGE_SIZE) && <Link href={`/admin/offers/inventory?${filterZip ? `zip=${filterZip}&` : ""}${filterCity ? `city=${filterCity}&` : ""}page=${currentPage + 1}`} style={{ padding: "7px 14px", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "6px", color: "#111110", textDecoration: "none", fontSize: "12px" }}>Next</Link>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
