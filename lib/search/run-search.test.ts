import { describe, expect, it } from "vitest";
import { applyShape } from "./run-search";

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
