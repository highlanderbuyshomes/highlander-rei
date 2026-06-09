"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

type Step = "welcome" | "adopt" | "review";

export default function SignatureForm({
  token,
  signerName,
  fields,
  documentLabel,
  address,
  pdfUrl,
}: {
  token: string;
  signerName: string;
  fields: Field[];
  documentLabel: string;
  address: string;
  pdfUrl: string | null;
}) {
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const initialsFields = fields.filter((field) => field.type === "initials");
  const textFields = fields.filter((field) => field.type === "text");
  const dateFields = fields.filter((field) => field.type === "date");

  const [step, setStep] = useState<Step>("welcome");
  const [tab, setTab] = useState<"draw" | "type">("type");
  const [typedName, setTypedName] = useState(signerName);
  const [initials, setInitials] = useState(() => signerName.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 4).toUpperCase());
  const [signatureData, setSignatureData] = useState("");
  const [hasDrawing, setHasDrawing] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [readyToFinish, setReadyToFinish] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [textValues, setTextValues] = useState<Record<string, string>>({});

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  function getPos(e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const client = "touches" in e ? e.touches[0] : e;
    return {
      x: (client.clientX - rect.left) * (canvas.width / rect.width),
      y: (client.clientY - rect.top) * (canvas.height / rect.height),
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
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!drawing.current || !canvas || !ctx || !lastPos.current) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#111110";
    ctx.lineWidth = 3;
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
    if (!canvas || step !== "adopt" || tab !== "draw") return;
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
  }, [draw, startDraw, step, stopDraw, tab]);

  function clearCanvas() {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
  }

  function continueToReview() {
    const signature = tab === "type" ? typedName.trim() : canvasRef.current?.toDataURL("image/png") ?? "";
    if (!signature || (tab === "draw" && !hasDrawing) || (initialsFields.length > 0 && !initials.trim())) return;
    setSignatureData(signature);
    setStep("review");
  }

  async function finishSigning() {
    if (!agreed || !readyToFinish || !signatureData) return;
    setSubmitting(true);
    setError("");
    const fieldData: Record<string, string> = {};
    initialsFields.forEach((field) => { fieldData[field.id] = initials.trim(); });
    dateFields.forEach((field) => { fieldData[field.id] = today; });
    textFields.forEach((field) => { fieldData[field.id] = textValues[field.id] ?? ""; });

    try {
      const response = await fetch("/api/agreements/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          signerName: typedName.trim(),
          signatureData,
          signatureType: tab,
          fieldData,
        }),
      });
      if (!response.ok) throw new Error("Signing request failed");
      setDone(true);
    } catch {
      setError("We could not finish signing. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const buttonStyle = (enabled = true): React.CSSProperties => ({
    width: "100%",
    padding: "15px 18px",
    border: "none",
    borderRadius: "12px",
    background: enabled ? "#111110" : "#d8d8dc",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 700,
    cursor: enabled ? "pointer" : "default",
    fontFamily: "inherit",
  });

  if (done) {
    return (
      <section style={{ textAlign: "center", padding: "72px 22px" }}>
        <div style={{ width: 58, height: 58, borderRadius: "50%", background: "#111110", color: "#fff", display: "grid", placeItems: "center", margin: "0 auto 22px" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h1 style={{ margin: "0 0 10px", fontSize: "25px", letterSpacing: "-0.5px" }}>You&apos;re finished</h1>
        <p style={{ margin: 0, color: "#777781", fontSize: "14px", lineHeight: 1.6 }}>Your signature was recorded on {today}. You will receive the completed document after all parties sign.</p>
      </section>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "6px", marginBottom: "28px" }}>
        {["Start", "Adopt", "Sign"].map((label, index) => {
          const activeIndex = step === "welcome" ? 0 : step === "adopt" ? 1 : 2;
          return (
            <div key={label} style={{ flex: 1 }}>
              <div style={{ height: "3px", borderRadius: "4px", background: index <= activeIndex ? "#111110" : "#e8e8ec", marginBottom: "7px" }} />
              <span style={{ fontSize: "10px", fontWeight: 700, color: index <= activeIndex ? "#111110" : "#aaaab2", textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</span>
            </div>
          );
        })}
      </div>

      {step === "welcome" && (
        <section>
          <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#777781", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>Ready for your signature</p>
          <h1 style={{ margin: "0 0 10px", fontSize: "28px", letterSpacing: "-0.8px", lineHeight: 1.15 }}>{documentLabel}</h1>
          <p style={{ margin: "0 0 26px", color: "#777781", fontSize: "14px", lineHeight: 1.6 }}>{address}</p>
          <div style={{ padding: "18px", border: "1px solid #e8e8ec", borderRadius: "14px", marginBottom: "18px" }}>
            <div style={{ fontSize: "12px", color: "#777781", marginBottom: "5px" }}>Signing as</div>
            <div style={{ fontSize: "15px", fontWeight: 700 }}>{signerName}</div>
          </div>
          {pdfUrl && <a href={pdfUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block", textAlign: "center", padding: "13px", border: "1px solid #d8d8dc", borderRadius: "12px", color: "#111110", textDecoration: "none", fontSize: "13px", fontWeight: 650, marginBottom: "12px" }}>Review exact PDF</a>}
          <button type="button" onClick={() => setStep("adopt")} style={buttonStyle()}>Start</button>
        </section>
      )}

      {step === "adopt" && (
        <section>
          <h1 style={{ margin: "0 0 7px", fontSize: "25px", letterSpacing: "-0.6px" }}>Choose your signature</h1>
          <p style={{ margin: "0 0 22px", color: "#777781", fontSize: "13px", lineHeight: 1.6 }}>We will apply your adopted signature and initials to every place assigned to you.</p>

          <div style={{ display: "flex", background: "#f2f2f4", borderRadius: "12px", padding: "4px", marginBottom: "18px" }}>
            {(["type", "draw"] as const).map((option) => (
              <button key={option} type="button" onClick={() => setTab(option)} style={{ flex: 1, padding: "11px", border: 0, borderRadius: "9px", background: tab === option ? "#fff" : "transparent", boxShadow: tab === option ? "0 1px 5px rgba(0,0,0,0.08)" : "none", fontWeight: 700, color: tab === option ? "#111110" : "#888891", fontFamily: "inherit", cursor: "pointer" }}>
                {option === "type" ? "Type" : "Draw"}
              </button>
            ))}
          </div>

          {tab === "type" ? (
            <div style={{ border: "1px solid #d8d8dc", borderRadius: "14px", padding: "18px", marginBottom: "18px" }}>
              <label style={{ display: "block", fontSize: "11px", color: "#777781", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700 }}>Full legal name</label>
              <input value={typedName} onChange={(e) => setTypedName(e.target.value)} style={{ width: "100%", boxSizing: "border-box", border: 0, outline: 0, padding: 0, fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "27px", color: "#111110" }} />
            </div>
          ) : (
            <div style={{ marginBottom: "18px" }}>
              <div style={{ border: "1px solid #d8d8dc", borderRadius: "14px", overflow: "hidden", position: "relative" }}>
                <canvas ref={canvasRef} width={720} height={210} style={{ display: "block", width: "100%", height: "180px", touchAction: "none" }} />
                <div style={{ position: "absolute", left: 18, right: 18, bottom: 35, height: 1, background: "#e8e8ec", pointerEvents: "none" }} />
              </div>
              <button type="button" onClick={clearCanvas} style={{ background: "none", border: 0, padding: "8px 0 0", color: "#777781", fontSize: "12px", cursor: "pointer" }}>Clear signature</button>
            </div>
          )}

          {initialsFields.length > 0 && (
            <div style={{ border: "1px solid #d8d8dc", borderRadius: "14px", padding: "16px", marginBottom: "18px" }}>
              <label style={{ display: "block", fontSize: "11px", color: "#777781", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700 }}>Initials</label>
              <input value={initials} onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 4))} style={{ width: "100%", boxSizing: "border-box", border: 0, outline: 0, padding: 0, fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "24px", color: "#111110" }} />
            </div>
          )}

          <button type="button" onClick={continueToReview} disabled={!typedName.trim() || (tab === "draw" && !hasDrawing) || (initialsFields.length > 0 && !initials.trim())} style={buttonStyle(!!typedName.trim() && (tab === "type" || hasDrawing) && (initialsFields.length === 0 || !!initials.trim()))}>Next</button>
        </section>
      )}

      {step === "review" && (
        <section>
          <h1 style={{ margin: "0 0 7px", fontSize: "25px", letterSpacing: "-0.6px" }}>Review and sign</h1>
          <p style={{ margin: "0 0 20px", color: "#777781", fontSize: "13px", lineHeight: 1.6 }}>Your signature is ready. Review the document, then start signing and finish.</p>

          {pdfUrl && <a href={pdfUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block", textAlign: "center", padding: "13px", border: "1px solid #d8d8dc", borderRadius: "12px", color: "#111110", textDecoration: "none", fontSize: "13px", fontWeight: 650, marginBottom: "14px" }}>Open exact PDF</a>}

          {textFields.map((field) => (
            <div key={field.id} style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "11px", color: "#777781", marginBottom: "6px", fontWeight: 700 }}>{field.label}</label>
              <input value={textValues[field.id] ?? ""} onChange={(e) => setTextValues((current) => ({ ...current, [field.id]: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", padding: "12px 13px", border: "1px solid #d8d8dc", borderRadius: "10px", fontSize: "14px" }} />
            </div>
          ))}

          <label style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "16px", background: "#f5f5f6", borderRadius: "12px", marginBottom: "14px", cursor: "pointer" }}>
            <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setReadyToFinish(false); }} style={{ width: 18, height: 18, accentColor: "#111110", flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: "#55555d", lineHeight: 1.55 }}>I reviewed the agreement and agree that my adopted signature and initials are legally binding.</span>
          </label>

          {!readyToFinish ? (
            <button type="button" onClick={() => setReadyToFinish(true)} disabled={!agreed || textFields.some((field) => !(textValues[field.id] ?? "").trim())} style={buttonStyle(agreed && !textFields.some((field) => !(textValues[field.id] ?? "").trim()))}>Start Signing</button>
          ) : (
            <button type="button" onClick={finishSigning} disabled={submitting} style={buttonStyle(!submitting)}>{submitting ? "Finishing…" : "Finish"}</button>
          )}

          {error && <div role="alert" style={{ marginTop: "12px", color: "#b42318", background: "#fff1f0", borderRadius: "10px", padding: "12px", fontSize: "12px" }}>{error}</div>}
          <button type="button" onClick={() => { setStep("adopt"); setReadyToFinish(false); }} style={{ width: "100%", marginTop: "10px", padding: "10px", border: 0, background: "transparent", color: "#777781", fontSize: "12px", cursor: "pointer" }}>Back</button>
        </section>
      )}
    </div>
  );
}
