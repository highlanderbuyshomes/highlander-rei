export type MlsListingStatus = "Active" | "Coming Soon" | "Pending" | "Closed" | "Expired" | "Canceled";

export type MlsListing = {
  mlsNumber: string;
  streetAddress: string;
  city: string;
  zip: string;
  lat: number;
  lng: number;
  listPrice: number;
  beds: number;
  baths: number;
  sqft: number;
  lotSizeSqft: number;
  yearBuilt: number;
  propertyType: string;
  status: MlsListingStatus;
  listingAgentName: string;
  listingAgentPhone: string;
  photoUrl: string;
  daysOnMarket: number;
};

type Neighborhood = { city: string; zip: string; lat: number; lng: number };

const NEIGHBORHOODS: Neighborhood[] = [
  { city: "Phoenix", zip: "85018", lat: 33.5031, lng: -111.9853 },
  { city: "Phoenix", zip: "85008", lat: 33.4676, lng: -111.9903 },
  { city: "Scottsdale", zip: "85251", lat: 33.4942, lng: -111.9261 },
  { city: "Paradise Valley", zip: "85253", lat: 33.5312, lng: -111.9410 },
  { city: "Phoenix", zip: "85254", lat: 33.6142, lng: -112.0198 },
  { city: "Phoenix", zip: "85016", lat: 33.5122, lng: -112.0326 },
  { city: "Scottsdale", zip: "85255", lat: 33.6890, lng: -111.8873 },
  { city: "Scottsdale", zip: "85258", lat: 33.5631, lng: -111.9109 },
  { city: "Scottsdale", zip: "85255", lat: 33.6540, lng: -111.8990 },
];

const PROPERTY_TYPES = ["Single Family", "Condo", "Townhouse"];
const STATUSES: MlsListingStatus[] = ["Active", "Coming Soon", "Pending", "Closed", "Expired", "Canceled"];
const STREET_NAMES = ["E Camelback Rd", "N 44th St", "E Indian School Rd", "N Scottsdale Rd", "E Cactus Rd", "N 68th St", "E Thomas Rd", "N Hayden Rd", "E McDonald Dr", "N 56th St"];
const AGENTS = [
  { name: "Lynda Rahi", phone: "(623) 221-3402" },
  { name: "Marcus Ellery", phone: "(480) 555-0142" },
  { name: "Priya Nathan", phone: "(602) 555-0198" },
  { name: "Todd Weisz", phone: "(480) 555-0107" },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function buildListings(): MlsListing[] {
  const rand = seededRandom(42);
  const listings: MlsListing[] = [];
  let mlsCounter = 6400000;

  NEIGHBORHOODS.forEach((hood, hoodIndex) => {
    for (let i = 0; i < 4; i++) {
      const jitterLat = (rand() - 0.5) * 0.016;
      const jitterLng = (rand() - 0.5) * 0.016;
      const beds = 2 + Math.floor(rand() * 4);
      const baths = 1 + Math.floor(rand() * 3);
      const sqft = 1100 + Math.floor(rand() * 3200);
      const pricePerSqft = 260 + Math.floor(rand() * 220);
      listings.push({
        mlsNumber: String(mlsCounter++),
        streetAddress: `${1000 + Math.floor(rand() * 8000)} ${STREET_NAMES[(hoodIndex + i) % STREET_NAMES.length]}`,
        city: hood.city,
        zip: hood.zip,
        lat: hood.lat + jitterLat,
        lng: hood.lng + jitterLng,
        listPrice: sqft * pricePerSqft,
        beds,
        baths,
        sqft,
        lotSizeSqft: 4500 + Math.floor(rand() * 8000),
        yearBuilt: 1962 + Math.floor(rand() * 60),
        propertyType: PROPERTY_TYPES[Math.floor(rand() * PROPERTY_TYPES.length)],
        status: STATUSES[Math.floor(rand() * STATUSES.length)],
        listingAgentName: AGENTS[Math.floor(rand() * AGENTS.length)].name,
        listingAgentPhone: AGENTS[Math.floor(rand() * AGENTS.length)].phone,
        photoUrl: `https://placehold.co/400x300/e8e7e2/8a8a84?text=${encodeURIComponent(hood.zip)}`,
        daysOnMarket: Math.floor(rand() * 120),
      });
    }
  });

  return listings;
}

export const MOCK_LISTINGS: MlsListing[] = buildListings();
