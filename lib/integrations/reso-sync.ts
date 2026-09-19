import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fetchResoListingPages, type ResoListing, type ResoScopeOpts } from "./reso";

export type ResoSyncResult = {
  importRunId: string;
  fetched: number;
  propertiesCreated: number;
  propertiesUpdated: number;
  listingsCreated: number;
  listingsUpdated: number;
  statusChanges: number;
  errors: { listingNumber: string; message: string }[];
  /** Set when the time budget ran out before the feed did; pass back as
   *  `resumeUrl` to continue where this run stopped. */
  resumeUrl?: string | null;
};

export type ResoSyncControl = {
  /** Epoch ms after which no new page is started; the run is saved as "partial". */
  deadline?: number;
  /** Continue from a previous partial run's `resumeUrl`. */
  resumeUrl?: string;
  /** Extra fields persisted in ImportRun.rawMeta on every write. */
  meta?: Record<string, unknown>;
};

function normalizeAddressFingerprint(streetAddress: string, zip: string): string {
  return `${streetAddress}|${zip}`.toLowerCase().replace(/[^a-z0-9|]/g, "");
}

function formatStreetAddress(listing: ResoListing): string {
  if (listing.UnparsedAddress) return listing.UnparsedAddress;
  const parts = [listing.StreetNumber, listing.StreetDirPrefix, listing.StreetName, listing.StreetSuffix].filter(Boolean);
  const base = parts.join(" ");
  return listing.UnitNumber ? `${base} #${listing.UnitNumber}` : base || "Unknown address";
}

function toBaths(listing: ResoListing): number | undefined {
  if (listing.BathroomsTotalInteger != null) return listing.BathroomsTotalInteger;
  if (listing.BathroomsFull == null && listing.BathroomsHalf == null) return undefined;
  return (listing.BathroomsFull ?? 0) + (listing.BathroomsHalf ?? 0) * 0.5;
}

function buildAgentData(listing: ResoListing) {
  return {
    fullName: listing.ListAgentFullName ?? null,
    email: listing.ListAgentEmail ?? null,
    phone: listing.ListAgentDirectPhone ?? null,
    brokerageName: listing.ListOfficeName ?? null,
    rawJson: { source: "reso-listing-agent-field", ListAgentKey: listing.ListAgentKey ?? null },
  };
}

function buildPropertyData(listing: ResoListing, fingerprint: string | null) {
  const streetAddress = formatStreetAddress(listing);
  return {
    addressFingerprint: fingerprint,
    streetAddress,
    city: listing.City ?? "Unknown",
    state: listing.StateOrProvince ?? "AZ",
    zip: listing.PostalCode ?? "",
    county: listing.CountyOrParish ?? null,
    subdivision: listing.SubdivisionName ?? null,
    propertyType: listing.PropertySubType ?? listing.PropertyType ?? null,
    beds: listing.BedroomsTotal ?? null,
    baths: toBaths(listing) ?? null,
    sqft: listing.LivingArea ?? null,
    lotSqft: listing.LotSizeSquareFeet ?? null,
    yearBuilt: listing.YearBuilt ?? null,
    estimatedValue: listing.ListPrice ?? null,
    latitude: listing.Latitude ?? null,
    longitude: listing.Longitude ?? null,
    source: "reso",
    sourceId: listing.ListingKey,
    rawJson: listing as object,
    lastRefreshedAt: new Date(),
  };
}

function buildListingData(listing: ResoListing, propertyId: string, agentId: string | null) {
  return {
    propertyId,
    mlsStatus: listing.StandardStatus ?? null,
    listPrice: listing.ListPrice ?? null,
    listDate: listing.ListDate ? new Date(listing.ListDate) : null,
    pendingDate: listing.PendingTimestamp ? new Date(listing.PendingTimestamp) : null,
    soldDate: listing.CloseDate ? new Date(listing.CloseDate) : null,
    soldPrice: listing.ClosePrice ?? null,
    dom: listing.DaysOnMarket ?? null,
    agentId,
    source: "reso",
    sourceId: listing.ListingKey,
    rawJson: listing as object,
  };
}

// Updates can't be bulk-written with differing values, so they go out as
// batched transactions — one round-trip per UPDATE_BATCH rows on one
// connection, instead of one pool checkout per row.
const UPDATE_BATCH = 50;

async function runUpdates(ops: Prisma.PrismaPromise<unknown>[]) {
  for (let i = 0; i < ops.length; i += UPDATE_BATCH) {
    await prisma.$transaction(ops.slice(i, i + UPDATE_BATCH));
  }
}

