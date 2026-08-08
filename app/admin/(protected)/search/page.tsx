import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import MlsSearchWorkspace, { type ListingRecord, type SavedSearchRecord } from "./MlsSearchWorkspace";

export const metadata: Metadata = { title: "Deal Search | Highlander REI" };

function jsonStrings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function rawValue(raw: unknown, keys: string[]) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function rawNumber(raw: unknown, keys: string[]) {
  const value = rawValue(raw, keys);
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function rawBoolean(raw: unknown, keys: string[]) {
  const value = rawValue(raw, keys);
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["yes", "y", "true", "1", "private"].includes(normalized)) return true;
    if (["no", "n", "false", "0", "none"].includes(normalized)) return false;
  }
  return null;
}

function rawString(raw: unknown, keys: string[]) {
  const value = rawValue(raw, keys);
  return typeof value === "string" ? value : null;
}

function rawLevels(raw: unknown) {
  const numeric = rawNumber(raw, ["Stories", "StoriesTotal", "NumberOfStories", "InteriorLevels"]);
  if (numeric != null) return numeric;
  const value = rawString(raw, ["Levels"]);
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized.includes("three")) return 3;
  if (normalized.includes("two")) return 2;
  if (normalized.includes("one") || normalized.includes("single")) return 1;
  return null;
}

export default async function SearchPage() {
  await requireAdmin();

  const [properties, searches] = await Promise.all([
    prisma.property.findMany({
      orderBy: { updatedAt: "desc" },
      take: 250,
      include: {
        owners: { take: 1, orderBy: { updatedAt: "desc" } },
        mlsListings: { take: 1, orderBy: { updatedAt: "desc" }, include: { agent: true } },
      },
    }),
    prisma.acquisitionArea.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        buyBoxes: { where: { active: true }, orderBy: [{ priority: "desc" }, { createdAt: "desc" }] },
        _count: { select: { buyBoxes: true } },
      },
    }),
  ]);

  const listings: ListingRecord[] = properties.map((property) => {
    const listing = property.mlsListings[0];
    const owner = property.owners[0];
    const source = listing?.rawJson ?? property.rawJson;
    const listPrice = listing?.listPrice ?? property.estimatedValue;

    return {
      id: property.id,
      mlsNumber: listing?.mlsNumber ?? `PR-${property.apn?.slice(-7) ?? property.id.slice(-7).toUpperCase()}`,
      status: listing?.mlsStatus ?? "Off Market",
      closedDate: (listing?.soldDate ?? property.lastSaleDate)?.toISOString() ?? null,
      listPrice,
      dom: listing?.dom ?? null,
      listDate: listing?.listDate?.toISOString() ?? null,
      address: property.streetAddress,
      city: property.city,
      state: property.state,
      zip: property.zip,
      subdivision: property.subdivision,
      dwellingType: property.propertyType ?? rawString(source, ["PropertySubType", "PropertyType", "DwellingType"]) ?? rawString(property.rawJson, ["PropertySubType", "PropertyType", "DwellingType"]) ?? "Single Family",
      beds: property.beds,
      baths: property.baths,
      sqft: property.sqft ?? rawNumber(source, ["LivingArea", "LivingAreaSqFt", "ApproxSQFT"]),
      lotSqft: property.lotSqft ?? rawNumber(source, ["LotSizeSquareFeet", "LotSqFt", "LotSize"]),
      pool: rawBoolean(source, ["PoolPrivateYN", "PrivatePoolYN", "PrivatePool", "HasPool", "pool"]) ?? rawBoolean(property.rawJson, ["PoolPrivateYN", "PrivatePoolYN", "PrivatePool", "HasPool", "pool"]),
      interiorLevels: rawLevels(source) ?? rawLevels(property.rawJson),
      yearBuilt: property.yearBuilt,
      latitude: property.latitude,
      longitude: property.longitude,
      ownerName: owner?.fullName ?? ([owner?.firstName, owner?.lastName].filter(Boolean).join(" ") || null),
      estimatedEquityPct: owner?.estimatedEquityPct ?? null,
      ownerOccupied: owner?.ownerOccupied ?? null,
      estimatedArv: property.estimatedValue,
      originalListPrice: rawNumber(source, ["OriginalListPrice", "OriginalPrice", "PreviousListPrice"]),
      remarks: rawString(source, ["PublicRemarks", "Remarks", "MarketingRemarks", "description"]) ?? rawString(property.rawJson, ["PublicRemarks", "Remarks", "MarketingRemarks", "description"]),
      source: listing?.source ?? property.source,
    };
  });

  const savedSearches: SavedSearchRecord[] = searches.map((search) => ({
    id: search.id,
    name: search.name,
    buyerContact: search.buyerContact,
    description: search.description,
    active: search.active,
    buyBoxCount: search._count.buyBoxes,
    polygon: search.polygon as SavedSearchRecord["polygon"],
    buyBoxes: search.buyBoxes.map((buyBox) => ({
      id: buyBox.id,
      name: buyBox.name,
      zips: jsonStrings(buyBox.zips),
      subdivisions: jsonStrings(buyBox.subdivisions),
      propertyTypes: jsonStrings(buyBox.propertyTypes),
      priceMin: buyBox.priceMin,
      priceMax: buyBox.priceMax,
      bedsMin: buyBox.bedsMin,
      bedsMax: buyBox.bedsMax,
      bathsMin: buyBox.bathsMin,
      bathsMax: buyBox.bathsMax,
      sqftMin: buyBox.sqftMin,
      sqftMax: buyBox.sqftMax,
      lotSqftMin: buyBox.lotSqftMin,
      lotSqftMax: buyBox.lotSqftMax,
      mlsStatuses: jsonStrings(buyBox.mlsStatuses),
      maxDom: buyBox.maxDom,
      buyerName: buyBox.buyerName,
      dispositionStrategy: buyBox.dispositionStrategy,
      priority: buyBox.priority,
    })),
  }));

  return <MlsSearchWorkspace listings={listings} savedSearches={savedSearches} />;
}
