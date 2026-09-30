import { prisma } from "@/lib/prisma";
import { fetchResoListingPages, type ResoListing, type ResoScopeOpts } from "./reso";
import { formatStreetAddress, normalizeAddressFingerprint } from "./reso-sync";

/**
 * ARMLS rental listings for Investor comps: a cash buy followed by a rental
 * listing is a landlord. Only the MLS #, address key, list date and monthly
 * rent are kept — no Property row, no raw listing. Deterministic mapping only.
 */
export const RENTAL_SOURCE = "reso-lease";

export type RentalRow = { mlsNumber: string; addressFingerprint: string; listDate: string | null; rent: number | null };

export type RentalSyncResult = { importRunId: string; fetched: number; saved: number; partial: boolean };

export function toRentalRow(l: ResoListing): RentalRow | null {
  if (!l.PostalCode) return null;
  const listDate = l.ListDate ? new Date(l.ListDate) : null;
  return {
    mlsNumber: l.ListingId ?? l.ListingKey,
    addressFingerprint: normalizeAddressFingerprint(formatStreetAddress(l), l.PostalCode),
    listDate: listDate && !Number.isNaN(listDate.getTime()) ? listDate.toISOString() : null,
    rent: typeof l.ListPrice === "number" && Number.isFinite(l.ListPrice) ? l.ListPrice : null,
  };
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
export async function syncRentalListings(
  opts: ResoScopeOpts,
  control: { deadline?: number; meta?: Record<string, unknown> } = {},
): Promise<RentalSyncResult> {
  const run = await prisma.importRun.create({ data: { source: RENTAL_SOURCE, status: "running", startedAt: new Date() } });
  const result: RentalSyncResult = { importRunId: run.id, fetched: 0, saved: 0, partial: false };
  const meta = () => ({ ...control.meta, ...result, scope: { ...opts, leaseOnly: true } });

  try {
    for await (const { listings, nextLink } of fetchResoListingPages({ ...opts, leaseOnly: true })) {
      result.fetched += listings.length;
      const byMls = new Map<string, RentalRow>();
      for (const l of listings) {
        const row = toRentalRow(l);
        if (row) byMls.set(row.mlsNumber, row);
      }
      await upsertRows([...byMls.values()]);
      result.saved += byMls.size;

      if (nextLink && control.deadline && Date.now() > control.deadline) {
        result.partial = true;
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
