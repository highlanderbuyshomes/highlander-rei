"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useRef } from "react";

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

type DragState = {
  id: string;
  pageIndex: number;
  startMouseX: number;
  startMouseY: number;
  startFieldX: number;
  startFieldY: number;
};

type FieldType = "signature" | "initials" | "date" | "text";

const FIELD_META: Record<FieldType, { label: string; color: string; w: number; h: number }> = {
  signature: { label: "Signature", color: "#1a56db", w: 0.27,  h: 0.044 },
  initials:  { label: "Initials",  color: "#6b46c1", w: 0.12,  h: 0.038 },
  date:      { label: "Date",      color: "#3a7a50", w: 0.18,  h: 0.034 },
  text:      { label: "Text",      color: "#B8962E", w: 0.25,  h: 0.034 },
};

const SIGNER_COLORS = ["#1a56db", "#c0392b", "#6b46c1", "#3a7a50"];

export default function AgreementFieldEditor({
  pdfUrl,
  initialFields,
  signerLabels,
  onSave,
}: {
  pdfUrl: string;
  initialFields: FieldInput[];
  signerLabels: string[];
  onSave: (fields: FieldInput[]) => Promise<void>;
}) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<Field[]>(
    initialFields.map((f, i) => ({ ...f, id: `init-${i}` }))
  );
  const [activeType, setActiveType] = useState<FieldType>("signature");
  const [activeSigner, setActiveSigner] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const dragMovedRef = useRef(false);

  useEffect(() => {
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
          const viewport = page.getViewport({ scale: 1.3 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
          dataUrls.push(canvas.toDataURL());
        }
        if (!cancelled) { setPages(dataUrls); setLoading(false); }
      } catch { if (!cancelled) setLoading(false); }
    }

    loadPdf();
    return () => { cancelled = true; };
  }, [pdfUrl]);

  useEffect(() => {
    const up = () => setDragging(null);
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  function handlePageClick(e: React.MouseEvent<HTMLDivElement>, pageIndex: number) {
    if (dragMovedRef.current) { dragMovedRef.current = false; return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;
    const meta = FIELD_META[activeType] ?? FIELD_META.signature;
    const roleLabel = signerLabels[activeSigner] ?? `S${activeSigner + 1}`;
    setSaved(false);
    setFields(prev => [...prev, {
      id: `f-${Date.now()}-${Math.random()}`,
      type: activeType,
      label: `${meta.label} (${roleLabel})`,
      page: pageIndex + 1,
      x: Math.max(0, Math.min(1 - meta.w, xPct - meta.w / 2)),
      y: Math.max(0, Math.min(1 - meta.h, yPct - meta.h / 2)),
      width: meta.w,
      height: meta.h,
      signerIndex: activeSigner,
    }]);
  }

  function handleFieldMouseDown(e: React.MouseEvent, field: Field, pageIndex: number) {
    e.stopPropagation();
    dragMovedRef.current = false;
    setDragging({
      id: field.id, pageIndex,
      startMouseX: e.clientX, startMouseY: e.clientY,
      startFieldX: field.x,  startFieldY: field.y,
    });
  }

  function handlePageMouseMove(e: React.MouseEvent<HTMLDivElement>, pageIndex: number) {
    if (!dragging || dragging.pageIndex !== pageIndex) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - dragging.startMouseX) / rect.width;
    const dy = (e.clientY - dragging.startMouseY) / rect.height;
    if (Math.abs(dx) > 0.003 || Math.abs(dy) > 0.003) { dragMovedRef.current = true; setSaved(false); }
    setFields(prev => prev.map(f => {
      if (f.id !== dragging.id) return f;
      return {
        ...f,
        x: Math.max(0, Math.min(1 - f.width,  dragging.startFieldX + dx)),
        y: Math.max(0, Math.min(1 - f.height, dragging.startFieldY + dy)),
      };
    }));
  }

  function handleFieldClick(e: React.MouseEvent, field: Field) {
    e.stopPropagation();
    if (dragMovedRef.current) { dragMovedRef.current = false; return; }
    setSaved(false);
    setFields(prev => prev.filter(f => f.id !== field.id));
  }

  async function handleSave() {
    setSaving(true);
    const output = fields.map(({ id: _id, ...rest }) => rest as FieldInput);
    await onSave(output);
    setSaving(false);
    setSaved(true);
  }

  const fieldTypes: FieldType[] = ["signature", "initials", "date", "text"];

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", overflow: "hidden", marginBottom: "16px" }}>
      {/* Section header */}
      <div style={{ padding: "14px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "10px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>
          Signature Field Placement
        </div>
        <div style={{ fontSize: "11px", color: "#8a8a84" }}>{fields.length} field{fields.length !== 1 ? "s" : ""}</div>
      </div>
      {/* Explanation banner */}
      <div style={{ margin: "10px 16px 0", padding: "9px 14px", background: "#f0f4fa", border: "1px solid #c8d8f0", borderRadius: "8px", fontSize: "12px", color: "#3a5fa0", lineHeight: 1.5 }}>
        These boxes mark <strong>where signers will fill in</strong> — they are not drawn on your PDF. Drag boxes to reposition, click to remove, or click the document to add a new one. Hit <strong>Save Fields</strong> to apply.
      </div>

      {/* Toolbar */}
      <div style={{
        margin: "10px 16px",
        background: "#111110",
        borderRadius: "10px",
        padding: "10px 14px",
        display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
      }}>
        {/* Field type pills */}
        <div style={{ display: "flex", gap: "4px" }}>
          {fieldTypes.map(type => {
            const m = FIELD_META[type];
            const active = activeType === type;
            return (
              <button key={type} onClick={() => setActiveType(type)} style={{
                padding: "4px 10px", borderRadius: "5px", fontSize: "11px", fontWeight: 600,
                border: `1.5px solid ${active ? m.color : "rgba(255,255,255,0.12)"}`,
                background: active ? `${m.color}25` : "transparent",
                color: active ? m.color : "rgba(255,255,255,0.4)",
                cursor: "pointer", fontFamily: "inherit",
              }}>{m.label}</button>
            );
          })}
        </div>

        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />

        {/* Signer role pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.8px" }}>For</span>
          {signerLabels.map((label, i) => {
            const color = SIGNER_COLORS[i % 4];
            const active = activeSigner === i;
            return (
              <button key={i} onClick={() => setActiveSigner(i)} style={{
                padding: "3px 9px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                border: `1.5px solid ${active ? color : "rgba(255,255,255,0.15)"}`,
                background: active ? `${color}30` : "transparent",
                color: active ? color : "rgba(255,255,255,0.35)",
                cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
              }}>{label}</button>
            );
          })}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          {fields.length > 0 && (
            <button onClick={() => { setFields([]); setSaved(false); }} style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              Clear
            </button>
          )}
          <button onClick={handleSave} disabled={saving} style={{
            padding: "5px 14px", background: saved ? "#3a7a50" : saving ? "#444" : "#B8962E",
            color: "#fff", border: "none", borderRadius: "6px",
            fontSize: "11.5px", fontWeight: 600, cursor: saving ? "default" : "pointer", fontFamily: "inherit",
          }}>
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save Fields"}
          </button>
        </div>
      </div>

      {/* Help text */}
      <div style={{ fontSize: "11px", color: "#8a8a84", textAlign: "center", padding: "4px 0 8px" }}>
        Click to place · Drag to reposition · Click a field to remove
      </div>

      {/* PDF pages */}
      <div style={{ background: "#f0efeb", padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", maxHeight: "720px", overflowY: "auto" }}>
        {loading && <div style={{ fontSize: "13px", color: "#8a8a84", padding: "40px 0" }}>Loading PDF…</div>}

        {pages.map((dataUrl, pageIndex) => {
          const pageFields = fields.filter(f => f.page === pageIndex + 1);
          return (
            <div key={pageIndex}>
              <div style={{ fontSize: "10px", color: "#aaa", textAlign: "center", marginBottom: "5px", letterSpacing: "1.5px" }}>
                PAGE {pageIndex + 1}
              </div>
              <div
                onClick={(e) => handlePageClick(e, pageIndex)}
                onMouseMove={(e) => handlePageMouseMove(e, pageIndex)}
                style={{
                  position: "relative",
                  cursor: dragging ? "grabbing" : "crosshair",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                  display: "inline-block",
                  userSelect: "none",
                }}
              >
                <img src={dataUrl} alt={`Page ${pageIndex + 1}`} style={{ display: "block", maxWidth: "660px", width: "100%", height: "auto" }} draggable={false} />

                {pageFields.map(field => {
                  const color = SIGNER_COLORS[field.signerIndex % 4];
                  const meta = FIELD_META[field.type as FieldType] ?? FIELD_META.text;
                  const roleLabel = signerLabels[field.signerIndex] ?? `S${field.signerIndex + 1}`;
                  const isDraggingThis = dragging?.id === field.id;
                  return (
                    <div
                      key={field.id}
                      onMouseDown={(e) => handleFieldMouseDown(e, field, pageIndex)}
                      onClick={(e) => handleFieldClick(e, field)}
                      title={`${meta.label} — ${roleLabel} · Drag to move, click to remove`}
                      style={{
                        position: "absolute",
                        left:   `${field.x * 100}%`,
                        top:    `${field.y * 100}%`,
                        width:  `${field.width * 100}%`,
                        height: `${field.height * 100}%`,
                        background: isDraggingThis ? `${color}30` : `${color}12`,
                        border: `1.5px dashed ${color}`,
                        borderRadius: "3px",
                        cursor: isDraggingThis ? "grabbing" : "grab",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxSizing: "border-box",
                        overflow: "hidden",
                        boxShadow: isDraggingThis ? `0 2px 8px ${color}50` : "none",
                      }}
                    >
                      <span style={{ fontSize: "8px", color, fontWeight: 700, letterSpacing: "0.3px", whiteSpace: "nowrap", padding: "0 3px" }}>
                        {meta.label.toUpperCase()} · {roleLabel.toUpperCase()}
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
