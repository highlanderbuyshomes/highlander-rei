"use client";

import { useEffect, useState } from "react";
import type { InvestorCompsResponse, InvestorKind, InvestorPrice, InvestorTypes } from "@/lib/search/types";
import styles from "./search.module.css";

const RADII = [0.5, 1, 2];
const PERIODS = [12, 24];
const PROPERTY_TYPES: InvestorTypes[] = ["any", "same"];
const TYPES = ["Any", "Flipper", "Landlord"] as const;
type BuyerType = (typeof TYPES)[number];

const money = (v: number | null) => v == null ? "—" : v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const shortDate = (v: string) => new Date(v).toLocaleDateString("en-US", { month: "short", year: "numeric" });

/** What flippers and landlords paid near this listing. Fetched on open only. */
export default function InvestorComps({ listingId }: { listingId: string }) {
  const [radius, setRadius] = useState(2);
  const [months, setMonths] = useState(24);
  const [types, setTypes] = useState<InvestorTypes>("any");
  const [type, setType] = useState<BuyerType>("Any");
  const [attempt, setAttempt] = useState(0);
  // Keyed by request, so a new radius/period/listing reads as loading without a reset.
  const key = `${listingId}|${radius}|${months}|${types}|${attempt}`;
  const [result, setResult] = useState<{ key: string; data: InvestorCompsResponse | null; error: boolean } | null>(null);
  const current = result?.key === key ? result : null;
  const data = current?.data ?? null;
  const error = current?.error ?? false;

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/admin/search/investor-comps?id=${encodeURIComponent(listingId)}&radius=${radius}&months=${months}&types=${types}`, { signal: ctrl.signal })
      .then((res) => { if (!res.ok) throw new Error(String(res.status)); return res.json(); })
      .then((json: InvestorCompsResponse) => setResult({ key, data: json, error: false }))
      .catch(() => { if (!ctrl.signal.aborted) setResult({ key, data: null, error: true }); });
    return () => ctrl.abort();
  }, [key, listingId, radius, months, types]);

  const buys = data?.buys.filter((b) => type === "Any" || b.kind === type) ?? [];

  return <div className={styles.investorComps}>
    <div className={styles.detailGrid}>
      <PriceTile label="Flippers" value={data?.flipper} />
      <PriceTile label="Landlords" value={data?.landlord} />
    </div>
    {data?.pendingFlips && <p className={styles.supportingFact} title="Accepted offers, price unknown until close — shown as support, never used in the ARV">
      {data.pendingFlips.count} pending flip{data.pendingFlips.count === 1 ? "" : "s"} nearby · asking ${data.pendingFlips.lowPpsf}–{data.pendingFlips.highPpsf}/ft · not in ARV
    </p>}
    <div className={styles.investorFilters}>
      <ButtonGroup label="Radius" options={RADII} value={radius} onChange={setRadius} format={(v) => `${v} mi`} />
      <ButtonGroup label="Period" options={PERIODS} value={months} onChange={setMonths} format={(v) => `${v / 12} yr`} />
      <ButtonGroup label="Type" options={PROPERTY_TYPES} value={types} onChange={setTypes} format={(v) => v === "any" ? "Any type" : "Same type"} />
      <ButtonGroup label="Buyer" options={[...TYPES]} value={type} onChange={setType} format={(v) => v === "Any" ? "Any" : `${v}s`} />
    </div>
    {error ? <p className={styles.previewNote}>Couldn&apos;t load investor comps. <button type="button" className={styles.inlineButton} onClick={() => setAttempt((n) => n + 1)}>Retry</button></p>
      : data == null ? <p className={styles.previewNote}>Loading investor comps…</p>
      : data.missing ? <p className={styles.previewNote}>{data.missing === "location" ? "No location" : "No sqft"}</p>
      : buys.length === 0 ? <p className={styles.previewNote}>No investor buys</p>
      : <div className={styles.resultsTable}><table><thead><tr><th>Buyer</th><th>Address</th><th>Bought</th><th>Price</th><th>Type</th><th>Bd/Ba</th><th>Sq Ft</th><th>Exit / Rent</th><th>Distance</th><th>Match</th></tr></thead><tbody>
        {buys.map((b) => <tr key={b.id}>
          <td><KindTag kind={b.kind} /></td>
          <td><strong>{b.address}</strong><small>{b.city}</small></td>
          <td>{shortDate(b.buyDate)}</td>
          <td>{money(b.buyPrice)}</td>
          <td>{b.dwelling}</td>
          <td>{b.beds ?? "—"} / {b.baths ?? "—"}</td>
          <td>{b.sqft.toLocaleString()}</td>
          <td>{b.kind === "Flipper"
            ? (b.exit ? <><strong>{money(b.exit.price)}{b.pctOfResale != null && ` · ${b.pctOfResale}%`}</strong><small>{b.exit.status} · {shortDate(b.exit.date)}</small></> : "—")
            : (b.rent != null ? `${money(b.rent)}/mo` : "—")}</td>
          <td>{b.distanceMiles} mi</td>
          <td>{b.smartMatch ? <span className={styles.smartTag}>Smart Match</span> : b.score}</td>
        </tr>)}
      </tbody></table></div>}
  </div>;
}

function PriceTile({ label, value }: { label: string; value: InvestorPrice | undefined }) {
  if (value == null) return <div><small>{label}</small><strong>…</strong></div>;
  const k = (v: number) => `$${Math.round(v / 1000)}k`;
  const line1 = [value.ppsf == null ? null : `$${value.ppsf}/ft`, value.pctArv == null ? null : `${value.pctArv}% ARV`, `${value.count} buys`];
  const line2 = [value.low == null || value.high == null ? null : `${k(value.low)}–${k(value.high)}`, value.pctOfResale == null ? null : `${value.pctOfResale}% of resale`];
  return <div>
    <small>{label}</small>
    <strong>{money(value.price)}</strong>
    <small>{line1.filter(Boolean).join(" · ")}</small>
    {line2.some(Boolean) && <small>{line2.filter(Boolean).join(" · ")}</small>}
  </div>;
}

function KindTag({ kind }: { kind: InvestorKind }) {
  return <span className={kind === "Flipper" ? styles.flipperTag : styles.landlordTag}>{kind}</span>;
}

function ButtonGroup<T extends string | number>({ label, options, value, onChange, format }: { label: string; options: T[]; value: T; onChange: (v: T) => void; format: (v: T) => string }) {
  return <div className={styles.compTabs} role="group" aria-label={label}>
    {options.map((o) => <button key={String(o)} type="button" className={o === value ? styles.compTabActive : ""} aria-pressed={o === value} onClick={() => onChange(o)}>{format(o)}</button>)}
  </div>;
}
