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

const FIELD_COLORS: Record<string, string> = {
  signature: "#1a56db",
  initials:  "#6b46c1",
  date:      "#3a7a50",
  text:      "#B8962E",
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

  const [tab, setTab]           = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState(signerName);
  const [agreed, setAgreed]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState("");
  const [hasDrawing, setHasDrawing] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    fields.forEach(f => { if (f.type === "date") init[f.id] = today; });
    return init;
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  function getPos(e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
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
    ctx.strokeStyle = "#111110";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
    setHasDrawing(true);
  }, []);

  const stopDraw = useCallback(() => {
    drawing.current = false;
    lastPos.current = null;
  }, []);

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
      <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "48px 28px", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, background: "#eaf6f0", border: "2px solid #b8dfc8", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3a7a50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div style={{ fontFamily: "var(--font-display), serif", fontSize: "24px", color: "#111110", letterSpacing: "2px", marginBottom: "10px" }}>AGREEMENT SIGNED</div>
        <div style={{ fontSize: "13px", color: "#5a5a54", lineHeight: 1.6 }}>
          Your signature has been recorded on <strong>{today}</strong>.<br/>
          You will receive a copy once all parties have signed.
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "20px 28px 16px", borderBottom: "1px solid #e8e7e2" }}>
        <div style={{ fontFamily: "var(--font-display), serif", fontSize: "16px", letterSpacing: "1.5px", color: "#111110" }}>SIGN THIS AGREEMENT</div>
        <div style={{ fontSize: "12px", color: "#8a8a84", marginTop: "4px" }}>Choose how you&apos;d like to apply your signature below.</div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>

          {!signerName && (
            <div>
              <label style={{ fontSize: "11px", color: "#5a5a54", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "8px", display: "block", fontWeight: 600 }}>
                Full legal name *
              </label>
              <input
                type="text"
                required
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="John Smith"
                style={{ width: "100%", padding: "11px 14px", fontSize: "14px", color: "#111110", background: "#fafaf8", border: "1.5px solid #d0cfc8", borderRadius: "8px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>
          )}

          {/* Tab switcher */}
          <div>
            <div style={{ display: "flex", background: "#f5f4f0", borderRadius: "8px", padding: "3px", border: "1px solid #e8e7e2", width: "fit-content" }}>
              {(["draw", "type"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  style={{
                    padding: "7px 20px", borderRadius: "6px", fontSize: "12.5px", fontWeight: tab === t ? 600 : 400,
                    color: tab === t ? "#111110" : "#5a5a54", background: tab === t ? "#ffffff" : "transparent",
                    border: "none", cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.3px",
                    boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  {t === "draw" ? "✍ Draw" : "⌨ Type"}
                </button>
              ))}
            </div>
          </div>

          {/* Draw tab */}
          {tab === "draw" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <label style={{ fontSize: "11px", color: "#5a5a54", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>
                  Draw your signature *
                </label>
                {hasDrawing && (
                  <button type="button" onClick={clearCanvas} style={{ fontSize: "11px", color: "#c0392b", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                    Clear
                  </button>
                )}
              </div>
              <div style={{ position: "relative", border: "1.5px solid #d0cfc8", borderRadius: "8px", overflow: "hidden", background: "#fafaf8", cursor: "crosshair" }}>
                <canvas
                  ref={canvasRef}
                  width={720}
                  height={180}
                  style={{ display: "block", width: "100%", height: "180px", touchAction: "none" }}
                />
                {!hasDrawing && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <span style={{ fontSize: "13px", color: "#c0cfc8" }}>Sign here</span>
                  </div>
                )}
                <div style={{ position: "absolute", bottom: 0, left: "16px", right: "16px", height: "1px", background: "#d0cfc8" }} />
              </div>
              <div style={{ fontSize: "11px", color: "#8a8a84", marginTop: "5px" }}>Use your mouse or finger to draw your signature above.</div>
            </div>
          )}

          {/* Type tab */}
          {tab === "type" && (
            <div>
              <label style={{ fontSize: "11px", color: "#5a5a54", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "8px", display: "block", fontWeight: 600 }}>
                Type your full legal name *
              </label>
              <input
                type="text"
                required={tab === "type"}
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="John Smith"
                style={{ width: "100%", padding: "14px 16px", fontSize: "22px", color: "#111110", background: "#fafaf8", border: "1.5px solid #d0cfc8", borderRadius: "8px", outline: "none", fontFamily: "Georgia, serif", boxSizing: "border-box", fontStyle: "italic" }}
              />
              <div style={{ fontSize: "11px", color: "#8a8a84", marginTop: "5px" }}>Typing your full name constitutes your electronic signature.</div>

              {/* Signature preview */}
              {typedName.trim() && (
                <div style={{ marginTop: "12px", background: "#f5f4f0", borderRadius: "8px", padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: "24px" }}>
                  <div>
                    <div style={{ fontSize: "9px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Signature</div>
                    <div style={{ fontSize: "22px", color: "#111110", fontStyle: "italic", fontFamily: "Georgia, serif" }}>{typedName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "9px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Date</div>
                    <div style={{ fontSize: "12px", color: "#111110" }}>{today}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom template fields */}
          {fields.filter(f => f.type !== "signature").map(field => {
            const color = FIELD_COLORS[field.type] ?? "#5a5a54";
            return (
              <div key={field.id}>
                <label style={{ fontSize: "11px", color: "#5a5a54", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block" }} />
                  {field.label} {field.type === "date" ? "" : "*"}
                </label>
                <input
                  type="text"
                  required={field.type !== "date"}
                  value={fieldValues[field.id] ?? ""}
                  readOnly={field.type === "date"}
                  onChange={(e) => setFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                  style={{ width: "100%", padding: "10px 14px", fontSize: "14px", color: "#111110", background: field.type === "date" ? "#f5f4f0" : "#fafaf8", border: `1.5px solid ${color}40`, borderRadius: "6px", outline: "none", fontFamily: field.type === "initials" ? "Georgia, serif" : "inherit", boxSizing: "border-box", fontStyle: field.type === "initials" ? "italic" : "normal" }}
                />
              </div>
            );
          })}

          {/* Agreement checkbox */}
          <label style={{ display: "flex", gap: "12px", cursor: "pointer", alignItems: "flex-start", padding: "16px", background: "#f5f4f0", borderRadius: "8px" }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: "2px", accentColor: "#111110", width: "16px", height: "16px", flexShrink: 0 }}
            />
            <span style={{ fontSize: "13px", color: "#5a5a54", lineHeight: 1.6 }}>
              I have read and reviewed the full agreement above, and I agree to be legally bound by its terms. I understand that my {tab === "draw" ? "drawn signature" : "typed name"} constitutes a legally binding electronic signature.
            </span>
          </label>

          {error && (
            <div style={{ fontSize: "13px", color: "#c0392b", background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.2)", borderRadius: "6px", padding: "10px 14px" }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid #e8e7e2", background: "#fafaf8" }}>
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            style={{
              width: "100%", padding: "14px", fontSize: "14px", fontWeight: 700, letterSpacing: "0.5px",
              background: canSubmit && !submitting ? "#B8962E" : "#d0cfc8",
              color: "#ffffff", border: "none", borderRadius: "8px",
              cursor: canSubmit && !submitting ? "pointer" : "default",
              fontFamily: "inherit", transition: "background 0.15s",
            }}
          >
            {submitting ? "Submitting…" : "Sign Agreement →"}
          </button>
          <div style={{ fontSize: "11px", color: "#aaa", textAlign: "center", marginTop: "10px" }}>
            Secured by Highlander REI · Electronic signatures are legally binding
          </div>
        </div>
      </form>
    </div>
  );
}
