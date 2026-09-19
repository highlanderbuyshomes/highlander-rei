import { describe, expect, it } from "vitest";
import { buildWhere } from "./build-query";

const text = (f: Parameters<typeof buildWhere>[0]) => buildWhere(f).sql.replace(/\s+/g, " ");

describe("buildWhere", () => {
  it("is TRUE with no filters", () => expect(text({})).toBe("TRUE"));

  it("filters status by normalised name", () => {
    const q = buildWhere({ statuses: ["Active", "Coming Soon"] });
    expect(q.sql).toContain("c.status IN");
    expect(q.values).toEqual(["Active", "Coming Soon"]);
  });

  it("parametrises numeric ranges", () => {
    const q = buildWhere({ priceMin: 100000, priceMax: 500000, bedsMin: 3 });
    expect(q.values).toEqual([100000, 500000, 3]);
    expect(q.sql).toContain("COALESCE(c.price, 0) >=");
    expect(q.sql).toContain("c.price <=");
    expect(q.sql).toContain("COALESCE(c.beds, 0) >=");
  });

  it("treats a missing value as failing a minimum, as the client did", () => {
    expect(text({ sqftMin: 1000 })).toContain("COALESCE(c.sqft, 0) >=");
  });

  it("pool yes/no and levels", () => {
    expect(text({ pool: true })).toContain("c.pool IS TRUE");
    expect(text({ pool: false })).toContain("c.pool IS FALSE");
    expect(text({ levels: 2 })).toContain("c.levels =");
    expect(text({ levels: "3+" })).toContain("COALESCE(c.levels, 0) >= 3");
  });

  it("keyword matches mls/address/city/zip case-insensitively with escaped wildcards", () => {
    const q = buildWhere({ keyword: "50%_off" });
    expect(q.sql).toContain("ILIKE");
    expect(q.values[0]).toBe("%50\\%\\_off%");
  });

  it("closed window only constrains Closed listings", () => {
    const q = buildWhere({ closedWithinMonths: 6 });
    expect(q.sql).toContain("c.status <> 'Closed'");
    expect(q.sql).toContain("c.closed >=");
  });

  it("joins conditions with AND", () => {
    expect(text({ zips: ["85018"], dwellingTypes: ["Condo"] })).toContain(" AND ");
  });
});
