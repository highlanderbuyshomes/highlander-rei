"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- PDF.js is loaded dynamically from its CDN and does not expose local types. */

import { useState, useEffect } from "react";

type FieldType = "signature" | "initials" | "date" | "text";

export type FieldInput = {
  type: string;
  label?: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  signerIndex: number;
};

type Field = FieldInput & { id: string };

const FIELD_META: Record<FieldType, { label: string; color: string; w: number; h: number }> = {
  signature: { label: "Signature", color: "#1a56db", w: 0.27, h: 0.044 },
  initials:  { label: "Initials",  color: "#6b46c1", w: 0.12, h: 0.038 },
  date:      { label: "Date",      color: "#3a7a50", w: 0.18, h: 0.034 },
  text:      { label: "Text",      color: "#B8962E", w: 0.25, h: 0.034 },
};

const SIGNER_COLORS = ["#1a56db", "#c0392b", "#6b46c1", "#3a7a50"];

export default function PdfFieldEditor({
  pdfUrl,
  initialFields,
  initialSignerCount,
  onSave,
}: {
  pdfUrl: string | null;
  initialFields: FieldInput[];
  initialSignerCount: number;
  onSave: (signerCount: number, fields: FieldInput[]) => Promise<void>;
}) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(!!pdfUrl);
  const [fields, setFields] = useState<Field[]>(
    initialFields.map((f, i) => ({ ...f, id: `init-${i}` }))
  );
  const [activeType, setActiveType] = useState<FieldType>("signature");
  const [activeSigner, setActiveSigner] = useState(0);
  const [signerCount, setSignerCount] = useState(initialSignerCount);
  const [saving, setSaving] = useState(false);

  // Load PDF via PDF.js from CDN
  useEffect(() => {
    if (!pdfUrl) return;
    let cancelled = false;

    async function loadPdf() {
      try {
        await new Promise<void>((resolve, reject) => {
          if ((window as any).pdfjsLib) return resolve();
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          script.onload = () => resolve();
          script.onerror = reject;
          document.head.appendChild(script);
        });

        const lib = (window as any).pdfjsLib;
        lib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        const pdf = await lib.getDocument({ url: pdfUrl, withCredentials: false }).promise;
        const dataUrls: string[] = [];

        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const viewport = page.getViewport({ scale: 1.4 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
          dataUrls.push(canvas.toDataURL());
        }

        if (!cancelled) {
          setPages(dataUrls);
          setLoading(false);
        }
      } catch (err) {
        console.error("PDF load error:", err);
        if (!cancelled) setLoading(false);
      }
    }

    loadPdf();
    return () => { cancelled = true; };
  }, [pdfUrl]);

  function handlePageClick(e: React.MouseEvent<HTMLDivElement>, pageIndex: number) {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;
    const meta = FIELD_META[activeType];

    setFields(prev => [...prev, {
      id: `f-${Date.now()}-${Math.random()}`,
      type: activeType,
      label: meta.label,
      page: pageIndex + 1,
      x: Math.max(0, Math.min(1 - meta.w, xPct - meta.w / 2)),
      y: Math.max(0, Math.min(1 - meta.h, yPct - meta.h / 2)),
      width: meta.w,
      height: meta.h,
      signerIndex: activeSigner,
    }]);
  }

  async function handleSave() {
    setSaving(true);
    await onSave(signerCount, fields.map((field) => {
      const copy: Partial<Field> = { ...field };
      delete copy.id;
      return copy as FieldInput;
    }));
    setSaving(false);
  }

  const fieldTypes: FieldType[] = ["signature", "initials", "date", "text"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Sticky toolbar */}
      <div style={{
        position: "sticky", top: 56, zIndex: 10,
        background: "#1a1a19", borderBottom: "1px solid rgba(255,255,255,0.1)",
        padding: "10px 20px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap",
      }}>
        {/* Field type pills */}
        <div style={{ display: "flex", gap: "5px" }}>
          {fieldTypes.map(type => {
            const m = FIELD_META[type];
            const active = activeType === type;
            return (
              <button key={type} onClick={() => setActiveType(type)} style={{
                padding: "5px 12px", borderRadius: "5px", fontSize: "12px", fontWeight: 600,
                border: `1.5px solid ${active ? m.color : "rgba(255,255,255,0.12)"}`,
                background: active ? `${m.color}25` : "transparent",
                color: active ? m.color : "rgba(255,255,255,0.45)",
                cursor: "pointer", fontFamily: "inherit",
              }}>
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.12)" }} />

        {/* Signer selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", letterSpacing: "1px", textTransform: "uppercase" }}>Signer</span>
          {Array.from({ length: signerCount }, (_, i) => (
            <button key={i} onClick={() => setActiveSigner(i)} style={{
              width: 26, height: 26, borderRadius: "50%",
              border: `2px solid ${activeSigner === i ? SIGNER_COLORS[i % 4] : "rgba(255,255,255,0.2)"}`,
              background: activeSigner === i ? `${SIGNER_COLORS[i % 4]}30` : "transparent",
              color: SIGNER_COLORS[i % 4], fontSize: "11px", fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>{i + 1}</button>
          ))}
          {signerCount < 4 && (
            <button onClick={() => setSignerCount(n => n + 1)} style={{ width: 26, height: 26, borderRadius: "50%", border: "1px dashed rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.3)", fontSize: "14px", cursor: "pointer", fontFamily: "inherit", lineHeight: "22px" }}>+</button>
          )}
          {signerCount > 1 && (
            <button onClick={() => setSignerCount(n => n - 1)} style={{ width: 26, height: 26, borderRadius: "50%", border: "1px dashed rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.3)", fontSize: "14px", cursor: "pointer", fontFamily: "inherit", lineHeight: "22px" }}>−</button>
          )}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
          {fields.length > 0 && (
            <button onClick={() => setFields([])} style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.35)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              Clear all
            </button>
          )}
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>{fields.length} field{fields.length !== 1 ? "s" : ""}</span>
          <button onClick={handleSave} disabled={saving} style={{
            padding: "7px 18px", background: saving ? "#444" : "#B8962E",
            color: "#fff", border: "none", borderRadius: "6px",
            fontSize: "12.5px", fontWeight: 600, cursor: saving ? "default" : "pointer", fontFamily: "inherit",
          }}>
            {saving ? "Saving…" : "Save Fields"}
          </button>
        </div>
      </div>

      {/* Help text */}
      <div style={{ background: "#2a2a28", padding: "10px 20px", fontSize: "11.5px", color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
        Click anywhere on the document to place a field · Click a placed field to remove it
      </div>

      {/* PDF canvas area */}
      <div style={{ background: "#2a2a28", flex: 1, padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", minHeight: "400px" }}>
        {loading && (
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", paddingTop: "60px" }}>Loading PDF…</div>
        )}
        {!loading && !pdfUrl && (
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", paddingTop: "60px", textAlign: "center" }}>
            No PDF uploaded yet. Upload a template PDF on the Templates page first, then come back to place fields.
          </div>
        )}
        {!loading && pdfUrl && pages.length === 0 && (
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", paddingTop: "60px" }}>Could not render PDF. Try re-uploading the file.</div>
        )}

        {pages.map((dataUrl, pageIndex) => {
          const pageFields = fields.filter(f => f.page === pageIndex + 1);
          return (
            <div key={pageIndex}>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", textAlign: "center", marginBottom: "6px", letterSpacing: "1.5px" }}>
                PAGE {pageIndex + 1}
              </div>
              <div
                onClick={(e) => handlePageClick(e, pageIndex)}
                style={{ position: "relative", cursor: "crosshair", boxShadow: "0 6px 24px rgba(0,0,0,0.5)", display: "inline-block" }}
              >
                <img src={dataUrl} alt={`Page ${pageIndex + 1}`} style={{ display: "block", maxWidth: "700px", width: "100%", height: "auto" }} draggable={false} />

                {pageFields.map(field => {
                  const color = SIGNER_COLORS[field.signerIndex % 4];
                  const meta = FIELD_META[field.type as FieldType] ?? FIELD_META.text;
                  return (
                    <div
                      key={field.id}
                      onClick={(e) => { e.stopPropagation(); setFields(prev => prev.filter(f => f.id !== field.id)); }}
                      title={`${meta.label} — Signer ${field.signerIndex + 1} · Click to remove`}
                      style={{
                        position: "absolute",
                        left: `${field.x * 100}%`,
                        top:  `${field.y * 100}%`,
                        width: `${field.width * 100}%`,
                        height: `${field.height * 100}%`,
                        background: `${color}28`,
                        border: `1.5px solid ${color}`,
                        borderRadius: "3px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxSizing: "border-box",
                        overflow: "hidden",
                      }}
                    >
                      <span style={{ fontSize: "9px", color, fontWeight: 700, letterSpacing: "0.4px", whiteSpace: "nowrap", padding: "0 3px" }}>
                        {meta.label.toUpperCase()} S{field.signerIndex + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
