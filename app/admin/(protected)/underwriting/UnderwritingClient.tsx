"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Comp {
  id: string;
  address: { address: string; street: string; city: string; state: string; zip: string };
  price: { amount: number; date: string };
  squareFeet: number;
  bedrooms: number;
  bathrooms: number;
  distance: number;
  imageUrl: string;
  lastSaleDate: string;
  yearBuilt: string;
  analysisResult?: { condition?: string };
}

interface Subject {
  beds: number;
  fullBaths: number;
  halfBaths: number;
  squareFootage: number;
  yearBuilt?: string;
  address: { full: string; street: string; city: string; state: string; zip: string };
}

interface AnalysisData {
  comps: Comp[];
  totalResults: number;
  subject: Subject;
  feedbackSummary: string;
  suggested_mao: number;
  est_value: number;
  confidence: number;
}

const CONDITION_LABELS: Record<string, string> = {
  "renovated-high": "Fully Renovated",
  "renovated-mid": "Updated",
  average: "Average",
  distressed: "Distressed",
  "new-construction": "New Build",
};

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function daysAgo(dateStr: string) {
  const days = Math.round((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return `${Math.round(days / 365)}yr ago`;
}

export default function UnderwritingClient() {
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "polling" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisData | null>(null);
  const [rehabCost, setRehabCost] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runIdRef = useRef<string | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const poll = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/underwriting?id=${id}`);
      const data = await res.json();
      if (data.status === "completed") {
        stopPolling();
        setResult(data.data);
        setStatus("done");
      } else if (data.status === "failed") {
        stopPolling();
        setError(data.error ?? "Analysis failed");
        setStatus("error");
      }
    } catch {
      stopPolling();
      setError("Network error while polling");
      setStatus("error");
    }
  }, [stopPolling]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    stopPolling();
    setStatus("submitting");
    setError(null);
    setResult(null);
    setRehabCost("");

    try {
      const res = await fetch("/api/underwriting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to start analysis"); setStatus("error"); return; }

      runIdRef.current = data.requestRunId;
      setStatus("polling");
      poll(data.requestRunId);
      pollRef.current = setInterval(() => { if (runIdRef.current) poll(runIdRef.current); }, 4000);
    } catch {
      setError("Network error");
      setStatus("error");
    }
  };

  const rehabNum = parseFloat(rehabCost.replace(/[^0-9.]/g, "")) || 0;
  const arv = result?.est_value ?? 0;
  const rule70 = arv * 0.7;
  const mao = rule70 - rehabNum;
  const suggestedMao = result ? arv * (result.suggested_mao / 100) : 0;
  const isLoading = status === "submitting" || status === "polling";

  const inp: React.CSSProperties = {
    border: "none", background: "transparent", fontSize: "13px",
    color: "#111110", outline: "none", fontFamily: "inherit", padding: "8px 6px",
  };

  return (
    <div style={{ maxWidth: "1100px", padding: "32px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontFamily: "var(--font-display), serif", fontSize: "36px", color: "#111110", letterSpacing: "2px", lineHeight: 1 }}>UNDERWRITING</div>
        <div style={{ fontSize: "12px", color: "#8a8a84", marginTop: "4px" }}>Enter a property address to pull comps and calculate your offer</div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px", marginBottom: "28px" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", background: "#ffffff", border: "1px solid #d0cfc8", borderRadius: "8px", padding: "0 16px", gap: "10px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a8a84" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, Phoenix, AZ 85001"
            disabled={isLoading}
            style={{ flex: 1, border: "none", background: "transparent", fontSize: "14px", color: "#111110", outline: "none", padding: "14px 0", fontFamily: "inherit" }}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !address.trim()}
          style={{ padding: "0 28px", background: isLoading ? "#8a8a84" : "#111110", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer", fontFamily: "inherit", letterSpacing: "0.5px", whiteSpace: "nowrap" }}
        >
          {isLoading ? "Analyzing…" : "Run Analysis"}
        </button>
      </form>

      {/* Loading */}
      {isLoading && (
        <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "14px", padding: "60px 40px", textAlign: "center" }}>
          <div style={{ width: "36px", height: "36px", border: "3px solid #e8e7e2", borderTopColor: "#B8962E", borderRadius: "50%", margin: "0 auto 20px", animation: "spin 0.8s linear infinite" }} />
          <div style={{ fontFamily: "var(--font-display), serif", fontSize: "18px", color: "#111110", letterSpacing: "1.5px", marginBottom: "8px" }}>PULLING COMPS</div>
          <div style={{ fontSize: "13px", color: "#8a8a84" }}>Analyzing comparable sales — this takes about 20 seconds</div>
        </div>
      )}

      {/* Error */}
      {status === "error" && error && (
        <div style={{ background: "#fff5f5", border: "1px solid #fca5a5", borderRadius: "12px", padding: "16px 20px", color: "#dc2626", fontSize: "13px" }}>
          {error}
        </div>
      )}

      {/* Results */}
      {status === "done" && result && (
        <>
          {/* Subject */}
          <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "12px", padding: "18px 22px", marginBottom: "14px" }}>
            <div style={{ fontSize: "9.5px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, marginBottom: "6px" }}>SUBJECT PROPERTY</div>
            <div style={{ fontSize: "15px", color: "#111110", fontWeight: 600 }}>{result.subject.address.full}</div>
            <div style={{ fontSize: "12px", color: "#8a8a84", marginTop: "3px" }}>
              {result.subject.beds}bd · {result.subject.fullBaths}ba
              {result.subject.squareFootage ? ` · ${result.subject.squareFootage.toLocaleString()} sqft` : ""}
              {result.subject.yearBuilt ? ` · Built ${result.subject.yearBuilt}` : ""}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div style={{ background: "#111110", borderRadius: "12px", padding: "20px 22px" }}>
              <div style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, marginBottom: "8px" }}>ARV ESTIMATE</div>
              <div style={{ fontFamily: "var(--font-display), serif", fontSize: "28px", color: "#E8D9A0", letterSpacing: "0.5px" }}>{fmt(arv)}</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "4px" }}>{result.totalResults} comps analyzed</div>
            </div>
            <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "12px", padding: "20px 22px" }}>
              <div style={{ fontSize: "9.5px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, marginBottom: "8px" }}>70% RULE</div>
              <div style={{ fontFamily: "var(--font-display), serif", fontSize: "28px", color: "#111110", letterSpacing: "0.5px" }}>{fmt(rule70)}</div>
              <div style={{ fontSize: "11px", color: "#8a8a84", marginTop: "4px" }}>Before rehab deduction</div>
            </div>
            <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "12px", padding: "20px 22px" }}>
              <div style={{ fontSize: "9.5px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, marginBottom: "8px" }}>CONFIDENCE</div>
              <div style={{ fontFamily: "var(--font-display), serif", fontSize: "28px", color: "#111110", letterSpacing: "0.5px" }}>{result.confidence}%</div>
              <div style={{ fontSize: "11px", color: "#8a8a84", marginTop: "4px" }}>AI suggested {result.suggested_mao}% MAO</div>
            </div>
          </div>

          {/* MAO Calculator */}
          <div style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "12px", padding: "18px 22px", marginBottom: "14px" }}>
            <div style={{ fontSize: "9.5px", color: "#8a8a84", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, marginBottom: "14px" }}>MAX ALLOWABLE OFFER</div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "13px", color: "#5a5a54" }}>ARV × 70% = <strong style={{ color: "#111110" }}>{fmt(rule70)}</strong></span>
              <span style={{ fontSize: "13px", color: "#8a8a84" }}>−</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", color: "#5a5a54" }}>Rehab:</span>
                <div style={{ display: "flex", alignItems: "center", background: "#f5f4f0", border: "1px solid #d0cfc8", borderRadius: "6px", padding: "0 10px" }}>
                  <span style={{ fontSize: "13px", color: "#8a8a84" }}>$</span>
                  <input type="text" value={rehabCost} onChange={(e) => setRehabCost(e.target.value)} placeholder="0" style={{ ...inp, width: "100px" }} />
                </div>
              </div>
              <span style={{ fontSize: "13px", color: "#8a8a84" }}>=</span>
              <div>
                <span style={{ fontSize: "13px", color: "#5a5a54" }}>MAO: </span>
                <span style={{ fontFamily: "var(--font-display), serif", fontSize: "22px", color: mao >= 0 ? "#111110" : "#dc2626", letterSpacing: "0.5px" }}>{fmt(Math.max(mao, 0))}</span>
              </div>
              <div style={{ marginLeft: "auto", padding: "5px 12px", background: "rgba(184,150,46,0.1)", border: "1px solid rgba(184,150,46,0.3)", borderRadius: "20px", fontSize: "11.5px", color: "#8a6a10", fontWeight: 600, whiteSpace: "nowrap" }}>
                AI Suggested: {fmt(suggestedMao)} ({result.suggested_mao}%)
              </div>
            </div>
          </div>

          {/* AI Feedback */}
          {result.feedbackSummary && (
            <div style={{ background: "#fffbf0", border: "1px solid #f0e6b8", borderRadius: "12px", padding: "14px 18px", marginBottom: "24px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B8962E" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: "2px" }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div style={{ fontSize: "13px", color: "#5a4a1a", lineHeight: "1.65" }}>{result.feedbackSummary}</div>
            </div>
          )}

          {/* Comps */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ fontFamily: "var(--font-display), serif", fontSize: "18px", color: "#111110", letterSpacing: "1.5px" }}>COMPARABLE SALES</div>
            <span style={{ fontSize: "12px", color: "#8a8a84" }}>{result.comps.length} comps</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "12px" }}>
            {result.comps.map((comp) => (
              <div key={comp.id} style={{ background: "#ffffff", border: "1px solid #e8e7e2", borderRadius: "12px", overflow: "hidden" }}>
                {comp.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={comp.imageUrl} alt={comp.address.street} loading="lazy" style={{ width: "100%", height: "155px", objectFit: "cover", display: "block" }} />
                )}
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: "13px", color: "#111110", fontWeight: 600, marginBottom: "2px" }}>{comp.address.street}</div>
                  <div style={{ fontSize: "11.5px", color: "#8a8a84", marginBottom: "10px" }}>{comp.address.city}, {comp.address.state} {comp.address.zip}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                    <span style={{ fontFamily: "var(--font-display), serif", fontSize: "20px", color: "#111110", letterSpacing: "0.5px" }}>{fmt(comp.price.amount)}</span>
                    <span style={{ fontSize: "11px", color: "#8a8a84" }}>{comp.lastSaleDate ? daysAgo(comp.lastSaleDate) : ""}</span>
                  </div>
                  <div style={{ display: "flex", gap: "10px", fontSize: "11.5px", color: "#5a5a54", flexWrap: "wrap" }}>
                    <span>{comp.bedrooms}bd / {comp.bathrooms}ba</span>
                    {comp.squareFeet ? <span>{comp.squareFeet.toLocaleString()} sqft</span> : null}
                    <span>{comp.distance.toFixed(1)} mi</span>
                  </div>
                  {comp.analysisResult?.condition && (
                    <div style={{ marginTop: "8px" }}>
                      <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "20px", background: "#f0efeb", color: "#5a5a54", fontWeight: 600, letterSpacing: "0.3px" }}>
                        {CONDITION_LABELS[comp.analysisResult.condition] ?? comp.analysisResult.condition}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
