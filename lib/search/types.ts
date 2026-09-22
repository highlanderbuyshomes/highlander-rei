import type { DrawnShape } from "@/lib/filter-listings";
export type { DrawnShape };

export type ListingRecord = {
  id: string;
  mlsNumber: string;
  status: string;
  closedDate?: string | null;
  listPrice: number | null;
  /** Sold price for Closed listings (listPrice stays the last asking price). */
  closePrice?: number | null;
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
  /** Precomputed server-side from remarks so the long text needn't ship to the browser. */
  distressSignal?: boolean;
  source: string;
};

export type ArvSource = "Sold comps" | "ZIP sold $/sqft" | "Property estimate" | "Pocket $/sqft model" | "Insufficient data";

export type DealCandidate = ListingRecord & {
  arv: number | null;
  arvSource: ArvSource;
  /** High/Medium only come from nearby sold comps; only those can be "Target now". */
  arvConfidence: "High" | "Medium" | "Low" | null;
  arvCompCount: number | null;
  arvRadiusMiles: number | null;
  arvSameSubdivision: boolean;
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

export type SearchFilters = {
  keyword?: string;
  statuses?: string[];
  closedWithinMonths?: number;
  priceMin?: number; priceMax?: number;
  dwellingTypes?: string[];
  bedsMin?: number; bathsMin?: number;
  sqftMin?: number; sqftMax?: number;
  lotMin?: number; lotMax?: number;
  pool?: boolean;
  levels?: number | "3+";
  zips?: string[];
};

export type SearchRequest = { filters: SearchFilters; arvThreshold: number; shape?: DrawnShape | null; page?: number };

export type Pin = { id: string; lat: number; lng: number; price: number | null; status: string; target: boolean };

export type SearchResponse = { total: number; pins: Pin[]; rows: DealCandidate[]; targetCount: number; compCount: number };

/** A closed sale used in a subject's ARV, for the detail view. */
export type CompSale = { id: string; address: string; city: string; price: number; sqft: number; pricePerSqft: number; beds: number | null; yearBuilt: number | null; closedDate: string; distanceMiles: number | null };

export type ListingDetailResponse = DealCandidate & { comps: CompSale[] };

export const PAGE_SIZE = 100;

/** Most map pins returned per search; the client draws only the top 250 anyway. `total`/`targetCount` still reflect every match. */
export const MAX_PINS = 500;
