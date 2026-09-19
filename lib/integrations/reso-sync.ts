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

// Vercel -> Neon is ~65ms per round trip, so even batched per-row UPDATEs
// cost ~27s per 200-listing page. Instead each page's updates go out as ONE
// statement per table: the rows travel as a single jsonb array and Postgres
// joins them to the target table.
const BULK_CHUNK = 100;

const int = (v: number | null | undefined) => (v == null ? null : Math.round(v));
const iso = (d: Date | null) => (d ? d.toISOString() : null);

async function bulkUpdateProperties(rows: { id: string; data: ReturnType<typeof buildPropertyData> }[]) {
  for (let i = 0; i < rows.length; i += BULK_CHUNK) {
    const payload = rows.slice(i, i + BULK_CHUNK).map(({ id, data: d }) => ({
      id,
      streetAddress: d.streetAddress,
      city: d.city,
      state: d.state,
      zip: d.zip,
      county: d.county,
      subdivision: d.subdivision,
      propertyType: d.propertyType,
      beds: int(d.beds),
      baths: d.baths,
      sqft: int(d.sqft),
      lotSqft: int(d.lotSqft),
      yearBuilt: int(d.yearBuilt),
      estimatedValue: d.estimatedValue,
      latitude: d.latitude,
      longitude: d.longitude,
      sourceId: d.sourceId,
      rawJson: d.rawJson,
    }));
    await prisma.$executeRaw`
      UPDATE "Property" AS p SET
        "streetAddress" = x."streetAddress", city = x.city, state = x.state, zip = x.zip,
        county = x.county, subdivision = x.subdivision, "propertyType" = x."propertyType",
        beds = x.beds, baths = x.baths, sqft = x.sqft, "lotSqft" = x."lotSqft", "yearBuilt" = x."yearBuilt",
        "estimatedValue" = x."estimatedValue", latitude = x.latitude, longitude = x.longitude,
        "sourceId" = x."sourceId", "rawJson" = x."rawJson", "lastRefreshedAt" = now(), "updatedAt" = now()
      FROM jsonb_to_recordset(${JSON.stringify(payload)}::jsonb) AS x(
        id text, "streetAddress" text, city text, state text, zip text, county text, subdivision text,
        "propertyType" text, beds int, baths double precision, sqft int, "lotSqft" int, "yearBuilt" int,
        "estimatedValue" double precision, latitude double precision, longitude double precision,
        "sourceId" text, "rawJson" jsonb
      )
      WHERE p.id = x.id`;
  }
}

async function bulkUpdateListings(rows: { id: string; data: ReturnType<typeof buildListingData> }[]) {
  for (let i = 0; i < rows.length; i += BULK_CHUNK) {
    const payload = rows.slice(i, i + BULK_CHUNK).map(({ id, data: d }) => ({
      id,
      propertyId: d.propertyId,
      mlsStatus: d.mlsStatus,
      listPrice: d.listPrice,
      listDate: iso(d.listDate),
      pendingDate: iso(d.pendingDate),
      soldDate: iso(d.soldDate),
      soldPrice: d.soldPrice,
      dom: int(d.dom),
      agentId: d.agentId,
      sourceId: d.sourceId,
      rawJson: d.rawJson,
    }));
    await prisma.$executeRaw`
      UPDATE "MlsListing" AS l SET
        "propertyId" = x."propertyId", "mlsStatus" = x."mlsStatus", "listPrice" = x."listPrice",
        "listDate" = x."listDate", "pendingDate" = x."pendingDate", "soldDate" = x."soldDate",
        "soldPrice" = x."soldPrice", dom = x.dom, "agentId" = x."agentId",
        "sourceId" = x."sourceId", "rawJson" = x."rawJson", "updatedAt" = now()
      FROM jsonb_to_recordset(${JSON.stringify(payload)}::jsonb) AS x(
        id text, "propertyId" text, "mlsStatus" text, "listPrice" double precision,
        "listDate" timestamp, "pendingDate" timestamp, "soldDate" timestamp, "soldPrice" double precision,
        dom int, "agentId" text, "sourceId" text, "rawJson" jsonb
      )
      WHERE l.id = x.id`;
  }
}

/**
 * Writes one RESO page with a fixed number of bulk queries instead of ~6
 * per listing: agents and properties are resolved with one lookup plus one
 * `createMany({ skipDuplicates })` each (race-safe against concurrent
 * chunks), listings likewise, then updates go out as one bulk UPDATE per table. Known trade-offs: agents that already exist are not
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

  await bulkUpdateProperties(existingProps.map((e) => ({ id: e.id, data: propByKey.get(e.addressFingerprint!)!.data })));
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
  await bulkUpdateListings(toUpdate.map(([mlsNumber, l]) => ({ id: existingByMls.get(mlsNumber)!.id, data: resolve(mlsNumber, l) })));
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
