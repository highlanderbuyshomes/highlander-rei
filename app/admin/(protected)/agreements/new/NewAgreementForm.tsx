"use client";

import { useState } from "react";
import Link from "next/link";
import { createAgreement } from "../actions";

const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", fontSize: "13px", color: "#111110", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "6px", outline: "none", fontFamily: "inherit" };
const lbl: React.CSSProperties = { fontSize: "11px", color: "#5a5a54", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px", display: "block", fontWeight: 500 };
const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" };

export default function NewAgreementForm({ defaultType }: { defaultType: string }) {
  const [pending, setPending] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    try {
      await createAgreement(new FormData(e.currentTarget));
    } catch { /* redirect inside action */ }
    finally { setPending(false); }
  }

  return (
    <div style={{ maxWidth: "620px" }}>
      <div style={{ marginBottom: "20px" }}>
        <Link href="/admin/agreements" style={{ fontSize: "12px", color: "#8a8a84", textDecoration: "none" }}>← Agreements</Link>
      </div>
      <div style={{ fontFamily: "var(--font-display), serif", fontSize: "36px", color: "#111110", letterSpacing: "2px", marginBottom: "28px" }}>NEW AGREEMENT</div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "28px", display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* PDF Upload */}
          <div>
            <div style={{ fontFamily: "var(--font-display), serif", fontSize: "13px", letterSpacing: "1.5px", color: "#111110", marginBottom: "14px", paddingBottom: "8px", borderBottom: "1px solid #e8e7e2" }}>DOCUMENT</div>
            <label style={lbl}>Upload Agreement PDF</label>
            <label style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              border: `2px dashed ${fileName ? "#3a7a50" : "#d0cfc8"}`,
              borderRadius: "8px", padding: "20px", cursor: "pointer",
              background: fileName ? "#eaf6f0" : "#fafaf8", transition: "all 0.15s",
            }}>
              <input name="pdfFile" type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} />
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={fileName ? "#3a7a50" : "#d0cfc8"} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              <span style={{ fontSize: "13px", color: fileName ? "#3a7a50" : "#8a8a84", fontWeight: fileName ? 500 : 400 }}>
                {fileName ?? "Click to upload PDF"}
              </span>
            </label>
          </div>

          {/* Agreement Info */}
          <div>
            <div style={{ fontFamily: "var(--font-display), serif", fontSize: "13px", letterSpacing: "1.5px", color: "#111110", marginBottom: "14px", paddingBottom: "8px", borderBottom: "1px solid #e8e7e2" }}>AGREEMENT INFO</div>
            <div style={{ display: "grid", gap: "14px" }}>
              <div>
                <label style={lbl}>Agreement Type *</label>
                <select name="type" required defaultValue={defaultType} style={inp}>
                  <option value="">Select type…</option>
                  <option value="cash_offer">Cash Offer</option>
                  <option value="flex_equity">Flex Equity Program</option>
                  <option value="listing">Listing Agreement</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Property Address *</label>
                <input name="address" required placeholder="1234 W Camelback Rd, Phoenix, AZ 85013" style={inp} />
              </div>
              <div>
                <label style={lbl}>Seller(s) *</label>
                <input name="sellers" required placeholder="John Smith, Jane Smith" style={inp} />
              </div>
            </div>
          </div>

          {/* Signer Info */}
          <div>
            <div style={{ fontFamily: "var(--font-display), serif", fontSize: "13px", letterSpacing: "1.5px", color: "#111110", marginBottom: "14px", paddingBottom: "8px", borderBottom: "1px solid #e8e7e2" }}>SIGNER</div>
            <div style={grid2}>
              <div>
                <label style={lbl}>Signer Full Name</label>
                <input name="signerName" placeholder="John Smith" style={inp} />
              </div>
              <div>
                <label style={lbl}>Signer Email</label>
                <input name="signerEmail" type="email" placeholder="john@example.com" style={inp} />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={lbl}>Notes (internal)</label>
            <textarea name="notes" rows={2} placeholder="Any notes…" style={{ ...inp, resize: "vertical" }} />
          </div>

          <div style={{ display: "flex", gap: "10px", paddingTop: "4px", borderTop: "1px solid #e8e7e2" }}>
            <button type="submit" disabled={pending} style={{ padding: "11px 28px", background: pending ? "#d0cfc8" : "#111110", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: pending ? "default" : "pointer", fontFamily: "inherit" }}>
              {pending ? "Creating…" : "Create Agreement"}
            </button>
            <Link href="/admin/agreements" style={{ padding: "11px 20px", background: "transparent", color: "#5a5a54", border: "1px solid #d0cfc8", borderRadius: "6px", fontSize: "13px", textDecoration: "none", display: "flex", alignItems: "center" }}>
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
