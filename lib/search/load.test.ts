import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { DWELLING_SQL, LEVELS_SQL, NUMERIC_PREFIX, POOL_SQL, sqftSql } from "./load";

describe("NUMERIC_PREFIX", () => {
  it("has no backslash and exactly one capturing group", () => {
    expect(NUMERIC_PREFIX).not.toContain("\\");
    const opens = NUMERIC_PREFIX.match(/\((?!\?:)/g) ?? [];
    expect(opens).toHaveLength(1);
  });

  it.each([
    ["1834", "1834"],
    ["7405.0", "7405.0"],
    ["1,834", "1"],
    ["abc", null],
    ["12abc", "12"],
  ])("captures %s -> %s", (input, expected) => {
    const m = new RegExp(NUMERIC_PREFIX).exec(input);
    expect(m ? m[1] : null).toBe(expected);
  });

  it("survives Prisma's cooked-string templating (no lone '.' where '[.]' belongs)", () => {
    const sql = Prisma.sql`SELECT ${sqftSql("p.sqft", ["LivingArea", "LivingAreaSqFt", "ApproxSQFT"])}`.sql;
    expect(sql).toContain(NUMERIC_PREFIX);
    expect(sql).toContain("(?:[.][0-9]+)?");
    expect(sql).not.toContain("(?:.[0-9]+)?");
    expect(sql).toContain("::float8");
    for (const frag of [LEVELS_SQL, POOL_SQL, DWELLING_SQL]) {
      expect(Prisma.sql`${frag}`.sql).not.toContain("(?:.[0-9]+)?");
    }
  });

  it("falls back per key to Property.rawJson with empty strings ignored", () => {
    expect(Prisma.sql`${DWELLING_SQL}`.sql).toContain(`NULLIF(p."rawJson"->>'PropertySubType', '')`);
    expect(Prisma.sql`${POOL_SQL}`.sql).toContain(`NULLIF(p."rawJson"->>'HasPool', '')`);
    expect(Prisma.sql`${LEVELS_SQL}`.sql).toContain(`NULLIF(p."rawJson"->>'Levels', '')`);
  });
});
