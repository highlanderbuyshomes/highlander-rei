import { prisma } from "@/lib/prisma";
import { fetchAllIHomeFinderListings, type IHomeFinderListing } from "./ihomefinder";

export type IHomeFinderSyncResult = {
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

function formatStreetAddress(address: IHomeFinderListing["address"]): string {
  if (!address) return "Unknown address";
  const parts = [address.streetNumber, address.streetName].filter(Boolean);
  const base = parts.join(" ");
  return address.unitNumber ? `${base} #${address.unitNumber}` : base || "Unknown address";
}

function toBaths(fullBaths?: number, partialBaths?: number): number | undefined {
  if (fullBaths == null && partialBaths == null) return undefined;
  return (fullBaths ?? 0) + (partialBaths ?? 0) * 0.5;
}

function toPropertyTypeLabel(pt: IHomeFinderListing["propertyType"]): string | undefined {
  if (!pt) return undefined;
  return typeof pt === "string" ? pt : pt.name;
}

async function findOrCreateAgent(agentName: string | undefined, brokerageName: string | undefined) {
  if (!agentName) return null;
  const existing = await prisma.mlsAgent.findFirst({ where: { fullName: agentName } });
  if (existing) return existing;
  return prisma.mlsAgent.create({
    data: { fullName: agentName, brokerageName: brokerageName ?? null, rawJson: { source: "ihomefinder-listing-agent-field" } },
  });
}

async function upsertProperty(listing: IHomeFinderListing, importRunId: string) {
  const streetAddress = formatStreetAddress(listing.address);
  const zip = listing.address?.zip ?? "";
  const fingerprint = zip ? normalizeAddressFingerprint(streetAddress, zip) : null;

  const existing = fingerprint
    ? await prisma.property.findUnique({ where: { addressFingerprint: fingerprint } })
    : null;

  const data = {
    addressFingerprint: fingerprint,
    streetAddress,
    city: listing.address?.city ?? "Unknown",
    state: listing.address?.state ?? "AZ",
    zip,
    county: listing.address?.county ?? null,
    propertyType: toPropertyTypeLabel(listing.propertyType) ?? null,
    beds: listing.bedrooms ?? null,
    baths: toBaths(listing.fullBathrooms, listing.partialBathrooms) ?? null,
    sqft: listing.squareFeet ?? null,
    lotSqft: listing.lotSize ?? null,
    yearBuilt: listing.yearBuilt ?? null,
    estimatedValue: listing.listPrice ?? null,
    latitude: listing.latitude ?? null,
    longitude: listing.longitude ?? null,
    source: "ihomefinder",
    sourceId: String(listing.id),
    rawJson: listing as object,
    lastRefreshedAt: new Date(),
  };

  if (existing) {
    const updated = await prisma.property.update({ where: { id: existing.id }, data });
    return { property: updated, created: false };
  }

  const created = await prisma.property.create({
    data: { ...data, importRunId },
  });
  return { property: created, created: true };
}

async function upsertListing(listing: IHomeFinderListing, propertyId: string, agentId: string | null, importRunId: string) {
  const existing = await prisma.mlsListing.findUnique({ where: { mlsNumber: listing.listingNumber } });

  const data = {
    propertyId,
    mlsStatus: listing.status ?? null,
    listPrice: listing.listPrice ?? null,
    listDate: listing.listDate ? new Date(listing.listDate) : null,
    pendingDate: listing.pendingDate ? new Date(listing.pendingDate) : null,
    soldDate: listing.soldDate ? new Date(listing.soldDate) : null,
    soldPrice: listing.soldPrice ?? null,
    dom: listing.daysOnMarket ?? null,
    agentId,
    source: "ihomefinder",
    sourceId: String(listing.id),
    rawJson: listing as object,
  };

  if (existing) {
    const updated = await prisma.mlsListing.update({ where: { id: existing.id }, data });
    return { listing: updated, created: false, previousStatus: existing.mlsStatus };
  }

  const created = await prisma.mlsListing.create({
    data: { ...data, mlsNumber: listing.listingNumber, importRunId },
  });
  return { listing: created, created: true, previousStatus: null };
}

/**
 * Pulls every listing visible to this iHomefinder client account and
 * upserts it into Property / MlsListing / MlsAgent, recording a
 * ListingStatusEvent whenever a listing's status differs from what we
 * already had stored (e.g. active -> pending -> closed).
 *
 * Note: iHomefinder's Client API is an IDX consumer feed. Per standard IDX
 * syndication rules, it is expected to expose active/pending/sold listings
 * only — expired and cancelled listings are typically withdrawn from IDX
 * feeds entirely and will not appear here. If "expired" tracking is needed,
 * it likely requires a direct MLS/RESO feed rather than this IDX API.
 */
export async function syncIHomeFinderListings(opts: { marketId?: string; savedSearchId?: string } = {}): Promise<IHomeFinderSyncResult> {
  const importRun = await prisma.importRun.create({
    data: { source: "ihomefinder", status: "running", startedAt: new Date() },
  });

  const result: IHomeFinderSyncResult = {
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
    const listings = await fetchAllIHomeFinderListings(opts);
    result.fetched = listings.length;

    for (const listing of listings) {
      try {
        const { property, created: propertyCreated } = await upsertProperty(listing, importRun.id);
        propertyCreated ? result.propertiesCreated++ : result.propertiesUpdated++;

        const agent = await findOrCreateAgent(listing.listingAgent, listing.listingOffice);

        const { listing: mlsListing, created: listingCreated, previousStatus } = await upsertListing(
          listing,
          property.id,
          agent?.id ?? null,
          importRun.id,
        );
        listingCreated ? result.listingsCreated++ : result.listingsUpdated++;

        const newStatus = listing.status ?? null;
        if (!listingCreated && previousStatus !== newStatus && newStatus != null) {
          await prisma.listingStatusEvent.create({
            data: {
              listingId: mlsListing.id,
              fromStatus: previousStatus,
              toStatus: newStatus,
              source: "ihomefinder",
              changedAt: new Date(),
              rawJson: listing as object,
            },
          });
          result.statusChanges++;
        }
      } catch (err) {
        result.errors.push({
          listingNumber: listing.listingNumber ?? String(listing.id),
          message: err instanceof Error ? err.message : String(err),
        });
      }
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
