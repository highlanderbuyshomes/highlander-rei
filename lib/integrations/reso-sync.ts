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

async function findOrCreateAgent(listing: ResoListing) {
  const mlsId = listing.ListAgentKey;
  if (!mlsId && !listing.ListAgentFullName) return null;

  const data = {
    fullName: listing.ListAgentFullName ?? null,
    email: listing.ListAgentEmail ?? null,
    phone: listing.ListAgentDirectPhone ?? null,
    brokerageName: listing.ListOfficeName ?? null,
    rawJson: { source: "reso-listing-agent-field", ListAgentKey: mlsId ?? null },
  };

  // Pages are processed concurrently, and the same agent commonly lists
  // several properties in one page — a find-then-create here races: two
  // listings can both see "no existing agent" and both try to create it.
  // upsert is atomic at the DB level, so it can't race the same way.
  if (mlsId) {
    return prisma.mlsAgent.upsert({ where: { mlsId }, create: { mlsId, ...data }, update: data });
  }
  return prisma.mlsAgent.create({ data: { mlsId: null, ...data } });
}

async function upsertProperty(listing: ResoListing, importRunId: string) {
  const streetAddress = formatStreetAddress(listing);
  const zip = listing.PostalCode ?? "";
  const fingerprint = zip ? normalizeAddressFingerprint(streetAddress, zip) : null;

  const data = {
    addressFingerprint: fingerprint,
    streetAddress,
    city: listing.City ?? "Unknown",
    state: listing.StateOrProvince ?? "AZ",
    zip,
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

  // Pages are processed concurrently; two listings for the same address
  // (a relisted property under a new MLS number is common) can otherwise
  // both see "no existing property" in a find-then-create race. upsert on
  // the fingerprint is atomic, so it can't hit that race — a plain create
  // is the only option left when there's no zip to fingerprint against.
  if (fingerprint) {
    let created = false;
    const property = await prisma.property.upsert({
      where: { addressFingerprint: fingerprint },
      create: { ...data, importRunId },
      update: data,
    }).then((p) => {
      created = p.createdAt.getTime() === p.updatedAt.getTime();
      return p;
    });
    return { property, created };
  }

  const created = await prisma.property.create({ data: { ...data, importRunId } });
  return { property: created, created: true };
}

async function upsertListing(listing: ResoListing, propertyId: string, agentId: string | null, importRunId: string) {
  const mlsNumber = listing.ListingId ?? listing.ListingKey;
  const existing = await prisma.mlsListing.findUnique({ where: { mlsNumber } });

  const data = {
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

  if (existing) {
    const updated = await prisma.mlsListing.update({ where: { id: existing.id }, data });
    return { listing: updated, created: false, previousStatus: existing.mlsStatus };
  }

  const created = await prisma.mlsListing.create({ data: { ...data, mlsNumber, importRunId } });
  return { listing: created, created: true, previousStatus: null };
}

/**
 * Pulls listings from the ARMLS RESO Web API and upserts them into
 * Property / MlsListing / MlsAgent — the same tables the Search page and
 * buy-box matcher already read from. Deterministic mapping only: no AI/LLM
 * touches this data, consistent with the standing ARMLS compliance decision.
 */
export async function syncResoListings(opts: ResoScopeOpts = {}): Promise<ResoSyncResult> {
  const importRun = await prisma.importRun.create({
    data: { source: "reso", status: "running", startedAt: new Date() },
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

  try {
    for await (const page of fetchResoListingPages(opts)) {
      result.fetched += page.length;

      // Listings within a page touch distinct properties, so writing them
      // concurrently is safe and cuts wall-clock time dominated by DB
      // round-trips; pages themselves stay sequential (RESO's pagination
      // is inherently serial via @odata.nextLink).
      await Promise.all(page.map(async (listing) => {
        try {
          const { property, created: propertyCreated } = await upsertProperty(listing, importRun.id);
          propertyCreated ? result.propertiesCreated++ : result.propertiesUpdated++;

          const agent = await findOrCreateAgent(listing);

          const { listing: mlsListing, created: listingCreated, previousStatus } = await upsertListing(
            listing,
            property.id,
            agent?.id ?? null,
            importRun.id,
          );
          listingCreated ? result.listingsCreated++ : result.listingsUpdated++;

          const newStatus = listing.StandardStatus ?? null;
          if (!listingCreated && previousStatus !== newStatus && newStatus != null) {
            await prisma.listingStatusEvent.create({
              data: {
                listingId: mlsListing.id,
                fromStatus: previousStatus,
                toStatus: newStatus,
                source: "reso",
                changedAt: new Date(),
                rawJson: listing as object,
              },
            });
            result.statusChanges++;
          }
        } catch (err) {
          result.errors.push({
            listingNumber: listing.ListingId ?? listing.ListingKey,
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }));

      // Persist progress after every page so a long run is visible and a
      // partial/interrupted run still reflects real, saved work.
      await prisma.importRun.update({
        where: { id: importRun.id },
        data: { itemCount: result.fetched, rawMeta: { ...result, errors: result.errors.slice(0, 50) } },
      });
    }

    await prisma.importRun.update({
      where: { id: importRun.id },
      data: {
        status: result.errors.length > 0 ? "completed_with_errors" : "completed",
        itemCount: result.fetched,
        completedAt: new Date(),
        rawMeta: { ...result, errors: result.errors.slice(0, 50) },
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
