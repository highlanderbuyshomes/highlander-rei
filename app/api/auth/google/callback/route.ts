import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { allowedGoogleEmails, OAUTH_STATE_COOKIE, verifiedEmailFromCode } from "@/lib/google-auth";

const toLogin = (req: NextRequest, error: string) => NextResponse.redirect(new URL(`/admin/login?error=${error}`, req.url));

export async function GET(req: NextRequest) {
  const jar = await cookies();
  const expected = jar.get(OAUTH_STATE_COOKIE)?.value;
  jar.delete({ name: OAUTH_STATE_COOKIE, path: "/api/auth/google" });

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code || !state || !expected || state !== expected) return toLogin(req, "google-failed");

  let email: string;
  try {
    email = await verifiedEmailFromCode(code, new URL("/api/auth/google/callback", req.url).toString());
  } catch (err) {
    console.error("[auth/google] verification failed:", err);
    return toLogin(req, "google-failed");
  }
  if (!allowedGoogleEmails().has(email)) return toLogin(req, "google-denied");

  let user: { id: string; role: string };
  try {
    // First Google sign-in for an allowed email creates its admin account;
    // the random password hash means it can only be used through Google.
    user = await prisma.adminUser.upsert({
      where: { email },
      update: {},
      create: { email, name: email.split("@")[0], role: "admin", passwordHash: randomBytes(32).toString("hex") },
      select: { id: true, role: true },
    });
  } catch (err) {
    console.error("[auth/google] database error:", err);
    return toLogin(req, "server");
  }

  await createSession(user.id, user.role);
  return NextResponse.redirect(new URL(user.role === "admin" ? "/admin/search" : "/admin/dialer", req.url));
}
