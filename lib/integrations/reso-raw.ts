import type { ResoListing } from "./reso";

// Keys Deal Search reads out of MlsListing/Property rawJson (see lib/search/load.ts).
export const RAW_KEYS = [
  "PropertySubType", "PropertyType", "DwellingType", "LivingArea", "LivingAreaSqFt", "ApproxSQFT",
  "LotSizeSquareFeet", "LotSqFt", "LotSize", "PoolPrivateYN", "PrivatePoolYN", "PrivatePool", "HasPool", "pool",
  "Stories", "StoriesTotal", "NumberOfStories", "InteriorLevels", "Levels",
  "OriginalListPrice", "OriginalPrice", "PreviousListPrice",
];

// ARMLS listings carry ~1,000 keys (~8.6 KB); storing them whole, twice, is
// what made a valley-wide sync outgrow the database. Only what the app reads
// (search mapping, comps, distress remarks, listing identity) is persisted.
const REMARK_KEYS = ["PublicRemarks", "Remarks", "MarketingRemarks", "description"];
const STORED_KEYS = new Set([
  ...RAW_KEYS,
  "ClosePrice",
  ...REMARK_KEYS,
  "ListingKey", "ListingId", "StandardStatus", "MlsStatus", "ModificationTimestamp", "UnparsedAddress",
  "ListAgentKey", "ListAgentFullName", "ListOfficeName",
]);
const PROPERTY_KEYS = new Set(RAW_KEYS);

function pick(listing: ResoListing, keys: Set<string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(listing)) {
    if (keys.has(k) && v != null && v !== "") out[k] = v;
  }
  return out;
}

/** MlsListing.rawJson. Remarks feed the distress flag, which only matters for
 *  listings still on the market, so closed sales (most of the table) drop them. */
export function trimResoRaw(listing: ResoListing): Record<string, unknown> {
  const out = pick(listing, STORED_KEYS);
  if (listing.StandardStatus === "Closed") for (const k of REMARK_KEYS) delete out[k];
  return out;
}

/** Property.rawJson is only a per-key fallback for the search mapping
 *  (dwelling, pool, levels, sqft...) behind the listing's own blob. */
export function trimPropertyRaw(listing: ResoListing): Record<string, unknown> {
  return pick(listing, PROPERTY_KEYS);
}
