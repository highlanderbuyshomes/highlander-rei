"use client";

import { useState } from "react";

type SyncResult = {
  fetched: number;
  propertiesCreated: number;
  propertiesUpdated: number;
  listingsCreated: number;
  listingsUpdated: number;
  statusChanges: number;
  errors: { listingNumber: string; message: string }[];
};

export default function IHomeFinderSyncPanel() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<SyncResult | null>(null);

  async function handleSync() {
    setStatus("running");
    setMessage("Fetching listings from iHomefinder...");
    setResult(null);

    try {
      const res = await fetch("/api/integrations/ihomefinder/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");

      setResult(data);
      setStatus("done");
      setMessage(`Synced ${data.fetched} listings — ${data.propertiesCreated + data.listingsCreated} new, ${data.statusChanges} status change${data.statusChanges === 1 ? "" : "s"}`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "28px" }}>
      <div style={{ fontSize: "14px", fontWeight: 600, color: "#111110", marginBottom: "4px" }}>iHomefinder</div>
      <div style={{ fontSize: "12px", color: "#8a8a84", marginBottom: "16px" }}>
        Pulls active/pending/sold listings from your iHomefinder account into Search &amp; Offers, and records status changes over time.
      </div>

      <div style={{ fontSize: "11px", color: "#8a8a84", marginBottom: "16px", lineHeight: 1.6 }}>
        Requires <code>IHOMEFINDER_USERNAME</code> and <code>IHOMEFINDER_PASSWORD</code> (your iHomefinder login) set as environment variables — not entered here.
      </div>

      <button
        onClick={handleSync}
        disabled={status === "running"}
        style={{
          padding: "10px 24px", background: status === "running" ? "#8a8a84" : "#111110", color: "#ffffff",
          border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
          cursor: status === "running" ? "not-allowed" : "pointer", fontFamily: "inherit",
        }}
      >
        {status === "running" ? "Syncing..." : "Sync Now"}
      </button>

      {message && (
        <div style={{ marginTop: "14px", fontSize: "12.5px", color: status === "error" ? "#c0392b" : status === "done" ? "#3a7a50" : "#8a8a84" }}>
          {message}
        </div>
      )}

      {result && result.errors.length > 0 && (
        <div style={{ marginTop: "12px", padding: "12px", background: "#fff7e6", border: "1px solid #ead18a", borderRadius: "8px", fontSize: "11.5px", color: "#946200" }}>
          {result.errors.length} listing{result.errors.length === 1 ? "" : "s"} failed to sync (first: {result.errors[0].listingNumber} — {result.errors[0].message})
        </div>
      )}
    </div>
  );
}
