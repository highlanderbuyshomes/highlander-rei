"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createAgreement } from "../actions";

const inp: React.CSSProperties = { width: "100%", padding: "12px 14px", fontSize: "15px", color: "#111110", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "8px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
const lbl: React.CSSProperties = { fontSize: "12px", color: "#5a5a54", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px", display: "block", fontWeight: 600 };
const secHead: React.CSSProperties = { fontFamily: "var(--font-display), serif", fontSize: "13px", letterSpacing: "1.5px", color: "#111110", marginBottom: "14px", paddingBottom: "8px", borderBottom: "1px solid #e8e7e2" };

export default function NewAgreementForm({ defaultType }: { defaultType: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [pendingIntent, setPendingIntent] = useState<"draft" | "review" | null>(null);
  const [type, setType] = useState(defaultType);
  const [hasSeller2, setHasSeller2] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const isFlexEquity  = type === "flex_equity";
  const isCashOffer   = type === "cash_offer";
  const isListing     = type === "listing";
  const isAifNovation = type === "aif_novation";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const intent = submitter?.value === "review" ? "review" : "draft";
    setPending(true);
    setPendingIntent(intent);
    setSubmitError("");
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("intent", intent);
      const result = await createAgreement(formData);
      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }
      router.push(result.redirectTo);
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Agreement could not be created. Please try again.");
    } finally {
      setPending(false);
      setPendingIntent(null);
    }
  }

  return (
    <div className="new-agreement-wrap" style={{ padding: "32px" }}>
      <div style={{ marginBottom: "20px" }}>
        <Link href="/admin/agreements" style={{ fontSize: "12px", color: "#8a8a84", textDecoration: "none" }}>← Agreements</Link>
      </div>
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        <div className="new-agreement-title" style={{ fontFamily: "var(--font-display), serif", fontSize: "36px", color: "#111110", letterSpacing: "2px", marginBottom: "28px" }}>NEW AGREEMENT</div>

        <form onSubmit={handleSubmit}>
          <div className="new-agreement-card" style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "28px", display: "flex", flexDirection: "column", gap: "18px" }}>

            {/* ── Agreement type + address ── */}
            <div>
              <div style={secHead}>AGREEMENT INFO</div>
              <div style={{ display: "grid", gap: "14px" }}>
                <div>
                  <label style={lbl}>Agreement Type *</label>
                  <select
                    name="type"
                    required
                    value={type}
                    onChange={(e) => { setType(e.target.value); setHasSeller2(false); }}
                    style={inp}
                  >
                    <option value="">Select type…</option>
                    <option value="cash_offer">Cash Offer</option>
                    <option value="flex_equity">Flex Equity Program</option>
                    <option value="aif_novation">AIF / Novation Agreement</option>
                    <option value="listing">Listing Agreement</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Property Address *</label>
                  <input name="address" required placeholder="1234 W Camelback Rd, Phoenix, AZ 85013" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Agreement Date</label>
                  <input name="agreementDate" placeholder={new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} style={inp} />
                  <div style={{ fontSize: "11px", color: "#8a8a84", marginTop: "4px" }}>Leave blank to use today&apos;s date.</div>
                </div>
              </div>
            </div>

            {/* ── Sellers (all types) ── */}
            {type && (
              <div>
                <div style={secHead}>SELLERS</div>
                <div style={{ display: "grid", gap: "14px" }}>
                  <div className="new-agreement-grid-2">
                    <div>
                      <label style={lbl}>Seller 1 Full Name *</label>
                      <input name="seller1Name" required placeholder="John Smith" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Seller 1 Email *</label>
                      <input name="seller1Email" type="email" required placeholder="john@example.com" style={inp} />
                    </div>
                  </div>

                  {hasSeller2 ? (
                    <div style={{ display: "grid", gap: "14px" }}>
                      <div className="new-agreement-grid-2">
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                            <label style={{ ...lbl, marginBottom: 0 }}>Seller 2 Full Name</label>
                            <button type="button" onClick={() => setHasSeller2(false)} style={{ fontSize: "11px", color: "#c0392b", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Remove</button>
                          </div>
                          <input name="seller2Name" placeholder="Jane Smith" style={inp} />
                        </div>
                        <div>
                          <label style={lbl}>Seller 2 Email</label>
                          <input name="seller2Email" type="email" placeholder="jane@example.com" style={inp} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setHasSeller2(true)} style={{ padding: "9px 16px", background: "transparent", color: "#5a5a54", border: "1px dashed #d0cfc8", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                      + Add Seller 2
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── AIF / Novation note ── */}
            {isAifNovation && (
              <div style={{ background: "#f0f4ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "12px 14px", fontSize: "12.5px", color: "#1e40af" }}>
                Uses the uploaded AIF / Novation Agreement template. Signers will receive the template PDF with e-sign fields.
              </div>
            )}

            {/* ── Deal Terms: Flex Equity + Cash Offer ── */}
            {(isFlexEquity || isCashOffer) && (
              <div>
                <div style={secHead}>DEAL TERMS</div>
                <div style={{ display: "grid", gap: "14px" }}>
                  <div className="new-agreement-grid-2">
                    <div>
                      <label style={lbl}>Purchase Price *</label>
                      <input name="offerPrice" required placeholder="$150,000" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Earnest Money Deposit *</label>
                      <input name="earnestMoney" required placeholder="$1,000" style={inp} />
                    </div>
                  </div>
                  <div className="new-agreement-grid-2">
                    <div>
                      <label style={lbl}>Cash at Closing *</label>
                      <input name="cashAtClosing" required placeholder="$149,000" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Inspection Period</label>
                      <input name="inspectionPeriod" placeholder="10 Business Days" style={inp} />
                    </div>
                  </div>
                  <div className="new-agreement-grid-2">
                    <div>
                      <label style={lbl}>Title / Attorney Office</label>
                      <input name="titleOffice" placeholder="Magnus AZ Title Agency" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Days to Closing</label>
                      <input name="daysToClosing" placeholder="30" style={inp} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Listing Terms ── */}
            {isListing && (
              <div>
                <div style={secHead}>LISTING TERMS</div>
                <div style={{ display: "grid", gap: "14px" }}>
                  <div className="new-agreement-grid-2">
                    <div>
                      <label style={lbl}>Listing Price *</label>
                      <input name="listPrice" required placeholder="$250,000" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Broker Compensation</label>
                      <input name="brokerComp" placeholder="3%" style={inp} />
                    </div>
                  </div>
                  <div className="new-agreement-grid-2">
                    <div>
                      <label style={lbl}>Listing Start Date *</label>
                      <input name="listingStart" required placeholder="January 1, 2026" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Listing End Date *</label>
                      <input name="listingEnd" required placeholder="June 30, 2026" style={inp} />
                    </div>
                  </div>
                  <div className="new-agreement-grid-2">
                    <div>
                      <label style={lbl}>Agent Name</label>
                      <input name="agentName" placeholder="Chase Christianson" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Brokerage Name</label>
                      <input name="brokerageName" placeholder="Highlander REI LLC" style={inp} />
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Agency Relationship</label>
                    <select name="agencyRelationship" style={inp}>
                      <option value="">Select…</option>
                      <option value="Seller's Agent">Seller&apos;s Agent</option>
                      <option value="Transaction Broker">Transaction Broker</option>
                      <option value="Dual Agent">Dual Agent</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ── Buyer signer (all types) ── */}
            {type && (
              <div>
                <div style={secHead}>BUYER SIGNER</div>
                <div style={{ fontSize: "12px", color: "#8a8a84", marginBottom: "12px" }}>
                  Required for every agreement. Shared or test inboxes are allowed; each signer role receives its own signing link.
                </div>
                <div className="new-agreement-grid-2">
                  <div>
                    <label style={lbl}>Buyer Full Name *</label>
                    <input name="buyerSignerName" required placeholder="Full legal name or company representative" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Buyer Email *</label>
                    <input name="buyerSignerEmail" type="email" required placeholder="buyer@example.com" style={inp} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Notes ── */}
            <div>
              <label style={lbl}>Notes (internal)</label>
              <textarea name="notes" rows={2} placeholder="Any notes…" style={{ ...inp, resize: "vertical" }} />
            </div>

            <div className="new-agreement-actions" style={{ display: "flex", gap: "10px", paddingTop: "4px", borderTop: "1px solid #e8e7e2" }}>
              <button type="submit" name="intent" value="review" disabled={pending} style={{ flex: 2, padding: "14px 28px", background: pending ? "#d0cfc8" : "#1a56db", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: pending ? "default" : "pointer", fontFamily: "inherit" }}>
                {pendingIntent === "review" ? "Generating…" : "Review & Send →"}
              </button>
              <button type="submit" name="intent" value="draft" disabled={pending} style={{ flex: 1, padding: "14px 16px", background: pending ? "#d0cfc8" : "#ffffff", color: pending ? "#ffffff" : "#111110", border: "1px solid #d0cfc8", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: pending ? "default" : "pointer", fontFamily: "inherit" }}>
                {pendingIntent === "draft" ? "Saving…" : "Save Draft"}
              </button>
              <Link href="/admin/agreements" style={{ padding: "14px 16px", background: "transparent", color: "#5a5a54", border: "1px solid #d0cfc8", borderRadius: "8px", fontSize: "14px", textDecoration: "none", display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
                Cancel
              </Link>
            </div>

            {submitError && (
              <div role="alert" style={{ fontSize: "12px", color: "#c0392b", background: "rgba(192,57,43,0.06)", border: "1px solid rgba(192,57,43,0.2)", borderRadius: "8px", padding: "10px 14px" }}>
                <div>{submitError}</div>
                {submitError.includes("template is not ready") && (
                  <Link href={`/admin/templates/${type}`} style={{ display: "inline-block", marginTop: "8px", color: "#8f2c21", fontWeight: 700 }}>
                    Map template signing fields
                  </Link>
                )}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
