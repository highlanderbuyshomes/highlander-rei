import { createHash } from "crypto";

export function hashPassword(password: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be configured in production.");
  }
  const salt = secret ?? "local-development-password-salt";
  return createHash("sha256").update(password + salt).digest("hex");
}
