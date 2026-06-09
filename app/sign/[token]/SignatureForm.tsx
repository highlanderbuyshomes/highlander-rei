"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Field = {
  id: string;
  type: string;
  label: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function SignatureForm({
  token,
  signerName,
  fields,
}: {
  token: string;
  signerName: string;
  fields: Field[];
}) {
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const [tab, setTab]               = useState<"draw" | "type">("draw");
  const [typedName, setTypedName]   = useState(signerName);
  const [agreed, setAgreed]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState("");
  const [hasDrawing, setHasDrawing] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    fields.forEach(f => { if (f.type === "date") init[f.id] = today; });
    return init;
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing   = useRef(false);
  const lastPos   = useRef<{ x: number; y: number } | null>(null);

  function getPos(e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  const startDraw = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawing.current = true;
    lastPos.current = getPos(e, canvas);
  }, []);

  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !lastPos.current) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
    setHasDrawing(true);
  }, []);

  const stopDraw = useCallback(() => { drawing.current = false; lastPos.current = null; }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDraw);
    canvas.addEventListener("mouseleave", stopDraw);
    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDraw);
    return () => {
      canvas.removeEventListener("mousedown", startDraw);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDraw);
      canvas.removeEventListener("mouseleave", stopDraw);
      canvas.removeEventListener("touchstart", startDraw);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stopDraw);
    };
  }, [startDraw, draw, stopDraw]);

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
  }

  function getSignatureData(): string | null {
    if (tab === "type") return typedName.trim() || null;
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawing) return null;
    return canvas.toDataURL("image/png");
  }

  const canSubmit = agreed && typedName.trim().length > 0 && (tab === "draw" ? hasDrawing : true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sig = getSignatureData();
    if (!sig || !agreed) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/agreements/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          signerName: typedName.trim(),
          signatureData: sig,
          signatureType: tab,
          fieldData: fields.length > 0 ? fieldValues : undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div style={{ background: "#ffffff", border: "1.5px solid #bfdbfe", borderRadius: "16px", padding: "48px 24px", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, background: "#1a56db", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>Agreement Signed</div>
        <div style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.7 }}>
          Your signature has been recorded on <strong style={{ color: "#0f172a" }}>{today}</strong>.<br />
          You will receive a copy once all parties have signed.
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: "16px", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "3px" }}>Sign Agreement</div>
        <div style={{ fontSize: "12px", color: "#64748b" }}>Choose how you&apos;d like to apply your signature.</div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Name field if not pre-filled */}
          {!signerName && (
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px", display: "block" }}>
                Full legal name *
              </label>
              <input
                type="text"
                required
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="John Smith"
                style={{ width: "100%", padding: "13px 14px", fontSize: "15px", color: "#0f172a", background: "#ffffff", border: "1.5px solid #cbd5e1", borderRadius: "10px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>
          )}

          {/* Draw / Type toggle */}
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "10px", padding: "4px" }}>
            {(["draw", "type"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: "11px", borderRadius: "8px",
                  fontSize: "13px", fontWeight: tab === t ? 700 : 500,
                  color: tab === t ? "#1a56db" : "#64748b",
                  background: tab === t ? "#ffffff" : "transparent",
                  border: "none", cursor: "pointer", fontFamily: "inherit",
                  boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {t === "draw" ? "✍️  Draw" : "⌨️  Type"}
              </button>
            ))}
          </div>

          {/* Draw pad */}
          {tab === "draw" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>Draw your signature</label>
                {hasDrawing && (
                  <button type="button" onClick={clearCanvas} style={{ fontSize: "12px", color: "#ef4444", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, fontWeight: 600 }}>
                    Clear
                  </button>
                )}
              </div>
              <div style={{ position: "relative", border: "1.5px solid #cbd5e1", borderRadius: "12px", overflow: "hidden", background: "#ffffff", cursor: "crosshair" }}>
                <canvas
                  ref={canvasRef}
                  width={720}
                  height={200}
                  style={{ display: "block", width: "100%", height: "200px", touchAction: "none" }}
                />
                {!hasDrawing && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none", gap: "6px" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>
                    </svg>
                    <span style={{ fontSize: "13px", color: "#94a3b8" }}>Sign here with your finger</span>
                  </div>
                )}
                {/* Signature baseline */}
                <div style={{ position: "absolute", bottom: "32px", left: "20px", right: "20px", height: "1px", background: "#e2e8f0" }} />
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px" }}>Use your finger or stylus to sign above.</div>
            </div>
          )}

          {/* Type signature */}
          {tab === "type" && (
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px", display: "block" }}>
                Type your full legal name *
              </label>
              <input
                type="text"
                required={tab === "type"}
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="John Smith"
                style={{ width: "100%", padding: "14px 16px", fontSize: "24px", color: "#0f172a", background: "#ffffff", border: "1.5px solid #1a56db", borderRadius: "10px", outline: "none", fontFamily: "Georgia, serif", boxSizing: "border-box", fontStyle: "italic" }}
              />
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "5px" }}>Typing your full name constitutes your electronic signature.</div>

              {typedName.trim() && (
                <div style={{ marginTop: "14px", background: "#f8fafc", borderRadius: "10px", padding: "16px 18px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", fontWeight: 600 }}>Preview</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: "16px" }}>
                    <div>
                      <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "3px" }}>Signature</div>
                      <div style={{ fontSize: "22px", color: "#0f172a", fontStyle: "italic", fontFamily: "Georgia, serif" }}>{typedName}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "3px" }}>Date</div>
                      <div style={{ fontSize: "12px", color: "#0f172a", fontWeight: 600 }}>{today}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Extra fields (initials, date, text) */}
          {fields.filter(f => f.type !== "signature").map(field => (
            <div key={field.id}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#1a56db", display: "inline-block" }} />
                {field.label} {field.type === "date" ? "" : "*"}
              </label>
              <input
                type="text"
                required={field.type !== "date"}
                value={fieldValues[field.id] ?? ""}
                readOnly={field.type === "date"}
                onChange={(e) => setFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                style={{ width: "100%", padding: "12px 14px", fontSize: "14px", color: "#0f172a", background: field.type === "date" ? "#f8fafc" : "#ffffff", border: "1.5px solid #cbd5e1", borderRadius: "10px", outline: "none", fontFamily: field.type === "initials" ? "Georgia, serif" : "inherit", boxSizing: "border-box", fontStyle: field.type === "initials" ? "italic" : "normal" }}
              />
            </div>
          ))}

          {/* Consent checkbox */}
          <label style={{ display: "flex", gap: "14px", cursor: "pointer", alignItems: "flex-start", padding: "16px", background: "#f0f4ff", borderRadius: "12px", border: "1px solid #bfdbfe" }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: "2px", accentColor: "#1a56db", width: "18px", height: "18px", flexShrink: 0, cursor: "pointer" }}
            />
            <span style={{ fontSize: "12.5px", color: "#334155", lineHeight: 1.65 }}>
              I have reviewed the full agreement and agree to be legally bound by its terms. My {tab === "draw" ? "drawn signature" : "typed name"} constitutes a legally binding electronic signature.
            </span>
          </label>

          {error && (
            <div style={{ fontSize: "13px", color: "#dc2626", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "12px 14px" }}>
              {error}
            </div>
          )}
        </div>

        {/* Submit */}
        <div style={{ padding: "16px 20px 20px", borderTop: "1px solid #e2e8f0" }}>
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            style={{
              width: "100%", padding: "16px", fontSize: "15px", fontWeight: 700,
              background: canSubmit && !submitting ? "#1a56db" : "#cbd5e1",
              color: "#ffffff", border: "none", borderRadius: "12px",
              cursor: canSubmit && !submitting ? "pointer" : "default",
              fontFamily: "inherit", transition: "background 0.15s", letterSpacing: "0.3px",
            }}
          >
            {submitting ? "Submitting…" : "Sign Agreement →"}
          </button>
          <div style={{ fontSize: "11px", color: "#94a3b8", textAlign: "center", marginTop: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            Secured · Legally binding electronic signature
          </div>
        </div>
      </form>
    </div>
  );
}
