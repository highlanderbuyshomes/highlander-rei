"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildFilters, type CriteriaKey } from "@/lib/search/build-filters";
import { parseCities, VALLEY_CITIES } from "@/lib/search/cities";
import { mlsLinks } from "@/lib/search/mls-links";
import { normalizeStatus } from "@/lib/search/score-deals";
import type { CompSale, DealCandidate, DrawnShape, ListingDetailResponse, ListingRecord, SearchResponse } from "@/lib/search/types";
import GoogleMapStage from "./GoogleMapStage";
import InvestorComps from "./InvestorComps";
import BuyerPay from "./BuyerPay";
import styles from "./search.module.css";

type WorkspaceView = "map" | "list" | "detail";

const criteria: { key: CriteriaKey; label: string }[] = [
  { key: "status", label: "Status" },
  { key: "price", label: "Price" },
  { key: "dwelling", label: "Property type" },
  { key: "beds", label: "Bedrooms" },
  { key: "baths", label: "Bathrooms" },
  { key: "sqft", label: "Square feet" },
  { key: "lot", label: "Lot size" },
  { key: "pool", label: "Private pool" },
  { key: "levels", label: "Stories" },
  { key: "zip", label: "ZIP code" },
];


const statusOptions = ["Active", "Coming Soon", "Under Contract", "Pending", "Closed", "Expired", "Canceled"];
const dwellingOptions = ["Single Family", "Townhouse", "Condo", "Patio Home", "Manufactured", "Multi-Family", "Land", "Commercial"];

