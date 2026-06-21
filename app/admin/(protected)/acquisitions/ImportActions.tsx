"use client";

import { useState } from "react";

const btnStyle: React.CSSProperties = {
  padding: "7px 16px", fontSize: "12px", fontWeight: 600,
  borderRadius: "6px", cursor: "pointer", fontFamily: "inherit",
  display: "inline-flex", alignItems: "center", gap: "6px",
};

export default function ImportActions({ exportUrl, propertyCount }: { exportUrl: string; propertyCount: number }) {
  const [ghlStatus, setGhlStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [ghlMessage, setGhlMessage] = useState("");

  async function handleGHL() {
    setGhlStatus("sending");
    setGhlMessage("Sending to GHL...");

    try {
      const res = await fetch(`/api/acquisitions/export?${exportUrl.split("?")[1] ?? ""}&format=ids`);
      if (!res.ok) throw new Error("Failed to fetch property IDs");

      const idsRes = await fetch(`/api/acquisitions/ghl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyIds: "all",
          zip: new URL(exportUrl, window.location.origin).searchParams.get("zip") ?? undefined,
          city: new URL(exportUrl, window.location.origin).searchParams.get("city") ?? undefined,
        }),
      });

      if (!idsRes.ok) {
        const err = await idsRes.json();
        throw new Error(err.error ?? "GHL push failed");
      }

      const result = await idsRes.json();
      setGhlStatus("done");
      setGhlMessage(`Sent ${result.sent} to GHL${result.failed ? `, ${result.failed} failed` : ""}`);
    } catch (err) {
      setGhlStatus("error");
      setGhlMessage(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <>
      <a
        href={exportUrl}
        download
        style={{
          ...btnStyle,
          background: "#ffffff", color: "#111110", border: "1px solid #d0cfc8",
          textDecoration: "none",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Export CSV ({propertyCount})
      </a>

      <button
        onClick={handleGHL}
        disabled={ghlStatus === "sending" || propertyCount === 0}
        style={{
          ...btnStyle,
          background: ghlStatus === "sending" ? "#8a8a84" : "#111110",
          color: "#ffffff", border: "none",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        {ghlStatus === "sending" ? "Sending..." : "Push to GHL"}
      </button>

      {ghlMessage && ghlStatus !== "idle" && (
        <span style={{ fontSize: "11px", color: ghlStatus === "error" ? "#c0392b" : ghlStatus === "done" ? "#3a7a50" : "#8a8a84" }}>
          {ghlMessage}
        </span>
      )}
    </>
  );
}
