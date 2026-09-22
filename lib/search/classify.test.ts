import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { dwellingSql, normalizeDwelling, normalizeStatus, statusSql } from "./classify";

describe("normalizeDwelling", () => {
  it.each([
    ["Single Family Residence", "Single Family"],
    ["Single Family - Detached", "Single Family"],
    ["Townhouse", "Townhouse"],
    ["Condominium", "Condo"],
    ["Apartment Style/Flat", "Condo"],
    ["Patio Home", "Patio Home"],
    ["Gemini/Twin Home", "Patio Home"],
    ["Manufactured Home", "Manufactured"],
    ["Mobile Home", "Manufactured"],
    ["Duplex", "Multi-Family"],
    ["Land", "Land"],
    ["Residential", "Single Family"],
    ["Commercial", "Commercial"],
    ["Comm/Industry Sale", "Commercial"],
    ["Multiple Dwellings", "Multi-Family"],
    ["MFH_2_TO_4", "Multi-Family"],
    ["Mfg/Mobile Housing", "Manufactured"],
    ["Loft Style", "Condo"],
    ["Cabin", "Other"],
    [null, "Single Family"],
  ])("%s -> %s", (raw, label) => expect(normalizeDwelling(raw)).toBe(label));
});

describe("SQL mirrors of the classifiers", () => {
  it("emit one CASE arm per label with plain LIKE needles", () => {
    const status = Prisma.sql`${statusSql(`l."mlsStatus"`)}`.sql;
    expect(status).toContain(`LIKE '%under contract%' OR`);
    expect(status.indexOf("'Under Contract'")).toBeLessThan(status.indexOf("THEN 'Active'"));
    const dwelling = Prisma.sql`${dwellingSql("x")}`.sql;
    expect(dwelling).toContain("THEN 'Single Family'");
    expect(dwelling).not.toContain("\\");
  });

  it("keeps unknown statuses as-is", () => {
    expect(normalizeStatus("Something New")).toBe("Something New");
  });
});
