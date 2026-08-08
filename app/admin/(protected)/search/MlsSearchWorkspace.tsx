"use client";

import { useMemo, useState } from "react";
import { createArea, deleteArea, targetProperty, toggleArea } from "./actions";
import GoogleMapStage from "./GoogleMapStage";
import styles from "./search.module.css";

export type ListingRecord = {
  id: string;
  mlsNumber: string;
  status: string;
  listPrice: number | null;
  dom: number | null;
  listDate: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  subdivision: string | null;
  dwellingType: string;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  lotSqft: number | null;
  pool: boolean | null;
  interiorLevels: number | null;
  yearBuilt: number | null;
  latitude: number | null;
  longitude: number | null;
  ownerName: string | null;
  estimatedEquityPct: number | null;
  ownerOccupied?: boolean | null;
  estimatedArv?: number | null;
  originalListPrice?: number | null;
  remarks?: string | null;
  source: string;
};

export type SavedSearchRecord = {
  id: string;
  name: string;
  buyerContact: string | null;
  description: string | null;
  active: boolean;
  buyBoxCount: number;
};

type CriteriaKey = "status" | "price" | "dwelling" | "beds" | "baths" | "sqft" | "lot" | "pool" | "levels" | "zip";
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

const previewListings: ListingRecord[] = [
  { id: "p1", mlsNumber: "6884217", status: "Active", listPrice: 649000, dom: 12, listDate: "2026-07-26", address: "4812 E Clarendon Ave", city: "Phoenix", state: "AZ", zip: "85018", subdivision: "Hidden Village", dwellingType: "Single Family", beds: 3, baths: 2, sqft: 1842, lotSqft: 8724, pool: true, interiorLevels: 1, yearBuilt: 1956, latitude: 33.491, longitude: -111.982, ownerName: "Daniel & Maria Ortega", estimatedEquityPct: 43, source: "MLS Preview" },
  { id: "p2", mlsNumber: "6883904", status: "Active", listPrice: 425000, dom: 34, listDate: "2026-07-04", address: "1229 W Orchid Ln", city: "Phoenix", state: "AZ", zip: "85021", subdivision: "Westwood Heights", dwellingType: "Single Family", beds: 4, baths: 2, sqft: 2016, lotSqft: 7548, pool: false, interiorLevels: 1, yearBuilt: 1972, latitude: 33.562, longitude: -112.089, ownerName: "Carlton P. Hayes", estimatedEquityPct: 54, ownerOccupied: false, estimatedArv: 625000, originalListPrice: 469000, remarks: "Investor opportunity sold as-is. Needs updating throughout.", source: "MLS Preview" },
  { id: "p3", mlsNumber: "6879441", status: "Pending", listPrice: 515000, dom: 19, listDate: "2026-07-15", address: "7319 E Montebello Ave", city: "Scottsdale", state: "AZ", zip: "85250", subdivision: "Park Scottsdale", dwellingType: "Townhouse", beds: 3, baths: 2, sqft: 1654, lotSqft: 6982, pool: true, interiorLevels: 2, yearBuilt: 1962, latitude: 33.519, longitude: -111.923, ownerName: "Pinnacle Home Trust", estimatedEquityPct: 34, source: "MLS Preview" },
  { id: "p4", mlsNumber: "6876108", status: "Expired", listPrice: 789000, dom: 126, listDate: "2026-03-18", address: "2636 E Turney Ave", city: "Phoenix", state: "AZ", zip: "85016", subdivision: "Biltmore Greens", dwellingType: "Single Family", beds: 4, baths: 3, sqft: 2460, lotSqft: 9130, pool: true, interiorLevels: 2, yearBuilt: 1979, latitude: 33.501, longitude: -112.026, ownerName: "Patricia W. Lang", estimatedEquityPct: 61, source: "MLS Preview" },
  { id: "p5", mlsNumber: "6873122", status: "Canceled", listPrice: 379900, dom: 48, listDate: "2026-05-29", address: "1908 N 39th Dr", city: "Phoenix", state: "AZ", zip: "85009", subdivision: "Del Monte Village", dwellingType: "Single Family", beds: 3, baths: 2, sqft: 1511, lotSqft: 8160, pool: false, interiorLevels: 1, yearBuilt: 1965, latitude: 33.469, longitude: -112.145, ownerName: "Warren Family Holdings LLC", estimatedEquityPct: 74, ownerOccupied: false, estimatedArv: 590000, originalListPrice: 429900, remarks: "Fixer. Cash only. Property needs substantial repairs and is being sold as-is.", source: "MLS Preview" },
  { id: "p6", mlsNumber: "6869983", status: "Coming Soon", listPrice: 565000, dom: 0, listDate: "2026-08-09", address: "5442 S College Ave", city: "Tempe", state: "AZ", zip: "85283", subdivision: "Tempe Gardens", dwellingType: "Single Family", beds: 4, baths: 2.5, sqft: 2288, lotSqft: 8400, pool: true, interiorLevels: 2, yearBuilt: 1974, latitude: 33.374, longitude: -111.934, ownerName: "Elliot Mason", estimatedEquityPct: 25, source: "MLS Preview" },
  { id: "p7", mlsNumber: "6868202", status: "Active", listPrice: 329000, dom: 8, listDate: "2026-07-30", address: "10318 W Coggins Dr", city: "Sun City", state: "AZ", zip: "85351", subdivision: "Sun City Unit 6", dwellingType: "Patio Home", beds: 2, baths: 2, sqft: 1380, lotSqft: 6200, pool: false, interiorLevels: 1, yearBuilt: 1967, latitude: 33.604, longitude: -112.282, ownerName: "Harold Grant", estimatedEquityPct: 68, ownerOccupied: true, estimatedArv: 485000, remarks: "Original condition. Estate sale with limited repairs completed.", source: "MLS Preview" },
  { id: "p8", mlsNumber: "6867519", status: "Active", listPrice: 474500, dom: 21, listDate: "2026-07-17", address: "821 S Pomeroy", city: "Mesa", state: "AZ", zip: "85210", subdivision: "Fiesta Park Village", dwellingType: "Townhouse", beds: 3, baths: 2.5, sqft: 1795, lotSqft: 4100, pool: true, interiorLevels: 2, yearBuilt: 1986, latitude: 33.398, longitude: -111.855, ownerName: "Mesa Living LLC", estimatedEquityPct: 47, source: "MLS Preview" },
];

