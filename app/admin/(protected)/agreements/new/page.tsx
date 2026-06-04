"use client";

import { useState } from "react";
import Link from "next/link";
import { createAgreement } from "../actions";

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 12px", fontSize: "13px", color: "#111110",
  background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "6px",
  outline: "none", fontFamily: "inherit",
};
const lbl: React.CSSProperties = {
  fontSize: "11px", color: "#5a5a54", textTransform: "uppercase", letterSpacing: "0.8px",
  marginBottom: "5px", display: "block", fontWeight: 500,
};
const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" };

const TYPES = [
  {
    id: "cash_offer",
    title: "Cash Offer",
    icon: "🏠",
    desc: "Standard all-cash purchase offer to the seller.",
    fields: ["Address", "Sellers", "Company Buyer", "Offer Price", "Closing Date", "Earnest Money"],
  },
  {
    id: "flex_equity",
    title: "Flex Equity Program",
    icon: "📊",
    desc: "Equity sharing arrangement with the seller.",
    fields: ["Address", "Sellers", "Company Buyer", "Equity %", "Term Length"],
  },
  {
    id: "listing",
    title: "Listing Agreement",
    icon: "📋",
    desc: "MLS listing agreement with a real estate agent.",
    fields: ["Address", "Sellers", "Agent", "List Price", "Agency Relationship", "Broker Compensation"],
  },
];

const COMPANY_OPTIONS = ["Highlander REI LLC", "Highlander Buys Homes LLC"];
const AGENCY_OPTIONS = ["Seller's Agent", "Transaction Broker", "No Brokerage Relationship"];

