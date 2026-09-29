import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Passwords are stored as "scrypt$<salt>$<hash>" (per-user random salt).
// Older rows hold an unsalted SHA-256 of password + SESSION_SECRET; those
// still verify, and login rewrites them in the new format.

const PREFIX = "scrypt$";
const KEY_LENGTH = 64;

function legacyHash(password: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be configured in production.");
  }
  return createHash("sha256").update(password + (secret ?? "local-development-password-salt")).digest("hex");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LENGTH);
  return `${PREFIX}${salt.toString("base64")}$${hash.toString("base64")}`;
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

/** `needsRehash` is true when the stored hash is the legacy format. */
export function verifyPassword(password: string, stored: string): { ok: boolean; needsRehash: boolean } {
  if (stored.startsWith(PREFIX)) {
    const [salt, hash] = stored.slice(PREFIX.length).split("$");
    if (!salt || !hash) return { ok: false, needsRehash: false };
    const expected = Buffer.from(hash, "base64");
    return { ok: safeEqual(scryptSync(password, Buffer.from(salt, "base64"), expected.length), expected), needsRehash: false };
  }
  const ok = safeEqual(Buffer.from(legacyHash(password)), Buffer.from(stored));
  return { ok, needsRehash: ok };
}
