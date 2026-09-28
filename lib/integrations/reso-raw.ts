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
const STORED_KEYS = new Set([
  ...RAW_KEYS,
  "ClosePrice",
  "PublicRemarks", "Remarks", "MarketingRemarks", "description",
  "ListingKey", "ListingId", "StandardStatus", "MlsStatus", "ModificationTimestamp", "UnparsedAddress",
  "ListAgentKey", "ListAgentFullName", "ListOfficeName",
]);

export function trimResoRaw(listing: ResoListing): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(listing)) {
    if (STORED_KEYS.has(k) && v != null && v !== "") out[k] = v;
  }
  return out;
}
