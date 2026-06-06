import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateAgreementStatus, deleteAgreement, updateAgreement, addSigner, removeSigner, sendSigningLinks } from "../actions";
import CopyButton from "../CopyButton";
import SignerSection from "./SignerSection";
import DeleteAgreementForm from "./DeleteAgreementForm";

const TYPE_LABELS: Record<string, string> = {
  cash_offer:  "Cash Offer",
  flex_equity: "Flex Equity Program",
  listing:     "Listing Agreement",
};

const STATUS_FLOW = ["draft", "sent", "completed"] as const;
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  draft:     { label: "New",       color: "#5a5a54", bg: "#f0efeb",               border: "#d0cfc8" },
  sent:      { label: "Pending",   color: "#1a56db", bg: "rgba(26,86,219,0.08)",   border: "rgba(26,86,219,0.25)" },
  signed:    { label: "Completed", color: "#3a7a50", bg: "#eaf6f0",               border: "#b8dfc8" },
  completed: { label: "Completed", color: "#3a7a50", bg: "#eaf6f0",               border: "#b8dfc8" },
  void:      { label: "Void",      color: "#c0392b", bg: "rgba(192,57,43,0.06)",   border: "rgba(192,57,43,0.2)" },
};

const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", fontSize: "13px", color: "#111110", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "6px", outline: "none", fontFamily: "inherit" };
const lbl: React.CSSProperties = { fontSize: "11px", color: "#5a5a54", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px", display: "block", fontWeight: 500 };

export default async function AgreementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [a, contacts] = await Promise.all([
    prisma.agreement.findUnique({
      where: { id },
      include: { signers: { orderBy: { order: "asc" } } },
    }),
    prisma.contact.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!a) notFound();

  const statusCfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.draft;
  const currentFlowIdx = a.status === "signed" ? 2 : STATUS_FLOW.indexOf(a.status as typeof STATUS_FLOW[number]);
  const updateStatusWithId = updateAgreementStatus.bind(null, a.id);
  const deleteWithId       = deleteAgreement.bind(null, a.id);
  const updateWithId       = updateAgreement.bind(null, a.id);
  const addSignerWithId    = addSigner.bind(null, a.id);
  const sendLinksWithId    = sendSigningLinks.bind(null, a.id);

  const signingUrl = a.signerToken ? `https://highlanderrei.com/sign/${a.signerToken}` : null;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://highlanderrei.com";
  const canComplete = a.signers.length > 0
    ? a.signers.every((signer) => !!signer.signedAt)
    : !!a.signedAt;

  return (
    <div style={{ maxWidth: "820px", padding: "32px" }}>
      <div style={{ marginBottom: "20px" }}>
        <Link href="/admin/agreements" style={{ fontSize: "12px", color: "#8a8a84", textDecoration: "none" }}>← Agreements</Link>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontFamily: "var(--font-display), serif", fontSize: "26px", color: "#111110", letterSpacing: "2px" }}>
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
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {a.pdfUrl && (
            <a href={a.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", border: "1px solid #d0cfc8", borderRadius: "6px", fontSize: "12.5px", color: "#111110", textDecoration: "none", fontWeight: 500, background: "#ffffff" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              View PDF
            </a>
          )}
        </div>
      </div>

      {/* PDF Preview */}
      {a.pdfUrl && (
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", overflow: "hidden", marginBottom: "16px", height: "500px" }}>
          <iframe src={a.pdfUrl} style={{ width: "100%", height: "100%", border: "none" }} title="Agreement PDF" />
        </div>
      )}

      {/* Status progression */}
      {a.status !== "void" && (
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "16px 20px", marginBottom: "16px" }}>
          <div style={{ fontSize: "10px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Status</div>
          <div style={{ display: "flex", alignItems: "center" }}>
            {STATUS_FLOW.map((s, i) => {
              const done = i <= currentFlowIdx;
              const current = i === currentFlowIdx;
              const cfg = STATUS_CONFIG[s];
              const locked = s === "completed" && !canComplete;
              return (
                <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STATUS_FLOW.length - 1 ? 1 : 0 }}>
                  <form action={updateStatusWithId}>
                    <input type="hidden" name="status" value={s} />
                    <button type="submit" disabled={locked} title={locked ? "All signers must sign before completion" : undefined} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: locked || i === currentFlowIdx ? "default" : "pointer", opacity: locked ? 0.55 : 1, padding: "0 4px" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: done ? (current ? cfg.bg : "#eaf6f0") : "#f0efeb", border: `2px solid ${done ? (current ? cfg.border : "#b8dfc8") : "#d0cfc8"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {done && !current && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#3a7a50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        {current && <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color }} />}
                      </div>
                      <span style={{ fontSize: "10px", fontWeight: current ? 600 : 400, color: current ? cfg.color : done ? "#3a7a50" : "#8a8a84" }}>{cfg.label}</span>
                    </button>
                  </form>
                  {i < STATUS_FLOW.length - 1 && <div style={{ flex: 1, height: 2, background: i < currentFlowIdx ? "#b8dfc8" : "#e8e7e2", margin: "0 2px", marginBottom: "18px" }} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Signers */}
      <SignerSection
        agreementId={a.id}
        signers={a.signers.map(s => ({
          id: s.id, name: s.name, email: s.email, order: s.order,
          emailedAt: s.emailedAt, signedAt: s.signedAt, token: s.token,
        }))}
        contacts={contacts.map(c => ({ id: c.id, name: c.name, email: c.email, phone: c.phone, company: c.company }))}
        addSignerAction={addSignerWithId}
        removeSignerAction={removeSigner}
        sendLinksAction={sendLinksWithId}
        baseUrl={baseUrl}
        emailEnabled={!!process.env.RESEND_API_KEY}
      />

      {/* Legacy signing link (for old single-signer agreements) */}
      {signingUrl && a.signers.length === 0 && (
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "20px 24px", marginBottom: "16px" }}>
          <div style={{ fontSize: "10px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, marginBottom: "12px" }}>Legacy Signing Link</div>
          {a.signedAt ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>✅</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#3a7a50" }}>Signed by {a.signerName ?? "signer"}</div>
                <div style={{ fontSize: "11px", color: "#8a8a84", marginTop: "2px" }}>
                  {new Date(a.signedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input readOnly value={signingUrl} style={{ flex: 1, padding: "9px 12px", fontSize: "12px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#f5f4f0", color: "#5a5a54", fontFamily: "monospace", outline: "none" }} />
              <CopyButton text={signingUrl} />
            </div>
          )}
        </div>
      )}

      {/* Edit form */}
      <form action={updateWithId}>
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "28px", display: "flex", flexDirection: "column", gap: "20px", marginBottom: "16px" }}>
          <div>
            <div style={{ fontFamily: "var(--font-display), serif", fontSize: "13px", letterSpacing: "1.5px", color: "#111110", marginBottom: "14px", paddingBottom: "8px", borderBottom: "1px solid #e8e7e2" }}>DETAILS</div>
            <div style={{ display: "grid", gap: "14px" }}>
              <div><label style={lbl}>Property Address *</label><input name="address" required defaultValue={a.address} style={inp} /></div>
              <div><label style={lbl}>Seller(s)</label><input name="sellers" required defaultValue={a.sellers} style={inp} /></div>
              <div><label style={lbl}>Replace PDF (optional)</label><input name="pdfFile" type="file" accept="application/pdf" style={{ ...inp, padding: "8px 12px" }} /></div>
              <div><label style={lbl}>Notes (internal)</label><textarea name="notes" rows={2} defaultValue={a.notes ?? ""} style={{ ...inp, resize: "vertical" }} /></div>
            </div>
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
          <DeleteAgreementForm action={deleteWithId} />
        </div>
      </div>
    </div>
  );
}