export default function NewAgreementPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    try {
      await createAgreement(fd);
    } catch {
      // redirect happens inside action
    } finally {
      setPending(false);
    }
  }

  return (
    <div style={{ maxWidth: "680px" }}>
      <div style={{ marginBottom: "20px" }}>
        <Link href="/admin/agreements" style={{ fontSize: "12px", color: "#8a8a84", textDecoration: "none" }}>← Agreements</Link>
      </div>
      <div style={{ fontFamily: "var(--font-display), serif", fontSize: "36px", color: "#111110", letterSpacing: "2px", marginBottom: "28px" }}>NEW AGREEMENT</div>

      {!selectedType && (
        <>
          <div style={{ fontSize: "13px", color: "#5a5a54", marginBottom: "18px" }}>Select an agreement type to get started.</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
            {TYPES.map((t) => (
              <button key={t.id} onClick={() => setSelectedType(t.id)} style={{
                background: "#ffffff", border: "2px solid #e8e7e2", borderRadius: "14px",
                padding: "24px 18px", cursor: "pointer", textAlign: "left", transition: "border-color 0.15s, box-shadow 0.15s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#111110"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e8e7e2"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ fontSize: "28px", marginBottom: "10px" }}>{t.icon}</div>
                <div style={{ fontFamily: "var(--font-display), serif", fontSize: "17px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>{t.title.toUpperCase()}</div>
                <div style={{ fontSize: "12px", color: "#5a5a54", lineHeight: 1.55, marginBottom: "14px" }}>{t.desc}</div>
                <div style={{ borderTop: "1px solid #e8e7e2", paddingTop: "10px" }}>
                  {t.fields.map((f) => (
                    <div key={f} style={{ fontSize: "11px", color: "#8a8a84", marginBottom: "2px" }}>· {f}</div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {selectedType && (
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="type" value={selectedType} />

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
            <button type="button" onClick={() => setSelectedType(null)} style={{ fontSize: "12px", color: "#8a8a84", background: "none", border: "none", cursor: "pointer", padding: 0 }}>← Back</button>
            <span style={{ fontSize: "12px", color: "#8a8a84" }}>|</span>
            <span style={{ fontSize: "13px", color: "#111110", fontWeight: 500 }}>
              {TYPES.find((t) => t.id === selectedType)?.icon} {TYPES.find((t) => t.id === selectedType)?.title}
            </span>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "28px", display: "flex", flexDirection: "column", gap: "18px" }}>

            <div>
              <div style={{ fontFamily: "var(--font-display), serif", fontSize: "14px", letterSpacing: "1.5px", color: "#111110", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid #e8e7e2" }}>PROPERTY & PARTIES</div>
              <div style={{ display: "grid", gap: "14px" }}>
                <div>
                  <label style={lbl}>Property Address *</label>
                  <input name="address" required placeholder="1234 W Camelback Rd, Phoenix, AZ 85013" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Seller(s) * <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— separate multiple with a comma</span></label>
                  <input name="sellers" required placeholder="John Smith, Jane Smith" style={inp} />
                </div>
              </div>
            </div>

            {selectedType === "cash_offer" && (
              <div>
                <div style={{ fontFamily: "var(--font-display), serif", fontSize: "14px", letterSpacing: "1.5px", color: "#111110", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid #e8e7e2" }}>OFFER DETAILS</div>
                <div style={{ display: "grid", gap: "14px" }}>
                  <div>
                    <label style={lbl}>Company Buyer *</label>
                    <select name="companyBuyer" required style={inp}>
                      <option value="">Select company…</option>
                      {COMPANY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div style={grid2}>
                    <div><label style={lbl}>Offer Price *</label><input name="offerPrice" required placeholder="$185,000" style={inp} /></div>
                    <div><label style={lbl}>Earnest Money</label><input name="earnestMoney" placeholder="$1,000" style={inp} /></div>
                  </div>
                  <div><label style={lbl}>Closing Date</label><input name="closingDate" type="date" style={inp} /></div>
                </div>
              </div>
            )}

            {selectedType === "flex_equity" && (
              <div>
                <div style={{ fontFamily: "var(--font-display), serif", fontSize: "14px", letterSpacing: "1.5px", color: "#111110", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid #e8e7e2" }}>EQUITY TERMS</div>
                <div style={{ display: "grid", gap: "14px" }}>
                  <div>
                    <label style={lbl}>Company Buyer *</label>
                    <select name="companyBuyer" required style={inp}>
                      <option value="">Select company…</option>
                      {COMPANY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div style={grid2}>
                    <div><label style={lbl}>Equity Percentage</label><input name="equityPct" placeholder="e.g. 50%" style={inp} /></div>
                    <div><label style={lbl}>Term Length</label><input name="termLength" placeholder="e.g. 12 months" style={inp} /></div>
                  </div>
                  <div style={grid2}>
                    <div><label style={lbl}>Offer Price</label><input name="offerPrice" placeholder="$185,000" style={inp} /></div>
                    <div><label style={lbl}>Closing Date</label><input name="closingDate" type="date" style={inp} /></div>
                  </div>
                </div>
              </div>
            )}

            {selectedType === "listing" && (
              <div>
                <div style={{ fontFamily: "var(--font-display), serif", fontSize: "14px", letterSpacing: "1.5px", color: "#111110", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid #e8e7e2" }}>LISTING DETAILS</div>
                <div style={{ display: "grid", gap: "14px" }}>
                  <div style={grid2}>
                    <div><label style={lbl}>Agent Name *</label><input name="agentName" required placeholder="Sarah Johnson" style={inp} /></div>
                    <div><label style={lbl}>Brokerage Name</label><input name="brokerageName" placeholder="Keller Williams" style={inp} /></div>
                  </div>
                  <div style={grid2}>
                    <div><label style={lbl}>Agent Email</label><input name="agentEmail" type="email" placeholder="agent@brokerage.com" style={inp} /></div>
                    <div><label style={lbl}>Agent Phone</label><input name="agentPhone" type="tel" placeholder="(602) 555-0100" style={inp} /></div>
                  </div>
                  <div style={grid2}>
                    <div><label style={lbl}>Agent License #</label><input name="agentLicense" placeholder="SA12345678" style={inp} /></div>
                    <div><label style={lbl}>List Price *</label><input name="listPrice" required placeholder="$320,000" style={inp} /></div>
                  </div>
                  <div style={grid2}>
                    <div>
                      <label style={lbl}>Agency Relationship *</label>
                      <select name="agencyRelationship" required style={inp}>
                        <option value="">Select…</option>
                        {AGENCY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div><label style={lbl}>Broker Compensation *</label><input name="brokerComp" required placeholder="3%" style={inp} /></div>
                  </div>
                  <div style={grid2}>
                    <div><label style={lbl}>Listing Start</label><input name="listingStart" type="date" style={inp} /></div>
                    <div><label style={lbl}>Listing End</label><input name="listingEnd" type="date" style={inp} /></div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label style={lbl}>Notes (internal)</label>
              <textarea name="notes" rows={3} placeholder="Any notes for the TC or internal record…" style={{ ...inp, resize: "vertical" }} />
            </div>

            <div style={{ display: "flex", gap: "10px", paddingTop: "4px", borderTop: "1px solid #e8e7e2" }}>
              <button type="submit" disabled={pending} style={{
                padding: "11px 28px", background: pending ? "#d0cfc8" : "#111110", color: "#ffffff",
                border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: pending ? "default" : "pointer",
                fontFamily: "inherit", letterSpacing: "0.3px",
              }}>
                {pending ? "Creating…" : "Create Agreement"}
              </button>
              <button type="button" onClick={() => setSelectedType(null)} style={{ padding: "11px 20px", background: "transparent", color: "#5a5a54", border: "1px solid #d0cfc8", borderRadius: "6px", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