function money(value: number | null, compact = false) {
  if (value == null) return "—";
  if (compact && value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (compact && value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

/** Closed rows show what they sold for; everything else its asking price. */
function priceOf(listing: ListingRecord) {
  return normalizeStatus(listing.status) === "Closed" && listing.closePrice != null ? listing.closePrice : listing.listPrice;
}

function pct(value: number | null | undefined) {
  return value == null ? "—" : `${Math.round(value)}%`;
}

function arvBasis(d: Pick<DealCandidate, "arvSource" | "arvConfidence" | "arvCompCount" | "arvRadiusMiles" | "arvSameSubdivision" | "arvCompBasis">) {
  const what = d.arvCompBasis === "Flip resales" ? "flip resales" : d.arvCompBasis === "Renovated comps" ? "renovated sales" : "sales (upper quartile)";
  if (d.arvSource === "Sold comps") return `${d.arvCompCount} ${what} ${d.arvSameSubdivision ? "in subdivision" : `≤${d.arvRadiusMiles} mi`} · ${d.arvConfidence}`;
  if (d.arvSource === "ZIP sold $/sqft") return `ZIP sold $/sqft (${d.arvCompCount} sales) · Low`;
  if (d.arvSource === "Pocket $/sqft model") return "Asking $/sqft only · Low";
  return d.arvSource;
}

/** "$417,000 ±10%" — the range 7 in 10 backtested resales fell within. */
function arvWithRange(d: Pick<DealCandidate, "arv" | "arvRangePct">, compact = false) {
  return d.arv == null ? "—" : d.arvRangePct == null ? money(d.arv, compact) : `${money(d.arv, compact)} ±${d.arvRangePct}%`;
}

function shortDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
}

const ARV_THRESHOLD_OPTIONS = [70, 75, 80, 85, 90] as const;
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
  const [cities, setCities] = useState("");
  const selectedCities = parseCities(cities);
  const [selectedId, setSelectedId] = useState("");
  const [arvThreshold, setArvThreshold] = useState<number>(70);

  const [result, setResult] = useState<SearchResponse>(initial);
  const [rows, setRows] = useState<DealCandidate[]>(initial.rows);
  const [shape, setShape] = useState<DrawnShape | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<ListingDetailResponse | null>(null);

  const filters = buildFilters({
    activeCriteria, statuses, closedWithinMonths, priceMin, priceMax, dwellingTypes,
    bedsMin, bathsMin, sqftMin, sqftMax, lotMin, lotMax, pool, levels, zips, keyword, cities,
  });
  const requestKey = JSON.stringify({ filters, arvThreshold, shape });
  const hasArea = Boolean(shape || filters.cities?.length || filters.zips?.length || filters.keyword);
  const [resultKey, setResultKey] = useState(requestKey);
  const resultsPending = loading || requestKey !== resultKey;
  const [matchSummary, setMatchSummary] = useState<number | null>(null);
  const summaryShape = useRef<string | null>(null);
  const summaryClose = useRef<HTMLButtonElement>(null);
  const mainStage = useRef<HTMLElement>(null);
  useEffect(() => {
    if (matchSummary !== null) summaryClose.current?.focus({ preventScroll: true });
  }, [matchSummary]);
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
        if (ctrl.signal.aborted) return;
        setResultKey(requestKey);
        if (summaryShape.current === JSON.stringify(shape)) {
          summaryShape.current = null;
          setMatchSummary(data.total);
        }
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
  const loadedDetail = detail?.id === selectedId ? detail : null;
  const selected: DealCandidate | null = !selectedId ? null : loadedDetail ?? inPage;

  // The detail record carries the sold comps behind its ARV, and a pin can
  // point at a listing outside the loaded page, so fetch it per selection.
  useEffect(() => {
    if (!selectedId) return;
    const ctrl = new AbortController();
    fetch(`/api/admin/search/listing?id=${encodeURIComponent(selectedId)}&threshold=${arvThreshold}`, { signal: ctrl.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ListingDetailResponse | null) => { if (data) setDetail(data); })
      .catch(() => { /* aborted or offline; the card falls back to the page row */ });
    return () => ctrl.abort();
  }, [selectedId, arvThreshold]);

  const shapeKey = useRef("null");
  const handleShapeChange = useCallback((next: DrawnShape | null, showMatches = false) => {
    const key = JSON.stringify(next ?? null);
    if (key === shapeKey.current) return;
    shapeKey.current = key;
    summaryShape.current = showMatches && next ? key : null;
    setMatchSummary(null);
    setSelectedId("");
    setShape(next);
  }, [setMatchSummary, setSelectedId]);

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
    setPool("Any"); setLevels("Any"); setZips(""); setKeyword(""); setCities("");
  }

  return (
    <main className={styles.shell}>
      <header className={styles.pageHeader}>
        <div className={styles.searchTitle}><div><h1>Deal Search</h1></div></div>
        <div className={styles.headerTools}>
          <nav className={styles.viewNav} aria-label="Search views">
            {(["map", "list", "detail"] as WorkspaceView[]).map((item) => <button key={item} type="button" className={view === item ? styles.viewActive : ""} onClick={() => setView(item)}>{item.charAt(0).toUpperCase() + item.slice(1)}</button>)}
          </nav>
        </div>
      </header>
      {error && <p className={styles.previewNote} role="alert">{error}</p>}

      <div className={styles.searchWorkspace}>
        <aside className={styles.criteriaPanel} aria-label="Property filters">
          <div className={styles.resultHeading}>Matching properties <strong style={{ opacity: loading ? 0.45 : 1 }}>{result.total.toLocaleString()}</strong>{shape && <span>in pocket</span>}</div>
          <label className={styles.mlsLookup}><span aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></svg></span><input aria-label="Search MLS number, address, city or ZIP" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="MLS #, address, city or ZIP" /></label>
          <div className={styles.criteriaList}>
            <div className={styles.cityFilter}>
              <div className={styles.cityFilterHeading}>
                <label htmlFor="search-cities">City / area</label>
                {selectedCities.length > 0 && <button type="button" onClick={() => setCities("")}>Clear cities</button>}
              </div>
              <input id="search-cities" value={cities} onChange={(event) => setCities(event.target.value)} placeholder="Gilbert, Tempe, or other cities" />
              <details className={styles.moreCities} open={selectedCities.length > 0 || undefined}>
                <summary>All cities</summary>
                <div className={styles.cityChoices} role="group" aria-label="Cities">
                  {VALLEY_CITIES.map((city) => <CityChip key={city} city={city} selected={selectedCities} onChange={setCities} />)}
                </div>
              </details>
            </div>
            {criteria.map(({ key, label }) => {
              const active = activeCriteria.has(key);
              return (
                <div key={key} className={`${styles.criterion} ${active ? styles.criterionActive : ""}`}>
                  <label className={styles.criterionLabel}><input type="checkbox" checked={active} onChange={() => toggleCriterion(key)} /><strong>{label}</strong></label>
                  {active && <CriterionInputs criterion={key} statuses={statuses} setStatuses={setStatuses} closedWithinMonths={closedWithinMonths} setClosedWithinMonths={setClosedWithinMonths} priceMin={priceMin} setPriceMin={setPriceMin} priceMax={priceMax} setPriceMax={setPriceMax} dwellingTypes={dwellingTypes} setDwellingTypes={setDwellingTypes} bedsMin={bedsMin} setBedsMin={setBedsMin} bathsMin={bathsMin} setBathsMin={setBathsMin} sqftMin={sqftMin} setSqftMin={setSqftMin} sqftMax={sqftMax} setSqftMax={setSqftMax} lotMin={lotMin} setLotMin={setLotMin} lotMax={lotMax} setLotMax={setLotMax} pool={pool} setPool={setPool} levels={levels} setLevels={setLevels} zips={zips} setZips={setZips} toggleValue={toggleValue} />}
                </div>
              );
            })}
          </div>
          <div className={styles.criteriaFooter}><button type="button" onClick={reset}>Reset filters</button><button type="button" className={styles.applyButton} onClick={() => setView("list")}>{loading ? "Updating…" : `View ${result.total.toLocaleString()}`}</button></div>
        </aside>

        <section ref={mainStage} tabIndex={-1} className={styles.mainStage}>
          <div hidden={view !== "map"} className={styles.mapViewContainer}><GoogleMapStage pins={result.pins} selected={selected} total={result.total} hasArea={hasArea} loading={resultsPending} onSelect={setSelectedId} onShapeChange={handleShapeChange} />
{matchSummary !== null && (<div className={styles.matchesOverlay}><div role="dialog" className={styles.matchesDialog} aria-labelledby="matches-title" onKeyDown={(event) => { if (event.key === "Escape") { setMatchSummary(null); mainStage.current?.focus({ preventScroll: true }); } }}>
        <div className={styles.matchesBody}><strong>{matchSummary?.toLocaleString()}</strong><h2 id="matches-title">Listing matches found</h2></div>
        <div className={styles.matchesActions}>
          <button ref={summaryClose} type="button" onClick={() => { setMatchSummary(null); mainStage.current?.focus({ preventScroll: true }); }}>Close</button>
          <button type="button" onClick={() => { setView("list"); setMatchSummary(null); mainStage.current?.focus({ preventScroll: true }); }}>View List</button>
          <button type="button" className={styles.matchesPrimary} onClick={() => { setView("map"); setMatchSummary(null); mainStage.current?.focus({ preventScroll: true }); }}>View Map</button>
        </div>
      </div></div>)}
</div>
          {view === "list" && <ResultsList listings={rows} total={result.total} loading={loading} loadingMore={loadingMore} onLoadMore={loadMore} onSelect={(id) => { setSelectedId(id); setView("detail"); }} />}
          {view === "detail" && <ListingDetail listing={selected} comps={loadedDetail?.comps ?? null} asIs={loadedDetail ? loadedDetail.asIs : undefined} threshold={arvThreshold} />}
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
  return <div className={styles.rangeInputs}><label>{prefix}<input aria-label="Minimum" value={min} onChange={(event) => onInput(event.target.value, setMin)} placeholder="Minimum" inputMode="numeric" /></label><span>to</span><label>{prefix}<input aria-label="Maximum" value={max} onChange={(event) => onInput(event.target.value, setMax)} placeholder="Maximum" inputMode="numeric" /></label></div>;
}

function MinSelect({ value, update, options, exact = false }: { value: string; update: (value: string) => void; options: string[]; exact?: boolean }) {
  return <select className={styles.singleInput} value={value} onChange={(event) => update(event.target.value)}>{!exact && <option value="">No minimum</option>}{options.map((option) => <option key={option} value={option}>{exact ? option : `${option}+`}</option>)}</select>;
}

function ResultsList({ listings, total, loading, loadingMore, onLoadMore, onSelect }: { listings: DealCandidate[]; total: number; loading: boolean; loadingMore: boolean; onLoadMore: () => void; onSelect: (id: string) => void }) {
  return <div className={styles.resultsTable}><table><thead><tr><th>Status</th><th>Closed date</th><th>MLS #</th><th>Address</th><th>Price</th><th>ARV</th><th>% ARV</th><th title="Price as a % of what clean, maintained homes sell for">% As-is</th><th>Type</th><th>Bed/Bath</th><th>Sq Ft</th><th>Lot</th><th>Pool</th><th>Levels</th><th>ZIP</th></tr></thead><tbody>{listings.map((listing) => <tr key={listing.id} onClick={() => onSelect(listing.id)}><td>{normalizeStatus(listing.status)}</td><td>{shortDate(listing.closedDate)}</td><td>{listing.mlsNumber}</td><td><strong>{listing.address}</strong><small>{listing.city}</small></td><td>{money(priceOf(listing))}</td><td title={arvBasis(listing)}>{arvWithRange(listing)}</td><td>{pct(listing.listToArvPct)}</td><td title={listing.asIsValue ? `Clean as-is ${money(listing.asIsValue)}` : undefined}>{pct(listing.pctOfAsIs)}</td><td>{listing.dwellingType}</td><td>{listing.beds ?? "—"} / {listing.baths ?? "—"}</td><td>{listing.sqft?.toLocaleString() ?? "—"}</td><td>{listing.lotSqft?.toLocaleString() ?? "—"}</td><td>{listing.pool == null ? "—" : listing.pool ? "Yes" : "No"}</td><td>{listing.interiorLevels ?? "—"}</td><td>{listing.zip}</td></tr>)}</tbody></table>
    {listings.length < total && <div className={styles.criteriaFooter}><button type="button" className={styles.applyButton} onClick={onLoadMore} disabled={loadingMore || loading}>{loadingMore ? "Loading…" : `Load more — ${listings.length.toLocaleString()} of ${total.toLocaleString()}`}</button></div>}
    {listings.length === 0 && <PlaceholderView title="No results" detail="Change or reset the selected criteria." />}</div>;
}

function ListingDetail({ listing, comps, asIs, threshold }: { listing: DealCandidate | null; comps: CompSale[] | null; asIs: ListingDetailResponse["asIs"] | undefined; threshold: number }) {
  if (!listing) return <PlaceholderView title="No listing selected" detail="Choose a listing from the List or Map view." />;
  const closed = normalizeStatus(listing.status) === "Closed";
  return <div className={styles.detailView}><span>{normalizeStatus(listing.status)} · MLS #{listing.mlsNumber}</span><h2><a className={styles.linkButton} href={mlsLinks(listing).rpr.href} target="_blank" rel="noopener noreferrer" title={`Underwrite MLS # ${listing.mlsNumber} in RPR`}>{listing.address}</a></h2><p>{listing.city}, {listing.state} {listing.zip}</p>
    <MlsSiteLinks listing={listing} className={styles.detailLinks} />
    <div className={styles.detailGrid}>{[[closed ? "Sold price" : "List price", money(priceOf(listing))], ["Projected ARV", arvWithRange(listing)], [closed ? "Sold / ARV" : "List / ARV", pct(listing.listToArvPct)], [`${threshold}% of ARV`, money(listing.rule70Price)], ["ARV basis", arvBasis(listing)], ["Deal score", closed ? "—" : `${listing.dealScore}/99 · Higher is better · ${listing.priority}`]].map(([label, value]) => <div key={String(label)}><small>{label}</small><strong>{value}</strong></div>)}</div>
    <div className={styles.detailGrid}>{[["List price", money(listing.listPrice)], ["Closed date", shortDate(listing.closedDate)], ["Dwelling type", listing.dwellingType], ["Bedrooms", listing.beds ?? "—"], ["Bathrooms", listing.baths ?? "—"], ["Square feet", listing.sqft?.toLocaleString() ?? "—"], ["Year built", listing.yearBuilt ?? "—"], ["Lot size", listing.lotSqft?.toLocaleString() ?? "—"], ["Private pool", listing.pool == null ? "Unknown" : listing.pool ? "Yes" : "No"], ["Interior levels", listing.interiorLevels ?? "—"], ["Zip code", listing.zip], ["Owner", listing.ownerName ?? "Not enriched"]].map(([label,value]) => <div key={String(label)}><small>{label}</small><strong>{value}</strong></div>)}</div>
    <CompsSection key={listing.id} listing={listing} comps={comps} asIs={asIs} />
  </div>;
}

// Step 2 of a deal: one Comps button answers ARV, clean as-is value, and what
// flippers and landlords pay here. Nothing investor-side loads until it's clicked.
function CompsSection({ listing, comps, asIs }: { listing: DealCandidate; comps: CompSale[] | null; asIs: ListingDetailResponse["asIs"] | undefined }) {
  const [open, setOpen] = useState(false);
  // InvestorBase is the primary investor source; ARMLS-derived buys are the fallback.
  const [ibUnavailable, setIbUnavailable] = useState(false);
  const markUnavailable = useCallback(() => setIbUnavailable(true), []);
  if (!open) return <button type="button" className={`${styles.applyButton} ${styles.compsButton}`} onClick={() => setOpen(true)}>Comps</button>;
  const buyBox = listing.conservativeArv ? `70–75%: ${money(listing.conservativeArv * 0.7, true)}–${money(listing.conservativeArv * 0.75, true)}` : null;
  const remodel = listing.arv && asIs ? Math.round((listing.arv / asIs.value - 1) * 100) : null;
  return <div className={styles.compsPanel}>
    <div className={`${styles.detailGrid} ${styles.compsSummary}`}>
      <div><small>ARV</small><strong>{arvWithRange(listing)}</strong><small>{[arvBasis(listing), buyBox].filter(Boolean).join(" · ")}</small></div>
      <div><small>Clean as-is</small><strong>{asIs === undefined ? "…" : asIs ? `${money(asIs.value)} ±${asIs.rangePct}%` : "—"}</strong><small>{asIs ? [`${asIs.compCount} clean sales ≤${asIs.radiusMiles} mi`, remodel != null ? `remodel adds ${remodel >= 0 ? "+" : ""}${remodel}%` : null].filter(Boolean).join(" · ") : asIs === null ? "Too few clean sales" : ""}</small></div>
    </div>
    <BuyerPay listingId={listing.id} onUnavailable={markUnavailable} />
    <details className={styles.soldComps} open={ibUnavailable || undefined}>
      <summary>ARMLS investor buys</summary>
      <InvestorComps listingId={listing.id} />
    </details>
    <details className={styles.soldComps}>
      <summary>Sold comps{comps ? ` (${comps.length})` : ""}</summary>
        {comps == null ? <p className={styles.previewNote}>Loading sold comps…</p> : comps.length === 0 ? <p className={styles.previewNote}>No nearby sold comps — ARV is {listing.arvSource === "Insufficient data" ? "unavailable" : `from ${listing.arvSource}`}; verify before offering.</p> :
          <div className={styles.resultsTable}><table><thead><tr><th>Sold comp</th><th>Sold</th><th>Price</th><th>Sq Ft</th><th>$/sqft</th><th>Beds</th><th>Built</th><th>Distance</th></tr></thead><tbody>{comps.map((c) => <tr key={c.id}><td><strong>{c.address}</strong><small>{c.city}</small></td><td>{shortDate(c.closedDate)}</td><td>{money(c.price)}</td><td>{c.sqft.toLocaleString()}</td><td>{money(c.pricePerSqft)}</td><td>{c.beds ?? "—"}</td><td>{c.yearBuilt ?? "—"}</td><td>{c.distanceMiles == null ? "—" : `${c.distanceMiles} mi`}</td></tr>)}</tbody></table></div>}
    </details>
  </div>;
}

// CurbView opens the listing directly; Flexmls has no public listing URL, so it
// opens MLS search with the MLS # copied for pasting.
function MlsSiteLinks({ listing, className }: { listing: ListingRecord; className?: string }) {
  const links = mlsLinks(listing);
  const copy = (text: string) => { navigator.clipboard?.writeText(text).catch(() => {}); };
  const anchors = <>
    <a href={links.flexmls.href} target="_blank" rel="noopener noreferrer" title={`Open in Flexmls (copies MLS # ${links.flexmls.copy})`} onClick={() => copy(links.flexmls.copy)}>Flexmls ↗</a>
    <a href={links.curbview.href} target="_blank" rel="noopener noreferrer" title={`Open MLS # ${links.curbview.copy} in CurbView`}>CurbView ↗</a>
  </>;
  return className ? <div className={className}>{anchors}</div> : anchors;
}

function CopyAddress({ listing }: { listing: ListingRecord }) {
  const [message, setMessage] = useState("");
  return <span className={styles.copyAddressWrap}>
    <button type="button" className={styles.copyAddress} aria-label={`Copy address: ${listing.address}`} title={message || "Copy full address"} onClick={async (event) => {
      event.stopPropagation();
      try {
        await navigator.clipboard.writeText(`${listing.address}, ${listing.city}, ${listing.state || "AZ"} ${listing.zip}`);
        setMessage("Address copied");
      } catch { setMessage("Could not copy. Select the address to copy it."); }
    }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></svg></button>
    <span role="status" className={styles.copyStatus}>{message}</span>
  </span>;
}

function CityChip({ city, selected, onChange }: { city: string; selected: string[]; onChange: (value: string) => void }) {
  const on = selected.includes(city.toLowerCase());
  return <button type="button" aria-pressed={on} onClick={() => {
    const next = on ? selected.filter((value) => value !== city.toLowerCase()) : [...selected, city.toLowerCase()];
    onChange(next.map((value) => value.replace(/\b\w/g, (letter) => letter.toUpperCase())).join(", "));
  }}>{city}</button>;
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
    if (mode === "motivated") return ["Expired", "Canceled"].includes(normalizeStatus(item.status)) || (item.dom ?? 0) >= 60 || item.reasons.some((reason) => reason.includes("Motivated") || reason.includes("condition"));
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
        <h2>Deal Intelligence</h2>
      </header>

      <div className={styles.dealMetrics}>
        <div><span>{threshold}% rule matches</span><strong>{rule70Count}</strong></div>
        <div><span>Acquisition priority</span><strong>{highPriorityCount}</strong></div>
        <div><span>Average list / ARV</span><strong>{averageRatio == null ? "—" : `${Math.round(averageRatio)}%`}</strong></div>
        <div><span>Potential {threshold}% spread</span><strong>{money(totalSpread, true)}</strong></div>
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
          <thead><tr><th>Priority</th><th>Property</th><th>Deal score <span className={styles.scoreHint}>Higher is better · 0–99</span></th><th>% of ARV · {threshold}% threshold<span className={styles.scoreHint}>Lower means a bigger discount</span></th><th>Why it surfaced</th><th>Action</th></tr></thead>
          <tbody>{visible.slice(0, 25).map((candidate) => {
            return <tr key={candidate.id}>
              <td><span className={`${styles.priorityBadge} ${styles[`priority${candidate.priority.replace(/\s/g, "")}`]}`}>{candidate.priority}</span></td>
              <td><div className={styles.propertyAddress}><a className={styles.linkButton} href={mlsLinks(candidate).rpr.href} target="_blank" rel="noopener noreferrer" title={`Underwrite MLS # ${candidate.mlsNumber} in RPR`}><strong>{candidate.address}</strong></a><CopyAddress listing={candidate} /></div><small>{candidate.city}, {candidate.zip} · MLS {candidate.mlsNumber}</small></td>
              <td><div className={styles.scoreCell}><strong>{candidate.dealScore}</strong><span><i style={{ width: `${candidate.dealScore}%` }} /></span></div></td>
              <td><strong className={(candidate.listToArvPct ?? 100) <= threshold ? styles.ruleMatch : ""}>{pct(candidate.listToArvPct)}</strong><small>ARV {arvWithRange(candidate, true)} · {arvBasis(candidate)}</small></td>
              <td><div className={styles.reasonList}>{candidate.reasons.length ? candidate.reasons.map((reason) => <span key={reason}>{reason}</span>) : <span>Needs more data</span>}</div></td>
              <td><div className={styles.dealActions}><MlsSiteLinks listing={candidate} /><a className={styles.offerButton} href={`/admin/offers?mls=${encodeURIComponent(candidate.mlsNumber)}`}>Submit an Offer</a></div></td>
            </tr>;
          })}</tbody>
        </table>
        {visible.length === 0 && <div className={styles.noDeals}><strong>No properties match this deal lens</strong><span>Expand the map filters or switch back to Best opportunities.</span></div>}
      </div>
    </section>
  );
}
