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

const CLOSED_MONTHS_BACK = 12;

function emptyResult(): SyncResult {
  return { fetched: 0, propertiesCreated: 0, propertiesUpdated: 0, listingsCreated: 0, listingsUpdated: 0, statusChanges: 0, errors: [] };
}

function mergeInto(target: SyncResult, part: SyncResult) {
  target.fetched += part.fetched;
  target.propertiesCreated += part.propertiesCreated;
  target.propertiesUpdated += part.propertiesUpdated;
  target.listingsCreated += part.listingsCreated;
  target.listingsUpdated += part.listingsUpdated;
  target.statusChanges += part.statusChanges;
  target.errors.push(...part.errors);
}

// One calendar month per window, most recent first — each request stays
// small enough to comfortably finish inside the serverless time limit even
// for a full-city scope, instead of one request trying to pull a year of
// closed sales (and everything else) in a single call.
function closedMonthWindows(monthsBack: number): { after: string; before: string }[] {
  const now = new Date();
  const windows: { after: string; before: string }[] = [];
  for (let i = 0; i < monthsBack; i++) {
    const before = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1));
    const after = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    windows.push({ after: after.toISOString(), before: before.toISOString() });
  }
  return windows;
}

function ago(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return hrs < 48 ? `${hrs} hr ago` : `${Math.round(hrs / 24)} days ago`;
}

export default function ResoSyncPanel({ configured, lastLiveSync }: { configured: boolean; lastLiveSync: string | null }) {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<SyncResult | null>(null);

  // Spark answers 429 "try again in a few minutes" when a request overlaps or
  // repeats a recent one, so wait and retry instead of failing the chunk.
  async function runChunk(body: Record<string, unknown>, attempt = 0): Promise<SyncResult> {
    try {
      return await runChunkOnce(body);
    } catch (err) {
      if (attempt < 3 && err instanceof Error && err.message.includes("429")) {
        await new Promise((r) => setTimeout(r, 20_000 * (attempt + 1)));
        return runChunk(body, attempt + 1);
      }
      throw err;
    }
  }

  async function runChunkOnce(body: Record<string, unknown>): Promise<SyncResult> {
    const res = await fetch("/api/integrations/reso/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) throw new Error(data?.error ?? `Sync request failed (${res.status})`);
    return data as SyncResult;
  }

  async function handleSync() {
    setStatus("running");
    setResult(null);
    const aggregate = emptyResult();

    // Split into several small requests instead of one giant one: Active/
    // Pending/Under-Contract first (bounded, fast), then Closed sales one
    // calendar month at a time. A broad scope (full cities, a year back)
    // is too much data for a single request to finish inside the
    // serverless time limit; chunking keeps each call fast and means one
    // slow or failed month doesn't lose the rest of the sync.
    try {
      for (const status of ["Active", "Active Under Contract", "Pending"]) {
        setMessage(`Syncing ${status} listings...`);
        try {
          mergeInto(aggregate, await runChunk({ statuses: [status] }));
        } catch (err) {
          aggregate.errors.push({ listingNumber: status, message: err instanceof Error ? err.message : String(err) });
        }
        setResult({ ...aggregate });
      }

      const windows = closedMonthWindows(CLOSED_MONTHS_BACK);
      for (let i = 0; i < windows.length; i++) {
        setMessage(`Syncing closed sales — month ${i + 1} of ${windows.length}...`);
        try {
          mergeInto(aggregate, await runChunk({ statuses: ["Closed"], closedAfter: windows[i].after, closedBefore: windows[i].before }));
        } catch (err) {
          aggregate.errors.push({ listingNumber: `closed-month-${i + 1}`, message: err instanceof Error ? err.message : String(err) });
        }
        setResult({ ...aggregate });
      }

      setStatus("done");
      setMessage(`Synced ${aggregate.fetched} listings — ${aggregate.propertiesCreated + aggregate.listingsCreated} new, ${aggregate.statusChanges} status change${aggregate.statusChanges === 1 ? "" : "s"}`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e1e7ec", borderRadius: "14px", padding: "28px" }}>
      <div style={{ fontSize: "14px", fontWeight: 600, color: "#12161c", marginBottom: "4px" }}>ARMLS RESO Web API</div>
      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
        Pulls Active, Under Contract, Pending, and Closed listings for all of ARMLS into Property &amp; Search — powers the Deal Search 70% rule ranking with real MLS data instead of an empty table. The manual Closed month-by-month backfill now covers the whole MLS and is very large.
      </div>

      <div style={{ fontSize: "12px", color: lastLiveSync ? "#3a7a50" : "#946200", marginBottom: "16px" }}>
        Live sync (every 10 min): {lastLiveSync ? `last ran ${ago(lastLiveSync)}` : "hasn't run yet"}. The button below is only for a manual full re-pull.
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
