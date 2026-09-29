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
export const LAND_LEASE_KEYS = ["LandLeaseYN", "LandLeaseAmount", "Ownership"];
const STORED_KEYS = new Set([
  ...RAW_KEYS,
  "ClosePrice",
  ...REMARK_KEYS,
  "ListingKey", "ListingId", "StandardStatus", "MlsStatus", "ModificationTimestamp", "UnparsedAddress",
  "ListAgentKey", "ListAgentFullName", "ListOfficeName",
  // How the buyer paid: a cash purchase that resells within a year is a flip.
  "BuyerFinancing",
  // Leased land (park manufactured homes, leasehold condos) is excluded from Deal Search.
  ...LAND_LEASE_KEYS,
]);
const PROPERTY_KEYS = new Set([...RAW_KEYS, ...LAND_LEASE_KEYS]);

function pick(listing: ResoListing, keys: Set<string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(listing)) {
    if (keys.has(k) && v != null && v !== "") out[k] = v;
  }
  return out;
}

/** MlsListing.rawJson. Remarks are kept on closed sales too: they're how the
 *  ARV engine tells a remodeled comp from an as-is one. */
export function trimResoRaw(listing: ResoListing): Record<string, unknown> {
  return pick(listing, STORED_KEYS);
}

/** Property.rawJson is only a per-key fallback for the search mapping
 *  (dwelling, pool, levels, sqft...) behind the listing's own blob. */
export function trimPropertyRaw(listing: ResoListing): Record<string, unknown> {
  return pick(listing, PROPERTY_KEYS);
}
