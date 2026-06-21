import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { createArea, toggleArea, deleteArea, toggleBuyBox, deleteBuyBox, runMatchesForBuyBox, deleteImportRun } from "./actions";
import BuyBoxForm from "./BuyBoxForm";
import { createBuyBox } from "./actions";
import ImportRunner from "./ImportRunner";

export const metadata: Metadata = { title: "Acquisitions | Highlander REI" };

function StatCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "24px" }}>
      <div style={{ fontSize: "10px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, marginBottom: "8px" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-display), serif", fontSize: "32px", color: "#111110" }}>{value}</div>
      <div style={{ fontSize: "12px", color: "#8a8a84", marginTop: "4px" }}>{sub}</div>
    </div>
  );
}

function ToggleButton({ id, active, action }: { id: string; active: boolean; action: (id: string) => Promise<void> }) {
  const toggleWithId = action.bind(null, id);
  return (
    <form action={toggleWithId} style={{ display: "inline" }}>
      <button type="submit" style={{
        padding: "3px 10px", borderRadius: "20px", fontSize: "10.5px", fontWeight: 600,
        letterSpacing: "0.4px", border: "1px solid",
        background: active ? "#eaf6f0" : "#f0efeb",
        color: active ? "#3a7a50" : "#8a8a84",
        borderColor: active ? "#b8dfc8" : "#d0cfc8",
        cursor: "pointer", fontFamily: "inherit",
      }}>
        {active ? "Active" : "Inactive"}
      </button>
    </form>
  );
}

function ActionButton({ id, action, label, style: s }: { id: string; action: (id: string) => Promise<void>; label: string; style?: React.CSSProperties }) {
  const boundAction = action.bind(null, id);
  return (
    <form action={boundAction} style={{ display: "inline" }}>
      <button type="submit" style={{
        padding: "3px 10px", borderRadius: "20px", fontSize: "10.5px", fontWeight: 600,
        cursor: "pointer", fontFamily: "inherit",
        background: "transparent", color: "#111110", border: "1px solid #d0cfc8",
        ...s,
      }}>
        {label}
      </button>
    </form>
  );
}

