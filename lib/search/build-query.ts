import { Prisma } from "@prisma/client";
import type { SearchFilters } from "./types";

const like = (s: string) => `%${s.replace(/[\\%_]/g, "\\$&")}%`;

export function buildWhere(f: SearchFilters): Prisma.Sql {
  const parts: Prisma.Sql[] = [];

  if (f.keyword?.trim()) {
    const k = like(f.keyword.trim());
    parts.push(Prisma.sql`(c.mls ILIKE ${k} OR c.address ILIKE ${k} OR c.city ILIKE ${k} OR c.zip ILIKE ${k})`);
  }
  if (f.statuses?.length) parts.push(Prisma.sql`c.status IN (${Prisma.join(f.statuses)})`);
  if (f.closedWithinMonths) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - f.closedWithinMonths);
    parts.push(Prisma.sql`(c.status <> 'Closed' OR c.closed >= ${cutoff})`);
  }
  if (f.priceMin != null) parts.push(Prisma.sql`COALESCE(c.price, 0) >= ${f.priceMin}`);
  if (f.priceMax != null) parts.push(Prisma.sql`c.price <= ${f.priceMax}`);
  if (f.dwellingTypes?.length) parts.push(Prisma.sql`c.dwelling IN (${Prisma.join(f.dwellingTypes)})`);
  if (f.bedsMin != null) parts.push(Prisma.sql`COALESCE(c.beds, 0) >= ${f.bedsMin}`);
  if (f.bathsMin != null) parts.push(Prisma.sql`COALESCE(c.baths, 0) >= ${f.bathsMin}`);
  if (f.sqftMin != null) parts.push(Prisma.sql`COALESCE(c.sqft, 0) >= ${f.sqftMin}`);
  if (f.sqftMax != null) parts.push(Prisma.sql`c.sqft <= ${f.sqftMax}`);
  if (f.lotMin != null) parts.push(Prisma.sql`COALESCE(c.lot, 0) >= ${f.lotMin}`);
  if (f.lotMax != null) parts.push(Prisma.sql`c.lot <= ${f.lotMax}`);
  if (f.pool === true) parts.push(Prisma.sql`c.pool IS TRUE`);
  if (f.pool === false) parts.push(Prisma.sql`c.pool IS FALSE`);
  if (f.levels === "3+") parts.push(Prisma.sql`COALESCE(c.levels, 0) >= 3`);
  else if (typeof f.levels === "number") parts.push(Prisma.sql`c.levels = ${f.levels}`);
  if (f.zips?.length) parts.push(Prisma.sql`c.zip IN (${Prisma.join(f.zips)})`);

  return parts.length ? Prisma.join(parts, " AND ") : Prisma.sql`TRUE`;
}
