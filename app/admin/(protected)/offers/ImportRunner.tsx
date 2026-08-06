"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inp: React.CSSProperties = {
  width: "100%", padding: "9px 12px", fontSize: "13px",
  border: "1px solid #d0cfc8", borderRadius: "6px",
  background: "#ffffff", color: "#111110", fontFamily: "inherit", outline: "none",
  boxSizing: "border-box",
};

const label: React.CSSProperties = {
  display: "block", fontSize: "10px", fontWeight: 700, color: "#8a8a84",
  textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px",
};

const PRESETS = [
  { label: "Arcadia (85018)", location: "85018" },
  { label: "Arcadia (85008)", location: "85008" },
  { label: "Scottsdale", location: "Scottsdale, AZ" },
  { label: "Paradise Valley", location: "Paradise Valley, AZ" },
  { label: "Cactus Corridor (85254)", location: "85254" },
  { label: "Biltmore (85016)", location: "85016" },
  { label: "Old Town (85251)", location: "85251" },
  { label: "N Scottsdale (85255)", location: "85255" },
  { label: "McCormick (85258)", location: "85258" },
  { label: "DC Ranch (85255)", location: "85255" },
  { label: "PV (85253)", location: "85253" },
];

const LEAD_TYPES: { key: string; label: string; group: string }[] = [
  { key: "vacant_home", label: "Vacant Homes", group: "Property" },
  { key: "vacant_lot", label: "Vacant Lots", group: "Property" },
  { key: "abandoned_homes", label: "Abandoned", group: "Property" },
  { key: "zombie_property", label: "Zombie Property", group: "Property" },
  { key: "code_violation", label: "Code Violation", group: "Property" },

  { key: "preforeclosure", label: "Pre-Foreclosure", group: "Distress" },
  { key: "bank_owned", label: "Bank Owned", group: "Distress" },
  { key: "auction", label: "Auction", group: "Distress" },
  { key: "lien_tax", label: "Tax Lien", group: "Distress" },
  { key: "bankruptcy", label: "Bankruptcy", group: "Distress" },
  { key: "divorce", label: "Divorce", group: "Distress" },

  { key: "absentee_owner", label: "Absentee Owner", group: "Owner" },
  { key: "out_of_state_owner", label: "Out of State Owner", group: "Owner" },
  { key: "tired_landlord", label: "Tired Landlord", group: "Owner" },
  { key: "empty_nester", label: "Empty Nester", group: "Owner" },

  { key: "high_equity", label: "High Equity", group: "Equity" },
  { key: "free_and_clear", label: "Free & Clear", group: "Equity" },
  { key: "low_equity", label: "Low Equity", group: "Equity" },
  { key: "negative_equity", label: "Negative Equity", group: "Equity" },

  { key: "bargain_properties", label: "Bargain Properties", group: "Deal" },
  { key: "flipped_property", label: "Flipped Property", group: "Deal" },
  { key: "cash_buyer", label: "Cash Buyer", group: "Deal" },
  { key: "creative_financing", label: "Creative Financing", group: "Deal" },

  { key: "mls_failed", label: "MLS Failed / Expired", group: "MLS" },
  { key: "mls_active", label: "MLS Active", group: "MLS" },
  { key: "mls_pending", label: "MLS Pending", group: "MLS" },
];

type Status = "idle" | "starting" | "running" | "ingesting" | "done" | "error";

