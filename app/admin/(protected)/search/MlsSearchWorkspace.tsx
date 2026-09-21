"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildFilters, type CriteriaKey } from "@/lib/search/build-filters";
import { normalizeStatus } from "@/lib/search/score-deals";
import type { DealCandidate, DrawnShape, ListingRecord, SearchFilters, SearchResponse } from "@/lib/search/types";
import { targetProperty } from "./actions";
import GoogleMapStage from "./GoogleMapStage";
import styles from "./search.module.css";

type WorkspaceView = "map" | "list" | "detail";

const criteria: { key: CriteriaKey; label: string }[] = [
  { key: "status", label: "Status" },
  { key: "price", label: "List Price" },
  { key: "dwelling", label: "Dwelling Type" },
  { key: "beds", label: "# Bedrooms" },
  { key: "baths", label: "Total Bathrooms" },
  { key: "sqft", label: "Approx SQFT" },
  { key: "lot", label: "Lot Size" },
  { key: "pool", label: "Private Pool Y/N" },
  { key: "levels", label: "# of Interior Levels" },
  { key: "zip", label: "Zip Code" },
];

const statusOptions = ["Active", "Coming Soon", "Pending", "Closed", "Expired", "Canceled"];
const dwellingOptions = ["Single Family", "Townhouse", "Condo", "Patio Home", "Manufactured", "Multi-Family"];

