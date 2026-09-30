import type { ArvAccuracySummary, ErrorStats } from "@/lib/search/backtest";
import { addArvSample, deleteArvSample, runArvAccuracy } from "./actions";
import RunButton from "./RunButton";

const card = { background: "#ffffff", border: "1px solid #e1e7ec", borderRadius: "14px", padding: "24px", marginBottom: "16px" } as const;
const heading = { fontFamily: "var(--font-display), serif", fontSize: "16px", color: "#12161c", letterSpacing: "1px" } as const;
const muted = { fontSize: "12px", color: "#64748b" } as const;
const th = { textAlign: "left", fontSize: "10.5px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 500, padding: "6px 8px", borderBottom: "1px solid #e1e7ec" } as const;
const td = { fontSize: "12.5px", color: "#12161c", padding: "7px 8px", borderBottom: "1px solid #f1f4f6" } as const;
const input = { width: "100%", padding: "8px 10px", fontSize: "12.5px", color: "#12161c", background: "#ffffff", border: "1px solid #c7d0d8", borderRadius: "6px", fontFamily: "inherit", boxSizing: "border-box" } as const;
const label = { fontSize: "10.5px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "4px", display: "block", fontWeight: 500 } as const;

const money = (v: number | null) => (v == null ? "—" : v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }));
const miss = (s: ErrorStats | null | undefined) => (s ? `${s.medianMiss}% · ±${s.p70}%` : "—");
const signed = (v: number | null) => (v == null ? "—" : `${v > 0 ? "+" : ""}${v}%`);

type Sample = { id: string; address: string; zip: string; status: string; condition: string; price: number; priceHigh: number | null; note: string | null };

export default function ArvAccuracyPanel({ run, samples }: { run: { createdAt: Date; summary: ArvAccuracySummary } | null; samples: Sample[] }) {
  const s = run?.summary;
  const bySample = new Map(s?.samples.map((r) => [r.id, r]));
  return <>
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div>
          <div style={heading}>ARV ACCURACY</div>
          <div style={muted}>{run ? `Last run ${run.createdAt.toLocaleString("en-US", { timeZone: "America/Phoenix", dateStyle: "medium", timeStyle: "short" })} · weekly` : "Not run yet"}</div>
        </div>
        <form action={runArvAccuracy}><RunButton /></form>
      </div>
      {s && <>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          {([["ARV", s.arv, "flip resales"], ["Clean as-is", s.asIs, "clean sales"]] as const).map(([name, part, what]) => (
            <div key={name} style={{ background: "#f8fafb", border: "1px solid #e1e7ec", borderRadius: "10px", padding: "14px" }}>
              <div style={label}>{name} · median miss</div>
              <div style={{ fontSize: "24px", fontWeight: 600, color: "#12161c" }}>{part.overall ? `${part.overall.medianMiss}%` : "—"}</div>
              <div style={muted}>{part.overall ? `${part.overall.within10}% within 10% · ${part.overall.n.toLocaleString()} ${what} · ${part.insideRangePct}% inside ± range` : ""}</div>
            </div>
          ))}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>Value</th><th style={th}>ARV miss · range</th><th style={th}>As-is miss · range</th></tr></thead>
          <tbody>{(["<300k", "300-450k", "450-700k", "700k+"] as const).map((t) => (
            <tr key={t}><td style={td}>{t}</td><td style={td}>{miss(s.arv.tiers[t])}</td><td style={td}>{miss(s.asIs.tiers[t])}</td></tr>
          ))}</tbody>
        </table>
        <div style={{ ...muted, marginTop: "12px" }} title="Accepted offers, price unknown until close — context only, never counted or used to tune">
          Pending flips (supporting, not counted): ARV {signed(s.pending.under700?.bias ?? null)} vs asking under $700k ({s.pending.under700?.n ?? 0}), {signed(s.pending.over700?.bias ?? null)} at $700k+ ({s.pending.over700?.n ?? 0})
        </div>
      </>}
    </div>

    <div style={card}>
      <div style={{ ...heading, marginBottom: "4px" }}>SAMPLES</div>
      <div style={{ ...muted, marginBottom: "12px" }}>Remodeled → ARV · clean → as-is · pending = supporting only</div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "18px" }}>
        <thead><tr><th style={th}>Property</th><th style={th}>Actual</th><th style={th}>Ours</th><th style={th}>Miss</th><th style={th} /></tr></thead>
        <tbody>{samples.map((x) => {
          const r = bySample.get(x.id);
          const pending = x.status === "pending";
          return <tr key={x.id} style={pending ? { color: "#64748b", fontStyle: "italic" } : undefined}>
            <td style={td} title={x.note ?? undefined}>{x.address}, {x.zip}<div style={muted}>{x.condition === "clean" ? "Clean" : "Remodeled"}{pending ? " · pending (supporting)" : ""}</div></td>
            <td style={td}>{money(x.price)}{x.priceHigh ? `–${money(x.priceHigh)}` : ""}</td>
            <td style={td}>{r ? `${money(r.estimate)}${r.rangePct ? ` ±${r.rangePct}%` : ""}` : "next run"}</td>
            <td style={td}>{r ? signed(r.missPct) : "—"}</td>
            <td style={td}><form action={deleteArvSample}><input type="hidden" name="id" value={x.id} /><button type="submit" aria-label={`Remove ${x.address}`} style={{ border: 0, background: "none", color: "#94a3b8", cursor: "pointer", fontSize: "14px" }}>×</button></form></td>
          </tr>;
        })}</tbody>
      </table>
      <form action={addArvSample} style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px" }}>
        <div><label style={label}>Street address</label><input name="address" required placeholder="4241 N 82nd Dr" style={input} /></div>
        <div><label style={label}>ZIP</label><input name="zip" required inputMode="numeric" pattern="\d{5}" style={input} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div><label style={label}>Price</label><input name="price" required inputMode="numeric" style={input} /></div>
          <div><label style={label}>To (offer range)</label><input name="priceHigh" inputMode="numeric" style={input} /></div>
        </div>
        <div><label style={label}>Date</label><input name="date" type="date" style={input} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div><label style={label}>Status</label><select name="status" style={input}><option value="sold">Sold</option><option value="pending">Pending</option></select></div>
          <div><label style={label}>Condition</label><select name="condition" style={input}><option value="remodeled">Remodeled</option><option value="clean">Clean</option></select></div>
        </div>
        <div><label style={label}>Note</label><input name="note" style={input} /></div>
        <button type="submit" style={{ gridColumn: "1 / -1", padding: "10px", background: "#12161c", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Add sample</button>
      </form>
    </div>
  </>;
}
