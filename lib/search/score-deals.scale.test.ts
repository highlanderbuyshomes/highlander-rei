import { describe, expect, it } from "vitest";
import { scoreDeals } from "./score-deals";
import type { ListingRecord } from "./types";

// mulberry32 seeded PRNG
function prng(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ZIPS = ["85018", "85016", "85251", "85254", "85331", "85331 "];
const TYPES = ["Single Family", "Townhouse", "Condo", "Manufactured"];
const STATUSES = ["Active", "Pending", "Coming Soon", "Expired", "Canceled", "Withdrawn", "Closed", "Active Under Contract", ""];

function generate(n: number, seed: number): ListingRecord[] {
  const rnd = prng(seed);
  const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
  return Array.from({ length: n }, (_, i) => {
    const r = rnd();
    const sqft = r < 0.12 ? null : r < 0.18 ? 0 : Math.round(600 + rnd() * 3400);
    const p = rnd();
    const listPrice = p < 0.1 ? null : p < 0.13 ? 0 : Math.round((100000 + rnd() * 900000) / 1000) * 1000;
    const o = rnd();
    return {
      id: `id-${String(Math.floor(rnd() * n * 0.9)).padStart(6, "0")}-${i % 7}`, // some tied/near ids
      mlsNumber: "", status: pick(STATUSES), listPrice, dom: rnd() < 0.2 ? null : Math.floor(rnd() * 150),
      listDate: null, address: "", city: "", state: "", zip: pick(ZIPS), subdivision: null,
      dwellingType: pick(TYPES), beds: null, baths: null, sqft, lotSqft: null, pool: null, interiorLevels: null,
      yearBuilt: null, latitude: null, longitude: null, ownerName: null,
      estimatedEquityPct: rnd() < 0.3 ? null : Math.round(rnd() * 100),
      ownerOccupied: rnd() < 0.3 ? null : rnd() < 0.5,
      estimatedArv: rnd() < 0.35 ? Math.round(150000 + rnd() * 1000000) : rnd() < 0.05 ? 0 : undefined,
      originalListPrice: o < 0.5 ? null : listPrice ? Math.round(listPrice * (0.9 + rnd() * 0.3)) : null,
      distressSignal: rnd() < 0.25 ? true : rnd() < 0.5 ? false : undefined,
      remarks: rnd() < 0.1 ? "needs TLC, sold as-is" : null,
      source: "reso",
    } satisfies ListingRecord;
  });
}

describe("scoreDeals at scale", () => {
  it("breaks score ties by id ascending", () => {
    const base = generate(1, 5)[0];
    const tied = ["b", "c", "a"].map((id) => ({ ...base, id, listPrice: null, sqft: null, estimatedArv: undefined, distressSignal: false, dom: null, status: "Active", estimatedEquityPct: null, ownerOccupied: null, originalListPrice: null, remarks: null }));
    expect(scoreDeals(tied, 70).map((d) => d.id)).toEqual(["a", "b", "c"]);
  });

  it("scores 25,000 listings well under the bound (was O(n^2))", () => {
    const listings = generate(25000, 42);
    const start = performance.now();
    scoreDeals(listings, 70);
    expect(performance.now() - start).toBeLessThan(5000);
  });
});
