import { describe, expect, it } from "vitest";
import { buildFilters, type CriteriaKey, type FilterState } from "./build-filters";

const state = (over: Partial<FilterState> & { on?: CriteriaKey[] } = {}): FilterState => {
  const { on = [], ...rest } = over;
  return {
    activeCriteria: new Set(on),
    statuses: [], closedWithinMonths: "Any",
    priceMin: "", priceMax: "", dwellingTypes: [], bedsMin: "", bathsMin: "",
    sqftMin: "", sqftMax: "", lotMin: "", lotMax: "", pool: "Any", levels: "Any", zips: "", keyword: "",
    ...rest,
  };
};

describe("buildFilters", () => {
  it.each<[string, FilterState, Record<string, unknown>]>([
    ["empty box contributes nothing", state({ on: ["price"], priceMin: "" }), {}],
    ["'0' is a real bound", state({ on: ["price"], priceMin: "0" }), { priceMin: 0 }],
    ["bare '.' is dropped", state({ on: ["sqft"], sqftMin: "." }), {}],
    ["'Any' closed window contributes nothing", state({ on: ["status"], statuses: ["Closed"], closedWithinMonths: "Any" }), { statuses: ["Closed"] }],
    ["closed window number", state({ on: ["status"], statuses: ["Closed"], closedWithinMonths: "6" }), { statuses: ["Closed"], closedWithinMonths: 6 }],
    ["populated but unchecked criterion is ignored", state({ priceMin: "100000", zips: "85018", dwellingTypes: ["Condo"], pool: "Yes", levels: "2" }), {}],
    ["all statuses unchecked -> no status filter", state({ on: ["status"], statuses: [] }), {}],
    ["zip splitting on commas and whitespace", state({ on: ["zip"], zips: "85018, 85016  85251,,\n85254" }), { zips: ["85018", "85016", "85251", "85254"] }],
    ["blank zips -> none", state({ on: ["zip"], zips: " , " }), {}],
    ["pool Yes", state({ on: ["pool"], pool: "Yes" }), { pool: true }],
    ["pool No", state({ on: ["pool"], pool: "No" }), { pool: false }],
    ["pool Any", state({ on: ["pool"], pool: "Any" }), {}],
    ["levels 3+", state({ on: ["levels"], levels: "3+" }), { levels: "3+" }],
    ["levels numeric", state({ on: ["levels"], levels: "2" }), { levels: 2 }],
    ["levels Any", state({ on: ["levels"], levels: "Any" }), {}],
    ["keyword applies without any criterion", state({ keyword: "  pool  " }), { keyword: "pool" }],
    ["min/max pair", state({ on: ["lot"], lotMin: "5000", lotMax: "10000.5" }), { lotMin: 5000, lotMax: 10000.5 }],
  ])("%s", (_name, input, expected) => {
    const out = buildFilters(input);
    const defined = Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined));
    expect(defined).toEqual(expected);
  });
});
