/** Valley cities offered in the Deal Search city picker. */
export const VALLEY_CITIES = [
  "Apache Junction", "Avondale", "Buckeye", "Carefree", "Cave Creek", "Chandler", "El Mirage", "Fountain Hills",
  "Gila Bend", "Gilbert", "Glendale", "Goodyear", "Guadalupe", "Litchfield Park", "Mesa", "Paradise Valley",
  "Peoria", "Phoenix", "Queen Creek", "Scottsdale", "Sun City", "Sun City West", "Surprise", "Tempe",
  "Tolleson", "Wickenburg", "Youngtown",
];

/** Keep multi-word cities intact and deduplicate case-insensitively. */
export function normalizeCities(values: string[]): string[] {
  return [...new Set(values.map((city) => city.trim().replace(/\s+/g, " ").toLowerCase()).filter(Boolean))];
}

export function parseCities(value: string): string[] {
  return normalizeCities(value.split(","));
}
