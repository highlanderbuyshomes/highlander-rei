import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { buildFilter } from "./reso";
import { isRecentRental, resolveRentalPlan, toRentalRow } from "./rental-sync";

describe("buildFilter leaseOnly", () => {
  it("selects residential leases modified since the watermark", () => {
    const f = buildFilter({ leaseOnly: true, counties: ["Maricopa"], modifiedSince: "2026-09-01T00:00:00Z" });
    expect(f).toContain("PropertyType eq 'Residential Lease'");
    expect(f).toContain("ModificationTimestamp gt 2026-09-01T00:00:00Z");
    expect(f).toContain("CountyOrParish in ('Maricopa')");
    expect(f).not.toContain("PropertyType ne");
  });

  it("leaves the sales filter unchanged without the flag", () => {
    const f = buildFilter({ modifiedSince: "2026-09-01T00:00:00Z" });
    expect(f).toContain("PropertyType ne 'Residential Lease'");
    expect(f).not.toContain("PropertyType eq");
  });
});

describe("toRentalRow", () => {
  it("keeps only the MLS #, address key, list date and monthly rent", () => {
    const row = toRentalRow({
      ListingKey: "k1", ListingId: "6812345", UnparsedAddress: "1234 E Sample Rd", PostalCode: "85008",
      ListDate: "2026-05-01", ListPrice: 2100, PublicRemarks: "not stored",
    });
    expect(row).toEqual({ mlsNumber: "6812345", addressFingerprint: "1234esamplerd|85008", listDate: "2026-05-01T00:00:00.000Z", rent: 2100 });
  });

  it("falls back to ListingKey and tolerates missing date/rent", () => {
    expect(toRentalRow({ ListingKey: "k2", UnparsedAddress: "1 Main St", PostalCode: "85018" }))
      .toEqual({ mlsNumber: "k2", addressFingerprint: "1mainst|85018", listDate: null, rent: null });
  });

  it("dates the rental from contract/on-market dates, else last change minus days on market", () => {
    const base = { ListingKey: "k4", UnparsedAddress: "1 Main St", PostalCode: "85018" };
    expect(toRentalRow({ ...base, ListingContractDate: "2026-04-02", ListDate: "2026-05-01" })!.listDate).toBe("2026-04-02T00:00:00.000Z");
    expect(toRentalRow({ ...base, OnMarketDate: "2026-04-03" })!.listDate).toBe("2026-04-03T00:00:00.000Z");
    expect(toRentalRow({ ...base, ModificationTimestamp: "2026-06-11T00:00:00Z", DaysOnMarket: 10 })!.listDate).toBe("2026-06-01T00:00:00.000Z");
  });

  it("skips listings without a ZIP (no address key to join on)", () => {
    expect(toRentalRow({ ListingKey: "k3", UnparsedAddress: "1 Main St" })).toBeNull();
  });
});

describe("resolveRentalPlan", () => {
  const now = new Date("2026-09-30T12:00:00Z");

  it("bootstraps 24 months of rentals when nothing has run", () => {
    const plan = resolveRentalPlan(null, now);
    expect(plan.kind).toBe("bootstrap");
    expect(plan.scope).toEqual({ counties: ["Maricopa", "Pinal"], modifiedSince: "2024-09-30T12:00:00.000Z" });
    expect(plan.control.meta).toEqual({ watermark: now.toISOString() });
    expect(plan.control.resumeUrl).toBeUndefined();
  });

  it("resumes a partial run from its resume URL, keeping its watermark and scope", () => {
    const scope = { counties: ["Maricopa", "Pinal"], modifiedSince: "2024-09-30T12:00:00.000Z" };
    const plan = resolveRentalPlan({ status: "partial", rawMeta: { watermark: "2026-09-30T10:00:00.000Z", resumeUrl: "https://x/next", scope } }, now);
    expect(plan).toEqual({ kind: "resume", scope, control: { resumeUrl: "https://x/next", meta: { watermark: "2026-09-30T10:00:00.000Z" } } });
  });

  it("runs incremental from a completed run's watermark, less a 5-minute overlap", () => {
    const plan = resolveRentalPlan({ status: "completed", rawMeta: { watermark: "2026-09-30T11:00:00.000Z" } }, now);
    expect(plan.kind).toBe("incremental");
    expect(plan.scope.modifiedSince).toBe("2026-09-30T10:55:00.000Z");
    expect(plan.control.meta).toEqual({ watermark: now.toISOString() });
  });

  it("bootstraps again when a partial run lost its resume point", () => {
    expect(resolveRentalPlan({ status: "partial", rawMeta: { watermark: "2026-09-30T10:00:00.000Z" } }, now).kind).toBe("bootstrap");
  });
});

describe("isRecentRental", () => {
  const now = new Date("2026-09-30T00:00:00Z");
  const row = (listDate: string | null) => ({ mlsNumber: "m", addressFingerprint: "f", listDate, rent: 2000 });
  it("keeps rentals listed within the last 24 months", () => {
    expect(isRecentRental(row("2024-10-01T00:00:00.000Z"), now)).toBe(true);
    expect(isRecentRental(row("2026-09-01T00:00:00.000Z"), now)).toBe(true);
  });
  it("drops older or undated rentals — they can't follow a purchase in the window", () => {
    expect(isRecentRental(row("2001-03-30T00:00:00.000Z"), now)).toBe(false);
    expect(isRecentRental(row(null), now)).toBe(false);
  });
});
