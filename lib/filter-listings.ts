import type { MlsListing, MlsListingStatus } from "./mock-listings";

export type DrawnShape =
  | { type: "rectangle"; bounds: { north: number; south: number; east: number; west: number } }
  | { type: "circle"; center: { lat: number; lng: number }; radiusMeters: number }
  | { type: "polygon"; path: { lat: number; lng: number }[] }
  | { type: "marker"; position: { lat: number; lng: number }; radiusMeters: number };

export type ListingFilters = {
  statuses?: MlsListingStatus[];
  priceMin?: number;
  priceMax?: number;
  bedsMin?: number;
  bathsMin?: number;
  propertyTypes?: string[];
  location?: string;
  sqftMin?: number;
  sqftMax?: number;
  lotSizeMin?: number;
  yearBuiltMin?: number;
  daysOnMarketMax?: number;
};

export function matchesFilters(listing: MlsListing, filters: ListingFilters): boolean {
  if (filters.statuses && filters.statuses.length > 0 && !filters.statuses.includes(listing.status)) return false;
  if (filters.priceMin != null && listing.listPrice < filters.priceMin) return false;
  if (filters.priceMax != null && listing.listPrice > filters.priceMax) return false;
  if (filters.bedsMin != null && listing.beds < filters.bedsMin) return false;
  if (filters.bathsMin != null && listing.baths < filters.bathsMin) return false;
  if (filters.propertyTypes && filters.propertyTypes.length > 0 && !filters.propertyTypes.includes(listing.propertyType)) return false;
  if (filters.location) {
    const needle = filters.location.trim().toLowerCase();
    if (needle && !listing.city.toLowerCase().includes(needle) && !listing.zip.includes(needle)) return false;
  }
  if (filters.sqftMin != null && listing.sqft < filters.sqftMin) return false;
  if (filters.sqftMax != null && listing.sqft > filters.sqftMax) return false;
  if (filters.lotSizeMin != null && listing.lotSizeSqft < filters.lotSizeMin) return false;
  if (filters.yearBuiltMin != null && listing.yearBuilt < filters.yearBuiltMin) return false;
  if (filters.daysOnMarketMax != null && listing.daysOnMarket > filters.daysOnMarketMax) return false;
  return true;
}

function pointInRectangle(lat: number, lng: number, bounds: { north: number; south: number; east: number; west: number }): boolean {
  return lat <= bounds.north && lat >= bounds.south && lng <= bounds.east && lng >= bounds.west;
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function pointInCircle(lat: number, lng: number, center: { lat: number; lng: number }, radiusMeters: number): boolean {
  return haversineMeters(lat, lng, center.lat, center.lng) <= radiusMeters;
}

function pointInPolygon(lat: number, lng: number, path: { lat: number; lng: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = path.length - 1; i < path.length; j = i++) {
    const xi = path[i].lng, yi = path[i].lat;
    const xj = path[j].lng, yj = path[j].lat;
    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isInsideShape(listing: MlsListing, shape: DrawnShape | null): boolean {
  if (!shape) return true;
  if (shape.type === "rectangle") return pointInRectangle(listing.lat, listing.lng, shape.bounds);
  if (shape.type === "circle") return pointInCircle(listing.lat, listing.lng, shape.center, shape.radiusMeters);
  if (shape.type === "marker") return pointInCircle(listing.lat, listing.lng, shape.position, shape.radiusMeters);
  return pointInPolygon(listing.lat, listing.lng, shape.path);
}

export function filterListings(listings: MlsListing[], filters: ListingFilters, shape: DrawnShape | null): MlsListing[] {
  return listings.filter((l) => matchesFilters(l, filters) && isInsideShape(l, shape));
}
