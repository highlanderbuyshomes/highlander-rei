/** Keep multi-word cities intact and deduplicate case-insensitively. */
export function normalizeCities(values: string[]): string[] {
  return [...new Set(values.map((city) => city.trim().replace(/\s+/g, " ").toLowerCase()).filter(Boolean))];
}

export function parseCities(value: string): string[] {
  return normalizeCities(value.split(","));
}
