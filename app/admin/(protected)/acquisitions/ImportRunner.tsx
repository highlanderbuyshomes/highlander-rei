"use client";

import { useState } from "react";

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

type Status = "idle" | "starting" | "running" | "ingesting" | "done" | "error";

export default function ImportRunner() {
  const [actorId, setActorId] = useState(process.env.NEXT_PUBLIC_APIFY_ACTOR_ID ?? "");
  const [inputJson, setInputJson] = useState("{}");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  async function handleRun() {
    setStatus("starting");
    setMessage("Starting Apify actor...");
    setResult(null);

    try {
      const startRes = await fetch("/api/acquisitions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", actorId, input: JSON.parse(inputJson) }),
      });
      if (!startRes.ok) throw new Error(await startRes.text());
      const { importRunId, apifyRunId } = await startRes.json();

      setStatus("running");
      setMessage("Actor running, polling for completion...");

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
        setMessage(`Actor status: ${pollData.status}`);
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
      setMessage(`Done — ${ingestData.imported} imported, ${ingestData.duplicates} duplicates, ${ingestData.errors} errors`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : String(err));
    }
  }

  const running = status === "starting" || status === "running" || status === "ingesting";

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "24px", marginBottom: "20px" }}>
      <div style={{ fontSize: "14px", fontWeight: 600, color: "#111110", marginBottom: "16px" }}>Run Apify Import</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <div>
          <span style={label}>Actor ID</span>
          <input value={actorId} onChange={(e) => setActorId(e.target.value)} placeholder="username/actor-name" style={inp} />
        </div>
        <div>
          <span style={label}>Actor Input (JSON)</span>
          <input value={inputJson} onChange={(e) => setInputJson(e.target.value)} placeholder='{"location": "Scottsdale, AZ"}' style={inp} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          onClick={handleRun}
          disabled={running || !actorId}
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
          <div>Total records: <strong>{String(result.total)}</strong></div>
          <div>Imported: <strong style={{ color: "#3a7a50" }}>{String(result.imported)}</strong></div>
          <div>Duplicates: <strong>{String(result.duplicates)}</strong></div>
          <div>Errors: <strong style={{ color: result.errors ? "#c0392b" : "inherit" }}>{String(result.errors)}</strong></div>
        </div>
      )}
    </div>
  );
}
