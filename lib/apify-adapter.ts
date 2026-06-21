import { ApifyClient } from "apify-client";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { addressFingerprint } from "./address";

type Json = Prisma.InputJsonValue;

function getClient(): ApifyClient {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN environment variable is not set.");
  return new ApifyClient({ token });
}

export interface ApifyFieldMapping {
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  apn?: string;
  county?: string;
  subdivision?: string;
  propertyType?: string;
  beds?: string;
  baths?: string;
  sqft?: string;
  lotSqft?: string;
  yearBuilt?: string;
  estimatedValue?: string;
  lastSaleDate?: string;
  lastSalePrice?: string;
  latitude?: string;
  longitude?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  ownerFullName?: string;
  ownerMailingAddress?: string;
  ownerMailingCity?: string;
  ownerMailingState?: string;
  ownerMailingZip?: string;
  ownerOccupied?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  estimatedEquity?: string;
  estimatedEquityPct?: string;
}

export const DEFAULT_FIELD_MAPPING: ApifyFieldMapping = {
  streetAddress: "address",
  city: "city",
  state: "state",
  zip: "zip",
  propertyType: "propertyType",
  beds: "bedrooms",
  baths: "bathrooms",
  sqft: "livingAreaSf",
  lotSqft: "lotSizeSf",
  yearBuilt: "yearBuilt",
  estimatedValue: "estimatedValue",
  lastSaleDate: "lastSoldDate",
  lastSalePrice: "lastSoldPrice",
  latitude: "latitude",
  longitude: "longitude",
  ownerFullName: "ownerName",
  ownerMailingAddress: "ownerMailingAddress",
  ownerMailingCity: "ownerMailingCity",
  ownerMailingState: "ownerMailingState",
  ownerMailingZip: "ownerMailingZip",
  ownerOccupied: "ownerOccupied",
  estimatedEquity: "estimatedEquity",
  estimatedEquityPct: "estimatedEquityPercentage",
};

export const PROPWIRE_ACTOR_ID = "crawlerbros/propwire-leads-scraper";

function pluck(record: Record<string, unknown>, path: string): unknown {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return path.split(".").reduce<any>((obj, key) => {
    if (obj && typeof obj === "object" && key in obj) return obj[key];
    return undefined;
  }, record);
}

function toFloat(val: unknown): number | null {
  if (val == null) return null;
  const n = parseFloat(String(val));
  return isNaN(n) ? null : n;
}

function toInt(val: unknown): number | null {
  if (val == null) return null;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? null : n;
}

function toStr(val: unknown): string | null {
  if (val == null || val === "") return null;
  return String(val).trim();
}

function toBool(val: unknown): boolean | null {
  if (val == null) return null;
  if (typeof val === "boolean") return val;
  const s = String(val).toLowerCase().trim();
  if (["true", "yes", "1", "y"].includes(s)) return true;
  if (["false", "no", "0", "n"].includes(s)) return false;
  return null;
}

function toDate(val: unknown): Date | null {
  if (val == null) return null;
  const d = new Date(String(val));
  return isNaN(d.getTime()) ? null : d;
}

export interface ImportResult {
  importRunId: string;
  total: number;
  imported: number;
  duplicates: number;
  errors: number;
  errorMessages: string[];
}

export async function startApifyRun(
  actorId: string,
  input: Record<string, unknown>,
): Promise<{ importRunId: string; apifyRunId: string }> {
  const client = getClient();

  const importRun = await prisma.importRun.create({
    data: {
      source: "apify",
      actorId,
      status: "running",
      startedAt: new Date(),
      rawMeta: input as Json,
    },
  });

  const run = await client.actor(actorId).call(input);

  await prisma.importRun.update({
    where: { id: importRun.id },
    data: { runId: run.id },
  });

  return { importRunId: importRun.id, apifyRunId: run.id };
}

