import { createHash } from "crypto";
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("hashes with a per-user salt and verifies", () => {
    const a = hashPassword("hunter2"), b = hashPassword("hunter2");
    expect(a).not.toBe(b);
    expect(a.startsWith("scrypt$")).toBe(true);
    expect(verifyPassword("hunter2", a)).toEqual({ ok: true, needsRehash: false });
    expect(verifyPassword("wrong", a).ok).toBe(false);
  });

  it("still accepts legacy SHA-256 hashes and asks for a rehash", () => {
    const legacy = createHash("sha256").update("hunter2" + "local-development-password-salt").digest("hex");
    expect(verifyPassword("hunter2", legacy)).toEqual({ ok: true, needsRehash: true });
    expect(verifyPassword("wrong", legacy)).toEqual({ ok: false, needsRehash: false });
  });

  it("rejects malformed and random stored values", () => {
    expect(verifyPassword("x", "scrypt$broken").ok).toBe(false);
    expect(verifyPassword("x", "a".repeat(64)).ok).toBe(false);
  });
});
