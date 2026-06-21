import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { createArea, toggleArea, deleteArea, toggleBuyBox, deleteBuyBox, deleteImportRun } from "./actions";
import BuyBoxForm from "./BuyBoxForm";
import { createBuyBox } from "./actions";
import ImportRunner from "./ImportRunner";
import ImportActions from "./ImportActions";

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

export default async function AcquisitionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string; zip?: string; city?: string }>;
}) {
  await requireAdmin();
  const { tab, page: pageParam, zip: filterZip, city: filterCity } = await searchParams;
  const activeTab = tab ?? "overview";
  const currentPage = Math.max(1, Number(pageParam) || 1);
  const PAGE_SIZE = 50;

  const [searchCount, machineCount, propertyCount, leadCount, importRunCount, searches, machines, contacts] = await Promise.all([
    prisma.acquisitionArea.count(),
    prisma.buyBox.count({ where: { active: true } }),
    prisma.property.count(),
    prisma.acquisitionLead.count(),
    prisma.importRun.count(),
    prisma.acquisitionArea.findMany({ orderBy: { name: "asc" } }),
    prisma.buyBox.findMany({
      include: { area: { select: { name: true, buyerContact: true } } },
      orderBy: [{ priority: "desc" }, { name: "asc" }],
    }),
    prisma.contact.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const imports = activeTab === "imports" ? await prisma.importRun.findMany({ orderBy: { createdAt: "desc" }, take: 50 }) : [];

  const propertyWhere: Record<string, unknown> = {};
  if (filterZip) propertyWhere.zip = filterZip;
  if (filterCity) propertyWhere.city = { contains: filterCity, mode: "insensitive" };
  const filteredPropertyCount = activeTab === "imports" ? await prisma.property.count({ where: propertyWhere }) : 0;
  const importedProperties = activeTab === "imports" ? await prisma.property.findMany({
    where: propertyWhere, orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * PAGE_SIZE, take: PAGE_SIZE,
    include: { owners: { take: 1 } },
  }) : [];
  const distinctZips = activeTab === "imports" ? await prisma.property.findMany({ select: { zip: true }, distinct: ["zip"], orderBy: { zip: "asc" } }) : [];

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "searches", label: `Buyer Search (${searchCount})` },
    { key: "machines", label: `Acquisition Machine (${machineCount})` },
    { key: "imports", label: `Imports (${propertyCount})` },
  ];

  return (
    <div style={{ maxWidth: "1100px", padding: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
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
            <StatCard label="Buyer Searches" value={searchCount} sub="Active search requests" />
            <StatCard label="Machines" value={machineCount} sub="Acquisition criteria" />
            <StatCard label="Properties" value={propertyCount} sub="In database" />
            <StatCard label="Import Runs" value={importRunCount} sub="Completed imports" />
          </div>
          {propertyCount === 0 && (
            <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "48px 40px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>GET STARTED</div>
              <div style={{ fontSize: "13px", color: "#8a8a84", maxWidth: "460px", margin: "0 auto", lineHeight: 1.6 }}>Create a Buyer Search for your client, set up an Acquisition Machine with their criteria, then run an import.</div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "20px" }}>
                <Link href="/admin/acquisitions?tab=searches" style={{ padding: "10px 20px", background: "#111110", color: "#ffffff", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>New Buyer Search</Link>
                <Link href="/admin/acquisitions?tab=imports" style={{ padding: "10px 20px", background: "#ffffff", color: "#111110", border: "1px solid #d0cfc8", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>Run Import</Link>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Buyer Search ── */}
      {activeTab === "searches" && (
        <>
          <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "24px", marginBottom: "20px" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#111110", marginBottom: "16px" }}>New Buyer Search</div>
            <form action={createArea}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <span style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Search Name</span>
                  <input name="name" required placeholder="e.g. Smith Family — Arcadia SFR" style={{ width: "100%", padding: "9px 12px", fontSize: "13px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", color: "#111110", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Buyer Contact</span>
                  <select name="buyerContact" style={{ width: "100%", padding: "9px 12px", fontSize: "13px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", color: "#111110", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}>
                    <option value="">Select a contact...</option>
                    {contacts.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: "12px" }}>
                <span style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Description</span>
                <textarea name="description" rows={3} placeholder="What is this buyer looking for? e.g. First-time investor looking for a 3+ bed SFR in Arcadia under $700K, preferably a fixer-upper or tired landlord situation with high equity..." style={{ width: "100%", padding: "9px 12px", fontSize: "13px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", color: "#111110", fontFamily: "inherit", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" style={{ padding: "10px 24px", background: "#111110", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Create Buyer Search</button>
              </div>
            </form>
          </div>

          {searches.length === 0 ? (
            <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "48px 40px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>NO BUYER SEARCHES</div>
              <div style={{ fontSize: "13px", color: "#8a8a84" }}>Create a search above — name the search, assign the buyer contact, and describe what they&apos;re looking for.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {searches.map((s) => (
                <div key={s.id} style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#111110" }}>{s.name}</span>
                      {s.buyerContact && (
                        <span style={{ fontSize: "10.5px", color: "#1a56db", background: "rgba(26,86,219,0.08)", padding: "2px 8px", borderRadius: "20px", fontWeight: 600 }}>{s.buyerContact}</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <ToggleButton id={s.id} active={s.active} action={toggleArea} />
                      <DeleteButton id={s.id} action={deleteArea} label="Delete" />
                    </div>
                  </div>
                  {s.description && (
                    <div style={{ fontSize: "12.5px", color: "#5a5a54", lineHeight: 1.6 }}>{s.description}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Acquisition Machine ── */}
      {activeTab === "machines" && (
        <>
          <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "24px", marginBottom: "20px" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#111110", marginBottom: "4px" }}>New Acquisition Machine</div>
            <div style={{ fontSize: "12px", color: "#8a8a84", marginBottom: "16px" }}>Define the criteria to source properties. ZIPs drive the Propwire search; other fields filter the results.</div>
            <BuyBoxForm
              buyerSearches={searches.filter((s) => s.active).map((s) => ({ id: s.id, name: s.name, buyerContact: s.buyerContact }))}
              action={createBuyBox}
            />
          </div>
          {machines.length === 0 ? (
            <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "48px 40px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>NO MACHINES</div>
              <div style={{ fontSize: "13px", color: "#8a8a84" }}>Create your first acquisition machine above to start sourcing properties.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {machines.map((m) => {
                const zips = Array.isArray(m.zips) ? m.zips : [];
                const types = Array.isArray(m.propertyTypes) ? m.propertyTypes : [];
                return (
                  <div key={m.id} style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "20px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#111110" }}>{m.name}</span>
                        {m.area && <span style={{ fontSize: "10.5px", color: "#8a8a84", background: "#f5f4f0", padding: "2px 8px", borderRadius: "20px" }}>{m.area.name}</span>}
                        {m.area?.buyerContact && <span style={{ fontSize: "10.5px", color: "#1a56db", background: "rgba(26,86,219,0.08)", padding: "2px 8px", borderRadius: "20px", fontWeight: 600 }}>{m.area.buyerContact}</span>}
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <ToggleButton id={m.id} active={m.active} action={toggleBuyBox} />
                        <DeleteButton id={m.id} action={deleteBuyBox} label="Delete" />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "12px", color: "#5a5a54" }}>
                      {zips.length > 0 && <span>ZIPs: {(zips as string[]).join(", ")}</span>}
                      {types.length > 0 && <span>Types: {(types as string[]).join(", ")}</span>}
                      {(m.priceMin != null || m.priceMax != null) && <span>Price: {fmtPrice(m.priceMin)}–{fmtPrice(m.priceMax)}</span>}
                      {(m.bedsMin != null || m.bedsMax != null) && <span>Beds: {m.bedsMin ?? "any"}–{m.bedsMax ?? "any"}</span>}
                      {(m.sqftMin != null || m.sqftMax != null) && <span>Sqft: {m.sqftMin ? fmt(m.sqftMin) : "any"}–{m.sqftMax ? fmt(m.sqftMax) : "any"}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Imports ── */}
      {activeTab === "imports" && (
        <>
          <ImportRunner />

          {imports.length > 0 && (
            <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", overflow: "hidden", marginBottom: "20px" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #e8e7e2", fontSize: "13px", fontWeight: 600, color: "#111110" }}>Import History</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 100px 140px 80px", padding: "10px 20px", background: "#f5f4f0", borderBottom: "1px solid #e8e7e2" }}>
                {["Source", "Actor", "Status", "Records", "Date", ""].map((h) => (
                  <div key={h} style={{ fontSize: "9.5px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>{h}</div>
                ))}
              </div>
              {imports.map((run, i) => {
                const meta = run.rawMeta as Record<string, unknown> | null;
                return (
                  <div key={run.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 100px 140px 80px", padding: "13px 20px", borderBottom: i < imports.length - 1 ? "1px solid #f0efeb" : "none", alignItems: "center" }}>
                    <div style={{ fontSize: "13px", color: "#111110", fontWeight: 500 }}>{run.source}</div>
                    <div style={{ fontSize: "11px", color: "#8a8a84", fontFamily: "monospace" }}>{run.actorId ? `${run.actorId.slice(0, 25)}` : "—"}</div>
                    <div><StatusBadge status={run.status} /></div>
                    <div style={{ fontSize: "12px", color: "#5a5a54" }}>{run.itemCount ?? (meta?.imported != null ? `${meta.imported} new` : "—")}</div>
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
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#111110" }}>Properties</span>
                  <form method="GET" action="/admin/acquisitions" style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <input type="hidden" name="tab" value="imports" />
                    <select name="zip" defaultValue={filterZip ?? ""} style={{ padding: "7px 12px", fontSize: "12px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", color: "#111110", fontFamily: "inherit" }}>
                      <option value="">All ZIPs</option>
                      {distinctZips.map((z) => <option key={z.zip} value={z.zip}>{z.zip}</option>)}
                    </select>
                    <input name="city" defaultValue={filterCity ?? ""} placeholder="City..." style={{ padding: "7px 12px", fontSize: "12px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", color: "#111110", fontFamily: "inherit", width: "140px" }} />
                    <button type="submit" style={{ padding: "7px 16px", background: "#111110", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Filter</button>
                    {(filterZip || filterCity) && (
                      <Link href="/admin/acquisitions?tab=imports" style={{ padding: "7px 12px", fontSize: "12px", color: "#8a8a84", textDecoration: "none", border: "1px solid #d0cfc8", borderRadius: "6px" }}>Clear</Link>
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
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.5fr 0.5fr 0.7fr 1fr 1fr", padding: "10px 20px", background: "#f5f4f0", borderBottom: "1px solid #e8e7e2" }}>
                  {["Address", "City / ZIP", "Beds", "Baths", "Sqft", "Value", "Owner"].map((h) => (
                    <div key={h} style={{ fontSize: "9.5px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>{h}</div>
                  ))}
                </div>
                {importedProperties.map((p, i) => (
                  <div key={p.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.5fr 0.5fr 0.7fr 1fr 1fr", padding: "13px 20px", borderBottom: i < importedProperties.length - 1 ? "1px solid #f0efeb" : "none", alignItems: "center" }}>
                    <div style={{ fontSize: "13px", color: "#111110", fontWeight: 500 }}>{p.streetAddress}</div>
                    <div style={{ fontSize: "12px", color: "#5a5a54" }}>{p.city}, {p.zip}</div>
                    <div style={{ fontSize: "12px", color: "#5a5a54" }}>{p.beds ?? "—"}</div>
                    <div style={{ fontSize: "12px", color: "#5a5a54" }}>{p.baths ?? "—"}</div>
                    <div style={{ fontSize: "12px", color: "#5a5a54" }}>{p.sqft ? fmt(p.sqft) : "—"}</div>
                    <div style={{ fontSize: "12px", color: "#5a5a54" }}>{fmtPrice(p.estimatedValue)}</div>
                    <div style={{ fontSize: "11px", color: "#8a8a84" }}>{p.owners[0]?.fullName ?? [p.owners[0]?.firstName, p.owners[0]?.lastName].filter(Boolean).join(" ") ?? "—"}</div>
                  </div>
                ))}
              </div>

              {filteredPropertyCount > PAGE_SIZE && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", fontSize: "12px", color: "#8a8a84" }}>
                  <span>Page {currentPage} of {Math.ceil(filteredPropertyCount / PAGE_SIZE)}</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {currentPage > 1 && <Link href={`/admin/acquisitions?tab=imports${filterZip ? `&zip=${filterZip}` : ""}${filterCity ? `&city=${filterCity}` : ""}&page=${currentPage - 1}`} style={{ padding: "7px 14px", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "6px", color: "#111110", textDecoration: "none", fontSize: "12px" }}>Previous</Link>}
                    {currentPage < Math.ceil(filteredPropertyCount / PAGE_SIZE) && <Link href={`/admin/acquisitions?tab=imports${filterZip ? `&zip=${filterZip}` : ""}${filterCity ? `&city=${filterCity}` : ""}&page=${currentPage + 1}`} style={{ padding: "7px 14px", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "6px", color: "#111110", textDecoration: "none", fontSize: "12px" }}>Next</Link>}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
