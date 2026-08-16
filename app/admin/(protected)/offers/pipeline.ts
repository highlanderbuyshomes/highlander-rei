import type { Prisma } from "@prisma/client";

export type PipelineStage = "offer_made" | "accepted" | "signed" | "closed" | "referral";

export const VALID_STAGES: PipelineStage[] = ["offer_made", "accepted", "signed", "closed", "referral"];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  offer_made: "Offer Made",
  accepted: "Offer Accepted",
  signed: "Signed",
  closed: "Closed",
  referral: "Referral Network",
};

export function customObject(value: Prisma.JsonValue | null): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function deriveStage(
  status: string,
  closingDate: string | null,
  customFields: Record<string, unknown>,
  hasSigned: boolean
): PipelineStage {
  const stored = customFields.offerPipelineStage;
  if (typeof stored === "string" && VALID_STAGES.includes(stored as PipelineStage)) return stored as PipelineStage;
  if (status === "signed" || status === "completed") {
    if (closingDate) {
      const closing = new Date(`${closingDate}T23:59:59`);
      if (!Number.isNaN(closing.getTime()) && closing.getTime() < Date.now()) return "closed";
    }
    return "signed";
  }
  if (hasSigned) return "accepted";
  return "offer_made";
}

export function numericPrice(value: string | null): number {
  const parsed = Number((value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}