export async function pollApifyRun(apifyRunId: string): Promise<{
  status: string;
  finished: boolean;
}> {
  const client = getClient();
  const run = await client.run(apifyRunId).get();
  if (!run) return { status: "UNKNOWN", finished: true };

  const finished = ["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(run.status);
  return { status: run.status, finished };
}

export async function ingestApifyDataset(
  importRunId: string,
  apifyRunId: string,
  fieldMapping: ApifyFieldMapping = DEFAULT_FIELD_MAPPING,
): Promise<ImportResult> {
  const client = getClient();
  const run = await client.run(apifyRunId).get();
  if (!run) throw new Error(`Apify run ${apifyRunId} not found`);

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  let imported = 0;
  let duplicates = 0;
  let errors = 0;
  const errorMessages: string[] = [];

  for (const raw of items) {
    const record = raw as Record<string, unknown>;
    try {
      const street = toStr(pluck(record, fieldMapping.streetAddress));
      const city = toStr(pluck(record, fieldMapping.city));
      const state = toStr(pluck(record, fieldMapping.state)) ?? "AZ";
      const zip = toStr(pluck(record, fieldMapping.zip));

      if (!street || !city || !zip) {
        errors++;
        errorMessages.push(`Missing address fields: ${JSON.stringify({ street, city, zip })}`);
        continue;
      }

      const apn = fieldMapping.apn ? toStr(pluck(record, fieldMapping.apn)) : null;
      const fingerprint = addressFingerprint(street, city, state, zip);

      const existing = apn
        ? await prisma.property.findFirst({ where: { OR: [{ apn }, { addressFingerprint: fingerprint }] } })
        : await prisma.property.findFirst({ where: { addressFingerprint: fingerprint } });

      if (existing) {
        await prisma.property.update({
          where: { id: existing.id },
          data: {
            lastRefreshedAt: new Date(),
            rawJson: record as Json,
            ...(apn && !existing.apn ? { apn } : {}),
          },
        });
        duplicates++;
        continue;
      }

      const property = await prisma.property.create({
        data: {
          apn,
          addressFingerprint: fingerprint,
          streetAddress: street,
          city,
          state,
          zip,
          county: fieldMapping.county ? toStr(pluck(record, fieldMapping.county)) : null,
          subdivision: fieldMapping.subdivision ? toStr(pluck(record, fieldMapping.subdivision)) : null,
          propertyType: fieldMapping.propertyType ? toStr(pluck(record, fieldMapping.propertyType)) : null,
          beds: fieldMapping.beds ? toInt(pluck(record, fieldMapping.beds)) : null,
          baths: fieldMapping.baths ? toFloat(pluck(record, fieldMapping.baths)) : null,
          sqft: fieldMapping.sqft ? toInt(pluck(record, fieldMapping.sqft)) : null,
          lotSqft: fieldMapping.lotSqft ? toInt(pluck(record, fieldMapping.lotSqft)) : null,
          yearBuilt: fieldMapping.yearBuilt ? toInt(pluck(record, fieldMapping.yearBuilt)) : null,
          estimatedValue: fieldMapping.estimatedValue ? toFloat(pluck(record, fieldMapping.estimatedValue)) : null,
          lastSaleDate: fieldMapping.lastSaleDate ? toDate(pluck(record, fieldMapping.lastSaleDate)) : null,
          lastSalePrice: fieldMapping.lastSalePrice ? toFloat(pluck(record, fieldMapping.lastSalePrice)) : null,
          latitude: fieldMapping.latitude ? toFloat(pluck(record, fieldMapping.latitude)) : null,
          longitude: fieldMapping.longitude ? toFloat(pluck(record, fieldMapping.longitude)) : null,
          source: "apify",
          sourceId: apifyRunId,
          rawJson: record as Json,
          importRunId,
          lastRefreshedAt: new Date(),
        },
      });

      const ownerName = fieldMapping.ownerFullName ? toStr(pluck(record, fieldMapping.ownerFullName)) : null;
      const ownerFirst = fieldMapping.ownerFirstName ? toStr(pluck(record, fieldMapping.ownerFirstName)) : null;
      const ownerLast = fieldMapping.ownerLastName ? toStr(pluck(record, fieldMapping.ownerLastName)) : null;

      if (ownerName || ownerFirst || ownerLast) {
        await prisma.propertyOwner.create({
          data: {
            propertyId: property.id,
            fullName: ownerName,
            firstName: ownerFirst,
            lastName: ownerLast,
            mailingAddress: fieldMapping.ownerMailingAddress ? toStr(pluck(record, fieldMapping.ownerMailingAddress)) : null,
            mailingCity: fieldMapping.ownerMailingCity ? toStr(pluck(record, fieldMapping.ownerMailingCity)) : null,
            mailingState: fieldMapping.ownerMailingState ? toStr(pluck(record, fieldMapping.ownerMailingState)) : null,
            mailingZip: fieldMapping.ownerMailingZip ? toStr(pluck(record, fieldMapping.ownerMailingZip)) : null,
            ownerOccupied: fieldMapping.ownerOccupied ? toBool(pluck(record, fieldMapping.ownerOccupied)) : null,
            phone: fieldMapping.ownerPhone ? toStr(pluck(record, fieldMapping.ownerPhone)) : null,
            email: fieldMapping.ownerEmail ? toStr(pluck(record, fieldMapping.ownerEmail)) : null,
            estimatedEquity: fieldMapping.estimatedEquity ? toFloat(pluck(record, fieldMapping.estimatedEquity)) : null,
            estimatedEquityPct: fieldMapping.estimatedEquityPct ? toFloat(pluck(record, fieldMapping.estimatedEquityPct)) : null,
            rawJson: record as Json,
          },
        });
      }

      imported++;
    } catch (err) {
      errors++;
      errorMessages.push(err instanceof Error ? err.message : String(err));
    }
  }

  await prisma.importRun.update({
    where: { id: importRunId },
    data: {
      status: errors > 0 && imported === 0 ? "failed" : "completed",
      completedAt: new Date(),
      itemCount: items.length,
      rawMeta: {
        imported,
        duplicates,
        errors,
        errorMessages: errorMessages.slice(0, 50),
      } as Json,
    },
  });

  return { importRunId, total: items.length, imported, duplicates, errors, errorMessages };
}