function DeleteButton({ id, action, label }: { id: string; action: (id: string) => Promise<void>; label: string }) {
  return <ActionButton id={id} action={action} label={label} style={{ color: "#c0392b", border: "1px solid rgba(192,57,43,0.2)" }} />;
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

export default async function AcquisitionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  await requireAdmin();
  const { tab, page: pageParam } = await searchParams;
  const activeTab = tab ?? "overview";
  const currentPage = Math.max(1, Number(pageParam) || 1);
  const PAGE_SIZE = 50;

  const [areaCount, buyBoxCount, propertyCount, matchCount, leadCount, importRunCount, areas, buyBoxes] = await Promise.all([
    prisma.acquisitionArea.count(),
    prisma.buyBox.count({ where: { active: true } }),
    prisma.property.count(),
    prisma.buyerMatch.count(),
    prisma.acquisitionLead.count(),
    prisma.importRun.count(),
    prisma.acquisitionArea.findMany({ orderBy: { name: "asc" } }),
    prisma.buyBox.findMany({
      include: { area: { select: { name: true } }, _count: { select: { matches: true } } },
      orderBy: [{ priority: "desc" }, { name: "asc" }],
    }),
  ]);

  const properties = activeTab === "properties" ? await prisma.property.findMany({
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: { owners: { take: 1 }, _count: { select: { matches: true } } },
  }) : [];

  const imports = activeTab === "imports" ? await prisma.importRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  }) : [];

  const matches = activeTab === "matches" ? await prisma.buyerMatch.findMany({
    orderBy: { score: "desc" },
    take: 100,
    include: {
      property: { select: { streetAddress: true, city: true, zip: true, beds: true, baths: true, sqft: true, estimatedValue: true } },
      buyBox: { select: { name: true } },
    },
  }) : [];

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "areas", label: `Areas (${areaCount})` },
    { key: "buyboxes", label: `Buy Boxes (${buyBoxCount})` },
    { key: "properties", label: `Properties (${propertyCount})` },
    { key: "imports", label: `Imports (${importRunCount})` },
    { key: "matches", label: `Matches (${matchCount})` },
  ];

  return (
    <div style={{ maxWidth: "1100px", padding: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ fontFamily: "var(--font-display), serif", fontSize: "36px", color: "#111110", letterSpacing: "2px", lineHeight: 1 }}>ACQUISITIONS</div>
          <div style={{ fontSize: "12px", color: "#8a8a84", marginTop: "4px" }}>Property search pipeline &amp; deal matching</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "2px", marginBottom: "24px", borderBottom: "1px solid #e8e7e2", flexWrap: "wrap" }}>
        {tabs.map(({ key, label }) => (
          <Link key={key} href={`/admin/acquisitions?tab=${key}`} style={{
            fontSize: "12.5px", fontWeight: activeTab === key ? 600 : 400,
            color: activeTab === key ? "#111110" : "#8a8a84",
            textDecoration: "none", padding: "8px 16px 12px",
            borderBottom: activeTab === key ? "2px solid #111110" : "2px solid transparent",
            marginBottom: "-1px", letterSpacing: "0.3px",
          }}>
            {label}
          </Link>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === "overview" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
            <StatCard label="Areas" value={areaCount} sub="Target markets" />
            <StatCard label="Active Buy Boxes" value={buyBoxCount} sub="Criteria sets" />
            <StatCard label="Properties" value={propertyCount} sub="In database" />
            <StatCard label="Matches" value={matchCount} sub="Buy-box hits" />
            <StatCard label="Leads" value={leadCount} sub="Acquisition leads" />
            <StatCard label="Import Runs" value={importRunCount} sub="Apify & MLS" />
          </div>
          {propertyCount === 0 && (
            <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "48px 40px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>NO PROPERTIES YET</div>
              <div style={{ fontSize: "13px", color: "#8a8a84", maxWidth: "460px", margin: "0 auto", lineHeight: 1.6 }}>Set up areas and buy boxes, then import properties from Apify to start matching.</div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "20px" }}>
                <Link href="/admin/acquisitions?tab=areas" style={{ padding: "10px 20px", background: "#111110", color: "#ffffff", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>Set Up Areas</Link>
                <Link href="/admin/acquisitions?tab=imports" style={{ padding: "10px 20px", background: "#ffffff", color: "#111110", border: "1px solid #d0cfc8", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>Run Import</Link>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Areas ── */}
      {activeTab === "areas" && (
        <>
          <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "24px", marginBottom: "20px" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#111110", marginBottom: "16px" }}>Add Area</div>
            <form action={createArea} style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <span style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Name</span>
                <input name="name" required placeholder="e.g. Arcadia" style={{ width: "100%", padding: "9px 12px", fontSize: "13px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", color: "#111110", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: 2, minWidth: "200px" }}>
                <span style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Description</span>
                <input name="description" placeholder="Optional description" style={{ width: "100%", padding: "9px 12px", fontSize: "13px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", color: "#111110", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
              <button type="submit" style={{ padding: "10px 20px", background: "#111110", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Add</button>
            </form>
          </div>
          {areas.length === 0 ? (
            <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "48px 40px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>NO AREAS</div>
              <div style={{ fontSize: "13px", color: "#8a8a84" }}>Add your target markets — Arcadia, Scottsdale, Paradise Valley, Cactus Corridor.</div>
            </div>
          ) : (
            <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 100px 100px", padding: "10px 20px", background: "#f5f4f0", borderBottom: "1px solid #e8e7e2" }}>
                {["Name", "Description", "Status", ""].map((h) => (
                  <div key={h} style={{ fontSize: "9.5px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>{h}</div>
                ))}
              </div>
              {areas.map((area, i) => (
                <div key={area.id} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 100px 100px", padding: "14px 20px", borderBottom: i < areas.length - 1 ? "1px solid #f0efeb" : "none", alignItems: "center" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#111110" }}>{area.name}</div>
                  <div style={{ fontSize: "12.5px", color: "#5a5a54" }}>{area.description ?? "—"}</div>
                  <div><ToggleButton id={area.id} active={area.active} action={toggleArea} /></div>
                  <div><DeleteButton id={area.id} action={deleteArea} label="Delete" /></div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Buy Boxes ── */}
      {activeTab === "buyboxes" && (
        <>
          <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "24px", marginBottom: "20px" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#111110", marginBottom: "16px" }}>New Buy Box</div>
            <BuyBoxForm areas={areas.filter((a) => a.active).map((a) => ({ id: a.id, name: a.name }))} action={createBuyBox} />
          </div>
          {buyBoxes.length === 0 ? (
            <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "48px 40px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>NO BUY BOXES</div>
              <div style={{ fontSize: "13px", color: "#8a8a84" }}>Create your first buy box above.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {buyBoxes.map((bb) => {
                const zips = Array.isArray(bb.zips) ? bb.zips : [];
                const types = Array.isArray(bb.propertyTypes) ? bb.propertyTypes : [];
                return (
                  <div key={bb.id} style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "20px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#111110" }}>{bb.name}</span>
                        {bb.area && <span style={{ fontSize: "10.5px", color: "#8a8a84", background: "#f5f4f0", padding: "2px 8px", borderRadius: "20px" }}>{bb.area.name}</span>}
                        {bb.priority > 0 && <span style={{ fontSize: "10.5px", color: "#1a56db", background: "rgba(26,86,219,0.08)", padding: "2px 8px", borderRadius: "20px", fontWeight: 600 }}>P{bb.priority}</span>}
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", color: "#8a8a84" }}>{bb._count.matches} match{bb._count.matches !== 1 ? "es" : ""}</span>
                        <ActionButton id={bb.id} action={runMatchesForBuyBox} label="Run Matches" />
                        <ToggleButton id={bb.id} active={bb.active} action={toggleBuyBox} />
                        <DeleteButton id={bb.id} action={deleteBuyBox} label="Delete" />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "12px", color: "#5a5a54" }}>
                      {(bb.priceMin != null || bb.priceMax != null) && <span>Price: {fmtPrice(bb.priceMin)}–{fmtPrice(bb.priceMax)}</span>}
                      {(bb.bedsMin != null || bb.bedsMax != null) && <span>Beds: {bb.bedsMin ?? "any"}–{bb.bedsMax ?? "any"}</span>}
                      {(bb.sqftMin != null || bb.sqftMax != null) && <span>Sqft: {bb.sqftMin ? fmt(bb.sqftMin) : "any"}–{bb.sqftMax ? fmt(bb.sqftMax) : "any"}</span>}
                      {zips.length > 0 && <span>ZIPs: {(zips as string[]).join(", ")}</span>}
                      {types.length > 0 && <span>Types: {(types as string[]).join(", ")}</span>}
                      {bb.buyerName && <span>Buyer: {bb.buyerName}</span>}
                      {bb.dispositionStrategy && <span>Strategy: {bb.dispositionStrategy}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Properties ── */}
      {activeTab === "properties" && (
        <>
          {properties.length === 0 ? (
            <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "48px 40px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>NO PROPERTIES</div>
              <div style={{ fontSize: "13px", color: "#8a8a84" }}>Import properties from the Imports tab to populate this list.</div>
            </div>
          ) : (
            <>
              <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.6fr 0.6fr 0.8fr 1fr 80px", padding: "10px 20px", background: "#f5f4f0", borderBottom: "1px solid #e8e7e2" }}>
                  {["Address", "City / ZIP", "Beds", "Baths", "Sqft", "Value", "Matches"].map((h) => (
                    <div key={h} style={{ fontSize: "9.5px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>{h}</div>
                  ))}
                </div>
                {properties.map((p, i) => (
                  <div key={p.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.6fr 0.6fr 0.8fr 1fr 80px", padding: "13px 20px", borderBottom: i < properties.length - 1 ? "1px solid #f0efeb" : "none", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "13px", color: "#111110", fontWeight: 500 }}>{p.streetAddress}</div>
                      {p.owners[0] && <div style={{ fontSize: "11px", color: "#8a8a84" }}>{p.owners[0].fullName ?? [p.owners[0].firstName, p.owners[0].lastName].filter(Boolean).join(" ")}</div>}
                    </div>
                    <div style={{ fontSize: "12px", color: "#5a5a54" }}>{p.city}, {p.zip}</div>
                    <div style={{ fontSize: "12px", color: "#5a5a54" }}>{p.beds ?? "—"}</div>
                    <div style={{ fontSize: "12px", color: "#5a5a54" }}>{p.baths ?? "—"}</div>
                    <div style={{ fontSize: "12px", color: "#5a5a54" }}>{p.sqft ? fmt(p.sqft) : "—"}</div>
                    <div style={{ fontSize: "12px", color: "#5a5a54" }}>{fmtPrice(p.estimatedValue)}</div>
                    <div style={{ fontSize: "12px", color: p._count.matches > 0 ? "#3a7a50" : "#8a8a84", fontWeight: p._count.matches > 0 ? 600 : 400 }}>{p._count.matches}</div>
                  </div>
                ))}
              </div>
              {propertyCount > PAGE_SIZE && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", fontSize: "12px", color: "#8a8a84" }}>
                  <span>Page {currentPage} of {Math.ceil(propertyCount / PAGE_SIZE)}</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {currentPage > 1 && <Link href={`/admin/acquisitions?tab=properties&page=${currentPage - 1}`} style={{ padding: "7px 14px", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "6px", color: "#111110", textDecoration: "none", fontSize: "12px" }}>Previous</Link>}
                    {currentPage < Math.ceil(propertyCount / PAGE_SIZE) && <Link href={`/admin/acquisitions?tab=properties&page=${currentPage + 1}`} style={{ padding: "7px 14px", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "6px", color: "#111110", textDecoration: "none", fontSize: "12px" }}>Next</Link>}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Imports ── */}
      {activeTab === "imports" && (
        <>
          <ImportRunner />
          {imports.length === 0 ? (
            <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "48px 40px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>NO IMPORTS YET</div>
              <div style={{ fontSize: "13px", color: "#8a8a84" }}>Use the form above to run your first Apify import.</div>
            </div>
          ) : (
            <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 100px 140px 80px", padding: "10px 20px", background: "#f5f4f0", borderBottom: "1px solid #e8e7e2" }}>
                {["Source", "Actor / Run ID", "Status", "Records", "Date", ""].map((h) => (
                  <div key={h} style={{ fontSize: "9.5px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>{h}</div>
                ))}
              </div>
              {imports.map((run, i) => {
                const meta = run.rawMeta as Record<string, unknown> | null;
                return (
                  <div key={run.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 100px 140px 80px", padding: "13px 20px", borderBottom: i < imports.length - 1 ? "1px solid #f0efeb" : "none", alignItems: "center" }}>
                    <div style={{ fontSize: "13px", color: "#111110", fontWeight: 500 }}>{run.source}</div>
                    <div style={{ fontSize: "11px", color: "#8a8a84", fontFamily: "monospace" }}>{run.actorId ? `${run.actorId.slice(0, 20)}...` : "—"}</div>
                    <div><StatusBadge status={run.status} /></div>
                    <div style={{ fontSize: "12px", color: "#5a5a54" }}>{run.itemCount ?? (meta?.imported != null ? `${meta.imported} new` : "—")}</div>
                    <div style={{ fontSize: "11.5px", color: "#8a8a84" }}>{new Date(run.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
                    <div><DeleteButton id={run.id} action={deleteImportRun} label="Delete" /></div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Matches ── */}
      {activeTab === "matches" && (
        <>
          {matches.length === 0 ? (
            <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "48px 40px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>NO MATCHES</div>
              <div style={{ fontSize: "13px", color: "#8a8a84" }}>Import properties and run matches from the Buy Boxes tab to see results here.</div>
            </div>
          ) : (
            <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.8fr 0.8fr 0.8fr 80px 1fr", padding: "10px 20px", background: "#f5f4f0", borderBottom: "1px solid #e8e7e2" }}>
                {["Address", "Buy Box", "Beds/Baths", "Sqft", "Value", "Score", "Status"].map((h) => (
                  <div key={h} style={{ fontSize: "9.5px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>{h}</div>
                ))}
              </div>
              {matches.map((m, i) => (
                <div key={m.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.8fr 0.8fr 0.8fr 80px 1fr", padding: "13px 20px", borderBottom: i < matches.length - 1 ? "1px solid #f0efeb" : "none", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "13px", color: "#111110", fontWeight: 500 }}>{m.property.streetAddress}</div>
                    <div style={{ fontSize: "11px", color: "#8a8a84" }}>{m.property.city}, {m.property.zip}</div>
                  </div>
                  <div style={{ fontSize: "12px", color: "#5a5a54" }}>{m.buyBox.name}</div>
                  <div style={{ fontSize: "12px", color: "#5a5a54" }}>{m.property.beds ?? "—"} / {m.property.baths ?? "—"}</div>
                  <div style={{ fontSize: "12px", color: "#5a5a54" }}>{m.property.sqft ? fmt(m.property.sqft) : "—"}</div>
                  <div style={{ fontSize: "12px", color: "#5a5a54" }}>{fmtPrice(m.property.estimatedValue)}</div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: m.score >= 80 ? "#3a7a50" : m.score >= 50 ? "#b45309" : "#c0392b" }}>{m.score}</div>
                  <div><StatusBadge status={m.status} /></div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
