import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateAgreementStatus, deleteAgreement, updateAgreement } from "../actions";

const TYPE_LABELS: Record<string, string> = {
  cash_offer:  "Cash Offer",
  flex_equity: "Flex Equity Program",
  listing:     "Listing Agreement",
};

const STATUS_FLOW = ["draft", "sent", "signed", "completed"] as const;
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  draft:     { label: "Draft",     color: "#5a5a54", bg: "#f0efeb",               border: "#d0cfc8" },
  sent:      { label: "Sent",      color: "#1a56db", bg: "rgba(26,86,219,0.08)",   border: "rgba(26,86,219,0.25)" },
  signed:    { label: "Signed",    color: "#6b46c1", bg: "rgba(107,70,193,0.08)",  border: "rgba(107,70,193,0.25)" },
  completed: { label: "Completed", color: "#3a7a50", bg: "#eaf6f0",               border: "#b8dfc8" },
  void:      { label: "Void",      color: "#c0392b", bg: "rgba(192,57,43,0.06)",   border: "rgba(192,57,43,0.2)" },
};

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 12px", fontSize: "13px", color: "#111110",
  background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "6px",
  outline: "none", fontFamily: "inherit",
};
const lbl: React.CSSProperties = {
  fontSize: "11px", color: "#5a5a54", textTransform: "uppercase",
  letterSpacing: "0.8px", marginBottom: "5px", display: "block", fontWeight: 500,
};

const COMPANY_OPTIONS = ["Highlander REI LLC", "Highlander Buys Homes LLC"];
const AGENCY_OPTIONS = ["Seller's Agent", "Transaction Broker", "No Brokerage Relationship"];

