"use client";

import { useState } from "react";

export default function SignatureForm({ token, signerName }: { token: string; signerName: string }) {
  const [name, setName] = useState(signerName);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed || !name.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/agreements/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, signerName: name.trim() }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div style={{ background: "#eaf6f0", border: "1px solid #b8dfc8", borderRadius: "14px", padding: "40px 28px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
        <div style={{ fontFamily: "var(--font-display), serif", fontSize: "22px", color: "#3a7a50", letterSpacing: "1.5px", marginBottom: "8px" }}>AGREEMENT SIGNED</div>
        <div style={{ fontSize: "13px", color: "#5a5a54" }}>Thank you, {name}. Your signature has been recorded on {today}.</div>
      </div>
    );
  }

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "28px" }}>
      <div style={{ fontFamily: "var(--font-display), serif", fontSize: "15px", letterSpacing: "1.5px", color: "#111110", marginBottom: "20px", paddingBottom: "12px", borderBottom: "1px solid #e8e7e2" }}>
        SIGN THIS AGREEMENT
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        <div>
          <label style={{ fontSize: "11px", color: "#5a5a54", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px", display: "block", fontWeight: 500 }}>
            Full Legal Name *
          </label>
          <input
            type="text" required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Type your full name"
            style={{ width: "100%", padding: "12px 14px", fontSize: "15px", color: "#111110", background: "#fafaf8", border: "1px solid #d0cfc8", borderRadius: "8px", outline: "none", fontFamily: "inherit", boxSizing: "border-box", fontStyle: "italic" }}
          />
          <div style={{ fontSize: "11px", color: "#8a8a84", marginTop: "4px" }}>Typing your name acts as your electronic signature.</div>
        </div>

        <div style={{ background: "#f5f4f0", borderRadius: "8px", padding: "16px 18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12px" }}>
            <div>
              <div style={{ color: "#8a8a84", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10px" }}>Signature</div>
              <div style={{ color: "#111110", fontStyle: "italic", fontSize: "16px", fontWeight: 500 }}>{name || "_____________________"}</div>
            </div>
            <div>
              <div style={{ color: "#8a8a84", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10px" }}>Date</div>
              <div style={{ color: "#111110", fontSize: "13px" }}>{today}</div>
            </div>
          </div>
        </div>

        <label style={{ display: "flex", gap: "12px", cursor: "pointer", alignItems: "flex-start" }}>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: "2px", accentColor: "#111110", width: "16px", height: "16px", flexShrink: 0 }} />
          <span style={{ fontSize: "13px", color: "#5a5a54", lineHeight: 1.55 }}>
            I have read the full agreement above and I agree to be bound by its terms. I understand that my typed name constitutes a legally binding electronic signature.
          </span>
        </label>

        {error && <div style={{ fontSize: "13px", color: "#c0392b", background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.2)", borderRadius: "6px", padding: "10px 14px" }}>{error}</div>}

        <button
          type="submit"
          disabled={!agreed || !name.trim() || submitting}
          style={{
            padding: "13px", background: (!agreed || !name.trim() || submitting) ? "#d0cfc8" : "#111110",
            color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600,
            cursor: (!agreed || !name.trim() || submitting) ? "default" : "pointer", fontFamily: "inherit", letterSpacing: "0.3px",
          }}
        >
          {submitting ? "Submitting…" : "Sign Agreement"}
        </button>
      </form>
    </div>
  );
}
