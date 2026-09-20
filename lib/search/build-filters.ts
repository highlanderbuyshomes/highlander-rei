import type { SearchFilters } from "./types";

export type CriteriaKey = "status" | "price" | "dwelling" | "beds" | "baths" | "sqft" | "lot" | "pool" | "levels" | "zip";

export type FilterState = {
  activeCriteria: Set<CriteriaKey>;
  statuses: string[];
  closedWithinMonths: string;
  priceMin: string; priceMax: string;
  dwellingTypes: string[];
  bedsMin: string; bathsMin: string;
  sqftMin: string; sqftMax: string;
  lotMin: string; lotMax: string;
  pool: string; levels: string; zips: string; keyword: string;
};

/**
 * Numeric text box -> filter value. An empty box contributes nothing, which
 * mirrors the old `min && (value ?? 0) < Number(min)` guards; an unparseable
 * box (the inputs allow bare "." ) compared as NaN before, i.e. it never
 * excluded anything, so dropping the bound keeps that behaviour.
 */
function num(value: string): number | undefined {
  if (value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * The server-side inverse of what the old client-side `filtered` memo did:
 * a criterion contributes only while its checkbox is active, "Any" and empty
 * strings contribute nothing, and the keyword box applies regardless of the
 * checkboxes (exactly as before).
 */
export function buildFilters(state: FilterState): SearchFilters {
  const on = (key: CriteriaKey) => state.activeCriteria.has(key);
  const zipValues = state.zips.split(/[,\s]+/).map((zip) => zip.trim()).filter(Boolean);
  const keyword = state.keyword.trim();

  return {
    keyword: keyword || undefined,
    statuses: on("status") && state.statuses.length ? state.statuses : undefined,
    closedWithinMonths: on("status") && state.closedWithinMonths !== "Any" ? num(state.closedWithinMonths) : undefined,
    priceMin: on("price") ? num(state.priceMin) : undefined,
    priceMax: on("price") ? num(state.priceMax) : undefined,
    dwellingTypes: on("dwelling") && state.dwellingTypes.length ? state.dwellingTypes : undefined,
    bedsMin: on("beds") ? num(state.bedsMin) : undefined,
    bathsMin: on("baths") ? num(state.bathsMin) : undefined,
    sqftMin: on("sqft") ? num(state.sqftMin) : undefined,
    sqftMax: on("sqft") ? num(state.sqftMax) : undefined,
    lotMin: on("lot") ? num(state.lotMin) : undefined,
    lotMax: on("lot") ? num(state.lotMax) : undefined,
    pool: on("pool") && state.pool !== "Any" ? state.pool === "Yes" : undefined,
    levels: on("levels") && state.levels !== "Any" ? (state.levels === "3+" ? "3+" : num(state.levels)) : undefined,
    zips: on("zip") && zipValues.length ? zipValues : undefined,
  };
}
