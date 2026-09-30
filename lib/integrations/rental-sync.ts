import { prisma } from "@/lib/prisma";
import { fetchResoListingPages, type ResoListing, type ResoScopeOpts } from "./reso";
import { formatStreetAddress, normalizeAddressFingerprint } from "./reso-sync";
import { OVERLAP_MS, VALLEY_COUNTIES } from "./reso-sync-plan";

/**
 * ARMLS rental listings for Investor comps: a cash buy followed by a rental
 * listing is a landlord. Only the MLS #, address key, list date and monthly
 * rent are kept — no Property row, no raw listing. Deterministic mapping only.
 */
export const RENTAL_SOURCE = "reso-lease";

export type RentalRow = { mlsNumber: string; addressFingerprint: string; listDate: string | null; rent: number | null };

export type RentalSyncResult = { importRunId: string; fetched: number; saved: number; partial: boolean };

/** Months of rental listings the first (bootstrap) pass loads. */
export const RENTAL_BOOTSTRAP_MONTHS = 24;

export type RentalSyncControl = { deadline?: number; resumeUrl?: string; meta?: Record<string, unknown> };

export type RentalPlan = { kind: "bootstrap" | "resume" | "incremental"; scope: ResoScopeOpts; control: RentalSyncControl };

type RentalMeta = { watermark?: string; resumeUrl?: string; scope?: ResoScopeOpts };

/**
 * Picks the rental pass from the latest completed/partial rental run: resume
 * a partial run, else continue incrementally from a completed run's
 * watermark, else bootstrap the last RENTAL_BOOTSTRAP_MONTHS. The watermark is
 * when the logical pass began, carried through its partial continuations.
 */
export function resolveRentalPlan(latest: { status: string; rawMeta: unknown } | null, now: Date = new Date()): RentalPlan {
  const meta = (latest?.rawMeta ?? {}) as RentalMeta;
  if (latest?.status === "partial" && meta.resumeUrl && meta.watermark && meta.scope) {
    return { kind: "resume", scope: meta.scope, control: { resumeUrl: meta.resumeUrl, meta: { watermark: meta.watermark } } };
  }
  if (latest?.status === "completed" && meta.watermark) {
    const modifiedSince = new Date(new Date(meta.watermark).getTime() - OVERLAP_MS).toISOString();
    return { kind: "incremental", scope: { counties: VALLEY_COUNTIES, modifiedSince }, control: { meta: { watermark: now.toISOString() } } };
  }
  const since = new Date(now);
  since.setUTCMonth(since.getUTCMonth() - RENTAL_BOOTSTRAP_MONTHS);
  return { kind: "bootstrap", scope: { counties: VALLEY_COUNTIES, modifiedSince: since.toISOString() }, control: { meta: { watermark: now.toISOString() } } };
}

const validDate = (v: unknown) => {
  if (typeof v !== "string" || !v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** When the rental hit the market. ARMLS doesn't reliably send ListDate, so
 *  fall back to the contract/on-market dates, then last change minus DOM. */
export function rentalListDate(l: ResoListing): Date | null {
  const direct = validDate(l.ListingContractDate) ?? validDate(l.OnMarketDate) ?? validDate(l.ListDate);
  if (direct) return direct;
  const modified = validDate(l.ModificationTimestamp);
  if (!modified) return null;
  return new Date(modified.getTime() - (l.DaysOnMarket ?? 0) * 24 * 3600_000);
}

export function toRentalRow(l: ResoListing): RentalRow | null {
  if (!l.PostalCode) return null;
  const listDate = rentalListDate(l);
  return {
    mlsNumber: l.ListingId ?? l.ListingKey,
    addressFingerprint: normalizeAddressFingerprint(formatStreetAddress(l), l.PostalCode),
    listDate: listDate ? listDate.toISOString() : null,
    rent: typeof l.ListPrice === "number" && Number.isFinite(l.ListPrice) ? l.ListPrice : null,
  };
}

/** Rentals listed before the bootstrap window can't follow a purchase Investor comps looks at. */
export function isRecentRental(row: RentalRow, now: Date = new Date()): boolean {
  if (!row.listDate) return false;
  const since = new Date(now);
  since.setUTCMonth(since.getUTCMonth() - RENTAL_BOOTSTRAP_MONTHS);
  return new Date(row.listDate).getTime() >= since.getTime();
}

async function upsertRows(rows: RentalRow[]) {
  if (rows.length === 0) return;
  await prisma.$executeRaw`
    INSERT INTO "RentalListing" (id, "mlsNumber", "addressFingerprint", "listDate", rent, "updatedAt")
    SELECT gen_random_uuid()::text, x.m, x.f, x.d::timestamp, x.r, now()
    FROM unnest(${rows.map((r) => r.mlsNumber)}::text[], ${rows.map((r) => r.addressFingerprint)}::text[],
                ${rows.map((r) => r.listDate)}::text[], ${rows.map((r) => r.rent)}::float8[]) AS x(m, f, d, r)
    ON CONFLICT ("mlsNumber") DO UPDATE SET
      "addressFingerprint" = EXCLUDED."addressFingerprint", "listDate" = EXCLUDED."listDate",
      rent = EXCLUDED.rent, "updatedAt" = now()`;
}

/** Pulls rental listings in the scope (forced lease-only) and upserts them. */
export async function syncRentalListings(opts: ResoScopeOpts, control: RentalSyncControl = {}): Promise<RentalSyncResult> {
  const run = await prisma.importRun.create({ data: { source: RENTAL_SOURCE, status: "running", startedAt: new Date() } });
  const result: RentalSyncResult = { importRunId: run.id, fetched: 0, saved: 0, partial: false };
  let resumeUrl: string | null = null;
  const meta = () => ({ ...control.meta, ...result, scope: opts, ...(resumeUrl ? { resumeUrl } : {}) });

  try {
    for await (const { listings, nextLink } of fetchResoListingPages({ ...opts, leaseOnly: true }, control.resumeUrl)) {
      result.fetched += listings.length;
      const byMls = new Map<string, RentalRow>();
      for (const l of listings) {
        const row = toRentalRow(l);
        if (row && isRecentRental(row)) byMls.set(row.mlsNumber, row);
      }
      await upsertRows([...byMls.values()]);
      result.saved += byMls.size;

      if (nextLink && control.deadline && Date.now() > control.deadline) {
        result.partial = true;
        resumeUrl = nextLink;
        break;
      }
    }
    await prisma.importRun.update({
      where: { id: run.id },
      data: { status: result.partial ? "partial" : "completed", itemCount: result.fetched, completedAt: new Date(), rawMeta: meta() },
    });
  } catch (err) {
    await prisma.importRun.update({
      where: { id: run.id },
      data: { status: "failed", completedAt: new Date(), errorMessage: err instanceof Error ? err.message : String(err), rawMeta: meta() },
    });
    throw err;
  }
  return result;
}
