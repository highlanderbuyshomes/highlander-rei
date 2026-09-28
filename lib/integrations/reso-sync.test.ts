import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
const { safeInt } = await import("./reso-sync");

describe("safeInt", () => {
  it("rounds normal values", () => {
    expect(safeInt(1834.6)).toBe(1835);
    expect(safeInt(0)).toBe(0);
  });

  it("nulls values that would overflow a Postgres integer", () => {
    expect(safeInt(871200871924)).toBeNull();
    expect(safeInt(Number.NaN)).toBeNull();
    expect(safeInt(null)).toBeNull();
    expect(safeInt(undefined)).toBeNull();
  });
});