/**
 * Writes one RESO page with a fixed number of bulk queries instead of ~6
 * per listing: agents and properties are resolved with one lookup plus one
 * `createMany({ skipDuplicates })` each (race-safe against concurrent
 * chunks), listings likewise, then the remaining updates go out in batched
 * transactions. Known trade-offs: agents that already exist are not
 * refreshed, and listings with no ListAgentKey get no agent link.
 */
async function processPage(page: ResoListing[], importRunId: string, result: ResoSyncResult) {
  // Same MLS number twice in a page: last one wins.
  const byMls = new Map<string, ResoListing>();
  for (const l of page) byMls.set(l.ListingId ?? l.ListingKey, l);
  const listings = [...byMls.entries()];

  // --- Agents ---
  const agentRows = new Map<string, ResoListing>();
  for (const [, l] of listings) if (l.ListAgentKey) agentRows.set(l.ListAgentKey, l);
  const agentIdByMlsId = new Map<string, string>();
  if (agentRows.size) {
    await prisma.mlsAgent.createMany({
      data: [...agentRows].map(([mlsId, l]) => ({ mlsId, ...buildAgentData(l) })),
      skipDuplicates: true,
    });
    const agents = await prisma.mlsAgent.findMany({ where: { mlsId: { in: [...agentRows.keys()] } }, select: { id: true, mlsId: true } });
    for (const a of agents) if (a.mlsId) agentIdByMlsId.set(a.mlsId, a.id);
  }

  // --- Properties --- (key = address fingerprint, or ListingKey if no zip)
  const propByKey = new Map<string, { fingerprint: string | null; data: ReturnType<typeof buildPropertyData> }>();
  const keyByMls = new Map<string, string>();
  for (const [mlsNumber, l] of listings) {
    const zip = l.PostalCode ?? "";
    const fingerprint = zip ? normalizeAddressFingerprint(formatStreetAddress(l), zip) : null;
    const key = fingerprint ?? `nofp:${l.ListingKey}`;
    propByKey.set(key, { fingerprint, data: buildPropertyData(l, fingerprint) });
    keyByMls.set(mlsNumber, key);
  }

  const propIdByKey = new Map<string, string>();
  const fingerprints = [...propByKey.values()].map((p) => p.fingerprint).filter((f): f is string => f != null);
  const existingProps = fingerprints.length
    ? await prisma.property.findMany({ where: { addressFingerprint: { in: fingerprints } }, select: { id: true, addressFingerprint: true } })
    : [];
  const existingFp = new Set<string>();
  for (const p of existingProps) {
    existingFp.add(p.addressFingerprint!);
    propIdByKey.set(p.addressFingerprint!, p.id);
  }

  const newFp = [...propByKey].filter(([, p]) => p.fingerprint && !existingFp.has(p.fingerprint));
  if (newFp.length) {
    const { count } = await prisma.property.createMany({
      data: newFp.map(([, p]) => ({ ...p.data, importRunId })),
      skipDuplicates: true,
    });
    result.propertiesCreated += count;
    // Rows a concurrent chunk inserted first weren't counted as ours; count them as updates.
    result.propertiesUpdated += newFp.length - count;
    const created = await prisma.property.findMany({
      where: { addressFingerprint: { in: newFp.map(([k]) => k) } },
      select: { id: true, addressFingerprint: true },
    });
    for (const p of created) propIdByKey.set(p.addressFingerprint!, p.id);
  }

  const noFp = [...propByKey].filter(([, p]) => !p.fingerprint);
  if (noFp.length) {
    const created = await prisma.property.createManyAndReturn({
      data: noFp.map(([, p]) => ({ ...p.data, importRunId })),
      select: { id: true, sourceId: true },
    });
    result.propertiesCreated += created.length;
    for (const p of created) propIdByKey.set(`nofp:${p.sourceId}`, p.id);
  }

  await runUpdates(
    existingProps.map((e) => {
      const { data } = propByKey.get(e.addressFingerprint!)!;
      return prisma.property.update({ where: { id: e.id }, data });
    }),
  );
  result.propertiesUpdated += existingProps.length;

  // --- Listings ---
  const existingListings = await prisma.mlsListing.findMany({
    where: { mlsNumber: { in: listings.map(([n]) => n) } },
    select: { id: true, mlsNumber: true, mlsStatus: true },
  });
  const existingByMls = new Map(existingListings.map((e) => [e.mlsNumber, e]));

  const resolve = (mlsNumber: string, l: ResoListing) => {
    const propertyId = propIdByKey.get(keyByMls.get(mlsNumber)!);
    if (!propertyId) throw new Error(`No property resolved for listing ${mlsNumber}`);
    return buildListingData(l, propertyId, l.ListAgentKey ? agentIdByMlsId.get(l.ListAgentKey) ?? null : null);
  };

  const toCreate = listings.filter(([n]) => !existingByMls.has(n));
  if (toCreate.length) {
    const { count } = await prisma.mlsListing.createMany({
      data: toCreate.map(([mlsNumber, l]) => ({ ...resolve(mlsNumber, l), mlsNumber, importRunId })),
      skipDuplicates: true,
    });
    result.listingsCreated += count;
    result.listingsUpdated += toCreate.length - count;
  }

  const toUpdate = listings.filter(([n]) => existingByMls.has(n));
  await runUpdates(
    toUpdate.map(([mlsNumber, l]) => prisma.mlsListing.update({ where: { id: existingByMls.get(mlsNumber)!.id }, data: resolve(mlsNumber, l) })),
  );
  result.listingsUpdated += toUpdate.length;

  const events = toUpdate.flatMap(([mlsNumber, l]) => {
    const prev = existingByMls.get(mlsNumber)!;
    const newStatus = l.StandardStatus ?? null;
    if (newStatus == null || prev.mlsStatus === newStatus) return [];
    return [{ listingId: prev.id, fromStatus: prev.mlsStatus, toStatus: newStatus, source: "reso", changedAt: new Date(), rawJson: l as object }];
  });
  if (events.length) {
    await prisma.listingStatusEvent.createMany({ data: events });
    result.statusChanges += events.length;
  }
}