function money(value: number | null, compact = false) {
  if (value == null) return "—";
  if (compact && value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (compact && value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function shortDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
}

const ARV_THRESHOLD_OPTIONS = [70, 75, 80] as const;
const ARV_THRESHOLD_MIN = 1;
const ARV_THRESHOLD_MAX = 99;

function clampThreshold(value: number): number {
  return Math.min(ARV_THRESHOLD_MAX, Math.max(ARV_THRESHOLD_MIN, Math.round(value)));
}

export default function MlsSearchWorkspace({ initial }: { initial: SearchResponse }) {
  const [view, setView] = useState<WorkspaceView>("map");
  const [activeCriteria, setActiveCriteria] = useState<Set<CriteriaKey>>(new Set(["status"]));
  const [statuses, setStatuses] = useState<string[]>(["Active", "Coming Soon"]);
  const [closedWithinMonths, setClosedWithinMonths] = useState("Any");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [dwellingTypes, setDwellingTypes] = useState<string[]>([]);
  const [bedsMin, setBedsMin] = useState("");
  const [bathsMin, setBathsMin] = useState("");
  const [sqftMin, setSqftMin] = useState("");
  const [sqftMax, setSqftMax] = useState("");
  const [lotMin, setLotMin] = useState("");
  const [lotMax, setLotMax] = useState("");
  const [pool, setPool] = useState("Any");
  const [levels, setLevels] = useState("Any");
  const [zips, setZips] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [arvThreshold, setArvThreshold] = useState<number>(70);

  const [result, setResult] = useState<SearchResponse>(initial);
  const [rows, setRows] = useState<DealCandidate[]>(initial.rows);
  const [shape, setShape] = useState<DrawnShape | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [selectedExtra, setSelectedExtra] = useState<ListingRecord | null>(null);

  const filters = buildFilters({
    activeCriteria, statuses, closedWithinMonths, priceMin, priceMax, dwellingTypes,
    bedsMin, bathsMin, sqftMin, sqftMax, lotMin, lotMax, pool, levels, zips, keyword,
  });
  const requestKey = JSON.stringify({ filters, arvThreshold, shape });
  const firstRun = useRef(true);
  const currentKey = useRef(requestKey);
  useEffect(() => { currentKey.current = requestKey; }, [requestKey]);

  useEffect(() => {
    // The server already rendered the initial request; only changes refetch.
    if (firstRun.current) { firstRun.current = false; return; }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filters, arvThreshold, shape, page: 0 }),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `Search failed (${res.status})`);
        const data: SearchResponse = await res.json();
        setResult(data);
        setRows(data.rows);
        setPage(0);
      } catch (caught) {
        if ((caught as Error).name !== "AbortError") setError("Couldn't refresh results — change a filter to retry.");
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => { clearTimeout(timer); ctrl.abort(); };
    // requestKey is the serialised form of filters/arvThreshold/shape, so it is
    // the complete (and value-stable) dependency for this request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  async function loadMore() {
    const next = page + 1;
    const key = requestKey;
    setLoadingMore(true);
    setError("");
    try {
      const res = await fetch("/api/admin/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters, arvThreshold, shape, page: next }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `Search failed (${res.status})`);
      const data: SearchResponse = await res.json();
      // The filters may have changed while this page was in flight; those rows
      // belong to a search that is no longer on screen, so drop them.
      if (currentKey.current !== key) return;
      setRows((current) => [...current, ...data.rows]);
      setPage(next);
    } catch {
      setError("Couldn't load more results — try again.");
    } finally {
      setLoadingMore(false);
    }
  }

  const inPage = rows.find((row) => row.id === selectedId) ?? null;
  const selected: ListingRecord | null = !selectedId ? null : inPage ?? (selectedExtra?.id === selectedId ? selectedExtra : null);

  // Pins cover every match, so a pin (or a stale selection) can point at a
  // listing outside the loaded page; fetch that one record on demand.
  useEffect(() => {
    if (!selectedId || rows.some((row) => row.id === selectedId)) return;
    const ctrl = new AbortController();
    fetch(`/api/admin/search/listing?id=${encodeURIComponent(selectedId)}`, { signal: ctrl.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ListingRecord | null) => { if (data) setSelectedExtra(data); })
      .catch(() => { /* aborted or offline; the card simply stays empty */ });
    return () => ctrl.abort();
  }, [selectedId, rows]);

  const shapeKey = useRef("null");
  const handleShapeChange = useCallback((next: DrawnShape | null) => {
    const key = JSON.stringify(next ?? null);
    if (key === shapeKey.current) return;
    shapeKey.current = key;
    setShape(next);
  }, []);

  function toggleCriterion(key: CriteriaKey) {
    setActiveCriteria((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function toggleValue(value: string, values: string[], update: (next: string[]) => void) {
    update(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  function reset() {
    setActiveCriteria(new Set(["status"]));
    setStatuses(["Active", "Coming Soon"]); setClosedWithinMonths("Any"); setPriceMin(""); setPriceMax(""); setDwellingTypes([]);
    setBedsMin(""); setBathsMin(""); setSqftMin(""); setSqftMax(""); setLotMin(""); setLotMax("");
    setPool("Any"); setLevels("Any"); setZips(""); setKeyword("");
  }

  return (
    <main className={styles.shell}>
      <header className={styles.pageHeader}>
        <div className={styles.searchTitle}><div><h1>Deal Search</h1><p>MLS filters, map pockets, and {arvThreshold}% ARV deal ranking.</p></div></div>
        <div className={styles.headerTools}>
          <nav className={styles.viewNav} aria-label="Search views">
            {(["map", "list", "detail"] as WorkspaceView[]).map((item) => <button key={item} type="button" className={view === item ? styles.viewActive : ""} onClick={() => setView(item)}>{item.charAt(0).toUpperCase() + item.slice(1)}</button>)}
          </nav>
        </div>
      </header>
      {error && <p className={styles.previewNote} role="alert">{error}</p>}

      <div className={styles.searchWorkspace}>
        <aside className={styles.criteriaPanel}>
          <div className={styles.resultHeading}>Matching properties <strong style={{ opacity: loading ? 0.45 : 1 }}>{result.total.toLocaleString()}</strong>{shape && <span>in pocket</span>}</div>
          <label className={styles.mlsLookup}><span>⌕</span><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="MLS #, address, city or ZIP" /></label>
          <div className={styles.criteriaList}>
            {criteria.map(({ key, label }) => {
              const active = activeCriteria.has(key);
              return (
                <div key={key} className={`${styles.criterion} ${active ? styles.criterionActive : ""}`}>
                  <label className={styles.criterionLabel}><input type="checkbox" checked={active} onChange={() => toggleCriterion(key)} /><strong>{label}</strong>{key === "status" && active && <span>of {statuses.join(", ") || "Any"}</span>}</label>
                  {active && <CriterionInputs criterion={key} statuses={statuses} setStatuses={setStatuses} closedWithinMonths={closedWithinMonths} setClosedWithinMonths={setClosedWithinMonths} priceMin={priceMin} setPriceMin={setPriceMin} priceMax={priceMax} setPriceMax={setPriceMax} dwellingTypes={dwellingTypes} setDwellingTypes={setDwellingTypes} bedsMin={bedsMin} setBedsMin={setBedsMin} bathsMin={bathsMin} setBathsMin={setBathsMin} sqftMin={sqftMin} setSqftMin={setSqftMin} sqftMax={sqftMax} setSqftMax={setSqftMax} lotMin={lotMin} setLotMin={setLotMin} lotMax={lotMax} setLotMax={setLotMax} pool={pool} setPool={setPool} levels={levels} setLevels={setLevels} zips={zips} setZips={setZips} toggleValue={toggleValue} />}
                </div>
              );
            })}
          </div>
          <div className={styles.criteriaFooter}><button type="button" onClick={reset}>Reset filters</button><button type="button" className={styles.applyButton} onClick={() => setView("list")}>View {result.total.toLocaleString()}</button></div>
        </aside>

        <section className={styles.mainStage}>
          {view === "map" && <GoogleMapStage pins={result.pins} selected={selected} total={result.total} onSelect={setSelectedId} onShapeChange={handleShapeChange} />}
          {view === "list" && <ResultsList listings={rows} total={result.total} loading={loading} loadingMore={loadingMore} onLoadMore={loadMore} onSelect={(id) => { setSelectedId(id); setView("detail"); }} />}
          {view === "detail" && <ListingDetail listing={selected} />}
        </section>
      </div>
      <DealIntelligence candidates={rows} threshold={arvThreshold} onThresholdChange={setArvThreshold} />
    </main>
  );
}

type CriterionProps = {
  criterion: CriteriaKey; statuses: string[]; setStatuses: (value: string[]) => void;
  closedWithinMonths: string; setClosedWithinMonths: (value: string) => void;
  priceMin: string; setPriceMin: (value: string) => void; priceMax: string; setPriceMax: (value: string) => void;
  dwellingTypes: string[]; setDwellingTypes: (value: string[]) => void;
  bedsMin: string; setBedsMin: (value: string) => void; bathsMin: string; setBathsMin: (value: string) => void;
  sqftMin: string; setSqftMin: (value: string) => void; sqftMax: string; setSqftMax: (value: string) => void;
  lotMin: string; setLotMin: (value: string) => void; lotMax: string; setLotMax: (value: string) => void;
  pool: string; setPool: (value: string) => void; levels: string; setLevels: (value: string) => void;
  zips: string; setZips: (value: string) => void;
  toggleValue: (value: string, values: string[], update: (next: string[]) => void) => void;
};

function CriterionInputs(props: CriterionProps) {
  const numeric = (value: string, update: (next: string) => void) => update(value.replace(/[^0-9.]/g, ""));
  if (props.criterion === "status") return <><div className={styles.optionGrid}>{statusOptions.map((value) => <label key={value}><input type="checkbox" checked={props.statuses.includes(value)} onChange={() => props.toggleValue(value, props.statuses, props.setStatuses)} />{value}</label>)}</div><label className={styles.statusDateFilter}><span>Closed within</span><select value={props.closedWithinMonths} onChange={(event) => { const value = event.target.value; props.setClosedWithinMonths(value); if (value !== "Any") props.setStatuses(["Closed"]); }}><option value="Any">Any date</option>{[3, 6, 9, 12, 18].map((months) => <option key={months} value={months}>{months} months</option>)}</select></label></>;
  if (props.criterion === "dwelling") return <div className={styles.optionGrid}>{dwellingOptions.map((value) => <label key={value}><input type="checkbox" checked={props.dwellingTypes.includes(value)} onChange={() => props.toggleValue(value, props.dwellingTypes, props.setDwellingTypes)} />{value}</label>)}</div>;
  if (props.criterion === "price") return <RangeInputs min={props.priceMin} max={props.priceMax} setMin={props.setPriceMin} setMax={props.setPriceMax} prefix="$" onInput={numeric} />;
  if (props.criterion === "sqft") return <RangeInputs min={props.sqftMin} max={props.sqftMax} setMin={props.setSqftMin} setMax={props.setSqftMax} onInput={numeric} />;
  if (props.criterion === "lot") return <RangeInputs min={props.lotMin} max={props.lotMax} setMin={props.setLotMin} setMax={props.setLotMax} onInput={numeric} />;
  if (props.criterion === "beds") return <MinSelect value={props.bedsMin} update={props.setBedsMin} options={["1", "2", "3", "4", "5"]} />;
  if (props.criterion === "baths") return <MinSelect value={props.bathsMin} update={props.setBathsMin} options={["1", "1.5", "2", "2.5", "3", "4"]} />;
  if (props.criterion === "pool") return <MinSelect value={props.pool} update={props.setPool} options={["Any", "Yes", "No"]} exact />;
  if (props.criterion === "levels") return <MinSelect value={props.levels} update={props.setLevels} options={["Any", "1", "2", "3+"]} exact />;
  return <input className={styles.singleInput} value={props.zips} onChange={(event) => props.setZips(event.target.value.replace(/[^0-9,\s]/g, ""))} placeholder="85018, 85250, 85251" inputMode="numeric" />;
}

function RangeInputs({ min, max, setMin, setMax, prefix = "", onInput }: { min: string; max: string; setMin: (value: string) => void; setMax: (value: string) => void; prefix?: string; onInput: (value: string, update: (next: string) => void) => void }) {
  return <div className={styles.rangeInputs}><label>{prefix}<input value={min} onChange={(event) => onInput(event.target.value, setMin)} placeholder="Minimum" inputMode="numeric" /></label><span>to</span><label>{prefix}<input value={max} onChange={(event) => onInput(event.target.value, setMax)} placeholder="Maximum" inputMode="numeric" /></label></div>;
}

function MinSelect({ value, update, options, exact = false }: { value: string; update: (value: string) => void; options: string[]; exact?: boolean }) {
  return <select className={styles.singleInput} value={value} onChange={(event) => update(event.target.value)}>{!exact && <option value="">No minimum</option>}{options.map((option) => <option key={option} value={option}>{exact ? option : `${option}+`}</option>)}</select>;
}

function ResultsList({ listings, total, loading, loadingMore, onLoadMore, onSelect }: { listings: ListingRecord[]; total: number; loading: boolean; loadingMore: boolean; onLoadMore: () => void; onSelect: (id: string) => void }) {
  return <div className={styles.resultsTable}><table><thead><tr><th>Status</th><th>Closed date</th><th>MLS #</th><th>Address</th><th>Price</th><th>Type</th><th>Bed/Bath</th><th>Sq Ft</th><th>Lot</th><th>Pool</th><th>Levels</th><th>ZIP</th></tr></thead><tbody>{listings.map((listing) => <tr key={listing.id} onClick={() => onSelect(listing.id)}><td>{normalizeStatus(listing.status)}</td><td>{shortDate(listing.closedDate)}</td><td>{listing.mlsNumber}</td><td><strong>{listing.address}</strong><small>{listing.city}</small></td><td>{money(listing.listPrice)}</td><td>{listing.dwellingType}</td><td>{listing.beds ?? "—"} / {listing.baths ?? "—"}</td><td>{listing.sqft?.toLocaleString() ?? "—"}</td><td>{listing.lotSqft?.toLocaleString() ?? "—"}</td><td>{listing.pool == null ? "—" : listing.pool ? "Yes" : "No"}</td><td>{listing.interiorLevels ?? "—"}</td><td>{listing.zip}</td></tr>)}</tbody></table>
    {listings.length < total && <div className={styles.criteriaFooter}><button type="button" className={styles.applyButton} onClick={onLoadMore} disabled={loadingMore || loading}>{loadingMore ? "Loading…" : `Load more — ${listings.length.toLocaleString()} of ${total.toLocaleString()}`}</button></div>}
    {listings.length === 0 && <PlaceholderView title="No results" detail="Change or reset the selected criteria." />}</div>;
}

function ListingDetail({ listing }: { listing: ListingRecord | null }) {
  if (!listing) return <PlaceholderView title="No listing selected" detail="Choose a listing from the List or Map view." />;
  return <div className={styles.detailView}><span>{normalizeStatus(listing.status)} · MLS #{listing.mlsNumber}</span><h2>{listing.address}</h2><p>{listing.city}, {listing.state} {listing.zip}</p><div className={styles.detailGrid}>{[["List price", money(listing.listPrice)], ["Closed date", shortDate(listing.closedDate)], ["Dwelling type", listing.dwellingType], ["Bedrooms", listing.beds ?? "—"], ["Bathrooms", listing.baths ?? "—"], ["Approx SQFT", listing.sqft?.toLocaleString() ?? "—"], ["Lot size", listing.lotSqft?.toLocaleString() ?? "—"], ["Private pool", listing.pool == null ? "Unknown" : listing.pool ? "Yes" : "No"], ["Interior levels", listing.interiorLevels ?? "—"], ["Zip code", listing.zip], ["Owner", listing.ownerName ?? "Not enriched"]].map(([label,value]) => <div key={String(label)}><small>{label}</small><strong>{value}</strong></div>)}</div></div>;
}

function PlaceholderView({ title, detail }: { title: string; detail: string }) { return <div className={styles.placeholder}><strong>{title}</strong><span>{detail}</span></div>; }

function DealIntelligence({ candidates, threshold, onThresholdChange }: { candidates: DealCandidate[]; threshold: number; onThresholdChange: (value: number) => void }) {
  const [mode, setMode] = useState<"ranked" | "rule70" | "ppsf" | "motivated">("ranked");
  const [customInput, setCustomInput] = useState(String(threshold));
  // Re-sync the free-text box when the threshold changes elsewhere (the preset
  // buttons). Adjusting state during render rather than in an effect avoids the
  // extra commit; see https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [shownThreshold, setShownThreshold] = useState(threshold);
  if (shownThreshold !== threshold) {
    setShownThreshold(threshold);
    setCustomInput(String(threshold));
  }

  function commitCustomThreshold() {
    const parsed = Number(customInput);
    if (Number.isFinite(parsed) && customInput.trim() !== "") {
      onThresholdChange(clampThreshold(parsed));
    } else {
      setCustomInput(String(threshold));
    }
  }
  const visible = candidates.filter((item) => {
    if (mode === "rule70") return item.listToArvPct != null && item.listToArvPct <= threshold;
    if (mode === "ppsf") return (item.ppsfDiscountPct ?? 0) >= 10;
    if (mode === "motivated") return ["Expired", "Canceled"].includes(normalizeStatus(item.status)) || (item.dom ?? 0) >= 60 || item.reasons.some((reason) => reason.includes("condition"));
    return true;
  });
  const rule70Count = candidates.filter((item) => item.listToArvPct != null && item.listToArvPct <= threshold).length;
  const highPriorityCount = candidates.filter((item) => ["Target now", "High"].includes(item.priority)).length;
  const ratios = candidates.map((item) => item.listToArvPct).filter((value): value is number => value != null);
  const averageRatio = ratios.length ? ratios.reduce((sum, value) => sum + value, 0) / ratios.length : null;
  const totalSpread = candidates.reduce((sum, item) => sum + Math.max(0, item.rule70Spread ?? 0), 0);

  return (
    <section className={styles.dealSection}>
      <header className={styles.dealHeader}>
        <div><span>Deal Intelligence</span><h2>Rank the properties most likely to become discounted deals</h2><p>The first pass applies the {threshold}% rule, pocket-level price per square foot, listing motivation, condition language, and seller equity. Run the strongest candidates through AI comps before making an offer.</p></div>
        <div className={styles.dealLegend}><i /> Orange map pins meet the {threshold}% rule</div>
      </header>

      <div className={styles.dealMetrics}>
        <div><span>{threshold}% rule matches</span><strong>{rule70Count}</strong><small>List price ≤ {threshold}% projected ARV</small></div>
        <div><span>Acquisition priority</span><strong>{highPriorityCount}</strong><small>Target now or high priority</small></div>
        <div><span>Average list / ARV</span><strong>{averageRatio == null ? "—" : `${Math.round(averageRatio)}%`}</strong><small>Across loaded results</small></div>
        <div><span>Potential {threshold}% spread</span><strong>{money(totalSpread, true)}</strong><small>Before rehab and closing costs</small></div>
      </div>

      <div className={styles.dealToolbar}>
        <div>{([['ranked','Best opportunities'],['rule70',`${threshold}% rule`],['ppsf','Low $/sqft'],['motivated','Motivated']] as const).map(([key, label]) => <button key={key} type="button" className={mode === key ? styles.dealModeActive : ""} onClick={() => setMode(key)}>{label}</button>)}</div>
        <div className={styles.thresholdGroup}>
          <span>ARV discount</span>
          {ARV_THRESHOLD_OPTIONS.map((option) => <button key={option} type="button" className={threshold === option ? styles.dealModeActive : ""} onClick={() => onThresholdChange(option)}>{option}%</button>)}
          <label className={styles.thresholdCustom}>
            <input
              type="number"
              min={ARV_THRESHOLD_MIN}
              max={ARV_THRESHOLD_MAX}
              value={customInput}
              onChange={(event) => setCustomInput(event.target.value)}
              onBlur={commitCustomThreshold}
              onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); commitCustomThreshold(); } }}
            />
            <span>%</span>
          </label>
        </div>
        <span>{visible.length} opportunities ranked</span>
      </div>

      <div className={styles.dealTableWrap}>
        <table className={styles.dealTable}>
          <thead><tr><th>Priority</th><th>Property</th><th>Deal score</th><th>% of ARV · {threshold}% threshold</th><th>Why it surfaced</th><th>Action</th></tr></thead>
          <tbody>{visible.slice(0, 25).map((candidate) => {
            const fullAddress = `${candidate.address}, ${candidate.city}, ${candidate.state} ${candidate.zip}`;
            const targetAction = targetProperty.bind(null, candidate.id, candidate.dealScore, candidate.reasons.join("; "));
            return <tr key={candidate.id}>
              <td><span className={`${styles.priorityBadge} ${styles[`priority${candidate.priority.replace(/\s/g, "")}`]}`}>{candidate.priority}</span></td>
              <td><strong>{candidate.address}</strong><small>{candidate.city}, {candidate.zip} · MLS {candidate.mlsNumber}</small></td>
              <td><div className={styles.scoreCell}><strong>{candidate.dealScore}</strong><span><i style={{ width: `${candidate.dealScore}%` }} /></span></div></td>
              <td><strong className={(candidate.listToArvPct ?? 100) <= threshold ? styles.ruleMatch : ""}>{candidate.listToArvPct == null ? "—" : `${Math.round(candidate.listToArvPct)}%`}</strong><small>{candidate.listToArvPct != null && candidate.listToArvPct <= threshold ? "Meets rule" : "Review"}</small></td>
              <td><div className={styles.reasonList}>{candidate.reasons.length ? candidate.reasons.map((reason) => <span key={reason}>{reason}</span>) : <span>Needs more data</span>}</div></td>
              <td><div className={styles.dealActions}><a href={`/admin/underwriting?address=${encodeURIComponent(fullAddress)}`}>AI verify ARV</a><form action={targetAction}><button type="submit">Target property</button></form></div></td>
            </tr>;
          })}</tbody>
        </table>
        {visible.length === 0 && <div className={styles.noDeals}><strong>No properties match this deal lens</strong><span>Expand the map filters or switch back to Best opportunities.</span></div>}
      </div>
      <footer className={styles.dealDisclaimer}>Projected ARV and deal scores are screening estimates, not final underwriting. Rehab, closing, holding, and resale costs still need to be deducted before an offer is approved.</footer>
    </section>
  );
}
