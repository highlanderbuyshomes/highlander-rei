/**
 * Normalize a street address into a stable fingerprint for deduplication.
 * Strips punctuation, normalizes whitespace, lowercases, and applies
 * common abbreviation expansions so "123 E Main St" and "123 East Main Street"
 * produce the same key.
 */

const ABBREVIATIONS: Record<string, string> = {
  st: "street", str: "street",
  ave: "avenue", av: "avenue",
  blvd: "boulevard",
  dr: "drive",
  ln: "lane",
  ct: "court",
  cir: "circle",
  pl: "place",
  rd: "road",
  pkwy: "parkway",
  trl: "trail",
  way: "way",
  n: "north", s: "south", e: "east", w: "west",
  ne: "northeast", nw: "northwest", se: "southeast", sw: "southwest",
  apt: "apt", ste: "suite", unit: "unit",
};

export function normalizeAddress(street: string, city: string, state: string, zip: string): string {
  const parts = [street, city, state, zip]
    .map((s) => s.trim().toLowerCase())
    .join(" ")
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .map((word) => ABBREVIATIONS[word] ?? word)
    .join(" ");

  return parts;
}

export function addressFingerprint(street: string, city: string, state: string, zip: string): string {
  return normalizeAddress(street, city, state, zip).replace(/\s+/g, "-");
}