const statusOptions = ["Active", "Coming Soon", "Pending", "Closed", "Expired", "Canceled"];
const dwellingOptions = ["Single Family", "Townhouse", "Condo", "Patio Home", "Manufactured", "Multi-Family"];

function money(value: number | null, compact = false) {
  if (value == null) return "—";
  if (compact && value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (compact && value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function normalizeStatus(value: string) {
  const status = value.toLowerCase();
  if (status.includes("coming")) return "Coming Soon";
  if (status.includes("active")) return "Active";
  if (status.includes("pending") || status.includes("contract")) return "Pending";
  if (status.includes("expire")) return "Expired";
  if (status.includes("cancel") || status.includes("withdraw")) return "Canceled";
  if (status.includes("closed") || status.includes("sold")) return "Closed";
  return value || "Off Market";
}

type DealCandidate = ListingRecord & {
  arv: number | null;
  arvSource: "Property estimate" | "Pocket $/sqft model" | "Insufficient data";
  listToArvPct: number | null;
  rule70Price: number | null;
  rule70Spread: number | null;
  pricePerSqft: number | null;
  pocketPricePerSqft: number | null;
  ppsfDiscountPct: number | null;
  dealScore: number;
  priority: "Target now" | "High" | "Watch" | "Low";
  reasons: string[];
};

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function scoreDeals(listings: ListingRecord[]): DealCandidate[] {
  const ppsfRows = listings.filter((item) => item.listPrice && item.sqft).map((item) => ({
    zip: item.zip,
    type: item.dwellingType,
    value: item.listPrice! / item.sqft!,
  }));

  return listings.map((listing) => {
    const pricePerSqft = listing.listPrice && listing.sqft ? listing.listPrice / listing.sqft : null;
    const pocketRows = ppsfRows.filter((row) => row.zip === listing.zip && row.type === listing.dwellingType);
    const comparableRows = pocketRows.length >= 2 ? pocketRows : ppsfRows.filter((row) => row.type === listing.dwellingType);
    const pocketPricePerSqft = median(comparableRows.map((row) => row.value)) ?? median(ppsfRows.map((row) => row.value));
    const modeledArv = listing.sqft && pocketPricePerSqft ? listing.sqft * pocketPricePerSqft : null;
    const arv = listing.estimatedArv ?? modeledArv;
    const arvSource: DealCandidate["arvSource"] = listing.estimatedArv ? "Property estimate" : modeledArv ? "Pocket $/sqft model" : "Insufficient data";
    const listToArvPct = listing.listPrice && arv ? (listing.listPrice / arv) * 100 : null;
    const rule70Price = arv ? arv * 0.7 : null;
    const rule70Spread = rule70Price != null && listing.listPrice != null ? rule70Price - listing.listPrice : null;
    const ppsfDiscountPct = pricePerSqft && pocketPricePerSqft ? ((pocketPricePerSqft - pricePerSqft) / pocketPricePerSqft) * 100 : null;
    const remarks = listing.remarks?.toLowerCase() ?? "";
    const distressWords = ["fixer", "as-is", "as is", "cash only", "needs repair", "needs updating", "investor", "estate sale", "original condition", "handyman"];
    const conditionSignal = distressWords.some((word) => remarks.includes(word));
    const status = normalizeStatus(listing.status);
    const priceReductionPct = listing.originalListPrice && listing.listPrice && listing.originalListPrice > listing.listPrice ? ((listing.originalListPrice - listing.listPrice) / listing.originalListPrice) * 100 : 0;
    const reasons: string[] = [];
    let score = 0;

    if (listToArvPct != null) {
      if (listToArvPct <= 70) { score += 50 + Math.min(15, 70 - listToArvPct); reasons.push(`${Math.round(listToArvPct)}% of projected ARV`); }
      else if (listToArvPct <= 80) { score += 32; reasons.push(`${Math.round(listToArvPct)}% of projected ARV`); }
      else if (listToArvPct <= 90) score += 15;
    }
    if (ppsfDiscountPct != null && ppsfDiscountPct >= 15) { score += Math.min(16, Math.round(ppsfDiscountPct / 2)); reasons.push(`${Math.round(ppsfDiscountPct)}% below pocket $/sqft`); }
    if (["Expired", "Canceled"].includes(status)) { score += 14; reasons.push(`${status} listing`); }
    if ((listing.dom ?? 0) >= 60) { score += 8; reasons.push(`${listing.dom} days on market`); }
    if ((listing.estimatedEquityPct ?? 0) >= 40) { score += 7; reasons.push(`${Math.round(listing.estimatedEquityPct!)}% estimated equity`); }
    if (listing.ownerOccupied === false) { score += 4; reasons.push("Absentee owner"); }
    if (conditionSignal) { score += 12; reasons.push("Fixer / condition language"); }
    if (priceReductionPct >= 5) { score += 6; reasons.push(`${Math.round(priceReductionPct)}% price reduction`); }

    score = Math.min(99, score);
    const priority: DealCandidate["priority"] = listToArvPct != null && listToArvPct <= 70 ? "Target now" : score >= 65 ? "High" : score >= 38 ? "Watch" : "Low";
    return { ...listing, arv, arvSource, listToArvPct, rule70Price, rule70Spread, pricePerSqft, pocketPricePerSqft, ppsfDiscountPct, dealScore: score, priority, reasons: reasons.slice(0, 4) };
  }).sort((a, b) => b.dealScore - a.dealScore);
}

export default function MlsSearchWorkspace({ listings, savedSearches }: { listings: ListingRecord[]; savedSearches: SavedSearchRecord[] }) {
  const sourceListings = listings.length ? listings : previewListings;
  const isPreview = listings.length === 0;
  const [showSaved, setShowSaved] = useState(false);
  const [view, setView] = useState<WorkspaceView>("map");
  const [activeCriteria, setActiveCriteria] = useState<Set<CriteriaKey>>(new Set(["status"]));
  const [statuses, setStatuses] = useState<string[]>(["Active", "Coming Soon"]);
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
  const [pocketIds, setPocketIds] = useState<string[] | null>(null);

  const filtered = useMemo(() => {
    const zipValues = zips.split(/[,\s]+/).map((zip) => zip.trim()).filter(Boolean);
    const query = keyword.trim().toLowerCase();
    return sourceListings.filter((item) => {
      if (query && ![item.mlsNumber, item.address, item.city, item.zip].some((value) => value.toLowerCase().includes(query))) return false;
      if (activeCriteria.has("status") && statuses.length && !statuses.includes(normalizeStatus(item.status))) return false;
      if (activeCriteria.has("price") && priceMin && (item.listPrice ?? 0) < Number(priceMin)) return false;
      if (activeCriteria.has("price") && priceMax && (item.listPrice ?? Number.POSITIVE_INFINITY) > Number(priceMax)) return false;
      if (activeCriteria.has("dwelling") && dwellingTypes.length && !dwellingTypes.includes(item.dwellingType)) return false;
      if (activeCriteria.has("beds") && bedsMin && (item.beds ?? 0) < Number(bedsMin)) return false;
      if (activeCriteria.has("baths") && bathsMin && (item.baths ?? 0) < Number(bathsMin)) return false;
      if (activeCriteria.has("sqft") && sqftMin && (item.sqft ?? 0) < Number(sqftMin)) return false;
      if (activeCriteria.has("sqft") && sqftMax && (item.sqft ?? Number.POSITIVE_INFINITY) > Number(sqftMax)) return false;
      if (activeCriteria.has("lot") && lotMin && (item.lotSqft ?? 0) < Number(lotMin)) return false;
      if (activeCriteria.has("lot") && lotMax && (item.lotSqft ?? Number.POSITIVE_INFINITY) > Number(lotMax)) return false;
      if (activeCriteria.has("pool") && pool !== "Any" && item.pool !== (pool === "Yes")) return false;
      if (activeCriteria.has("levels") && levels !== "Any" && (levels === "3+" ? (item.interiorLevels ?? 0) < 3 : item.interiorLevels !== Number(levels))) return false;
      if (activeCriteria.has("zip") && zipValues.length && !zipValues.includes(item.zip)) return false;
      return true;
    });
  }, [sourceListings, activeCriteria, statuses, priceMin, priceMax, dwellingTypes, bedsMin, bathsMin, sqftMin, sqftMax, lotMin, lotMax, pool, levels, zips, keyword]);

  const qualified = useMemo(() => pocketIds ? filtered.filter((listing) => pocketIds.includes(listing.id)) : filtered, [filtered, pocketIds]);
  const dealCandidates = useMemo(() => scoreDeals(qualified), [qualified]);
  const targetIds = useMemo(() => new Set(dealCandidates.filter((item) => item.priority === "Target now").map((item) => item.id)), [dealCandidates]);

  const selected = selectedId ? sourceListings.find((item) => item.id === selectedId) ?? null : null;

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

  function updatePocket(next: string[] | null) {
    setPocketIds((current) => {
      if (current === next) return current;
      if (current && next && current.length === next.length && current.every((id) => next.includes(id))) return current;
      return next;
    });
  }

  function reset() {
    setActiveCriteria(new Set(["status"]));
    setStatuses(["Active", "Coming Soon"]); setPriceMin(""); setPriceMax(""); setDwellingTypes([]);
    setBedsMin(""); setBathsMin(""); setSqftMin(""); setSqftMax(""); setLotMin(""); setLotMax("");
    setPool("Any"); setLevels("Any"); setZips(""); setKeyword("");
  }

  if (showSaved) return <SavedSearches searches={savedSearches} onBack={() => setShowSaved(false)} />;

  return (
    <main className={styles.shell}>
      <header className={styles.pageHeader}>
        <div className={styles.searchTitle}><span className={styles.titleIndex}>01</span><div><h1>Residential Deal Search</h1><p>Filters and map pockets feed the 70% ARV deal engine.</p></div></div>
        <div className={styles.headerTools}>
          <nav className={styles.viewNav} aria-label="Search views">
            {(["map", "list", "detail"] as WorkspaceView[]).map((item) => <button key={item} type="button" className={view === item ? styles.viewActive : ""} onClick={() => setView(item)}>{item.charAt(0).toUpperCase() + item.slice(1)}</button>)}
          </nav>
          <button type="button" className={styles.saveSearchButton} onClick={() => setShowSaved(true)}>Saved searches</button>
        </div>
      </header>

      <div className={styles.searchWorkspace}>
        <aside className={styles.criteriaPanel}>
          <div className={styles.resultHeading}>Matching properties <strong>{qualified.length.toLocaleString()}</strong>{pocketIds && <span>in pocket</span>}</div>
          <label className={styles.mlsLookup}><span>⌕</span><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="MLS #, address, city or ZIP" /></label>
          <div className={styles.criteriaList}>
            {criteria.map(({ key, label }) => {
              const active = activeCriteria.has(key);
              return (
                <div key={key} className={`${styles.criterion} ${active ? styles.criterionActive : ""}`}>
                  <label className={styles.criterionLabel}><input type="checkbox" checked={active} onChange={() => toggleCriterion(key)} /><strong>{label}</strong>{key === "status" && active && <span>of {statuses.join(", ") || "Any"}</span>}</label>
                  {active && <CriterionInputs criterion={key} statuses={statuses} setStatuses={setStatuses} priceMin={priceMin} setPriceMin={setPriceMin} priceMax={priceMax} setPriceMax={setPriceMax} dwellingTypes={dwellingTypes} setDwellingTypes={setDwellingTypes} bedsMin={bedsMin} setBedsMin={setBedsMin} bathsMin={bathsMin} setBathsMin={setBathsMin} sqftMin={sqftMin} setSqftMin={setSqftMin} sqftMax={sqftMax} setSqftMax={setSqftMax} lotMin={lotMin} setLotMin={setLotMin} lotMax={lotMax} setLotMax={setLotMax} pool={pool} setPool={setPool} levels={levels} setLevels={setLevels} zips={zips} setZips={setZips} toggleValue={toggleValue} />}
                </div>
              );
            })}
          </div>
          <div className={styles.criteriaFooter}><button type="button" onClick={reset}>Reset filters</button><button type="button" className={styles.applyButton} onClick={() => setView("list")}>View {qualified.length.toLocaleString()}</button></div>
          {isPreview && <p className={styles.previewNote}>Preview inventory is shown until the licensed MLS feed is connected.</p>}
        </aside>

        <section className={styles.mainStage}>
          {view === "map" && <GoogleMapStage listings={filtered} selected={selected} targetIds={targetIds} onSelect={setSelectedId} onPocketChange={updatePocket} />}
          {view === "list" && <ResultsList listings={qualified} onSelect={(id) => { setSelectedId(id); setView("detail"); }} />}
          {view === "detail" && <ListingDetail listing={selected} />}
        </section>
      </div>
      <DealIntelligence candidates={dealCandidates} isPreview={isPreview} />
    </main>
  );
}

type CriterionProps = {
  criterion: CriteriaKey; statuses: string[]; setStatuses: (value: string[]) => void;
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
  if (props.criterion === "status") return <div className={styles.optionGrid}>{statusOptions.map((value) => <label key={value}><input type="checkbox" checked={props.statuses.includes(value)} onChange={() => props.toggleValue(value, props.statuses, props.setStatuses)} />{value}</label>)}</div>;
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

function ResultsList({ listings, onSelect }: { listings: ListingRecord[]; onSelect: (id: string) => void }) {
  return <div className={styles.resultsTable}><table><thead><tr><th>Status</th><th>MLS #</th><th>Address</th><th>Price</th><th>Type</th><th>Bed/Bath</th><th>Sq Ft</th><th>Lot</th><th>Pool</th><th>Levels</th><th>ZIP</th></tr></thead><tbody>{listings.map((listing) => <tr key={listing.id} onClick={() => onSelect(listing.id)}><td>{normalizeStatus(listing.status)}</td><td>{listing.mlsNumber}</td><td><strong>{listing.address}</strong><small>{listing.city}</small></td><td>{money(listing.listPrice)}</td><td>{listing.dwellingType}</td><td>{listing.beds ?? "—"} / {listing.baths ?? "—"}</td><td>{listing.sqft?.toLocaleString() ?? "—"}</td><td>{listing.lotSqft?.toLocaleString() ?? "—"}</td><td>{listing.pool == null ? "—" : listing.pool ? "Yes" : "No"}</td><td>{listing.interiorLevels ?? "—"}</td><td>{listing.zip}</td></tr>)}</tbody></table>{listings.length === 0 && <PlaceholderView title="No results" detail="Change or reset the selected criteria." />}</div>;
}

function ListingDetail({ listing }: { listing: ListingRecord | null }) {
  if (!listing) return <PlaceholderView title="No listing selected" detail="Choose a listing from the List or Map view." />;
  return <div className={styles.detailView}><span>{normalizeStatus(listing.status)} · MLS #{listing.mlsNumber}</span><h2>{listing.address}</h2><p>{listing.city}, {listing.state} {listing.zip}</p><div className={styles.detailGrid}>{[["List price", money(listing.listPrice)], ["Dwelling type", listing.dwellingType], ["Bedrooms", listing.beds ?? "—"], ["Bathrooms", listing.baths ?? "—"], ["Approx SQFT", listing.sqft?.toLocaleString() ?? "—"], ["Lot size", listing.lotSqft?.toLocaleString() ?? "—"], ["Private pool", listing.pool == null ? "Unknown" : listing.pool ? "Yes" : "No"], ["Interior levels", listing.interiorLevels ?? "—"], ["Zip code", listing.zip], ["Owner", listing.ownerName ?? "Not enriched"]].map(([label,value]) => <div key={String(label)}><small>{label}</small><strong>{value}</strong></div>)}</div></div>;
}

function PlaceholderView({ title, detail }: { title: string; detail: string }) { return <div className={styles.placeholder}><strong>{title}</strong><span>{detail}</span></div>; }

function DealIntelligence({ candidates, isPreview }: { candidates: DealCandidate[]; isPreview: boolean }) {
  const [mode, setMode] = useState<"ranked" | "rule70" | "ppsf" | "motivated">("ranked");
  const visible = candidates.filter((item) => {
    if (mode === "rule70") return item.listToArvPct != null && item.listToArvPct <= 70;
    if (mode === "ppsf") return (item.ppsfDiscountPct ?? 0) >= 10;
    if (mode === "motivated") return ["Expired", "Canceled"].includes(normalizeStatus(item.status)) || (item.dom ?? 0) >= 60 || item.reasons.some((reason) => reason.includes("condition"));
    return true;
  });
  const rule70Count = candidates.filter((item) => item.listToArvPct != null && item.listToArvPct <= 70).length;
  const highPriorityCount = candidates.filter((item) => ["Target now", "High"].includes(item.priority)).length;
  const ratios = candidates.map((item) => item.listToArvPct).filter((value): value is number => value != null);
  const averageRatio = ratios.length ? ratios.reduce((sum, value) => sum + value, 0) / ratios.length : null;
  const totalSpread = candidates.reduce((sum, item) => sum + Math.max(0, item.rule70Spread ?? 0), 0);

  return (
    <section className={styles.dealSection}>
      <header className={styles.dealHeader}>
        <div><span>Deal Intelligence</span><h2>Rank the properties most likely to become discounted deals</h2><p>The first pass applies the 70% rule, pocket-level price per square foot, listing motivation, condition language, and seller equity. Run the strongest candidates through AI comps before making an offer.</p></div>
        <div className={styles.dealLegend}><i /> Orange map pins meet the 70% rule</div>
      </header>

      <div className={styles.dealMetrics}>
        <div><span>70% rule matches</span><strong>{rule70Count}</strong><small>List price ≤ 70% projected ARV</small></div>
        <div><span>Acquisition priority</span><strong>{highPriorityCount}</strong><small>Target now or high priority</small></div>
        <div><span>Average list / ARV</span><strong>{averageRatio == null ? "—" : `${Math.round(averageRatio)}%`}</strong><small>Across current map results</small></div>
        <div><span>Potential 70% spread</span><strong>{money(totalSpread, true)}</strong><small>Before rehab and closing costs</small></div>
      </div>

      <div className={styles.dealToolbar}>
        <div>{([['ranked','Best opportunities'],['rule70','70% rule'],['ppsf','Low $/sqft'],['motivated','Motivated']] as const).map(([key, label]) => <button key={key} type="button" className={mode === key ? styles.dealModeActive : ""} onClick={() => setMode(key)}>{label}</button>)}</div>
        <span>{visible.length} opportunities ranked</span>
      </div>

      <div className={styles.dealTableWrap}>
        <table className={styles.dealTable}>
          <thead><tr><th>Priority</th><th>Property</th><th>Deal score</th><th>List price</th><th>Projected ARV</th><th>List / ARV</th><th>70% threshold</th><th>Price / sq ft</th><th>Why it surfaced</th><th>Action</th></tr></thead>
          <tbody>{visible.slice(0, 25).map((candidate) => {
            const fullAddress = `${candidate.address}, ${candidate.city}, ${candidate.state} ${candidate.zip}`;
            const canTarget = !isPreview && !candidate.id.startsWith("p");
            const targetAction = targetProperty.bind(null, candidate.id, candidate.dealScore, candidate.reasons.join("; "));
            return <tr key={candidate.id}>
              <td><span className={`${styles.priorityBadge} ${styles[`priority${candidate.priority.replace(/\s/g, "")}`]}`}>{candidate.priority}</span></td>
              <td><strong>{candidate.address}</strong><small>{candidate.city}, {candidate.zip} · MLS {candidate.mlsNumber}</small></td>
              <td><div className={styles.scoreCell}><strong>{candidate.dealScore}</strong><span><i style={{ width: `${candidate.dealScore}%` }} /></span></div></td>
              <td><strong>{money(candidate.listPrice)}</strong><small>{candidate.originalListPrice && candidate.listPrice && candidate.originalListPrice > candidate.listPrice ? `Was ${money(candidate.originalListPrice)}` : normalizeStatus(candidate.status)}</small></td>
              <td><strong>{money(candidate.arv)}</strong><small>{candidate.arvSource}</small></td>
              <td><strong className={(candidate.listToArvPct ?? 100) <= 70 ? styles.ruleMatch : ""}>{candidate.listToArvPct == null ? "—" : `${Math.round(candidate.listToArvPct)}%`}</strong><small>{candidate.listToArvPct != null && candidate.listToArvPct <= 70 ? "Meets rule" : "Review"}</small></td>
              <td><strong>{money(candidate.rule70Price)}</strong><small className={(candidate.rule70Spread ?? -1) >= 0 ? styles.positiveSpread : ""}>{candidate.rule70Spread == null ? "No ARV" : candidate.rule70Spread >= 0 ? `${money(candidate.rule70Spread)} room` : `${money(Math.abs(candidate.rule70Spread))} over`}</small></td>
              <td><strong>{candidate.pricePerSqft == null ? "—" : `$${Math.round(candidate.pricePerSqft)}`}</strong><small>{candidate.ppsfDiscountPct != null && candidate.ppsfDiscountPct > 0 ? `${Math.round(candidate.ppsfDiscountPct)}% below pocket` : `Pocket ${candidate.pocketPricePerSqft ? `$${Math.round(candidate.pocketPricePerSqft)}` : "—"}`}</small></td>
              <td><div className={styles.reasonList}>{candidate.reasons.length ? candidate.reasons.map((reason) => <span key={reason}>{reason}</span>) : <span>Needs more data</span>}</div></td>
              <td><div className={styles.dealActions}><a href={`/admin/underwriting?address=${encodeURIComponent(fullAddress)}`}>AI verify ARV</a>{canTarget ? <form action={targetAction}><button type="submit">Target property</button></form> : <button type="button" disabled>Preview only</button>}</div></td>
            </tr>;
          })}</tbody>
        </table>
        {visible.length === 0 && <div className={styles.noDeals}><strong>No properties match this deal lens</strong><span>Expand the map filters or switch back to Best opportunities.</span></div>}
      </div>
      <footer className={styles.dealDisclaimer}>Projected ARV and deal scores are screening estimates, not final underwriting. Rehab, closing, holding, and resale costs still need to be deducted before an offer is approved.</footer>
    </section>
  );
}

function SavedSearches({ searches, onBack }: { searches: SavedSearchRecord[]; onBack: () => void }) {
  return <main className={styles.savedPage}><button type="button" onClick={onBack}>← Residential search</button><header><h1>Saved Searches</h1><p>Buyer criteria and reusable property searches.</p></header><div className={styles.savedGrid}><form action={createArea} className={styles.newSearch}><h2>Create a search</h2><label>Name<input name="name" required placeholder="Smith Family — Arcadia" /></label><label>Buyer<input name="buyerContact" placeholder="Buyer contact" /></label><label>Criteria notes<textarea name="description" rows={4} /></label><button type="submit">Save search</button></form><section>{searches.map((search) => <article key={search.id}><div><strong>{search.name}</strong><span>{search.active ? "Active" : "Paused"} · {search.buyBoxCount} buy boxes</span></div><p>{search.description ?? "No notes"}</p><footer><form action={toggleArea.bind(null, search.id)}><button type="submit">{search.active ? "Pause" : "Activate"}</button></form><form action={deleteArea.bind(null, search.id)}><button type="submit">Delete</button></form></footer></article>)}</section></div></main>;
}
