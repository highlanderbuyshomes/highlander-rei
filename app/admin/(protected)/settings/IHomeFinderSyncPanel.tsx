"use client";

import { useEffect, useState } from "react";

type SyncResult = {
  fetched: number;
  propertiesCreated: number;
  propertiesUpdated: number;
  listingsCreated: number;
  listingsUpdated: number;
  statusChanges: number;
  errors: { listingNumber: string; message: string }[];
};

type Option = { id: string; name: string };

type MarketsResponse = {
  markets: Option[] | { error: string };
  savedSearches: Option[] | { error: string };
};

function asOptions(value: Option[] | { error: string } | undefined): Option[] {
  return Array.isArray(value) ? value : [];
}

export default function IHomeFinderSyncPanel() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<SyncResult | null>(null);

  const [markets, setMarkets] = useState<Option[]>([]);
  const [savedSearches, setSavedSearches] = useState<Option[]>([]);
  const [scope, setScope] = useState<string>(""); // "" = account default, "market:<id>", "search:<id>"
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState("");

  useEffect(() => {
    fetch("/api/integrations/ihomefinder/markets")
      .then((res) => res.json())
      .then((data: MarketsResponse) => {
        const marketList = asOptions(data.markets).map((m) => ({ id: String(m.id), name: m.name ?? `Market ${m.id}` }));
        const searchList = asOptions(data.savedSearches).map((s) => ({ id: String(s.id), name: s.name ?? `Saved Search ${s.id}` }));
        setMarkets(marketList);
        setSavedSearches(searchList);
        if (marketList.length > 0) setScope(`market:${marketList[0].id}`);
        else if (searchList.length > 0) setScope(`search:${searchList[0].id}`);
      })
      .catch((err) => setOptionsError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoadingOptions(false));
  }, []);

  async function handleSync() {
    setStatus("running");
    setMessage("Fetching listings from iHomefinder...");
    setResult(null);

    const body: { marketId?: string; savedSearchId?: string } = {};
    if (scope.startsWith("market:")) body.marketId = scope.slice("market:".length);
    if (scope.startsWith("search:")) body.savedSearchId = scope.slice("search:".length);

    try {
      const res = await fetch("/api/integrations/ihomefinder/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");

      setResult(data);
      setStatus("done");
      if (data.fetched === 0) {
        setMessage("Synced, but this scope returned 0 listings — try a different market or saved search below.");
      } else {
        setMessage(`Synced ${data.fetched} listings — ${data.propertiesCreated + data.listingsCreated} new, ${data.statusChanges} status change${data.statusChanges === 1 ? "" : "s"}`);
      }
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

      <div style={{ marginBottom: "16px" }}>
        <label style={{ fontSize: "10px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px", display: "block", fontWeight: 600 }}>
          Scope
        </label>
        {loadingOptions ? (
          <div style={{ fontSize: "12px", color: "#8a8a84" }}>Loading markets &amp; saved searches...</div>
        ) : markets.length === 0 && savedSearches.length === 0 ? (
          <div style={{ fontSize: "12px", color: "#8a8a84" }}>
            No markets or saved searches found on this account — syncing will use the account default (featured listings), which may return 0 results.
          </div>
        ) : (
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            style={{ width: "100%", padding: "9px 12px", fontSize: "13px", border: "1px solid #d0cfc8", borderRadius: "6px", background: "#ffffff", color: "#111110", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
          >
            <option value="">Account default (featured listings)</option>
            {markets.length > 0 && (
              <optgroup label="Markets">
                {markets.map((m) => <option key={`market:${m.id}`} value={`market:${m.id}`}>{m.name}</option>)}
              </optgroup>
            )}
            {savedSearches.length > 0 && (
              <optgroup label="Saved Searches">
                {savedSearches.map((s) => <option key={`search:${s.id}`} value={`search:${s.id}`}>{s.name}</option>)}
              </optgroup>
            )}
          </select>
        )}
        {optionsError && (
          <div style={{ fontSize: "11px", color: "#c0392b", marginTop: "6px" }}>Couldn&apos;t load markets/saved searches: {optionsError}</div>
        )}
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
