"use client";

import { useState, useTransition } from "react";

type DispatchResult = {
  sent: number;
  skipped: number;
};

export default function DialerIntegrationPanel({
  configured,
  initialPending,
}: {
  configured: boolean;
  initialPending: number;
}) {
  const [pending, setPending] = useState(initialPending);
  const [result, setResult] = useState<DispatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function dispatchAssignments() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const response = await fetch("/api/integrations/dialer/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 100 }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? "The dialer dispatch failed.");
        return;
      }

      const nextResult = {
        sent: typeof data?.sent === "number" ? data.sent : 0,
        skipped: typeof data?.skipped === "number" ? data.skipped : 0,
      };
      setResult(nextResult);
      setPending((current) => Math.max(0, current - nextResult.sent));
    });
  }

  return (
    <section style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "24px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>
            MY DIALER QUEUE
          </div>
          <p style={{ margin: 0, color: "#6f6f69", fontSize: "13px", lineHeight: 1.7, maxWidth: "560px" }}>
            Qualified acquisition assignments are sent directly to the correct caller&apos;s seller queue. Call outcomes and DNC requests synchronize back to the property record.
          </p>
        </div>
        <span style={{ borderRadius: "999px", padding: "7px 11px", fontSize: "12px", fontWeight: 700, background: configured ? "#eaf6ee" : "#fff3dc", color: configured ? "#267044" : "#8b5b00" }}>
          {configured ? "Connected" : "Configuration required"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginTop: "28px" }}>
        <div style={{ background: "#f7f7f4", borderRadius: "10px", padding: "18px" }}>
          <div style={{ color: "#8a8a84", fontSize: "11px", fontWeight: 700, letterSpacing: "1px" }}>PENDING</div>
          <div style={{ color: "#111110", fontSize: "28px", fontWeight: 750, marginTop: "6px" }}>{pending}</div>
        </div>
        <div style={{ background: "#f7f7f4", borderRadius: "10px", padding: "18px" }}>
          <div style={{ color: "#8a8a84", fontSize: "11px", fontWeight: 700, letterSpacing: "1px" }}>BATCH SIZE</div>
          <div style={{ color: "#111110", fontSize: "28px", fontWeight: 750, marginTop: "6px" }}>100</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginTop: "24px" }}>
        <button
          type="button"
          onClick={dispatchAssignments}
          disabled={!configured || isPending || pending === 0}
          style={{ border: 0, borderRadius: "9px", padding: "11px 18px", fontSize: "13px", fontWeight: 750, color: "#ffffff", background: !configured || pending === 0 ? "#aaa9a3" : "#111110", cursor: !configured || pending === 0 ? "not-allowed" : "pointer" }}
        >
          {isPending ? "Dispatching…" : "Send pending assignments"}
        </button>
        <a href="/admin/dialer/launch" style={{ color: "#111110", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>
          Open My Dialer →
        </a>
      </div>

      <div aria-live="polite" style={{ minHeight: "24px", marginTop: "16px", fontSize: "13px" }}>
        {result ? <span style={{ color: "#267044" }}>Sent {result.sent}; skipped {result.skipped}.</span> : null}
        {error ? <span style={{ color: "#a13a30" }}>{error}</span> : null}
      </div>
    </section>
  );
}