export default function ImportRunner() {
  const router = useRouter();
  const [location, setLocation] = useState("Scottsdale, AZ");
  const [maxItems, setMaxItems] = useState("100");
  const [description, setDescription] = useState("");
  const [selectedLeadTypes, setSelectedLeadTypes] = useState<string[]>(["high_equity", "free_and_clear"]);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  function toggleLeadType(key: string) {
    setSelectedLeadTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  async function handleRun() {
    setStatus("starting");
    setMessage("Starting Propwire scraper...");
    setResult(null);

    const input: Record<string, unknown> = {
      locations: [location],
      maxItems: parseInt(maxItems, 10) || 100,
    };

    if (selectedLeadTypes.length > 0) {
      input.leadTypes = selectedLeadTypes;
    }

    try {
      const startRes = await fetch("/api/acquisitions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", actorId: "crawlerbros/propwire-leads-scraper", input }),
      });
      if (!startRes.ok) throw new Error(await startRes.text());
      const { importRunId, apifyRunId } = await startRes.json();

      setStatus("running");
      setMessage("Scraper running, polling for completion...");

      let finished = false;
      while (!finished) {
        await new Promise((r) => setTimeout(r, 5000));
        const pollRes = await fetch("/api/acquisitions/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "poll", apifyRunId }),
        });
        if (!pollRes.ok) throw new Error(await pollRes.text());
        const pollData = await pollRes.json();
        finished = pollData.finished;
        setMessage(`Scraper status: ${pollData.status}`);
      }

      setStatus("ingesting");
      setMessage("Ingesting results into database...");

      const ingestRes = await fetch("/api/acquisitions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ingest", importRunId, apifyRunId }),
      });
      if (!ingestRes.ok) throw new Error(await ingestRes.text());
      const ingestData = await ingestRes.json();

      setResult(ingestData);
      setStatus("done");
      setMessage(`Done — ${ingestData.imported} imported, ${ingestData.duplicates} duplicates, ${ingestData.skipped ?? 0} filtered out`);
      router.refresh();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : String(err));
    }
  }

  const running = status === "starting" || status === "running" || status === "ingesting";
  const groups = [...new Set(LEAD_TYPES.map((t) => t.group))];

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "24px", marginBottom: "20px" }}>
      <div style={{ fontSize: "14px", fontWeight: 600, color: "#111110", marginBottom: "4px" }}>Import Off-Market Homeowners</div>
      <div style={{ fontSize: "12px", color: "#8a8a84", marginBottom: "16px" }}>Propwire — owner info, equity, MLS data, lead-type flags</div>

      {/* Location presets */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
        {PRESETS.map((p) => (
          <button
            key={p.location}
            onClick={() => setLocation(p.location)}
            style={{
              padding: "5px 12px", fontSize: "11.5px", fontWeight: 500,
              borderRadius: "20px", cursor: "pointer", fontFamily: "inherit",
              background: location === p.location ? "#111110" : "#f5f4f0",
              color: location === p.location ? "#ffffff" : "#5a5a54",
              border: location === p.location ? "1px solid #111110" : "1px solid #e8e7e2",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <div>
          <span style={label}>Location</span>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, ST or ZIP code" style={inp} />
        </div>
        <div>
          <span style={label}>Max Records</span>
          <input value={maxItems} onChange={(e) => setMaxItems(e.target.value)} type="number" min="1" max="1000" style={inp} />
        </div>
      </div>

      {/* Description */}
      <div style={{ marginBottom: "14px" }}>
        <span style={label}>Description / Notes</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What are you looking for? e.g. Vacant homes in Arcadia under $800K, tired landlords with high equity in 85251..."
          rows={2}
          style={{ ...inp, resize: "vertical" }}
        />
      </div>

      {/* Lead type filters */}
      <div style={{ marginBottom: "16px" }}>
        <span style={label}>Lead Types (leave blank for all)</span>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
          {groups.map((group) => (
            <div key={group}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#b0b0a8", letterSpacing: "1px", marginBottom: "4px" }}>{group.toUpperCase()}</div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {LEAD_TYPES.filter((t) => t.group === group).map((t) => {
                  const selected = selectedLeadTypes.includes(t.key);
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => toggleLeadType(t.key)}
                      style={{
                        padding: "4px 11px", fontSize: "11px", fontWeight: 500,
                        borderRadius: "20px", cursor: "pointer", fontFamily: "inherit",
                        background: selected ? "#111110" : "#ffffff",
                        color: selected ? "#ffffff" : "#5a5a54",
                        border: selected ? "1px solid #111110" : "1px solid #d0cfc8",
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          onClick={handleRun}
          disabled={running || !location}
          style={{
            padding: "10px 24px", background: running ? "#8a8a84" : "#111110", color: "#ffffff",
            border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
            cursor: running ? "not-allowed" : "pointer", fontFamily: "inherit",
          }}
        >
          {running ? "Running..." : "Start Import"}
        </button>

        {message && (
          <span style={{ fontSize: "12.5px", color: status === "error" ? "#c0392b" : status === "done" ? "#3a7a50" : "#8a8a84" }}>
            {message}
          </span>
        )}
      </div>

      {result && (
        <div style={{ marginTop: "16px", padding: "16px", background: "#f8f7f4", borderRadius: "8px", fontSize: "12.5px", color: "#5a5a54" }}>
          <div>Total scraped: <strong>{String(result.total)}</strong></div>
          <div>Imported: <strong style={{ color: "#3a7a50" }}>{String(result.imported)}</strong></div>
          <div>Already in DB: <strong>{String(result.duplicates)}</strong></div>
          <div>Filtered out (recent sale / low equity): <strong>{String(result.skipped ?? 0)}</strong></div>
          {Number(result.errors) > 0 && <div>Errors: <strong style={{ color: "#c0392b" }}>{String(result.errors)}</strong></div>}
        </div>
      )}
    </div>
  );
}
