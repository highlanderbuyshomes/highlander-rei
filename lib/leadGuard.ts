import { NextRequest } from "next/server";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 8;
const MAX_TEXT_LENGTH = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const buckets = new Map<string, { count: number; resetAt: number }>();

export function validateLeadRequest(req: NextRequest, data: Record<string, unknown>) {
  const now = Date.now();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const bucket = buckets.get(ip);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    bucket.count += 1;
    if (bucket.count > MAX_REQUESTS) {
      return { ok: false, status: 429, message: "Too many submissions" };
    }
  }

  if (typeof data.website === "string" && data.website.trim()) {
    return { ok: false, status: 204, message: "Ignored" };
  }

  const email = typeof data.email === "string" ? data.email.trim() : "";
  if (!EMAIL_RE.test(email)) {
    return { ok: false, status: 400, message: "Invalid email" };
  }

  const tooLong = Object.values(data).some((value) => (
    typeof value === "string" && value.length > MAX_TEXT_LENGTH
  ));

  if (tooLong) {
    return { ok: false, status: 400, message: "Submission too large" };
  }

  return { ok: true };
}
