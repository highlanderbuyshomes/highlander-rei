import { prisma } from "@/lib/prisma";
import { loadListingDetail } from "@/lib/search/run-search";

export type MlsOfferPrefill = {
  mlsNumber: string;
  propertyId: string;
  streetAddress: string;
  city: string;
  county: string;
  zip: string;
  listPrice: number | null;
  status: string | null;
  listAgent: string;
  listOffice: string;
  listAgentPhone: string;
  listAgentEmail: string;
  arv: number | null;
  arvRangePct: number | null;
  conservativeArv: number | null;
  asIs: number | null;
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** What an MLS offer can fill from the listing itself, plus the numbers to price it. */
export async function loadMlsOfferPrefill(mlsNumber: string): Promise<MlsOfferPrefill | null> {
  const listing = await prisma.mlsListing.findUnique({
    where: { mlsNumber },
    select: { mlsStatus: true, listPrice: true, rawJson: true, propertyId: true, agent: { select: { fullName: true, phone: true, email: true, brokerageName: true } }, property: { select: { streetAddress: true, city: true, county: true, zip: true } } },
  });
  if (!listing) return null;
  const raw = (listing.rawJson ?? {}) as Record<string, unknown>;
  const detail = await loadListingDetail(listing.propertyId, 70);
  return {
    mlsNumber,
    propertyId: listing.propertyId,
    streetAddress: listing.property.streetAddress,
    city: listing.property.city,
    county: listing.property.county ?? str(raw.CountyOrParish),
    zip: listing.property.zip,
    listPrice: listing.listPrice,
    status: listing.mlsStatus,
    listAgent: listing.agent?.fullName || str(raw.ListAgentFullName),
    listOffice: listing.agent?.brokerageName || str(raw.ListOfficeName),
    listAgentPhone: listing.agent?.phone || str(raw.ListAgentDirectPhone),
    listAgentEmail: listing.agent?.email || str(raw.ListAgentEmail),
    arv: detail?.arv ?? null,
    arvRangePct: detail?.arvRangePct ?? null,
    conservativeArv: detail?.conservativeArv ?? null,
    asIs: detail?.asIs?.value ?? null,
  };
}
