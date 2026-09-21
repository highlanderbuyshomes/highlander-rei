import { describe, expect, it, vi } from "vitest";

vi.mock("./load", () => ({ loadCandidates: vi.fn(), loadRowsByIds: vi.fn() }));

import { applyShape, capPins, runSearch } from "./run-search";
import { loadCandidates, loadRowsByIds } from "./load";
import { MAX_PINS } from "./types";
import type { ListingRecord } from "./types";

const r = (id: string, lat: number | null, lng: number | null): { id: string; latitude: number | null; longitude: number | null } => ({ id, latitude: lat, longitude: lng });

describe("applyShape", () => {
  const rect = { type: "rectangle" as const, bounds: { north: 34, south: 33, east: -111, west: -112 } };

  it("keeps only rows inside; drops rows without coordinates when a shape is set", () => {
    const rows = [r("in", 33.5, -111.5), r("out", 35, -111.5), r("none", null, null)];
    expect(applyShape(rows, rect).map((x) => x.id)).toEqual(["in"]);
  });

  it("returns everything when no shape", () => {
    expect(applyShape([r("a", null, null)], null)).toHaveLength(1);
  });
});

const cand = (i: number): ListingRecord => ({
  id: `id-${String(i).padStart(5, "0")}`, mlsNumber: "", status: "Active", listPrice: 300000, dom: null, listDate: null,
  address: "", city: "", state: "", zip: "85018", subdivision: null, dwellingType: "Single Family", beds: null, baths: null,
  sqft: null, lotSqft: null, pool: null, interiorLevels: null, yearBuilt: null,
  latitude: i % 10 === 0 ? null : 33.5, longitude: i % 10 === 0 ? null : -112,
  ownerName: null, estimatedEquityPct: null, estimatedArv: 400000, distressSignal: false, source: "reso",
});

describe("pin capping", () => {
  it("capPins skips coordinate-less rows and stops at the cap, in order", () => {
    const scored = Array.from({ length: 30 }, (_, i) => ({ ...cand(i), dealScore: 0, priority: "Low" as const })) as never[];
    const pins = capPins(scored, 5);
    expect(pins).toHaveLength(5);
    expect(pins.map((p) => p.id)).toEqual(["id-00001", "id-00002", "id-00003", "id-00004", "id-00005"]);
  });

  it("runSearch caps pins at MAX_PINS but total/targetCount cover all matches", async () => {
    const n = MAX_PINS * 2 + 100;
    vi.mocked(loadCandidates).mockResolvedValue(Array.from({ length: n }, (_, i) => cand(i)));
    vi.mocked(loadRowsByIds).mockImplementation(async (ids) => ids.map((id) => ({ ...cand(Number(id.slice(3))), id })));
    const res = await runSearch({ filters: {}, arvThreshold: 80 });
    expect(res.pins).toHaveLength(MAX_PINS);
    expect(res.total).toBe(n);
    expect(res.targetCount).toBe(n); // 300k/400k = 75% <= 80 for every row
    expect(res.rows.length).toBe(100);
  });
});