/**
 * Pulls listings from the ARMLS RESO Web API and upserts them into
 * Property / MlsListing / MlsAgent — the same tables the Search page and
 * buy-box matcher already read from. Deterministic mapping only: no AI/LLM
 * touches this data, consistent with the standing ARMLS compliance decision.
 */
export async function syncResoListings(opts: ResoScopeOpts = {}, importSource = "reso", control: ResoSyncControl = {}): Promise<ResoSyncResult> {
  const importRun = await prisma.importRun.create({
    data: { source: importSource, status: "running", startedAt: new Date() },
  });

  const result: ResoSyncResult = {
    importRunId: importRun.id,
    fetched: 0,
    propertiesCreated: 0,
    propertiesUpdated: 0,
    listingsCreated: 0,
    listingsUpdated: 0,
    statusChanges: 0,
    errors: [],
  };

  const persist = (extra: Record<string, unknown> = {}) => ({ ...control.meta, ...result, errors: result.errors.slice(0, 50), ...extra });

  try {
    let pageNumber = 1;
    let fetchStarted = Date.now();
    for await (const { listings: page, nextLink } of fetchResoListingPages(opts, control.resumeUrl)) {
      const fetchMs = Date.now() - fetchStarted;
      result.fetched += page.length;

      const writeStarted = Date.now();
      try {
        await processPage(page, importRun.id, result);
      } catch (err) {
        result.errors.push({ listingNumber: `page-${pageNumber}`, message: err instanceof Error ? err.message : String(err) });
      }
      console.log(`[reso/sync ${importSource}] page ${pageNumber}: ${page.length} listings, fetch ${fetchMs}ms, write ${Date.now() - writeStarted}ms`);
      pageNumber++;

      // Out of time with more feed to go: save a resume point and stop cleanly.
      if (nextLink && control.deadline && Date.now() > control.deadline) {
        result.resumeUrl = nextLink;
        await prisma.importRun.update({
          where: { id: importRun.id },
          data: { status: "partial", itemCount: result.fetched, completedAt: new Date(), rawMeta: persist({ resumeUrl: nextLink, scope: opts as object }) },
        });
        return result;
      }

      // Persist progress after every page so a long run is visible and a
      // partial/interrupted run still reflects real, saved work.
      await prisma.importRun.update({
        where: { id: importRun.id },
        data: { itemCount: result.fetched, rawMeta: persist() },
      });
      fetchStarted = Date.now();
    }

    await prisma.importRun.update({
      where: { id: importRun.id },
      data: {
        status: result.errors.length > 0 ? "completed_with_errors" : "completed",
        itemCount: result.fetched,
        completedAt: new Date(),
        rawMeta: persist(),
      },
    });
  } catch (err) {
    await prisma.importRun.update({
      where: { id: importRun.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorMessage: err instanceof Error ? err.message : String(err),
      },
    });
    throw err;
  }

  return result;
}