export default async function AgreementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const a = await prisma.agreement.findUnique({ where: { id } });
  if (!a) notFound();

  const statusCfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.draft;
  const currentFlowIdx = STATUS_FLOW.indexOf(a.status as typeof STATUS_FLOW[number]);

  const updateStatusWithId = updateAgreementStatus.bind(null, a.id);
  const deleteWithId = deleteAgreement.bind(null, a.id);
  const updateWithId = updateAgreement.bind(null, a.id);

  const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" };

  return (
    <div style={{ maxWidth: "820px" }}>
      <div style={{ marginBottom: "20px" }}>
        <Link href="/admin/agreements" style={{ fontSize: "12px", color: "#8a8a84", textDecoration: "none" }}>← Agreements</Link>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontFamily: "var(--font-display), serif", fontSize: "28px", color: "#111110", letterSpacing: "2px" }}>
              {TYPE_LABELS[a.type]?.toUpperCase() ?? a.type.toUpperCase()}
            </span>
            <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.5px", padding: "3px 10px", borderRadius: "20px", background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}` }}>
              {statusCfg.label}
            </span>
          </div>
          <div style={{ fontSize: "13px", color: "#5a5a54" }}>{a.address}</div>
          <div style={{ fontSize: "11px", color: "#8a8a84", marginTop: "3px" }}>
            Created {new Date(a.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <a href={`/api/agreements/pdf?id=${a.id}`} target="_blank" rel="noopener noreferrer" style={{
            display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px",
            border: "1px solid #d0cfc8", borderRadius: "6px", fontSize: "12.5px",
            color: "#111110", textDecoration: "none", fontWeight: 500, background: "#ffffff",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download PDF
          </a>
        </div>
      </div>

      {/* Status progression */}
      {a.status !== "void" && (
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "16px 20px", marginBottom: "20px" }}>
          <div style={{ fontSize: "10px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Status</div>
          <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
            {STATUS_FLOW.map((s, i) => {
              const done = i <= currentFlowIdx;
              const current = i === currentFlowIdx;
              const cfg = STATUS_CONFIG[s];
              return (
                <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STATUS_FLOW.length - 1 ? 1 : 0 }}>
                  <form action={updateStatusWithId}>
                    <input type="hidden" name="status" value={s} />
                    <button type="submit" style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                      background: "none", border: "none", cursor: i !== currentFlowIdx ? "pointer" : "default", padding: "0 4px",
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: done ? (current ? cfg.bg : "#eaf6f0") : "#f0efeb",
                        border: `2px solid ${done ? (current ? cfg.border : "#b8dfc8") : "#d0cfc8"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {done && !current && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#3a7a50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        {current && <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color }} />}
                      </div>
                      <span style={{ fontSize: "10px", fontWeight: current ? 600 : 400, color: current ? cfg.color : done ? "#3a7a50" : "#8a8a84" }}>
                        {cfg.label}
                      </span>
                    </button>
                  </form>
                  {i < STATUS_FLOW.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: i < currentFlowIdx ? "#b8dfc8" : "#e8e7e2", margin: "0 2px", marginBottom: "18px" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit form */}
      <form action={updateWithId}>
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "28px", display: "flex", flexDirection: "column", gap: "22px", marginBottom: "16px" }}>

          <div>
            <div style={{ fontFamily: "var(--font-display), serif", fontSize: "14px", letterSpacing: "1.5px", color: "#111110", marginBottom: "14px", paddingBottom: "8px", borderBottom: "1px solid #e8e7e2" }}>PROPERTY &amp; PARTIES</div>
            <div style={{ display: "grid", gap: "14px" }}>
              <div><label style={lbl}>Property Address *</label><input name="address" required defaultValue={a.address} style={inp} /></div>
              <div><label style={lbl}>Seller(s)</label><input name="sellers" required defaultValue={a.sellers} style={inp} /></div>
            </div>
          </div>

          {a.type === "cash_offer" && (
            <div>
              <div style={{ fontFamily: "var(--font-display), serif", fontSize: "14px", letterSpacing: "1.5px", color: "#111110", marginBottom: "14px", paddingBottom: "8px", borderBottom: "1px solid #e8e7e2" }}>OFFER DETAILS</div>
              <div style={{ display: "grid", gap: "14px" }}>
                <div>
                  <label style={lbl}>Company Buyer</label>
                  <select name="companyBuyer" defaultValue={a.companyBuyer ?? ""} style={inp}>
                    <option value="">Select company…</option>
                    {COMPANY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div style={grid2}>
                  <div><label style={lbl}>Offer Price</label><input name="offerPrice" defaultValue={a.offerPrice ?? ""} placeholder="$185,000" style={inp} /></div>
                  <div><label style={lbl}>Earnest Money</label><input name="earnestMoney" defaultValue={a.earnestMoney ?? ""} placeholder="$1,000" style={inp} /></div>
                </div>
                <div><label style={lbl}>Closing Date</label><input name="closingDate" type="date" defaultValue={a.closingDate ?? ""} style={inp} /></div>
              </div>
            </div>
          )}

          {a.type === "flex_equity" && (
            <div>
              <div style={{ fontFamily: "var(--font-display), serif", fontSize: "14px", letterSpacing: "1.5px", color: "#111110", marginBottom: "14px", paddingBottom: "8px", borderBottom: "1px solid #e8e7e2" }}>EQUITY TERMS</div>
              <div style={{ display: "grid", gap: "14px" }}>
                <div>
                  <label style={lbl}>Company Buyer</label>
                  <select name="companyBuyer" defaultValue={a.companyBuyer ?? ""} style={inp}>
                    <option value="">Select company…</option>
                    {COMPANY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div style={grid2}>
                  <div><label style={lbl}>Offer Price</label><input name="offerPrice" defaultValue={a.offerPrice ?? ""} style={inp} /></div>
                  <div><label style={lbl}>Closing Date</label><input name="closingDate" type="date" defaultValue={a.closingDate ?? ""} style={inp} /></div>
                </div>
                <div style={grid2}>
                  <div><label style={lbl}>Equity %</label><input name="equityPct" defaultValue={a.equityPct ?? ""} placeholder="50%" style={inp} /></div>
                  <div><label style={lbl}>Term Length</label><input name="termLength" defaultValue={a.termLength ?? ""} placeholder="12 months" style={inp} /></div>
                </div>
              </div>
            </div>
          )}

          {a.type === "listing" && (
            <div>
              <div style={{ fontFamily: "var(--font-display), serif", fontSize: "14px", letterSpacing: "1.5px", color: "#111110", marginBottom: "14px", paddingBottom: "8px", borderBottom: "1px solid #e8e7e2" }}>LISTING DETAILS</div>
              <div style={{ display: "grid", gap: "14px" }}>
                <div style={grid2}>
                  <div><label style={lbl}>Agent Name</label><input name="agentName" defaultValue={a.agentName ?? ""} style={inp} /></div>
                  <div><label style={lbl}>Brokerage</label><input name="brokerageName" defaultValue={a.brokerageName ?? ""} style={inp} /></div>
                </div>
                <div style={grid2}>
                  <div><label style={lbl}>Agent Email</label><input name="agentEmail" type="email" defaultValue={a.agentEmail ?? ""} style={inp} /></div>
                  <div><label style={lbl}>Agent Phone</label><input name="agentPhone" defaultValue={a.agentPhone ?? ""} style={inp} /></div>
                </div>
                <div style={grid2}>
                  <div><label style={lbl}>License #</label><input name="agentLicense" defaultValue={a.agentLicense ?? ""} style={inp} /></div>
                  <div><label style={lbl}>List Price</label><input name="listPrice" defaultValue={a.listPrice ?? ""} style={inp} /></div>
                </div>
                <div style={grid2}>
                  <div>
                    <label style={lbl}>Agency Relationship</label>
                    <select name="agencyRelationship" defaultValue={a.agencyRelationship ?? ""} style={inp}>
                      <option value="">Select…</option>
                      {AGENCY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div><label style={lbl}>Broker Compensation</label><input name="brokerComp" defaultValue={a.brokerComp ?? ""} placeholder="3%" style={inp} /></div>
                </div>
                <div style={grid2}>
                  <div><label style={lbl}>Listing Start</label><input name="listingStart" type="date" defaultValue={a.listingStart ?? ""} style={inp} /></div>
                  <div><label style={lbl}>Listing End</label><input name="listingEnd" type="date" defaultValue={a.listingEnd ?? ""} style={inp} /></div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label style={lbl}>Notes (internal)</label>
            <textarea name="notes" rows={3} defaultValue={a.notes ?? ""} style={{ ...inp, resize: "vertical" }} />
          </div>

          <div style={{ borderTop: "1px solid #e8e7e2", paddingTop: "14px" }}>
            <button type="submit" style={{ padding: "9px 22px", background: "#111110", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Save Changes
            </button>
          </div>
        </div>
      </form>

      {/* Danger zone */}
      <div style={{ background: "#ffffff", border: "1px solid rgba(192,57,43,0.2)", borderRadius: "14px", padding: "20px 24px" }}>
        <div style={{ fontSize: "11px", color: "#c0392b", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, marginBottom: "12px" }}>Danger Zone</div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {a.status !== "void" && (
            <form action={updateStatusWithId}>
              <input type="hidden" name="status" value="void" />
              <button type="submit" style={{ padding: "8px 16px", background: "rgba(192,57,43,0.08)", color: "#c0392b", border: "1px solid rgba(192,57,43,0.25)", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>
                Void Agreement
              </button>
            </form>
          )}
          <form action={deleteWithId}>
            <button type="submit" onClick={(e) => { if (!confirm("Permanently delete this agreement?")) e.preventDefault(); }} style={{ padding: "8px 16px", background: "rgba(192,57,43,0.08)", color: "#c0392b", border: "1px solid rgba(192,57,43,0.25)", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>
              Delete Permanently
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
