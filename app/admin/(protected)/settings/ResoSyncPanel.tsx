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

export default function ResoSyncPanel({ configured }: { configured: boolean }) {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<SyncResult | null>(null);

  async function handleSync() {
    setStatus("running");
    setMessage("Pulling listings from the ARMLS RESO Web API...");
    setResult(null);

    try {
      const res = await fetch("/api/integrations/reso/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
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
    <div style={{ background: "#ffffff", border: "1px solid #e1e7ec", borderRadius: "14px", padding: "28px" }}>
      <div style={{ fontSize: "14px", fontWeight: 600, color: "#12161c", marginBottom: "4px" }}>ARMLS RESO Web API</div>
      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
        Pulls Active, Under Contract, Pending, and Closed listings for the default service area into Property &amp; Search — powers the Deal Search 70% rule ranking with real MLS data instead of an empty table.
      </div>

      {!configured ? (
        <div style={{ fontSize: "11px", color: "#946200", marginBottom: "16px", lineHeight: 1.6, background: "#fff7e6", border: "1px solid #ead18a", borderRadius: "8px", padding: "12px 14px" }}>
          Not configured yet. Add <code>RESO_ACCESS_TOKEN</code> (the non-expiring access token from ARMLS/Spark) to <code>.env.local</code> — never entered here. The Spark feed&apos;s OAuth key isn&apos;t needed for requests. Only set <code>RESO_API_URL</code> too if ARMLS gives you a different base URL than Spark&apos;s standard one.
        </div>
      ) : (
        <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "16px", lineHeight: 1.6 }}>
          Uses <code>RESO_ACCESS_TOKEN</code> set as an environment variable — not entered here.
        </div>
      )}

      <button
        onClick={handleSync}
        disabled={status === "running" || !configured}
        style={{
          padding: "10px 24px",
          background: status === "running" || !configured ? "#c8c7c1" : "#12161c",
          color: "#ffffff",
          border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
          cursor: status === "running" || !configured ? "not-allowed" : "pointer", fontFamily: "inherit",
        }}
      >
        {status === "running" ? "Syncing..." : "Sync MLS Data"}
      </button>

      {message && (
        <div style={{ marginTop: "14px", fontSize: "12.5px", color: status === "error" ? "#c0392b" : status === "done" ? "#3a7a50" : "#64748b" }}>
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
