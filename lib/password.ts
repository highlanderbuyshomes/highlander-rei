import { createHash } from "crypto";

export function hashPassword(password: string): string {
  const salt = process.env.SESSION_SECRET ?? "fallback-secret";
  return createHash("sha256").update(password + salt).digest("hex");
}
